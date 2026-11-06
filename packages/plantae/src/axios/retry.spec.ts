import Axios, {
  type AxiosAdapter,
  AxiosError,
  AxiosHeaders,
  CanceledError,
} from "axios";
import { describe, expect, it, vi } from "vitest";

import type { Plugin } from "../types";
import createAxiosInterceptors from "./createAxiosInterceptors";

function setup(
  statuses: number[],
  sameClient: boolean,
  hook: NonNullable<NonNullable<Plugin["hooks"]>["afterResponse"]>,
) {
  let requestCount = 0;
  const adapter = vi.fn<Parameters<AxiosAdapter>, ReturnType<AxiosAdapter>>(
    async (config) => {
      const status = statuses[requestCount++];
      if (!status) throw new Error("Unexpected extra request");
      const response = {
        data: "result",
        status,
        statusText: "",
        headers: new AxiosHeaders({ "content-type": "text/plain" }),
        config,
      };
      if (config.validateStatus && !config.validateStatus(status)) {
        throw new AxiosError(
          `Request failed with status code ${status}`,
          AxiosError.ERR_BAD_REQUEST,
          config,
          undefined,
          response,
        );
      }
      return response;
    },
  );
  const client = Axios.create({ baseURL: "https://example.com", adapter });
  const beforeRequest = vi.fn((req: Request) => req);
  const afterResponse = vi.fn(hook);
  const { request, response } = createAxiosInterceptors({
    ...(sameClient ? { client } : {}),
    plugins: [{ name: "auth", hooks: { beforeRequest, afterResponse } }],
  });
  client.interceptors.request.use(request.onFulfilled, request.onRejected);
  client.interceptors.response.use(response.onFulfilled, response.onRejected);
  return { client, adapter, beforeRequest, afterResponse };
}

describe.each([false, true])(
  "Axios retry with same client: %s",
  (sameClient) => {
    it("returns a repeated 401 to the plugin so its retry error can escape", async () => {
      const retryError = new Error("RetryError");
      const { client, adapter, beforeRequest, afterResponse } = setup(
        [401, 200, 401],
        sameClient,
        async (_, req, retry) => {
          const refresh = await retry(
            new Request("https://example.com/refresh"),
          );
          req.headers.set("Authorization", `Bearer ${await refresh.text()}`);
          const response = await retry(req);
          if (response.status === 401) throw retryError;
          return response;
        },
      );
      await expect(client.get("/")).rejects.toBe(retryError);
      expect(adapter).toHaveBeenCalledTimes(3);
      expect(adapter.mock.calls.map(([config]) => config.url)).toEqual([
        "https://example.com/",
        "https://example.com/refresh",
        "https://example.com/",
      ]);
      expect(adapter.mock.calls[2][0].headers.get("Authorization")).toBe(
        "Bearer result",
      );
      expect(beforeRequest).toHaveBeenCalledTimes(1);
      expect(afterResponse).toHaveBeenCalledTimes(1);
    });

    it("returns a successful retry without running hooks twice", async () => {
      const { client, adapter, afterResponse } = setup(
        [401, 200],
        sameClient,
        (_, req, retry) => retry(req),
      );
      await expect(client.get("/")).resolves.toMatchObject({ status: 200 });
      expect(adapter).toHaveBeenCalledTimes(2);
      expect(afterResponse).toHaveBeenCalledTimes(1);
    });

    it("applies the original validator to the final retry response", async () => {
      const { client, adapter } = setup(
        [401, 401],
        sameClient,
        (_, req, retry) => retry(req),
      );
      await expect(client.get("/")).rejects.toMatchObject({
        response: { status: 401 },
        isAxiosError: true,
      });
      expect(adapter).toHaveBeenCalledTimes(2);
    });

    it("respects custom validation even when the initial response was fulfilled", async () => {
      const validateStatus = (status: number) => status === 401;
      const { client } = setup([401, 500], sameClient, (_, req, retry) =>
        retry(req),
      );
      await expect(client.get("/", { validateStatus })).rejects.toMatchObject({
        response: { status: 500 },
        config: { validateStatus },
      });
    });

    it("keeps concurrent request retry state isolated", async () => {
      const { client, adapter, afterResponse } = setup(
        [401, 401, 200, 200],
        sameClient,
        (_, req, retry) => retry(req),
      );
      const responses = await Promise.all([client.get("/a"), client.get("/b")]);
      expect(responses.map((res) => res.status)).toEqual([200, 200]);
      expect(adapter).toHaveBeenCalledTimes(4);
      expect(afterResponse).toHaveBeenCalledTimes(2);
    });

    it("restores public config after retry so it can be reused", async () => {
      const { client, afterResponse } = setup(
        [401, 200, 401, 200],
        sameClient,
        (_, req, retry) => retry(req),
      );
      const response = await client.get("/");
      expect(response.config).not.toHaveProperty("__plantaeRetry");
      await expect(client.request(response.config)).resolves.toMatchObject({
        status: 200,
      });
      expect(afterResponse).toHaveBeenCalledTimes(2);
    });

    it("preserves cancellation and restores the error config", async () => {
      const { client, adapter } = setup([401], sameClient, (_, req, retry) =>
        retry(req),
      );
      const initial = adapter.getMockImplementation()!;
      adapter
        .mockImplementationOnce(initial)
        .mockImplementationOnce(async (config) => {
          const error = new CanceledError("canceled");
          error.config = config;
          throw error;
        });
      const error = await client.get("/").catch((error) => error);
      expect(Axios.isCancel(error)).toBe(true);
      expect(error.config.validateStatus).toBe(client.defaults.validateStatus);
      expect(error.config).not.toHaveProperty("__plantaeRetry");
    });

    it("preserves a retry transport error", async () => {
      const error = new AxiosError("Network Error", AxiosError.ERR_NETWORK);
      const { client, adapter } = setup([401], sameClient, (_, req, retry) =>
        retry(req),
      );
      const initial = adapter.getMockImplementation()!;
      adapter.mockImplementationOnce(initial).mockRejectedValueOnce(error);
      await expect(client.get("/")).rejects.toBe(error);
    });
  },
);

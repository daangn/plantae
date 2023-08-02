import type { AxiosInstance, AxiosResponseHeaders } from "axios";
import type ky from "ky";
import { describe, expect, test } from "vitest";

import createMiddleware from "./createMiddleware";

describe("createMiddleware -", () => {
  test("ky", async () => {
    const initialRequest = new Request("https://example.com", {});
    const initialResponse = new Response("hello world", {});

    const { requestMiddleware, responseMiddleware } = createMiddleware<
      typeof ky
    >({
      convertToAdapterRequest: (req) => {
        return {
          body: req.body,
          headers: new Headers({
            ...req.headers,
            foo: "hihigh", // MEMO: 이건 extendClientRequest에 덮어쓰여짐
          }),
          method: req.method,
          url: req.url,
          signal: req.signal,
        };
      },
      convertToAdapterResponse: (res) => ({
        body: res.body,
        headers: res.headers,
        url: res.url,
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
      }),
      extendClientRequest: () => {
        return new Request("https://example2.com", {
          headers: new Headers({
            foo: "bar",
          }),
        });
      },
      extendClientResponse: () => {
        return new Response("hello plantae", {
          headers: new Headers({
            baz: "qux",
          }),
        });
      },
      plugins: [],
      retry: () => Promise.resolve(new Response()),
    });

    const request = await requestMiddleware(initialRequest);
    const response = await responseMiddleware(initialResponse, request);

    expect(request.url).toBe("https://example2.com/");
    expect(request.headers.get("foo")).toBe("bar");

    expect(response.headers.get("baz")).toBe("qux");
    expect(await response.text()).toBe("hello plantae");
  });

  test("axios", async () => {
    const initialRequest = new Request("https://example.com", {});
    const initialResponse = new Response("hello world", {});

    const { requestMiddleware, responseMiddleware } =
      createMiddleware<AxiosInstance>({
        convertToAdapterRequest: (req) => {
          return {
            body: req.data,
            headers: new Headers(req.headers.toJSON(true) as HeadersInit),
            method: req.method!,
            url: req.url!,
            signal: req.signal as AbortSignal,
          };
        },
        convertToAdapterResponse: (res) => ({
          body: res.data,
          headers: new Headers(
            (res.headers as AxiosResponseHeaders).toJSON(true) as HeadersInit
          ),
          url: res.url!,
          ok: res.ok!,
          status: res.status,
          statusText: res.statusText,
        }),
        extendClientRequest: () => {
          return new Request("https://example2.com", {
            headers: new Headers({
              foo: "bar",
            }),
          });
        },
        extendClientResponse: () => {
          return new Response("hello plantae", {
            headers: new Headers({
              baz: "qux",
            }),
          });
        },
        plugins: [],
        retry: () => Promise.resolve(new Response()),
      });

    const request = await requestMiddleware(initialRequest);
    const response = await responseMiddleware(initialResponse, request);

    expect(request.url).toBe("https://example2.com/");
    expect(request.headers.get("foo")).toBe("bar");

    expect(response.headers.get("baz")).toBe("qux");
    expect(await response.text()).toBe("hello plantae");
  });
});

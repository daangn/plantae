import type { AxiosHeaders } from "axios";
import axios from "axios";
import { describe, expect, it, test } from "vitest";

import {
  abortSignalPlugin,
  afterResponsePlugin,
  beforeRequestPlugin,
  firstPlugin,
  headerSetPlugin,
  headerSetRequestReseponsePlugin,
  modifiedHeaderResponsePlugin,
  modifiedResponseBodyPlugin,
  modifyUrlPlugin,
  postMethodPlugin,
  postMethodWithBodyPlugin,
  retryPlugin,
  secondPlugin,
} from "../__mock__/plugin";
import createAxiosInterceptors from "./createAxiosInterceptors";

const BASE_URL = "https://example.com";

describe("axios:beforeRequest -", () => {
  test("headers", async () => {
    const axiosInstance = axios.create({
      baseURL: BASE_URL,
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [headerSetPlugin()],
    });

    axiosInstance.interceptors.request.use(axiosMiddleware.request);

    const res = await axiosInstance.get("/api/v1/foo");
    expect(res.data).toStrictEqual("request plugin is activated");
  });

  test("method", async () => {
    const axiosInstance = axios.create({
      baseURL: BASE_URL,
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [postMethodPlugin()],
    });

    axiosInstance.interceptors.request.use(axiosMiddleware.request);

    const res = await axiosInstance.get("/api/v1/foo");
    expect(res.data).toEqual("post request is completed");
  });

  // https://github.com/capricorn86/happy-dom/issues/1016
  test("body", async () => {
    const axiosInstance = axios.create({
      baseURL: BASE_URL,
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [postMethodWithBodyPlugin()],
    });

    axiosInstance.interceptors.request.use(axiosMiddleware.request);

    const res = await axiosInstance.post("/api/v1/bar", { hello: "world" });
    expect(res.data).toStrictEqual({ foo: "bar" });
  });

  test("url", async () => {
    const axiosInstance = axios.create({
      baseURL: BASE_URL,
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [modifyUrlPlugin()],
    });

    axiosInstance.interceptors.request.use(axiosMiddleware.request);

    const res = await axiosInstance.get("/api/v1/foo");
    expect(res.data).toEqual("url is modified");
  });

  test("signal", async () => {
    const axiosInstance = axios.create({
      baseURL: BASE_URL,
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [abortSignalPlugin()],
    });

    axiosInstance.interceptors.request.use(axiosMiddleware.request);

    await expect(axiosInstance.get("/api/v1/delayed")).rejects.toThrow();
  });
});

describe("axios:afterResponse -", () => {
  test("headers", async () => {
    const axiosInstance = axios.create({
      baseURL: "https://example.com",
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [modifiedHeaderResponsePlugin()],
    });

    axiosInstance.interceptors.response.use(axiosMiddleware.response);
    const res = await axiosInstance.get("/api/v1/foo");
    const customHeader = (res.headers as AxiosHeaders)["x-foo"];

    if (!customHeader) {
      throw new Error("custom header not found");
    }

    expect(customHeader).toStrictEqual("bar");
  });

  test("body", async () => {
    const axiosInstance = axios.create({
      baseURL: "https://example.com",
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [modifiedResponseBodyPlugin()],
    });

    axiosInstance.interceptors.response.use(axiosMiddleware.response);
    const res = await axiosInstance.get("/api/v1/foo");

    expect(res.data).toBe("baz");
  });

  test("overriden plugin", async () => {
    const axiosInstance = axios.create({
      baseURL: "https://example.com",
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [firstPlugin()],
    });

    axiosInstance.interceptors.response.use(axiosMiddleware.response);

    const overridenAxiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [secondPlugin()],
    });

    axiosInstance.interceptors.response.use(overridenAxiosMiddleware.response);

    const res = await axiosInstance.get("/api/v1/foo");

    expect(res.headers["x-first"]).toBe("foo");
    expect(res.headers["x-second"]).toBe("bar");
    expect(res.data).toBe("second");
  });

  test("multiple plugins", async () => {
    const axiosInstance = axios.create({
      baseURL: "https://example.com",
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [firstPlugin(), secondPlugin()],
    });

    axiosInstance.interceptors.response.use(axiosMiddleware.response);
    const res = await axiosInstance.get("/api/v1/foo");

    expect(res.headers["x-first"]).toBe("foo");
    expect(res.headers["x-second"]).toBe("bar");
    expect(res.data).toBe("second");
  });
});

describe("axios:beforeRequest+afterResponse -", () => {
  test("declare beforeRequest and afterResponse currently", async () => {
    const axiosInstance = axios.create({
      baseURL: "https://example.com",
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [headerSetRequestReseponsePlugin()],
    });

    axiosInstance.interceptors.request.use(axiosMiddleware.request);
    axiosInstance.interceptors.response.use(axiosMiddleware.response);
    const res = await axiosInstance.get("/api/v1/foo");

    expect(res.headers["x-request-plugin"]).toBe("succeed");
  });

  test("declare beforeRequest and afterResponse sequentially", async () => {
    const axiosInstance = axios.create({
      baseURL: "https://example.com",
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [beforeRequestPlugin(), afterResponsePlugin()],
    });

    axiosInstance.interceptors.request.use(axiosMiddleware.request);
    axiosInstance.interceptors.response.use(axiosMiddleware.response);
    const res = await axiosInstance.get("/api/v1/foo");

    expect(res.headers["x-request-plugin"]).toBe("succeed");
  });

  test("declare beforeRequest and afterResponse in reverse order", async () => {
    const axiosInstance = axios.create({
      baseURL: "https://example.com",
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [afterResponsePlugin(), beforeRequestPlugin()],
    });

    axiosInstance.interceptors.request.use(axiosMiddleware.request);
    axiosInstance.interceptors.response.use(axiosMiddleware.response);
    const res = await axiosInstance.get("/api/v1/foo");

    expect(res.headers["x-request-plugin"]).toBe("succeed");
  });

  test("use requestMiddleware and responseMiddleware individually", async () => {
    const axiosInstance = axios.create({
      baseURL: "https://example.com",
    });

    const requestMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [beforeRequestPlugin()],
    });
    const responseMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [afterResponsePlugin()],
    });

    axiosInstance.interceptors.request.use(requestMiddleware.request);
    axiosInstance.interceptors.response.use(responseMiddleware.response);
    const res = await axiosInstance.get("/api/v1/foo");

    expect(res.headers["x-request-plugin"]).toBe("succeed");
  });
});

describe("retry plugin", () => {
  it("should retry", async () => {
    const axiosInstance = axios.create({
      baseURL: "https://example.com",
    });

    const { request, response } = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [retryPlugin()],
    });

    axiosInstance.interceptors.request.use(request);
    axiosInstance.interceptors.response.use(response);

    const res = await axiosInstance.get("/header/x-retry");

    expect(res.data).toHaveLength(1);
  });
});

import type { AxiosHeaders } from "axios";
import axios from "axios";
import { describe, expect, test } from "vitest";

import type { Plugin } from "../types";
import createAxiosInterceptors from "./createAxiosInterceptors";

const BASE_URL = "https://example.com";

describe("axios:beforeRequest -", () => {
  test("headers", async () => {
    const axiosInstance = axios.create({
      baseURL: BASE_URL,
    });

    const myPlugin = (): Plugin => ({
      name: "myPlugin",
      hooks: {
        beforeRequest: async (req) => {
          req.headers.set("x-request-plugin", "activate");
          return req;
        },
      },
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [myPlugin()],
    });

    axiosInstance.interceptors.request.use(axiosMiddleware.request);

    const res = await axiosInstance.get("/api/v1/foo");
    expect(res.data).toStrictEqual("request plugin is activated");
  });

  test("method", async () => {
    const axiosInstance = axios.create({
      baseURL: BASE_URL,
    });

    const myPlugin = (): Plugin => ({
      name: "myPlugin",
      hooks: {
        beforeRequest: async (req) => {
          return new Request(BASE_URL + req.url, {
            ...req,
            method: "POST",
          });
        },
      },
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [myPlugin()],
    });

    axiosInstance.interceptors.request.use(axiosMiddleware.request);

    const res = await axiosInstance.get("/api/v1/foo");
    expect(res.data).toEqual("post request is completed");
  });

  test("body", async () => {
    const axiosInstance = axios.create({
      baseURL: BASE_URL,
    });

    const myPlugin = (): Plugin => ({
      name: "myPlugin",
      hooks: {
        beforeRequest: async (req) => {
          return new Request(BASE_URL + req.url, {
            ...req,
            body: JSON.stringify({ foo: "bar" }),
          });
        },
      },
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [myPlugin()],
    });

    axiosInstance.interceptors.request.use(axiosMiddleware.request);

    const res = await axiosInstance.post("/api/v1/bar");
    expect(res.data).toStrictEqual({ foo: "bar" });
  });

  test("url", async () => {
    const axiosInstance = axios.create({
      baseURL: BASE_URL,
    });

    const myPlugin = (): Plugin => ({
      name: "myPlugin",
      hooks: {
        beforeRequest: async (req) => {
          return new Request("https://example-second.com" + req.url, req);
        },
      },
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [myPlugin()],
    });

    axiosInstance.interceptors.request.use(axiosMiddleware.request);

    const res = await axiosInstance.get("/api/v1/foo");
    expect(res.data).toEqual("url is modified");
  });

  test("signal", async () => {
    const axiosInstance = axios.create({
      baseURL: BASE_URL,
    });

    const myPlugin = (): Plugin => ({
      name: "myPlugin",
      hooks: {
        beforeRequest: async (req) => {
          const controller = new AbortController();
          setTimeout(() => {
            controller.abort();
          }, 1000);
          return {
            ...req,
            signal: controller.signal,
          };
        },
      },
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [myPlugin()],
    });

    axiosInstance.interceptors.request.use(axiosMiddleware.request);

    await expect(axiosInstance.get("/api/v1/delayed")).rejects.toThrow();
  });
});

describe.skip("axios:afterResponse -", () => {
  test("headers", async () => {
    const axiosInstance = axios.create({
      baseURL: "https://example.com",
    });

    const myPlugin = (): Plugin => ({
      name: "myPlugin",
      hooks: {
        afterResponse: async (res) => {
          res.headers.set("x-foo", "bar");
          return res;
        },
      },
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [myPlugin()],
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

    const myPlugin = (): Plugin => ({
      name: "myPlugin",
      hooks: {
        afterResponse: async (res) => {
          res.body = "baz";
          return res;
        },
      },
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [myPlugin()],
    });

    axiosInstance.interceptors.response.use(axiosMiddleware.response);
    const res = await axiosInstance.get("/api/v1/foo");

    expect(res.data).toBe("baz");
  });

  test("overriden plugin", async () => {
    const axiosInstance = axios.create({
      baseURL: "https://example.com",
    });

    const myPlugin = (): Plugin => ({
      name: "myPlugin",
      hooks: {
        afterResponse: async (res) => {
          res.body = "first";
          res.headers.set("x-first", "foo");
          return res;
        },
      },
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [myPlugin()],
    });

    axiosInstance.interceptors.response.use(axiosMiddleware.response);
    const overridenPlugin = (): Plugin => ({
      name: "overridenPlugin",
      hooks: {
        afterResponse: async (res) => {
          res.body = "second";
          res.headers.set("x-second", "bar");
          return res;
        },
      },
    });

    const overridenAxiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [overridenPlugin()],
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

    const myPlugin = (): Plugin => ({
      name: "myPlugin",
      hooks: {
        afterResponse: async (res) => {
          res.body = "first";
          res.headers.set("x-first", "foo");
          return res;
        },
      },
    });

    const secondPlugin = (): Plugin => ({
      name: "secondPlugin",
      hooks: {
        afterResponse: async (res) => {
          res.body = "second";
          res.headers.set("x-second", "bar");
          return res;
        },
      },
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [myPlugin(), secondPlugin()],
    });

    axiosInstance.interceptors.response.use(axiosMiddleware.response);
    const res = await axiosInstance.get("/api/v1/foo");

    expect(res.headers["x-first"]).toBe("foo");
    expect(res.headers["x-second"]).toBe("bar");
    expect(res.data).toBe("second");
  });
});

describe.skip("axios:beforeRequest+afterResponse -", () => {
  test("declare beforeRequest and afterResponse currently", async () => {
    const axiosInstance = axios.create({
      baseURL: "https://example.com",
    });

    const myPlugin = (): Plugin => ({
      name: "myPlugin",
      hooks: {
        beforeRequest: async (req) => {
          req.headers.set("x-request-plugin", "activate");
          return req;
        },
        afterResponse: async (res) => {
          console.log("res: ", res);
          if (res.body === "request plugin is activated") {
            res.headers.set("x-request-plugin", "succeed");
            return res;
          }
          res.headers.set("x-request-plugin", "failed");
          return res;
        },
      },
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [myPlugin()],
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

    const beforeRequestPlugin = (): Plugin => ({
      name: "beforeRequestPlugin",
      hooks: {
        beforeRequest: async (req) => {
          req.headers.set("x-request-plugin", "activate");
          return req;
        },
      },
    });
    const afterResponsePlugin = (): Plugin => ({
      name: "afterResponsePlugin",
      hooks: {
        afterResponse: async (res) => {
          if (res.body === "request plugin is activated") {
            res.headers.set("x-request-plugin", "succeed");
            return res;
          }
          res.headers.set("x-request-plugin", "failed");
          return res;
        },
      },
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

    const beforeRequestPlugin = (): Plugin => ({
      name: "beforeRequestPlugin",
      hooks: {
        beforeRequest: async (req) => {
          req.headers.set("x-request-plugin", "activate");
          return req;
        },
      },
    });
    const afterResponsePlugin = (): Plugin => ({
      name: "afterResponsePlugin",
      hooks: {
        afterResponse: async (res) => {
          if (res.body === "request plugin is activated") {
            res.headers.set("x-request-plugin", "succeed");
            return res;
          }
          res.headers.set("x-request-plugin", "failed");
          return res;
        },
      },
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

    const beforeRequestPlugin = (): Plugin => ({
      name: "beforeRequestPlugin",
      hooks: {
        beforeRequest: async (req) => {
          req.headers.set("x-request-plugin", "activate");
          return req;
        },
      },
    });
    const afterResponsePlugin = (): Plugin => ({
      name: "afterResponsePlugin",
      hooks: {
        afterResponse: async (res) => {
          if (res.body === "request plugin is activated") {
            res.headers.set("x-request-plugin", "succeed");
            return res;
          }
          res.headers.set("x-request-plugin", "failed");
          return res;
        },
      },
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

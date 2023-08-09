import type { AxiosHeaders } from "axios";
import axios from "axios";
import { describe, expect, test } from "vitest";

import type { Plugin } from "../types";
import createAxiosInterceptors from "./createAxiosInterceptors";

describe("axios:beforeRequest -", () => {
  test("headers", async () => {
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
});

describe("axios:afterResponse -", () => {
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
        afterResponse: async () => {
          return new Response("baz");
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
          res.headers.set("x-first", "foo");

          return new Response("first", {
            headers: res.headers,
          });
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
          res.headers.set("x-second", "bar");

          return new Response("second", {
            headers: res.headers,
          });
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
          res.headers.set("x-first", "foo");

          return new Response("first", {
            headers: res.headers,
          });
        },
      },
    });

    const secondPlugin = (): Plugin => ({
      name: "secondPlugin",
      hooks: {
        afterResponse: async (res) => {
          res.headers.set("x-second", "bar");

          return new Response("second", {
            headers: res.headers,
          });
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

describe("axios:beforeRequest+afterResponse -", () => {
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
          if ((await res.text()) === "request plugin is activated") {
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
          if ((await res.text()) === "request plugin is activated") {
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
          if ((await res.text()) === "request plugin is activated") {
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
          if ((await res.text()) === "request plugin is activated") {
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

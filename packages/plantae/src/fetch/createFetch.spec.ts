import { describe, expect, test } from "vitest";

import type { Plugin } from "../types";
import createFetch from "./createFetch";

const BASE_URL = "https://example.com";

describe.only("fetch:beforeRequest -", () => {
  test("headers", async () => {
    const myPlugin = (): Plugin => ({
      name: "myPlugin",
      hooks: {
        beforeRequest: async (req) => {
          req.headers.set("x-request-plugin", "activate");
          return req;
        },
      },
    });

    const createdFetch = createFetch({
      client: fetch,
      plugins: [myPlugin()],
    });

    const res = createdFetch("https://example.com/api/v1/foo", {
      method: "GET",
    });
    const result = await res.json();

    expect(result).toStrictEqual("request plugin is activated");
  });

  test("method", async () => {
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

    const createdFetch = createFetch({
      client: fetch,
      plugins: [myPlugin()],
    });

    const res = createdFetch("https://example.com/api/v1/foo", {
      method: "GET",
    });
    const result = await res.json();

    expect(result).toEqual("post request is completed");
  });

  test("body", async () => {
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

    const createdFetch = createFetch({
      client: fetch,
      plugins: [myPlugin()],
    });

    const res = createdFetch("https://example.com/api/v1/bar", {
      method: "POST",
    });
    const result = await res.json();

    expect(result).toStrictEqual({ foo: "bar" });
  });

  test("url", async () => {
    const myPlugin = (): Plugin => ({
      name: "myPlugin",
      hooks: {
        beforeRequest: async (req) => {
          return new Request("https://example-second.com" + req.url, req);
        },
      },
    });

    const createdFetch = createFetch({
      client: fetch,
      plugins: [myPlugin()],
    });

    const res = createdFetch("https://example.com/api/v1/foo", {
      method: "GET",
    });
    const result = await res.json();

    expect(result).toEqual("url is modified");
  });

  test("signal", async () => {
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

    const createdFetch = createFetch({
      client: fetch,
      plugins: [myPlugin()],
    });

    await expect(
      createdFetch("https://example.com/api/v1/delayed", {
        method: "GET",
      })
    ).rejects.toThrow();
  });
});

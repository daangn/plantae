import ky from "ky";
import { describe, expect, test } from "vitest";

import type { Plugin } from "../types";
import createKyHooks from "./createKyHooks";

const BASE_URL = "https://example.com";

describe("ky:beforeRequest -", () => {
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

    const hooks = createKyHooks({
      client: ky,
      plugins: [myPlugin()],
    });

    const kyWithHoks = ky.extend({
      hooks,
    });

    const result = await kyWithHoks
      .get("https://example.com/api/v1/foo")
      .text();

    expect(result).toStrictEqual("request plugin is activated");
  });

  test("method", async () => {
    const myPlugin = (): Plugin => ({
      name: "myPlugin",
      hooks: {
        beforeRequest: async (req) => {
          return new Request(req.url, {
            ...req,
            method: "POST",
          });
        },
      },
    });

    const hooks = createKyHooks({
      client: ky,
      plugins: [myPlugin()],
    });

    const kyWithHoks = ky.extend({
      hooks,
    });

    const result = await kyWithHoks
      .get("https://example.com/api/v1/foo")
      .text();

    expect(result).toEqual("post request is completed");
  });

  test.skip("body", async () => {
    const myPlugin = (): Plugin => ({
      name: "myPlugin",
      hooks: {
        beforeRequest: async (req) => {
          return new Request(req.url, {
            ...req,
            body: JSON.stringify({ foo: "bar" }),
          });
        },
      },
    });

    const hooks = createKyHooks({
      client: ky,
      plugins: [myPlugin()],
    });

    const kyWithHoks = ky.extend({
      hooks,
    });

    const result = await kyWithHoks
      .post("https://example.com/api/v1/bar")
      .json();

    expect(result).toStrictEqual({ foo: "bar" });
  });

  test("url", async () => {
    const myPlugin = (): Plugin => ({
      name: "myPlugin",
      hooks: {
        beforeRequest: async (req) => {
          const url = new URL(req.url);

          return new Request("https://example-second.com" + url.pathname, req);
        },
      },
    });

    const hooks = createKyHooks({
      client: ky,
      plugins: [myPlugin()],
    });

    const kyWithHoks = ky.extend({
      hooks,
    });

    const result = await kyWithHoks
      .get("https://example.com/api/v1/foo")
      .text();

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
          return new Request(req.url, {
            signal: controller.signal,
          });
        },
      },
    });

    const hooks = createKyHooks({
      client: ky,
      plugins: [myPlugin()],
    });

    const kyWithHoks = ky.extend({
      hooks,
    });

    await expect(
      kyWithHoks.get("https://example.com/api/v1/delayed")
    ).rejects.toThrow();
  });
});

import ky from "ky";
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
import createKyHooks from "./createKyHooks";

describe("ky:beforeRequest -", () => {
  test("headers", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [headerSetPlugin()],
    });

    const kyWithHooks = ky.extend({
      hooks,
    });

    const result = await kyWithHooks
      .get("https://example.com/api/v1/foo")
      .text();

    expect(result).toStrictEqual("request plugin is activated");
  });

  test("method", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [postMethodPlugin()],
    });

    const kyWithHooks = ky.extend({
      hooks,
    });

    const result = await kyWithHooks
      .get("https://example.com/api/v1/foo")
      .text();

    expect(result).toEqual("post request is completed");
  });

  test("body", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [postMethodWithBodyPlugin()],
    });

    const kyWithHooks = ky.extend({
      hooks,
    });

    const result = await kyWithHooks
      .post("https://example.com/api/v1/bar")
      .json();

    expect(result).toStrictEqual({ foo: "bar" });
  });

  test("url", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [modifyUrlPlugin()],
    });

    const kyWithHooks = ky.extend({
      hooks,
    });

    const result = await kyWithHooks
      .get("https://example.com/api/v1/foo")
      .text();

    expect(result).toEqual("url is modified");
  });

  test.skip("signal", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [abortSignalPlugin()],
    });

    const kyWithHooks = ky.extend({
      hooks,
    });

    await expect(
      kyWithHooks.get("https://example.com/api/v1/delayed")
    ).rejects.toThrow();
  });
});

describe("ky:afterResponse -", () => {
  test("headers", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [modifiedHeaderResponsePlugin()],
    });

    const kyWithHooks = ky.extend({
      hooks,
    });

    const res = await kyWithHooks.get("https://example.com/api/v1/foo");

    expect(res.headers.get("x-foo")).toStrictEqual("bar");
  });

  test("body", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [modifiedResponseBodyPlugin()],
    });

    const kyWithHooks = ky.extend({
      hooks,
    });

    const result = await kyWithHooks
      .get("https://example.com/api/v1/foo")
      .text();

    expect(result).toStrictEqual("baz");
  });

  test("overriden plugin", async () => {
    const firstHooks = createKyHooks({
      client: ky,
      plugins: [firstPlugin()],
    });

    const firstKyWithHooks = ky.extend({
      hooks: firstHooks,
    });

    const secondHooks = createKyHooks({
      client: firstKyWithHooks,
      plugins: [secondPlugin()],
    });

    const secondKyWithHooks = firstKyWithHooks.extend({
      hooks: secondHooks,
    });

    const res = await secondKyWithHooks.get("https://example.com/api/v1/foo");

    expect(res.headers.get("x-first")).toBe("foo");
    expect(res.headers.get("x-second")).toBe("bar");

    const result = await res.text();
    expect(result).toBe("second");
  });

  test("multiple plugins", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [firstPlugin(), secondPlugin()],
    });

    const kyWithHooks = ky.extend({
      hooks,
    });

    const res = await kyWithHooks.get("https://example.com/api/v1/foo");

    expect(res.headers.get("x-first")).toBe("foo");
    expect(res.headers.get("x-second")).toBe("bar");

    const result = await res.text();
    expect(result).toBe("second");
  });
});

describe("ky:beforeRequest+afterResponse -", () => {
  test("declare beforeRequest and afterResponse currently", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [headerSetRequestReseponsePlugin()],
    });

    const kyWithHooks = ky.extend({
      hooks,
    });

    const res = await kyWithHooks.get("https://example.com/api/v1/foo");
    expect(res.headers.get("x-request-plugin")).toBe("succeed");
  });

  test("declare beforeRequest and afterResponse sequentially", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [beforeRequestPlugin(), afterResponsePlugin()],
    });

    const kyWithHooks = ky.extend({
      hooks,
    });

    const res = await kyWithHooks.get("https://example.com/api/v1/foo");
    expect(res.headers.get("x-request-plugin")).toBe("succeed");
  });

  test("declare beforeRequest and afterResponse in reverse order", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [afterResponsePlugin(), beforeRequestPlugin()],
    });

    const kyWithHooks = ky.extend({
      hooks,
    });

    const res = await kyWithHooks.get("https://example.com/api/v1/foo");
    expect(res.headers.get("x-request-plugin")).toBe("succeed");
  });
});

describe("retry plugin", () => {
  it("should retry", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [retryPlugin()],
    });

    const kyWithHooks = ky.extend({
      hooks,
    });

    const data = await kyWithHooks
      .get("https://example.com/header/x-retry")
      .then((res) => res.json());

    expect(data).toHaveLength(1);
  });
});

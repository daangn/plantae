import ky from "ky";
import { describe, expect, test } from "vitest";

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
  secondPlugin,
} from "../__mock__/plugin";
import createKyHooks from "./createKyHooks";

describe("ky:beforeRequest -", () => {
  test("headers", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [headerSetPlugin()],
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
    const hooks = createKyHooks({
      client: ky,
      plugins: [postMethodPlugin()],
    });

    const kyWithHoks = ky.extend({
      hooks,
    });

    const result = await kyWithHoks
      .get("https://example.com/api/v1/foo")
      .text();

    expect(result).toEqual("post request is completed");
  });

  test("body", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [postMethodWithBodyPlugin()],
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
    const hooks = createKyHooks({
      client: ky,
      plugins: [modifyUrlPlugin()],
    });

    const kyWithHoks = ky.extend({
      hooks,
    });

    const result = await kyWithHoks
      .get("https://example.com/api/v1/foo")
      .text();

    expect(result).toEqual("url is modified");
  });

  test.skip("signal", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [abortSignalPlugin()],
    });

    const kyWithHoks = ky.extend({
      hooks,
    });

    await expect(
      kyWithHoks.get("https://example.com/api/v1/delayed")
    ).rejects.toThrow();
  });
});

describe("ky:afterResponse -", () => {
  test("headers", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [modifiedHeaderResponsePlugin()],
    });

    const kyWithHoks = ky.extend({
      hooks,
    });

    const res = await kyWithHoks.get("https://example.com/api/v1/foo");

    expect(res.headers.get("x-foo")).toStrictEqual("bar");
  });

  test("body", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [modifiedResponseBodyPlugin()],
    });

    const kyWithHoks = ky.extend({
      hooks,
    });

    const result = await kyWithHoks
      .get("https://example.com/api/v1/foo")
      .text();

    expect(result).toStrictEqual("baz");
  });

  // FIXME: It should be checked about the spec
  test.skip("overriden plugin", async () => {
    const firstHooks = createKyHooks({
      client: ky,
      plugins: [firstPlugin()],
    });

    const firstKyWithHoks = ky.extend({
      hooks: firstHooks,
    });

    const secondHooks = createKyHooks({
      client: firstKyWithHoks,
      plugins: [secondPlugin()],
    });

    const secondKyWithHooks = ky.extend({
      hooks: secondHooks,
    });

    const res = await secondKyWithHooks.get("https://example.com/api/v1/foo");

    expect(res.headers.get("x-first")).toBe("foo"); // FIXME: failed test in here. Maybe it would that firstKyWithHoks is not applied
    expect(res.headers.get("x-second")).toBe("bar");

    const result = await res.text();
    expect(result).toBe("second");
  });

  test("multiple plugins", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [firstPlugin(), secondPlugin()],
    });

    const kyWithHoks = ky.extend({
      hooks,
    });

    const res = await kyWithHoks.get("https://example.com/api/v1/foo");

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

    const kyWithHoks = ky.extend({
      hooks,
    });

    const res = await kyWithHoks.get("https://example.com/api/v1/foo");
    expect(res.headers.get("x-request-plugin")).toBe("succeed");
  });

  test("declare beforeRequest and afterResponse sequentially", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [beforeRequestPlugin(), afterResponsePlugin()],
    });

    const kyWithHoks = ky.extend({
      hooks,
    });

    const res = await kyWithHoks.get("https://example.com/api/v1/foo");
    expect(res.headers.get("x-request-plugin")).toBe("succeed");
  });

  test("declare beforeRequest and afterResponse in reverse order", async () => {
    const hooks = createKyHooks({
      client: ky,
      plugins: [afterResponsePlugin(), beforeRequestPlugin()],
    });

    const kyWithHoks = ky.extend({
      hooks,
    });

    const res = await kyWithHoks.get("https://example.com/api/v1/foo");
    expect(res.headers.get("x-request-plugin")).toBe("succeed");
  });
});

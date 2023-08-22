import ky from "ky";
import { describe, expect, test } from "vitest";

import {
  abortSignalPlugin,
  headerSetPlugin,
  modifyUrlPlugin,
  postMethodPlugin,
  postMethodWithBodyPlugin,
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

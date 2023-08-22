import { describe, expect, test } from "vitest";

import {
  abortSignalPlugin,
  headerSetPlugin,
  modifyUrlPlugin,
  postMethodPlugin,
  postMethodWithBodyPlugin,
} from "../__mock__/plugin";
import createFetch from "./createFetch";

describe("fetch:beforeRequest -", () => {
  test("headers", async () => {
    const createdFetch = createFetch({
      client: fetch,
      plugins: [headerSetPlugin()],
    });

    const res = await createdFetch("https://example.com/api/v1/foo", {
      method: "GET",
    });
    const result = await res.text();

    expect(result).toStrictEqual("request plugin is activated");
  });

  test("method", async () => {
    const createdFetch = createFetch({
      client: fetch,
      plugins: [postMethodPlugin()],
    });

    const res = await createdFetch("https://example.com/api/v1/foo", {
      method: "GET",
    });
    const result = await res.text();

    expect(result).toEqual("post request is completed");
  });

  test("body", async () => {
    const createdFetch = createFetch({
      client: fetch,
      plugins: [postMethodWithBodyPlugin()],
    });

    const res = await createdFetch("https://example.com/api/v1/bar", {
      method: "POST",
    });
    const result = await res.json();

    expect(result).toStrictEqual({ foo: "bar" });
  });

  test("url", async () => {
    const createdFetch = createFetch({
      client: fetch,
      plugins: [modifyUrlPlugin()],
    });

    const res = await createdFetch("https://example.com/api/v1/foo", {
      method: "GET",
    });
    const result = await res.text();

    expect(result).toEqual("url is modified");
  });

  test.skip("signal", async () => {
    const createdFetch = createFetch({
      client: fetch,
      plugins: [abortSignalPlugin()],
    });

    await expect(
      createdFetch("https://example.com/api/v1/delayed", {
        method: "GET",
      })
    ).rejects.toThrow();
  });
});

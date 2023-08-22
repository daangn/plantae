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

describe("fetch:afterResponse -", () => {
  test("headers", async () => {
    const createdFetch = createFetch({
      client: fetch,
      plugins: [modifiedHeaderResponsePlugin()],
    });

    const res = await createdFetch("https://example.com/api/v1/foo", {
      method: "GET",
    });

    expect(res.headers.get("x-foo")).toStrictEqual("bar");
  });

  test("body", async () => {
    const createdFetch = createFetch({
      client: fetch,
      plugins: [modifiedResponseBodyPlugin()],
    });

    const res = await createdFetch("https://example.com/api/v1/foo", {
      method: "GET",
    });
    const result = await res.text();
    expect(result).toStrictEqual("baz");
  });

  test("overriden plugin", async () => {
    const createdFetch = createFetch({
      client: fetch,
      plugins: [firstPlugin()],
    });
    const secondCreatedFetch = createFetch({
      client: createdFetch,
      plugins: [secondPlugin()],
    });

    const res = await secondCreatedFetch("https://example.com/api/v1/foo", {
      method: "GET",
    });

    const result = await res.text();

    expect(res.headers.get("x-first")).toBe("foo");
    expect(res.headers.get("x-second")).toBe("bar");
    expect(result).toBe("second");
  });

  test("multiple plugins", async () => {
    const createdFetch = createFetch({
      client: fetch,
      plugins: [firstPlugin(), secondPlugin()],
    });
    const res = await createdFetch("https://example.com/api/v1/foo", {
      method: "GET",
    });
    const result = await res.text();

    expect(res.headers.get("x-first")).toBe("foo");
    expect(res.headers.get("x-second")).toBe("bar");
    expect(result).toBe("second");
  });
});

describe("fetch:beforeRequest+afterResponse -", () => {
  test("declare beforeRequest and afterResponse currently", async () => {
    const createdFetch = createFetch({
      client: fetch,
      plugins: [headerSetRequestReseponsePlugin()],
    });

    const res = await createdFetch("https://example.com/api/v1/foo", {
      method: "GET",
    });

    expect(res.headers.get("x-request-plugin")).toBe("succeed");
  });

  test("declare beforeRequest and afterResponse sequentially", async () => {
    const createdFetch = createFetch({
      client: fetch,
      plugins: [beforeRequestPlugin(), afterResponsePlugin()],
    });

    const res = await createdFetch("https://example.com/api/v1/foo", {
      method: "GET",
    });

    expect(res.headers.get("x-request-plugin")).toBe("succeed");
  });

  test("declare beforeRequest and afterResponse in reverse order", async () => {
    const createdFetch = createFetch({
      client: fetch,
      plugins: [afterResponsePlugin(), beforeRequestPlugin()],
    });

    const res = await createdFetch("https://example.com/api/v1/foo", {
      method: "GET",
    });

    expect(res.headers.get("x-request-plugin")).toBe("succeed");
  });
});

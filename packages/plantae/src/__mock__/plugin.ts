import type { Plugin } from "../types";

export const headerSetPlugin = (): Plugin => ({
  name: "headerSetPlugin",
  hooks: {
    beforeRequest: async (req) => {
      req.headers.set("x-request-plugin", "activate");
      return req;
    },
  },
});

export const postMethodPlugin = (): Plugin => ({
  name: "postMethodPlugin",
  hooks: {
    beforeRequest: async (req) => {
      return new Request(req.url, {
        ...req,
        method: "POST",
      });
    },
  },
});

export const postMethodWithBodyPlugin = (): Plugin => ({
  name: "postMethodWithBodyPlugin",
  hooks: {
    beforeRequest: async (req) => {
      return new Request(req.url, {
        method: "POST",
        body: JSON.stringify({ foo: "bar" }),
      });
    },
  },
});

export const modifyUrlPlugin = (): Plugin => ({
  name: "modifyUrlPlugin",
  hooks: {
    beforeRequest: async (req) => {
      const url = new URL(req.url);

      return new Request("https://example-second.com" + url.pathname, req);
    },
  },
});

export const abortSignalPlugin = (): Plugin => ({
  name: "abortSignalPlugin",
  hooks: {
    beforeRequest: async (req) => {
      const controller = new AbortController();
      setTimeout(() => {
        controller.abort();
      }, 100);

      return new Request(req.url, {
        signal: controller.signal,
        body: req.body,
        method: req.method,
        headers: req.headers,
      });
    },
  },
});

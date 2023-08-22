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
      }, 300);

      return new Request(req.url, {
        signal: controller.signal,
        body: req.body,
        method: req.method,
        headers: req.headers,
      });
    },
  },
});

export const modifiedHeaderResponsePlugin = (): Plugin => ({
  name: "modifiedHeaderResponsePlugin",
  hooks: {
    afterResponse: async (res) => {
      res.headers.set("x-foo", "bar");
      return res;
    },
  },
});

export const modifiedResponseBodyPlugin = (): Plugin => ({
  name: "modifiedResponseBodyPlugin",
  hooks: {
    afterResponse: async () => {
      return new Response("baz");
    },
  },
});

export const firstPlugin = (): Plugin => ({
  name: "firstForOverridePlugin",
  hooks: {
    afterResponse: async (res) => {
      res.headers.set("x-first", "foo");

      return new Response("first", {
        headers: res.headers,
      });
    },
  },
});
export const secondPlugin = (): Plugin => ({
  name: "secondForOverridePlugin",
  hooks: {
    afterResponse: async (res) => {
      res.headers.set("x-second", "bar");

      return new Response("second", {
        headers: res.headers,
      });
    },
  },
});

export const headerSetRequestReseponsePlugin = (): Plugin => ({
  name: "headerSetRequestReseponsePlugin",
  hooks: {
    beforeRequest: async (req) => {
      req.headers.set("x-request-plugin", "activate");
      return req;
    },
    afterResponse: async (res) => {
      const data = await res.text();

      const newResponse = new Response(data, {
        headers: res.headers,
      });

      if (data === "request plugin is activated") {
        newResponse.headers.set("x-request-plugin", "succeed");
        return newResponse;
      }

      newResponse.headers.set("x-request-plugin", "failed");
      return newResponse;
    },
  },
});

export const beforeRequestPlugin = (): Plugin => ({
  name: "beforeRequestPlugin",
  hooks: {
    beforeRequest: async (req) => {
      req.headers.set("x-request-plugin", "activate");
      return req;
    },
  },
});

export const afterResponsePlugin = (): Plugin => ({
  name: "afterResponsePlugin",
  hooks: {
    afterResponse: async (res) => {
      const data = await res.text();

      const newResponse = new Response(data, {
        headers: res.headers,
      });

      if (data === "request plugin is activated") {
        newResponse.headers.set("x-request-plugin", "succeed");
        return newResponse;
      }

      newResponse.headers.set("x-request-plugin", "failed");
      return newResponse;
    },
  },
});

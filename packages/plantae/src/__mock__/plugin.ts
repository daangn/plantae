import type { Plugin } from "../types";
import { baseURL } from "./handler";

export const modifyRequestBodyPlugin = (): Plugin => ({
  name: "plugin-modify-request-body",
  hooks: {
    beforeRequest: (req) => {
      return new Request(req, {
        body: "modified",
        method: "POST",
      });
    },
  },
});

export const modifyRequestHeadersPlugin = (): Plugin => ({
  name: "plugin-modify-request-headers",
  hooks: {
    beforeRequest: (req) => {
      req.headers.set("x-custom-header", "modified");
      return req;
    },
  },
});

export const modifyRequestMethodPlugin = (): Plugin => ({
  name: "plugin-modify-request-method",
  hooks: {
    beforeRequest: (req) => {
      return new Request(req, {
        method: "POST",
      });
    },
  },
});

export const modifyRequestUrlPlugin = (): Plugin => ({
  name: "plugin-modify-request-url",
  hooks: {
    beforeRequest: () => {
      return new Request(`${baseURL}/modified`);
    },
  },
});

export const addRequestSignalPlugin = (): Plugin => ({
  name: "plugin-add-request-signal",
  hooks: {
    beforeRequest: () => {
      const abortController = new AbortController();

      setTimeout(() => {
        abortController.abort();
      }, 100);

      return new Request(`${baseURL}/delay`, {
        signal: abortController.signal,
      });
    },
  },
});

export const modifyRequestCredentialsPlugin = (): Plugin => ({
  name: "plugin-modify-request-credentials",
  hooks: {
    beforeRequest: (req) => {
      return new Request(req, {
        credentials: "omit",
      });
    },
  },
});

export const modifyRequestCachePlugin = (): Plugin => ({
  name: "plugin-modify-request-credentials",
  hooks: {
    beforeRequest: (req) => {
      return new Request(req, {
        cache: "no-cache",
      });
    },
  },
});

export const modifyResponseBodyPlugin = (): Plugin => ({
  name: "plugin-modify-response-body",
  hooks: {
    afterResponse: (res) => new Response("modified", res),
  },
});

export const modifyResponseHeadersPlugin = (): Plugin => ({
  name: "plugin-modify-response-headers",
  hooks: {
    afterResponse: (res) => {
      res.headers.set("x-custom-header", "modified");
      return res;
    },
  },
});

export const modifyResponseStatusPlugin = (): Plugin => ({
  name: "plugin-modify-response-status",
  hooks: {
    afterResponse: (res) =>
      new Response(res.body, {
        headers: res.headers,
        statusText: res.statusText,
        status: 201,
      }),
  },
});

export const modifyResponseStatusTextPlugin = (): Plugin => ({
  name: "plugin-modify-status-text",
  hooks: {
    afterResponse: (res) =>
      new Response(res.body, {
        headers: res.headers,
        status: res.status,
        statusText: "modified",
      }),
  },
});

export const retryRequestPlugin = (): Plugin => ({
  name: "plugin-retry-request",
  hooks: {
    afterResponse: async (res, req, retry) => {
      if (!res.ok) {
        const newReq = new Request(`${baseURL}/retry`, req);

        return retry(newReq);
      }
      return res;
    },
  },
});

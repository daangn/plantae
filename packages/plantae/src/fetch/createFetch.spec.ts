import { http } from "msw";
import { describe, expect, it } from "vitest";

import { base, Status } from "../test/utils";
import { server } from "../test/worker";
import createFetch from "./createFetch";

describe("createFetch", () => {
  it("can modify request body", async () => {
    server.use(
      http.post(
        base("/"),
        async ({ request }) =>
          new Response(
            (await request.text()) === "modified" ? Status.OK : Status.BAD
          )
      )
    );

    const fetch = createFetch({
      plugins: [
        {
          name: "plugin-modify-request-body",
          hooks: {
            beforeRequest: (req) => {
              return new Request(req, {
                body: "modified",
                method: "POST",
              });
            },
          },
        },
      ],
    });

    const res = await fetch(base("/"), {
      method: "POST",
    });

    expect(await res.text()).toBe(Status.OK);
  });

  it("can modify request headers", async () => {
    server.use(
      http.get(
        base("/"),
        async ({ request }) =>
          new Response(
            request.headers.get("x-custom-header") === "modified"
              ? Status.OK
              : Status.BAD
          )
      )
    );

    const fetch = createFetch({
      plugins: [
        {
          name: "plugin-modify-request-headers",
          hooks: {
            beforeRequest: (req) => {
              req.headers.set("x-custom-header", "modified");
              return req;
            },
          },
        },
      ],
    });

    const res = await fetch(base("/"));

    expect(await res.text()).toBe(Status.OK);
  });

  it("can modify existing request header", async () => {
    server.use(
      http.get(
        base("/"),
        async ({ request }) =>
          new Response(
            request.headers.get("x-custom-header") === "modified"
              ? Status.OK
              : Status.BAD
          )
      )
    );

    const fetch = createFetch({
      plugins: [
        {
          name: "plugin-modify-request-headers",
          hooks: {
            beforeRequest: (req) => {
              req.headers.set("x-custom-header", "modified");
              return req;
            },
          },
        },
      ],
    });

    const res = await fetch(base("/"), {
      headers: {
        "x-custom-header": "original",
      },
    });

    expect(await res.text()).toBe(Status.OK);
  });

  it("can modify request method", async () => {
    server.use(http.post(base("/"), () => new Response(Status.OK)));

    const fetch = createFetch({
      plugins: [
        {
          name: "plugin-modify-request-method",
          hooks: {
            beforeRequest: (req) => {
              return new Request(req, {
                method: "POST",
              });
            },
          },
        },
      ],
    });

    const res = await fetch(base("/"));

    expect(await res.text()).toBe(Status.OK);
  });

  it("can modify request url", async () => {
    server.use(http.get(base("/modified"), () => new Response(Status.OK)));

    const fetch = createFetch({
      plugins: [
        {
          name: "plugin-modify-request-url",
          hooks: {
            beforeRequest: () => {
              return new Request(base("/modified"));
            },
          },
        },
      ],
    });

    const res = await fetch(base("/"));

    expect(await res.text()).toBe(Status.OK);
  });

  it("can add request signal", async () => {
    server.use(
      http.get(base("/delay"), async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        return new Response();
      })
    );

    const fetch = createFetch({
      plugins: [
        {
          name: "plugin-add-request-signal",
          hooks: {
            beforeRequest: () => {
              const abortController = new AbortController();

              setTimeout(() => {
                abortController.abort();
              }, 100);

              return new Request(base("/delay"), {
                signal: abortController.signal,
              });
            },
          },
        },
      ],
    });

    await expect(fetch(base("/"))).rejects.toThrow();
  });

  it("can modify request credentials", async () => {
    server.use(
      http.get(
        base("/"),
        async ({ request }) =>
          new Response(request.credentials === "omit" ? Status.OK : Status.BAD)
      )
    );

    const fetch = createFetch({
      plugins: [
        {
          name: "plugin-modify-request-credentials",
          hooks: {
            beforeRequest: (req) => {
              return new Request(req, {
                credentials: "omit",
              });
            },
          },
        },
      ],
    });

    const res = await fetch(base("/"), {
      credentials: "include",
    });

    expect(await res.text()).toBe(Status.OK);
  });

  it("can modify request cache", async () => {
    server.use(
      http.get(
        base("/"),
        async ({ request }) =>
          new Response(request.cache === "no-cache" ? Status.OK : Status.BAD)
      )
    );

    const fetch = createFetch({
      plugins: [
        {
          name: "plugin-modify-request-cache",
          hooks: {
            beforeRequest: (req) => {
              return new Request(req, {
                cache: "no-cache",
              });
            },
          },
        },
      ],
    });

    const res = await fetch(base("/"), {
      cache: "force-cache",
    });

    expect(await res.text()).toBe(Status.OK);
  });

  it("can modify response body", async () => {
    server.use(http.post(base("/"), () => new Response()));

    const fetch = createFetch({
      plugins: [
        {
          name: "plugin-modify-response-body",
          hooks: {
            afterResponse: (res) => new Response("modified", res),
          },
        },
      ],
    });

    const res = await fetch(base("/"), {
      method: "POST",
    });

    expect(await res.text()).toBe("modified");
  });

  it("can modify response headers", async () => {
    server.use(http.get(base("/"), () => new Response()));

    const fetch = createFetch({
      plugins: [
        {
          name: "plugin-modify-response-headers",
          hooks: {
            afterResponse: (res) => {
              const headers = new Headers(res.headers);

              headers.set("x-custom-header", "modified");

              return new Response(res.body, {
                headers,
                status: res.status,
                statusText: res.statusText,
              });
            },
          },
        },
      ],
    });

    const res = await fetch(base("/"));

    expect(res.headers.get("x-custom-header")).toBe("modified");
  });

  it("can modify existing response header", async () => {
    server.use(
      http.get(
        base("/"),
        () =>
          new Response(undefined, {
            headers: {
              "x-custom-header": "original",
            },
          })
      )
    );

    const fetch = createFetch({
      plugins: [
        {
          name: "plugin-modify-response-headers",
          hooks: {
            afterResponse: (res) => {
              const headers = new Headers(res.headers);

              headers.set("x-custom-header", "modified");

              return new Response(res.body, {
                headers,
                status: res.status,
                statusText: res.statusText,
              });
            },
          },
        },
      ],
    });

    const res = await fetch(base("/"));

    expect(res.headers.get("x-custom-header")).toBe("modified");
  });

  it("can modify response status", async () => {
    server.use(
      http.get(
        base("/"),
        async () =>
          new Response(null, {
            status: 201,
          })
      )
    );

    const fetch = createFetch({
      plugins: [
        {
          name: "plugin-modify-response-status",
          hooks: {
            afterResponse: (res) =>
              new Response(res.body, {
                headers: res.headers,
                statusText: res.statusText,
                status: 201,
              }),
          },
        },
      ],
    });

    const res = await fetch(base("/"));

    expect(res.status).toBe(201);
  });

  it("can modify response status text", async () => {
    server.use(http.get(base("/"), async () => new Response()));

    const fetch = createFetch({
      plugins: [
        {
          name: "plugin-modify-status-text",
          hooks: {
            afterResponse: (res) =>
              new Response(res.body, {
                headers: res.headers,
                status: res.status,
                statusText: "modified",
              }),
          },
        },
      ],
    });

    const res = await fetch(base("/"));

    expect(res.statusText).toBe("modified");
  });

  it("can retry request", async () => {
    server.use(
      http.get(base("/error"), async () => {
        return new Response(null, {
          status: 500,
        });
      }),
      http.get(base("/retry"), () => new Response("retried"))
    );

    const fetch = createFetch({
      plugins: [
        {
          name: "plugin-retry-request",
          hooks: {
            afterResponse: async (res, req, retry) => {
              if (!res.ok) {
                const newReq = new Request(base("/retry"), req);

                return retry(newReq);
              }
              return res;
            },
          },
        },
      ],
    });

    const res = await fetch(base("/error"));

    expect(await res.text()).toBe("retried");
  });

  it("should pass unused request to afterResponse hook", async () => {
    server.use(http.post(base("/"), () => new Response()));

    const fetch = createFetch({
      plugins: [
        {
          name: "plugin-clone-request",
          hooks: {
            beforeRequest: (req) => {
              return new Request(req, {
                method: "POST",
                body: "modified",
              });
            },
            afterResponse: (_, req, retry) => {
              expect(req.bodyUsed).toBe(false);

              return retry(req);
            },
          },
        },
      ],
    });

    await fetch(base("/"));

    expect.assertions(1);
  });
});

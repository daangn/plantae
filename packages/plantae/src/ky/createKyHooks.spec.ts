import Ky from "ky";
import { http } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../../mockServer";
import { base, baseURL, Status } from "../__mock__/handler";
import createKyHooks from "./createKyHooks";

describe("createkyInterceptors", () => {
  it("can modify request body", async () => {
    server.use(
      http.post(
        base("/"),
        async ({ request }) =>
          new Response(null, {
            status:
              (await request.text()) === "modified" ? Status.OK : Status.BAD,
          })
      )
    );

    const hooks = createKyHooks({
      client: Ky,
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

    const ky = Ky.create({
      prefixUrl: baseURL,
      hooks,
    });

    const res = await ky.post("");

    expect(res.status).toBe(Status.OK);
  });

  it("can modify request headers", async () => {
    server.use(
      http.get(
        base("/"),
        async ({ request }) =>
          new Response(null, {
            status:
              request.headers.get("x-custom-header") === "modified"
                ? Status.OK
                : Status.BAD,
          })
      )
    );

    const hooks = createKyHooks({
      client: Ky,
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

    const ky = Ky.create({
      prefixUrl: baseURL,
      hooks,
    });

    const res = await ky.get("");

    expect(res.status).toBe(Status.OK);
  });

  it("can modify existing request header", async () => {
    server.use(
      http.get(
        base("/"),
        async ({ request }) =>
          new Response(null, {
            status:
              request.headers.get("x-custom-header") === "modified"
                ? Status.OK
                : Status.BAD,
          })
      )
    );

    const hooks = createKyHooks({
      client: Ky,
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

    const ky = Ky.create({
      prefixUrl: baseURL,
      hooks,
    });

    const res = await ky.get("", {
      headers: {
        "x-custom-header": "original",
      },
    });

    expect(res.status).toBe(Status.OK);
  });

  it("can modify request method", async () => {
    server.use(http.post(base("/"), () => new Response()));

    const hooks = createKyHooks({
      client: Ky,
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

    const ky = Ky.create({
      prefixUrl: baseURL,
      hooks,
    });

    const res = await ky.get("");

    expect(res.status).toBe(Status.OK);
  });

  it("can modify request url", async () => {
    server.use(http.get(base("/modified"), () => new Response()));

    const hooks = createKyHooks({
      client: Ky,
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

    const ky = Ky.create({
      prefixUrl: baseURL,
      hooks,
    });

    const res = await ky.get("");

    expect(res.status).toBe(Status.OK);
  });

  // NOTE: happy-dom does not support signal on fetch
  it.skip("can add request signal", async () => {
    server.use(
      http.get(base("/delay"), async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        return new Response();
      })
    );

    const hooks = createKyHooks({
      client: Ky,
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

    const ky = Ky.create({
      prefixUrl: baseURL,
      hooks,
    });

    await expect(ky.get("")).rejects.toThrow("canceled");
  });

  it("can modify request credentials", async () => {
    server.use(
      http.get(
        base("/"),
        async ({ request }) =>
          new Response(null, {
            status: request.credentials === "omit" ? Status.OK : Status.BAD,
          })
      )
    );

    const hooks = createKyHooks({
      client: Ky,
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

    const ky = Ky.create({
      prefixUrl: baseURL,
      hooks,
    });

    const res = await ky.get("", {
      credentials: "include",
    });

    expect(res.status).toBe(Status.OK);
  });

  it("can modify request cache", async () => {
    server.use(
      http.get(
        base("/"),
        async ({ request }) =>
          new Response(null, {
            status: request.cache === "no-cache" ? Status.OK : Status.BAD,
          })
      )
    );

    const hooks = createKyHooks({
      client: Ky,
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

    const ky = Ky.create({
      prefixUrl: baseURL,
      hooks,
    });

    const res = await ky.get("", {
      cache: "force-cache",
    });

    expect(res.status).toBe(Status.OK);
  });

  it("can modify response body", async () => {
    server.use(http.post(base("/"), () => new Response()));

    const hooks = createKyHooks({
      client: Ky,
      plugins: [
        {
          name: "plugin-modify-response-body",
          hooks: {
            afterResponse: (res) => new Response("modified", res),
          },
        },
      ],
    });

    const ky = Ky.create({
      prefixUrl: baseURL,
      hooks,
    });

    const res = await ky.post("");

    expect(await res.text()).toBe("modified");
  });

  it("can modify response headers", async () => {
    server.use(http.get(base("/"), () => new Response()));

    const hooks = createKyHooks({
      client: Ky,
      plugins: [
        {
          name: "plugin-modify-response-headers",
          hooks: {
            afterResponse: (res) => {
              res.headers.set("x-custom-header", "modified");
              return res;
            },
          },
        },
      ],
    });

    const ky = Ky.create({
      prefixUrl: baseURL,
      hooks,
    });

    const res = await ky.get("");

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

    const hooks = createKyHooks({
      client: Ky,
      plugins: [
        {
          name: "plugin-modify-response-headers",
          hooks: {
            afterResponse: (res) => {
              res.headers.set("x-custom-header", "modified");
              return res;
            },
          },
        },
      ],
    });

    const ky = Ky.create({
      prefixUrl: baseURL,
      hooks,
    });

    const res = await ky.get("");

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

    const hooks = createKyHooks({
      client: Ky,
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

    const ky = Ky.create({
      prefixUrl: baseURL,
      hooks,
    });

    const res = await ky.get("");

    expect(res.status).toBe(201);
  });

  it("can modify response status text", async () => {
    server.use(http.get(base("/"), async () => new Response()));

    const hooks = createKyHooks({
      client: Ky,
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

    const ky = Ky.create({
      prefixUrl: baseURL,
      hooks,
    });

    const res = await ky.get("");

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

    const hooks = createKyHooks({
      client: Ky,
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

    const ky = Ky.create({
      prefixUrl: baseURL,
      hooks,
    });

    const res = await ky.get("error");

    expect(await res.text()).toBe("retried");
  });
});

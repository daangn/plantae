import Axios from "axios";
import { http } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../../mockServer";
import { base, baseURL, Status } from "../__mock__/handler";
import createAxiosInterceptors from "./createAxiosInterceptors";

describe("createAxiosInterceptors", () => {
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

    const axios = Axios.create({
      baseURL,
    });

    const { request } = createAxiosInterceptors({
      client: axios,
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

    axios.interceptors.request.use(request.onFulfilled, request.onRejected);

    const res = await axios.post("/");

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

    const axios = Axios.create({
      baseURL,
    });

    const { request } = createAxiosInterceptors({
      client: axios,
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

    axios.interceptors.request.use(request.onFulfilled, request.onRejected);

    const res = await axios.get("/");

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

    const axios = Axios.create({
      baseURL,
    });

    const { request } = createAxiosInterceptors({
      client: axios,
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

    axios.interceptors.request.use(request.onFulfilled, request.onRejected);

    const res = await axios.get("/", {
      headers: {
        "x-custom-header": "original",
      },
    });

    expect(res.status).toBe(Status.OK);
  });

  it("can modify request method", async () => {
    server.use(http.post(base("/"), () => new Response()));

    const axios = Axios.create({
      baseURL,
    });

    const { request } = createAxiosInterceptors({
      client: axios,
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

    axios.interceptors.request.use(request.onFulfilled, request.onRejected);

    const res = await axios.get("/");

    expect(res.status).toBe(Status.OK);
  });

  it("can modify request url", async () => {
    server.use(http.get(base("/modified"), () => new Response()));

    const axios = Axios.create({
      baseURL,
    });

    const { request } = createAxiosInterceptors({
      client: axios,
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

    axios.interceptors.request.use(request.onFulfilled, request.onRejected);

    const res = await axios.get("/");

    expect(res.status).toBe(Status.OK);
  });

  it("can add request signal", async () => {
    server.use(
      http.all(base("/delay"), async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        return new Response();
      })
    );

    const axios = Axios.create({
      baseURL,
    });

    const { request } = createAxiosInterceptors({
      client: axios,
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

    axios.interceptors.request.use(request.onFulfilled, request.onRejected);

    await expect(axios.get("/")).rejects.toThrow("canceled");
  });

  // NOTE: msw always takes 'same-origin' as credentials
  it.skip("can modify request credentials", async () => {
    server.use(
      http.get(
        base("/"),
        async ({ request }) =>
          new Response(null, {
            status: request.credentials === "omit" ? Status.OK : Status.BAD,
          })
      )
    );

    const axios = Axios.create({
      baseURL,
    });

    const { request } = createAxiosInterceptors({
      client: axios,
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

    axios.interceptors.request.use(request.onFulfilled, request.onRejected);

    const res = await axios.get("/", {
      withCredentials: true,
    });

    expect(res.status).toBe(Status.OK);
  });

  it("can modify request cache", async () => {
    server.use(
      http.get(
        base("/"),
        async ({ request }) =>
          new Response(null, {
            status:
              new URL(request.url).searchParams.get("_") !== null
                ? Status.OK
                : Status.BAD,
          })
      )
    );

    const axios = Axios.create({
      baseURL,
    });

    const { request } = createAxiosInterceptors({
      client: axios,
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

    axios.interceptors.request.use(request.onFulfilled, request.onRejected);

    const res = await axios.get("/", {
      withCredentials: true,
    });

    expect(res.status).toBe(Status.OK);
  });

  it("can modify response body", async () => {
    server.use(http.post(base("/"), () => new Response()));

    const axios = Axios.create({
      baseURL,
    });

    const { response } = createAxiosInterceptors({
      client: axios,
      plugins: [
        {
          name: "plugin-modify-response-body",
          hooks: {
            afterResponse: (res) => new Response("modified", res),
          },
        },
      ],
    });

    axios.interceptors.response.use(response.onFulfilled, response.onRejected);

    const res = await axios.post("/");

    expect(res.data).toBe("modified");
  });

  it("can modify response headers", async () => {
    server.use(http.get(base("/"), () => new Response()));

    const axios = Axios.create({
      baseURL,
    });

    const { response } = createAxiosInterceptors({
      client: axios,
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

    axios.interceptors.response.use(response.onFulfilled, response.onRejected);

    const res = await axios.get("/");

    expect(res.headers["x-custom-header"]).toBe("modified");
  });

  it("can modify existing response header", async () => {
    server.use(
      http.all(
        `${baseURL}/`,
        () =>
          new Response(undefined, {
            headers: {
              "x-custom-header": "original",
            },
          })
      )
    );

    const axios = Axios.create({
      baseURL,
    });

    const { response } = createAxiosInterceptors({
      client: axios,
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

    axios.interceptors.response.use(response.onFulfilled, response.onRejected);

    const res = await axios.get("/");

    expect(res.headers["x-custom-header"]).toBe("modified");
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

    const axios = Axios.create({
      baseURL,
    });

    const { response } = createAxiosInterceptors({
      client: axios,
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

    axios.interceptors.response.use(response.onFulfilled, response.onRejected);

    const res = await axios.get("/");

    expect(res.status).toBe(201);
  });

  it("can modify response status text", async () => {
    server.use(http.get(base("/"), async () => new Response()));

    const axios = Axios.create({
      baseURL,
    });

    const { response } = createAxiosInterceptors({
      client: axios,
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

    axios.interceptors.response.use(response.onFulfilled, response.onRejected);

    const res = await axios.get("/");

    expect(res.statusText).toBe("modified");
  });

  it("can retry request", async () => {
    server.use(
      http.all(`${baseURL}/error`, async () => {
        return new Response(null, {
          status: 500,
        });
      }),
      http.all(`${baseURL}/retry`, () => new Response("retried"))
    );

    const axios = Axios.create({
      baseURL,
    });

    const { response } = createAxiosInterceptors({
      client: axios,
      plugins: [
        {
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
        },
      ],
    });

    axios.interceptors.response.use(response.onFulfilled, response.onRejected);

    const res = await axios.get("/error");

    expect(res.data).toBe("retried");
  });
});

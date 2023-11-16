import Axios from "axios";
import { describe, expect, it } from "vitest";

import { server } from "../../mockServer";
import {
  addRequestSignalHandler,
  baseURL,
  emptyResponseHandler,
  errorResponseHandler,
  modifyRequestBodyHandler,
  modifyRequestCacheHandler,
  modifyRequestCredentialsHandler,
  modifyRequestHeadersHandler,
  modifyRequestMethodHandler,
  modifyRequestUrlHandler,
  modifyResponseHeadersHandler,
  retryResponseHandler,
} from "../__mock__/handler";
import {
  addRequestSignalPlugin,
  modifyRequestBodyPlugin,
  modifyRequestCachePlugin,
  modifyRequestCredentialsPlugin,
  modifyRequestHeadersPlugin,
  modifyRequestMethodPlugin,
  modifyRequestUrlPlugin,
  modifyResponseBodyPlugin,
  modifyResponseHeadersPlugin,
  modifyResponseStatusPlugin,
  modifyResponseStatusTextPlugin,
  retryRequestPlugin,
} from "../__mock__/plugin";
import createAxiosInterceptors from "./createAxiosInterceptors";

describe("createAxiosInterceptors", () => {
  it("can modify request body", async () => {
    server.use(modifyRequestBodyHandler);

    const axios = Axios.create({
      baseURL,
    });

    const { request } = createAxiosInterceptors({
      client: axios,
      plugins: [modifyRequestBodyPlugin()],
    });

    axios.interceptors.request.use(request.onFulfilled, request.onRejected);

    const res = await axios.post("/");

    expect(res.status).toBe(200);
  });

  it("can modify request headers", async () => {
    server.use(modifyRequestHeadersHandler);

    const axios = Axios.create({
      baseURL,
    });

    const { request } = createAxiosInterceptors({
      client: axios,
      plugins: [modifyRequestHeadersPlugin()],
    });

    axios.interceptors.request.use(request.onFulfilled, request.onRejected);

    const res = await axios.get("/");

    expect(res.status).toBe(200);
  });

  it("can modify existing request header", async () => {
    server.use(modifyRequestHeadersHandler);

    const axios = Axios.create({
      baseURL,
    });

    const { request } = createAxiosInterceptors({
      client: axios,
      plugins: [modifyRequestHeadersPlugin()],
    });

    axios.interceptors.request.use(request.onFulfilled, request.onRejected);

    const res = await axios.get("/", {
      headers: {
        "x-custom-header": "original",
      },
    });

    expect(res.status).toBe(200);
  });

  it("can modify request method", async () => {
    server.use(modifyRequestMethodHandler);

    const axios = Axios.create({
      baseURL,
    });

    const { request } = createAxiosInterceptors({
      client: axios,
      plugins: [modifyRequestMethodPlugin()],
    });

    axios.interceptors.request.use(request.onFulfilled, request.onRejected);

    const res = await axios.get("/");

    expect(res.status).toBe(200);
  });

  it("can modify request url", async () => {
    server.use(modifyRequestUrlHandler);

    const axios = Axios.create({
      baseURL,
    });

    const { request } = createAxiosInterceptors({
      client: axios,
      plugins: [modifyRequestUrlPlugin()],
    });

    axios.interceptors.request.use(request.onFulfilled, request.onRejected);

    const res = await axios.get("/");

    expect(res.status).toBe(200);
  });

  it("can add request signal", async () => {
    server.use(addRequestSignalHandler);

    const axios = Axios.create({
      baseURL,
    });

    const { request } = createAxiosInterceptors({
      client: axios,
      plugins: [addRequestSignalPlugin()],
    });

    axios.interceptors.request.use(request.onFulfilled, request.onRejected);

    await expect(axios.get("/")).rejects.toThrow("canceled");
  });

  // NOTE: msw always takes 'same-origin' as credentials
  it.skip("can modify request credentials", async () => {
    server.use(modifyRequestCredentialsHandler);

    const axios = Axios.create({
      baseURL,
    });

    const { request } = createAxiosInterceptors({
      client: axios,
      plugins: [modifyRequestCredentialsPlugin()],
    });

    axios.interceptors.request.use(request.onFulfilled, request.onRejected);

    const res = await axios.get("/", {
      withCredentials: true,
    });

    expect(res.status).toBe(200);
  });

  it("can modify request cache", async () => {
    server.use(modifyRequestCacheHandler);

    const axios = Axios.create({
      baseURL,
    });

    const { request } = createAxiosInterceptors({
      client: axios,
      plugins: [modifyRequestCachePlugin()],
    });

    axios.interceptors.request.use(request.onFulfilled, request.onRejected);

    const res = await axios.get("/", {
      withCredentials: true,
    });

    expect(res.status).toBe(200);
  });

  it("can modify response body", async () => {
    server.use(emptyResponseHandler);

    const axios = Axios.create({
      baseURL,
    });

    const { response } = createAxiosInterceptors({
      client: axios,
      plugins: [modifyResponseBodyPlugin()],
    });

    axios.interceptors.response.use(response.onFulfilled, response.onRejected);

    const res = await axios.post("/");

    expect(res.data).toBe("modified");
  });

  it("can modify response headers", async () => {
    server.use(emptyResponseHandler);

    const axios = Axios.create({
      baseURL,
    });

    const { response } = createAxiosInterceptors({
      client: axios,
      plugins: [modifyResponseHeadersPlugin()],
    });

    axios.interceptors.response.use(response.onFulfilled, response.onRejected);

    const res = await axios.get("/");

    expect(res.headers["x-custom-header"]).toBe("modified");
  });

  it("can modify existing response header", async () => {
    server.use(modifyResponseHeadersHandler);

    const axios = Axios.create({
      baseURL,
    });

    const { response } = createAxiosInterceptors({
      client: axios,
      plugins: [modifyResponseHeadersPlugin()],
    });

    axios.interceptors.response.use(response.onFulfilled, response.onRejected);

    const res = await axios.get("/");

    expect(res.headers["x-custom-header"]).toBe("modified");
  });

  it("can modify response status", async () => {
    server.use(emptyResponseHandler);

    const axios = Axios.create({
      baseURL,
    });

    const { response } = createAxiosInterceptors({
      client: axios,
      plugins: [modifyResponseStatusPlugin()],
    });

    axios.interceptors.response.use(response.onFulfilled, response.onRejected);

    const res = await axios.get("/");

    expect(res.status).toBe(201);
  });

  it("can modify response status text", async () => {
    server.use(emptyResponseHandler);

    const axios = Axios.create({
      baseURL,
    });

    const { response } = createAxiosInterceptors({
      client: axios,
      plugins: [modifyResponseStatusTextPlugin()],
    });

    axios.interceptors.response.use(response.onFulfilled, response.onRejected);

    const res = await axios.get("/");

    expect(res.statusText).toBe("modified");
  });

  it("can retry request", async () => {
    server.use(errorResponseHandler, retryResponseHandler);

    const axios = Axios.create({
      baseURL,
    });

    const { response } = createAxiosInterceptors({
      client: axios,
      plugins: [retryRequestPlugin()],
    });

    axios.interceptors.response.use(response.onFulfilled, response.onRejected);

    const res = await axios.get("/error");

    expect(res.data).toBe("retried");
  });
});

import type { AxiosHeaders } from "axios";
import axios from "axios";
import { describe, expect, test } from "vitest";

import type { AdapterResponse } from "../types";
import createAxiosInterceptors from "./createAxiosInterceptors";

describe("axios -", () => {
  test("headers", async () => {
    const axiosInstance = axios.create({
      baseURL: "https://example.com",
    });

    const myPlugin = () => ({
      name: "myPlugin",
      hooks: {
        afterResponse: async (res: AdapterResponse) => {
          res.headers.set("x-foo", "bar");
          return res;
        },
      },
    });

    const axiosMiddleware = createAxiosInterceptors({
      client: axiosInstance,
      plugins: [myPlugin()],
    });

    axiosInstance.interceptors.request.use(axiosMiddleware.request);
    axiosInstance.interceptors.response.use(axiosMiddleware.response);

    const res = await axiosInstance.get("/api/v1/foo");
    const customHeader = (res.headers as AxiosHeaders)["x-foo"];
    // const customHeader = res.headers.get("x-foo");

    if (!customHeader) {
      throw new Error("custom header not found");
    }

    expect(customHeader).toStrictEqual("bar");
  });
});

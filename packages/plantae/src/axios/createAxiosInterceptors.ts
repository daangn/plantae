import type {
  AxiosInstance,
  AxiosResponse,
  AxiosResponseHeaders,
  InternalAxiosRequestConfig,
} from "axios";

import createMiddleware from "../createMiddleware";
import type { AdapterRequest, AdapterResponse, Plugin } from "../types";
import { isArrayBuffer, isNullBodyStatus } from "../utils";
import settle from "./utils";

type InterceptorType = keyof AxiosInstance["interceptors"];

type InterceptorParams<T extends InterceptorType> = Parameters<
  AxiosInstance["interceptors"][T]["use"]
>;

type Interceptor<T extends InterceptorType> = {
  onFulfilled: InterceptorParams<T>[0];
  onRejected: InterceptorParams<T>[1];
};

function convertToAdapterRequest(
  req: InternalAxiosRequestConfig
): AdapterRequest {
  const path = req.url
    ? req.url.startsWith("/")
      ? req.url.slice(1)
      : req.url
    : "";

  const base = req.baseURL
    ? req.baseURL.endsWith("/")
      ? req.baseURL
      : `${req.baseURL}/`
    : undefined;

  const url = new URL(path, base);

  const transformedData = req.transformRequest
    ? Array.isArray(req.transformRequest)
      ? req.transformRequest.reduce(
          (data, transformer) => transformer.bind(req)(data, req.headers),
          req.data
        )
      : req.transformRequest(req.data, req.headers)
    : req.data;

  const credentials =
    req.withCredentials === true
      ? "include"
      : req.withCredentials === false
      ? "omit"
      : "same-origin";

  return new Request(url, {
    body: transformedData,
    method: req.method ?? "GET",
    headers: new Headers(req.headers.toJSON(true) as HeadersInit),
    signal: req.signal as AbortSignal,
    credentials,
  });
}

async function extendClientRequest(
  clientRequest: InternalAxiosRequestConfig,
  adapterRequest: AdapterRequest
): Promise<InternalAxiosRequestConfig> {
  let data = clientRequest.data;

  const isJSONBody = typeof data === "object" && data !== null;

  const { headers } = adapterRequest;

  const contentType = headers.get("Content-Type");

  if (adapterRequest.body) {
    if (contentType?.includes("multipart/form-data")) {
      data = await adapterRequest.formData();
    } else if (contentType?.includes("application/json") && isJSONBody) {
      data = await adapterRequest.json();
    } else if (
      contentType?.includes("application/x-www-form-urlencoded") ||
      contentType?.includes("text/plain") ||
      contentType?.includes("application/json")
    ) {
      data = await adapterRequest.text();
    } else {
      data = await adapterRequest.blob();
    }
  }

  for (const [key, value] of headers.entries()) {
    clientRequest.headers.set(key, value, true);
  }

  if (
    adapterRequest.cache === "no-cache" ||
    adapterRequest.cache === "no-store"
  ) {
    const url = new URL(adapterRequest.url);
    const searchParams = new URLSearchParams(url.search);

    searchParams.set("_", new Date().getTime().toString());

    url.search = searchParams.toString();

    clientRequest.url = url.toString();
  } else {
    clientRequest.url = adapterRequest.url;
  }

  clientRequest.data = data;
  clientRequest.method = adapterRequest.method;
  clientRequest.signal = adapterRequest.signal;
  clientRequest.withCredentials = adapterRequest.credentials === "include";

  clientRequest.validateStatus = null;

  return clientRequest;
}

function convertToAdapterResponse(res: AxiosResponse): AdapterResponse {
  const headers = res.headers as AxiosResponseHeaders;

  if (!res.config.responseType && isArrayBuffer(res.data)) {
    res.config.responseType = "arraybuffer";
  }

  const isJSONBody =
    res.data !== null &&
    typeof res.data === "object" &&
    (res.config.responseType === "json" ||
      (!res.config.responseType && res.config.transitional?.forcedJSONParsing));

  return new Response(
    isJSONBody
      ? JSON.stringify(res.data)
      : isNullBodyStatus(res.status)
      ? null
      : res.data,
    {
      status: res.status,
      statusText: res.statusText,
      headers: new Headers(headers.toJSON(true) as HeadersInit),
    }
  );
}

async function extendClientResponse(
  clientResponse: AxiosResponse,
  adapterResponse: AdapterResponse
): Promise<AxiosResponse> {
  const { headers } = adapterResponse;

  const axiosHeaders = clientResponse.headers as AxiosResponseHeaders;

  const contentType = headers.get("Content-Type");

  let data = null;

  if (adapterResponse.body) {
    if (
      contentType?.includes("text/plain") ||
      contentType?.includes("application/json")
    ) {
      data = await adapterResponse.text();

      try {
        if (clientResponse.config.transitional?.forcedJSONParsing) {
          data = JSON.parse(data);
          headers.set("Content-Type", "application/json");
        }
      } catch {}
    } else if (clientResponse.config.responseType === "arraybuffer") {
      data = await adapterResponse.arrayBuffer();
    } else {
      data = await adapterResponse.blob();
    }
  }

  for (const [key, value] of headers.entries()) {
    axiosHeaders.set(key, value, true);
  }

  clientResponse.data = data;
  clientResponse.status = adapterResponse.status;
  clientResponse.statusText = adapterResponse.statusText;

  return clientResponse;
}

const createAxiosInterceptors = ({
  client,
  plugins,
}: {
  client: AxiosInstance;
  plugins?: Plugin[];
}): {
  request: Interceptor<"request">;
  response: Interceptor<"response">;
} => {
  if (!plugins) {
    return {
      request: { onFulfilled: (config) => config, onRejected: null },
      response: { onFulfilled: (response) => response, onRejected: null },
    };
  }

  const { requestMiddleware, responseMiddleware } = createMiddleware({
    convertToAdapterRequest,
    convertToAdapterResponse,
    extendClientRequest,
    extendClientResponse,
    plugins,
    retry: client.request,
  });

  return {
    request: {
      onFulfilled: async (config) => {
        return requestMiddleware(config);
      },
      onRejected: null,
    },
    response: {
      onFulfilled: async (response) => {
        return responseMiddleware(response, response.config);
      },
      onRejected: async (err: { response?: AxiosResponse }) => {
        const { response } = err;

        if (response && response.config) {
          const middlewareResponse = await responseMiddleware(
            response,
            response.config
          );

          return new Promise((resolve, reject) => {
            settle(resolve, reject, middlewareResponse);
          });
        }

        return Promise.reject(err);
      },
    },
  };
};

export default createAxiosInterceptors;

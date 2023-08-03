import type {
  AxiosInstance,
  AxiosResponse,
  AxiosResponseHeaders,
  InternalAxiosRequestConfig,
} from "axios";

import createMiddleware from "../createMiddleware";
import type { AdapterRequest, AdapterResponse, CreateAdapter } from "../types";

function convertToAdapterRequest(
  req: InternalAxiosRequestConfig
): AdapterRequest {
  return {
    body: req.data,
    headers: new Headers(req.headers.toJSON(true) as HeadersInit),
    method: req.method ?? "GET",
    url: req.url ?? "",
    signal: req.signal as AbortSignal,
  };
}

function extendClientRequest(
  clientRequest: InternalAxiosRequestConfig,
  adapterRequest: AdapterRequest
): InternalAxiosRequestConfig {
  const { body: data, headers, ...rest } = adapterRequest;

  return {
    ...clientRequest,
    headers: clientRequest.headers.concat(
      Object.fromEntries(headers?.entries() ?? [])
    ),
    data,
    ...rest,
  };
}

function convertToAdapterResponse(res: AxiosResponse): AdapterResponse {
  const headers = res.headers as AxiosResponseHeaders;

  return {
    body: res.data,
    headers: new Headers(headers.toJSON(true) as HeadersInit),
    ok: res.status >= 200 && res.status < 300,
    status: res.status,
    statusText: res.statusText,
    url: res.config.url ?? "",
  };
}

function extendClientResponse(
  clientResponse: AxiosResponse,
  adapterResponse: AdapterResponse
): AxiosResponse {
  const { body: data, headers, ...rest } = adapterResponse;

  const axiosHeaders = clientResponse.headers as AxiosResponseHeaders;

  return {
    ...clientResponse,
    headers: axiosHeaders.concat(Object.fromEntries(headers?.entries() ?? [])),
    data,
    ...rest,
  };
}

const createAxiosInterceptors: CreateAdapter<AxiosInstance> = ({
  client,
  plugins,
}) => {
  if (!plugins) {
    return {
      request: (config) => config,
      response: (response) => response,
    };
  }

  const { requestMiddleware, responseMiddleware } =
    createMiddleware<AxiosInstance>({
      convertToAdapterRequest,
      convertToAdapterResponse,
      extendClientRequest,
      extendClientResponse,
      plugins,
      retry: client.request,
    });

  return {
    request: requestMiddleware,
    response: async (response) => {
      return responseMiddleware(response, response.config);
    },
  };
};

export default createAxiosInterceptors;

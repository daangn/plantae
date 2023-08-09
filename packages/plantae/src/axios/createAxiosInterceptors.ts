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
  const url = new URL(req.url ?? "", req.baseURL);

  return new Request(url, {
    body: req.data,
    method: req.method ?? "GET",
    headers: new Headers(req.headers.toJSON(true) as HeadersInit),
    signal: req.signal as AbortSignal,
  });
}

async function extendClientRequest(
  clientRequest: InternalAxiosRequestConfig,
  adapterRequest: AdapterRequest
): Promise<InternalAxiosRequestConfig> {
  let data = null;

  const { headers } = adapterRequest;

  const contentType = headers.get("Content-Type");

  if (adapterRequest.body) {
    if (contentType?.includes("multipart/form-data")) {
      data = await adapterRequest.formData();
    } else if (
      contentType?.includes("application/x-www-form-urlencoded") ||
      contentType?.includes("text/plain")
    ) {
      data = await adapterRequest.text();
    } else {
      data = await adapterRequest.blob();
    }
  }

  for (const [key, value] of headers.entries()) {
    clientRequest.headers.set(key, value, true);
  }

  clientRequest.data = data;
  clientRequest.method = adapterRequest.method;
  clientRequest.url = adapterRequest.url;
  clientRequest.signal = adapterRequest.signal;

  return clientRequest;
}

function convertToAdapterResponse(res: AxiosResponse): AdapterResponse {
  const headers = res.headers as AxiosResponseHeaders;

  return new Response(
    res.data !== null &&
    typeof res.data === "object" &&
    (res.config.responseType === "json" ||
      (!res.config.responseType && res.config.transitional?.forcedJSONParsing))
      ? JSON.stringify(res.data)
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

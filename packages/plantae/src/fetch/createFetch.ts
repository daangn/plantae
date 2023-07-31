import createMiddleware from "../createMiddleware";
import type { AdapterRequest, AdapterResponse, CreateAdapter } from "../types";

export function convertToAdapterRequest(req: Request): AdapterRequest {
  return {
    body: req.body,
    headers: req.headers,
    method: req.method,
    url: req.url,
    signal: req.signal,
  };
}

export function extendClientRequest(
  clientRequest: Request,
  adapterRequest: AdapterRequest
): Request {
  return {
    ...clientRequest,
    ...adapterRequest,
  };
}

export function convertToAdapterResponse(res: Response): AdapterResponse {
  return {
    body: res.body,
    headers: res.headers,
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    url: res.url,
  };
}

export function extendClientResponse(
  clientResponse: Response,
  adapterResponse: AdapterResponse
): Response {
  return {
    ...clientResponse,
    ...adapterResponse,
  };
}

const createFetch: CreateAdapter<typeof fetch> = ({ client, plugins }) => {
  if (!plugins) {
    return client;
  }

  return async (...args: Parameters<typeof fetch>) => {
    const [input, init] = args;

    const initialRequest = new Request(input, init);

    const { requestMiddleware, responseMiddleware } = createMiddleware<
      typeof fetch
    >({
      convertToAdapterRequest,
      convertToAdapterResponse,
      extendClientRequest,
      extendClientResponse,
      plugins,
      retry: client,
    });

    const request = await requestMiddleware(initialRequest);

    const initialResponse = await client(request);

    return responseMiddleware(initialResponse, request);
  };
};

export default createFetch;

import type { AdapterRequest, AdapterResponse, Plugin } from "./types";

type ConvertToAdapterRequest<T> = (request: T) => AdapterRequest;
type ExtendClientRequest<T> = (
  clientRequest: T,
  adapterRequest: AdapterRequest
) => T | Promise<T>;

type ConvertToAdapterResponse<T> = (response: T) => AdapterResponse;
type ExtendClientResponse<T> = (
  clientResponse: T,
  adapterResponse: AdapterResponse
) => T | Promise<T>;

type Retryer<T, U> = (clientRequest: T) => Promise<U>;

// client request -> adapter request -> pipe plugins -> client request
export function createRequestMiddleware<T>({
  plugins,
  convertToAdapterRequest,
  extendClientRequest,
}: {
  plugins: Plugin[];
  convertToAdapterRequest: ConvertToAdapterRequest<T>;
  extendClientRequest: ExtendClientRequest<T>;
}) {
  return async (clientRequest: T) => {
    let adapterRequest = convertToAdapterRequest(clientRequest);

    for (const plugin of plugins) {
      if (plugin.hooks?.beforeRequest) {
        adapterRequest = await plugin.hooks.beforeRequest(adapterRequest);
      }
    }

    return extendClientRequest(clientRequest, adapterRequest);
  };
}

// client response -> adapter response -> pipe plugins -> client response
export function createResponseMiddleware<T, U>({
  plugins,
  convertToAdapterRequest,
  extendClientRequest,
  convertToAdapterResponse,
  extendClientResponse,
  cloneClientRequest,
  retry,
}: {
  plugins: Plugin[];
  convertToAdapterRequest: ConvertToAdapterRequest<T>;
  extendClientRequest: ExtendClientRequest<T>;
  convertToAdapterResponse: ConvertToAdapterResponse<U>;
  extendClientResponse: ExtendClientResponse<U>;
  cloneClientRequest?: (req: T) => T;
  retry: Retryer<T, U>;
}) {
  return async (clientResponse: U, clientRequest: T) => {
    let adapterResponse: AdapterResponse =
      convertToAdapterResponse(clientResponse);

    for (const plugin of plugins) {
      if (plugin.hooks?.afterResponse) {
        adapterResponse = await plugin.hooks.afterResponse(
          adapterResponse,
          convertToAdapterRequest(clientRequest),
          // eslint-disable-next-line @typescript-eslint/no-loop-func
          async (adapterRequest) => {
            const extendedClientRequest = await extendClientRequest(
              clientRequest,
              adapterRequest
            );
            const clonedClientRequest = cloneClientRequest
              ? cloneClientRequest(extendedClientRequest)
              : extendedClientRequest;

            clientResponse = await retry(extendedClientRequest);

            clientRequest = clonedClientRequest;

            return convertToAdapterResponse(clientResponse);
          }
        );
      }
    }

    return extendClientResponse(clientResponse, adapterResponse);
  };
}

export default function createMiddleware<Req, Res>({
  convertToAdapterRequest,
  extendClientRequest,
  convertToAdapterResponse,
  extendClientResponse,
  cloneClientRequest,
  plugins,
  retry,
}: {
  plugins: Plugin[];
  convertToAdapterRequest: ConvertToAdapterRequest<Req>;
  extendClientRequest: ExtendClientRequest<Req>;
  convertToAdapterResponse: ConvertToAdapterResponse<Res>;
  extendClientResponse: ExtendClientResponse<Res>;
  cloneClientRequest?: (req: Req) => Req;
  retry: Retryer<Req, Res>;
}) {
  return {
    requestMiddleware: createRequestMiddleware({
      plugins,
      convertToAdapterRequest,
      extendClientRequest,
    }),
    responseMiddleware: createResponseMiddleware({
      plugins,
      convertToAdapterRequest,
      extendClientRequest,
      convertToAdapterResponse,
      extendClientResponse,
      cloneClientRequest,
      retry,
    }),
  };
}

import type {
  AdapterRequest,
  AdapterResponse,
  ClientRequest,
  ClientResponse,
  Plugin,
} from "./types";

type ConvertToAdapterRequest<T> = (request: ClientRequest<T>) => AdapterRequest;
type ExtendClientRequest<T> = (
  clientRequest: ClientRequest<T>,
  adapterRequest: AdapterRequest
) => ClientRequest<T> | Promise<ClientRequest<T>>;

type ConvertToAdapterResponse<T> = (
  response: ClientResponse<T>
) => AdapterResponse;
type ExtendClientResponse<T> = (
  clientResponse: ClientResponse<T>,
  adapterResponse: AdapterResponse
) => ClientResponse<T> | Promise<ClientResponse<T>>;

type Retry<T> = (clientRequest: ClientRequest<T>) => Promise<ClientResponse<T>>;

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
  return async (clientRequest: ClientRequest<T>) => {
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
export function createResponseMiddleware<T>({
  plugins,
  convertToAdapterRequest,
  extendClientRequest,
  convertToAdapterResponse,
  extendClientResponse,
  retry,
}: {
  plugins: Plugin[];
  convertToAdapterRequest: ConvertToAdapterRequest<T>;
  extendClientRequest: ExtendClientRequest<T>;
  convertToAdapterResponse: ConvertToAdapterResponse<T>;
  extendClientResponse: ExtendClientResponse<T>;
  retry: Retry<T>;
}) {
  return async (
    clientResponse: ClientResponse<T>,
    clientRequest: ClientRequest<T>
  ) => {
    let adapterResponse: AdapterResponse =
      convertToAdapterResponse(clientResponse);

    for (const plugin of plugins) {
      if (plugin.hooks?.afterResponse) {
        adapterResponse = await plugin.hooks.afterResponse(
          adapterResponse,
          convertToAdapterRequest(clientRequest),
          // eslint-disable-next-line @typescript-eslint/no-loop-func
          async (adapterRequest) => {
            clientRequest = extendClientRequest(clientRequest, adapterRequest);

            clientResponse = await retry(clientRequest);

            return convertToAdapterResponse(clientResponse);
          }
        );
      }
    }

    return extendClientResponse(clientResponse, adapterResponse);
  };
}

export default function createMiddleware<T>({
  convertToAdapterRequest,
  extendClientRequest,
  convertToAdapterResponse,
  extendClientResponse,
  plugins,
  retry,
}: {
  plugins: Plugin[];
  convertToAdapterRequest: ConvertToAdapterRequest<T>;
  extendClientRequest: ExtendClientRequest<T>;
  convertToAdapterResponse: ConvertToAdapterResponse<T>;
  extendClientResponse: ExtendClientResponse<T>;
  retry: Retry<T>;
}) {
  return {
    requestMiddleware: createRequestMiddleware<T>({
      plugins,
      convertToAdapterRequest,
      extendClientRequest,
    }),
    responseMiddleware: createResponseMiddleware<T>({
      plugins,
      convertToAdapterRequest,
      extendClientRequest,
      convertToAdapterResponse,
      extendClientResponse,
      retry,
    }),
  };
}

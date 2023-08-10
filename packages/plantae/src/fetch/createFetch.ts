import createMiddleware from "../createMiddleware";
import type { CreateAdapter } from "../types";

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
      convertToAdapterRequest: (req) => req,
      convertToAdapterResponse: (res) => res,
      extendClientRequest: (_, req) => req as Request,
      extendClientResponse: (_, res) => res as Response,
      plugins,
      retry: client,
    });

    const request = await requestMiddleware(initialRequest);

    const initialResponse = await client(request);

    return responseMiddleware(initialResponse, request);
  };
};

export default createFetch;

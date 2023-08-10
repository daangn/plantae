import createMiddleware from "../createMiddleware";
import type { Plugin } from "../types";

const createFetch = ({
  client,
  plugins,
}: {
  client: typeof fetch;
  plugins?: Plugin[];
}): typeof fetch => {
  if (!plugins) {
    return client;
  }

  return async (...args) => {
    const [input, init] = args;

    const initialRequest = new Request(input, init);

    const { requestMiddleware, responseMiddleware } = createMiddleware<
      Request,
      Response
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

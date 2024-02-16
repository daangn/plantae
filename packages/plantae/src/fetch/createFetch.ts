import createMiddleware from "../createMiddleware";
import type { Plugin } from "../types";

const createFetch = ({
  client: baseClient,
  plugins = [],
}: {
  client?: typeof fetch;
  plugins?: Plugin[];
}): typeof fetch => {
  return async (...args) => {
    const client = baseClient ?? fetch;

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
      cloneClientRequest: (req) => req.clone(),
      plugins,
      retry: client,
    });

    const request = await requestMiddleware(initialRequest);
    const clonedClientRequest = request.clone();

    const initialResponse = await client(request);

    return responseMiddleware(initialResponse, clonedClientRequest);
  };
};

export default createFetch;

import type ky from "ky";

import createMiddleware from "../createMiddleware";
import type { CreateAdapter } from "../types";

const createKyHooks: CreateAdapter<typeof ky> = ({ client, plugins }) => {
  if (!plugins) {
    return {};
  }

  const { requestMiddleware, responseMiddleware } = createMiddleware<typeof ky>(
    {
      convertToAdapterRequest: (req) => req,
      convertToAdapterResponse: (res) => res,
      extendClientRequest: (_, req) => req as Request,
      extendClientResponse: (_, res) => res as Response,
      plugins,
      retry: client,
    }
  );

  return {
    beforeRequest: [requestMiddleware],
    afterResponse: [
      async (req, _, res) => {
        return responseMiddleware(res, req);
      },
    ],
  };
};

export default createKyHooks;

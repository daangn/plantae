import type ky from "ky";

import createMiddleware from "../createMiddleware";
import type { Plugin } from "../types";

type KyHooks = NonNullable<Parameters<(typeof ky)["extend"]>[0]["hooks"]>;

const createKyHooks = ({
  client,
  plugins,
}: {
  client: typeof ky;
  plugins?: Plugin[];
}): KyHooks => {
  if (!plugins) {
    return {};
  }

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

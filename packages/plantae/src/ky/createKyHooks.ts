import type ky from "ky";

import createMiddleware from "../createMiddleware";
import {
  convertToAdapterRequest,
  convertToAdapterResponse,
  extendClientRequest,
  extendClientResponse,
} from "../fetch/createFetch";
import type { CreateAdapter } from "../types";

const createKyHooks: CreateAdapter<typeof ky> = ({ client, plugins }) => {
  if (!plugins) {
    return {};
  }

  const { requestMiddleware, responseMiddleware } = createMiddleware<typeof ky>(
    {
      convertToAdapterRequest,
      convertToAdapterResponse,
      extendClientRequest,
      extendClientResponse,
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

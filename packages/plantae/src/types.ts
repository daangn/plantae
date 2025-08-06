export type Plugin<Context = {}> = {
  name: string;
  hooks?: {
    beforeRequest?: (
      request: AdapterRequest,
    ) => Promise<AdapterRequest> | AdapterRequest;
    afterResponse?: (
      response: AdapterResponse,
      request: AdapterRequest,
      retry: (request: AdapterRequest) => Promise<AdapterResponse>,
    ) => Promise<AdapterResponse> | AdapterResponse;
  };
  context?: Context;
};

export type AdapterRequest = Request;

export type AdapterResponse = Response;

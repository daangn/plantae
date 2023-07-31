import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import type ky from "ky";

type FetchInstance = typeof fetch;

type KyInstance = typeof ky;

type KyHooks = NonNullable<Parameters<KyInstance["extend"]>[0]["hooks"]>;

type Interceptor<T extends keyof AxiosInstance["interceptors"]> = Parameters<
  AxiosInstance["interceptors"][T]["use"]
>[0];

export type Client = AxiosInstance | FetchInstance | KyInstance;

export type CreateAdapter<T extends Client> = (init: {
  client: T;
  plugins?: Plugin[];
}) => T extends AxiosInstance
  ? AxiosAdapter
  : T extends KyInstance
  ? KyAdapter
  : T extends FetchInstance
  ? FetchAdapter
  : never;

export type AxiosAdapter = {
  request: Interceptor<"request">;
  response: Interceptor<"response">;
};

export type FetchAdapter = typeof fetch;

export type KyAdapter = KyHooks;

export type AdapterInit = AxiosAdapterInit | FetchAdapterInit;

type FetchAdapterInit = {
  client: typeof fetch;
  plugins?: Plugin[];
};

type AxiosAdapterInit = {
  client: AxiosInstance;
  plugins?: Plugin[];
};

export type Plugin<Context = {}> = {
  name: string;
  hooks?: {
    beforeRequest?: (
      request: AdapterRequest
    ) => Promise<AdapterRequest> | AdapterRequest;
    afterResponse?: (
      response: AdapterResponse,
      request: AdapterRequest,
      retry: (request: AdapterRequest) => Promise<AdapterResponse>
    ) => Promise<AdapterResponse> | AdapterResponse;
  };
  context?: Context;
};

export type AdapterRequest = Pick<
  Request,
  "body" | "headers" | "method" | "url" | "signal"
>;

export type AdapterResponse = Pick<
  Response,
  "body" | "headers" | "ok" | "status" | "statusText" | "url"
>;

export type ClientRequest<T> = T extends AxiosInstance
  ? InternalAxiosRequestConfig
  : T extends KyInstance | FetchInstance
  ? Request
  : never;

export type ClientResponse<T> = T extends AxiosInstance
  ? AxiosResponse
  : T extends KyInstance | FetchInstance
  ? Response
  : never;

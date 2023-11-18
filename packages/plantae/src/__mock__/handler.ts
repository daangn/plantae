import { http, HttpResponse } from "msw";

export const baseURL = "http://localhost:5173/api";

export const base = (path: string) => `${baseURL}${path}`;

export const Status = {
  OK: 200,
  BAD: 400,
} as const;

export function createMatcherHandler(
  path: string,
  matcher: (req: Request) => Promise<boolean>
) {
  return http.all(`${baseURL}${path}`, async ({ request }) => {
    if (!(await matcher(request))) {
      return HttpResponse.error();
    }

    return HttpResponse.text("matched");
  });
}

export const modifyRequestBodyHandler = createMatcherHandler(
  "/",
  async (req) => (await req.text()) === "modified"
);

export const modifyRequestHeadersHandler = createMatcherHandler(
  "/",
  async (req) => req.headers.get("x-custom-header") === "modified"
);

export const modifyRequestMethodHandler = createMatcherHandler(
  "/",
  async (req) => req.method === "POST"
);

export const modifyRequestUrlHandler = http.all(
  `${baseURL}/modified`,
  async () => {
    return HttpResponse.text();
  }
);

export const addRequestSignalHandler = http.all(
  `${baseURL}/delay`,
  async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    return HttpResponse.text();
  }
);

export const modifyRequestCredentialsHandler = createMatcherHandler(
  "/",
  async (req) => req.credentials === "omit"
);

export const modifyRequestCacheHandler = createMatcherHandler(
  "/",
  async (req) => new URL(req.url).searchParams.get("_") !== null
);

export const emptyResponseHandler = http.all(`${baseURL}/`, async () => {
  return HttpResponse.text();
});

export const modifyResponseHeadersHandler = http.all(
  `${baseURL}/`,
  async () => {
    return HttpResponse.text(undefined, {
      headers: {
        "x-custom-header": "original",
      },
    });
  }
);

export const errorResponseHandler = http.all(`${baseURL}/error`, async () => {
  // NOTE: HttpResponse.error() is causing an error cannot be caught by axios.
  return new Response(null, {
    status: 500,
  });
});

export const retryResponseHandler = http.all(`${baseURL}/retry`, async () => {
  return HttpResponse.text("retried");
});

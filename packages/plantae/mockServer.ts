import type { StrictResponse } from "msw";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const BASE_URL = "https://example.com";

const handlers = [
  http.get(
    "https://example.com/api/v1/foo",
    ({ request }): StrictResponse<any> => {
      if (request.headers.get("x-request-plugin") === "activate") {
        return HttpResponse.text("request plugin is activated");
      }

      const mockJson = {
        foo: "bar",
      };
      return HttpResponse.json(mockJson);
    }
  ),
  http.post("https://example.com/api/v1/foo", () => {
    return HttpResponse.text("post request is completed");
  }),
  http.post("https://example.com/api/v1/bar", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body);
  }),
  http.get("https://example.com/api/v1/delayed", async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return HttpResponse.text("delayed");
  }),
  http.get("https://example-second.com/api/v1/foo", () => {
    return HttpResponse.text("url is modified");
  }),

  http.all(`${BASE_URL}/header/:header`, ({ request, params }) => {
    const header = params.header;

    const values = [...request.headers.entries()]
      .filter(([key]) => key === header)
      .map(([, value]) => value);

    return HttpResponse.json(values);
  }),
];

export const server = setupServer(...handlers);

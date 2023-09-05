import { rest } from "msw";
import { setupServer } from "msw/node";

export const BASE_URL = "https://example.com";

const handlers = [
  rest.get("https://example.com/api/v1/foo", (req, res, ctx) => {
    if (req.headers.get("x-request-plugin") === "activate") {
      return res(ctx.text("request plugin is activated"));
    }

    const mockJson = {
      foo: "bar",
    };
    return res(ctx.json(mockJson));
  }),
  rest.post("https://example.com/api/v1/foo", async (req, res, ctx) => {
    return res(ctx.text("post request is completed"));
  }),
  rest.post("https://example.com/api/v1/bar", async (req, res, ctx) => {
    const body = await req.json();
    return res(ctx.json(body));
  }),
  rest.get("https://example.com/api/v1/delayed", async (req, res, ctx) => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return res(ctx.text("delayed"));
  }),
  rest.get("https://example-second.com/api/v1/foo", async (req, res, ctx) => {
    return res(ctx.text("url is modified"));
  }),

  rest.all(`${BASE_URL}/header/:header`, async (req, res, ctx) => {
    const header = req.params.header;

    const values = [...req.headers.entries()]
      .filter(([key]) => key === header)
      .map(([, value]) => value);

    return res(ctx.json(values));
  }),
];

export const server = setupServer(...handlers);

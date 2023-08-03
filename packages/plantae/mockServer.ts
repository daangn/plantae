import { rest } from "msw";
import { setupServer } from "msw/node";

const handlers = [
  rest.get("https://example.com/api/v1/foo", (req, res, ctx) => {
    const mockJson = {
      foo: "bar",
    };
    return res(ctx.json(mockJson));
  }),
];

export const server = setupServer(...handlers);

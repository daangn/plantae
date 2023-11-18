import { setupWorker } from "msw/browser";
import { afterAll, afterEach, beforeAll } from "vitest";

export const server = setupWorker();

beforeAll(async () => {
  await server.start({
    quiet: true,
  });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.stop();
});

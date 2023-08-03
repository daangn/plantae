import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

import { server } from "./mockServer";

beforeAll(() => {
  server.listen();
});

beforeEach(() => {
  location.replace(`http://localhost`);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

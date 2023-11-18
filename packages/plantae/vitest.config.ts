import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      name: "chrome",
      headless: true,
    },
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  publicDir: "./public",
});

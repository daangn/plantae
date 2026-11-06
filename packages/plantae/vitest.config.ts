import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      name: "chrome",
      headless: true,
      providerOptions:
        process.env.CHROME_BIN && process.env.CHROMEDRIVER_BIN
          ? {
              capabilities: {
                "goog:chromeOptions": { binary: process.env.CHROME_BIN },
                "wdio:chromedriverOptions": {
                  binary: process.env.CHROMEDRIVER_BIN,
                },
              },
            }
          : undefined,
    },
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  publicDir: "./public",
});

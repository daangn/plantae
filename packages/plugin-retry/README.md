# @plantae/plugin-retry

Retry plugin for Plantae.

It's highly inspired by [Ky's retry](https://github.com/sindresorhus/ky#retry)

## Installation

```bash
# npm
npm install @plantae/plugin-retry

# yarn
yarn add @plantae/plugin-retry
```

## Usage

```ts
import retryPlugin from "@plantae/plugin-retry";

// retry 3 times
retryPlugin(3);

// or with options
retryPlugin({
  limit: 3,
  methods: ["GET", "POST"],
  statusCodes: [408, 429],
  maxRetryAfter: 1000,
  backoffLimit: 10000,
});
```

## Options

```ts
type PluginOptions =
  | {
      // default: 2
      limit?: number;

      // default: ["GET", "PUT", "HEAD", "OPTIONS", "DELETE"]
      methods?: string[];

      // default: [408, 413, 429, 500, 502, 503, 504]
      statusCodes?: number[];

      // default: undefined
      maxRetryAfter?: number;

      // default: undefined
      backoffLimit?: number;
    }
  | number;
```

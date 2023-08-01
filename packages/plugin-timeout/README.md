# @plantae/plugin-timeout

Timeout plugin for Plantae.

## Installation

```bash
# npm
npm install @plantae/plugin-timeout

# yarn
yarn add @plantae/plugin-timeout
```

## Usage

```ts
import timeoutPlugin from "@plantae/plugin-timeout";

const fetchWithTimeout = createFetch({
  client: fetch,
  plugins: [timeoutPlugin(5000)], // timeout after 5 seconds
});
```

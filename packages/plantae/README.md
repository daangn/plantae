# Plantae

**_"Apply the same middlewares to the all http clients"_**

Plantae is a Request & Response API based middleware generator compatible with the various http clients.

Currently, Plantae supports the following clients:

- Fetch
- Ky
- Axios

This is especially useful for the providers of enterprise tools that have to support multiple http clients at the same time.

It's so tiny and has no dependencies!

## Installation

```bash
# npm
npm install plantae

# yarn
yarn add plantae
```

## Usage

### Fetch

```ts
import { createFetch } from "plantae";
import myPlugin from "../myPlugin";

export const myFetch = createFetch({
  client: fetch,
  plugins: [myPlugin()],
});
```

### Ky

```ts
import { createKyHooks } from "plantae/ky";
import myPlugin from "../myPlugin";
import ky from "ky";

const hooks = createKyHooks({
  client: ky,
  plugins: [myPlugin()],
});

export const myKy = ky.extend({
  hooks,
});

// or directly extend on requests
ky("https://example.com", {
  hooks,
});
```

### Axios

```ts
import { createAxiosInterceptors } from "plantae/axios";
import myPlugin from "../myPlugin";
import axios from "axios";

const myAxios = axios.create();

const { request, response } = createAxiosInterceptors({
  client: myAxios,
  plugins: [myPlugin()],
});

myAxios.interceptors.request.use(request.onFulfilled, request.onRejected);
myAxios.interceptors.response.use(response.onFulfilled, response.onRejected);

export { myAxios };
```

## Plugins

### Official Plugins

- [@plantae/plugin-retry](packages/plugin-retry)
- [@plantae/plugin-timeout](packages/plugin-timeout)

### Plugin Example (Authorization)

```ts
import type { Plugin } from "plantae";

export default function AuthPlugin(): Plugin<{
  token: string;
}> {
  const context = {
    token: "token",
  };

  return {
    name: "plugin-auth",
    context,
    hooks: {
      beforeRequest: (req) => {
        req.headers.set("Authorization", context.token);

        return req;
      },
      afterResponse: async (res, req, retry) => {
        if (res.status === 401) {
          const refresh = new Request("https://example.com/refresh-token");
          const token = await retry(refresh).then((res) => res.text());

          context.token = token;

          req.headers.set("Authorization", `token ${token}`);

          return retry(req);
        }
        return res;
      },
    },
  };
}
```

### Publish a Plugin

#### Convention

- Plugins should have a clear name with `plantae-plugin-` prefix.
- Include `plantae-plugin` keywords in package.json.

## TODO

- Make 100% compatibility with Request & Response API.

Currently implemented:

````ts
export type AdapterRequest = Pick<
  Request,
  "body" | "headers" | "method" | "url" | "signal"
>;

export type AdapterResponse = Pick<
  Response,
  "body" | "headers" | "ok" | "status" | "statusText" | "url"
>;```
````

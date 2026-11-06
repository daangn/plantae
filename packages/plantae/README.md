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

`client` is required and executes retries. Pass the instance that receives the
Plantae interceptors to keep its other interceptors active during retries. You can
also explicitly supply a separate instance. The original request configuration
(including its adapter) is forwarded to retries.

The `retry` callback does not run Plantae hooks again. HTTP error responses are
returned to the calling plugin so it can decide whether to retry again or throw
an error. Plugins must bound their own retry loops. The final response is checked
using the original request's `validateStatus`; network and cancellation errors
still reject immediately. Other interceptors on a supplied client continue to run.

### Migrating to 0.4.0

The Axios retry behavior differs from 0.3.3 and earlier:

- Plantae hooks run once for the outer request. Apply any changes needed for a
  retry directly to the request passed to `retry()`.
- `await retry(request)` returns HTTP error responses as well as successful
  responses. Check `response.status` or `response.ok` instead of relying on
  `catch` for HTTP errors, and bound any retry loop. Network failures and
  cancellations still reject.
- After plugins finish, the final response is checked against the original
  `validateStatus`, including responses handled by the fulfilled interceptor.

Version 0.4.0 contains the same runtime changes as 0.3.4, which was incorrectly
released as a patch. Upgrade directly to 0.4.0 to adopt this behavior explicitly.

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

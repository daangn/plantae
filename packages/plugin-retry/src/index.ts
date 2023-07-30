import type { Plugin } from "plantae";

type PluginOptions =
  | {
      limit?: number;
      methods?: string[];
      statusCodes?: number[];
      maxRetryAfter?: number;
      backoffLimit?: number;
    }
  | number;

const defaultOptions = {
  limit: 2,
  methods: ["GET", "PUT", "HEAD", "OPTIONS", "DELETE"],
  statusCodes: [408, 413, 429, 500, 502, 503, 504],
};

const calculateBackoff = (attemptCount: number, backoffLimit?: number) => {
  const backoff = 0.3 * 2 ** (attemptCount - 1) * 1000;

  return backoffLimit ? Math.min(backoff, backoffLimit) : backoff;
};

export default function retryPlugin(options: PluginOptions): Plugin {
  const { limit, methods, statusCodes, backoffLimit, maxRetryAfter } = {
    ...defaultOptions,
    ...(typeof options === "number" ? { limit: options } : options),
  };

  return {
    name: "plugin-retry",
    hooks: {
      afterResponse: async (res, req, retry) => {
        const { status } = res;
        const { method } = req;

        if (!statusCodes.includes(status) || !methods.includes(method)) {
          return res;
        }

        for (let i = 0; i < limit; i++) {
          const retryAfterValue = res.headers.get("retry-after");

          let retryAfterSeconds = 0;

          if (retryAfterValue) {
            retryAfterSeconds = parseInt(retryAfterValue);

            if (isNaN(retryAfterSeconds)) {
              retryAfterSeconds =
                (new Date(retryAfterValue).getTime() - Date.now()) / 1000;
            }

            if (maxRetryAfter) {
              retryAfterSeconds = Math.min(retryAfterSeconds, maxRetryAfter);
            }
          }

          const delay = Math.max(
            calculateBackoff(i + 1, backoffLimit),
            retryAfterSeconds
          );

          res =
            delay <= 0
              ? await retry(req)
              : await new Promise((resolve) => {
                  setTimeout(() => {
                    resolve(retry(req));
                  }, delay);
                });
        }

        return res;
      },
    },
  };
}

import type { Plugin } from "plantae";

export default function timeoutPlugin(timeout: number): Plugin {
  return {
    name: "plugin-timeout",
    hooks: {
      beforeRequest: async (req) => {
        const controller = new AbortController();

        setTimeout(() => {
          controller.abort();
        }, timeout);

        return {
          ...req,
          signal: controller.signal,
        };
      },
    },
  };
}

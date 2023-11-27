export const baseURL = "http://localhost:5173/api";

export const base = (path: string) => `${baseURL}${path}`;

export const Status = {
  OK: "OK",
  BAD: "BAD",
} as const;

export const baseURL = "http://localhost:5173/api";

export const base = (path: string) => `${baseURL}${path}`;

export const Status = {
  OK: 200,
  BAD: 400,
} as const;

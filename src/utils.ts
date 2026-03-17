import type { ProxyErrorResponse } from "./types";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function errorResponse(
  message: string,
  status = 400,
  details?: unknown
): Response {
  const body: ProxyErrorResponse = details
    ? { error: message, details }
    : { error: message };

  return json(body, status);
}

export function getByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
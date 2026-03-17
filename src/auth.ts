import type { Env } from "./config";

export function isAuthorized(request: Request, env: Env): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;

  return authHeader === `Bearer ${env.APP_PROXY_TOKEN}`;
}
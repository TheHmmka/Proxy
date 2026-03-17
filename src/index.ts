import { ALLOWED_MODELS, GEMINI_BASE_URL, MAX_BODY_BYTES } from "./config";
import type { Env } from "./config";
import { isAuthorized } from "./auth";
import { errorResponse, getByteLength, json } from "./utils";
import type { ProxyGenerateContentRequest } from "./types";

async function handleGenerateContent(request: Request, env: Env): Promise<Response> {
  if (!isAuthorized(request, env)) {
    return errorResponse("Unauthorized", 401);
  }

  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) {
    return errorResponse("Unsupported Content-Type", 415);
  }

  const contentLengthHeader = request.headers.get("Content-Length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isNaN(contentLength) && contentLength > MAX_BODY_BYTES) {
      return errorResponse("Request too large", 413);
    }
  }

  const bodyText = await request.text();
  if (getByteLength(bodyText) > MAX_BODY_BYTES) {
    return errorResponse("Request too large", 413);
  }

  let body: ProxyGenerateContentRequest;

  try {
    body = JSON.parse(bodyText) as ProxyGenerateContentRequest;
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  if (!body || typeof body !== "object") {
    return errorResponse("Invalid request body", 400);
  }

  const { model, payload } = body;

  if (typeof model !== "string" || model.trim().length === 0) {
    return errorResponse("Missing model", 400);
  }

  if (!ALLOWED_MODELS.has(model)) {
    return errorResponse("Model is not allowed", 400, {
      allowedModels: Array.from(ALLOWED_MODELS),
    });
  }

  if (payload == null || typeof payload !== "object") {
    return errorResponse("Missing payload", 400);
  }

  const upstreamURL =
    `${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent`;

  const upstreamResponse = await fetch(upstreamURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.GEMINI_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const upstreamText = await upstreamResponse.text();
  const upstreamContentType =
    upstreamResponse.headers.get("Content-Type") ?? "application/json; charset=utf-8";

  return new Response(upstreamText, {
    status: upstreamResponse.status,
    headers: {
      "Content-Type": upstreamContentType,
      "Cache-Control": "no-store",
    },
  });
}

function handleHealthcheck(): Response {
  return json({
    ok: true,
    service: "aitools-gemini-proxy",
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);

      if (request.method === "GET" && url.pathname === "/health") {
        return handleHealthcheck();
      }

      if (request.method === "POST" && url.pathname === "/generate-content") {
        return await handleGenerateContent(request, env);
      }

      return errorResponse("Not found", 404);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal server error";

      return errorResponse("Internal server error", 500, { message });
    }
  },
};
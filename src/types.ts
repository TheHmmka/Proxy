export interface ProxyGenerateContentRequest {
  model: string;
  payload: unknown;
}

export interface ProxyErrorResponse {
  error: string;
  details?: unknown;
}
// Mirrors the backend error shape: { error: { code, message, retryable } }.
export class ApiError extends Error {
  constructor(code, message, retryable = false) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.retryable = retryable;
  }
}

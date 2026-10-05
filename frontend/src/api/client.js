// The only module screens import for data. In Stage 1 it re-exports the
// in-browser mock; in Stage 2 these functions become HTTP calls to FastAPI
// with the same names and return shapes.
export * from "./mockApi.js";
export { ApiError } from "./errors.js";

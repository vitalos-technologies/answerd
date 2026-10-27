// API mode is on when NEXT_PUBLIC_ANSWERD_API_URL is set (e.g. https://answerd-staging-api.onrender.com).
// Without it the prototype runs on its mock store, as before. Mock mode is the default.
export const API_URL = (process.env.NEXT_PUBLIC_ANSWERD_API_URL ?? "").replace(/\/+$/, "")
export const apiMode = API_URL !== ""

/** The browser calls the API through this same-origin proxy (app/api/answerd/[...path]): the API's CORS allows the production website only. */
export const PROXY_BASE = "/api/answerd"

/** Realtime events (WebSocket) on the API's own origin. */
export const REALTIME_URL = API_URL ? `${API_URL.replace(/^http/, "ws")}/v1/realtime` : ""

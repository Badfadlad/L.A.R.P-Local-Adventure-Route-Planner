import axios from "axios";

// One Axios instance for every request to the FastAPI backend.
// The base URL comes from .env.local, e.g.
//   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Attach the saved login token (if any) to every request, so pages that
// need a logged-in user don't have to add the header themselves.
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/**
 * Turn an Axios error from the backend into a message we can show the user.
 * FastAPI sends errors as { detail: "..." }, or for validation errors as
 * { detail: [{ msg: "...", loc: [...] }, ...] }.
 */
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error?.response) {
    return "Can't reach the server. Is the backend running?";
  }
  const detail = error.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
        const msg = (d.msg || "").replace(/^Value error, /, "");
        return field && field !== "body" ? `${field}: ${msg}` : msg;
      })
      .join(" ");
  }
  return fallback;
}

export default api;

import axios from "axios";

// One Axios instance for every request to the FastAPI backend.
// The base URL comes from .env.local, e.g.
//   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
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

// Security: if the backend says our token is no longer valid (expired or
// tampered with), forget it right away instead of keeping a dead token around.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("larp:logout"));
    }
    return Promise.reject(error);
  }
);

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

// Resource helpers keep endpoint details out of UI components. They can be
// reused by the Discover, Route Builder, and Account screens in later parts.
export const placesApi = {
  list: (params = {}) => api.get("/places", { params }),
  get: (placeId) => api.get(`/places/${placeId}`),
  create: (place) => api.post("/places", place),
  update: (placeId, place) => api.patch(`/places/${placeId}`, place),
  remove: (placeId) => api.delete(`/places/${placeId}`),
};

export const tripsApi = {
  list: (params = {}) => api.get("/trips", { params }),
  get: (tripId) => api.get(`/trips/${tripId}`),
  create: (trip) => api.post("/trips", trip),
  update: (tripId, trip) => api.patch(`/trips/${tripId}`, trip),
  remove: (tripId) => api.delete(`/trips/${tripId}`),
  complete: (tripId) => api.post(`/trips/${tripId}/complete`),
  addStop: (tripId, stop) => api.post(`/trips/${tripId}/stops`, stop),
  updateStop: (tripId, stopId, stop) => api.patch(`/trips/${tripId}/stops/${stopId}`, stop),
  removeStop: (tripId, stopId) => api.delete(`/trips/${tripId}/stops/${stopId}`),
  reorderStops: (tripId, stopIds) => api.put(`/trips/${tripId}/stops/order`, { stop_ids: stopIds }),
};

export const bookmarksApi = {
  list: () => api.get("/bookmarks"),
  create: (placeId, note) => api.post("/bookmarks", { place_id: placeId, note: note || null }),
  remove: (bookmarkId) => api.delete(`/bookmarks/${bookmarkId}`),
};

export const reviewsApi = {
  mine: () => api.get("/reviews/mine"),
  forPlace: (placeId) => api.get("/reviews", { params: { place_id: placeId } }),
  create: (review) => api.post("/reviews", review),
  remove: (reviewId) => api.delete(`/reviews/${reviewId}`),
};

export const usersApi = {
  profile: () => api.get("/users/me"),
  updateProfile: (profile) => api.patch("/users/me", profile),
};

export default api;

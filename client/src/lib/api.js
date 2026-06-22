import axios from "axios";

// Base URL comes from Vite env, e.g. VITE_API_URL=http://localhost:8000
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized 401 handling — bounce to sign-in if the token is dead
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Avoid a hard redirect loop if we're already on the sign-in page
      if (!window.location.pathname.startsWith("/sign-in")) {
        window.location.href = "/sign-in";
      }
    }
    return Promise.reject(error);
  }
);

// ---- Endpoint groups -------------------------------------------------
// Adjust paths here if your FastAPI routers use different prefixes.

export const wisdomApi = {
  // POST /wisdom/search { query: string } -> [{ id, title, source, tradition, verse, category }]
  search: (query) => api.post("/wisdom/search", { query }),
};

export const libraryApi = {
  // GET /library/traditions -> [{ id, name, slug, tagline, textCount, icon, color }]
  getTraditions: () => api.get("/library/traditions"),
  // GET /library/stats -> { sacredTexts, traditions, yearsOfWisdom }
  getStats: () => api.get("/library/stats"),
  // GET /library/traditions/:slug -> { id, name, slug, tagline, description }
  getTraditionBySlug: (slug) => api.get(`/library/traditions/${slug}`),
  // GET /library/traditions/:slug/texts -> [{ id, title, description, slug }]
  getTraditionTexts: (slug) => api.get(`/library/traditions/${slug}/texts`),
};

export const scriptureApi = {
  // GET /scriptures/:id -> { id, title, source, tradition, category, verse, fullText, keyInsight }
  getById: (id) => api.get(`/scriptures/${id}`),
  // POST /scriptures/:id/bookmark
  bookmark: (id) => api.post(`/scriptures/${id}/bookmark`),
};

export const chatApi = {
  // POST /chat/:scriptureId { message: string } -> { id, role, content, timestamp }
  sendMessage: (scriptureId, message) =>
    api.post(`/chat/${scriptureId}`, { message }),
  // GET /chat/:scriptureId/history -> [{ id, role, content, timestamp }]
  getHistory: (scriptureId) => api.get(`/chat/${scriptureId}/history`),
};

export const journeyApi = {
  // GET /journey/summary -> { insightsSaved, weeksActive, growthScore }
  getSummary: () => api.get("/journey/summary"),
  // GET /journey/milestones -> [{ id, date, label }]
  getMilestones: () => api.get("/journey/milestones"),
  // GET /journey/insights -> [{ id, source, title, savedAt, quote, note, likes, replies }]
  getInsights: () => api.get("/journey/insights"),
};

export const authApi = {
  // POST /auth/login { email, password } -> { token, user }
  login: (email, password) => api.post("/auth/login", { email, password }),
  // GET /auth/me -> { id, name, initial, email }
  me: () => api.get("/auth/me"),
};
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 -> clear token and redirect to sign-in
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.startsWith("/sign-in")) {
        window.location.href = "/sign-in";
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  // POST /auth/signup { name, email, password } -> sends OTP
  signup: (name, email, password) => api.post("/auth/signup", { name, email, password }),
  // POST /auth/verify-otp { email, otp } -> { token, user }
  verifyOTP: (email, otp) => api.post("/auth/verify-otp", { email, otp }),
  // POST /auth/signin { email, password } -> { token, user }
  login: (email, password) => api.post("/auth/signin", { email, password }),
  // GET /auth/me -> current user
  me: () => api.get("/auth/me"),
};

// ── Library ──────────────────────────────────────────────────────────────────
export const libraryApi = {
  getTraditions: () => api.get("/library/traditions"),
  getStats: () => api.get("/library/stats"),
  getTraditionBySlug: (slug) => api.get(`/library/traditions/${slug}`),
  getTraditionTexts: (slug) => api.get(`/library/traditions/${slug}/texts`),
};

// ── Wisdom search ─────────────────────────────────────────────────────────────
export const wisdomApi = {
  search: (query) => api.post("/wisdom/search", { query }),
};

// ── Journey ──────────────────────────────────────────────────────────────────
export const journeyApi = {
  getSummary: () => api.get("/journey/summary"),
  getMilestones: () => api.get("/journey/milestones"),
  getInsights: () => api.get("/journey/insights"),
};
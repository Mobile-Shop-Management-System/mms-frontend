import axios from "axios";
import { getApiErrorMessage } from "@/lib/api-feedback";

// Set NEXT_PUBLIC_API_URL in .env for each deployment environment.
// The fallback keeps local development working before the file is configured.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach access token ──────────────────────────────
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: auto-refresh on 401 ────────────────────────────
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) =>
    error ? prom.reject(error) : prom.resolve(token),
  );
  failedQueue = [];
}

function attachUserMessage(error) {
  const message = getApiErrorMessage(error);
  error.userMessage = message;
  if (error.response?.data && typeof error.response.data === "object") {
    error.response.data.message = message;
  }
  return error;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Don't redirect on 401 for login/register endpoints
    if (
      error.response?.status === 401 &&
      (original.url?.includes("/auth/login/") ||
        original.url?.includes("/auth/register/"))
    ) {
      return Promise.reject(attachUserMessage(error));
    }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(attachUserMessage(error));
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        })
        .catch((err) => Promise.reject(err));
    }

    original._retry = true;
    isRefreshing = true;

    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) {
      isRefreshing = false;
      _redirectToLogin();
      return Promise.reject(attachUserMessage(error));
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
        refresh,
      });
      const newAccess = data.data?.access ?? data.access;
      localStorage.setItem("access_token", newAccess);
      apiClient.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
      processQueue(null, newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return apiClient(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      _redirectToLogin();
      return Promise.reject(attachUserMessage(refreshError));
    } finally {
      isRefreshing = false;
    }
  },
);

function _redirectToLogin() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/auth/login";
  }
}

export default apiClient;

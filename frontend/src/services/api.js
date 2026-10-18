import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const ACCESS_TOKEN_KEY = "sagarsports_access_token";
const REFRESH_TOKEN_KEY = "sagarsports_refresh_token";

export const tokenStorage = {
  getAccessToken: () =>
    localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem("novaris_access_token"),
  getRefreshToken: () =>
    localStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem("novaris_refresh_token"),
  setTokens: (access, refresh) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    }
    localStorage.removeItem("novaris_access_token");
    localStorage.removeItem("novaris_refresh_token");
  },
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem("novaris_access_token");
    localStorage.removeItem("novaris_refresh_token");
  },
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((requestConfig) => {
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) {
    requestConfig.headers.Authorization = `Bearer ${accessToken}`;
  }
  return requestConfig;
});

// The API wraps every validation failure as
//   { message: "Validation failed.", errors: { field: ["reason", ...] } }
// Every slice/page shows only `message`, so customers saw just
// "Validation failed." with no hint what to fix. Swap in the first concrete
// reason here, once, so register / address / review / reset forms all
// show it.
const humanizeValidationMessage = (error) => {
  const data = error.response?.data;
  if (!data || data.message !== "Validation failed." || typeof data.errors !== "object") return;

  const reasons = [];
  Object.entries(data.errors || {}).forEach(([field, detail]) => {
    const texts = (Array.isArray(detail) ? detail : [detail]).filter((t) => typeof t === "string");
    texts.forEach((text) => {
      if (field === "non_field_errors" || !/^This field/i.test(text)) {
        reasons.push(text);
      } else {
        const label = field.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
        reasons.push(`${label}: ${text}`);
      }
    });
  });
  if (reasons.length) data.message = reasons.slice(0, 2).join(" ");
};

let isRefreshing = false;
let pendingQueue = [];

const resolvePendingQueue = (error, newAccessToken) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(newAccessToken);
    }
  });
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    humanizeValidationMessage(error);
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      tokenStorage.getRefreshToken()
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenStorage.getRefreshToken();
        const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        tokenStorage.setTokens(data.access, data.refresh);
        resolvePendingQueue(null, data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        resolvePendingQueue(refreshError, null);
        tokenStorage.clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

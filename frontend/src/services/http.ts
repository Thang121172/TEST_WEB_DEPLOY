import axios, {
  type InternalAxiosRequestConfig,
  type AxiosError,
} from "axios";

// Base URL API
// - docker compose: VITE_API_BASE=http://backend:8000/api
// - dev local vite proxy: fallback "/api"
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

const api = axios.create({
  baseURL: API_BASE, // Sử dụng proxy "/api" hoặc biến môi trường
  withCredentials: false,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================
// REQUEST INTERCEPTOR
// - Gắn Authorization: Bearer <authToken>
// ==========================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("authToken"); // 🔁 đồng bộ với AuthContext.tsx
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================
// RESPONSE INTERCEPTOR
// - Nếu backend trả về 401 => xoá token local
// ==========================
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      // phiên đăng nhập hết hạn / token sai
      localStorage.removeItem("authToken");
      console.warn("[API] Unauthorized. Clearing authToken.");
    }
    return Promise.reject(err);
  }
);

export default api;
export { API_BASE };

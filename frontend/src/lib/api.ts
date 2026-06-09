import axios, { type InternalAxiosRequestConfig } from "axios";

function authInterceptor(config: InternalAxiosRequestConfig) {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("firebaseToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  timeout: 30000,
});

export const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  timeout: 30000,
});

api.interceptors.request.use(authInterceptor);
authApi.interceptors.request.use(authInterceptor);

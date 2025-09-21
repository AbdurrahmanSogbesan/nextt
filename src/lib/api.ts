import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor (e.g., to add auth token)
api.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (e.g., to handle global errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // if (error.response && error.response.status === 401) {
    //   // Redirect to login page
    // }
    return Promise.reject(error);
  }
);

export const apiGet = <T = unknown>(...args: Parameters<typeof api.get>) =>
  api.get<T>(...args).then((r) => r.data);
export const apiPost = <T = unknown>(...args: Parameters<typeof api.post>) =>
  api.post<T>(...args).then((r) => r.data);
export const apiDelete = <T = unknown>(
  ...args: Parameters<typeof api.delete>
) => api.delete<T>(...args).then((r) => r.data);
export const apiPatch = <T = unknown>(...args: Parameters<typeof api.patch>) =>
  api.patch<T>(...args).then((r) => r.data);
export const apiRequest = <T = unknown>(
  ...args: Parameters<typeof api.request>
) => api.request<T>(...args).then((r) => r.data);

export default api;

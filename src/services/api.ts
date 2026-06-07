import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

// Backend API Base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Bắt buộc để tự động gửi kèm JWT Token trong HttpOnly Cookie
  withCredentials: true
})

// ────────────────────────────────────────────────
// Request Interceptor: có thể dùng để gắn loading flag
// ────────────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  return config
})

// ────────────────────────────────────────────────
// Response Interceptor: Xử lý lỗi tập trung
// ────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Nếu đang ở phân hệ admin thì chuyển về trang đăng nhập
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

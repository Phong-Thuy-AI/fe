import { io, Socket } from 'socket.io-client'

const getSocketUrl = () => {
  const envSocketUrl = import.meta.env.VITE_SOCKET_URL
  if (envSocketUrl) return envSocketUrl

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  if (apiBaseUrl) {
    try {
      // Trích xuất origin (ví dụ: https://api.dinhanphongthuyso.com) từ API Base URL
      return new URL(apiBaseUrl).origin
    } catch (e) {
      return ''
    }
  }

  return 'http://localhost:3000'
}

const SOCKET_URL = getSocketUrl()

// Khởi tạo socket với autoConnect: false để kết nối thủ công khi cần
// withCredentials: true để gửi kèm JWT HttpOnly Cookie cho middleware xác thực
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['polling']
})

// Lắng nghe lỗi kết nối toàn cục
socket.on('connect_error', (err) => {
  console.warn('[Socket] Connection error:', err.message)
})

export default socket

import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

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

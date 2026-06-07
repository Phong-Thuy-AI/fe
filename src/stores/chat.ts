import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import { socket } from '@/services/socket'
import type { ChatMessage, ChatRoom } from '@/types'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const activeRooms = ref<ChatRoom[]>([])
  const currentRoomId = ref<number | null>(null)
  const isConnected = ref(false)
  const isLoadingHistory = ref(false)

  function connect() {
    if (!socket.connected) socket.connect()

    socket.on('connect', () => { isConnected.value = true })
    socket.on('disconnect', () => { isConnected.value = false })

    socket.on('receive_message', (msg: ChatMessage) => {
      // Tránh duplicate nếu cùng roomId đang mở
      if (msg.roomId === currentRoomId.value) {
        messages.value.push(msg)
      }
    })

    socket.on('new_chat_room', (room: ChatRoom) => {
      if (!activeRooms.value.find(r => r.id === room.id)) {
        activeRooms.value.unshift(room)
      }
    })
  }

  function disconnect() {
    socket.off('receive_message')
    socket.off('new_chat_room')
    socket.off('connect')
    socket.off('disconnect')
    if (socket.connected) socket.disconnect()
    isConnected.value = false
    currentRoomId.value = null
    messages.value = []
  }

  async function joinRoom(roomId: number) {
    isLoadingHistory.value = true
    messages.value = []
    currentRoomId.value = roomId
    try {
      const res = await api.get<{ data: { messages: ChatMessage[] } }>(`/chats/rooms/${roomId}/messages`)
      messages.value = res.data.data.messages
    } finally {
      isLoadingHistory.value = false
    }
    socket.emit('join_room', roomId)
  }

  function sendMessage(message: string) {
    if (!currentRoomId.value || !message.trim()) return
    socket.emit('send_message', { roomId: currentRoomId.value, message: message.trim() })
  }

  async function fetchActiveRooms() {
    const res = await api.get<{ data: ChatRoom[] }>('/chats/rooms/active')
    activeRooms.value = res.data.data
  }

  return {
    messages, activeRooms, currentRoomId, isConnected, isLoadingHistory,
    connect, disconnect, joinRoom, sendMessage, fetchActiveRooms,
  }
})

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

  const lastReadMap = ref<Record<number, number>>({})

  function loadLastReadMap() {
    try {
      lastReadMap.value = JSON.parse(localStorage.getItem('admin_last_read') || '{}')
    } catch {
      lastReadMap.value = {}
    }
  }

  function saveLastReadMap() {
    localStorage.setItem('admin_last_read', JSON.stringify(lastReadMap.value))
  }

  function connect() {
    if (!socket.connected) socket.connect()

    socket.on('connect', () => { isConnected.value = true })
    socket.on('disconnect', () => { isConnected.value = false })

    socket.on('receive_message', (msg: ChatMessage) => {
      if (msg.roomId === currentRoomId.value) {
        messages.value.push(msg)
        lastReadMap.value[msg.roomId] = msg.id
        saveLastReadMap()
      } else {
        const room = activeRooms.value.find(r => r.id === msg.roomId)
        if (room) {
          room.unreadCount = (room.unreadCount || 0) + 1
          room.lastMessage = msg
          
          const idx = activeRooms.value.indexOf(room)
          if (idx > 0) {
            activeRooms.value.splice(idx, 1)
            activeRooms.value.unshift(room)
          }
        }
      }
    })

    socket.on('new_chat_room', (room: ChatRoom) => {
      if (!activeRooms.value.find(r => r.id === room.id)) {
        room.unreadCount = 1
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

      if (messages.value.length > 0) {
        const lastMsgId = messages.value[messages.value.length - 1].id
        lastReadMap.value[roomId] = lastMsgId
        saveLastReadMap()
      }

      const room = activeRooms.value.find(r => r.id === roomId)
      if (room) room.unreadCount = 0
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
    loadLastReadMap()
    const res = await api.get<{ data: ChatRoom[] }>('/chats/rooms/active')

    activeRooms.value = res.data.data.map(room => {
      const lastMsgId = room.lastMessage?.id
      if (lastMsgId) {
        if ((lastReadMap.value[room.id] && lastReadMap.value[room.id] >= lastMsgId) || room.lastMessage?.senderType === 'admin') {
          room.unreadCount = 0
        }
      }
      return room
    })
  }

  return {
    messages, activeRooms, currentRoomId, isConnected, isLoadingHistory,
    connect, disconnect, joinRoom, sendMessage, fetchActiveRooms,
  }
})

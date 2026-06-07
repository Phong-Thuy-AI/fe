import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import type { Order } from '@/types'

export interface OrderExtra {
  carrier?: string
  consultationTopic?: string
}

export const useOrderStore = defineStore('order', () => {
  const currentOrder = ref<Order | null>(null)
  const qrUrl = ref<string | null>(null)
  const chatRoomId = ref<number | null>(null)
  const isCreating = ref(false)
  let pollTimer: ReturnType<typeof setTimeout> | null = null

  async function createOrder(packageType: '200k' | '500k', extra?: OrderExtra) {
    isCreating.value = true
    try {
      const res = await api.post<{ data: { order: Order; qrUrl: string } }>('/orders', {
        packageType,
        ...(extra ?? {})
      })
      currentOrder.value = res.data.data.order
      qrUrl.value = res.data.data.qrUrl
      chatRoomId.value = null
    } finally {
      isCreating.value = false
    }
  }

  async function pollOnce(orderId: number): Promise<{ paid: boolean; expired: boolean }> {
    const res = await api.get<{ data: { paid: boolean; status: string; chatRoomId: number | null } }>(
      `/orders/${orderId}/status`
    )
    const { paid, status, chatRoomId: rid } = res.data.data
    if (currentOrder.value) currentOrder.value.status = status as Order['status']
    if (rid) chatRoomId.value = rid
    return { paid, expired: status === 'expired' }
  }

  function startPolling(orderId: number, onPaid: () => void, onExpired: () => void) {
    stopPolling()
    const tick = async () => {
      try {
        const { paid, expired } = await pollOnce(orderId)
        if (paid) { onPaid(); return }
        if (expired) { onExpired(); return }
      } catch { /* ignore, keep polling */ }
      pollTimer = setTimeout(tick, 5000)
    }
    tick()
  }

  function stopPolling() {
    if (pollTimer) { clearTimeout(pollTimer); pollTimer = null }
  }

  function clear() {
    stopPolling()
    currentOrder.value = null
    qrUrl.value = null
    chatRoomId.value = null
  }

  return { currentOrder, qrUrl, chatRoomId, isCreating, createOrder, startPolling, stopPolling, clear }
})

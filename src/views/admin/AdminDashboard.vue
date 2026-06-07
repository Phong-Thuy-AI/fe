<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { api } from '@/services/api'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { ZALO_LINK, ZALO_ADMIN_NUMBER } from '@/utils/constants'
import type { ChatRoom } from '@/types'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import GlassCard from '@/components/base/GlassCard.vue'

const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()

type Tab = 'chat' | 'config'
const activeTab = ref<Tab>('chat')
const newMessage = ref('')
const messagesEl = ref<HTMLElement | null>(null)

const geminiKey = ref('')
const configSaving = ref(false)
const configMsg = ref('')
const completingOrderId = ref<number | null>(null)

const selectedRoom = computed(() => {
  if (!chatStore.currentRoomId) return null
  return chatStore.activeRooms.find(r => r.id === chatStore.currentRoomId) ?? null
})

const selectedRoomIs500k = computed(() => (selectedRoom.value?.order as any)?.packageType === '500k')
const selectedRoomCarrier = computed(() => (selectedRoom.value?.order as any)?.carrier ?? null)
const selectedRoomTopic = computed(() => (selectedRoom.value?.order as any)?.consultationTopic ?? null)

async function selectRoom(room: ChatRoom) {
  await chatStore.joinRoom(room.id)
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

function sendMsg() {
  if (!newMessage.value.trim()) return
  chatStore.sendMessage(newMessage.value)
  newMessage.value = ''
}

function handleKey(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() }
}

async function completeOrder(orderId: number) {
  completingOrderId.value = orderId
  try {
    await api.patch(`/orders/${orderId}/complete`)
    await chatStore.fetchActiveRooms()
    // Remove completed room from active list
    const idx = chatStore.activeRooms.findIndex(r => r.orderId === orderId)
    if (idx !== -1) chatStore.activeRooms.splice(idx, 1)
    if (chatStore.currentRoomId && selectedRoom.value?.orderId === orderId) {
      chatStore.currentRoomId = null
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: { message?: string } } } }
    alert(err?.response?.data?.error?.message ?? 'Lỗi khi hoàn thành đơn hàng.')
  } finally {
    completingOrderId.value = null
  }
}

async function saveGeminiKey() {
  if (!geminiKey.value.trim()) return
  configSaving.value = true
  configMsg.value = ''
  try {
    await api.post('/admin/config', { key: 'GEMINI_API_KEY', value: geminiKey.value.trim() })
    configMsg.value = '✅ Đã lưu API key thành công.'
    geminiKey.value = ''
  } catch {
    configMsg.value = '❌ Lỗi khi lưu. Vui lòng thử lại.'
  } finally {
    configSaving.value = false
  }
}

async function triggerHoroscopes() {
  try {
    await api.post('/admin/trigger-horoscopes')
    configMsg.value = '✅ Đã kích hoạt job tạo tử vi. Đang chạy ngầm...'
  } catch {
    configMsg.value = '❌ Lỗi khi kích hoạt job.'
  }
}

async function logout() {
  await authStore.logout()
  router.replace('/admin/login')
}

onMounted(async () => {
  await nextTick()
  chatStore.connect()
  await chatStore.fetchActiveRooms()
})

onUnmounted(() => chatStore.disconnect())
</script>

<template>
  <div class="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
    <!-- Top bar -->
    <header class="shrink-0 border-b border-gold-500/10 bg-slate-900/70 backdrop-blur-md px-4 h-14 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-xl">🕉️</span>
        <span class="font-bold gold-gradient-text text-sm">Admin Dashboard</span>
        <span class="text-xs text-slate-500">{{ authStore.adminUsername }}</span>
      </div>
      <div class="flex items-center gap-2">
        <button @click="activeTab = 'chat'" :class="['text-xs px-3 py-1.5 rounded-lg transition', activeTab==='chat' ? 'bg-gold-500/20 text-gold-300' : 'text-slate-400 hover:text-slate-200']">💬 Phòng Chat</button>
        <button @click="activeTab = 'config'" :class="['text-xs px-3 py-1.5 rounded-lg transition', activeTab==='config' ? 'bg-gold-500/20 text-gold-300' : 'text-slate-400 hover:text-slate-200']">⚙️ Cấu Hình</button>
        <BaseButton variant="ghost" size="sm" @click="logout">Đăng xuất</BaseButton>
      </div>
    </header>

    <!-- Chat Tab -->
    <div v-if="activeTab === 'chat'" class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-72 shrink-0 border-r border-slate-800 flex flex-col overflow-hidden">
        <div class="px-4 py-3 border-b border-slate-800">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phòng Chat Active</p>
          <div class="flex items-center gap-1.5 mt-1">
            <span :class="chatStore.isConnected ? 'bg-green-400' : 'bg-red-500'" class="w-1.5 h-1.5 rounded-full" />
            <span class="text-xs text-slate-500">{{ chatStore.isConnected ? 'Đang kết nối' : 'Mất kết nối' }}</span>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto">
          <p v-if="chatStore.activeRooms.length === 0" class="text-xs text-slate-600 px-4 py-6 text-center">Chưa có phòng chat nào</p>
          <button
            v-for="room in chatStore.activeRooms"
            :key="room.id"
            @click="selectRoom(room)"
            :class="[
              'w-full text-left px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/40 transition-all',
              chatStore.currentRoomId === room.id ? 'bg-gold-500/10 border-l-2 border-l-gold-500' : '',
            ]"
          >
            <div class="flex items-center gap-1.5 mb-0.5">
              <span class="text-xs">{{ (room.order as any)?.packageType === '500k' ? '🌟' : '💬' }}</span>
              <span class="font-medium text-sm text-slate-200 truncate">{{ room.order?.user?.name ?? `Phòng #${room.id}` }}</span>
              <span v-if="room.sourceType === 'referral'" class="ml-auto text-xs bg-purple-500/15 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded-full shrink-0">🤝</span>
            </div>
            <div class="text-xs text-slate-500">{{ room.order?.user?.phone ?? '' }}</div>
            <div class="flex items-center gap-2 mt-0.5 flex-wrap">
              <span class="text-xs text-gold-500">Mệnh: {{ room.order?.user?.menh ?? '—' }}</span>
              <span class="text-xs text-slate-600">{{ (room.order as any)?.packageType }}</span>
            </div>
          </button>
        </div>
      </aside>

      <!-- Chat panel -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <div v-if="!selectedRoom" class="flex-1 flex items-center justify-center text-slate-600 flex-col gap-3">
          <span class="text-5xl">💬</span>
          <p>Chọn phòng chat bên trái để bắt đầu tư vấn</p>
        </div>

        <template v-else>
          <!-- Room header -->
          <div class="shrink-0 border-b border-slate-800 px-4 py-3 bg-slate-900/40 space-y-1">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-sm">{{ selectedRoom.order?.user?.name }}</span>
                  <span v-if="selectedRoom.sourceType === 'referral'" class="text-xs bg-purple-500/15 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded-full">🤝 Giới thiệu</span>
                </div>
                <div class="text-xs text-slate-500 mt-0.5">
                  {{ selectedRoom.order?.user?.phone }} ·
                  Mệnh {{ selectedRoom.order?.user?.menh }} ·
                  <span :class="selectedRoomIs500k ? 'text-purple-400' : 'text-gold-400'">
                    {{ selectedRoomIs500k ? '🌟 Gói 500k' : '💬 Gói 200k' }}
                  </span>
                  · {{ formatCurrency((selectedRoom.order as any)?.amount ?? 0) }}
                </div>
                <div v-if="selectedRoomCarrier" class="text-xs text-slate-500">📡 Nhà mạng: {{ selectedRoomCarrier }}</div>
                <div v-if="selectedRoomTopic" class="text-xs text-slate-500">💡 Vấn đề: {{ selectedRoomTopic }}</div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <!-- Zalo cho 500k -->
                <a v-if="selectedRoomIs500k" :href="ZALO_LINK" target="_blank">
                  <BaseButton size="sm" variant="ghost" class="!border-purple-500/40 !text-purple-300">
                    Zalo {{ ZALO_ADMIN_NUMBER }}
                  </BaseButton>
                </a>
                <BaseButton
                  v-if="(selectedRoom.order as any)?.status === 'paid'"
                  size="sm"
                  :loading="completingOrderId === (selectedRoom.order as any)?.id"
                  @click="selectedRoom.order && completeOrder((selectedRoom.order as any).id)"
                >
                  ✅ Hoàn thành đơn
                </BaseButton>
              </div>
            </div>
          </div>

          <!-- Messages -->
          <div ref="messagesEl" class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            <div v-if="chatStore.isLoadingHistory" class="flex justify-center py-6">
              <div class="w-5 h-5 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <template v-for="msg in chatStore.messages" :key="msg.id">
              <!-- System message -->
              <div v-if="msg.senderType === 'system'" class="flex justify-center my-2">
                <div class="bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-3 text-xs text-slate-400 max-w-sm whitespace-pre-wrap italic leading-relaxed">
                  {{ msg.message }}
                </div>
              </div>
              <!-- User / Admin messages -->
              <div v-else :class="['flex', msg.senderType === 'admin' ? 'justify-end' : 'justify-start']">
                <div :class="[
                  'max-w-xs sm:max-w-sm rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  msg.senderType === 'admin'
                    ? 'bg-gold-500/20 border border-gold-500/30 text-slate-100 rounded-br-sm'
                    : 'bg-slate-800 border border-slate-700/50 text-slate-200 rounded-bl-sm',
                ]">
                  <p class="whitespace-pre-wrap">{{ msg.message }}</p>
                  <p class="text-xs mt-1 opacity-40 text-right">{{ formatDate(msg.createdAt) }}</p>
                </div>
              </div>
            </template>
          </div>

          <!-- Input -->
          <div class="shrink-0 border-t border-slate-800 bg-slate-900/50 px-4 py-3">
            <div class="flex gap-2">
              <textarea
                v-model="newMessage"
                @keydown="handleKey"
                rows="1"
                placeholder="Nhập tin nhắn tư vấn..."
                class="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500/50 resize-none transition-all"
              />
              <BaseButton :disabled="!newMessage.trim()" @click="sendMsg">Gửi</BaseButton>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Config Tab -->
    <div v-if="activeTab === 'config'" class="flex-1 overflow-y-auto p-6">
      <div class="max-w-lg mx-auto space-y-6">
        <h2 class="text-lg font-bold gold-gradient-text">⚙️ Cấu Hình Hệ Thống</h2>
        <GlassCard class="p-5 space-y-4">
          <h3 class="font-semibold text-slate-200">🤖 Gemini AI API Key</h3>
          <p class="text-xs text-slate-400">Nhập API key mới để cập nhật. Key hiện tại đã được ẩn để bảo mật.</p>
          <BaseInput v-model="geminiKey" type="password" label="API Key mới" placeholder="AIza..." />
          <BaseButton :loading="configSaving" @click="saveGeminiKey">Lưu API Key</BaseButton>
        </GlassCard>
        <GlassCard class="p-5 space-y-4">
          <h3 class="font-semibold text-slate-200">📅 Tạo Tử Vi Thủ Công</h3>
          <p class="text-xs text-slate-400">Kích hoạt ngay job tạo 25 bản tử vi và gửi email cho subscribers. Thường chạy tự động lúc 0:00.</p>
          <BaseButton variant="ghost" @click="triggerHoroscopes">▶ Chạy ngay</BaseButton>
        </GlassCard>
        <p v-if="configMsg" :class="['text-sm px-4 py-2 rounded-lg', configMsg.startsWith('✅') ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10']">
          {{ configMsg }}
        </p>
      </div>
    </div>
  </div>
</template>

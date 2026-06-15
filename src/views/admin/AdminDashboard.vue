<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { api } from '@/services/api'
import { formatCurrency, formatDateTime } from '@/utils/helpers'

import type { ChatRoom } from '@/types'
import BaseButton from '@/components/base/BaseButton.vue'
import GlassCard from '@/components/base/GlassCard.vue'

const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()

type Tab = 'chat' | 'orders' | 'users' | 'emails' | 'config'
const activeTab = ref<Tab>('chat')
const newMessage = ref('')
const messagesEl = ref<HTMLElement | null>(null)

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
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: { message?: string } } } }
    alert(err?.response?.data?.error?.message ?? 'Lỗi khi hoàn thành đơn hàng.')
  } finally {
    completingOrderId.value = null
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

const simLastDigits = ref('')
const isConfirmingSim = ref(false)

async function confirmSim() {
  if (!selectedRoom.value || !selectedRoom.value.order) return
  const digits = simLastDigits.value.trim()
  if (!digits || !/^\d{2,3}$/.test(digits)) {
    alert('Vui lòng nhập đúng 2 hoặc 3 chữ số đuôi SIM mới.')
    return
  }
  isConfirmingSim.value = true
  try {
    const res = await api.post(`/admin/orders/${selectedRoom.value.order.id}/confirm-sim`, {
      lastDigits: digits
    })
    alert(`Chốt SIM thành công! Mã giới thiệu sinh ra: ${res.data.data.referralCode}`)
    
    if (selectedRoom.value.order.user) {
      selectedRoom.value.order.user.referralCode = res.data.data.referralCode
    }
    simLastDigits.value = ''
    
    // Re-join room to pull the new system message
    await chatStore.joinRoom(selectedRoom.value.id)
  } catch (err: any) {
    alert(err?.response?.data?.error?.message ?? 'Lỗi khi chốt SIM.')
  } finally {
    isConfirmingSim.value = false
  }
}

// Trạng thái Quản lý Đơn hàng
const orders = ref<any[]>([])
const loadingOrders = ref(false)
const orderSearch = ref('')
const orderStatusFilter = ref('all')

// Trạng thái Quản lý Khách hàng
const users = ref<any[]>([])
const loadingUsers = ref(false)
const userSearch = ref('')
const extendingUserId = ref<number | null>(null)

// Trạng thái Nhật ký Gửi Mail
const emailLogs = ref<any[]>([])
const loadingEmailLogs = ref(false)
const emailLogsSearch = ref('')
const emailLogsStatusFilter = ref('all')
const emailLogsDateFilter = ref('')

async function fetchEmailLogs() {
  loadingEmailLogs.value = true
  try {
    const res = await api.get<{ data: any[] }>('/admin/email-logs', {
      params: {
        status: emailLogsStatusFilter.value,
        search: emailLogsSearch.value,
        date: emailLogsDateFilter.value
      }
    })
    emailLogs.value = res.data.data
  } catch (err) {
    console.error('Lỗi khi tải nhật ký gửi mail:', err)
  } finally {
    loadingEmailLogs.value = false
  }
}

async function fetchOrders() {
  loadingOrders.value = true
  try {
    const res = await api.get<{ data: any[] }>('/admin/orders', {
      params: {
        status: orderStatusFilter.value,
        search: orderSearch.value
      }
    })
    orders.value = res.data.data
  } catch (err) {
    console.error('Lỗi khi tải đơn hàng:', err)
  } finally {
    loadingOrders.value = false
  }
}

async function fetchUsers() {
  loadingUsers.value = true
  try {
    const res = await api.get<{ data: any[] }>('/admin/users', {
      params: {
        search: userSearch.value
      }
    })
    users.value = res.data.data
  } catch (err) {
    console.error('Lỗi khi tải khách hàng:', err)
  } finally {
    loadingUsers.value = false
  }
}

async function manualApproveOrder(orderId: number) {
  completingOrderId.value = orderId
  try {
    await api.post(`/admin/orders/${orderId}/force-pay`)
    await fetchOrders()
    alert('Đã duyệt thanh toán đơn hàng thành công.')
  } catch (e: any) {
    alert(e?.response?.data?.error?.message ?? 'Lỗi khi duyệt đơn hàng.')
  } finally {
    completingOrderId.value = null
  }
}

async function extendUserSub(userId: number) {
  extendingUserId.value = userId
  try {
    await api.patch(`/admin/users/${userId}/extend`)
    await fetchUsers()
    alert('Gia hạn thêm 30 ngày xem tử vi thành công.')
  } catch (e: any) {
    alert(e?.response?.data?.error?.message ?? 'Lỗi khi gia hạn.')
  } finally {
    extendingUserId.value = null
  }
}

function isSubscriberActive(expiry: string | null) {
  if (!expiry) return false
  return new Date(expiry) > new Date()
}

const aiProvider = ref('gemini')
const geminiKey = ref('')
const openaiKey = ref('')
const claudeKey = ref('')
const aiProxyUrl = ref('')
const aiModel = ref('')
const aiModels = ref<string[]>([])
const loadingModels = ref(false)

const smtpHost = ref('')
const smtpPort = ref('587')
const smtpUser = ref('')
const smtpPass = ref('')
const emailFrom = ref('')
const testToEmail = ref('')

const testingConnection = ref(false)
const testingEmail = ref(false)

async function fetchConfigs() {
  configMsg.value = ''
  try {
    const res = await api.get<{ data: Record<string, string> }>('/admin/config/all')
    const data = res.data.data
    
    aiProvider.value = data.AI_PROVIDER || 'gemini'
    aiModel.value = data.AI_MODEL || ''
    
    geminiKey.value = data.GEMINI_API_KEY || ''
    openaiKey.value = data.OPENAI_API_KEY || ''
    claudeKey.value = data.CLAUDE_API_KEY || ''
    aiProxyUrl.value = data.AI_PROXY_URL || ''
    
    smtpHost.value = data.SMTP_HOST || ''
    smtpPort.value = data.SMTP_PORT || '587'
    smtpUser.value = data.SMTP_USER || ''
    smtpPass.value = data.SMTP_PASS || ''
    emailFrom.value = data.EMAIL_FROM || ''
    
    if (geminiKey.value || openaiKey.value || claudeKey.value) {
      await loadAiModels()
    }
  } catch (err) {
    console.error('Lỗi khi tải cấu hình:', err)
  }
}

async function loadAiModels() {
  loadingModels.value = true
  const activeKey = aiProvider.value === 'openai' 
    ? openaiKey.value 
    : (aiProvider.value === 'claude' ? claudeKey.value : geminiKey.value)
  try {
    const res = await api.get<{ data: string[] }>('/admin/ai/models', {
      params: {
        provider: aiProvider.value,
        apiKey: activeKey
      }
    })
    aiModels.value = res.data.data
    if (!aiModels.value.includes(aiModel.value)) {
      aiModel.value = aiModels.value[0] || ''
    }
  } catch (err: any) {
    console.error('Lỗi tải model:', err)
    alert(err?.response?.data?.error?.message ?? 'Lỗi khi tải danh sách model AI.')
  } finally {
    loadingModels.value = false
  }
}

async function testAi() {
  testingConnection.value = true
  const activeKey = aiProvider.value === 'openai' 
    ? openaiKey.value 
    : (aiProvider.value === 'claude' ? claudeKey.value : geminiKey.value)
  try {
    const res = await api.post<{ data: { answer: string } }>('/admin/ai/test-connection', {
      provider: aiProvider.value,
      apiKey: activeKey,
      model: aiModel.value
    })
    alert(`✅ Kết nối AI thành công!\nPhản hồi từ AI: "${res.data.data.answer}"`)
  } catch (err: any) {
    alert(err?.response?.data?.error?.message ?? 'Kết nối AI thất bại.')
  } finally {
    testingConnection.value = false
  }
}

async function testEmail() {
  if (!testToEmail.value) {
    alert('Vui lòng điền email nhận thử.')
    return
  }
  testingEmail.value = true
  try {
    await api.post('/admin/email/test-send', {
      host: smtpHost.value,
      port: smtpPort.value,
      user: smtpUser.value,
      pass: smtpPass.value,
      from: emailFrom.value,
      toEmail: testToEmail.value
    })
    alert('✅ Đã gửi email thử nghiệm thành công! Hãy kiểm tra hòm thư của bạn.')
  } catch (err: any) {
    alert(err?.response?.data?.error?.message ?? 'Gửi email thử nghiệm thất bại.')
  } finally {
    testingEmail.value = false
  }
}

async function saveAllConfigs() {
  configSaving.value = true
  configMsg.value = ''
  try {
    await api.post('/admin/config/batch', {
      configs: {
        AI_PROVIDER: aiProvider.value,
        AI_MODEL: aiModel.value,
        GEMINI_API_KEY: geminiKey.value,
        OPENAI_API_KEY: openaiKey.value,
        CLAUDE_API_KEY: claudeKey.value,
        AI_PROXY_URL: aiProxyUrl.value,
        SMTP_HOST: smtpHost.value,
        SMTP_PORT: smtpPort.value,
        SMTP_USER: smtpUser.value,
        SMTP_PASS: smtpPass.value,
        EMAIL_FROM: emailFrom.value
      }
    })
    configMsg.value = '✅ Đã lưu cấu hình hệ thống thành công.'
    await fetchConfigs()
  } catch (err) {
    configMsg.value = '❌ Lỗi khi lưu cấu hình. Vui lòng thử lại.'
  } finally {
    configSaving.value = false
  }
}

watch(activeTab, (newTab) => {
  if (newTab === 'orders') fetchOrders()
  if (newTab === 'users') fetchUsers()
  if (newTab === 'emails') fetchEmailLogs()
  if (newTab === 'config') fetchConfigs()
})

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
    <header class="shrink-0 border-b border-gold-500/10 bg-slate-900/70 backdrop-blur-md px-3 sm:px-4 h-14 flex items-center justify-between">
      <div class="items-center gap-1.5 sm:gap-3 hidden sm:flex">
        <img src="/image-bg.png" alt="Logo" class="w-6 h-6 rounded-full object-cover border border-gold-500/30 hidden sm:inline" />
        <span class="font-bold gold-gradient-text text-xs sm:text-sm hidden sm:inline">Admin Dashboard</span>
        <span class="font-bold gold-gradient-text text-xs sm:hidden">Admin</span>
        <span class="text-[10px] sm:text-xs text-slate-500 hidden md:inline">{{ authStore.adminUsername }}</span>
      </div>
      <div class="flex items-center gap-1 sm:gap-2 overflow-x-auto max-w-full whitespace-nowrap">
        <button @click="activeTab = 'chat'" :class="['text-[11px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-lg transition shrink-0', activeTab==='chat' ? 'bg-gold-500/20 text-gold-300' : 'text-slate-400 hover:text-slate-200']">
          <span class="hidden sm:inline">💬 Phòng Chat</span>
          <span class="inline sm:hidden">💬 Chat</span>
        </button>
        <button @click="activeTab = 'orders'" :class="['text-[11px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-lg transition shrink-0', activeTab==='orders' ? 'bg-gold-500/20 text-gold-300' : 'text-slate-400 hover:text-slate-200']">
          <span class="hidden sm:inline">📊 Đơn Hàng</span>
          <span class="inline sm:hidden">📊 Đơn</span>
        </button>
        <button @click="activeTab = 'users'" :class="['text-[11px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-lg transition shrink-0', activeTab==='users' ? 'bg-gold-500/20 text-gold-300' : 'text-slate-400 hover:text-slate-200']">
          <span class="hidden sm:inline">👥 Khách Hàng</span>
          <span class="inline sm:hidden">👥 Khách</span>
        </button>
        <button @click="activeTab = 'emails'" :class="['text-[11px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-lg transition shrink-0', activeTab==='emails' ? 'bg-gold-500/20 text-gold-300' : 'text-slate-400 hover:text-slate-200']">
          <span class="hidden sm:inline">📧 Nhật ký Mail</span>
          <span class="inline sm:hidden">📧 Mail</span>
        </button>
        <button @click="activeTab = 'config'" :class="['text-[11px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-lg transition shrink-0', activeTab==='config' ? 'bg-gold-500/20 text-gold-300' : 'text-slate-400 hover:text-slate-200']">
          <span class="hidden sm:inline">⚙️ Cấu Hình</span>
          <span class="inline sm:hidden">⚙️ Cài đặt</span>
        </button>
        <BaseButton variant="ghost" size="sm" class="!px-2 sm:!px-4 !py-1 text-[11px] sm:text-xs shrink-0" @click="logout">Đăng xuất</BaseButton>
      </div>
    </header>

    <!-- Chat Tab -->
    <div v-if="activeTab === 'chat'" class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <aside
        :class="[
          'shrink-0 border-r border-slate-800 flex flex-col overflow-hidden transition-all duration-300',
          chatStore.currentRoomId ? 'hidden md:flex md:w-72' : 'w-full md:w-72'
        ]"
      >
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
              'w-full text-left px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/40 transition-all relative',
              chatStore.currentRoomId === room.id ? 'bg-gold-500/10 border-l-2 border-l-gold-500' : '',
              room.unreadCount && room.unreadCount > 0 ? 'bg-slate-900/60 font-semibold' : '',
              room.status === 'closed' || room.order?.status === 'completed' ? 'opacity-70' : ''
            ]"
          >
            <!-- Badge đếm tin nhắn chưa đọc nổi bật -->
            <div v-if="room.unreadCount && room.unreadCount > 0" class="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[18px] text-center shadow-lg animate-pulse">
              {{ room.unreadCount }}
            </div>

            <div class="flex items-center gap-1.5 mb-0.5 pr-8">
              <span class="text-xs">{{ (room.order as any)?.packageType === '500k' ? '🌟' : '💬' }}</span>
              <span :class="['font-medium text-sm truncate', room.unreadCount && room.unreadCount > 0 ? 'text-white font-bold' : 'text-slate-200']">
                {{ room.order?.user?.name ?? `Phòng #${room.id}` }}
              </span>
              <span v-if="room.status === 'closed' || room.order?.status === 'completed'" class="text-xs text-green-400 font-bold shrink-0 ml-1" title="Đã hoàn thành">✓</span>
              <span v-if="room.sourceType === 'referral'" class="text-xs bg-purple-500/15 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded-full shrink-0">🤝</span>
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
      <div
        :class="[
          'flex-col overflow-hidden transition-all duration-300',
          chatStore.currentRoomId ? 'flex flex-1 w-full' : 'hidden md:flex md:flex-1'
        ]"
      >
        <div v-if="!selectedRoom" class="flex-1 flex items-center justify-center text-slate-600 flex-col gap-3">
          <span class="text-5xl">💬</span>
          <p>Chọn phòng chat bên trái để bắt đầu tư vấn</p>
        </div>

        <template v-else>
          <!-- Room header -->
          <div class="shrink-0 border-b border-slate-800 px-4 py-3 bg-slate-900/40 space-y-2">
            <!-- Back button for mobile -->
            <div class="flex items-center md:hidden pb-1">
              <button
                @click="chatStore.currentRoomId = null"
                class="flex items-center gap-1.5 text-gold-300 hover:text-gold-200 text-xs font-semibold py-1.5 px-3 rounded-lg bg-gold-500/10 border border-gold-500/20 active:scale-95 transition-all"
              >
                ← Quay lại danh sách
              </button>
            </div>

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
                
                <!-- Chốt SIM mới & Sinh mã giới thiệu -->
                <div class="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                  <span class="text-xs text-slate-400 font-semibold shrink-0">Chốt SIM mới:</span>
                  <template v-if="selectedRoom.order?.user?.referralCode">
                    <span class="text-xs bg-gold-500/10 text-gold-400 border border-gold-500/20 px-2 py-0.5 rounded font-mono font-bold">
                      Mã GT: {{ selectedRoom.order.user.referralCode }}
                    </span>
                  </template>
                  <template v-else>
                    <input
                      v-model="simLastDigits"
                      type="text"
                      placeholder="Số đuôi SIM (2-3 số)"
                      maxlength="3"
                      class="w-32 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-100 focus:outline-none focus:border-gold-500"
                    />
                    <BaseButton
                      size="sm"
                      class="!py-0.5 !px-2 text-[10px] font-bold shrink-0"
                      :loading="isConfirmingSim"
                      @click="confirmSim"
                    >
                      🔑 Chốt SIM
                    </BaseButton>
                  </template>
                </div>
              </div>
              <div class="flex flex-wrap items-center justify-end gap-1.5 shrink-0 max-w-[50%] md:max-w-none">
                <!-- Zalo cho 500k -->
                <a v-if="selectedRoomIs500k && selectedRoom?.order?.user?.phone" :href="'https://zalo.me/' + selectedRoom.order.user.phone" target="_blank">
                  <BaseButton size="sm" variant="ghost" class="!px-2.5 sm:!px-4 !py-1 text-xs !border-purple-500/40 !text-purple-300 shrink-0">
                    Zalo {{ selectedRoom.order.user.phone }}
                  </BaseButton>
                </a>
                <BaseButton
                  v-if="(selectedRoom.order as any)?.status === 'paid'"
                  size="sm"
                  class="!px-2.5 sm:!px-4 !py-1 text-xs shrink-0"
                  :loading="completingOrderId === (selectedRoom.order as any)?.id"
                  @click="selectedRoom.order && completeOrder((selectedRoom.order as any).id)"
                >
                  ✅ Hoàn thành đơn
                </BaseButton>
                <span v-if="(selectedRoom.order as any)?.status === 'completed'" class="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1.5 rounded-lg font-semibold shrink-0">
                  ✅ Đã hoàn thành
                </span>
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
              <div v-if="msg.senderType === 'system'" class="flex justify-center my-4 w-full">
                <!-- Hộp quà chốt SIM đặc biệt -->
                <div v-if="msg.message.includes('🎁 MÃ GIỚI THIỆU CỦA BẠN:')" class="bg-gradient-to-br from-slate-900/90 to-purple-950/40 border border-gold-500/30 rounded-2xl p-6 text-center max-w-sm w-full shadow-xl relative overflow-hidden">
                  <!-- Background glows -->
                  <div class="absolute -top-12 -left-12 w-24 h-24 bg-gold-500/10 rounded-full blur-2xl pointer-events-none"></div>
                  <div class="absolute -bottom-12 -right-12 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div class="text-4xl mb-3 animate-bounce">🎉</div>
                  <h4 class="text-sm font-black text-gold-400 uppercase tracking-widest mb-1.5">Chốt SIM Thành Công!</h4>
                  <p class="text-[11px] text-slate-300 mb-4 leading-relaxed">
                    Chúc mừng khách hàng đã sở hữu số điện thoại mới đại cát. Mã giới thiệu:
                  </p>
                  <div class="bg-slate-950/80 border border-gold-500/30 rounded-xl py-2.5 px-6 inline-block font-mono text-xl font-black text-gold-400 tracking-widest shadow-inner mb-4">
                    {{ msg.message.replace('🎁 MÃ GIỚI THIỆU CỦA BẠN:', '').trim() }}
                  </div>
                  <div class="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 bg-slate-900/50 py-2 rounded-lg border border-slate-800/40">
                    <span>🎁</span> Đã tặng thêm <strong class="text-purple-400 font-bold">1 tháng tử vi hằng ngày</strong>
                  </div>
                </div>
                <div v-else class="bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-3 text-xs text-slate-400 max-w-sm whitespace-pre-wrap italic leading-relaxed">
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
                  <p class="text-xs mt-1 opacity-40 text-right">{{ formatDateTime(msg.createdAt) }}</p>
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

    <!-- Orders Tab -->
    <div v-if="activeTab === 'orders'" class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="max-w-6xl mx-auto space-y-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 class="text-xl font-bold gold-gradient-text">📊 Quản Lý Đơn Hàng</h2>
          <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <!-- Search -->
            <input
              v-model="orderSearch"
              type="text"
              placeholder="Tìm SĐT, Họ tên, Mã..."
              class="flex-1 sm:w-64 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-gold-500/50"
              @input="fetchOrders"
            />
            <!-- Filter -->
            <select
              v-model="orderStatusFilter"
              class="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold-500/50"
              @change="fetchOrders"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">🟡 Chờ thanh toán</option>
              <option value="paid">🔵 Đã thanh toán</option>
              <option value="completed">🟢 Đã hoàn thành</option>
              <option value="expired">⚪ Hết hạn</option>
            </select>
          </div>
        </div>

        <div v-if="loadingOrders" class="flex justify-center py-12">
          <div class="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>

        <div v-else-if="orders.length === 0" class="text-center py-12 text-slate-500">
          Không tìm thấy đơn hàng nào.
        </div>

        <div v-else class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table class="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr class="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th class="px-6 py-4">Mã đơn</th>
                <th class="px-6 py-4">Khách hàng</th>
                <th class="px-6 py-4">Gói dịch vụ</th>
                <th class="px-6 py-4">Số tiền</th>
                <th class="px-6 py-4">Trạng thái</th>
                <th class="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/50 text-sm">
              <tr v-for="order in orders" :key="order.id" class="hover:bg-slate-800/20 transition-all">
                <td class="px-6 py-4 font-mono font-medium text-slate-300">{{ order.paymentCode }}</td>
                <td class="px-6 py-4">
                  <div class="font-medium text-slate-200">{{ order.user?.name }}</div>
                  <div class="text-xs text-slate-500">{{ order.user?.phone }}</div>
                </td>
                <td class="px-6 py-4">
                  <span :class="order.packageType === '500k' ? 'text-purple-400 font-semibold' : 'text-gold-400'">
                    {{ order.packageType === '500k' ? '🌟 Gói 500k' : '💬 Gói 200k' }}
                  </span>
                  <div class="text-[11px] text-slate-500 mt-0.5">
                    {{ order.packageType === '500k' ? `Vấn đề: ${order.consultationTopic || '—'}` : `Nhà mạng: ${order.carrier || '—'}` }}
                  </div>
                </td>
                <td class="px-6 py-4 font-semibold text-slate-300">{{ formatCurrency(Number(order.amount)) }}</td>
                <td class="px-6 py-4">
                  <span v-if="order.status === 'pending'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">🟡 Chờ thanh toán</span>
                  <span v-else-if="order.status === 'paid'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">🔵 Đã thanh toán</span>
                  <span v-else-if="order.status === 'completed'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">🟢 Đã hoàn thành</span>
                  <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">⚪ Hết hạn</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-2">
                    <BaseButton
                      v-if="order.status === 'pending'"
                      size="sm"
                      variant="ghost"
                      class="!py-1 !px-2.5 text-xs"
                      :loading="completingOrderId === order.id"
                      @click="manualApproveOrder(order.id)"
                    >
                      Duyệt thanh toán
                    </BaseButton>
                    <BaseButton
                      v-if="order.status === 'paid'"
                      size="sm"
                      class="!py-1 !px-2.5 text-xs"
                      :loading="completingOrderId === order.id"
                      @click="completeOrder(order.id)"
                    >
                      Hoàn thành đơn
                    </BaseButton>
                    <span v-if="order.status === 'completed'" class="text-xs text-slate-500 py-1">Hoàn tất</span>
                    <span v-if="order.status === 'expired'" class="text-xs text-slate-500 py-1">Đã hết hạn</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Users Tab -->
    <div v-if="activeTab === 'users'" class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="max-w-6xl mx-auto space-y-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 class="text-xl font-bold gold-gradient-text">👥 Quản Lý Khách Hàng</h2>
          <div class="w-full sm:w-64">
            <input
              v-model="userSearch"
              type="text"
              placeholder="Tìm Họ tên, Số điện thoại..."
              class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-gold-500/50"
              @input="fetchUsers"
            />
          </div>
        </div>

        <div v-if="loadingUsers" class="flex justify-center py-12">
          <div class="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>

        <div v-else-if="users.length === 0" class="text-center py-12 text-slate-500">
          Không tìm thấy khách hàng nào.
        </div>

        <div v-else class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table class="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr class="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th class="px-6 py-4">Khách hàng</th>
                <th class="px-6 py-4">Ngày sinh (Dương lịch)</th>
                <th class="px-6 py-4">Giờ sinh / Mệnh</th>
                <th class="px-6 py-4">Hạn dùng gói tử vi</th>
                <th class="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/50 text-sm">
              <tr v-for="user in users" :key="user.id" class="hover:bg-slate-800/20 transition-all">
                <td class="px-6 py-4">
                  <div class="font-medium text-slate-200">{{ user.name }}</div>
                  <div class="text-xs text-slate-500">{{ user.phone }}</div>
                  <div v-if="user.email" class="text-xs text-slate-400 mt-0.5">{{ user.email }}</div>
                </td>
                <td class="px-6 py-4 text-slate-300">{{ user.dob }}</td>
                <td class="px-6 py-4 text-slate-300">
                  <div>Giờ: {{ user.tob }}</div>
                  <div class="text-xs text-gold-500 mt-0.5">Mệnh: {{ user.menh }}</div>
                </td>
                <td class="px-6 py-4">
                  <span v-if="isSubscriberActive(user.horoscopeExpiresAt)" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                    Hạn: {{ formatDateTime(user.horoscopeExpiresAt) }}
                  </span>
                  <span v-else class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    {{ user.horoscopeExpiresAt ? 'Hết hạn (' + formatDateTime(user.horoscopeExpiresAt) + ')' : 'Chưa đăng ký' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <BaseButton
                    size="sm"
                    variant="ghost"
                    class="!py-1 !px-2.5 text-xs"
                    :loading="extendingUserId === user.id"
                    @click="extendUserSub(user.id)"
                  >
                    +30 Ngày
                  </BaseButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Email Logs Tab -->
    <div v-if="activeTab === 'emails'" class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="max-w-6xl mx-auto space-y-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 class="text-xl font-bold gold-gradient-text">📧 Nhật Ký Gửi Mail Hằng Ngày</h2>
          <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <!-- Search -->
            <input
              v-model="emailLogsSearch"
              type="text"
              placeholder="Tìm Email, Họ tên, SĐT..."
              class="flex-1 sm:w-64 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-gold-500/50"
              @input="fetchEmailLogs"
            />
            <!-- Date Filter -->
            <input
              v-model="emailLogsDateFilter"
              type="date"
              class="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold-500/50"
              @change="fetchEmailLogs"
            />
            <!-- Status Filter -->
            <select
              v-model="emailLogsStatusFilter"
              class="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold-500/50"
              @change="fetchEmailLogs"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="success">🟢 Thành công</option>
              <option value="failed">🔴 Thất bại</option>
            </select>
          </div>
        </div>

        <div v-if="loadingEmailLogs" class="flex justify-center py-12">
          <div class="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>

        <div v-else-if="emailLogs.length === 0" class="text-center py-12 text-slate-500">
          Không tìm thấy nhật ký gửi mail nào.
        </div>

        <div v-else class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table class="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr class="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th class="px-6 py-4">Ngày nhận</th>
                <th class="px-6 py-4">Khách hàng</th>
                <th class="px-6 py-4">Mệnh / Vấn đề</th>
                <th class="px-6 py-4">Trạng thái</th>
                <th class="px-6 py-4">Chi tiết lỗi</th>
                <th class="px-6 py-4 text-right">Thời gian gửi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/50 text-sm">
              <tr v-for="log in emailLogs" :key="log.id" class="hover:bg-slate-800/20 transition-all">
                <td class="px-6 py-4 font-mono font-medium text-slate-300">{{ log.date }}</td>
                <td class="px-6 py-4">
                  <div class="font-medium text-slate-200">{{ log.user?.name || 'Khách vãng lai' }}</div>
                  <div class="text-xs text-slate-500">{{ log.email }}</div>
                  <div class="text-[11px] text-slate-500">{{ log.user?.phone || '' }}</div>
                </td>
                <td class="px-6 py-4 text-slate-300">
                  <div class="text-xs">Mệnh: <span class="text-gold-500 font-semibold">{{ log.user?.menh || '—' }}</span></div>
                  <div class="text-xs text-slate-400 mt-0.5">Vấn đề: {{ log.user?.focusArea || '—' }}</div>
                </td>
                <td class="px-6 py-4">
                  <span v-if="log.status === 'success'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">🟢 Thành công</span>
                  <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">🔴 Thất bại</span>
                </td>
                <td class="px-6 py-4 max-w-xs truncate" :title="log.error">
                  <span class="text-xs text-red-400/80 italic font-mono">{{ log.error || '—' }}</span>
                </td>
                <td class="px-6 py-4 text-right text-slate-400 font-mono text-xs">
                  {{ formatDateTime(log.sentAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Config Tab -->
    <div v-if="activeTab === 'config'" class="flex-grow overflow-y-auto p-4 sm:p-6">
      <div class="max-w-2xl mx-auto space-y-6">
        <h2 class="text-xl font-bold gold-gradient-text">⚙️ Cấu Hình Hệ Thống</h2>

        <!-- AI Config Card -->
        <GlassCard class="p-5 space-y-4">
          <h3 class="font-semibold text-slate-200 flex items-center gap-2 text-base">🤖 Cấu Hình Trí Tuệ Nhân Tạo (AI)</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Nhà cung cấp AI</label>
              <select
                v-model="aiProvider"
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold-500/50"
                @change="aiModels = []"
              >
                <option value="gemini">Gemini (Google)</option>
                <option value="openai">OpenAI</option>
                <option value="claude">Anthropic Claude</option>
              </select>
            </div>
            
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">API Key</label>
              <input
                v-if="aiProvider === 'openai'"
                v-model="openaiKey"
                type="password"
                placeholder="sk-..."
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold-500/50 font-mono"
              />
              <input
                v-else-if="aiProvider === 'claude'"
                v-model="claudeKey"
                type="password"
                placeholder="sk-ant-..."
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold-500/50 font-mono"
              />
              <input
                v-else
                v-model="geminiKey"
                type="password"
                placeholder="AIza..."
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold-500/50 font-mono"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Proxy URL (Tùy chọn - Ví dụ: https://api.openai-proxy.com)</label>
            <input
              v-model="aiProxyUrl"
              type="text"
              placeholder="Nhập địa chỉ proxy nếu cần..."
              class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 mt-2">
            <div class="flex-1">
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Model sử dụng</label>
              <div class="flex flex-col sm:flex-row gap-2">
                <select
                  v-model="aiModel"
                  class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold-500/50"
                  :disabled="loadingModels"
                >
                  <option v-if="aiModels.length === 0" value="">-- Bấm tải model để chọn --</option>
                  <option v-for="m in aiModels" :key="m" :value="m">{{ m }}</option>
                </select>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  class="shrink-0 w-full sm:w-auto !py-2 !px-3 text-xs font-semibold"
                  :loading="loadingModels"
                  @click="loadAiModels"
                >
                  🔄 Tải Model
                </BaseButton>
              </div>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-800 flex justify-end gap-3">
            <BaseButton
              variant="ghost"
              size="sm"
              class="text-xs font-semibold"
              :loading="testingConnection"
              @click="testAi"
            >
              ⚡ Kiểm tra kết nối AI
            </BaseButton>
          </div>
        </GlassCard>

        <!-- SMTP Config Card -->
        <GlassCard class="p-5 space-y-4">
          <h3 class="font-semibold text-slate-200 flex items-center gap-2 text-base">📧 Cấu Hình Gửi Mail SMTP</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">SMTP Host</label>
              <input
                v-model="smtpHost"
                type="text"
                placeholder="smtp.gmail.com"
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold-500/50"
              />
            </div>
            
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">SMTP Port</label>
              <input
                v-model="smtpPort"
                type="text"
                placeholder="587"
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold-500/50"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Tài khoản SMTP (User)</label>
              <input
                v-model="smtpUser"
                type="text"
                placeholder="user@gmail.com"
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold-500/50"
              />
            </div>
            
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Mật khẩu SMTP (Password)</label>
              <input
                v-model="smtpPass"
                type="password"
                placeholder="mật khẩu ứng dụng..."
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold-500/50 font-mono"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Email người gửi (EMAIL_FROM)</label>
            <input
              v-model="emailFrom"
              type="text"
              placeholder="contact@phongthuysimcathung.com"
              class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <div class="pt-4 border-t border-slate-800">
            <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Hòm thư nhận thử nghiệm</label>
            <div class="flex flex-col sm:flex-row gap-2">
              <input
                v-model="testToEmail"
                type="email"
                placeholder="email_nhan@gmail.com"
                class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold-500/50"
              />
              <BaseButton
                variant="ghost"
                size="sm"
                class="shrink-0 w-full sm:w-auto text-xs font-semibold"
                :loading="testingEmail"
                @click="testEmail"
              >
                Gửi email thử
              </BaseButton>
            </div>
          </div>
        </GlassCard>

        <!-- Cron Jobs & Save -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <GlassCard class="p-4 flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 class="font-semibold text-sm text-slate-200 font-semibold">📅 Kích hoạt Tử Vi thủ công</h4>
              <p class="text-xs text-slate-500 mt-0.5">Tạo 25 bản tử vi nhắc vận và gửi email ngay lập tức.</p>
            </div>
            <BaseButton variant="ghost" size="sm" class="text-xs font-semibold shrink-0" @click="triggerHoroscopes">
              ▶ Chạy ngay
            </BaseButton>
          </GlassCard>
          
          <BaseButton
            class="w-full sm:w-auto shrink-0 !px-8 !py-3 font-bold text-sm shadow-xl"
            :loading="configSaving"
            @click="saveAllConfigs"
          >
            💾 Lưu Tất Cả Cấu Hình
          </BaseButton>
        </div>

        <p v-if="configMsg" :class="['text-sm px-4 py-2.5 rounded-lg text-center font-semibold border transition-all duration-300', configMsg.startsWith('✅') ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20']">
          {{ configMsg }}
        </p>
      </div>
    </div>
  </div>
</template>

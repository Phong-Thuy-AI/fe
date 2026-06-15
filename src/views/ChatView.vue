<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { api } from '@/services/api'
import { formatDateTime } from '@/utils/helpers'
import { ZALO_LINK, ZALO_ADMIN_NUMBER } from '@/utils/constants'
import type { ChatRoom } from '@/types'
import BaseButton from '@/components/base/BaseButton.vue'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()

const roomId = computed(() => Number(route.params.roomId))
const newMessage = ref('')
const messagesEl = ref<HTMLElement | null>(null)
const roomInfo = ref<ChatRoom | null>(null)
const isClosed = computed(() => roomInfo.value?.status === 'closed')
const is500k = computed(() => (roomInfo.value?.order as any)?.packageType === '500k')

async function scrollBottom() {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

function send() {
  if (!newMessage.value.trim() || isClosed.value) return
  chatStore.sendMessage(newMessage.value)
  newMessage.value = ''
}

function handleKey(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
}

onMounted(async () => {
  chatStore.connect()
  try {
    // Load room info (packageType, status) và history
    const res = await api.get<{ data: { room: ChatRoom; messages: typeof chatStore.messages } }>(
      `/chats/rooms/${roomId.value}/messages`
    )
    roomInfo.value = res.data.data.room
    // Override messages from REST response
    chatStore.messages.splice(0, chatStore.messages.length, ...res.data.data.messages)
    await scrollBottom()
    // Chỉ join socket nếu room còn active
    if (!isClosed.value) {
      socket_join()
    }
  } catch {
    router.replace('/')
  }
})

function socket_join() {
  chatStore.currentRoomId = roomId.value
  const { socket } = chatStore as any
  if (socket) {
    // join qua chatStore method
  }
  // joinRoom sẽ re-load history — dùng connect + manual join
  chatStore.joinRoom(roomId.value).catch(() => {})
}

onUnmounted(() => chatStore.disconnect())

const messages = computed(() => chatStore.messages)
</script>

<template>
  <div class="h-screen flex flex-col bg-slate-950 text-slate-100">
    <!-- Header -->
    <header class="shrink-0 border-b border-gold-500/10 bg-slate-900/70 backdrop-blur-md px-4 h-16 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <img src="/image-bg.png" alt="Di Nhân Phong Thủy Số" class="w-7 h-7 rounded-full object-cover border border-gold-500/30" />
        <div>
          <div class="font-bold text-sm gold-gradient-text">
            {{ is500k ? '🌟 Phòng Tư Vấn Chuyên Sâu' : '💬 Phòng Tư Vấn Đổi SIM' }}
          </div>
          <div class="flex items-center gap-1.5 text-xs text-slate-500">
            <span :class="isClosed ? 'bg-slate-500' : chatStore.isConnected ? 'bg-green-400' : 'bg-red-500'" class="w-1.5 h-1.5 rounded-full" />
            {{ isClosed ? 'Phiên đã kết thúc' : chatStore.isConnected ? 'Đang kết nối' : 'Mất kết nối' }}
          </div>
        </div>
      </div>
      <BaseButton variant="ghost" size="sm" @click="router.push('/')">← Về trang chủ</BaseButton>
    </header>

    <!-- Banner 500k Zalo -->
    <div v-if="is500k && !isClosed" class="shrink-0 bg-purple-900/40 border-b border-purple-500/20 px-4 py-2 flex items-center justify-between">
      <p class="text-xs text-purple-300">🌟 Gói 500k — Sau khi chat, dịch sư sẽ hỗ trợ chuyên sâu qua Zalo</p>
      <a :href="ZALO_LINK" target="_blank" class="text-xs text-purple-400 hover:text-purple-300 underline shrink-0">
        Zalo: {{ ZALO_ADMIN_NUMBER }}
      </a>
    </div>

    <!-- Messages -->
    <div ref="messagesEl" class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      <div v-if="chatStore.isLoadingHistory" class="flex justify-center py-8">
        <div class="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>

      <div v-if="!chatStore.isLoadingHistory && messages.length === 0"
           class="flex flex-col items-center justify-center h-full gap-3 text-slate-500 text-sm">
        <span class="text-4xl">💬</span>
        <p>Dịch sư sẽ tham gia phòng chat sớm thôi...</p>
      </div>

      <template v-for="msg in messages" :key="msg.id">
        <!-- System message: centered info card -->
        <div v-if="msg.senderType === 'system'" class="flex justify-center my-4 w-full">
          <!-- Hộp quà chốt SIM đặc biệt -->
          <div v-if="msg.message.includes('🎁 MÃ GIỚI THIỆU CỦA BẠN:')" class="bg-gradient-to-br from-slate-900/90 to-purple-950/40 border border-gold-500/30 rounded-2xl p-6 text-center max-w-sm w-full shadow-xl relative overflow-hidden">
            <!-- Background glows -->
            <div class="absolute -top-12 -left-12 w-24 h-24 bg-gold-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div class="absolute -bottom-12 -right-12 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div class="text-4xl mb-3 animate-bounce">🎉</div>
            <h4 class="text-sm font-black text-gold-400 uppercase tracking-widest mb-1.5">Chốt SIM Thành Công!</h4>
            <p class="text-[11px] text-slate-300 mb-4 leading-relaxed">
              Chúc mừng bạn đã sở hữu số điện thoại mới đại cát. Hãy chia sẻ mã giới thiệu dưới đây cho bạn bè:
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
        <div v-else :class="['flex', msg.senderType === 'user' ? 'justify-end' : 'justify-start']">
          <img v-if="msg.senderType === 'admin'" src="/image-bg.png" alt="Dịch sư" class="w-7 h-7 rounded-full object-cover border border-gold-500/30 shrink-0 mr-2 mt-1" />
          <div :class="[
            'max-w-xs sm:max-w-md rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            msg.senderType === 'user'
              ? 'bg-gold-500/20 border border-gold-500/30 text-slate-100 rounded-br-sm'
              : 'bg-slate-800 border border-slate-700/50 text-slate-200 rounded-bl-sm',
          ]">
            <p class="whitespace-pre-wrap">{{ msg.message }}</p>
            <p class="text-xs mt-1 opacity-50 text-right">{{ formatDateTime(msg.createdAt) }}</p>
          </div>
        </div>
      </template>
    </div>

    <!-- Phòng đã đóng -->
    <div v-if="isClosed" class="shrink-0 border-t border-slate-800 bg-slate-900/50 px-4 py-4 text-center space-y-2">
      <p class="text-slate-400 text-sm">✅ Phiên tư vấn đã kết thúc. Cảm ơn bạn đã sử dụng dịch vụ.</p>
      <BaseButton variant="ghost" size="sm" @click="router.push('/')">Về trang chủ</BaseButton>
    </div>

    <!-- Input -->
    <div v-else class="shrink-0 border-t border-slate-800 bg-slate-900/70 backdrop-blur-md px-4 py-3">
      <div class="flex gap-2 max-w-3xl mx-auto">
        <textarea
          v-model="newMessage"
          @keydown="handleKey"
          rows="1"
          placeholder="Nhập tin nhắn... (Enter để gửi)"
          class="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500/50 resize-none transition-all"
        />
        <BaseButton :disabled="!newMessage.trim()" @click="send">Gửi</BaseButton>
      </div>
    </div>
  </div>
</template>

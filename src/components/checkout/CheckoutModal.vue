<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOrderStore } from '@/stores/order'
import { formatCurrency } from '@/utils/helpers'
import { ZALO_LINK } from '@/utils/constants'
import BaseButton from '@/components/base/BaseButton.vue'

interface Props {
  carrier?: string
  consultationTopic?: string
  referralCode?: string
}
const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const router = useRouter()
const orderStore = useOrderStore()

const isPaid = ref(false)
const isExpired = ref(false)
const countdown = ref(600)

const order = computed(() => orderStore.currentOrder)
const qrUrl = computed(() => orderStore.qrUrl)
const is200k = computed(() => order.value?.packageType === '200k')

let countdownTimer: ReturnType<typeof setInterval> | null = null

function handlePaid() {
  isPaid.value = true
  stopCountdown()
  orderStore.stopPolling()
  // Cả 200k và 500k đều có chatRoomId
  if (orderStore.chatRoomId) {
    setTimeout(() => router.push(`/chat/${orderStore.chatRoomId}`), 1800)
  }
}

function handleExpired() {
  isExpired.value = true
  stopCountdown()
}

function startCountdown() {
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) stopCountdown()
  }, 1000)
}

function stopCountdown() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
}

const countdownDisplay = computed(() => {
  const m = Math.floor(countdown.value / 60).toString().padStart(2, '0')
  const s = (countdown.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

onMounted(() => {
  if (!order.value) return
  startCountdown()
  orderStore.startPolling(order.value.id, handlePaid, handleExpired)
})

onUnmounted(() => {
  stopCountdown()
  orderStore.stopPolling()
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" @click.self="emit('close')">
    <div class="glass-card rounded-2xl w-full max-w-md p-6 shadow-2xl relative">

      <!-- Đã thanh toán thành công -->
      <div v-if="isPaid" class="text-center py-6 space-y-4">
        <div class="text-6xl animate-bounce">✨</div>
        <h3 class="text-2xl font-bold gold-gradient-text">Thanh Toán Thành Công!</h3>
        <p class="text-slate-300 text-sm">Đang chuyển đến phòng tư vấn...</p>

        <!-- Gói 500k: nhắc Zalo -->
        <div v-if="!is200k" class="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-sm space-y-2">
          <p class="text-purple-300">🌟 Gói 500k: Tư vấn viên sẽ liên hệ qua Zalo sau khi chat.</p>
          <a :href="ZALO_LINK" target="_blank">
            <BaseButton size="sm" variant="ghost" class="!border-purple-500/50 !text-purple-300 w-full">
              💬 Nhắn tin Zalo ngay
            </BaseButton>
          </a>
        </div>

        <!-- Referral code sau khi thanh toán -->
        <div v-if="props.referralCode" class="bg-gold-500/10 border border-gold-500/20 rounded-xl p-3 text-sm">
          <p class="text-slate-400 text-xs mb-1">Mã giới thiệu của bạn</p>
          <p class="font-mono text-lg font-bold text-gold-400">{{ props.referralCode }}</p>
          <p class="text-slate-500 text-xs mt-1">Chia sẻ để nhận +1 tháng tử vi miễn phí</p>
        </div>
      </div>

      <!-- Hết hạn -->
      <div v-else-if="isExpired" class="text-center py-6 space-y-4">
        <div class="text-5xl">⏰</div>
        <h3 class="text-xl font-bold text-slate-200">Mã QR đã hết hiệu lực</h3>
        <p class="text-slate-400 text-sm">Vui lòng tạo đơn hàng mới để tiếp tục.</p>
        <BaseButton variant="ghost" @click="emit('close')">Đóng</BaseButton>
      </div>

      <!-- Đang chờ thanh toán -->
      <template v-else>
        <button class="absolute top-4 right-4 text-slate-500 hover:text-slate-300 text-xl leading-none" @click="emit('close')">✕</button>

        <h3 class="text-lg font-bold gold-gradient-text mb-1">Quét mã QR để thanh toán</h3>
        <p class="text-slate-400 text-sm mb-4">Chuyển khoản đúng số tiền và nội dung để hệ thống tự động xác nhận.</p>

        <!-- QR Image -->
        <div class="flex justify-center mb-4">
          <div class="p-2 bg-white rounded-xl">
            <img v-if="qrUrl" :src="qrUrl" alt="QR VietQR" class="w-52 h-52 object-contain" />
            <div v-else class="w-52 h-52 flex items-center justify-center text-slate-400">Đang tải QR...</div>
          </div>
        </div>

        <!-- Thông tin -->
        <div class="bg-slate-900/60 rounded-xl p-4 space-y-2 text-sm mb-4">
          <div class="flex justify-between">
            <span class="text-slate-400">Gói:</span>
            <span class="font-medium text-slate-200">{{ is200k ? '💬 Đổi SIM Phong Thủy' : '🌟 Tư Vấn Chuyên Sâu' }}</span>
          </div>
          <div v-if="props.carrier" class="flex justify-between">
            <span class="text-slate-400">Nhà mạng:</span>
            <span class="text-slate-200">{{ props.carrier }}</span>
          </div>
          <div v-if="props.consultationTopic" class="flex justify-between">
            <span class="text-slate-400">Vấn đề:</span>
            <span class="text-slate-200">{{ props.consultationTopic }}</span>
          </div>
          <div class="flex justify-between border-t border-slate-700/50 pt-2 mt-1">
            <span class="text-slate-400">Số tiền:</span>
            <span class="font-bold text-gold-400">{{ order ? formatCurrency(order.amount) : '' }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400">Nội dung CK:</span>
            <code class="text-gold-300 font-mono font-bold bg-gold-500/10 px-2 py-0.5 rounded">{{ order?.paymentCode }}</code>
          </div>
        </div>

        <div class="flex items-center justify-between text-sm text-slate-400">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 bg-gold-400 rounded-full animate-pulse" />
            Đang chờ xác nhận...
          </div>
          <span :class="countdown < 60 ? 'text-red-400' : 'text-slate-400'">{{ countdownDisplay }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

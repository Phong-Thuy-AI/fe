<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import { ZALO_LINK } from '@/utils/constants'
import { scoreLabel } from '@/utils/helpers'
import type { LookupResponse, LookupOrderItem, FengshuiResult } from '@/types'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import GlassCard from '@/components/base/GlassCard.vue'

const router = useRouter()

const form = reactive({ email: '', phone: '' })
const isLoading = ref(false)
const formError = ref('')
const result = ref<LookupResponse | null>(null)
const showCheckResult = ref(false)

const parsedCheckResult = (): FengshuiResult | null => {
  if (!result.value?.user.lastCheckResult) return null
  try { return JSON.parse(result.value.user.lastCheckResult) } catch { return null }
}

function validate(): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email || !emailRegex.test(form.email)) { formError.value = 'Email không đúng định dạng.'; return false }
  if (form.phone.replace(/\D/g, '').length < 6) { formError.value = 'Số điện thoại phải chứa tối thiểu 6 chữ số.'; return false }
  return true
}

async function submit() {
  formError.value = ''
  result.value = null
  showCheckResult.value = false
  if (!validate()) return
  isLoading.value = true
  try {
    const res = await api.post<{ data: LookupResponse }>('/auth/user/lookup', { email: form.email, phone: form.phone })
    result.value = res.data.data
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: { message?: string } } } }
    formError.value = e?.response?.data?.error?.message ?? 'Có lỗi xảy ra, vui lòng thử lại.'
  } finally {
    isLoading.value = false
  }
}

function statusInfo(status: string): { text: string; cls: string } {
  if (status === 'completed') return { text: 'Hoàn thành', cls: 'text-green-400 bg-green-500/10 border-green-500/20' }
  return { text: 'Đã thanh toán', cls: 'text-gold-400 bg-gold-500/10 border-gold-500/20' }
}

function packageLabel(item: LookupOrderItem): string {
  if (item.packageType === '200k') {
    const extra = item.carrier ? ` — ${item.carrier}` : ''
    return `💬 Đổi SIM Phong Thủy (200.000đ)${extra}`
  }
  const extra = item.consultationTopic ? ` — ${item.consultationTopic}` : ''
  return `🌟 Tư Vấn Chuyên Sâu (500.000đ)${extra}`
}

const ratingColor: Record<string, string> = {
  'Đạt': 'text-green-400', 'Đạt (Trội)': 'text-green-300',
  'Biến động lớn': 'text-yellow-400', 'Không đạt': 'text-red-400',
  'Cát': 'text-gold-400', 'Ổn nhưng điểm thấp': 'text-yellow-400',
  'Khuyên đổi SIM': 'text-orange-400', 'Khuyên bỏ SIM': 'text-red-500'
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="sticky top-0 z-40 border-b border-gold-500/10 bg-slate-900/70 backdrop-blur-md">
      <div class="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🕉️</span>
          <span class="font-bold tracking-wide gold-gradient-text uppercase text-sm sm:text-lg">Phong Thủy SIM Cát Hùng</span>
        </div>
        <router-link to="/" class="text-xs sm:text-sm text-slate-400 hover:text-gold-300 transition">← Trang chủ</router-link>
      </div>
    </header>

    <main class="max-w-lg mx-auto px-4 py-10 space-y-6">
      <div class="text-center space-y-2">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-500/10 text-4xl mb-2">🔍</div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight"><span class="gold-gradient-text">Tra Cứu Đơn Hàng</span></h1>
        <p class="text-slate-400 text-sm max-w-sm mx-auto">Nhập Email và Số điện thoại đã đăng ký để xem lại đơn hàng và quay lại phòng tư vấn.</p>
      </div>

      <!-- Form -->
      <GlassCard class="p-6 space-y-4 relative overflow-hidden">
        <div v-if="isLoading" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl gap-3">
          <div class="relative w-12 h-12">
            <div class="absolute inset-0 rounded-full border-4 border-gold-500/20"></div>
            <div class="absolute inset-0 rounded-full border-4 border-t-gold-400 animate-spin"></div>
          </div>
          <p class="text-gold-300 text-sm font-medium animate-pulse">Đang tra cứu...</p>
        </div>
        <BaseInput v-model="form.email" label="Email đã đăng ký" type="email" placeholder="email@example.com" required @keyup.enter="submit" />
        <BaseInput v-model="form.phone" label="Số điện thoại đã đăng ký" placeholder="0912345678" required @keyup.enter="submit" />
        <p v-if="formError" class="text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-2">{{ formError }}</p>
        <BaseButton size="lg" full-width :loading="isLoading" @click="submit">🔍 Tra Cứu Đơn Hàng</BaseButton>
      </GlassCard>

      <!-- Kết quả -->
      <template v-if="result">
        <!-- Card chào mừng + referral code -->
        <GlassCard class="p-5 space-y-3 border border-gold-500/20">
          <div class="text-center space-y-1">
            <p class="text-slate-400 text-sm">Xin chào</p>
            <h2 class="text-2xl font-extrabold gold-gradient-text">{{ result.user.name }}</h2>
            <div class="flex items-center justify-center gap-2 text-sm flex-wrap">
              <span class="text-slate-400">Mệnh</span>
              <span class="font-semibold text-gold-400">{{ result.user.menh }}</span>
              <template v-if="result.user.focusArea">
                <span class="text-slate-600">·</span>
                <span class="text-slate-400">Cải vận</span>
                <span class="font-medium text-slate-300">{{ result.user.focusArea }}</span>
              </template>
            </div>
          </div>
          <!-- Referral code: chỉ hiện nếu đã mua gói (có đơn hàng paid/completed) -->
          <div v-if="result.user.referralCode && result.orders.length > 0" class="flex items-center justify-between bg-slate-900/60 rounded-xl px-4 py-2.5">
            <div>
              <p class="text-xs text-slate-500">Mã giới thiệu của bạn</p>
              <p class="font-mono text-base font-bold text-gold-400">{{ result.user.referralCode }}</p>
            </div>
            <p class="text-xs text-slate-500 text-right max-w-[150px]">Chia sẻ → nhận +1 tháng tử vi miễn phí</p>
          </div>
        </GlassCard>

        <!-- Kết quả luận giải SIM (expandable) -->
        <GlassCard v-if="parsedCheckResult()" class="overflow-hidden">
          <button
            class="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/30 transition-all"
            @click="showCheckResult = !showCheckResult"
          >
            <span class="font-semibold text-slate-200 text-sm">📊 Kết quả luận giải SIM của bạn</span>
            <span class="text-slate-500 text-sm">{{ showCheckResult ? '▲ Thu gọn' : '▼ Xem chi tiết' }}</span>
          </button>
          <div v-if="showCheckResult" class="px-5 pb-5 space-y-4">
            <template v-if="parsedCheckResult() as any">
              <div v-if="parsedCheckResult() as any" class="grid grid-cols-2 gap-3">
                <div class="bg-slate-900/60 rounded-xl p-3 text-center">
                  <p class="text-xs text-slate-500 mb-1">Ngũ Hành</p>
                  <p class="text-2xl font-black text-gold-400">{{ (parsedCheckResult() as any).nguHanh?.score }}<span class="text-xs text-slate-500">/50</span></p>
                  <p class="text-xs font-medium mt-0.5" :class="ratingColor[(parsedCheckResult() as any).nguHanh?.rating] ?? 'text-slate-300'">{{ (parsedCheckResult() as any).nguHanh?.rating }}</p>
                </div>
                <div class="bg-slate-900/60 rounded-xl p-3 text-center">
                  <p class="text-xs text-slate-500 mb-1">Vận Quẻ</p>
                  <p class="text-2xl font-black text-gold-400">{{ (parsedCheckResult() as any).vanQue?.score }}<span class="text-xs text-slate-500">/50</span></p>
                  <p class="text-xs font-medium mt-0.5" :class="ratingColor[(parsedCheckResult() as any).vanQue?.rating] ?? 'text-slate-300'">{{ (parsedCheckResult() as any).vanQue?.rating }}</p>
                </div>
              </div>
              <div class="bg-slate-900/60 rounded-xl p-3 text-center">
                <p class="text-xs text-slate-500 mb-1">Tổng điểm</p>
                <p class="text-3xl font-black" :class="scoreLabel((parsedCheckResult() as any).totalScore).color">{{ (parsedCheckResult() as any).totalScore }}<span class="text-sm font-normal text-slate-500">/100</span></p>
                <p class="text-xs font-medium mt-0.5" :class="scoreLabel((parsedCheckResult() as any).totalScore).color">{{ scoreLabel((parsedCheckResult() as any).totalScore).text }}</p>
              </div>
              <!-- AI analysis nếu có -->
              <div v-if="(parsedCheckResult() as any).aiAnalysis" class="bg-slate-900/60 rounded-xl p-3">
                <p class="text-xs text-gold-400 font-medium mb-1">🤖 Phân tích AI</p>
                <p class="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{{ (parsedCheckResult() as any).aiAnalysis }}</p>
              </div>
            </template>
          </div>
        </GlassCard>

        <!-- Đơn hàng -->
        <GlassCard v-if="result.orders.length === 0" class="p-6 text-center space-y-3">
          <p class="text-slate-400">Bạn chưa có đơn hàng đã thanh toán.</p>
          <BaseButton variant="ghost" @click="router.push('/')">Kiểm tra SIM ngay</BaseButton>
        </GlassCard>

        <template v-else>
          <h3 class="font-semibold text-slate-400 text-sm uppercase tracking-wider px-1">Đơn hàng ({{ result.orders.length }})</h3>
          <div class="space-y-3">
            <GlassCard v-for="order in result.orders" :key="order.id" class="p-5">
              <div class="flex items-start justify-between gap-3">
                <div class="space-y-1.5 min-w-0 flex-1">
                  <p class="font-semibold text-slate-200 text-sm">{{ packageLabel(order) }}</p>
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="text-xs text-slate-500">Đơn #{{ order.id }} · {{ new Date(order.createdAt).toLocaleDateString('vi-VN') }}</p>
                    <span v-if="order.sourceType === 'referral'" class="text-xs bg-purple-500/15 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded-full">🤝 Giới thiệu</span>
                  </div>
                  <span :class="['inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border', statusInfo(order.status).cls]">
                    {{ statusInfo(order.status).text }}
                  </span>
                </div>
                <!-- Actions -->
                <div class="shrink-0 flex flex-col gap-2 mt-0.5">
                  <!-- Active room -->
                  <template v-if="order.chatRoomId && order.status === 'paid'">
                    <BaseButton size="sm" @click="router.push(`/chat/${order.chatRoomId}`)">💬 Vào phòng tư vấn</BaseButton>
                    <a v-if="order.packageType === '500k'" :href="ZALO_LINK" target="_blank">
                      <BaseButton size="sm" variant="ghost" class="w-full !border-purple-500/40 !text-purple-300">Liên hệ Zalo</BaseButton>
                    </a>
                  </template>
                  <!-- Completed: view history -->
                  <template v-else-if="order.chatRoomId && order.status === 'completed'">
                    <BaseButton size="sm" variant="ghost" @click="router.push(`/chat/${order.chatRoomId}`)">📖 Xem lịch sử</BaseButton>
                  </template>
                  <!-- 500k no room yet -->
                  <a v-else-if="order.packageType === '500k'" :href="ZALO_LINK" target="_blank">
                    <BaseButton size="sm" variant="ghost">🌟 Liên hệ Zalo</BaseButton>
                  </a>
                  <!-- No room yet -->
                  <span v-else class="text-xs text-slate-500 italic">Đang xử lý...</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </template>

        <div class="text-center pt-2">
          <button class="text-xs text-slate-500 hover:text-slate-400 underline transition"
            @click="result = null; form.email = ''; form.phone = ''">
            Tra cứu số điện thoại khác
          </button>
        </div>
      </template>
    </main>

    <footer class="text-center py-6 text-xs text-slate-600">© 2026 Phong Thủy SIM Cát Hùng</footer>
  </div>
</template>

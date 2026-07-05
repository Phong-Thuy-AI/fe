<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import { useOrderStore } from '@/stores/order'
import { formatCurrency } from '@/utils/helpers'
import BaseButton from '@/components/base/BaseButton.vue'
import GlassCard from '@/components/base/GlassCard.vue'
import CheckoutModal from '@/components/checkout/CheckoutModal.vue'

const router = useRouter()
const orderStore = useOrderStore()

const userProfile = ref<any>(null)
const isLoading = ref(true)
const fetchError = ref('')

const showCheckout = ref(false)
const renewError = ref('')

async function fetchProfile() {
  isLoading.value = true
  fetchError.value = ''
  try {
    const res = await api.get('/auth/user/me')
    userProfile.value = res.data.data.user
  } catch (err: any) {
    console.error('Lỗi lấy profile:', err)
    fetchError.value = err?.response?.data?.error?.message || 'Phiên làm việc đã hết hạn hoặc mã xác thực không hợp lệ. Vui lòng kiểm tra lại đường dẫn từ email.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchProfile()
})

const isExpired = computed(() => {
  if (!userProfile.value?.horoscopeExpiresAt) return true
  return new Date(userProfile.value.horoscopeExpiresAt) <= new Date()
})

const formattedExpiry = computed(() => {
  if (!userProfile.value?.horoscopeExpiresAt) return 'Chưa đăng ký'
  const date = new Date(userProfile.value.horoscopeExpiresAt)
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

async function handleRenew() {
  renewError.value = ''
  try {
    await orderStore.createOrder('365k')
    showCheckout.value = true
  } catch (err: any) {
    renewError.value = err?.response?.data?.error?.message ?? 'Không thể khởi tạo đơn hàng gia hạn. Vui lòng liên hệ hỗ trợ.'
  }
}

function handleCheckoutClose() {
  showCheckout.value = false
  // Tải lại thông tin để cập nhật hạn dùng mới nếu thanh toán thành công
  fetchProfile()
}
</script>

<template>
  <div class="min-h-screen bg-[#07070f] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
    <!-- Background Glows -->
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

    <div class="w-full max-w-lg space-y-6 z-10">
      <!-- Logo/Brand -->
      <div class="text-center space-y-2">
        <h1 class="text-3xl font-black tracking-wider gold-gradient-text uppercase">Di Nhân Phong Thủy Số</h1>
        <p class="text-xs text-slate-500 tracking-widest uppercase">Cải vận theo mệnh • Đổi số đổi đời</p>
      </div>

      <!-- Loading State -->
      <GlassCard v-if="isLoading" class="p-8 text-center flex flex-col items-center justify-center space-y-4">
        <div class="w-10 h-10 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
        <p class="text-slate-400 text-sm">Đang xác thực thông tin tài khoản...</p>
      </GlassCard>

      <!-- Error State -->
      <GlassCard v-else-if="fetchError" class="p-8 text-center space-y-5 border-red-500/20">
        <div class="text-red-400 text-5xl">⚠️</div>
        <h3 class="text-lg font-bold text-slate-200">Không thể xác thực</h3>
        <p class="text-slate-400 text-sm leading-relaxed">{{ fetchError }}</p>
        <BaseButton variant="ghost" class="w-full" @click="router.replace('/')">Quay lại trang chủ</BaseButton>
      </GlassCard>

      <!-- Success Profile & Renew Screen -->
      <GlassCard v-else class="p-6 sm:p-8 space-y-6 border-gold-500/10 shadow-xl relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-gold-500/5 rounded-full blur-2xl"></div>

        <div class="text-center space-y-1">
          <h2 class="text-xl font-bold text-slate-100 flex items-center justify-center gap-2">
            <span>📅</span> Gia Hạn Tử Vi Hằng Ngày
          </h2>
          <p class="text-slate-400 text-xs sm:text-sm">Tiếp tục hành trình chiêm nghiệm vận cát hung bát tự</p>
        </div>

        <!-- User Information -->
        <div class="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3 text-xs sm:text-sm">
          <div class="flex justify-between pb-2.5 border-b border-slate-900">
            <span class="text-slate-400">Khách hàng:</span>
            <span class="font-bold text-slate-200">{{ userProfile.name }}</span>
          </div>
          <div class="flex justify-between pb-2.5 border-b border-slate-900">
            <span class="text-slate-400">Số điện thoại:</span>
            <span class="font-mono text-slate-200">{{ userProfile.phone }}</span>
          </div>
          <div class="flex justify-between pb-2.5 border-b border-slate-900">
            <span class="text-slate-400">Email nhận thư:</span>
            <span class="font-medium text-emerald-400 select-all">{{ userProfile.email }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Hạn sử dụng hiện tại:</span>
            <span :class="[
              'font-bold',
              isExpired ? 'text-red-400' : 'text-emerald-400'
            ]">{{ formattedExpiry }} <span v-if="isExpired" class="text-[10px] uppercase font-black px-1.5 py-0.5 bg-red-500/10 rounded ml-1">Hết hạn</span></span>
          </div>
        </div>

        <!-- Package Card Details -->
        <div class="border border-gold-500/20 rounded-2xl p-5 space-y-4 bg-gradient-to-br from-gold-500/5 via-transparent to-transparent">
          <div class="flex justify-between items-center pb-3 border-b border-slate-800/60">
            <div>
              <h4 class="font-black text-sm sm:text-base text-gold-300">Gói Tử Vi Nhắc Vận</h4>
              <p class="text-slate-500 text-[11px]">Gia hạn sử dụng trong 1 năm tiếp theo</p>
            </div>
            <div class="text-right">
              <span class="text-gold-400 font-black text-lg">{{ formatCurrency(365000) }}</span>
              <p class="text-[10px] text-slate-500 mt-0.5">~1.000 đ / ngày</p>
            </div>
          </div>

          <ul class="text-xs text-slate-400 space-y-2">
            <li class="flex items-start gap-2">
              <span class="text-gold-500 font-bold">✔</span>
              <span>Dự báo tử vi nhắc nhở vận cát hung bát tự & thần số học cá nhân hóa</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-gold-500 font-bold">✔</span>
              <span>Gửi tự động vào hòm thư Email mỗi buổi sáng</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-gold-500 font-bold">✔</span>
              <span>Bao gồm lịch vạn niên bát tự, ngày hoàng đạo và giờ khởi sự cát lành</span>
            </li>
          </ul>
        </div>

        <!-- CTA Button -->
        <div class="space-y-3 pt-2">
          <BaseButton
            full-width
            size="lg"
            class="!bg-gradient-to-r !from-gold-600 !to-gold-400 !text-slate-950 font-black tracking-wide active:scale-95 transition-all shadow-md shadow-gold-500/10"
            :loading="orderStore.isCreating"
            @click="handleRenew"
          >
            💳 THANH TOÁN GIA HẠN NGAY
          </BaseButton>
          <p v-if="renewError" class="text-xs text-red-400 text-center font-medium">{{ renewError }}</p>
          <p class="text-center text-[10px] text-slate-500">Bằng việc tiến hành thanh toán, bạn đồng ý với các điều khoản dịch vụ của chúng tôi.</p>
        </div>
      </GlassCard>

      <!-- Back to Home Link -->
      <div v-if="!isLoading" class="text-center">
        <router-link to="/" class="text-slate-500 hover:text-gold-400 text-xs font-semibold hover:underline">← Quay lại Trang chủ</router-link>
      </div>
    </div>

    <!-- Checkout Modal -->
    <CheckoutModal
      v-if="showCheckout && orderStore.currentOrder"
      @close="handleCheckoutClose"
    />
  </div>
</template>

<style scoped>
.gold-gradient-text {
  background: linear-gradient(135deg, #F3E5AB 0%, #D4AF37 50%, #AA7C11 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>

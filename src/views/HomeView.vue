<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useFengshuiStore } from '@/stores/fengshui'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import GlassCard from '@/components/base/GlassCard.vue'

const router = useRouter()
const store = useFengshuiStore()

const form = reactive({
  name: '',
  email: '',
  phone: '',
  dob: '',
  tob: '',
  usedLessThan6Months: '' as '' | 'true' | 'false',
  referredByCode: '',
})
const formError = ref('')

async function submit() {
  formError.value = ''
  if (!form.name || !form.phone || !form.dob || !form.usedLessThan6Months) {
    formError.value = 'Vui lòng điền đầy đủ các trường bắt buộc.'
    return
  }
  try {
    await store.checkSim({
      name: form.name,
      email: form.email,
      phone: form.phone,
      dob: form.dob,
      tob: form.tob || null,
      usedLessThan6Months: form.usedLessThan6Months === 'true',
      referredByCode: form.referredByCode || undefined,
    })
    router.push('/result')
  } catch {
    formError.value = store.error ?? 'Có lỗi xảy ra, vui lòng thử lại.'
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b border-gold-500/10 bg-slate-900/70 backdrop-blur-md">
      <div class="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🕉️</span>
          <span class="font-bold tracking-wide gold-gradient-text uppercase text-sm sm:text-lg">DI NHÂN PHONG THỦY SỐ</span>
        </div>
        <router-link to="/lookup" class="text-xs sm:text-sm font-semibold text-gold-400 hover:text-gold-300 transition-all flex items-center gap-1 bg-slate-800/40 hover:bg-slate-800/80 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700/50 hover:border-gold-500/30">
          <span>🔍</span> Tra cứu lịch sử
        </router-link>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-4 py-10">
      <!-- Hero -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-500/10 text-4xl mb-4">✨</div>
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
          <span class="gold-gradient-text">DI NHÂN PHONG THỦY SỐ</span> ( Nhìn số biết vận - nhìn vận biết mệnh - nhìn mệnh biết cuộc đời )
        </h1>
        <p class="text-slate-400 text-base max-w-md mx-auto">
          Nhập thông tin bên dưới để hệ thống chấm điểm ngũ hành & vận quẻ cho số điện thoại của bạn.
        </p>
      </div>

      <!-- Form -->
      <GlassCard class="p-6 sm:p-8 space-y-5">
        <!-- Loading overlay -->
        <div v-if="store.isLoading" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl gap-4">
          <div class="relative w-16 h-16">
            <div class="absolute inset-0 rounded-full border-4 border-gold-500/20"></div>
            <div class="absolute inset-0 rounded-full border-4 border-t-gold-400 animate-spin"></div>
            <span class="absolute inset-0 flex items-center justify-center text-2xl">🔮</span>
          </div>
          <p class="text-gold-300 font-medium animate-pulse">Đang luận giải phong thủy...</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Thông tin cá nhân -->
          <BaseInput v-model="form.name" label="Họ và tên" placeholder="Nguyễn Văn An" required />
          <div class="flex flex-col gap-1">
            <BaseInput v-model="form.email" label="Email (không bắt buộc)" type="email" placeholder="email@example.com" />
            <span class="text-[11px] text-slate-400 italic leading-normal px-0.5">
              * Gmail chỉ có tác dụng khi bạn cần mua gói tử vi hằng ngày hoặc gói sẽ tự động tặng khi có giao dịch trên trang
            </span>
          </div>

          <!-- Ngày giờ sinh -->
          <BaseInput v-model="form.dob" label="Ngày sinh (Dương lịch)" type="date" required />
          <BaseInput v-model="form.tob" label="Giờ sinh (không bắt buộc)" type="time" />

          <!-- Thông tin SIM -->
          <BaseInput v-model="form.phone" label="Số điện thoại" placeholder="0912345678" required />
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-slate-300">Thời gian dùng SIM <span class="text-gold-400">*</span></label>
            <select
              v-model="form.usedLessThan6Months"
              class="w-full bg-slate-900/60 border border-slate-700/60 hover:border-gold-500/30 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50 transition-all duration-200"
            >
              <option value="" disabled class="bg-slate-900 text-slate-400">Chọn thời gian...</option>
              <option value="true" class="bg-slate-900 text-slate-100">Dưới 6 tháng</option>
              <option value="false" class="bg-slate-900 text-slate-100">Trên 6 tháng</option>
            </select>
          </div>

          <!-- Mã giới thiệu (optional) -->
          <div class="sm:col-span-2">
            <BaseInput v-model="form.referredByCode" label="Mã giới thiệu (không bắt buộc)" placeholder="VD: NVA88" />
          </div>
        </div>

        <!-- Error -->
        <p v-if="formError" class="text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-2">{{ formError }}</p>

        <BaseButton type="submit" size="lg" full-width :loading="store.isLoading" @click="submit">
          🔮 Luận Giải Phong Thủy SIM
        </BaseButton>
      </GlassCard>
    </main>

    <footer class="text-center py-6 text-xs text-slate-600 space-y-2">
      <div>
        <router-link to="/lookup" class="text-gold-400/70 hover:text-gold-400 transition underline">
          🔍 Đã mua dịch vụ? Tra cứu lịch sử / Quay lại tư vấn
        </router-link>
      </div>
      <div>© 2026 DI NHÂN PHONG THỦY SỐ</div>
    </footer>
  </div>
</template>

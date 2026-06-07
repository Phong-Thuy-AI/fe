<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useFengshuiStore } from '@/stores/fengshui'
import { FOCUS_AREAS } from '@/utils/constants'
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
  focusArea: '',
  referredByCode: '',
})
const formError = ref('')

async function submit() {
  formError.value = ''
  if (!form.name || !form.email || !form.phone || !form.dob || !form.tob || !form.usedLessThan6Months || !form.focusArea) {
    formError.value = 'Vui lòng điền đầy đủ các trường bắt buộc.'
    return
  }
  try {
    await store.checkSim({
      name: form.name,
      email: form.email,
      phone: form.phone,
      dob: form.dob,
      tob: form.tob,
      usedLessThan6Months: form.usedLessThan6Months === 'true',
      focusArea: form.focusArea,
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
      <div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🕉️</span>
          <span class="font-bold tracking-wide gold-gradient-text uppercase text-lg">Phong Thủy SIM Cát Hùng</span>
        </div>
        <router-link to="/admin/login" class="text-xs text-slate-600 hover:text-slate-400 transition">Admin</router-link>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-4 py-10">
      <!-- Hero -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-500/10 text-4xl mb-4">✨</div>
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
          <span class="gold-gradient-text">Luận Giải SIM</span> Phong Thủy
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
          <BaseInput v-model="form.name" label="Họ và tên" placeholder="Nguyễn Văn An" required />
          <BaseInput v-model="form.email" label="Email" type="email" placeholder="email@example.com" required />
          <BaseInput v-model="form.phone" label="Số điện thoại" placeholder="0912345678" required />
          <BaseInput v-model="form.dob" label="Ngày sinh (Dương lịch)" type="date" required />
          <BaseInput v-model="form.tob" label="Giờ sinh" type="time" required />

          <!-- Thời gian dùng SIM -->
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-slate-300">Thời gian dùng SIM <span class="text-gold-400">*</span></label>
            <select
              v-model="form.usedLessThan6Months"
              class="w-full bg-slate-900/60 border border-slate-700/60 hover:border-gold-500/30 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50 transition-all"
            >
              <option value="" disabled>Chọn thời gian...</option>
              <option value="true">Dưới 6 tháng</option>
              <option value="false">Trên 6 tháng</option>
            </select>
          </div>

          <!-- Vấn đề cải vận -->
          <div class="flex flex-col gap-1.5 sm:col-span-2">
            <label class="text-sm font-medium text-slate-300">Vấn đề cần cải vận nhất <span class="text-gold-400">*</span></label>
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                v-for="area in FOCUS_AREAS"
                :key="area"
                type="button"
                @click="form.focusArea = area"
                :class="[
                  'py-2 px-3 rounded-lg text-sm font-medium border transition-all duration-200',
                  form.focusArea === area
                    ? 'bg-gold-500/20 border-gold-500 text-gold-300'
                    : 'bg-slate-900/40 border-slate-700/60 text-slate-400 hover:border-gold-500/30 hover:text-slate-300',
                ]"
              >{{ area }}</button>
            </div>
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
          🔍 Đã mua dịch vụ? Tra cứu đơn hàng / Quay lại tư vấn
        </router-link>
      </div>
      <div>© 2026 Phong Thủy SIM Cát Hùng</div>
    </footer>
  </div>
</template>

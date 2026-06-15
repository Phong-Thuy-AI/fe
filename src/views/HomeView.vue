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
  store.isLoading = true;
  // try {
  //   await store.checkSim({
  //     name: form.name,
  //     email: form.email,
  //     phone: form.phone,
  //     dob: form.dob,
  //     tob: form.tob || null,
  //     usedLessThan6Months: form.usedLessThan6Months === 'true',
  //     referredByCode: form.referredByCode || undefined,
  //   })
  //   router.push('/result')
  // } catch {
  //   formError.value = store.error ?? 'Có lỗi xảy ra, vui lòng thử lại.'
  // }
}
</script>

<template>
  <div class="min-h-screen celestial-bg text-slate-100">
    <!-- Background Ambient Glows -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div class="cosmic-glow-1 animate-float-glow-1"></div>
      <div class="cosmic-glow-2 animate-float-glow-2"></div>
      <div class="cosmic-glow-3 animate-float-glow-3"></div>
    </div>

    <!-- Header -->
    <header class="sticky top-0 z-40 border-b border-gold-500/10 bg-slate-900/70 backdrop-blur-md">
      <div class="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        <router-link to="/" class="flex items-center gap-2 hover:opacity-85 transition-opacity">
          <div class="halo-effect">
            <img src="/image-bg.png" alt="Di Nhân Phong Thủy Số" class="w-8 h-8 rounded-full object-cover relative z-10" />
          </div>
          <span class="font-bold tracking-wide gold-gradient-text uppercase text-sm sm:text-lg">DI NHÂN PHONG THỦY SỐ</span>
        </router-link>
        <router-link to="/lookup" class="text-xs sm:text-sm font-semibold text-gold-400 hover:text-gold-300 transition-all flex items-center gap-1 bg-slate-800/40 hover:bg-slate-800/80 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700/50 hover:border-gold-500/30">
          <span>🔍</span> Tra cứu lịch sử
        </router-link>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-4 py-10 relative z-10">
      <!-- Hero -->
      <div class="text-center mb-10 relative z-10">
        <div class="inline-flex items-center justify-center w-30 h-30 rounded-full text-4xl mb-4 halo-effect">
          <img src="/image.png" alt="Logo" class="w-30 h-30 rounded-full object-cover relative z-10" />
        </div>
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
          <span class="gold-gradient-text">DI NHÂN PHONG THỦY SỐ</span>
          <span class="block text-xs sm:text-sm text-slate-400 font-normal mt-2">( Nhìn số biết vận - nhìn vận biết mệnh - nhìn mệnh biết cuộc đời )</span>
        </h1>
        <p class="text-slate-400 text-base max-w-md mx-auto">
          Nhập thông tin bên dưới để hệ thống chấm điểm ngũ hành & vận quẻ cho số điện thoại của bạn.
        </p>
      </div>

      <!-- Form -->
      <GlassCard class="p-6 sm:p-8 space-y-5 animate-gold-glow-pulse border border-gold-500/20 relative">
        <!-- Loading overlay -->
        <div v-if="store.isLoading" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 rounded-2xl gap-4 p-6">
          <div class="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border border-gold-500/30 shadow-[0_0_20px_rgba(219,186,100,0.2)]">
            <video 
              autoplay 
              loop 
              muted 
              playsinline
              class="w-full h-full object-cover"
            >
              <source src="/video-loading.mp4" type="video/mp4" />
            </video>
          </div>
          <p class="text-gold-300 font-bold tracking-wide animate-pulse text-sm sm:text-base text-center">
            🔮 Đang kết nối dịch lý Bát Tự & Luận giải phong thủy SIM...
          </p>
          <p class="text-xs text-slate-500 text-center max-w-xs leading-relaxed">
            Tiến trình luận giải chuyên sâu có thể mất khoảng 20 - 40 giây. Vui lòng không đóng trình duyệt.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Thông tin cá nhân -->
          <BaseInput v-model="form.name" label="Họ và tên" placeholder="Nguyễn Văn An" required />
          <div class="flex flex-col gap-1">
            <BaseInput v-model="form.email" label="Email (không bắt buộc)" type="email" placeholder="email@example.com" />
            <span class="text-[11px] text-gold-400/70 italic leading-normal px-0.5">
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

        <BaseButton type="submit" size="lg" full-width :loading="store.isLoading" class="!shadow-[0_0_15px_rgba(219,186,100,0.15)] hover:!shadow-[0_0_25px_rgba(219,186,100,0.4)] transition-all duration-300" @click="submit">
          🔮 Luận Giải Phong Thủy SIM
        </BaseButton>
      </GlassCard>

      <!-- Trust Pillars for older/middle-aged users -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 text-center max-w-xl mx-auto relative z-10 border-t border-slate-800/40 mt-10">
        <div class="space-y-2">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold-500/10 text-gold-400 text-xl shadow-inner shadow-gold-500/5">📖</div>
          <h4 class="text-sm font-extrabold text-gold-400 tracking-wide">Cổ Thư Kinh Dịch</h4>
          <p class="text-[11px] text-slate-400 leading-relaxed max-w-[170px] mx-auto">
            Luận giải chi tiết dựa trên 64 quẻ dịch cổ thư, giữ trọn ý nghĩa chân truyền cổ học phương Đông.
          </p>
        </div>
        
        <div class="space-y-2">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold-500/10 text-gold-400 text-xl shadow-inner shadow-gold-500/5">☯️</div>
          <h4 class="text-sm font-extrabold text-gold-400 tracking-wide">Ngũ Hành Tương Sinh</h4>
          <p class="text-[11px] text-slate-400 leading-relaxed max-w-[170px] mx-auto">
            Tính toán độ hợp khắc giữa SIM và Bát Tự theo Thiên Can - Địa Chi của Giờ/Ngày/Tháng/Năm sinh.
          </p>
        </div>
        
        <div class="space-y-2">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold-500/10 text-gold-400 text-xl shadow-inner shadow-gold-500/5">🧙</div>
          <h4 class="text-sm font-extrabold text-gold-400 tracking-wide">Dịch Sư Đồng Hành</h4>
          <p class="text-[11px] text-slate-400 leading-relaxed max-w-[170px] mx-auto">
            Không chỉ tính điểm tự động, Dịch sư sẽ trực tiếp trao đổi 1-1 để hỗ trợ cải vận chọn SIM đại cát.
          </p>
        </div>
      </div>
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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFengshuiStore } from '@/stores/fengshui'
import { useOrderStore } from '@/stores/order'
import { formatCurrency, scoreLabel } from '@/utils/helpers'
import { ZALO_LINK, PRICE_200K, PRICE_500K } from '@/utils/constants'
import BaseButton from '@/components/base/BaseButton.vue'
import GlassCard from '@/components/base/GlassCard.vue'
import CheckoutModal from '@/components/checkout/CheckoutModal.vue'

const router = useRouter()
const fengshuiStore = useFengshuiStore()
const orderStore = useOrderStore()

const showPackages = ref(false)
const showCheckout = ref(false)
const checkoutError = ref('')
const selectedCarrier = ref('')
const selectedTopic = ref('')
const selectedPackage = ref<'200k' | '500k' | null>(null)

const data = computed(() => fengshuiStore.checkResponse)
const result = computed(() => data.value?.result)
const user = computed(() => data.value?.user)

onMounted(() => { if (!data.value) router.replace('/') })

const totalLabel = computed(() => result.value ? scoreLabel(result.value.totalScore) : null)

const CARRIERS = ['Viettel', 'Mobifone', 'Vinaphone', 'Gmobile', 'Reddi', 'Không yêu cầu']
const TOPICS = ['Gia đạo', 'Sức khỏe', 'Tài lộc', 'Công việc', 'Sự nghiệp']

async function selectPackage(pkg: '200k' | '500k') {
  checkoutError.value = ''
  if (pkg === '200k' && !selectedCarrier.value) {
    checkoutError.value = 'Vui lòng chọn nhà mạng muốn tư vấn.'
    return
  }
  if (pkg === '500k' && !selectedTopic.value) {
    checkoutError.value = 'Vui lòng chọn vấn đề cần tư vấn chuyên sâu.'
    return
  }
  try {
    await orderStore.createOrder(pkg, {
      carrier: pkg === '200k' ? selectedCarrier.value : undefined,
      consultationTopic: pkg === '500k' ? selectedTopic.value : undefined
    })
    selectedPackage.value = pkg
    showCheckout.value = true
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: { message?: string } } } }
    checkoutError.value = err?.response?.data?.error?.message ?? 'Không thể tạo đơn hàng. Vui lòng thử lại.'
  }
}

const ratingColor: Record<string, string> = {
  'Đạt': 'text-green-400', 'Đạt (Trội)': 'text-green-300',
  'Biến động lớn': 'text-yellow-400', 'Không đạt': 'text-red-400',
  'Cát': 'text-gold-400', 'Ổn nhưng điểm thấp': 'text-yellow-400',
  'Khuyên đổi SIM': 'text-orange-400', 'Khuyên bỏ SIM': 'text-red-500',
  'Không tốt': 'text-red-400'
}
</script>

<template>
  <div v-if="result && user" class="min-h-screen bg-slate-950 text-slate-100">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b border-gold-500/10 bg-slate-900/70 backdrop-blur-md">
      <div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🕉️</span>
          <span class="font-bold tracking-wide gold-gradient-text uppercase text-lg">Phong Thủy SIM Cát Hùng</span>
        </div>
        <BaseButton variant="ghost" size="sm" @click="router.push('/')">← Kiểm tra SIM khác</BaseButton>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <!-- Tiêu đề -->
      <div class="text-center space-y-1">
        <p class="text-slate-400 text-sm">Kết quả luận giải cho <strong class="text-slate-200">{{ user.name }}</strong> · Mệnh <strong class="text-gold-400">{{ result.menh }}</strong></p>
        <h2 class="text-2xl sm:text-3xl font-extrabold gold-gradient-text">Báo Cáo Phong Thủy SIM</h2>
      </div>

      <!-- Tổng điểm -->
      <GlassCard class="p-6 text-center relative overflow-hidden">
        <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <p class="text-slate-400 text-sm mb-1">Tổng Điểm Tương Hợp</p>
        <div class="text-7xl font-black" :class="totalLabel?.color">{{ result.totalScore }}</div>
        <div class="text-lg font-semibold mt-1" :class="totalLabel?.color">{{ totalLabel?.text }}</div>
        <div class="mt-3 w-full bg-slate-800 rounded-full h-2.5">
          <div class="h-2.5 rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-700"
               :style="{ width: `${result.totalScore}%` }" />
        </div>
        <p class="text-slate-500 text-xs mt-2">{{ result.totalScore }}/100 điểm</p>
      </GlassCard>

      <!-- Ngũ hành + Vận quẻ -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GlassCard class="p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-slate-200">⚡ Ngũ Hành SIM</h3>
            <span class="text-xl font-black text-gold-400">{{ result.nguHanh.score }}<span class="text-sm font-normal text-slate-500">/50</span></span>
          </div>
          <p class="text-sm font-semibold" :class="ratingColor[result.nguHanh.rating] ?? 'text-slate-300'">{{ result.nguHanh.rating }}</p>
          <div class="grid grid-cols-3 gap-2 text-center text-xs">
            <div class="bg-slate-900/60 rounded-lg py-2"><div class="text-lg font-bold text-green-400">{{ result.nguHanh.c_sinh }}</div><div class="text-slate-500">Tương sinh</div></div>
            <div class="bg-slate-900/60 rounded-lg py-2"><div class="text-lg font-bold text-gold-400">{{ result.nguHanh.c_hop }}</div><div class="text-slate-500">Tương hợp</div></div>
            <div class="bg-slate-900/60 rounded-lg py-2"><div class="text-lg font-bold text-red-400">{{ result.nguHanh.c_khac }}</div><div class="text-slate-500">Tương khắc</div></div>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">{{ result.nguHanh.details }}</p>
        </GlassCard>

        <GlassCard class="p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-slate-200">🎋 Vận Quẻ SIM</h3>
            <span class="text-xl font-black text-gold-400">{{ result.vanQue.score }}<span class="text-sm font-normal text-slate-500">/50</span></span>
          </div>
          <p class="text-sm font-semibold" :class="ratingColor[result.vanQue.rating] ?? 'text-slate-300'">{{ result.vanQue.rating }}</p>
          <div class="grid grid-cols-3 gap-2 text-center text-xs">
            <div class="bg-slate-900/60 rounded-lg py-2"><div class="text-base font-bold text-slate-300">{{ result.vanQue.tienVanQue }}</div><div class="text-slate-500">Tiền vận</div></div>
            <div class="bg-slate-900/60 rounded-lg py-2"><div class="text-base font-bold text-slate-300">{{ result.vanQue.trungVanQue }}</div><div class="text-slate-500">Trung vận</div></div>
            <div class="bg-slate-900/60 rounded-lg py-2"><div class="text-base font-bold text-slate-300">{{ result.vanQue.hauVanQue }}</div><div class="text-slate-500">Hậu vận</div></div>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">{{ result.vanQue.details }}</p>
        </GlassCard>
      </div>

      <!-- AI Analysis -->
      <GlassCard v-if="result.aiAnalysis" class="p-6 space-y-3">
        <h3 class="font-bold text-slate-200 flex items-center gap-2"><span class="text-gold-400">🤖</span> Phân Tích Chuyên Sâu</h3>
        <p class="text-slate-300 leading-relaxed text-sm whitespace-pre-line">{{ result.aiAnalysis }}</p>
      </GlassCard>

      <!-- 3 Vận quẻ -->
      <div class="space-y-3">
        <h3 class="font-bold text-slate-300">📜 Nội Dung 3 Vận Quẻ</h3>
        <div class="space-y-3">
          <GlassCard v-for="(item, idx) in [
            { label: 'Tiền Vận', content: result.hexagrams.cleaned.tien, icon: '🌅' },
            { label: 'Trung Vận', content: result.hexagrams.cleaned.trung, icon: '🌞' },
            { label: 'Hậu Vận', content: result.hexagrams.cleaned.hau, icon: '🌙' },
          ]" :key="idx" class="p-5">
            <h4 class="text-sm font-semibold text-gold-400 mb-2">{{ item.icon }} {{ item.label }}</h4>
            <p class="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{{ item.content }}</p>
          </GlassCard>
        </div>
      </div>

      <!-- Referral code: chỉ hiện sau khi đã thanh toán (qua CheckoutModal) -->

      <!-- ─── Phần chọn gói ─── -->
      <GlassCard class="p-6 space-y-4">
        <div class="text-center space-y-2">
          <h3 class="text-lg font-bold gold-gradient-text">Muốn cải vận với SIM phong thủy?</h3>
          <p class="text-slate-400 text-sm">Được tư vấn chọn SIM phù hợp với mệnh và vấn đề của bạn.</p>
        </div>

        <!-- Nút mở gói -->
        <div v-if="!showPackages" class="text-center">
          <BaseButton size="lg" @click="showPackages = true">💰 Tư Vấn Đổi SIM</BaseButton>
        </div>

        <!-- Expand 2 gói -->
        <div v-else class="space-y-4">
          <p v-if="checkoutError" class="text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-2 text-center">{{ checkoutError }}</p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Gói 200k -->
            <div class="border border-gold-500/30 rounded-xl p-5 space-y-3 hover:border-gold-500/60 transition-all">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-bold text-slate-200">💬 Đổi SIM Phong Thủy</h4>
                  <p class="text-gold-400 font-bold text-sm">{{ formatCurrency(PRICE_200K) }}</p>
                </div>
              </div>
              <ul class="text-xs text-slate-400 space-y-1">
                <li>✔ Luận giải chọn SIM mới (chưa gồm tiền mua SIM)</li>
                <li>✔ Giá SIM đề xuất dao động từ 2 – 3 triệu trở xuống</li>
                <li>✔ Tư vấn chọn SIM cải vận tài chính chủ yếu</li>
                <li>✔ Chat trực tiếp với tư vấn viên</li>
                <li>✔ 1 tháng nhận tử vi miễn phí</li>
              </ul>
              <!-- Chọn nhà mạng -->
              <div class="space-y-1.5">
                <p class="text-xs text-slate-400 font-medium">Chọn nhà mạng <span class="text-gold-400">*</span></p>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="c in CARRIERS" :key="c"
                    type="button"
                    @click="selectedCarrier = c"
                    :class="['text-xs px-2.5 py-1 rounded-full border transition-all', selectedCarrier === c ? 'bg-gold-500/20 border-gold-500 text-gold-300' : 'border-slate-700/60 text-slate-400 hover:border-gold-500/40']"
                  >{{ c }}</button>
                </div>
              </div>
              <BaseButton full-width :loading="orderStore.isCreating" @click="selectPackage('200k')">
                Đăng ký ngay
              </BaseButton>
            </div>

            <!-- Gói 500k -->
            <div class="border border-purple-500/30 rounded-xl p-5 space-y-3 hover:border-purple-500/60 transition-all relative">
              <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">Cao cấp</div>
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-bold text-slate-200">🌟 Tư Vấn Chuyên Sâu</h4>
                  <p class="text-purple-400 font-bold text-sm">{{ formatCurrency(PRICE_500K) }}</p>
                </div>
              </div>
              <ul class="text-xs text-slate-400 space-y-1">
                <li>✔ Tư vấn sâu vấn đề cần hỗ trợ</li>
                <li>✔ Chat + trao đổi trực tiếp Zalo chuyên gia</li>
                <li>✔ Đổi SIM phù hợp theo mệnh</li>
                <li>✔ 3 tháng nhận tử vi miễn phí</li>
              </ul>
              <!-- Chọn chủ đề -->
              <div class="space-y-1.5">
                <p class="text-xs text-slate-400 font-medium">Vấn đề cần tư vấn <span class="text-purple-400">*</span></p>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="t in TOPICS" :key="t"
                    type="button"
                    @click="selectedTopic = t"
                    :class="['text-xs px-2.5 py-1 rounded-full border transition-all', selectedTopic === t ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'border-slate-700/60 text-slate-400 hover:border-purple-500/40']"
                  >{{ t }}</button>
                </div>
              </div>
              <BaseButton full-width :loading="orderStore.isCreating" @click="selectPackage('500k')"
                class="!bg-gradient-to-r !from-purple-600 !to-purple-700 !text-white hover:!from-purple-500">
                Đăng ký ngay
              </BaseButton>
            </div>
          </div>

          <p class="text-center text-xs text-slate-500">
            Cần tư vấn trước? →
            <a :href="ZALO_LINK" target="_blank" class="text-gold-400 hover:underline">Nhắn tin Zalo miễn phí</a>
          </p>
        </div>
      </GlassCard>
    </main>

    <!-- Checkout Modal -->
    <CheckoutModal
      v-if="showCheckout && orderStore.currentOrder"
      :carrier="selectedPackage === '200k' ? selectedCarrier : undefined"
      :consultation-topic="selectedPackage === '500k' ? selectedTopic : undefined"
      :referral-code="user.referralCode ?? undefined"
      @close="showCheckout = false"
    />
  </div>
</template>

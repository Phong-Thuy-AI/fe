<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFengshuiStore } from '@/stores/fengshui'
import { useOrderStore } from '@/stores/order'
import { formatCurrency, scoreLabel, getVậnTreeIcon, getVậnCardClass, getVậnGlowClass, getClassificationClass } from '@/utils/helpers'
import { ZALO_LINK, PRICE_200K, PRICE_500K } from '@/utils/constants'
import BaseButton from '@/components/base/BaseButton.vue'
import GlassCard from '@/components/base/GlassCard.vue'
import CheckoutModal from '@/components/checkout/CheckoutModal.vue'

const router = useRouter()
const fengshuiStore = useFengshuiStore()
const orderStore = useOrderStore()

const showStep2 = ref(false)
const showCheckout = ref(false)
const checkoutError = ref('')
const selectedCarrier = ref('')
const selectedTopics = ref<string[]>([])
function toggleTopic(area: string) {
  const idx = selectedTopics.value.indexOf(area)
  if (idx > -1) {
    selectedTopics.value.splice(idx, 1)
  } else {
    selectedTopics.value.push(area)
  }
}
const selectedPackage = ref<'200k' | '500k' | null>(null)

const data = computed(() => fengshuiStore.checkResponse)
const result = computed(() => data.value?.result)
const user = computed(() => data.value?.user)

onMounted(() => { if (!data.value) router.replace('/') })

const totalLabel = computed(() => result.value ? scoreLabel(result.value.totalScore) : null)

const hasĐạiHungOrHung = computed(() => {
  if (!result.value) return false
  const list = [
    parsedTien.value?.classification,
    parsedTrung.value?.classification,
    parsedHau.value?.classification
  ]
  return list.some(c => {
    if (!c) return false
    const u = c.toUpperCase()
    return u.includes('ĐẠI HUNG') || u === 'HUNG'
  })
})

const scoreCircleClass = computed(() => {
  if (!result.value) return 'border-slate-800/80 shadow-inner'
  const score = result.value.totalScore
  if (score >= 60) return 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
  if (score >= 40) return 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
  return 'border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.35)] animate-pulse-danger'
})

const scoreInnerPulseClass = computed(() => {
  if (!result.value) return 'border-gold-500/20 animate-pulse'
  const score = result.value.totalScore
  if (score >= 60) return 'border-emerald-500/20 animate-pulse'
  if (score >= 40) return 'border-amber-500/20 animate-pulse'
  return 'border-red-500/50 animate-ping'
})

const CARRIERS = ['Viettel', 'Mobifone', 'Vinaphone', 'Gmobile', 'Reddi', 'Không yêu cầu']
const TOPICS = ['Gia đạo', 'Tình duyên', 'Công việc', 'Công danh', 'Sự nghiệp']

const isHungGroup = computed(() => {
  if (!result.value) return false
  const totalScore = result.value.totalScore
  const nguHanhRating = result.value.nguHanh.rating
  const vanQueRating = result.value.vanQue.rating
  
  return (
    totalScore < 50 ||
    nguHanhRating === 'Không đạt' ||
    vanQueRating === 'Khuyên bỏ SIM' ||
    vanQueRating === 'Khuyên đổi SIM' ||
    vanQueRating === 'Không tốt'
  )
})

const conclusionText = computed(() => {
  if (isHungGroup.value) {
    return `<div class="space-y-3 text-left">
      <p class="leading-relaxed">
        ⚠️ <strong class="text-red-400 font-extrabold uppercase">Đánh giá chung:</strong> Số điện thoại này <strong class="text-red-400 font-black underline">chứa nhiều điềm hung, khắc mệnh</strong> và không phù hợp làm số liên lạc chủ đạo lâu dài. Việc tiếp tục sử dụng có thể cản trở tài vận, gây bất hòa gia đạo và làm hao tổn sinh khí cát tường.
      </p>
      <div class="h-px bg-slate-800/80 my-2"></div>
      <p class="leading-relaxed text-gold-300 font-medium">
        👉 <strong>Hành động cần thiết:</strong> Hãy click nút phía dưới để chuyển sang <strong>Bước 2</strong>. Dịch sư sẽ đối chiếu với bản mệnh Bát Tự của bạn để đề xuất phương án cải vận và chọn dãy số trợ mệnh đại cát tối ưu nhất!
      </p>
    </div>`
  } else {
    return `<div class="space-y-3 text-left">
      <p class="leading-relaxed">
        ✨ <strong class="text-emerald-400 font-extrabold uppercase">Đánh giá chung:</strong> Số điện thoại này có các yếu tố phong thủy <strong class="text-emerald-400 font-black">tương đối cát lợi và hài hòa</strong>. Tuy nhiên, một số SIM cát chung chưa chắc đã bổ trợ đúng hành khuyết trong bản mệnh (Bát Tự) của riêng bạn.
      </p>
      <div class="h-px bg-slate-800/80 my-2"></div>
      <p class="leading-relaxed text-gold-300 font-medium">
        👉 <strong>Lời khuyên Dịch sư:</strong> Hãy click nút phía dưới chuyển sang <strong>Bước 2</strong> để đối chiếu SIM này với Giờ/Ngày/Tháng/Năm sinh của bạn, từ đó lựa chọn phương án bổ khuyết cải vận hoàn hảo nhất!
      </p>
    </div>`
  }
})

async function selectPackage(pkg: '200k' | '500k') {
  checkoutError.value = ''
  
  if (pkg === '200k') {
    if (selectedTopics.value.length !== 2) {
      checkoutError.value = 'Vui lòng chọn đúng 2 vấn đề cần cải vận cho gói 200k.'
      return
    }
    if (!selectedCarrier.value) {
      checkoutError.value = 'Vui lòng chọn nhà mạng muốn tư vấn.'
      return
    }
  } else if (pkg === '500k') {
    // Tự động chọn tất cả 5 vấn đề cho gói 500k
    selectedTopics.value = [...TOPICS];
  }
  
  try {
    await orderStore.createOrder(pkg, {
      carrier: pkg === '200k' ? selectedCarrier.value : undefined,
      consultationTopic: selectedTopics.value.join(', ')
    })
    selectedPackage.value = pkg
    showCheckout.value = true
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: { message?: string; code?: string; details?: { chatRoomId?: number } } } } }
    if (err?.response?.data?.error?.code === 'ORDER_ALREADY_PAID' && err.response.data.error.details?.chatRoomId) {
      router.push(`/chat/${err.response.data.error.details.chatRoomId}`)
      return
    }
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

// ─────────────────────────────────────────────────────────────
// PARSER HỖ TRỢ HIỂN THỊ PREMIUM UI/UX
// ─────────────────────────────────────────────────────────────
interface ParsedSection {
  classification: string
  hanNom: string[]
  dichNghia: string[]
  loiKhuyen: string[]
}

function parseQueText(text: string): ParsedSection | null {
  if (!text) return null
  
  // Trích xuất Phân loại
  const classMatch = text.match(/\*\*Phân loại\*\*:\s*\*\*([^*]+)\*\*/i)
  const classification = classMatch ? classMatch[1].trim() : ''
  
  // Tách nội dung theo tiêu đề ####
  const parts = text.split(/####\s+\d+\.\s+/)
  
  const hanNomRaw = parts[1] || ''
  const dichNghiaRaw = parts[2] || ''
  const loiKhuyenRaw = parts[3] || ''
  
  const parseList = (rawText: string) => {
    return rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('*'))
      .map(line => {
        const content = line.substring(1).trim()
        // Format thẻ bold
        return content.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-gold-300 font-semibold">$1</strong>')
      })
  }
  
  return {
    classification,
    hanNom: parseList(hanNomRaw),
    dichNghia: parseList(dichNghiaRaw),
    loiKhuyen: parseList(loiKhuyenRaw)
  }
}

const parsedTien = computed(() => result.value ? parseQueText(result.value.hexagrams.cleaned.tien) : null)
const parsedTrung = computed(() => result.value ? parseQueText(result.value.hexagrams.cleaned.trung) : null)
const parsedHau = computed(() => result.value ? parseQueText(result.value.hexagrams.cleaned.hau) : null)

// Hàm tách các phần của AI Analysis
function parseAiAnalysis(text: string) {
  const sections: Record<string, string> = {
    phongThuy: '',
    phongThuySo: '',
    kinhDich: '',
    thanSo: '',
    chiemTinh: ''
  }
  if (!text) return sections

  const lines = text.split('\n')
  let currentKey = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#')) {
      const cleanedLine = trimmed
        .replace(/[\*\:#]/g, '') // remove *, :, #
        .replace(/[0-9\.\-\(\)]/g, '') // remove numbers, dots, hyphens, parentheses
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // remove emojis
        .trim()
        .toLowerCase();

      if (cleanedLine === 'luận phong thủy') {
        currentKey = 'phongThuy'
      } else if (cleanedLine === 'luận phong thủy số') {
        currentKey = 'phongThuySo'
      } else if (cleanedLine === 'luận kinh dịch') {
        currentKey = 'kinhDich'
      } else if (cleanedLine === 'luận thần số học') {
        currentKey = 'thanSo'
      } else if (cleanedLine === 'luận chiêm tinh') {
        currentKey = 'chiemTinh'
      } else {
        currentKey = ''
      }
    } else if (currentKey) {
      sections[currentKey] += (sections[currentKey] ? '\n' : '') + line
    }
  }

  for (const key in sections) {
    sections[key] = sections[key].trim()
  }

  return sections
}

const aiSections = computed(() => {
  return parseAiAnalysis(result.value?.aiAnalysis || '')
})

function formatMarkdownInline(text: string): string {
  if (!text) return ''
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-gold-300 font-semibold">$1</strong>')
    .replace(/^[-\*]\s+([^\n]+)/gm, '<span class="text-gold-500 mr-1.5">•</span> $1')
}

const formattedAiAnalysis = computed(() => {
  if (!result.value?.aiAnalysis) return ''
  return result.value.aiAnalysis.replace(
    /###\s+([^\n]+)/g,
    '<h4 class="text-sm sm:text-base font-bold text-gold-400 mt-5 mb-2 pb-1 border-b border-slate-800 flex items-center gap-2"><span>🔮</span> $1</h4>'
  )
})


</script>

<template>
  <div v-if="result && user" class="min-h-screen celestial-bg text-slate-100">
    <!-- Background Ambient Glows -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div class="cosmic-glow-1 animate-float-glow-1"></div>
      <div class="cosmic-glow-2 animate-float-glow-2"></div>
      <div class="cosmic-glow-3 animate-float-glow-3"></div>
    </div>

    <!-- Header -->
    <header class="sticky top-0 z-40 border-b border-gold-500/10 bg-slate-900/70 backdrop-blur-md">
      <div class="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <router-link to="/" class="flex items-center gap-2 hover:opacity-85 transition-opacity">
          <div class="halo-effect">
            <img src="/image-bg.png" alt="Di Nhân Phong Thủy Số" class="w-8 h-8 rounded-full object-cover relative z-10" />
          </div>
          <span class="font-bold tracking-wide gold-gradient-text uppercase text-sm sm:text-lg">DI NHÂN PHONG THỦY SỐ</span>
        </router-link>
        <BaseButton variant="ghost" size="sm" class="!text-xs sm:!text-sm" @click="router.push('/')">← Kiểm tra SIM khác</BaseButton>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <!-- Tiêu đề -->
      <div class="text-center space-y-1">
        <p class="text-slate-400 text-sm">Kết quả luận giải cho <strong class="text-slate-200">{{ user.name }}</strong> · Mệnh <strong class="text-gold-400">{{ result.menh }}</strong></p>
        <h2 class="text-2xl sm:text-3xl font-extrabold gold-gradient-text">Báo Cáo Phong Thủy SIM</h2>
      </div>

      <!-- Tổng điểm tương hợp -->
      <GlassCard class="p-6 text-center relative overflow-hidden">
        <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="space-y-1 relative z-10">
          <p class="text-slate-400 text-sm">Số điện thoại: <strong class="text-slate-200">{{ user.phone }}</strong></p>
        </div>
        
        <div class="mt-4 flex flex-col items-center justify-center relative z-10">
          <div class="w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center bg-slate-900/80 shadow-inner relative" :class="scoreCircleClass">
            <div class="absolute inset-0 rounded-full border" :class="scoreInnerPulseClass"></div>
            <span class="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Tương hợp</span>
            <span class="text-5xl font-black leading-none my-1" :class="totalLabel?.color">{{ result.totalScore }}</span>
            <span class="text-slate-500 text-[10px] font-semibold">/100</span>
          </div>
          <div class="text-lg font-bold mt-3" :class="totalLabel?.color">
            Đánh giá: {{ totalLabel?.text }}
          </div>
        </div>
        
        <div class="mt-5 w-full max-w-md mx-auto bg-slate-800 rounded-full h-2 relative z-10">
          <div class="h-2 rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-700 shadow-md shadow-gold-500/30"
               :style="{ width: `${result.totalScore}%` }" />
        </div>
      </GlassCard>

      <!-- Banner Cảnh Báo Hung / Đại Hung -->
      <div v-if="hasĐạiHungOrHung" class="bg-red-500/10 border-2 border-red-500/40 rounded-2xl p-5 flex items-start gap-4 animate-pulse-danger relative z-10 max-w-2xl mx-auto shadow-lg shadow-red-950/20">
        <div class="text-4xl shrink-0 animate-bounce select-none">⚠️</div>
        <div class="space-y-1">
          <h4 class="font-black text-red-400 text-sm sm:text-base uppercase tracking-wider flex items-center gap-1.5">
            Cảnh Báo Phong Thủy Cát Hung!
          </h4>
          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Số điện thoại của bạn chứa quẻ <strong class="text-red-400 font-extrabold underline animate-pulse">ĐẠI HUNG</strong> hoặc <strong class="text-red-400 font-extrabold underline">HUNG</strong> ở các giai đoạn vận mệnh. Điều này báo hiệu sự suy giảm sinh khí, dễ gặp trục trặc, cản trở tài lộc hoặc sức khỏe bất ổn. Quý gia chủ nên xem chi tiết luận giải bên dưới và cân nhắc đăng ký **luận cải vận phong thủy** để hóa giải điềm hung, kích hoạt cát khí.
          </p>
        </div>
      </div>

      <!-- 1️⃣ Nguyên văn quẻ gốc (Stacked from top to bottom) -->
      <div class="space-y-4">
        <h3 class="font-bold text-slate-300 flex items-center gap-2"><span>1️⃣</span> VẬN MỆNH ( theo từng giai đoạn )</h3>
        
        <div class="space-y-4">
          <!-- Tiền Vận Card -->
          <GlassCard :class="['p-6 relative overflow-hidden transition-all duration-300', getVậnCardClass(parsedTien?.classification || '')]">
            <div :class="['absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-all duration-500', getVậnGlowClass(parsedTien?.classification || '')]"></div>
            <div class="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
              <h4 class="text-sm sm:text-base font-bold text-gold-400 flex items-center gap-2">
                <span>{{ getVậnTreeIcon(parsedTien?.classification || '') }}</span> Tiền Vận <span class="text-xs text-slate-500 font-normal"></span>
              </h4>
              <span v-if="parsedTien?.classification" :class="['px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider', getClassificationClass(parsedTien.classification)]">
                {{ parsedTien.classification }}
              </span>
            </div>
            
            <div v-if="parsedTien" class="space-y-4 text-xs sm:text-sm text-slate-300">
              <!-- Hán Nôm -->
              <div v-if="parsedTien.hanNom && parsedTien.hanNom.length" class="space-y-1.5">
                <h5 class="font-semibold text-gold-400 flex items-center gap-1.5">📜 Giải nghĩa từ Hán-Nôm & Ẩn ngữ</h5>
                <ul class="space-y-1 pl-4 list-none">
                  <li v-for="(line, idx) in parsedTien.hanNom" :key="idx" class="relative pl-4 leading-relaxed">
                    <span class="absolute left-0 top-1.5 text-[8px] text-gold-500">✦</span>
                    <span v-html="line"></span>
                  </li>
                </ul>
              </div>
              <!-- Dịch nghĩa -->
              <div v-if="parsedTien.dichNghia && parsedTien.dichNghia.length" class="space-y-1.5">
                <h5 class="font-semibold text-gold-400 flex items-center gap-1.5">📖 Dịch nghĩa thuần Việt & Bình luận</h5>
                <ul class="space-y-1 pl-4 list-none">
                  <li v-for="(line, idx) in parsedTien.dichNghia" :key="idx" class="relative pl-4 leading-relaxed">
                    <span class="absolute left-0 top-1.5 text-[8px] text-gold-500">✦</span>
                    <span v-html="line"></span>
                  </li>
                </ul>
              </div>
              <!-- Lời khuyên -->
              <div v-if="parsedTien.loiKhuyen && parsedTien.loiKhuyen.length" class="space-y-1.5">
                <h5 class="font-semibold text-gold-400 flex items-center gap-1.5">💡 Lời khuyên Phong thủy & Cải vận</h5>
                <ul class="space-y-1 pl-4 list-none">
                  <li v-for="(line, idx) in parsedTien.loiKhuyen" :key="idx" class="relative pl-4 leading-relaxed">
                    <span class="absolute left-0 top-1.5 text-[8px] text-gold-500">✦</span>
                    <span v-html="line"></span>
                  </li>
                </ul>
              </div>
            </div>
            <div v-else class="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {{ result.hexagrams.cleaned.tien }}
            </div>
          </GlassCard>

          <!-- Trung Vận Card -->
          <GlassCard :class="['p-6 relative overflow-hidden transition-all duration-300', getVậnCardClass(parsedTrung?.classification || '')]">
            <div :class="['absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-all duration-500', getVậnGlowClass(parsedTrung?.classification || '')]"></div>
            <div class="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
              <h4 class="text-sm sm:text-base font-bold text-gold-400 flex items-center gap-2">
                <span>{{ getVậnTreeIcon(parsedTrung?.classification || '') }}</span> Trung Vận <span class="text-xs text-slate-500 font-normal"></span>
              </h4>
              <span v-if="parsedTrung?.classification" :class="['px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider', getClassificationClass(parsedTrung.classification)]">
                {{ parsedTrung.classification }}
              </span>
            </div>
            
            <div v-if="parsedTrung" class="space-y-4 text-xs sm:text-sm text-slate-300">
              <!-- Hán Nôm -->
              <div v-if="parsedTrung.hanNom && parsedTrung.hanNom.length" class="space-y-1.5">
                <h5 class="font-semibold text-gold-400 flex items-center gap-1.5">📜 Giải nghĩa từ Hán-Nôm & Ẩn ngữ</h5>
                <ul class="space-y-1 pl-4 list-none">
                  <li v-for="(line, idx) in parsedTrung.hanNom" :key="idx" class="relative pl-4 leading-relaxed">
                    <span class="absolute left-0 top-1.5 text-[8px] text-gold-500">✦</span>
                    <span v-html="line"></span>
                  </li>
                </ul>
              </div>
              <!-- Dịch nghĩa -->
              <div v-if="parsedTrung.dichNghia && parsedTrung.dichNghia.length" class="space-y-1.5">
                <h5 class="font-semibold text-gold-400 flex items-center gap-1.5">📖 Dịch nghĩa thuần Việt & Bình luận</h5>
                <ul class="space-y-1 pl-4 list-none">
                  <li v-for="(line, idx) in parsedTrung.dichNghia" :key="idx" class="relative pl-4 leading-relaxed">
                    <span class="absolute left-0 top-1.5 text-[8px] text-gold-500">✦</span>
                    <span v-html="line"></span>
                  </li>
                </ul>
              </div>
              <!-- Lời khuyên -->
              <div v-if="parsedTrung.loiKhuyen && parsedTrung.loiKhuyen.length" class="space-y-1.5">
                <h5 class="font-semibold text-gold-400 flex items-center gap-1.5">💡 Lời khuyên Phong thủy & Cải vận</h5>
                <ul class="space-y-1 pl-4 list-none">
                  <li v-for="(line, idx) in parsedTrung.loiKhuyen" :key="idx" class="relative pl-4 leading-relaxed">
                    <span class="absolute left-0 top-1.5 text-[8px] text-gold-500">✦</span>
                    <span v-html="line"></span>
                  </li>
                </ul>
              </div>
            </div>
            <div v-else class="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {{ result.hexagrams.cleaned.trung }}
            </div>
          </GlassCard>

          <!-- Hậu Vận Card -->
          <GlassCard :class="['p-6 relative overflow-hidden transition-all duration-300', getVậnCardClass(parsedHau?.classification || '')]">
            <div :class="['absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-all duration-500', getVậnGlowClass(parsedHau?.classification || '')]"></div>
            <div class="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
              <h4 class="text-sm sm:text-base font-bold text-gold-400 flex items-center gap-2">
                <span>{{ getVậnTreeIcon(parsedHau?.classification || '') }}</span> Hậu Vận <span class="text-xs text-slate-500 font-normal"></span>
              </h4>
              <span v-if="parsedHau?.classification" :class="['px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider', getClassificationClass(parsedHau.classification)]">
                {{ parsedHau.classification }}
              </span>
            </div>
            
            <div v-if="parsedHau" class="space-y-4 text-xs sm:text-sm text-slate-300">
              <!-- Hán Nôm -->
              <div v-if="parsedHau.hanNom && parsedHau.hanNom.length" class="space-y-1.5">
                <h5 class="font-semibold text-gold-400 flex items-center gap-1.5">📜 Giải nghĩa từ Hán-Nôm & Ẩn ngữ</h5>
                <ul class="space-y-1 pl-4 list-none">
                  <li v-for="(line, idx) in parsedHau.hanNom" :key="idx" class="relative pl-4 leading-relaxed">
                    <span class="absolute left-0 top-1.5 text-[8px] text-gold-500">✦</span>
                    <span v-html="line"></span>
                  </li>
                </ul>
              </div>
              <!-- Dịch nghĩa -->
              <div v-if="parsedHau.dichNghia && parsedHau.dichNghia.length" class="space-y-1.5">
                <h5 class="font-semibold text-gold-400 flex items-center gap-1.5">📖 Dịch nghĩa thuần Việt & Bình luận</h5>
                <ul class="space-y-1 pl-4 list-none">
                  <li v-for="(line, idx) in parsedHau.dichNghia" :key="idx" class="relative pl-4 leading-relaxed">
                    <span class="absolute left-0 top-1.5 text-[8px] text-gold-500">✦</span>
                    <span v-html="line"></span>
                  </li>
                </ul>
              </div>
              <!-- Lời khuyên -->
              <div v-if="parsedHau.loiKhuyen && parsedHau.loiKhuyen.length" class="space-y-1.5">
                <h5 class="font-semibold text-gold-400 flex items-center gap-1.5">💡 Lời khuyên Phong thủy & Cải vận</h5>
                <ul class="space-y-1 pl-4 list-none">
                  <li v-for="(line, idx) in parsedHau.loiKhuyen" :key="idx" class="relative pl-4 leading-relaxed">
                    <span class="absolute left-0 top-1.5 text-[8px] text-gold-500">✦</span>
                    <span v-html="line"></span>
                  </li>
                </ul>
              </div>
            </div>
            <div v-else class="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {{ result.hexagrams.cleaned.hau }}
            </div>
          </GlassCard>
        </div>
      </div>

      <!-- 2️⃣ Luận Phong thủy & 3️⃣ Luận Phong thủy số (Layout 2 cột trên desktop) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-6">
        <!-- 2️⃣ Luận Phong thủy (Ngũ Hành) -->
        <div class="space-y-3">
          <h3 class="font-bold text-slate-300 flex items-center gap-2"><span>2️⃣</span> Luận Phong thủy (Ngũ Hành)</h3>
          <GlassCard class="p-5 h-full flex flex-col justify-between bg-slate-900/30">
            <div class="space-y-4">
              <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 class="font-bold text-slate-200 flex items-center gap-1.5">
                  <span>⚡</span> Ngũ Hành SIM
                </h4>
                <span class="text-lg font-black text-gold-400">
                  {{ result.nguHanh.score }}<span class="text-xs font-normal text-slate-500">/50</span>
                </span>
              </div>
              
              <div class="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                <span class="text-xs text-slate-400">Đánh giá chung:</span>
                <span class="text-xs font-bold uppercase" :class="ratingColor[result.nguHanh.rating] ?? 'text-slate-300'">
                  {{ result.nguHanh.rating }}
                </span>
              </div>

              <div class="grid grid-cols-3 gap-2 text-center text-xs">
                <div class="bg-slate-900/60 rounded-xl p-2 border border-slate-800/50">
                  <div class="text-lg font-black text-green-400 leading-tight">{{ result.nguHanh.c_sinh }}</div>
                  <div class="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Tương sinh</div>
                </div>
                <div class="bg-slate-900/60 rounded-xl p-2 border border-slate-800/50">
                  <div class="text-lg font-black text-gold-400 leading-tight">{{ result.nguHanh.c_hop }}</div>
                  <div class="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Tương hợp</div>
                </div>
                <div class="bg-slate-900/60 rounded-xl p-2 border border-slate-800/50">
                  <div class="text-lg font-black text-red-400 leading-tight">{{ result.nguHanh.c_khac }}</div>
                  <div class="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Tương khắc</div>
                </div>
              </div>
              
              <p class="text-xs text-slate-400 leading-relaxed">{{ result.nguHanh.details }}</p>
            </div>

            <!-- AI Deep Dive Section (Luận Phong thủy) -->
            <div v-if="aiSections.phongThuy" class="mt-4 pt-4 border-t border-slate-800">
              <h5 class="text-xs font-bold text-gold-400 flex items-center gap-1 mb-1.5">
                <span>🔮</span> Chiêm nghiệm chuyên sâu:
              </h5>
              <div class="text-xs text-slate-300 leading-relaxed" v-html="formatMarkdownInline(aiSections.phongThuy)"></div>
            </div>
          </GlassCard>
        </div>

        <!-- 3️⃣ Luận Phong thủy số (Vận Quẻ) -->
        <div class="space-y-3">
          <h3 class="font-bold text-slate-300 flex items-center gap-2"><span>3️⃣</span> Luận Phong thủy số (Vận Quẻ)</h3>
          <GlassCard class="p-5 h-full flex flex-col justify-between bg-slate-900/30">
            <div class="space-y-4">
              <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 class="font-bold text-slate-200 flex items-center gap-1.5">
                  <span>🎋</span> Vận Quẻ SIM
                </h4>
                <span class="text-lg font-black text-gold-400">
                  {{ result.vanQue.score }}<span class="text-xs font-normal text-slate-500">/50</span>
                </span>
              </div>

              <div class="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                <span class="text-xs text-slate-400">Đánh giá chung:</span>
                <span class="text-xs font-bold uppercase" :class="ratingColor[result.vanQue.rating] ?? 'text-slate-300'">
                  {{ result.vanQue.rating }}
                </span>
              </div>

              <div class="grid grid-cols-3 gap-2 text-center text-xs">
                <div class="bg-slate-900/60 rounded-xl p-2 border border-slate-800/50">
                  <div class="text-xs font-bold text-slate-300 leading-tight truncate">{{ result.vanQue.tienVanQue }}</div>
                  <div class="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Tiền vận</div>
                </div>
                <div class="bg-slate-900/60 rounded-xl p-2 border border-slate-800/50">
                  <div class="text-xs font-bold text-slate-300 leading-tight truncate">{{ result.vanQue.trungVanQue }}</div>
                  <div class="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Trung vận</div>
                </div>
                <div class="bg-slate-900/60 rounded-xl p-2 border border-slate-800/50">
                  <div class="text-xs font-bold text-slate-300 leading-tight truncate">{{ result.vanQue.hauVanQue }}</div>
                  <div class="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Hậu vận</div>
                </div>
              </div>

              <p class="text-xs text-slate-400 leading-relaxed">{{ result.vanQue.details }}</p>
            </div>

            <!-- AI Deep Dive Section (Luận Phong thủy số) -->
            <div v-if="aiSections.phongThuySo" class="mt-4 pt-4 border-t border-slate-800">
              <h5 class="text-xs font-bold text-gold-400 flex items-center gap-1 mb-1.5">
                <span>🔮</span> Chiêm nghiệm chuyên sâu:
              </h5>
              <div class="text-xs text-slate-300 leading-relaxed" v-html="formatMarkdownInline(aiSections.phongThuySo)"></div>
            </div>
          </GlassCard>
        </div>
      </div>

      <!-- 4️⃣ Luận Kinh Dịch -->
      <div class="space-y-3 mt-16">
        <h3 class="font-bold text-slate-300 flex items-center gap-2"><span>4️⃣</span> Luận Kinh Dịch</h3>
        <GlassCard class="p-5 bg-slate-900/30">
          <div v-if="aiSections.kinhDich" class="text-xs sm:text-sm text-slate-300 leading-relaxed" v-html="formatMarkdownInline(aiSections.kinhDich)"></div>
          <div v-else-if="result.aiAnalysis" class="text-xs sm:text-sm text-slate-300 leading-relaxed" v-html="formattedAiAnalysis"></div>
          <div v-else class="text-xs sm:text-sm text-slate-500 italic">Đang cập nhật nội dung Kinh Dịch chi tiết...</div>
        </GlassCard>
      </div>

      <!-- 5️⃣ Luận Thần số học -->
      <div class="space-y-3">
        <h3 class="font-bold text-slate-300 flex items-center gap-2"><span>5️⃣</span> Luận Thần số học</h3>
        <GlassCard class="p-5 bg-slate-900/30">
          <div v-if="aiSections.thanSo" class="text-xs sm:text-sm text-slate-300 leading-relaxed" v-html="formatMarkdownInline(aiSections.thanSo)"></div>
          <div v-else-if="result.aiAnalysis && !aiSections.kinhDich" class="text-xs sm:text-sm text-slate-500 italic">Đã hiển thị ở phần trên</div>
          <div v-else class="text-xs sm:text-sm text-slate-500 italic">Đang cập nhật nội dung Thần số học chi tiết...</div>
        </GlassCard>
      </div>

      <!-- 6️⃣ Luận Chiêm tinh -->
      <div class="space-y-3">
        <h3 class="font-bold text-slate-300 flex items-center gap-2"><span>6️⃣</span> Luận Chiêm tinh</h3>
        <GlassCard class="p-5 bg-slate-900/30">
          <div v-if="aiSections.chiemTinh" class="text-xs sm:text-sm text-slate-300 leading-relaxed" v-html="formatMarkdownInline(aiSections.chiemTinh)"></div>
          <div v-else-if="result.aiAnalysis && !aiSections.kinhDich" class="text-xs sm:text-sm text-slate-500 italic">Đã hiển thị ở phần trên</div>
          <div v-else class="text-xs sm:text-sm text-slate-500 italic">Đang cập nhật nội dung Chiêm tinh chi tiết...</div>
        </GlassCard>
      </div>

      <!-- 7️⃣ Kết luận + CTA -->
      <div class="space-y-4">
        <h3 class="font-bold text-slate-300 flex items-center gap-2"><span>7️⃣</span> Kết luận & Cải vận</h3>
        <GlassCard class="p-6 text-center space-y-4 relative overflow-hidden border-gold-500/20 bg-slate-900/30 shadow-lg">
          <div class="absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-gold-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="text-slate-300 leading-relaxed text-xs sm:text-sm p-4 bg-slate-950/60 rounded-xl border border-slate-800/60 relative z-10 shadow-inner" v-html="conclusionText"></div>

          <!-- Nút CTA mở Bước 2 -->
          <div v-if="!showStep2" class="text-center relative z-10 pt-2">
            <BaseButton
              id="CHECK_DESTINY_COMPATIBILITY"
              size="lg"
              class="!bg-gradient-to-r !from-gold-600 !to-gold-400 !text-slate-950 font-bold active:scale-95 transition-all duration-300 hover:shadow-gold-500/30 hover:scale-[1.01] animate-pulse"
              @click="showStep2 = true"
            >
              🔮 Luận Giải Mệnh Chi Tiết & Chọn Phương Án Cải Vận
            </BaseButton>
          </div>
        </GlassCard>
      </div>

      <!-- ─── BƯỚC 2: LUẬN MỆNH CHI TIẾT & CẢI VẬN (Hiện sau khi nhấn CTA) ─── -->
      <transition enter-active-class="transition duration-500 ease-out" enter-from-class="transform translate-y-8 opacity-0" enter-to-class="transform translate-y-0 opacity-100">
        <GlassCard v-if="showStep2" class="p-6 space-y-6 border-purple-500/20 relative overflow-hidden bg-slate-900/20 shadow-xl">
          <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="text-center space-y-2 relative z-10">
            <h3 class="text-lg sm:text-xl font-black gold-gradient-text uppercase tracking-wide">Bước 2: DI NHÂN CẢI VẬN CHO BẠN</h3>
            <p class="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">Để đzược tư vấn chọn SIM phù hợp và cải thiện vận trình, vui lòng chọn vấn đề bạn đang quan tâm nhất.</p>
          </div>

          <!-- Lựa chọn vấn đề cải vận -->
          <div class="space-y-3 relative z-10">
            <label class="text-xs sm:text-sm font-semibold text-slate-300 block text-center uppercase tracking-wider text-gold-400">
              Vấn đề bạn cần cải vận nhất <span class="text-red-400">*</span>
            </label>
            <p class="text-[11px] text-gold-400/80 text-center italic mt-0.5">
              💡 Chú ý: Gói 200k chọn đúng 2 vấn đề; Gói 500k được hỗ trợ toàn bộ cả 5 vấn đề.
            </p>
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 max-w-2xl mx-auto">
              <button
                v-for="area in TOPICS"
                :key="area"
                type="button"
                @click="toggleTopic(area)"
                :class="[
                  'py-2.5 px-3 rounded-xl text-xs font-bold border transition-all duration-300 active:scale-95 shadow-sm',
                  selectedTopics.includes(area)
                    ? 'bg-gradient-to-r from-gold-600 to-gold-400 border-gold-400 text-slate-950 shadow-md shadow-gold-500/20'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-gold-500/30 hover:text-slate-200 hover:bg-slate-800/60',
                ]"
              >{{ area }}</button>
            </div>
          </div>

          <!-- Hiển thị các gói cải vận khi đã chọn ít nhất 1 chủ đề -->
          <div v-if="selectedTopics.length > 0" class="space-y-5 pt-6 border-t border-slate-800/80 relative z-10">
            <p v-if="checkoutError" class="text-xs sm:text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-center font-medium">{{ checkoutError }}</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
              <!-- Gói 200k -->
              <div class="border border-gold-500/20 rounded-2xl p-6 space-y-4 hover:border-gold-500/50 transition-all duration-300 bg-slate-950/40 backdrop-blur-md flex flex-col justify-between shadow-md">
                <div class="space-y-4">
                  <div class="border-b border-slate-800/60 pb-3 flex justify-between items-start">
                    <div>
                      <h4 class="font-black text-sm sm:text-base text-slate-200 flex items-center gap-1.5">
                        <span>💬</span> Đổi SIM Cải Vận
                      </h4>
                      <p class="text-gold-400 font-extrabold text-xs sm:text-sm mt-0.5">Tư vấn chọn SIM mới phù hợp</p>
                    </div>
                    <div class="text-right">
                      <span class="text-gold-300 font-black text-base sm:text-lg">{{ formatCurrency(PRICE_200K) }}</span>
                    </div>
                  </div>
                  
                  <ul class="text-xs text-slate-400 space-y-2">
                    <li class="flex items-start gap-1.5"><span class="text-gold-500 font-bold">✔</span> Luận giải chọn SIM mới (chưa gồm tiền mua SIM)</li>
                    <li class="flex items-start gap-1.5"><span class="text-gold-500 font-bold">✔</span> Giá SIM đề xuất dao động từ 2 – 3 triệu trở xuống</li>
                    <li class="flex items-start gap-1.5"><span class="text-gold-500 font-bold">✔</span> Tư vấn chuyên biệt để cải thiện khía cạnh <span class="text-gold-300 font-bold">"{{ selectedTopics.join(', ') }}"</span></li>
                    <li class="flex items-start gap-1.5"><span class="text-gold-500 font-bold">✔</span> Chat trực tiếp trao đổi thông tin với dịch sư</li>
                    <li class="flex items-start gap-1.5"><span class="text-gold-500 font-bold">✔</span> Nhận tử vi nhắc nhở vận cát hung hàng tháng qua Email</li>
                  </ul>
                  
                  <!-- Chọn nhà mạng -->
                  <div class="space-y-2 pt-2 border-t border-slate-900/60">
                    <p class="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                      <span>📶</span> Chọn nhà mạng bạn mong muốn <span class="text-red-400">*</span>
                    </p>
                    <div class="flex flex-wrap gap-1.5">
                      <button
                        v-for="c in CARRIERS" :key="c"
                        type="button"
                        @click="selectedCarrier = c"
                        :class="[
                          'text-[10px] sm:text-xs px-3 py-1.5 rounded-full border transition-all duration-200 font-bold',
                          selectedCarrier === c
                            ? 'bg-gold-500/20 border-gold-500 text-gold-300 shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-gold-500/40 hover:text-slate-300'
                        ]"
                      >{{ c }}</button>
                    </div>
                  </div>
                </div>
                
                <BaseButton class="mt-5" full-width :loading="orderStore.isCreating" @click="selectPackage('200k')">
                  Đăng ký chọn SIM
                </BaseButton>
              </div>

              <!-- Gói 500k -->
              <div class="border border-purple-500/30 rounded-2xl p-6 space-y-4 hover:border-purple-500/60 transition-all duration-300 bg-slate-950/40 backdrop-blur-md relative flex flex-col justify-between shadow-lg shadow-purple-500/5">
                <div class="absolute -top-3 right-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md shadow-purple-500/30">Cao cấp</div>
                
                <div class="space-y-4">
                  <div class="border-b border-slate-800/60 pb-3 flex justify-between items-start">
                    <div>
                      <h4 class="font-black text-sm sm:text-base text-purple-300 flex items-center gap-1.5">
                        <span>🌟</span> Tư Vấn Chuyên Sâu
                      </h4>
                      <p class="text-purple-400 font-extrabold text-xs sm:text-sm mt-0.5">Bản luận giải cuộc đời chi tiết</p>
                    </div>
                    <div class="text-right">
                      <span class="text-purple-300 font-black text-base sm:text-lg">{{ formatCurrency(PRICE_500K) }}</span>
                    </div>
                  </div>
                  
                  <ul class="text-xs text-slate-400 space-y-2">
                    <li class="flex items-start gap-1.5"><span class="text-purple-500 font-bold">✔</span> Luận giải chi tiết chuyên sâu về các chủ đề <span class="text-purple-300 font-bold">"{{ selectedTopics.length === 5 ? 'Tất cả 5 khía cạnh' : selectedTopics.join(', ') }}"</span></li>
                    <li class="flex items-start gap-1.5"><span class="text-purple-500 font-bold">✔</span> Trực tiếp đàm luận qua Zalo cùng dịch sư phong thủy</li>
                    <li class="flex items-start gap-1.5"><span class="text-purple-500 font-bold">✔</span> Hỗ trợ xem và chọn SIM cải vận hoàn toàn miễn phí đi kèm</li>
                    <li class="flex items-start gap-1.5"><span class="text-purple-500 font-bold">✔</span> Phân tích can chi, cung phi và các đại hạn trong năm</li>
                    <li class="flex items-start gap-1.5"><span class="text-purple-500 font-bold">✔</span> Nhận tử vi nhắc nhở vận cát hung hàng tuần qua Email</li>
                  </ul>
                </div>
                
                <BaseButton class="mt-5 !bg-gradient-to-r !from-purple-600 !to-purple-800 !text-white hover:!from-purple-500 hover:!to-purple-700 hover:shadow-purple-500/20" full-width :loading="orderStore.isCreating" @click="selectPackage('500k')">
                  Đăng ký đàm luận
                </BaseButton>
              </div>
            </div>

            <p class="text-center text-xs text-slate-500 pt-3">
              Cần tư vấn hỗ trợ trước? →
              <a :href="ZALO_LINK" target="_blank" class="text-gold-400 hover:text-gold-300 font-bold hover:underline">Liên hệ Zalo miễn phí</a>
            </p>
          </div>
        </GlassCard>
      </transition>
    </main>

    <!-- Checkout Modal -->
    <CheckoutModal
      v-if="showCheckout && orderStore.currentOrder"
      :carrier="selectedPackage === '200k' ? selectedCarrier : undefined"
      :consultation-topic="selectedTopics.join(', ')"
      :referral-code="user.referralCode ?? undefined"
      @close="showCheckout = false"
    />
  </div>
</template>

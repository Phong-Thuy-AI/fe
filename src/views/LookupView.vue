<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import { ZALO_LINK } from '@/utils/constants'
import { scoreLabel, getVậnTreeIcon, getVậnCardClass, getVậnGlowClass, getClassificationClass } from '@/utils/helpers'
import type { LookupResponse, LookupOrderItem, FengshuiResult } from '@/types'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import GlassCard from '@/components/base/GlassCard.vue'

const router = useRouter()

const form = reactive({ email: '', phone: '' })
const isLoading = ref(false)
const formError = ref('')
const result = ref<LookupResponse | null>(null)

const parsedCheckResult = (): FengshuiResult | null => {
  if (!result.value?.user.lastCheckResult) return null
  try { return JSON.parse(result.value.user.lastCheckResult) } catch { return null }
}

function validate(): boolean {
  if (form.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) { formError.value = 'Email không đúng định dạng.'; return false }
  }
  if (form.phone.replace(/\D/g, '').length < 6) { formError.value = 'Số điện thoại phải chứa tối thiểu 6 chữ số.'; return false }
  return true
}

async function submit() {
  formError.value = ''
  result.value = null
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
  'Khuyên đổi SIM': 'text-orange-400', 'Khuyên bỏ SIM': 'text-red-500',
  'Không tốt': 'text-red-400'
}

function getClassificationColor(cls: string | undefined): string {
  if (!cls) return 'text-slate-300'
  const c = cls.trim().toUpperCase()
  if (c.includes('ĐẠI CÁT')) return 'text-emerald-400 font-extrabold'
  if (c.includes('ĐẠI HUNG')) return 'text-red-500 font-extrabold'
  if (c.includes('CÁT')) return 'text-green-400 font-bold'
  if (c.includes('HUNG')) return 'text-red-400 font-bold'
  return 'text-slate-300'
}

const userObj = computed(() => result.value?.user)
const resultObj = computed(() => parsedCheckResult())

const totalLabelObj = computed(() => resultObj.value ? scoreLabel(resultObj.value.totalScore) : null)

const hasĐạiHungOrHungObj = computed(() => {
  if (!resultObj.value) return false
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

const scoreCircleClassObj = computed(() => {
  if (!resultObj.value) return 'border-slate-800/80 shadow-inner'
  const score = resultObj.value.totalScore
  if (score >= 60) return 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
  if (score >= 40) return 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
  return 'border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.35)] animate-pulse-danger'
})

const scoreInnerPulseClassObj = computed(() => {
  if (!resultObj.value) return 'border-gold-500/20 animate-pulse'
  const score = resultObj.value.totalScore
  if (score >= 60) return 'border-emerald-500/20 animate-pulse'
  if (score >= 40) return 'border-amber-500/20 animate-pulse'
  return 'border-red-500/50 animate-ping'
})

const parsedTien = computed(() => resultObj.value ? parseQueText(resultObj.value.hexagrams.cleaned.tien) : null)
const parsedTrung = computed(() => resultObj.value ? parseQueText(resultObj.value.hexagrams.cleaned.trung) : null)
const parsedHau = computed(() => resultObj.value ? parseQueText(resultObj.value.hexagrams.cleaned.hau) : null)

const aiSectionsObj = computed(() => {
  return parseAiAnalysis(resultObj.value?.aiAnalysis || '')
})

const isHungGroupObj = computed(() => {
  if (!resultObj.value) return false
  const totalScore = resultObj.value.totalScore
  const nguHanhRating = resultObj.value.nguHanh.rating
  const vanQueRating = resultObj.value.vanQue.rating
  
  return (
    totalScore < 50 ||
    nguHanhRating === 'Không đạt' ||
    vanQueRating === 'Khuyên bỏ SIM' ||
    vanQueRating === 'Khuyên đổi SIM' ||
    vanQueRating === 'Không tốt'
  )
})

const conclusionTextObj = computed(() => {
  if (isHungGroupObj.value) {
    return `<div class="space-y-3 text-left">
      <p class="leading-relaxed">
        ⚠️ <strong class="text-red-400 font-extrabold uppercase">Đánh giá chung:</strong> Số điện thoại này <strong class="text-red-400 font-black underline">chứa nhiều điềm hung, khắc mệnh</strong> và không phù hợp làm số liên lạc chủ đạo lâu dài. Việc tiếp tục sử dụng có thể cản trở tài vận, gây bất hòa gia đạo và làm hao tổn sinh khí cát tường.
      </p>
      <div class="h-px bg-slate-800/80 my-2"></div>
      <p class="leading-relaxed text-gold-300 font-medium">
        👉 <strong>Khuyên dùng:</strong> Hãy đăng ký luận giải mệnh lý chi tiết và phương án cải vận để được Dịch sư hỗ trợ hóa giải quẻ xấu, đổi SIM đại cát.
      </p>
    </div>`
  } else {
    return `<div class="space-y-3 text-left">
      <p class="leading-relaxed">
        ✨ <strong class="text-emerald-400 font-extrabold uppercase">Đánh giá chung:</strong> Số điện thoại này có các yếu tố phong thủy <strong class="text-emerald-400 font-black">tương đối cát lợi và hài hòa</strong>. Tuy nhiên, một số SIM cát chung chưa chắc đã bổ trợ đúng hành khuyết trong bản mệnh (Bát Tự) của riêng bạn.
      </p>
      <div class="h-px bg-slate-800/80 my-2"></div>
      <p class="leading-relaxed text-gold-300 font-medium">
        👉 <strong>Lời khuyên Dịch sư:</strong> Nên cân nhắc đối chiếu chuyên sâu SIM này với Giờ/Ngày/Tháng/Năm sinh cụ thể của bạn để tối ưu hóa sự tương hợp và cát khí.
      </p>
    </div>`
  }
})



function parseQueText(text: string) {
  if (!text) return null
  
  const classMatch = text.match(/\*\*Phân loại\*\*:\s*\*\*([^*]+)\*\*/i)
  const classification = classMatch ? classMatch[1].trim() : ''
  
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
        .replace(/[\*\:#]/g, '')
        .replace(/[0-9\.\-\(\)]/g, '')
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
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

function formatMarkdownInline(text: string): string {
  if (!text) return ''
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-gold-300 font-semibold">$1</strong>')
    .replace(/^[-\*]\s+([^\n]+)/gm, '<span class="text-gold-500 mr-1.5">•</span> $1')
}

const formattedAiAnalysis = computed(() => {
  if (!resultObj.value?.aiAnalysis) return ''
  return resultObj.value.aiAnalysis.replace(
    /###\s+([^\n]+)/g,
    '<h4 class="text-sm sm:text-base font-bold text-gold-400 mt-5 mb-2 pb-1 border-b border-slate-800 flex items-center gap-2"><span>🔮</span> $1</h4>'
  )
})
</script>

<template>
  <div class="min-h-screen celestial-bg text-slate-100">
    <!-- Background Ambient Glows -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div class="cosmic-glow-1 animate-float-glow-1"></div>
      <div class="cosmic-glow-2 animate-float-glow-2"></div>
      <div class="cosmic-glow-3 animate-float-glow-3"></div>
    </div>
    <header class="sticky top-0 z-40 border-b border-gold-500/10 bg-slate-900/70 backdrop-blur-md">
      <div :class="['mx-auto px-4 h-16 flex items-center justify-between transition-all duration-300', result ? 'max-w-4xl' : 'max-w-lg']">
        <router-link to="/" class="flex items-center gap-2 hover:opacity-85 transition-opacity">
          <div class="halo-effect">
            <img src="/image-bg.png" alt="Di Nhân Phong Thủy Số" class="w-8 h-8 rounded-full object-cover relative z-10" />
          </div>
          <span class="font-bold tracking-wide gold-gradient-text uppercase text-sm sm:text-lg">DI NHÂN PHONG THỦY SỐ</span>
        </router-link>
        <button v-if="result" class="text-xs sm:text-sm text-slate-400 hover:text-gold-300 transition" @click="result = null; form.email = ''; form.phone = ''">
          ← Tra cứu số khác
        </button>
        <router-link v-else to="/" class="text-xs sm:text-sm text-slate-400 hover:text-gold-300 transition">← Trang chủ</router-link>
      </div>
    </header>

    <main :class="['mx-auto px-4 py-10 space-y-8 transition-all duration-300', result ? 'max-w-4xl' : 'max-w-lg']">
      <!-- Title when no result -->
      <div v-if="!result" class="text-center space-y-2">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-500/10 text-4xl mb-2">🔍</div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight"><span class="gold-gradient-text">Tra Cứu Lịch Sử</span></h1>
        <p class="text-slate-400 text-sm max-w-sm mx-auto">Nhập Số điện thoại đã đăng ký để xem lại lịch sử và quay lại phòng tư vấn.</p>
      </div>

      <!-- Form -->
      <GlassCard v-if="!result" class="p-6 space-y-4 relative overflow-hidden">
        <div v-if="isLoading" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl gap-3">
          <div class="relative w-12 h-12">
            <div class="absolute inset-0 rounded-full border-4 border-gold-500/20"></div>
            <div class="absolute inset-0 rounded-full border-4 border-t-gold-400 animate-spin"></div>
            <img src="/image.png" alt="Loading" class="absolute inset-0 m-auto w-6 h-6 rounded-full object-cover" />
          </div>
          <p class="text-gold-300 text-sm font-medium animate-pulse">Đang tra cứu...</p>
        </div>
        <div class="flex flex-col gap-1">
          <BaseInput v-model="form.email" label="Email đã đăng ký (không bắt buộc)" type="email" placeholder="email@example.com" @keyup.enter="submit" />
          <span class="text-[11px] text-slate-500 italic leading-normal px-0.5">
            * Gmail chỉ có tác dụng khi bạn cần mua gói tử vi hằng ngày hoặc gói sẽ tự động tặng khi có giao dịch trên trang
          </span>
        </div>
        <BaseInput v-model="form.phone" label="Số điện thoại đã đăng ký" placeholder="0912345678" required @keyup.enter="submit" />
        <p v-if="formError" class="text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-2">{{ formError }}</p>
        <BaseButton size="lg" full-width :loading="isLoading" @click="submit">🔍 Tra Cứu Lịch Sử</BaseButton>
      </GlassCard>

      <!-- Kết quả -->
      <template v-if="result">
        <!-- Tiêu đề kết quả (giống trang Result) -->
        <div class="text-center space-y-1">
          <p class="text-slate-400 text-sm">Kết quả lịch sử cho <strong class="text-slate-200">{{ result.user.name }}</strong> · Mệnh <strong class="text-gold-400">{{ result.user.menh }}</strong></p>
          <h2 class="text-2xl sm:text-3xl font-extrabold gold-gradient-text">Báo Cáo Phong Thủy SIM</h2>
        </div>

        <!-- Referral code: chỉ hiện nếu đã mua gói (có đơn hàng paid/completed) -->
        <GlassCard v-if="result.user.referralCode && result.orders.length > 0" class="p-4 border border-gold-500/20 max-w-md mx-auto">
          <div class="flex items-center justify-between bg-slate-900/60 rounded-xl px-4 py-2.5">
            <div class="text-left">
              <p class="text-xs text-slate-500">Mã giới thiệu của bạn</p>
              <p class="font-mono text-base font-bold text-gold-400">{{ result.user.referralCode }}</p>
            </div>
            <p class="text-xs text-slate-500 text-right max-w-[150px]">Chia sẻ → nhận +1 tháng tử vi miễn phí</p>
          </div>
        </GlassCard>

        <!-- Báo Cáo Phong Thủy SIM (Unfolded, exactly styled like Result page) -->
        <template v-if="resultObj">
          <!-- Tổng điểm tương hợp -->
          <GlassCard class="p-6 text-center relative overflow-hidden">
            <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="space-y-1 relative z-10">
              <p class="text-slate-400 text-sm">Số điện thoại: <strong class="text-slate-200">{{ userObj?.phone }}</strong></p>
            </div>
            
            <div class="mt-4 flex flex-col items-center justify-center relative z-10">
              <div class="w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center bg-slate-900/80 shadow-inner relative" :class="scoreCircleClassObj">
                <div class="absolute inset-0 rounded-full border" :class="scoreInnerPulseClassObj"></div>
                <span class="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Tương hợp</span>
                <span class="text-5xl font-black leading-none my-1" :class="totalLabelObj?.color">{{ resultObj.totalScore }}</span>
                <span class="text-slate-500 text-[10px] font-semibold">/100</span>
              </div>
              <div class="text-lg font-bold mt-3" :class="totalLabelObj?.color">
                Đánh giá: {{ totalLabelObj?.text }}
              </div>
            </div>
            
            <div class="mt-5 w-full max-w-md mx-auto bg-slate-800 rounded-full h-2 relative z-10">
              <div class="h-2 rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-700 shadow-md shadow-gold-500/30"
                   :style="{ width: `${resultObj.totalScore}%` }" />
            </div>
          </GlassCard>

          <!-- Banner Cảnh Báo Hung / Đại Hung -->
          <div v-if="hasĐạiHungOrHungObj" class="bg-red-500/10 border-2 border-red-500/40 rounded-2xl p-5 flex items-start gap-4 animate-pulse-danger relative z-10 max-w-2xl mx-auto shadow-lg shadow-red-950/20">
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

          <!-- 1️⃣ VẬN MỆNH (theo từng giai đoạn) -->
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
                  <div v-if="parsedTien.hanNom && parsedTien.hanNom.length" class="space-y-1.5">
                    <h5 class="font-semibold text-gold-400 flex items-center gap-1.5">📜 Giải nghĩa từ Hán-Nôm & Ẩn ngữ</h5>
                    <ul class="space-y-1 pl-4 list-none">
                      <li v-for="(line, idx) in parsedTien.hanNom" :key="idx" class="relative pl-4 leading-relaxed">
                        <span class="absolute left-0 top-1.5 text-[8px] text-gold-500">✦</span>
                        <span v-html="line"></span>
                      </li>
                    </ul>
                  </div>
                  <div v-if="parsedTien.dichNghia && parsedTien.dichNghia.length" class="space-y-1.5">
                    <h5 class="font-semibold text-gold-400 flex items-center gap-1.5">📖 Dịch nghĩa thuần Việt & Bình luận</h5>
                    <ul class="space-y-1 pl-4 list-none">
                      <li v-for="(line, idx) in parsedTien.dichNghia" :key="idx" class="relative pl-4 leading-relaxed">
                        <span class="absolute left-0 top-1.5 text-[8px] text-gold-500">✦</span>
                        <span v-html="line"></span>
                      </li>
                    </ul>
                  </div>
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
                  {{ resultObj.hexagrams.cleaned.tien }}
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
                  <div v-if="parsedTrung.hanNom && parsedTrung.hanNom.length" class="space-y-1.5">
                    <h5 class="font-semibold text-gold-400 flex items-center gap-1.5">📜 Giải nghĩa từ Hán-Nôm & Ẩn ngữ</h5>
                    <ul class="space-y-1 pl-4 list-none">
                      <li v-for="(line, idx) in parsedTrung.hanNom" :key="idx" class="relative pl-4 leading-relaxed">
                        <span class="absolute left-0 top-1.5 text-[8px] text-gold-500">✦</span>
                        <span v-html="line"></span>
                      </li>
                    </ul>
                  </div>
                  <div v-if="parsedTrung.dichNghia && parsedTrung.dichNghia.length" class="space-y-1.5">
                    <h5 class="font-semibold text-gold-400 flex items-center gap-1.5">📖 Dịch nghĩa thuần Việt & Bình luận</h5>
                    <ul class="space-y-1 pl-4 list-none">
                      <li v-for="(line, idx) in parsedTrung.dichNghia" :key="idx" class="relative pl-4 leading-relaxed">
                        <span class="absolute left-0 top-1.5 text-[8px] text-gold-500">✦</span>
                        <span v-html="line"></span>
                      </li>
                    </ul>
                  </div>
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
                  {{ resultObj.hexagrams.cleaned.trung }}
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
                  <div v-if="parsedHau.hanNom && parsedHau.hanNom.length" class="space-y-1.5">
                    <h5 class="font-semibold text-gold-400 flex items-center gap-1.5">📜 Giải nghĩa từ Hán-Nôm & Ẩn ngữ</h5>
                    <ul class="space-y-1 pl-4 list-none">
                      <li v-for="(line, idx) in parsedHau.hanNom" :key="idx" class="relative pl-4 leading-relaxed">
                        <span class="absolute left-0 top-1.5 text-[8px] text-gold-500">✦</span>
                        <span v-html="line"></span>
                      </li>
                    </ul>
                  </div>
                  <div v-if="parsedHau.dichNghia && parsedHau.dichNghia.length" class="space-y-1.5">
                    <h5 class="font-semibold text-gold-400 flex items-center gap-1.5">📖 Dịch nghĩa thuần Việt & Bình luận</h5>
                    <ul class="space-y-1 pl-4 list-none">
                      <li v-for="(line, idx) in parsedHau.dichNghia" :key="idx" class="relative pl-4 leading-relaxed">
                        <span class="absolute left-0 top-1.5 text-[8px] text-gold-500">✦</span>
                        <span v-html="line"></span>
                      </li>
                    </ul>
                  </div>
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
                  {{ resultObj.hexagrams.cleaned.hau }}
                </div>
              </GlassCard>
            </div>
          </div>

          <!-- 2️⃣ Luận Phong thủy & 3️⃣ Luận Phong thủy số (Layout 2 cột) -->
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
                      {{ resultObj.nguHanh.score }}<span class="text-xs font-normal text-slate-500">/50</span>
                    </span>
                  </div>
                  
                  <div class="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                    <span class="text-xs text-slate-400">Đánh giá chung:</span>
                    <span class="text-xs font-bold uppercase" :class="ratingColor[resultObj.nguHanh.rating] ?? 'text-slate-300'">
                      {{ resultObj.nguHanh.rating }}
                    </span>
                  </div>

                  <div class="grid grid-cols-3 gap-2 text-center text-xs">
                    <div class="bg-slate-900/60 rounded-xl p-2 border border-slate-800/50">
                      <div class="text-lg font-black text-green-400 leading-tight">{{ resultObj.nguHanh.c_sinh }}</div>
                      <div class="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Tương sinh</div>
                    </div>
                    <div class="bg-slate-900/60 rounded-xl p-2 border border-slate-800/50">
                      <div class="text-lg font-black text-gold-400 leading-tight">{{ resultObj.nguHanh.c_hop }}</div>
                      <div class="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Tương hợp</div>
                    </div>
                    <div class="bg-slate-900/60 rounded-xl p-2 border border-slate-800/50">
                      <div class="text-lg font-black text-red-400 leading-tight">{{ resultObj.nguHanh.c_khac }}</div>
                      <div class="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Tương khắc</div>
                    </div>
                  </div>
                  
                  <p class="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{{ resultObj.nguHanh.details }}</p>
                </div>

                <!-- AI Deep Dive Section (Luận Phong thủy) -->
                <div v-if="aiSectionsObj.phongThuy" class="mt-4 pt-4 border-t border-slate-800">
                  <h5 class="text-xs font-bold text-gold-400 flex items-center gap-1 mb-1.5">
                    <span>🔮</span> Chiêm nghiệm chuyên sâu:
                  </h5>
                  <div class="text-xs text-slate-300 leading-relaxed" v-html="formatMarkdownInline(aiSectionsObj.phongThuy)"></div>
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
                      {{ resultObj.vanQue.score }}<span class="text-xs font-normal text-slate-500">/50</span>
                    </span>
                  </div>

                  <div class="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                    <span class="text-xs text-slate-400">Đánh giá chung:</span>
                    <span class="text-xs font-bold uppercase" :class="ratingColor[resultObj.vanQue.rating] ?? 'text-slate-300'">
                      {{ resultObj.vanQue.rating }}
                    </span>
                  </div>

                  <div class="grid grid-cols-3 gap-2 text-center text-xs">
                    <div class="bg-slate-900/60 rounded-xl p-2 border border-slate-800/50">
                      <div class="text-[10px] font-bold leading-tight uppercase" :class="getClassificationColor(parsedTien?.classification)">
                        {{ parsedTien?.classification || 'CÁT' }}
                      </div>
                      <div class="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Tiền vận</div>
                    </div>
                    <div class="bg-slate-900/60 rounded-xl p-2 border border-slate-800/50">
                      <div class="text-[10px] font-bold leading-tight uppercase" :class="getClassificationColor(parsedTrung?.classification)">
                        {{ parsedTrung?.classification || 'HUNG' }}
                      </div>
                      <div class="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Trung vận</div>
                    </div>
                    <div class="bg-slate-900/60 rounded-xl p-2 border border-slate-800/50">
                      <div class="text-[10px] font-bold leading-tight uppercase" :class="getClassificationColor(parsedHau?.classification)">
                        {{ parsedHau?.classification || 'ĐẠI CÁT' }}
                      </div>
                      <div class="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Hậu vận</div>
                    </div>
                  </div>

                  <p class="text-xs text-slate-400 leading-relaxed">{{ resultObj.vanQue.details }}</p>
                </div>

                <!-- AI Deep Dive Section (Luận Phong thủy số) -->
                <div v-if="aiSectionsObj.phongThuySo" class="mt-4 pt-4 border-t border-slate-800">
                  <h5 class="text-xs font-bold text-gold-400 flex items-center gap-1 mb-1.5">
                    <span>🔮</span> Chiêm nghiệm chuyên sâu:
                  </h5>
                  <div class="text-xs text-slate-300 leading-relaxed" v-html="formatMarkdownInline(aiSectionsObj.phongThuySo)"></div>
                </div>
              </GlassCard>
            </div>
          </div>

          <!-- 4️⃣ Luận Kinh Dịch -->
          <div class="space-y-3 mt-16">
            <h3 class="font-bold text-slate-300 flex items-center gap-2"><span>4️⃣</span> Luận Kinh Dịch</h3>
            <GlassCard class="p-5 bg-slate-900/30">
              <div v-if="aiSectionsObj.kinhDich" class="text-xs sm:text-sm text-slate-300 leading-relaxed" v-html="formatMarkdownInline(aiSectionsObj.kinhDich)"></div>
              <div v-else-if="resultObj.aiAnalysis" class="text-xs sm:text-sm text-slate-300 leading-relaxed" v-html="formattedAiAnalysis"></div>
              <div v-else class="text-xs sm:text-sm text-slate-500 italic">Đang cập nhật nội dung Kinh Dịch chi tiết...</div>
            </GlassCard>
          </div>

          <!-- 5️⃣ Luận Thần số học -->
          <div class="space-y-3">
            <h3 class="font-bold text-slate-300 flex items-center gap-2"><span>5️⃣</span> Luận Thần số học</h3>
            <GlassCard class="p-5 bg-slate-900/30">
              <div v-if="aiSectionsObj.thanSo" class="text-xs sm:text-sm text-slate-300 leading-relaxed" v-html="formatMarkdownInline(aiSectionsObj.thanSo)"></div>
              <div v-else-if="resultObj.aiAnalysis && !aiSectionsObj.kinhDich" class="text-xs sm:text-sm text-slate-500 italic">Đã hiển thị ở phần trên</div>
              <div v-else class="text-xs sm:text-sm text-slate-500 italic">Đang cập nhật nội dung Thần số học chi tiết...</div>
            </GlassCard>
          </div>

          <!-- 6️⃣ Luận Chiêm tinh -->
          <div class="space-y-3">
            <h3 class="font-bold text-slate-300 flex items-center gap-2"><span>6️⃣</span> Luận Chiêm tinh</h3>
            <GlassCard class="p-5 bg-slate-900/30">
              <div v-if="aiSectionsObj.chiemTinh" class="text-xs sm:text-sm text-slate-300 leading-relaxed" v-html="formatMarkdownInline(aiSectionsObj.chiemTinh)"></div>
              <div v-else-if="resultObj.aiAnalysis && !aiSectionsObj.kinhDich" class="text-xs sm:text-sm text-slate-500 italic">Đã hiển thị ở phần trên</div>
              <div v-else class="text-xs sm:text-sm text-slate-500 italic">Đang cập nhật nội dung Chiêm tinh chi tiết...</div>
            </GlassCard>
          </div>

          <!-- 7️⃣ Kết luận & Cải vận -->
          <div class="space-y-3">
            <h3 class="font-bold text-slate-300 flex items-center gap-2"><span>7️⃣</span> Kết luận & Cải vận</h3>
            <GlassCard class="p-6 text-center space-y-4 relative overflow-hidden border-gold-500/20 bg-slate-900/30 shadow-lg">
              <div class="absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-gold-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div class="text-slate-300 leading-relaxed text-xs sm:text-sm p-4 bg-slate-950/60 rounded-xl border border-slate-800/60 relative z-10 shadow-inner" v-html="conclusionTextObj"></div>
            </GlassCard>
          </div>
        </template>

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

    <footer class="text-center py-6 text-xs text-slate-600">© 2026 DI NHÂN PHONG THỦY SỐ</footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Bar, Chart, Doughnut, Line } from 'vue-chartjs'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  ArcElement,
  PointElement,
  Tooltip
} from 'chart.js'
import { api } from '@/services/api'
import { formatCurrency } from '@/utils/helpers'
import GlassCard from '@/components/base/GlassCard.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend)

type RangeOption = 7 | 30 | 90

interface ReportSummary {
  pageViews: number
  uniqueVisitors: number
  simChecks: number
  conversionRate: number
  orders: number
  paidOrders: number
  revenue: number
  pendingOrders: number
  activeChats: number
  emailSuccess: number
  emailFailed: number
  newUsers?: number
}

interface ReportSeriesPoint {
  date: string
  pageViews: number
  uniqueVisitors: number
  simChecks: number
  orders: number
  revenue: number
}

interface BreakdownItem {
  label: string
  value: number
  revenue?: number
}

interface ReportData {
  range: RangeOption
  summary: ReportSummary
  series: ReportSeriesPoint[]
  breakdowns: {
    orderStatus: BreakdownItem[]
    packageTypes: BreakdownItem[]
    focusAreas: BreakdownItem[]
    chatSources: BreakdownItem[]
    emailStatus: BreakdownItem[]
  }
}

const selectedRange = ref<RangeOption>(30)
const loading = ref(false)
const error = ref('')
const report = ref<ReportData | null>(null)

const chartColors = {
  gold: '#dbba64',
  green: '#22c55e',
  blue: '#38bdf8',
  red: '#ef4444',
  purple: '#a78bfa',
  slate: '#64748b'
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#cbd5e1', boxWidth: 10, boxHeight: 10 }
    },
    tooltip: {
      backgroundColor: '#020617',
      titleColor: '#f8fafc',
      bodyColor: '#cbd5e1',
      borderColor: 'rgba(219, 186, 100, 0.35)',
      borderWidth: 1
    }
  },
  scales: {
    x: {
      ticks: { color: '#94a3b8', maxRotation: 0, autoSkip: true },
      grid: { color: 'rgba(148, 163, 184, 0.08)' }
    },
    y: {
      beginAtZero: true,
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(148, 163, 184, 0.1)' }
    }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: '#cbd5e1', boxWidth: 10, boxHeight: 10 }
    },
    tooltip: {
      backgroundColor: '#020617',
      titleColor: '#f8fafc',
      bodyColor: '#cbd5e1',
      borderColor: 'rgba(219, 186, 100, 0.35)',
      borderWidth: 1
    }
  }
}

async function fetchReport() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<{ data: ReportData }>('/admin/reports/overview', {
      params: { range: selectedRange.value }
    })
    report.value = res.data.data
  } catch (err: any) {
    error.value = err?.response?.data?.error?.message || 'Không tải được báo cáo.'
  } finally {
    loading.value = false
  }
}

function displayLabel(label: string) {
  const labels: Record<string, string> = {
    pending: 'Đang chờ',
    paid: 'Đã thanh toán',
    completed: 'Hoàn thành',
    expired: 'Hết hạn',
    direct: 'Trực tiếp',
    referral: 'Giới thiệu',
    success: 'Thành công',
    failed: 'Thất bại',
    'Khong xac dinh': 'Không xác định'
  }
  return labels[label] || label
}

function shortDate(date: string) {
  const [, month, day] = date.split('-')
  return `${day}/${month}`
}

const labels = computed(() => report.value?.series.map(item => shortDate(item.date)) || [])

const trafficChart = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'Lượt truy cập',
      data: report.value?.series.map(item => item.pageViews) || [],
      borderColor: chartColors.gold,
      backgroundColor: 'rgba(219, 186, 100, 0.14)',
      fill: true,
      tension: 0.35,
      pointRadius: 2
    },
    {
      label: 'Check SIM',
      data: report.value?.series.map(item => item.simChecks) || [],
      borderColor: chartColors.blue,
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 2
    }
  ]
}))

const revenueChart = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      type: 'bar' as const,
      label: 'Doanh thu',
      data: report.value?.series.map(item => item.revenue) || [],
      backgroundColor: 'rgba(34, 197, 94, 0.55)',
      borderColor: chartColors.green,
      borderWidth: 1,
      yAxisID: 'y'
    },
    {
      type: 'line' as const,
      label: 'Đơn hàng',
      data: report.value?.series.map(item => item.orders) || [],
      borderColor: chartColors.gold,
      backgroundColor: 'rgba(219, 186, 100, 0.18)',
      tension: 0.35,
      yAxisID: 'y1'
    }
  ]
}))

const revenueOptions = computed(() => ({
  ...chartOptions,
  scales: {
    x: chartOptions.scales.x,
    y: {
      beginAtZero: true,
      ticks: {
        color: '#94a3b8',
        callback: (value: string | number) => `${Number(value) / 1000}k`
      },
      grid: { color: 'rgba(148, 163, 184, 0.1)' }
    },
    y1: {
      beginAtZero: true,
      position: 'right' as const,
      ticks: { color: '#94a3b8', precision: 0 },
      grid: { drawOnChartArea: false }
    }
  }
}))

const packageChart = computed(() => ({
  labels: report.value?.breakdowns.packageTypes.map(item => displayLabel(item.label)) || [],
  datasets: [
    {
      label: 'Số đơn',
      data: report.value?.breakdowns.packageTypes.map(item => item.value) || [],
      backgroundColor: [chartColors.gold, chartColors.blue, chartColors.green]
    }
  ]
}))

const orderStatusChart = computed(() => ({
  labels: report.value?.breakdowns.orderStatus.map(item => displayLabel(item.label)) || [],
  datasets: [
    {
      data: report.value?.breakdowns.orderStatus.map(item => item.value) || [],
      backgroundColor: [chartColors.gold, chartColors.green, chartColors.red, chartColors.slate],
      borderColor: '#0f172a',
      borderWidth: 2
    }
  ]
}))

const focusAreaChart = computed(() => ({
  labels: report.value?.breakdowns.focusAreas.map(item => displayLabel(item.label)) || [],
  datasets: [
    {
      label: 'Lượt check',
      data: report.value?.breakdowns.focusAreas.map(item => item.value) || [],
      backgroundColor: 'rgba(167, 139, 250, 0.65)',
      borderColor: chartColors.purple,
      borderWidth: 1
    }
  ]
}))

const emailTotal = computed(() => {
  const summary = report.value?.summary
  return (summary?.emailSuccess || 0) + (summary?.emailFailed || 0)
})

const kpis = computed(() => {
  const summary = report.value?.summary
  return [
    { label: 'Lượt truy cập', value: summary?.pageViews ?? 0, hint: `${summary?.uniqueVisitors ?? 0} khách duy nhất` },
    { label: 'Check SIM', value: summary?.simChecks ?? 0, hint: `${summary?.conversionRate ?? 0}% trên lượt truy cập` },
    { label: 'Doanh thu', value: formatCurrency(summary?.revenue ?? 0), hint: `${summary?.paidOrders ?? 0} đơn đã thanh toán` },
    { label: 'Đơn hàng', value: summary?.orders ?? 0, hint: `${summary?.pendingOrders ?? 0} đơn đang chờ` },
    { label: 'Khách mới', value: summary?.newUsers ?? 0, hint: `Trong ${selectedRange.value} ngày` },
    { label: 'Chat đang xử lý', value: summary?.activeChats ?? 0, hint: 'Phòng đang xử lý' },
    { label: 'Email thành công', value: summary?.emailSuccess ?? 0, hint: `${emailTotal.value} email trong kỳ` },
    { label: 'Email lỗi', value: summary?.emailFailed ?? 0, hint: 'Cần kiểm tra nếu tăng cao' }
  ]
})

onMounted(fetchReport)
</script>

<template>
  <div class="flex-1 overflow-y-auto p-3 sm:p-6">
    <div class="mx-auto max-w-7xl space-y-4 sm:space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg sm:text-2xl font-bold gold-gradient-text">Báo cáo tổng quan</h2>
          <p class="text-xs sm:text-sm text-slate-500 mt-1">Theo dõi truy cập, check SIM, đơn hàng và doanh thu.</p>
        </div>
        <div class="grid grid-cols-3 gap-1 rounded-lg border border-slate-800 bg-slate-900/70 p-1 w-full sm:w-auto">
          <button
            v-for="range in ([7, 30, 90] as RangeOption[])"
            :key="range"
            @click="selectedRange = range; fetchReport()"
            :class="[
              'rounded-md px-3 py-2 text-xs font-semibold transition',
              selectedRange === range ? 'bg-gold-500/20 text-gold-300' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            {{ range }} ngày
          </button>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-16">
        <div class="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>

      <div v-else-if="error" class="rounded-lg border border-red-500/20 bg-red-950/20 px-4 py-3 text-sm text-red-300">
        {{ error }}
      </div>

      <template v-else-if="report">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <GlassCard v-for="item in kpis" :key="item.label" class="p-3 sm:p-4 min-h-[104px]">
            <p class="text-[11px] sm:text-xs uppercase tracking-wide text-slate-500 font-semibold">{{ item.label }}</p>
            <p class="mt-2 text-xl sm:text-2xl font-black text-slate-100 break-words">{{ item.value }}</p>
            <p class="mt-1 text-[11px] sm:text-xs text-slate-500">{{ item.hint }}</p>
          </GlassCard>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <GlassCard class="p-3 sm:p-5">
            <div class="flex items-center justify-between gap-3 mb-4">
              <h3 class="text-sm sm:text-base font-semibold text-slate-200">Truy cập và check SIM</h3>
            </div>
            <div class="h-[280px] sm:h-[340px]">
              <Line :data="trafficChart" :options="chartOptions" />
            </div>
          </GlassCard>

          <GlassCard class="p-3 sm:p-5">
            <div class="flex items-center justify-between gap-3 mb-4">
              <h3 class="text-sm sm:text-base font-semibold text-slate-200">Doanh thu và đơn hàng</h3>
            </div>
            <div class="h-[280px] sm:h-[340px]">
              <Chart type="bar" :data="revenueChart" :options="revenueOptions" />
            </div>
          </GlassCard>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard class="p-3 sm:p-5">
            <h3 class="text-sm sm:text-base font-semibold text-slate-200 mb-4">Trạng thái đơn hàng</h3>
            <div class="h-[260px]">
              <Doughnut :data="orderStatusChart" :options="doughnutOptions" />
            </div>
          </GlassCard>

          <GlassCard class="p-3 sm:p-5">
            <h3 class="text-sm sm:text-base font-semibold text-slate-200 mb-4">Gói dịch vụ</h3>
            <div class="h-[260px]">
              <Bar :data="packageChart" :options="chartOptions" />
            </div>
          </GlassCard>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <GlassCard class="p-3 sm:p-5">
            <h3 class="text-sm sm:text-base font-semibold text-slate-200 mb-4">Nhu cầu cải vận</h3>
            <div class="h-[280px]">
              <Bar :data="focusAreaChart" :options="chartOptions" />
            </div>
          </GlassCard>

          <GlassCard class="p-3 sm:p-5">
            <h3 class="text-sm sm:text-base font-semibold text-slate-200 mb-4">Kênh và email</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
                <p class="text-xs font-semibold uppercase text-slate-500">Nguồn chat</p>
                <div class="mt-3 space-y-2">
                  <div v-for="source in report.breakdowns.chatSources" :key="source.label" class="flex items-center justify-between text-sm">
                    <span class="text-slate-400">{{ displayLabel(source.label) }}</span>
                    <span class="font-semibold text-slate-100">{{ source.value }}</span>
                  </div>
                  <p v-if="report.breakdowns.chatSources.length === 0" class="text-xs text-slate-500">Chưa có phòng chat mới.</p>
                </div>
              </div>
              <div class="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
                <p class="text-xs font-semibold uppercase text-slate-500">Email hằng ngày</p>
                <div class="mt-3 space-y-2">
                  <div v-for="email in report.breakdowns.emailStatus" :key="email.label" class="flex items-center justify-between text-sm">
                    <span class="text-slate-400">{{ displayLabel(email.label) }}</span>
                    <span class="font-semibold text-slate-100">{{ email.value }}</span>
                  </div>
                  <p v-if="report.breakdowns.emailStatus.length === 0" class="text-xs text-slate-500">Chưa có nhật ký email.</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </template>
    </div>
  </div>
</template>

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import type { FengshuiCheckResponse } from '@/types'

export interface CheckFormData {
  name: string
  email: string
  phone: string
  dob: string
  tob: string
  usedLessThan6Months: boolean
  focusArea: string
  referredByCode?: string
}

export const useFengshuiStore = defineStore('fengshui', () => {
  const checkResponse = ref<FengshuiCheckResponse | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function checkSim(formData: CheckFormData) {
    isLoading.value = true
    error.value = null
    try {
      const res = await api.post<{ data: FengshuiCheckResponse }>('/fengshui/check', formData)
      checkResponse.value = res.data.data
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } }
      error.value = e?.response?.data?.error?.message ?? 'Có lỗi xảy ra, vui lòng thử lại.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function clear() {
    checkResponse.value = null
    error.value = null
  }

  return { checkResponse, isLoading, error, checkSim, clear }
})

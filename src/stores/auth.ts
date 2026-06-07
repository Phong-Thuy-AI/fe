import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const isAdmin = ref(localStorage.getItem('isAdmin') === 'true')
  const adminUsername = ref(localStorage.getItem('adminUsername') || '')

  async function login(username: string, password: string) {
    const res = await api.post<{ data: { username: string } }>('/auth/admin/login', { username, password })
    isAdmin.value = true
    adminUsername.value = res.data.data.username
    localStorage.setItem('isAdmin', 'true')
    localStorage.setItem('adminUsername', adminUsername.value)
  }

  async function logout() {
    await api.post('/auth/admin/logout').catch(() => null)
    isAdmin.value = false
    adminUsername.value = ''
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('adminUsername')
  }

  return { isAdmin, adminUsername, login, logout }
})

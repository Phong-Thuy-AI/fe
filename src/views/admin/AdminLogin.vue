<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import GlassCard from '@/components/base/GlassCard.vue'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({ username: '', password: '' })
const error = ref('')
const isLoading = ref(false)

async function login() {
  error.value = ''
  if (!form.username || !form.password) { error.value = 'Vui lòng nhập đầy đủ thông tin.'; return }
  isLoading.value = true
  try {
    await authStore.login(form.username, form.password)
    router.replace('/admin')
  } catch {
    error.value = 'Tài khoản hoặc mật khẩu không đúng.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen celestial-bg flex items-center justify-center px-4">
    <GlassCard class="w-full max-w-sm p-8 space-y-6 animate-gold-glow-pulse border border-gold-500/20 relative">
      <div class="text-center space-y-2">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold-500/10 text-3xl">🔐</div>
        <h1 class="text-xl font-bold gold-gradient-text">Quản Trị Viên</h1>
        <p class="text-slate-500 text-sm">Đăng nhập để quản lý hệ thống</p>
      </div>

      <div class="space-y-4">
        <BaseInput v-model="form.username" label="Tài khoản" placeholder="admin" required @keyup.enter="login" />
        <BaseInput v-model="form.password" label="Mật khẩu" type="password" placeholder="••••••••" required @keyup.enter="login" />
      </div>

      <p v-if="error" class="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 text-center">{{ error }}</p>

      <BaseButton type="submit" full-width size="lg" :loading="isLoading" @click="login">Đăng nhập</BaseButton>

      <div class="text-center pt-2">
        <router-link to="/" class="text-xs text-slate-500 hover:text-gold-400 hover:underline transition-all">
          ← Quay lại trang chủ
        </router-link>
      </div>
    </GlassCard>
  </div>
</template>

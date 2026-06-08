<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  label?: string
  error?: string
  type?: string
  placeholder?: string
  required?: boolean
}
const props = withDefaults(defineProps<Props>(), { type: 'text', required: false })

const model = defineModel<string>()

const isPasswordVisible = ref(false)
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-sm font-medium text-slate-300">
      {{ label }} <span v-if="required" class="text-gold-400">*</span>
    </label>
    <div class="relative w-full">
      <input
        v-model="model"
        :type="type === 'password' ? (isPasswordVisible ? 'text' : 'password') : type"
        :placeholder="placeholder"
        :required="required"
        :class="[
          'w-full bg-slate-900/60 border rounded-lg pl-4 pr-10 py-2.5 text-slate-100 placeholder-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-gold-500/50 transition-all duration-200',
          error ? 'border-red-500/60' : 'border-slate-700/60 hover:border-gold-500/30',
        ]"
      />
      <button
        v-if="type === 'password'"
        type="button"
        @click="isPasswordVisible = !isPasswordVisible"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer p-1 rounded transition"
      >
        <svg v-if="isPasswordVisible" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815-1.15a3 3 0 0 1-4.827 4.828M19 19l-3-3" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </button>
    </div>
    <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
  </div>
</template>

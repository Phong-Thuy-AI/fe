<script setup lang="ts">
interface Props {
  label?: string
  error?: string
  type?: string
  placeholder?: string
  required?: boolean
}
withDefaults(defineProps<Props>(), { type: 'text', required: false })

const model = defineModel<string>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-sm font-medium text-slate-300">
      {{ label }} <span v-if="required" class="text-gold-400">*</span>
    </label>
    <input
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :class="[
        'w-full bg-slate-900/60 border rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500',
        'focus:outline-none focus:ring-2 focus:ring-gold-500/50 transition-all duration-200',
        error ? 'border-red-500/60' : 'border-slate-700/60 hover:border-gold-500/30',
      ]"
    />
    <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
  </div>
</template>

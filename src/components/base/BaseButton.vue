<script setup lang="ts">
interface Props {
  type?: 'button' | 'submit'
  variant?: 'gold' | 'ghost' | 'danger'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
}
const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'gold',
  loading: false,
  disabled: false,
  fullWidth: false,
  size: 'md',
})
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 active:scale-[0.98]',
      props.fullWidth && 'w-full',
      props.size === 'sm' && 'px-4 py-1.5 text-sm',
      props.size === 'md' && 'px-6 py-2.5',
      props.size === 'lg' && 'px-8 py-3.5 text-lg',
      props.variant === 'gold' && 'gold-btn',
      props.variant === 'ghost' && 'border border-gold-500/30 text-gold-300 hover:bg-gold-500/10',
      props.variant === 'danger' && 'bg-red-700 hover:bg-red-600 text-white shadow',
      (props.disabled || props.loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
    ]"
  >
    <span v-if="props.loading" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
    <slot />
  </button>
</template>

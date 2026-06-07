<script setup lang="ts">
defineProps<{ class?: string }>()
</script>

<template>
  <div :class="['glass-card rounded-2xl', $props.class]">
    <slot />
  </div>
</template>

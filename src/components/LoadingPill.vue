<script setup lang="ts">
defineProps<{
  active: boolean
  label: string
}>()
</script>

<template>
  <Transition name="pill">
    <div v-if="active" class="loading-pill" role="status" aria-live="polite">
      <span class="loading-pill__spinner" aria-hidden="true"></span>
      <span>{{ label }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.loading-pill {
  position: absolute;
  top: 22px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  background: rgba(26, 26, 26, 0.88);
  color: #ffffff;
  font-size: var(--font-size-btn);
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
}

.loading-pill__spinner {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  animation: pill-spin 0.8s linear infinite;
}

@keyframes pill-spin {
  to {
    transform: rotate(360deg);
  }
}

.pill-enter-active,
.pill-leave-active {
  transition: opacity 0.18s ease;
}
.pill-enter-from,
.pill-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .loading-pill__spinner {
    animation-duration: 2.4s;
  }
}
</style>

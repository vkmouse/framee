<script setup lang="ts">
import { useCanvasState } from '../composables/useCanvasState'

const state = useCanvasState()
</script>

<template>
  <div class="border-drawer">
    <div class="border-drawer__handle"></div>
    <p class="border-drawer__title">邊框寬度</p>
    <div class="border-drawer__ctrl">
      <input
        class="border-drawer__slider"
        type="range"
        min="0"
        max="80"
        step="1"
        :value="state.borderPx"
        @input="state.borderPx = Number(($event.target as HTMLInputElement).value)"
        aria-label="邊框寬度"
      />
      <span class="border-drawer__val">{{ state.borderPx }} px</span>
    </div>
  </div>
</template>

<style scoped>
.border-drawer {
  padding: 14px var(--spacing-lg) var(--spacing-lg);
}

.border-drawer__handle {
  width: 36px;
  height: 3px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.15);
  margin: 0 auto 14px;
}

.border-drawer__title {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.border-drawer__ctrl {
  display: flex;
  align-items: center;
  gap: 10px;
}

.border-drawer__slider {
  flex: 1;
  accent-color: var(--color-action);
}

.border-drawer__val {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-main);
  min-width: 38px;
  text-align: right;
}
</style>

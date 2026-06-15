<script setup lang="ts">
import { useCanvasState } from '../composables/useCanvasState'
import { iconLayout, iconBorder, iconPalette } from '../utils/icons'

type DrawerType = 'layout' | 'border' | 'color'

const state = useCanvasState()

function toggle(type: DrawerType) {
  state.openDrawer = state.openDrawer === type ? null : type
}

const buttons: { type: DrawerType; icon: string; label: string }[] = [
  { type: 'layout', icon: iconLayout, label: '版型' },
  { type: 'border', icon: iconBorder, label: '邊框' },
  { type: 'color', icon: iconPalette, label: '顏色' },
]
</script>

<template>
  <nav class="bottom-bar">
    <button
      v-for="btn in buttons"
      :key="btn.type"
      class="bottom-bar__btn"
      :class="{ 'is-open': state.openDrawer === btn.type }"
      @click="toggle(btn.type)"
      :aria-label="btn.label"
      :aria-pressed="state.openDrawer === btn.type"
    >
      <span class="bottom-bar__icon" v-html="btn.icon" />
      <span class="bottom-bar__label">{{ btn.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-bar {
  display: flex;
  gap: var(--spacing-sm);
  padding: 0 var(--spacing-md);
  flex-shrink: 0;
}

.bottom-bar__btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: var(--spacing-sm) 6px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 0.5px solid var(--color-border);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.15s;
  color: var(--color-text-muted);
}

.bottom-bar__btn:active {
  transform: scale(0.95);
}

.bottom-bar__btn.is-open {
  background: var(--color-action);
  border-color: var(--color-action);
  color: rgba(255, 255, 255, 0.8);
}

.bottom-bar__icon {
  display: flex;
  align-items: center;
  width: 18px;
  height: 18px;
}

.bottom-bar__icon :deep(svg) {
  width: 18px;
  height: 18px;
  stroke: currentColor;
}

.bottom-bar__label {
  font-size: var(--font-size-label);
  font-weight: 500;
  letter-spacing: 0.03em;
}
</style>

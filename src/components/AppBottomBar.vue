<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasState } from '../composables/useCanvasState'
import { iconLayout, iconBorder } from '../utils/icons'
import { layoutName } from '../utils/layout'

type DrawerType = 'layout' | 'border'

const state = useCanvasState()

function toggle(type: DrawerType) {
  state.openDrawer = state.openDrawer === type ? null : type
}

// Each tab reports the current setting, so it reads without opening the panel.
const tabs = computed(() => [
  {
    type: 'layout' as DrawerType,
    icon: iconLayout,
    label: '版型',
    value: layoutName(state.activeLayout),
    swatch: null as string | null,
  },
  {
    type: 'border' as DrawerType,
    icon: iconBorder,
    label: '邊框樣式',
    value: state.borderPx === 0 ? '無邊框' : `${state.borderPx} px`,
    swatch: state.borderColor as string | null,
  },
])
</script>

<template>
  <nav class="dock" :class="{ 'is-open': state.openDrawer }" aria-label="編輯工具">
    <button
      v-for="tab in tabs"
      :key="tab.type"
      class="dock__tab"
      :class="{ 'is-current': state.openDrawer === tab.type }"
      type="button"
      aria-controls="framee-panel"
      :aria-expanded="state.openDrawer === tab.type"
      @click="toggle(tab.type)"
    >
      <span class="dock__icon" aria-hidden="true" v-html="tab.icon" />
      <span class="dock__text">
        <span class="dock__label">{{ tab.label }}</span>
        <span class="dock__value">
          <i v-if="tab.swatch" class="dock__dot" :style="{ background: tab.swatch }" />
          {{ tab.value }}
        </span>
      </span>
    </button>
  </nav>
</template>

<style scoped>
.dock {
  display: flex;
  flex-shrink: 0;
  min-height: var(--dock-height);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: var(--color-surface);
  border-top: 0.5px solid var(--color-border);
}

.dock__tab {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 var(--spacing-md);
  background: transparent;
  border: none;
  color: var(--color-text-main);
  cursor: pointer;
  transition: color 0.2s, background 0.15s;
}

.dock__tab + .dock__tab {
  border-left: 0.5px solid var(--color-border);
}

/* Line on the top edge: ties the tab to the panel that opens right above it. */
.dock__tab::before {
  content: '';
  position: absolute;
  top: -0.5px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-action);
  transform: scaleX(0);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.dock__tab.is-current::before {
  transform: scaleX(1);
}

/* While one panel is open, the other tab steps back. */
.dock.is-open .dock__tab:not(.is-current) {
  color: var(--color-text-muted);
}

.dock__tab:active {
  background: rgba(0, 0, 0, 0.04);
}

.dock__tab:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -4px;
}

.dock__icon {
  display: flex;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

.dock__icon :deep(svg) {
  width: 22px;
  height: 22px;
  stroke: currentColor;
}

.dock__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  min-width: 0;
  text-align: left;
}

.dock__label {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.25;
}

.dock__value {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-size-sm);
  line-height: 1.25;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.dock__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

@media (prefers-reduced-motion: reduce) {
  .dock__tab,
  .dock__tab::before {
    transition: none;
  }
}
</style>

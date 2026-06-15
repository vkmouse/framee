<script setup lang="ts">
import { ref } from 'vue'
import { useCanvasState } from '../composables/useCanvasState'

const state = useCanvasState()

interface Swatch {
  hex: string
  label: string
}

const swatches: Swatch[] = [
  { hex: '#ffffff', label: '白' },
  { hex: '#000000', label: '黑' },
  { hex: '#f5f0e8', label: '米白' },
  { hex: '#e0dcd4', label: '淺灰' },
  { hex: '#d4b896', label: '淺棕' },
  { hex: '#b8cce4', label: '淺藍' },
]

const customColor = ref(state.borderColor)
const activePreset = ref(
  swatches.some((s) => s.hex === state.borderColor) ? state.borderColor : null,
)

function selectSwatch(hex: string) {
  state.borderColor = hex
  activePreset.value = hex
  customColor.value = hex
}

function onCustomInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  state.borderColor = val
  customColor.value = val
  activePreset.value = null
}
</script>

<template>
  <div class="border-drawer">
    <div class="border-drawer__handle"></div>

    <div class="border-drawer__section">
      <p class="border-drawer__title">邊框寬度</p>
      <div class="border-drawer__slider-row">
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

    <div class="border-drawer__divider"></div>

    <div class="border-drawer__section">
      <p class="border-drawer__title">邊框顏色</p>
      <div class="border-drawer__color-row">
        <button
          v-for="swatch in swatches"
          :key="swatch.hex"
          class="border-drawer__swatch"
          :class="{
            'is-active': activePreset === swatch.hex,
            'is-white': swatch.hex === '#ffffff',
          }"
          :style="{ background: swatch.hex }"
          @click="selectSwatch(swatch.hex)"
          :aria-label="swatch.label"
          :aria-pressed="activePreset === swatch.hex"
        ></button>

        <div class="border-drawer__custom">
          <span class="border-drawer__custom-label">自訂</span>
          <input
            type="color"
            class="border-drawer__custom-input"
            :value="customColor"
            @input="onCustomInput"
            aria-label="自訂顏色"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.border-drawer {
  padding: 14px var(--spacing-lg) var(--spacing-lg);
  height: var(--drawer-height);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.border-drawer__handle {
  width: 36px;
  height: 3px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.15);
  margin: 0 auto 12px;
  flex-shrink: 0;
}

.border-drawer__section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.border-drawer__divider {
  height: 0.5px;
  background: var(--color-border);
  margin: 8px 0;
  flex-shrink: 0;
}

.border-drawer__title {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  text-transform: uppercase;
}

/* Slider row */
.border-drawer__slider-row {
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

/* Color row */
.border-drawer__color-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.border-drawer__swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: border-color 0.15s;
  padding: 0;
}

.border-drawer__swatch.is-white {
  border-color: rgba(0, 0, 0, 0.18);
}

.border-drawer__swatch.is-active {
  border-color: var(--color-action);
  outline: 2px solid #fff;
  outline-offset: -4px;
}

.border-drawer__custom {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
}

.border-drawer__custom-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.border-drawer__custom-input {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid var(--color-border);
  padding: 0;
  cursor: pointer;
}
</style>

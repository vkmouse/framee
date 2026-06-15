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
  <div class="color-drawer">
    <div class="color-drawer__handle"></div>
    <p class="color-drawer__title">邊框顏色</p>
    <div class="color-drawer__row">
      <button
        v-for="swatch in swatches"
        :key="swatch.hex"
        class="color-drawer__swatch"
        :class="{
          'is-active': activePreset === swatch.hex,
          'is-white': swatch.hex === '#ffffff',
        }"
        :style="{ background: swatch.hex }"
        @click="selectSwatch(swatch.hex)"
        :aria-label="swatch.label"
        :aria-pressed="activePreset === swatch.hex"
      ></button>

      <div class="color-drawer__custom">
        <span class="color-drawer__custom-label">自訂</span>
        <input
          type="color"
          class="color-drawer__custom-input"
          :value="customColor"
          @input="onCustomInput"
          aria-label="自訂顏色"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.color-drawer {
  padding: 14px var(--spacing-lg) var(--spacing-lg);
}

.color-drawer__handle {
  width: 36px;
  height: 3px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.15);
  margin: 0 auto 14px;
}

.color-drawer__title {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.color-drawer__row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.color-drawer__swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: border-color 0.15s;
  padding: 0;
}

.color-drawer__swatch.is-white {
  border-color: rgba(0, 0, 0, 0.18);
}

.color-drawer__swatch.is-active {
  border-color: var(--color-action);
  outline: 2px solid #fff;
  outline-offset: -4px;
}

.color-drawer__custom {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
}

.color-drawer__custom-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.color-drawer__custom-input {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid var(--color-border);
  padding: 0;
  cursor: pointer;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasState } from '../composables/useCanvasState'
import { iconPalette } from '../utils/icons'

const state = useCanvasState()

const MAX_BORDER = 80

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

// Derived from the shared state, so the highlight can never drift from the canvas.
const activePreset = computed(
  () => swatches.find((s) => s.hex === state.borderColor.toLowerCase())?.hex ?? null,
)
const isCustom = computed(() => activePreset.value === null)

const fill = computed(() => `${(state.borderPx / MAX_BORDER) * 100}%`)

function onCustomInput(e: Event) {
  state.borderColor = (e.target as HTMLInputElement).value
}
</script>

<template>
  <div class="border-drawer">
    <div class="border-drawer__row">
      <span id="border-width-label" class="border-drawer__label">寬度</span>
      <input
        class="border-drawer__slider"
        type="range"
        min="0"
        :max="MAX_BORDER"
        step="1"
        :value="state.borderPx"
        :style="{ '--fill': fill }"
        aria-labelledby="border-width-label"
        @input="state.borderPx = Number(($event.target as HTMLInputElement).value)"
      />
      <output class="border-drawer__val" for="border-width-label">{{ state.borderPx }} px</output>
    </div>

    <div class="border-drawer__row">
      <span id="border-color-label" class="border-drawer__label">顏色</span>
      <div class="border-drawer__swatches" role="group" aria-labelledby="border-color-label">
        <button
          v-for="swatch in swatches"
          :key="swatch.hex"
          class="border-drawer__swatch"
          :class="{ 'is-active': activePreset === swatch.hex }"
          :style="{ background: swatch.hex }"
          type="button"
          :aria-label="swatch.label"
          :aria-pressed="activePreset === swatch.hex"
          @click="state.borderColor = swatch.hex"
        ></button>

        <!-- Any colour: the native picker sits invisibly on top of the swatch face. -->
        <label class="border-drawer__custom" :class="{ 'is-active': isCustom }">
          <span class="border-drawer__ring">
            <span
              class="border-drawer__core"
              :style="isCustom ? { background: state.borderColor } : undefined"
            >
              <span v-if="!isCustom" class="border-drawer__pick" aria-hidden="true" v-html="iconPalette" />
            </span>
          </span>
          <input
            class="border-drawer__picker"
            type="color"
            :value="state.borderColor"
            aria-label="自訂顏色"
            @input="onCustomInput"
          />
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.border-drawer {
  height: var(--drawer-height);
  padding: 0 var(--spacing-lg);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.border-drawer__row {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 44px;
}

.border-drawer__label {
  width: 28px;
  flex-shrink: 0;
  font-size: var(--font-size-btn);
  color: var(--color-text-muted);
}

/* Width slider */
.border-drawer__slider {
  flex: 1;
  min-width: 0;
  height: 32px;
  margin: 0;
  background: transparent;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  touch-action: pan-y;
}

.border-drawer__slider::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--color-action) var(--fill),
    var(--color-border-em) var(--fill)
  );
}

.border-drawer__slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 26px;
  height: 26px;
  margin-top: -11px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 2px solid var(--color-action);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
}

.border-drawer__slider::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--color-action) var(--fill),
    var(--color-border-em) var(--fill)
  );
}

.border-drawer__slider::-moz-range-thumb {
  box-sizing: border-box;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 2px solid var(--color-action);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
}

.border-drawer__slider:focus-visible {
  outline: none;
}

.border-drawer__slider:focus-visible::-webkit-slider-thumb {
  outline: 2px dashed var(--color-action);
  outline-offset: 3px;
}

.border-drawer__slider:focus-visible::-moz-range-thumb {
  outline: 2px dashed var(--color-action);
  outline-offset: 3px;
}

.border-drawer__val {
  width: 48px;
  flex-shrink: 0;
  text-align: right;
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-main);
}

/* Colour swatches */
.border-drawer__swatches {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.border-drawer__swatch,
.border-drawer__custom {
  flex: 1 1 0;
  max-width: 36px;
  aspect-ratio: 1;
  border-radius: 50%;
}

.border-drawer__swatch {
  padding: 0;
  border: none;
  cursor: pointer;
  /* The hairline keeps white and cream visible against the white panel. */
  box-shadow: inset 0 0 0 0.5px var(--color-border-em);
  transition: box-shadow 0.15s, transform 0.15s;
}

.border-drawer__swatch:active {
  transform: scale(0.92);
}

.border-drawer__swatch.is-active {
  box-shadow:
    inset 0 0 0 0.5px var(--color-border-em),
    0 0 0 2px var(--color-surface),
    0 0 0 3.5px var(--color-action);
}

.border-drawer__swatch:focus-visible {
  outline: 2px dashed var(--color-action);
  outline-offset: 3px;
}

/* Custom colour: a spectrum ring around a plain core (or the chosen colour). */
.border-drawer__custom {
  position: relative;
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s;
}

.border-drawer__custom:active {
  transform: scale(0.92);
}

.border-drawer__custom.is-active {
  box-shadow:
    0 0 0 2px var(--color-surface),
    0 0 0 3.5px var(--color-action);
}

.border-drawer__ring {
  display: block;
  width: 100%;
  height: 100%;
  padding: 3px;
  border-radius: 50%;
  background: conic-gradient(#f26d6d, #f2c76d, #8fd97a, #6dc9f2, #8a7cf2, #e97cc4, #f26d6d);
}

.border-drawer__core {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--color-surface);
  box-shadow: inset 0 0 0 0.5px var(--color-border-em);
}

.border-drawer__pick {
  display: flex;
  width: 14px;
  height: 14px;
  color: var(--color-text-main);
}

.border-drawer__pick :deep(svg) {
  width: 14px;
  height: 14px;
  stroke: currentColor;
}

.border-drawer__picker {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.border-drawer__custom:has(.border-drawer__picker:focus-visible) {
  outline: 2px dashed var(--color-action);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .border-drawer__swatch,
  .border-drawer__custom {
    transition: none;
  }
}
</style>

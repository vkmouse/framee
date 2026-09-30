<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCanvasState } from '../composables/useCanvasState'
import { useImageStore } from '../composables/useImageStore'
import { CANVAS_H, CANVAS_W, getSlots, layoutOptions } from '../utils/layout'

const state = useCanvasState()
const { switchLayout } = useImageStore()

const scroller = ref<HTMLElement | null>(null)
const items = ref<HTMLElement[]>([])

function select(id: number) {
  if (state.activeLayout !== id) {
    switchLayout(id)
  }
}

// Thumbnails are drawn from the real slot geometry, using the frame the person
// has chosen. The width is clamped so a 0 px border still reads as separate photos.
const mat = computed(() => Math.min(Math.max(state.borderPx, 30), 70))

function cells(id: number) {
  return getSlots(id, mat.value).map((s) => ({
    left: `${(s.x / CANVAS_W) * 100}%`,
    top: `${(s.y / CANVAS_H) * 100}%`,
    width: `${(s.w / CANVAS_W) * 100}%`,
    height: `${(s.h / CANVAS_H) * 100}%`,
  }))
}

// The panel opens with the current layout already centred in view.
onMounted(() => {
  const el = scroller.value
  const active = items.value[layoutOptions.findIndex((l) => l.id === state.activeLayout)]
  if (!el || !active) return
  el.scrollLeft = active.offsetLeft - (el.clientWidth - active.clientWidth) / 2
})
</script>

<template>
  <div class="layout-drawer">
    <div ref="scroller" class="layout-drawer__scroll" role="group" aria-label="版型">
      <button
        v-for="layout in layoutOptions"
        :key="layout.id"
        :ref="(el) => { if (el) items[layout.id - 1] = el as HTMLElement }"
        class="layout-drawer__card"
        :class="{ 'is-active': state.activeLayout === layout.id }"
        type="button"
        :aria-pressed="state.activeLayout === layout.id"
        @click="select(layout.id)"
      >
        <span class="layout-drawer__thumb" :style="{ background: state.borderColor }">
          <span
            v-for="(cell, i) in cells(layout.id)"
            :key="i"
            class="layout-drawer__cell"
            :style="cell"
          />
        </span>
        <span class="layout-drawer__name">{{ layout.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.layout-drawer {
  height: var(--drawer-height);
  display: flex;
  align-items: center;
}

.layout-drawer__scroll {
  flex: 1;
  display: flex;
  gap: 14px;
  padding: 6px var(--spacing-lg);
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scroll-padding: 0 var(--spacing-lg);
  scrollbar-width: none;
}

.layout-drawer__scroll::-webkit-scrollbar {
  display: none;
}

.layout-drawer__card {
  flex-shrink: 0;
  width: 68px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  scroll-snap-align: start;
  transition: transform 0.15s;
}

.layout-drawer__card:active {
  transform: scale(0.96);
}

.layout-drawer__thumb {
  position: relative;
  width: 68px;
  aspect-ratio: 4 / 5;
  border-radius: 3px;
  /* Draws the edge on top of the mat, so a white frame stays visible on white. */
  box-shadow: inset 0 0 0 0.5px var(--color-border-em);
  transition: outline-color 0.15s;
  outline: 2px solid transparent;
  outline-offset: 3px;
}

.layout-drawer__cell {
  position: absolute;
  background: #bdbdba;
}

.layout-drawer__card.is-active .layout-drawer__thumb {
  outline-color: var(--color-action);
}

.layout-drawer__card:focus-visible {
  outline: none;
}

.layout-drawer__card:focus-visible .layout-drawer__thumb {
  outline-color: var(--color-action);
  outline-style: dashed;
}

.layout-drawer__name {
  font-size: var(--font-size-btn);
  line-height: 1.2;
  color: var(--color-text-muted);
  white-space: nowrap;
  transition: color 0.15s;
}

.layout-drawer__card.is-active .layout-drawer__name {
  color: var(--color-text-main);
  font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  .layout-drawer__card,
  .layout-drawer__thumb,
  .layout-drawer__name {
    transition: none;
  }
}
</style>

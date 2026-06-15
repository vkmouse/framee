<script setup lang="ts">
import { useCanvasState } from '../composables/useCanvasState'
import { useImageStore } from '../composables/useImageStore'

const state = useCanvasState()
const { switchLayout } = useImageStore()

interface Layout {
  id: number
  name: string
}

const layouts: Layout[] = [
  { id: 1, name: '版型 1' },
  { id: 2, name: '版型 2' },
  { id: 3, name: '版型 3' },
  { id: 4, name: '版型 4' },
  { id: 5, name: '版型 5' },
]

function select(id: number) {
  if (state.activeLayout !== id) {
    switchLayout(id)
  }
}
</script>

<template>
  <div class="layout-drawer">
    <div class="layout-drawer__handle"></div>
    <p class="layout-drawer__title">版型選擇</p>
    <div class="layout-drawer__scroll">
      <button
        v-for="layout in layouts"
        :key="layout.id"
        class="layout-drawer__card"
        :class="{ 'is-active': state.activeLayout === layout.id }"
        @click="select(layout.id)"
        :aria-label="layout.name"
        :aria-pressed="state.activeLayout === layout.id"
      >
        <div class="layout-drawer__thumb">
          <!-- Layout 1: single -->
          <div v-if="layout.id === 1" class="lt lt--1">
            <div class="lt__cell"></div>
          </div>
          <!-- Layout 2: top/bottom -->
          <div v-else-if="layout.id === 2" class="lt lt--2">
            <div class="lt__cell"></div>
            <div class="lt__cell"></div>
          </div>
          <!-- Layout 3: left-2 right-1 -->
          <div v-else-if="layout.id === 3" class="lt lt--3">
            <div class="lt__col">
              <div class="lt__cell"></div>
              <div class="lt__cell"></div>
            </div>
            <div class="lt__cell"></div>
          </div>
          <!-- Layout 4: 2x2 -->
          <div v-else-if="layout.id === 4" class="lt lt--4">
            <div class="lt__row">
              <div class="lt__cell"></div>
              <div class="lt__cell"></div>
            </div>
            <div class="lt__row">
              <div class="lt__cell"></div>
              <div class="lt__cell"></div>
            </div>
          </div>
          <!-- Layout 5: three rows -->
          <div v-else-if="layout.id === 5" class="lt lt--5">
            <div class="lt__cell"></div>
            <div class="lt__cell"></div>
            <div class="lt__cell"></div>
          </div>
        </div>
        <span class="layout-drawer__name">{{ layout.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.layout-drawer {
  padding: 14px var(--spacing-lg) var(--spacing-lg);
}

.layout-drawer__handle {
  width: 36px;
  height: 3px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.15);
  margin: 0 auto 14px;
}

.layout-drawer__title {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.layout-drawer__scroll {
  display: flex;
  gap: var(--spacing-sm);
  overflow-x: auto;
  padding-bottom: 2px;
}

.layout-drawer__scroll::-webkit-scrollbar {
  display: none;
}

.layout-drawer__card {
  flex-shrink: 0;
  width: 60px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.layout-drawer__thumb {
  width: 60px;
  height: 75px;
  border-radius: var(--radius-sm);
  background: #f0f0ee;
  border: 1.5px solid transparent;
  overflow: hidden;
  display: flex;
  transition: border-color 0.15s;
}

.layout-drawer__card.is-active .layout-drawer__thumb {
  border-color: var(--color-action);
}

.layout-drawer__name {
  font-size: 9px;
  color: var(--color-text-muted);
  font-weight: 400;
}

.layout-drawer__card.is-active .layout-drawer__name {
  color: var(--color-text-main);
  font-weight: 500;
}

/* Layout thumbnail structures */
.lt {
  width: 100%;
  height: 100%;
  padding: 3px;
  gap: 2px;
  display: flex;
}

.lt__cell {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 2px;
  flex: 1;
}

.lt--1,
.lt--2,
.lt--5 {
  flex-direction: column;
}

.lt--3 {
  flex-direction: row;
}

.lt__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lt--4 {
  flex-direction: column;
}

.lt__row {
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 2px;
}
</style>

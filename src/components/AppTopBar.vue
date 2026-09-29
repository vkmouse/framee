<script setup lang="ts">
import { ref } from 'vue'
import { iconDownload } from '../utils/icons'

const props = defineProps<{
  onDownload: () => void
  isBusy?: boolean
}>()

const isFlashing = ref(false)

function handleDownload() {
  if (props.isBusy) return
  isFlashing.value = true
  setTimeout(() => { isFlashing.value = false }, 300)
  props.onDownload()
}
</script>

<template>
  <header class="top-bar">
    <span class="top-bar__name">Framee</span>
    <button
      class="top-bar__dl-btn"
      :class="{ 'is-flashing': isFlashing, 'is-busy': isBusy }"
      :disabled="isBusy"
      @click="handleDownload"
      aria-label="下載排版圖"
    >
      <span class="top-bar__dl-icon" v-html="iconDownload" />
      <span>{{ isBusy ? '匯出中…' : '下載' }}</span>
    </button>
  </header>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  height: var(--header-height);
  background: var(--color-surface);
  flex-shrink: 0;
}

.top-bar__name {
  font-size: var(--font-size-app);
  font-weight: 600;
  letter-spacing: -0.5px;
  color: var(--color-text-main);
}

.top-bar__dl-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 7px 14px;
  border-radius: var(--radius-pill);
  background: var(--color-action);
  color: var(--color-action-text);
  font-size: var(--font-size-btn);
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.top-bar__dl-btn.is-flashing {
  background: #444444;
}

.top-bar__dl-btn.is-busy {
  opacity: 0.6;
  cursor: default;
}

.top-bar__dl-icon {
  display: flex;
  align-items: center;
  width: 13px;
  height: 13px;
}

.top-bar__dl-icon :deep(svg) {
  width: 13px;
  height: 13px;
}
</style>

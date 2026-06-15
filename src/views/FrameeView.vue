<script setup lang="ts">
import { ref } from 'vue'
import AppTopBar from '../components/AppTopBar.vue'
import FrameeCanvas from '../components/FrameeCanvas.vue'
import AppBottomBar from '../components/AppBottomBar.vue'
import LayoutDrawer from '../components/LayoutDrawer.vue'
import BorderDrawer from '../components/BorderDrawer.vue'
import ColorDrawer from '../components/ColorDrawer.vue'
import { useCanvasState } from '../composables/useCanvasState'
import { useImageStore } from '../composables/useImageStore'
import { render } from '../composables/useCanvasRenderer'

const state = useCanvasState()
const { imageData } = useImageStore()
const canvasRef = ref<InstanceType<typeof FrameeCanvas> | null>(null)

function dataURLToBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(',')
  const mime = header?.match(/:(.*?);/)?.[1] ?? 'image/png'
  const binary = atob(data ?? '')
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

async function download() {
  const canvas = canvasRef.value?.canvasEl
  if (!canvas) return
  state.activeSlot = null
  render(canvas, state, imageData, true)

  const fileName = 'framee_layout.png'
  const dataURL = canvas.toDataURL('image/png')

  // Try Web Share API — on iOS this allows saving to Photos or sharing
  if (navigator.share) {
    const blob = dataURLToBlob(dataURL)
    const file = new File([blob], fileName, { type: 'image/png' })

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Framee 排版圖' })
        return
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        // Non-abort error: fall through to anchor download
      }
    } else {
      // File sharing not supported — try sharing URL if available, else fall through
      try {
        await navigator.share({ title: 'Framee 排版圖', url: window.location.href })
        return
      } catch {
        // Fall through to anchor download
      }
    }
  }

  // Fallback: anchor download
  const link = document.createElement('a')
  link.download = fileName
  link.href = dataURL
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

</script>

<template>
  <div class="framee-view">
    <AppTopBar :on-download="download" />

    <div class="framee-view__canvas-wrap">
      <FrameeCanvas ref="canvasRef" />
    </div>

    <AppBottomBar />

    <div v-if="state.openDrawer" class="framee-view__drawer">
      <LayoutDrawer v-if="state.openDrawer === 'layout'" />
      <BorderDrawer v-else-if="state.openDrawer === 'border'" />
      <ColorDrawer v-else-if="state.openDrawer === 'color'" />
    </div>

    <div class="framee-view__home-ind"></div>
  </div>
</template>

<style scoped>
.framee-view {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  overflow: hidden;
}

.framee-view__canvas-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: #E2E2E2;
}

.framee-view__drawer {
  height: var(--drawer-height);
  overflow: hidden;
  background: var(--color-surface);
  border-top: 0.5px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.framee-view__home-ind {
  height: 30px;
  flex-shrink: 0;
}
</style>

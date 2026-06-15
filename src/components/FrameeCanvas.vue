<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useCanvasState } from '../composables/useCanvasState'
import { useImageStore } from '../composables/useImageStore'
import { useCanvasRenderer } from '../composables/useCanvasRenderer'
import { bindGestures } from '../composables/useGestures'

const state = useCanvasState()
const { imageData, loadImage } = useImageStore()
const { render } = useCanvasRenderer()

const canvasEl = ref<HTMLCanvasElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
let pendingSlot = -1
let unbindGestures: (() => void) | null = null

function doRender() {
  if (canvasEl.value) {
    render(canvasEl.value, state, imageData)
  }
}

function requestFile(slot: number) {
  pendingSlot = slot
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || pendingSlot < 0) return

  await loadImage(pendingSlot, file)
  pendingSlot = -1
  ;(e.target as HTMLInputElement).value = ''
  doRender()
}

// Watch all reactive state to trigger re-render
watch(
  () => [state.borderPx, state.borderColor, state.activeLayout, state.activeSlot],
  doRender,
)

// Also watch imageData deeply for changes from gesture panning/zooming
watch(imageData, doRender, { deep: true })

onMounted(() => {
  if (canvasEl.value) {
    doRender()
    unbindGestures = bindGestures(
      canvasEl.value,
      state,
      imageData,
      requestFile,
      doRender,
    )
  }
})

onUnmounted(() => {
  unbindGestures?.()
})

// Expose canvas element and render for parent (download)
defineExpose({ canvasEl, doRender })
</script>

<template>
  <div class="framee-canvas">
    <canvas
      ref="canvasEl"
      class="framee-canvas__el"
      width="1080"
      height="1350"
      aria-label="圖片排版預覽畫布"
    ></canvas>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="framee-canvas__file-input"
      @change="onFileChange"
    />
  </div>
</template>

<style scoped>
.framee-canvas {
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 12px;
  overflow: hidden;
  background: #e2e2e2;
  position: relative;
}

.framee-canvas__el {
  width: 100%;
  height: 100%;
  display: block;
}

.framee-canvas__file-input {
  display: none;
}
</style>

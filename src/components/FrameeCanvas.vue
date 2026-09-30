<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useCanvasState } from '../composables/useCanvasState'
import { useImageStore, describeFile, MediaLoadError } from '../composables/useImageStore'
import { useCanvasRenderer } from '../composables/useCanvasRenderer'
import { bindGestures } from '../composables/useGestures'
import { showNotice } from '../composables/useNotice'

const state = useCanvasState()
const { imageData, loadImage, loading } = useImageStore()
const { render } = useCanvasRenderer()

const canvasEl = ref<HTMLCanvasElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
let pendingSlot = -1
let unbindGestures: (() => void) | null = null
let rafId = 0

// Repaint is driven by one rAF loop instead of painting on every state change:
// - state changes and gestures only raise `needsRender`, so several changes in one
//   frame cost a single paint (touchmove used to paint twice per event);
// - while a video plays, paint only when the browser presents a new video frame
//   (requestVideoFrameCallback), not blindly at 60 Hz. A 30 fps clip repainted at
//   60 Hz shows every frame twice and looks like it is stepping.
let needsRender = true
let videoFrameReady = false
let hadPlayingVideo = false
const armedVideos = new WeakSet<HTMLVideoElement>()
const hasFrameCallback =
  typeof HTMLVideoElement !== 'undefined' && 'requestVideoFrameCallback' in HTMLVideoElement.prototype

function requestRender() {
  needsRender = true
}

function paint() {
  if (canvasEl.value) {
    render(canvasEl.value, state, imageData)
  }
}

function playingVideos(): HTMLVideoElement[] {
  const layoutData = imageData[state.activeLayout]
  if (!layoutData) return []
  return Object.values(layoutData)
    .filter((d) => d.mediaType === 'video')
    .map((d) => d.media as HTMLVideoElement)
    .filter((v) => !v.paused)
}

function armFrameCallback(video: HTMLVideoElement) {
  if (armedVideos.has(video)) return
  armedVideos.add(video)
  const onFrame = () => {
    videoFrameReady = true
    video.requestVideoFrameCallback(onFrame)
  }
  video.requestVideoFrameCallback(onFrame)
}

function tick() {
  // While a video export is recording, FrameeView paints the canvas itself.
  // Repainting here would mix preview overlays into the recording.
  if (!state.isExporting) {
    const playing = playingVideos()
    if (hasFrameCallback) playing.forEach(armFrameCallback)

    // Playback just stopped (ended): repaint once so the play hint comes back.
    const justStopped = hadPlayingVideo && playing.length === 0
    hadPlayingVideo = playing.length > 0

    const videoNeedsPaint = playing.length > 0 && (!hasFrameCallback || videoFrameReady)
    if (needsRender || justStopped || videoNeedsPaint) {
      needsRender = false
      videoFrameReady = false
      paint()
    }
  }
  rafId = requestAnimationFrame(tick)
}

function requestFile(slot: number) {
  if (loading.active) return
  pendingSlot = slot
  fileInput.value?.click()
}

function reportLoadError(err: unknown, file: File, slot: number) {
  const known = err instanceof MediaLoadError
  const technical = known ? err.debug : err instanceof Error ? err.message : undefined
  showNotice({
    title: known ? err.title : '這個檔案沒有加入',
    message: known ? err.message : '讀取時發生未預期的錯誤。請換一個檔案再試一次。',
    detail: [describeFile(file), technical].filter(Boolean).join(' · '),
    action: { label: '重新選擇檔案', run: () => requestFile(slot) },
  })
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  const slot = pendingSlot
  if (!file || slot < 0) return

  try {
    await loadImage(slot, file)
  } catch (err) {
    reportLoadError(err, file, slot)
  } finally {
    pendingSlot = -1
    input.value = ''
    requestRender()
  }
}

watch(
  () => [state.borderPx, state.borderColor, state.activeLayout, state.activeSlot, state.isExporting],
  requestRender,
)

// Also watch imageData deeply for changes from gesture panning/zooming
watch(imageData, requestRender, { deep: true })

onMounted(() => {
  if (canvasEl.value) {
    paint()
    unbindGestures = bindGestures(
      canvasEl.value,
      state,
      imageData,
      requestFile,
      requestRender,
    )
    rafId = requestAnimationFrame(tick)
  }
})

onUnmounted(() => {
  unbindGestures?.()
  cancelAnimationFrame(rafId)
})

// Expose canvas element and render for parent (download)
defineExpose({ canvasEl, doRender: paint })
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
      accept="image/*,video/*"
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

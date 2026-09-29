<script setup lang="ts">
import { ref } from 'vue'
import AppTopBar from '../components/AppTopBar.vue'
import FrameeCanvas from '../components/FrameeCanvas.vue'
import AppBottomBar from '../components/AppBottomBar.vue'
import LayoutDrawer from '../components/LayoutDrawer.vue'
import BorderDrawer from '../components/BorderDrawer.vue'
import { useCanvasState } from '../composables/useCanvasState'
import { useImageStore } from '../composables/useImageStore'
import { render } from '../composables/useCanvasRenderer'

const state = useCanvasState()
const { imageData } = useImageStore()
const canvasRef = ref<InstanceType<typeof FrameeCanvas> | null>(null)
const isExporting = ref(false)

function dataURLToBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(',')
  const mime = header?.match(/:(.*?);/)?.[1] ?? 'image/png'
  const binary = atob(data ?? '')
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

async function shareOrDownload(blob: Blob, fileName: string, mime: string, shareTitle: string) {
  if (navigator.share) {
    const file = new File([blob], fileName, { type: mime })

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: shareTitle })
        return
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        // Non-abort error: fall through to anchor download
      }
    }
  }

  // Fallback: anchor download
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = fileName
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function getVideoSlots(): HTMLVideoElement[] {
  const layoutData = imageData[state.activeLayout]
  if (!layoutData) return []
  return Object.values(layoutData)
    .filter((d) => d.mediaType === 'video')
    .map((d) => d.media as HTMLVideoElement)
} 

/** Export is mp4 only (webm can't be played on phones / saved to the iOS photo library). */
function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates = [
    'video/mp4;codecs=avc1.640028', // H.264 High
    'video/mp4;codecs=avc1.42E01E', // H.264 Baseline
    'video/mp4;codecs=avc1',
    'video/mp4',
  ]
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

async function downloadImage() {
  const canvas = canvasRef.value?.canvasEl
  if (!canvas) return
  render(canvas, state, imageData, true)

  const fileName = 'framee_layout.png'
  const dataURL = canvas.toDataURL('image/png')
  await shareOrDownload(dataURLToBlob(dataURL), fileName, 'image/png', 'Framee 排版圖')
}

async function downloadVideo(videos: HTMLVideoElement[]) {
  const canvas = canvasRef.value?.canvasEl
  if (!canvas) return

  const mimeType = pickRecorderMimeType()
  if (!mimeType) {
    alert('這個瀏覽器不支援匯出 MP4 影片，請更新 iOS / Safari 或改用最新版 Chrome（126 以上）')
    return
  }

  // Duration of the exported clip = the longest source video.
  const durations = videos.map((v) => v.duration).filter((d) => Number.isFinite(d))
  const maxDuration = durations.length ? Math.max(...durations) : 0
  if (maxDuration <= 0) return

  isExporting.value = true

  try {
    await Promise.all(
      videos.map((v) => {
        v.currentTime = 0
        return v.play()
      }),
    )

    const stream = canvas.captureStream(30)
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8_000_000, // 1080×1350 @ 30fps; default bitrate looks blocky
    })
    const chunks: BlobPart[] = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    const recordingDone = new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }))
    })

    recorder.start()

    let rafId = 0
    const startedAt = performance.now()
    const tick = () => {
      render(canvas, state, imageData, true)
      if (performance.now() - startedAt < maxDuration * 1000) {
        rafId = requestAnimationFrame(tick)
      } else {
        cancelAnimationFrame(rafId)
        recorder.stop()
        videos.forEach((v) => v.pause())
      }
    }
    tick()

    const blob = await recordingDone
    await shareOrDownload(blob, 'framee_layout.mp4', 'video/mp4', 'Framee 排版影片')
  } finally {
    videos.forEach((v) => {
      v.pause()
      v.currentTime = 0
    })
    isExporting.value = false
  }
}

async function download() {
  if (isExporting.value) return
  const canvas = canvasRef.value?.canvasEl
  if (!canvas) return

  state.activeSlot = null
  const videos = getVideoSlots()

  if (videos.length === 0) {
    await downloadImage()
  } else {
    await downloadVideo(videos)
  }
}
</script>

<template>
  <div class="framee-view">
    <AppTopBar :on-download="download" :is-busy="isExporting" />

    <div class="framee-view__canvas-wrap" @click.self="state.activeSlot = null">
      <FrameeCanvas ref="canvasRef" />
    </div>

    <AppBottomBar />

    <Transition name="drawer">
      <div v-if="state.openDrawer" class="framee-view__drawer">
        <LayoutDrawer v-if="state.openDrawer === 'layout'" />
        <BorderDrawer v-else-if="state.openDrawer === 'border'" />
      </div>
    </Transition>

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

/* Drawer slide-up animation */
.drawer-enter-active {
  transition: transform var(--drawer-anim-open);
}
.drawer-leave-active {
  transition: transform var(--drawer-anim-close);
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateY(100%);
}
</style>

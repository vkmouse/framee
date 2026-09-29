import { reactive } from 'vue'
import { getSlots, calcCoverScale } from '../utils/layout'
import { useCanvasState } from './useCanvasState'

export type MediaType = 'image' | 'video'
export type MediaElement = HTMLImageElement | HTMLVideoElement

export interface SlotData {
  media: MediaElement
  mediaType: MediaType
  scale: number
  tx: number
  ty: number
  minScale: number
}

type ImageData = Record<number, Record<number, SlotData>>

const imageData = reactive<ImageData>({})

const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const MAX_VIDEO_BYTES = 200 * 1024 * 1024

export function getMediaWidth(media: MediaElement): number {
  return media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth
}

export function getMediaHeight(media: MediaElement): number {
  return media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target!.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function loadHTMLImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function loadHTMLVideo(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.loop = false
    video.preload = 'auto'
    // Wait for a decoded frame (not just metadata) so drawImage has something to paint.
    video.onloadeddata = () => resolve(video)
    video.onerror = reject
    video.src = src
  })
}

async function loadImage(slot: number, file: File): Promise<void> {
  const state = useCanvasState()
  const isVideo = file.type.startsWith('video/')

  if (isVideo) {
    if (file.size > MAX_VIDEO_BYTES) {
      alert('影片太大，請選擇 200MB 以下的檔案')
      return
    }
  } else {
    if (file.size > MAX_IMAGE_BYTES) {
      alert('圖片太大，請選擇 20MB 以下的檔案')
      return
    }
  }

  const url = isVideo ? URL.createObjectURL(file) : await readFileAsDataURL(file)
  const media = isVideo ? await loadHTMLVideo(url) : await loadHTMLImage(url)

  const slots = getSlots(state.activeLayout, state.borderPx)
  const s = slots[slot]
  if (!s) return
  const minScale = calcCoverScale(getMediaWidth(media), getMediaHeight(media), s.w, s.h)

  if (!imageData[state.activeLayout]) {
    imageData[state.activeLayout] = {}
  }

  // Release the previous slot's object URL (if it held a video) to avoid leaking memory.
  const prev = imageData[state.activeLayout]![slot]
  if (prev?.mediaType === 'video') {
    URL.revokeObjectURL((prev.media as HTMLVideoElement).src)
  }

  imageData[state.activeLayout]![slot] = {
    media,
    mediaType: isVideo ? 'video' : 'image',
    scale: minScale,
    tx: 0,
    ty: 0,
    minScale,
  }

  state.activeSlot = slot
}

function switchLayout(newLayoutId: number): void {
  const state = useCanvasState()
  const oldData = imageData[state.activeLayout] || {}
  const newSlots = getSlots(newLayoutId, state.borderPx)

  if (!imageData[newLayoutId]) {
    imageData[newLayoutId] = {}
  }

  newSlots.forEach((s, i) => {
    const d = oldData[i]
    if (d) {
      const newMinScale = calcCoverScale(getMediaWidth(d.media), getMediaHeight(d.media), s.w, s.h)
      imageData[newLayoutId]![i] = {
        ...d,
        minScale: newMinScale,
        scale: Math.max(d.scale, newMinScale * 0.5),
      }
    }
  })

  state.activeLayout = newLayoutId
  state.activeSlot = null
}

export function useImageStore() {
  return { imageData, loadImage, switchLayout }
}

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
    video.defaultMuted = true
    video.playsInline = true
    // iOS Safari only honors these as attributes, and only when set before `src`.
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.loop = false
    video.preload = 'auto'

    let settled = false
    let fallbackTimer = 0
    let hardTimer = 0

    const done = (err?: Error) => {
      if (settled) return
      settled = true
      clearTimeout(fallbackTimer)
      clearTimeout(hardTimer)
      video.onloadedmetadata = null
      video.onloadeddata = null
      video.onseeked = null
      video.onerror = null
      if (err) reject(err)
      else resolve(video)
    }

    // Desktop browsers decode the first frame on their own.
    video.onloadeddata = () => done()

    // iOS Safari ignores `preload` for detached <video> elements and never fetches
    // frame data, so `loadeddata` never fires. Seeking forces it to decode a frame.
    video.onloadedmetadata = () => {
      try {
        video.currentTime = 0.001
      } catch {
        /* ignore, fallback timer below handles it */
      }
    }
    video.onseeked = () => done()

    video.onerror = () =>
      done(new Error('這支影片無法讀取，格式可能不支援（請試試 MP4 / MOV 的 H.264 或 HEVC）'))

    video.src = src
    video.load()

    // Fallback: metadata is there but no frame event came → prime the decoder with a
    // muted play/pause (allowed on iOS because it is muted + inline).
    fallbackTimer = window.setTimeout(() => {
      if (settled || !video.videoWidth) return
      video
        .play()
        .then(() => {
          video.pause()
          video.currentTime = 0
          done()
        })
        .catch(() => done())
    }, 2500)

    hardTimer = window.setTimeout(() => {
      done(new Error('影片讀取逾時，檔案可能過大或格式不支援'))
    }, 15000)
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

  let url = ''
  let media: MediaElement
  try {
    url = isVideo ? URL.createObjectURL(file) : await readFileAsDataURL(file)
    media = isVideo ? await loadHTMLVideo(url) : await loadHTMLImage(url)
  } catch (err) {
    if (isVideo && url) URL.revokeObjectURL(url)
    alert(err instanceof Error ? err.message : '檔案讀取失敗，請換一個檔案再試')
    return
  }

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

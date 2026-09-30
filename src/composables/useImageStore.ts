import { reactive } from 'vue'
import { getSlots, calcCoverScale } from '../utils/layout'
import { useCanvasState } from './useCanvasState'

export type MediaType = 'image' | 'video'
export type MediaElement = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement

export interface SlotData {
  media: MediaElement
  mediaType: MediaType
  /** Blob URL backing `media`. Revoked once no slot references the media any more. */
  objectUrl?: string
  scale: number
  tx: number
  ty: number
  minScale: number
}

type ImageData = Record<number, Record<number, SlotData>>

const imageData = reactive<ImageData>({})

/** True while a picked file is being decoded, so the UI can show progress. */
const loading = reactive({ active: false, label: '' })

const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const MAX_VIDEO_BYTES = 200 * 1024 * 1024

/**
 * Photos are downscaled to this on their longest side. The canvas is 1080 wide, so this
 * still leaves room to pinch-zoom, but a 12 MP photo is no longer re-scaled on every
 * video frame.
 */
const PHOTO_MAX_SIDE = 2400

const VIDEO_LOAD_TIMEOUT_MS = 20000

/** Load failure with copy that is safe to show to the person as-is. */
export class MediaLoadError extends Error {
  title: string
  /** Technical state (codec readiness, error code) for bug reports. */
  debug?: string

  constructor(title: string, message: string, debug?: string) {
    super(message)
    this.title = title
    this.debug = debug
  }
}

export function getMediaWidth(media: MediaElement): number {
  if (media instanceof HTMLVideoElement) return media.videoWidth
  if (media instanceof HTMLImageElement) return media.naturalWidth
  return media.width
}

export function getMediaHeight(media: MediaElement): number {
  if (media instanceof HTMLVideoElement) return media.videoHeight
  if (media instanceof HTMLImageElement) return media.naturalHeight
  return media.height
}

function formatSize(bytes: number): string {
  const mb = bytes / 1024 / 1024
  if (mb >= 1) return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function describeFile(file: File): string {
  return `${file.name || '未命名檔案'} · ${file.type || '未知格式'} · ${formatSize(file.size)}`
}

const VIDEO_EXT = /\.(mp4|m4v|mov|qt|3gp|webm)$/i
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp)$/i

/** iOS sometimes hands over files with an empty MIME type, so fall back to the extension. */
function detectKind(file: File): MediaType | null {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('image/')) return 'image'
  if (VIDEO_EXT.test(file.name)) return 'video'
  if (IMAGE_EXT.test(file.name)) return 'image'
  return null
}

function discardVideo(video: HTMLVideoElement): void {
  video.pause()
  video.removeAttribute('src')
  video.load()
  video.remove()
}

function loadHTMLImage(url: string, file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      const isHeic = /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
      reject(
        new MediaLoadError(
          '無法讀取這張照片',
          isHeic
            ? '這個瀏覽器不支援 HEIC 格式。請改用 Safari 開啟，或先轉成 JPG 再選。'
            : '檔案可能已損毀，或格式不支援。請換一張照片試試。',
        ),
      )
    }
    img.src = url
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

    // iOS throttles or skips decoding for <video> elements that are not in the document,
    // which shows up as choppy or blank frames when drawing them onto a canvas. Keep the
    // element mounted but invisible. (opacity 0 can let the browser skip painting it.)
    video.setAttribute('aria-hidden', 'true')
    Object.assign(video.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: '2px',
      height: '2px',
      opacity: '0.01',
      pointerEvents: 'none',
      zIndex: '-1',
    })
    document.body.appendChild(video)

    let settled = false
    let primed = false
    let pollTimer = 0
    let primeTimer = 0
    let hardTimer = 0

    const snapshot = () =>
      `readyState=${video.readyState} · ${video.videoWidth}×${video.videoHeight} · error=${video.error?.code ?? '-'}`

    const cleanup = () => {
      clearInterval(pollTimer)
      clearTimeout(primeTimer)
      clearTimeout(hardTimer)
      video.onloadedmetadata = null
      video.onloadeddata = null
      video.oncanplay = null
      video.onseeked = null
      video.onerror = null
    }

    // "Loaded" is not enough: the first frame must be decodable, otherwise drawImage()
    // silently paints nothing and the slot looks empty.
    const isReady = () =>
      video.videoWidth > 0 &&
      video.videoHeight > 0 &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA

    const succeed = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve(video)
    }

    const fail = (err: MediaLoadError) => {
      if (settled) return
      settled = true
      cleanup()
      discardVideo(video)
      reject(err)
    }

    const check = () => {
      if (isReady()) succeed()
    }

    video.onloadeddata = check
    video.oncanplay = check
    video.onseeked = check

    // iOS Safari ignores `preload` for some videos and never decodes a frame, so
    // `loadeddata` never fires. Seeking forces it to decode one.
    video.onloadedmetadata = () => {
      try {
        video.currentTime = 0.001
      } catch {
        /* the poll + prime below handle it */
      }
      check()
    }

    video.onerror = () =>
      fail(
        new MediaLoadError(
          '這支影片無法播放',
          '這個瀏覽器讀不了這支影片的編碼。請改選 H.264 或 HEVC 編碼的 MP4 / MOV。',
          `MediaError ${video.error?.code ?? '?'} · ${snapshot()}`,
        ),
      )

    // Events are not reliable across iOS versions, so poll as well.
    pollTimer = window.setInterval(check, 250)

    // Metadata is there but no frame yet → prime the decoder with a muted play/pause
    // (allowed on iOS because it is muted + inline).
    primeTimer = window.setTimeout(() => {
      if (settled || primed || video.videoWidth <= 0) return
      primed = true
      video
        .play()
        .then(() => {
          video.pause()
          try {
            video.currentTime = 0.001
          } catch {
            /* ignore */
          }
          check()
        })
        .catch(() => {
          /* keep polling until the hard timeout */
        })
    }, 2500)

    hardTimer = window.setTimeout(() => {
      fail(
        new MediaLoadError(
          '影片讀取逾時',
          '手機一直沒能取得這支影片的第一格畫面。請改選較短、或 H.264 編碼的影片再試一次。',
          snapshot(),
        ),
      )
    }, VIDEO_LOAD_TIMEOUT_MS)

    video.src = src
    video.load()
  })
}

interface LoadedMedia {
  media: MediaElement
  objectUrl?: string
}

async function loadVideo(file: File): Promise<LoadedMedia> {
  const objectUrl = URL.createObjectURL(file)
  try {
    return { media: await loadHTMLVideo(objectUrl), objectUrl }
  } catch (err) {
    URL.revokeObjectURL(objectUrl)
    throw err
  }
}

async function loadPhoto(file: File): Promise<LoadedMedia> {
  const objectUrl = URL.createObjectURL(file)
  let img: HTMLImageElement
  try {
    img = await loadHTMLImage(objectUrl, file)
  } catch (err) {
    URL.revokeObjectURL(objectUrl)
    throw err
  }

  const w = img.naturalWidth
  const h = img.naturalHeight
  if (!w || !h) {
    URL.revokeObjectURL(objectUrl)
    throw new MediaLoadError('無法讀取這張照片', '讀不到照片的尺寸，檔案可能已損毀。請換一張照片試試。')
  }

  const longest = Math.max(w, h)
  if (longest <= PHOTO_MAX_SIDE) return { media: img, objectUrl }

  const ratio = PHOTO_MAX_SIDE / longest
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * ratio)
  canvas.height = Math.round(h * ratio)
  const ctx = canvas.getContext('2d')
  if (!ctx) return { media: img, objectUrl }

  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(objectUrl)
  return { media: canvas }
}

/** True if any layout still references this media element. */
function isMediaInUse(media: MediaElement): boolean {
  return Object.values(imageData).some((layout) =>
    Object.values(layout).some((d) => d.media === media),
  )
}

function releaseMedia(data: SlotData): void {
  if (isMediaInUse(data.media)) return
  if (data.mediaType === 'video') discardVideo(data.media as HTMLVideoElement)
  if (data.objectUrl) URL.revokeObjectURL(data.objectUrl)
}

/**
 * Decode `file` into `slot` of the active layout.
 * Throws a `MediaLoadError` (already worded for the person) when the file can't be used.
 */
async function loadImage(slot: number, file: File): Promise<void> {
  if (loading.active) return

  const state = useCanvasState()
  const layoutId = state.activeLayout

  const kind = detectKind(file)
  if (!kind) {
    throw new MediaLoadError('不支援這個檔案', '請選擇照片（JPG、PNG、HEIC）或影片（MP4、MOV）。')
  }
  if (file.size === 0) {
    throw new MediaLoadError(
      '檔案是空的',
      '如果這個檔案存在 iCloud，請先讓它下載到手機，再選一次。',
    )
  }

  const isVideo = kind === 'video'
  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (file.size > limit) {
    throw new MediaLoadError(
      isVideo ? '影片太大' : '圖片太大',
      `這個檔案 ${formatSize(file.size)}，上限是 ${formatSize(limit)}。請改選${isVideo ? '較短的影片' : '較小的圖片'}。`,
    )
  }

  loading.active = true
  loading.label = isVideo ? '正在讀取影片…' : '正在處理照片…'

  let loaded: LoadedMedia
  try {
    loaded = isVideo ? await loadVideo(file) : await loadPhoto(file)
  } finally {
    loading.active = false
  }

  const { media, objectUrl } = loaded
  const slotRect = getSlots(layoutId, state.borderPx)[slot]
  const minScale = slotRect
    ? calcCoverScale(getMediaWidth(media), getMediaHeight(media), slotRect.w, slotRect.h)
    : NaN

  if (!slotRect || !Number.isFinite(minScale) || minScale <= 0) {
    releaseMedia({ media, mediaType: kind, objectUrl, scale: 1, tx: 0, ty: 0, minScale: 1 })
    if (!slotRect) return
    throw new MediaLoadError('讀不到畫面尺寸', '這個檔案沒有可用的畫面。請換一個檔案再試。')
  }

  if (!imageData[layoutId]) {
    imageData[layoutId] = {}
  }

  const prev = imageData[layoutId]![slot]

  imageData[layoutId]![slot] = {
    media,
    mediaType: kind,
    objectUrl,
    scale: minScale,
    tx: 0,
    ty: 0,
    minScale,
  }

  // Free the replaced media, unless another layout still shows it.
  if (prev) releaseMedia(prev)

  if (state.activeLayout === layoutId) state.activeSlot = slot
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
  return { imageData, loadImage, switchLayout, loading }
}

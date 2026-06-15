import { reactive } from 'vue'
import { getSlots, calcCoverScale } from '../utils/layout'
import { useCanvasState } from './useCanvasState'

export interface SlotData {
  img: HTMLImageElement
  scale: number
  tx: number
  ty: number
  minScale: number
}

type ImageData = Record<number, Record<number, SlotData>>

const imageData = reactive<ImageData>({})

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

async function loadImage(slot: number, file: File): Promise<void> {
  const state = useCanvasState()

  if (file.size > 20 * 1024 * 1024) {
    alert('圖片太大，請選擇 20MB 以下的檔案')
    return
  }

  const dataURL = await readFileAsDataURL(file)
  const img = await loadHTMLImage(dataURL)

  const slots = getSlots(state.activeLayout, state.borderPx)
  const s = slots[slot]
  if (!s) return
  const minScale = calcCoverScale(img.naturalWidth, img.naturalHeight, s.w, s.h)

  if (!imageData[state.activeLayout]) {
    imageData[state.activeLayout] = {}
  }

  imageData[state.activeLayout]![slot] = {
    img,
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
      const newMinScale = calcCoverScale(d.img.naturalWidth, d.img.naturalHeight, s.w, s.h)
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

import type { CanvasState } from './useCanvasState'
import type { SlotData } from './useImageStore'
import { getSlots } from '../utils/layout'

type ImageDataMap = Record<number, Record<number, SlotData>>

export function getCanvasScale(canvas: HTMLCanvasElement): number {
  return 1080 / canvas.getBoundingClientRect().width
}

export function render(
  canvas: HTMLCanvasElement,
  state: CanvasState,
  imageData: ImageDataMap,
  forExport = false,
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { borderPx, borderColor, activeLayout, activeSlot } = state

  ctx.fillStyle = borderColor
  ctx.fillRect(0, 0, 1080, 1350)

  const slots = getSlots(activeLayout, borderPx)

  slots.forEach((slot, i) => {
    const data = imageData[activeLayout]?.[i]

    if (data) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(slot.x, slot.y, slot.w, slot.h)
      ctx.clip()

      const drawW = data.img.naturalWidth * data.scale
      const drawH = data.img.naturalHeight * data.scale
      const cx = slot.x + slot.w / 2 + data.tx
      const cy = slot.y + slot.h / 2 + data.ty

      ctx.drawImage(data.img, cx - drawW / 2, cy - drawH / 2, drawW, drawH)
      ctx.restore()
    } else {
      ctx.fillStyle = '#cccccc'
      ctx.fillRect(slot.x, slot.y, slot.w, slot.h)

      if (!forExport) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'
        ctx.font = '80px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('+', slot.x + slot.w / 2, slot.y + slot.h / 2)
      }
    }

    if (!forExport && activeSlot === i) {
      ctx.strokeStyle = 'rgba(0,0,0,0.8)'
      ctx.lineWidth = 8
      ctx.strokeRect(slot.x + 4, slot.y + 4, slot.w - 8, slot.h - 8)
    }
  })
}

export function useCanvasRenderer() {
  return { render, getCanvasScale }
}

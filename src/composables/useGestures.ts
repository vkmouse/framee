import type { CanvasState } from './useCanvasState'
import type { SlotData } from './useImageStore'
import { getSlots } from '../utils/layout'
import { getCanvasScale } from './useCanvasRenderer'

type ImageDataMap = Record<number, Record<number, SlotData>>

interface DragState {
  type: 'drag'
  slot: number
  startX: number
  startY: number
}

interface PinchState {
  type: 'pinch'
  slot: number
  startDist: number
  initScale: number
}

type TouchState = DragState | PinchState | null

function getSlotAt(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  state: CanvasState,
): number {
  const rect = canvas.getBoundingClientRect()
  const scale = getCanvasScale(canvas)
  const cx = (clientX - rect.left) * scale
  const cy = (clientY - rect.top) * scale

  const slots = getSlots(state.activeLayout, state.borderPx)
  return slots.findIndex(
    (s) => cx >= s.x && cx <= s.x + s.w && cy >= s.y && cy <= s.y + s.h,
  )
}

export function bindGestures(
  canvas: HTMLCanvasElement,
  state: CanvasState,
  imageData: ImageDataMap,
  onFileRequest: (slot: number) => void,
  onRender: () => void,
): () => void {
  let touchState: TouchState = null

  function onTouchStart(e: TouchEvent) {
    e.preventDefault()

    if (e.touches.length === 1) {
      const touch = e.touches[0]
      if (!touch) return
      const slot = getSlotAt(touch.clientX, touch.clientY, canvas, state)
      if (slot < 0) return

      const hasImage = !!imageData[state.activeLayout]?.[slot]

      if (!hasImage) {
        onFileRequest(slot)
        return
      }

      state.activeSlot = slot
      onRender()
      touchState = {
        type: 'drag',
        slot,
        startX: touch.clientX,
        startY: touch.clientY,
      }
    } else if (e.touches.length === 2) {
      if (state.activeSlot === null) return
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      if (!t1 || !t2) return
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      const slotData = imageData[state.activeLayout]?.[state.activeSlot]
      if (!slotData) return

      touchState = {
        type: 'pinch',
        slot: state.activeSlot,
        startDist: dist,
        initScale: slotData.scale,
      }
    }
  }

  function onTouchMove(e: TouchEvent) {
    e.preventDefault()
    if (!touchState) return

    const scale = getCanvasScale(canvas)

    if (touchState.type === 'drag' && e.touches.length === 1) {
      const touch = e.touches[0]
      if (!touch) return
      const dx = (touch.clientX - touchState.startX) * scale
      const dy = (touch.clientY - touchState.startY) * scale
      touchState.startX = touch.clientX
      touchState.startY = touch.clientY

      const d = imageData[state.activeLayout]?.[touchState.slot]
      if (d) {
        d.tx += dx
        d.ty += dy
        onRender()
      }
    } else if (touchState.type === 'pinch' && e.touches.length === 2) {
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      if (!t1 || !t2) return
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      const ratio = dist / touchState.startDist

      const d = imageData[state.activeLayout]?.[touchState.slot]
      if (d) {
        const newScale = touchState.initScale * ratio
        d.scale = Math.max(d.minScale * 0.5, newScale)
        onRender()
      }
    }
  }

  function onTouchEnd() {
    touchState = null
  }

  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  canvas.addEventListener('touchmove', onTouchMove, { passive: false })
  canvas.addEventListener('touchend', onTouchEnd, { passive: true })

  return () => {
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('touchmove', onTouchMove)
    canvas.removeEventListener('touchend', onTouchEnd)
  }
}

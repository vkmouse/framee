import type { CanvasState } from './useCanvasState'
import type { SlotData } from './useImageStore'
import { getSlots, getReplaceButtonRect, pointInRect } from '../utils/layout'
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

/** Returns the active slot index if the point hits its "換照片" button, otherwise -1. */
function getReplaceButtonSlotAt(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  state: CanvasState,
  imageData: ImageDataMap,
): number {
  const active = state.activeSlot
  if (active === null) return -1
  if (!imageData[state.activeLayout]?.[active]) return -1

  const slot = getSlots(state.activeLayout, state.borderPx)[active]
  if (!slot) return -1

  const rect = canvas.getBoundingClientRect()
  const scale = getCanvasScale(canvas)
  const cx = (clientX - rect.left) * scale
  const cy = (clientY - rect.top) * scale

  return pointInRect(cx, cy, getReplaceButtonRect(slot)) ? active : -1
}

export function bindGestures(
  canvas: HTMLCanvasElement,
  state: CanvasState,
  imageData: ImageDataMap,
  onFileRequest: (slot: number) => void,
  onRender: () => void,
): () => void {
  let touchState: TouchState = null
  // True while a finger is down on the "換照片" button, so we don't start a drag
  // and don't block the synthesized click that opens the file picker.
  let buttonTouch = false

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      if (!touch) return

      if (getReplaceButtonSlotAt(touch.clientX, touch.clientY, canvas, state, imageData) >= 0) {
        buttonTouch = true
        return
      }

      const slot = getSlotAt(touch.clientX, touch.clientY, canvas, state)
      if (slot < 0) return

      const hasImage = !!imageData[state.activeLayout]?.[slot]

      if (!hasImage) {
        // Do not preventDefault — let browser synthesize a click event,
        // which onClick will handle to trigger the file picker reliably.
        return
      }

      e.preventDefault()
      state.activeSlot = slot
      onRender()
      touchState = {
        type: 'drag',
        slot,
        startX: touch.clientX,
        startY: touch.clientY,
      }
    } else if (e.touches.length === 2) {
      e.preventDefault()
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

  function onClick(e: MouseEvent) {
    // Tap on the "換照片" button of the selected slot → open file picker to replace.
    const buttonSlot = getReplaceButtonSlotAt(e.clientX, e.clientY, canvas, state, imageData)
    if (buttonSlot >= 0) {
      onFileRequest(buttonSlot)
      return
    }

    const slot = getSlotAt(e.clientX, e.clientY, canvas, state)

    // Tap on the border / gap between slots → deselect.
    if (slot < 0) {
      if (state.activeSlot !== null) {
        state.activeSlot = null
        onRender()
      }
      return
    }

    const data = imageData[state.activeLayout]?.[slot]
    if (!data) {
      onFileRequest(slot)
    } else if (state.activeSlot !== slot) {
      // Mouse click on a filled slot (touch selects in touchstart) → select it.
      state.activeSlot = slot
      onRender()
    } else if (data.mediaType === 'video') {
      // Tapping an already-selected video slot toggles playback.
      const video = data.media as HTMLVideoElement
      if (video.paused) {
        if (video.ended) video.currentTime = 0
        void video.play()
      } else {
        video.pause()
      }
      onRender()
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (buttonTouch) return
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
    buttonTouch = false
  }

  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  canvas.addEventListener('touchmove', onTouchMove, { passive: false })
  canvas.addEventListener('touchend', onTouchEnd, { passive: true })
  canvas.addEventListener('click', onClick)

  return () => {
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('touchmove', onTouchMove)
    canvas.removeEventListener('touchend', onTouchEnd)
    canvas.removeEventListener('click', onClick)
  }
}

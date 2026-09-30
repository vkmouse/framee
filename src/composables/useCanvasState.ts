import { reactive } from 'vue'

export interface CanvasState {
  borderPx: number
  borderColor: string
  activeLayout: number
  activeSlot: number | null
  openDrawer: 'layout' | 'border' | null
  /** True while a video export is recording the canvas; the preview loop must not repaint. */
  isExporting: boolean
}

const state = reactive<CanvasState>({
  borderPx: 30,
  borderColor: '#ffffff',
  activeLayout: 1,
  activeSlot: null,
  openDrawer: null,
  isExporting: false,
})

export function useCanvasState() {
  return state
}

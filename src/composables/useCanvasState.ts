import { reactive } from 'vue'

export interface CanvasState {
  borderPx: number
  borderColor: string
  activeLayout: number
  activeSlot: number | null
  openDrawer: 'layout' | 'border' | 'color' | null
}

const state = reactive<CanvasState>({
  borderPx: 30,
  borderColor: '#ffffff',
  activeLayout: 1,
  activeSlot: null,
  openDrawer: null,
})

export function useCanvasState() {
  return state
}

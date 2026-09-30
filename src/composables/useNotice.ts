import { reactive } from 'vue'

export interface NoticeAction {
  label: string
  run: () => void
}

export interface Notice {
  /** What went wrong, in a few words. */
  title: string
  /** What the person can do about it. */
  message: string
  /** File name / type / size / codec state. Selectable so it can be pasted into a bug report. */
  detail?: string
  /** Optional primary action (e.g. pick another file). */
  action?: NoticeAction
}

const state = reactive<{ current: Notice | null }>({ current: null })

export function showNotice(notice: Notice): void {
  state.current = notice
}

export function closeNotice(): void {
  state.current = null
}

export function useNotice() {
  return { notice: state, showNotice, closeNotice }
}

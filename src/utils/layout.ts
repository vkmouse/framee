export interface Slot {
  x: number
  y: number
  w: number
  h: number
}

const W = 1080
const H = 1350

/** Canvas size in px; also used by the layout drawer to draw exact thumbnails. */
export const CANVAS_W = W
export const CANVAS_H = H

/** Plain-language names, shared by the tool dock and the layout drawer. */
export const layoutOptions = [
  { id: 1, name: '單張' },
  { id: 2, name: '上下兩張' },
  { id: 3, name: '左二右一' },
  { id: 4, name: '四宮格' },
  { id: 5, name: '三列' },
] as const

export function layoutName(id: number): string {
  return layoutOptions.find((l) => l.id === id)?.name ?? ''
}

export function getSlots(layoutId: number, b: number): Slot[] {
  switch (layoutId) {
    case 1:
      return [{ x: b, y: b, w: W - 2 * b, h: H - 2 * b }]

    case 2: {
      const h = (H - 3 * b) / 2
      return [
        { x: b, y: b, w: W - 2 * b, h },
        { x: b, y: b + h + b, w: W - 2 * b, h },
      ]
    }

    case 3: {
      const colW = (W - 3 * b) / 2
      const leftH = (H - 3 * b) / 2
      return [
        { x: b, y: b, w: colW, h: leftH },
        { x: b, y: b + leftH + b, w: colW, h: leftH },
        { x: b + colW + b, y: b, w: colW, h: H - 2 * b },
      ]
    }

    case 4: {
      const w = (W - 3 * b) / 2
      const h = (H - 3 * b) / 2
      return [
        { x: b, y: b, w, h },
        { x: b + w + b, y: b, w, h },
        { x: b, y: b + h + b, w, h },
        { x: b + w + b, y: b + h + b, w, h },
      ]
    }

    case 5: {
      const h = (H - 4 * b) / 3
      return [
        { x: b, y: b, w: W - 2 * b, h },
        { x: b, y: b + h + b, w: W - 2 * b, h },
        { x: b, y: b + 2 * (h + b), w: W - 2 * b, h },
      ]
    }

    default:
      return []
  }
}

const REPLACE_BTN_W = 300
const REPLACE_BTN_H = 120
const REPLACE_BTN_MARGIN = 36

/** Rect of the "換照片" button, anchored at the bottom center of a slot. */
export function getReplaceButtonRect(slot: Slot): Slot {
  const w = Math.min(REPLACE_BTN_W, slot.w - 2 * REPLACE_BTN_MARGIN)
  const h = Math.min(REPLACE_BTN_H, slot.h - 2 * REPLACE_BTN_MARGIN)
  return {
    x: slot.x + (slot.w - w) / 2,
    y: slot.y + slot.h - h - REPLACE_BTN_MARGIN,
    w,
    h,
  }
}

export function pointInRect(px: number, py: number, r: Slot): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h
}

export function calcCoverScale(
  imgW: number,
  imgH: number,
  slotW: number,
  slotH: number,
): number {
  return Math.max(slotW / imgW, slotH / imgH)
}

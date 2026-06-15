export interface Slot {
  x: number
  y: number
  w: number
  h: number
}

const W = 1080
const H = 1350

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

export function calcCoverScale(
  imgW: number,
  imgH: number,
  slotW: number,
  slotH: number,
): number {
  return Math.max(slotW / imgW, slotH / imgH)
}

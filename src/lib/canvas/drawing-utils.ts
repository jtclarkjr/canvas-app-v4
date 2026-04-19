import type {
  Camera,
  Path,
  Point,
  TextElement
} from '$lib/canvas/types'

export function isPointNearPath(
  point: Point,
  path: Path,
  threshold: number
): boolean {
  return path.points.some((pathPoint) => {
    const distance = Math.sqrt(
      (point.x - pathPoint.x) ** 2 + (point.y - pathPoint.y) ** 2
    )
    return distance < threshold
  })
}

export function isElementInSelection(
  element: Path | TextElement,
  selectionRect: { x1: number; y1: number; x2: number; y2: number }
): boolean {
  if ('text' in element) {
    return (
      element.x >= selectionRect.x1 &&
      element.x <= selectionRect.x2 &&
      element.y >= selectionRect.y1 &&
      element.y <= selectionRect.y2
    )
  }

  return element.points.some(
    (point) =>
      point.x >= selectionRect.x1 &&
      point.x <= selectionRect.x2 &&
      point.y >= selectionRect.y1 &&
      point.y <= selectionRect.y2
  )
}

export function findTextAtPoint(
  point: Point,
  textElements: TextElement[]
): TextElement | null {
  for (let i = textElements.length - 1; i >= 0; i -= 1) {
    const text = textElements[i]
    if (!text || !text.text) continue
    const width = Math.max(text.text.length, 1) * text.fontSize * 0.6
    const height = text.fontSize
    const withinX = point.x >= text.x && point.x <= text.x + width
    const withinY = point.y >= text.y && point.y <= text.y + height
    if (withinX && withinY) {
      return text
    }
  }
  return null
}

export function screenToCanvas(
  clientX: number,
  clientY: number,
  svgRect: DOMRect,
  camera: Camera
): Point {
  return {
    x: (clientX - svgRect.left - camera.x) / camera.scale,
    y: (clientY - svgRect.top - camera.y) / camera.scale
  }
}

export function pathToSvgPath(points: Point[]): string {
  if (points.length === 0) return ''
  const [first, ...rest] = points
  if (!first) return ''
  let d = `M ${first.x} ${first.y}`
  for (const point of rest) {
    d += ` L ${point.x} ${point.y}`
  }
  return d
}

export function calculateTextBounds(text: TextElement) {
  const width = Math.max(text.text.length, 1) * text.fontSize * 0.6 + 8
  const height = text.fontSize + 8
  return {
    x: text.x - 4,
    y: text.y - 4,
    width,
    height
  }
}

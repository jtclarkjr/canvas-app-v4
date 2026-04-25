import { describe, expect, it } from 'vite-plus/test'
import {
  findTextAtPoint,
  isElementInSelection,
  isPointNearPath
} from '$lib/canvas/drawing-utils'
import type { Path, TextElement } from '$lib/canvas/types'

describe('drawing utils', () => {
  it('finds text elements by bounding box hit test', () => {
    const text: TextElement = {
      id: 'text-1',
      text: 'hello',
      x: 10,
      y: 20,
      color: '#111111',
      fontSize: 18,
      isBold: false,
      isItalic: false,
      isUnderline: false
    }

    expect(findTextAtPoint({ x: 15, y: 25 }, [text])?.id).toBe('text-1')
    expect(findTextAtPoint({ x: 200, y: 200 }, [text])).toBeNull()
  })

  it('detects paths inside selection rectangles', () => {
    const path: Path = {
      id: 'path-1',
      points: [
        { x: 10, y: 10 },
        { x: 20, y: 20 }
      ],
      color: '#000000',
      width: 2
    }

    expect(
      isElementInSelection(path, { x1: 0, y1: 0, x2: 15, y2: 15 })
    ).toBe(true)
    expect(
      isElementInSelection(path, { x1: 30, y1: 30, x2: 40, y2: 40 })
    ).toBe(false)
  })

  it('matches points near a path using the threshold', () => {
    const path: Path = {
      id: 'path-1',
      points: [{ x: 50, y: 50 }],
      color: '#000000',
      width: 2
    }

    expect(isPointNearPath({ x: 55, y: 55 }, path, 10)).toBe(true)
    expect(isPointNearPath({ x: 80, y: 80 }, path, 10)).toBe(false)
  })
})

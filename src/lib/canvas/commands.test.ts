import { describe, expect, it } from 'vite-plus/test'
import {
  createCreatePathCommand,
  createDeleteMultipleCommand,
  createMoveElementCommand,
  getInverseCommand
} from '$lib/canvas/commands'
import type { Path, TextElement } from '$lib/canvas/types'

describe('canvas commands', () => {
  it('inverts create-path into delete-element', () => {
    const path: Path = {
      id: 'path-1',
      points: [{ x: 1, y: 2 }],
      color: '#000000',
      width: 2
    }

    const command = createCreatePathCommand(path, 'user-1')
    const inverse = getInverseCommand(command)

    expect(inverse.type).toBe('DELETE_ELEMENT')
    if (inverse.type === 'DELETE_ELEMENT') {
      expect(inverse.element.id).toBe(path.id)
      expect(inverse.elementType).toBe('path')
    }
  })

  it('swaps before and after for move-element undo', () => {
    const command = createMoveElementCommand(
      'text-1',
      'text',
      { x: 10, y: 20 },
      { x: 30, y: 40 },
      'user-1'
    )

    const inverse = getInverseCommand(command)

    expect(inverse.type).toBe('MOVE_ELEMENT')
    if (inverse.type === 'MOVE_ELEMENT') {
      expect(inverse.before).toEqual({ x: 30, y: 40 })
      expect(inverse.after).toEqual({ x: 10, y: 20 })
    }
  })

  it('recreates deleted elements when undoing delete-multiple', () => {
    const text: TextElement = {
      id: 'text-1',
      text: 'hello',
      x: 10,
      y: 20,
      color: '#000000',
      fontSize: 16,
      isBold: false,
      isItalic: false,
      isUnderline: false
    }

    const command = createDeleteMultipleCommand(
      [{ element: text, type: 'text' }],
      'user-1'
    )

    const inverse = getInverseCommand(command)

    expect(inverse.type).toBe('CREATE_MULTIPLE')
    if (inverse.type === 'CREATE_MULTIPLE') {
      expect(inverse.elements).toHaveLength(1)
      expect(inverse.elements[0]?.element).toEqual(text)
    }
  })
})

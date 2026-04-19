import type { Path, Point, TextElement } from '$lib/canvas/types'

export type CommandType =
  | 'CREATE_PATH'
  | 'CREATE_TEXT'
  | 'CREATE_MULTIPLE'
  | 'UPDATE_TEXT'
  | 'MOVE_ELEMENT'
  | 'MOVE_MULTIPLE'
  | 'DELETE_ELEMENT'
  | 'DELETE_MULTIPLE'

export interface BaseCommand {
  type: CommandType
  timestamp: number
  userId: string
}

export interface CreatePathCommand extends BaseCommand {
  type: 'CREATE_PATH'
  element: Path
}

export interface CreateTextCommand extends BaseCommand {
  type: 'CREATE_TEXT'
  element: TextElement
}

export interface CreateMultipleCommand extends BaseCommand {
  type: 'CREATE_MULTIPLE'
  elements: Array<{
    element: Path | TextElement
    type: 'path' | 'text'
  }>
}

export interface UpdateTextCommand extends BaseCommand {
  type: 'UPDATE_TEXT'
  elementId: string
  before: TextElement
  after: TextElement
}

export interface MoveElementCommand extends BaseCommand {
  type: 'MOVE_ELEMENT'
  elementId: string
  elementType: 'path' | 'text'
  before: { x?: number; y?: number; points?: Point[] }
  after: { x?: number; y?: number; points?: Point[] }
}

export interface MoveMultipleCommand extends BaseCommand {
  type: 'MOVE_MULTIPLE'
  elements: Array<{
    id: string
    type: 'path' | 'text'
    before: { x?: number; y?: number; points?: Point[] }
    after: { x?: number; y?: number; points?: Point[] }
  }>
}

export interface DeleteElementCommand extends BaseCommand {
  type: 'DELETE_ELEMENT'
  element: Path | TextElement
  elementType: 'path' | 'text'
}

export interface DeleteMultipleCommand extends BaseCommand {
  type: 'DELETE_MULTIPLE'
  elements: Array<{
    element: Path | TextElement
    type: 'path' | 'text'
  }>
}

export type Command =
  | CreatePathCommand
  | CreateTextCommand
  | CreateMultipleCommand
  | UpdateTextCommand
  | MoveElementCommand
  | MoveMultipleCommand
  | DeleteElementCommand
  | DeleteMultipleCommand

export type SetState<T> = (value: T | ((prev: T) => T)) => void

export interface ApplyCommandOptions {
  canvasId: string
  paths: Path[]
  textElements: TextElement[]
  setPaths: SetState<Path[]>
  setTextElements: SetState<TextElement[]>
  upsertElement: {
    mutate: (
      variables: {
        id?: string
        canvasId: string
        type: string
        data?: Record<string, unknown> | null
        x: number
        y: number
        z?: number | null
      },
      options?: { onError?: (error: unknown) => void }
    ) => void
  }
  deleteElement: {
    mutate: (
      variables: { id: string },
      options?: { onError?: (error: unknown) => void }
    ) => void
  }
}

export const createCreatePathCommand = (
  path: Path,
  userId: string
): CreatePathCommand => ({
  type: 'CREATE_PATH',
  timestamp: Date.now(),
  userId,
  element: { ...path, points: [...path.points] }
})

export const createCreateTextCommand = (
  text: TextElement,
  userId: string
): CreateTextCommand => ({
  type: 'CREATE_TEXT',
  timestamp: Date.now(),
  userId,
  element: { ...text }
})

export const createUpdateTextCommand = (
  elementId: string,
  before: TextElement,
  after: TextElement,
  userId: string
): UpdateTextCommand => ({
  type: 'UPDATE_TEXT',
  timestamp: Date.now(),
  userId,
  elementId,
  before: { ...before },
  after: { ...after }
})

export const createMoveElementCommand = (
  elementId: string,
  elementType: 'path' | 'text',
  before: { x?: number; y?: number; points?: Point[] },
  after: { x?: number; y?: number; points?: Point[] },
  userId: string
): MoveElementCommand => ({
  type: 'MOVE_ELEMENT',
  timestamp: Date.now(),
  userId,
  elementId,
  elementType,
  before: before.points ? { ...before, points: [...before.points] } : { ...before },
  after: after.points ? { ...after, points: [...after.points] } : { ...after }
})

export const createMoveMultipleCommand = (
  elements: Array<{
    id: string
    type: 'path' | 'text'
    before: { x?: number; y?: number; points?: Point[] }
    after: { x?: number; y?: number; points?: Point[] }
  }>,
  userId: string
): MoveMultipleCommand => ({
  type: 'MOVE_MULTIPLE',
  timestamp: Date.now(),
  userId,
  elements: elements.map((element) => ({
    id: element.id,
    type: element.type,
    before: element.before.points
      ? { ...element.before, points: [...element.before.points] }
      : { ...element.before },
    after: element.after.points
      ? { ...element.after, points: [...element.after.points] }
      : { ...element.after }
  }))
})

export const createDeleteElementCommand = (
  element: Path | TextElement,
  elementType: 'path' | 'text',
  userId: string
): DeleteElementCommand => ({
  type: 'DELETE_ELEMENT',
  timestamp: Date.now(),
  userId,
  element:
    elementType === 'path' && 'points' in element
      ? { ...element, points: [...element.points] }
      : { ...element },
  elementType
})

export const createDeleteMultipleCommand = (
  elements: Array<{
    element: Path | TextElement
    type: 'path' | 'text'
  }>,
  userId: string
): DeleteMultipleCommand => ({
  type: 'DELETE_MULTIPLE',
  timestamp: Date.now(),
  userId,
  elements: elements.map((element) => ({
    element:
      element.type === 'path' && 'points' in element.element
        ? { ...element.element, points: [...element.element.points] }
        : { ...element.element },
    type: element.type
  }))
})

const isPath = (element: Path | TextElement): element is Path => 'points' in element

export function getInverseCommand(command: Command): Command {
  switch (command.type) {
    case 'CREATE_PATH':
      return {
        type: 'DELETE_ELEMENT',
        timestamp: Date.now(),
        userId: command.userId,
        element: command.element,
        elementType: 'path'
      }
    case 'CREATE_TEXT':
      return {
        type: 'DELETE_ELEMENT',
        timestamp: Date.now(),
        userId: command.userId,
        element: command.element,
        elementType: 'text'
      }
    case 'CREATE_MULTIPLE':
      return {
        type: 'DELETE_MULTIPLE',
        timestamp: Date.now(),
        userId: command.userId,
        elements: command.elements
      }
    case 'UPDATE_TEXT':
      return {
        type: 'UPDATE_TEXT',
        timestamp: Date.now(),
        userId: command.userId,
        elementId: command.elementId,
        before: command.after,
        after: command.before
      }
    case 'MOVE_ELEMENT':
      return {
        ...command,
        timestamp: Date.now(),
        before: command.after,
        after: command.before
      }
    case 'MOVE_MULTIPLE':
      return {
        type: 'MOVE_MULTIPLE',
        timestamp: Date.now(),
        userId: command.userId,
        elements: command.elements.map((element) => ({
          ...element,
          before: element.after,
          after: element.before
        }))
      }
    case 'DELETE_ELEMENT':
      return isPath(command.element)
        ? {
            type: 'CREATE_PATH',
            timestamp: Date.now(),
            userId: command.userId,
            element: command.element
          }
        : {
            type: 'CREATE_TEXT',
            timestamp: Date.now(),
            userId: command.userId,
            element: command.element
          }
    case 'DELETE_MULTIPLE':
      return {
        type: 'CREATE_MULTIPLE',
        timestamp: Date.now(),
        userId: command.userId,
        elements: command.elements
      }
  }
}

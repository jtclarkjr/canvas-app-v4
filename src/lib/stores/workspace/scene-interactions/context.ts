import type {
  ActiveInteraction,
  DiagramConnector,
  DiagramShape,
  ElementSetter,
  Path,
  Point,
  Scene,
  TextElement,
  WorkspaceSceneInteractionsInput
} from './types'

export type SceneCtx = WorkspaceSceneInteractionsInput & {
  getShapesSafe: () => DiagramShape[]
  getConnectorsSafe: () => DiagramConnector[]
  getScenesSafe: () => Scene[]
  setShapesSafe: ElementSetter<DiagramShape>
  setConnectorsSafe: ElementSetter<DiagramConnector>
  setScenesSafe: ElementSetter<Scene>
  activeInteraction: ActiveInteraction | null
  pendingDrag: { elementId: string; startPos: Point } | null
  originalElementPositions: {
    paths: Map<string, Path>
    texts: Map<string, TextElement>
    shapes: Map<string, DiagramShape>
    connectors: Map<string, DiagramConnector>
    scenes: Map<string, Scene>
  }
  lastClickTime: number
  lastClickPos: Point | null
  isDraggingSelection: boolean
  dragStartPos: Point | null
}

export function createSceneCtx(
  config: WorkspaceSceneInteractionsInput
): SceneCtx {
  return {
    ...config,
    getShapesSafe: () => config.getShapes?.() ?? [],
    getConnectorsSafe: () => config.getConnectors?.() ?? [],
    getScenesSafe: () => config.getScenes?.() ?? [],
    setShapesSafe: (next) => {
      config.setShapes?.(next)
    },
    setConnectorsSafe: (next) => {
      config.setConnectors?.(next)
    },
    setScenesSafe: (next) => {
      config.setScenes?.(next)
    },
    activeInteraction: null,
    pendingDrag: null,
    originalElementPositions: {
      paths: new Map(),
      texts: new Map(),
      shapes: new Map(),
      connectors: new Map(),
      scenes: new Map()
    },
    lastClickTime: 0,
    lastClickPos: null,
    isDraggingSelection: false,
    dragStartPos: null
  }
}

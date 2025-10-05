import { pointsToPolygonAttribute, regularPolygon, star } from './geometry'
import type { Slot } from '../schema/types'
import assets from './assets.json' assert { type: 'json' }

export type ShapeId =
  | 'rectangle'
  | 'roundedRectangle'
  | 'ellipse'
  | 'triangle'
  | 'regularPolygon'
  | 'star'
  | 'line'
  | 'arrow'
  | 'heart'
  | 'cloud'
  | 'banner'
  | 'speechBubble'
  | 'flowchart/start'
  | 'flowchart/process'
  | 'flowchart/decision'

export type ShapeCategory =
  | 'basic'
  | 'connectors'
  | 'assets'
  | 'flowchart'

export interface ShapeMetadata {
  id: ShapeId
  options?: Record<string, unknown>
}

export interface ShapeGeometryArgs {
  width: number
  height: number
  slot: Slot
}

export type ShapeGeometry =
  | { type: 'rect'; rx?: number; ry?: number }
  | { type: 'ellipse' }
  | { type: 'polygon'; points: string }
  | { type: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { type: 'asset'; assetKey: keyof typeof assets }

export interface ShapeDefinition {
  id: ShapeId
  label: string
  category: ShapeCategory
  keywords?: string[]
  defaultSize: { width: number; height: number }
  defaults?: Partial<Slot>
  defaultOptions?: ShapeMetadata['options']
  geometry: (args: ShapeGeometryArgs) => ShapeGeometry
}

function getPolygonRadius(width: number, height: number) {
  return Math.min(width, height) / 2
}

export const shapeRegistry: Record<ShapeId, ShapeDefinition> = {
  rectangle: {
    id: 'rectangle',
    label: 'Rectangle',
    category: 'basic',
    defaultSize: { width: 120, height: 120 },
    defaults: {},
    geometry: () => ({ type: 'rect' })
  },
  roundedRectangle: {
    id: 'roundedRectangle',
    label: 'Rounded Rectangle',
    category: 'basic',
    defaultSize: { width: 120, height: 120 },
    defaults: { rx: 16, ry: 16 },
    geometry: ({ slot }) => ({ type: 'rect', rx: slot.rx ?? 16, ry: slot.ry ?? slot.rx ?? 16 })
  },
  ellipse: {
    id: 'ellipse',
    label: 'Ellipse',
    category: 'basic',
    defaultSize: { width: 120, height: 120 },
    geometry: () => ({ type: 'ellipse' })
  },
  triangle: {
    id: 'triangle',
    label: 'Triangle',
    category: 'basic',
    defaultSize: { width: 120, height: 120 },
    defaultOptions: { rotation: -90 },
    geometry: ({ width, height, slot }) => {
      const rotation = Number(slot.shape?.options?.rotation ?? -90)
      const r = getPolygonRadius(width, height)
      const cx = width / 2
      const cy = height / 2
      const points = pointsToPolygonAttribute(regularPolygon(3, cx, cy, r, rotation))
      return { type: 'polygon', points }
    }
  },
  regularPolygon: {
    id: 'regularPolygon',
    label: 'Polygon',
    category: 'basic',
    defaultSize: { width: 120, height: 120 },
    defaultOptions: { sides: 5, rotation: -90 },
    geometry: ({ width, height, slot }) => {
      const sides = Math.max(3, Number(slot.shape?.options?.sides ?? 5))
      const rotation = Number(slot.shape?.options?.rotation ?? -90)
      const r = getPolygonRadius(width, height)
      const cx = width / 2
      const cy = height / 2
      const points = pointsToPolygonAttribute(regularPolygon(sides, cx, cy, r, rotation))
      return { type: 'polygon', points }
    }
  },
  star: {
    id: 'star',
    label: 'Star',
    category: 'basic',
    defaultSize: { width: 140, height: 140 },
    defaultOptions: { points: 5, innerRatio: 0.5, rotation: -90 },
    geometry: ({ width, height, slot }) => {
      const pointCount = Math.max(2, Number(slot.shape?.options?.points ?? 5))
      const innerRatio = Math.max(0.05, Math.min(0.95, Number(slot.shape?.options?.innerRatio ?? 0.5)))
      const rotation = Number(slot.shape?.options?.rotation ?? -90)
      const rOuter = getPolygonRadius(width, height)
      const rInner = rOuter * innerRatio
      const cx = width / 2
      const cy = height / 2
      const points = pointsToPolygonAttribute(star(pointCount, cx, cy, rOuter, rInner, rotation))
      return { type: 'polygon', points }
    }
  },
  line: {
    id: 'line',
    label: 'Line',
    category: 'connectors',
    defaultSize: { width: 160, height: 4 },
    defaults: { fill: 'none' },
    geometry: ({ width, height }) => {
      const y = height / 2
      return { type: 'line', x1: 0, y1: y, x2: width, y2: y }
    }
  },
  arrow: {
    id: 'arrow',
    label: 'Arrow',
    category: 'connectors',
    defaultSize: { width: 160, height: 4 },
    defaults: { fill: 'none', markerEnd: true },
    geometry: ({ width, height }) => {
      const y = height / 2
      return { type: 'line', x1: 0, y1: y, x2: width, y2: y }
    }
  },
  heart: {
    id: 'heart',
    label: 'Heart',
    category: 'assets',
    defaultSize: { width: 140, height: 140 },
    geometry: () => ({ type: 'asset', assetKey: 'heart' })
  },
  cloud: {
    id: 'cloud',
    label: 'Cloud',
    category: 'assets',
    defaultSize: { width: 160, height: 120 },
    geometry: () => ({ type: 'asset', assetKey: 'cloud' })
  },
  banner: {
    id: 'banner',
    label: 'Banner',
    category: 'assets',
    defaultSize: { width: 200, height: 100 },
    geometry: () => ({ type: 'asset', assetKey: 'banner' })
  },
  speechBubble: {
    id: 'speechBubble',
    label: 'Speech Bubble',
    category: 'assets',
    defaultSize: { width: 180, height: 140 },
    geometry: () => ({ type: 'asset', assetKey: 'speechBubble' })
  },
  'flowchart/start': {
    id: 'flowchart/start',
    label: 'Start/End',
    category: 'flowchart',
    defaultSize: { width: 160, height: 100 },
    geometry: () => ({ type: 'asset', assetKey: 'flowchart/start' })
  },
  'flowchart/process': {
    id: 'flowchart/process',
    label: 'Process',
    category: 'flowchart',
    defaultSize: { width: 160, height: 100 },
    geometry: () => ({ type: 'asset', assetKey: 'flowchart/process' })
  },
  'flowchart/decision': {
    id: 'flowchart/decision',
    label: 'Decision',
    category: 'flowchart',
    defaultSize: { width: 160, height: 160 },
    geometry: () => ({ type: 'asset', assetKey: 'flowchart/decision' })
  }
}

export interface ShapeCategoryGroup {
  id: ShapeCategory
  label: string
  shapes: ShapeId[]
}

export const shapeCategories: ShapeCategoryGroup[] = [
  {
    id: 'basic',
    label: 'Basic Shapes',
    shapes: ['rectangle', 'roundedRectangle', 'ellipse', 'triangle', 'regularPolygon', 'star']
  },
  {
    id: 'connectors',
    label: 'Connectors',
    shapes: ['line', 'arrow']
  },
  {
    id: 'assets',
    label: 'Decorative',
    shapes: ['heart', 'cloud', 'banner', 'speechBubble']
  },
  {
    id: 'flowchart',
    label: 'Flowchart',
    shapes: ['flowchart/start', 'flowchart/process', 'flowchart/decision']
  }
]

export type AssetKey = keyof typeof assets

export const shapeAssets: Record<AssetKey, { viewBox: string; d: string }> = assets

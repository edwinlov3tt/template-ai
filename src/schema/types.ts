/**
 * TypeScript types derived from Template JSON Schema
 * These types represent the validated structure of ad templates
 */

export type SlotType = 'image' | 'text' | 'button' | 'shape'
export type ImageFit = 'contain' | 'cover' | 'fill'
export type ContrastMode = 'WCAG' | 'APCA'
export type AccessibilityFallback = 'autoChip' | 'invertText' | 'increaseOverlay'

export interface BaseViewBox {
  /** Base coordinate system [x, y, width, height] */
  0: number
  1: number
  2: number
  3: number
  length: 4
}

export interface CanvasConfig {
  /** Base coordinate system [x, y, width, height] */
  baseViewBox: [number, number, number, number]
  /** Supported aspect ratios (e.g., "1:1", "16:9", "728x90") */
  ratios: string[]
}

export interface TypographyStyle {
  family?: string
  weight?: number
  minSize?: number
  maxSize?: number
  upper?: boolean
}

export interface Tokens {
  /** Color tokens (hex format) */
  palette: Record<string, string>
  /** Typography style definitions */
  typography: Record<string, TypographyStyle>
}

export interface SlotChip {
  fill: string
  radius: number
  padding: number[]
}

export interface SlotOverlay {
  fill: string
  alpha: number
}

export interface Slot {
  name: string
  type: SlotType
  /** Z-index for layering */
  z: number
  /** Image fit mode */
  fit?: ImageFit
  /** Reference to typography token */
  style?: string
  maxLines?: number
  /** Apply background removal */
  removeBg?: boolean
  avoidTextOverlap?: boolean
  chip?: SlotChip
  overlay?: SlotOverlay
  shape?: {
    id: string
    options?: Record<string, unknown>
  }

  // Visual properties (not in schema but used in implementation)
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
  fontSize?: number
  fontWeight?: string | number
  fontFamily?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  content?: string
  rx?: number
  ry?: number
  visible?: boolean
  locked?: boolean
  markerStart?: boolean | string
  markerEnd?: boolean | string

  // Typography properties (Wave 1)
  fontStyle?: 'normal' | 'italic'
  textTransform?: 'none' | 'uppercase' | 'title' | 'sentence'
  letterSpacing?: number
  lineHeight?: number
  anchorBox?: 'auto' | 'fixed'
  autoFit?: boolean
  textColor?: string

  // Effect properties (Wave 1 - SVG Effects Engine)
  shadow?: { dx: number; dy: number; blur: number; color: string; alpha: number }
  lift?: { blur: number; alpha: number }
  neon?: { stroke: number; glow: number; color: string }
  echo?: { count: number; dx: number; dy: number; blur: number; color: string; alpha: number }
  glitch?: { slices: number; amplitude: number; seed?: number; colorA: string; colorB: string }
  curve?: { radius: number }
  imageMask?: { href: string }
  highlight?: { fill: string; padding: [number, number]; rx?: number }
  strokeConfig?: { width: number; color: string; paintOrder?: 'stroke fill' | 'fill stroke' }

  // Transform properties (Wave 1 - Position & Transform Controls)
  rotation?: number      // degrees (-180 to 180)
  flipH?: boolean        // horizontal flip
  flipV?: boolean        // vertical flip

  [key: string]: unknown
}

export interface ConstraintRule {
  /** Equality constraint */
  eq?: string
  /** Inequality constraint */
  ineq?: string
  avoidOverlap?: string[]
  with?: string
  switch?: string
  targets?: string[]
}

export interface Constraints {
  global?: ConstraintRule[]
  byRatio?: Record<string, ConstraintRule[]>
}

export interface ContrastPolicy {
  mode: ContrastMode
  min: number
}

export interface Accessibility {
  contrastPolicy: ContrastPolicy
  fallbacks?: AccessibilityFallback[]
}

export interface Page {
  /** Unique page identifier */
  id: string
  /** Page display name (e.g., "page-1", "page-2") */
  name: string
  /** Slots specific to this page */
  slots: Slot[]
  /** Frame positions by ratio for this page's slots */
  frames: Record<string, Record<string, { x: number; y: number; width: number; height: number; rotation?: number }>>
  /** Background color for this page */
  backgroundColor?: string
}

export interface Template {
  id: string
  version: number
  canvas: CanvasConfig
  tokens: Tokens
  /** Pages array - modern multi-page format */
  pages: Page[]
  constraints: Constraints
  accessibility: Accessibility
  /** Sample content for preview */
  sample?: Record<string, string>
  /** Preserved SVG defs (gradients, clipPaths, masks, patterns) */
  defs?: string

  /** @deprecated Legacy single-page slots - use pages instead */
  slots?: Slot[]
  /** @deprecated Legacy single-page frames - use pages instead */
  frames?: Record<string, Record<string, { x: number; y: number; width: number; height: number }>>
}

import { INode } from 'svgson'
import type { Template, Slot, ConstraintRule } from '../schema/types'

interface SlotGeometry {
  name: string
  type: 'image' | 'text' | 'button' | 'shape'
  geometry: {
    x: number
    y: number
    width: number
    height: number
  }
  attributes: Record<string, string>
}

/**
 * Build template from extracted slot geometries and SVG AST
 * Generates slots, constraints, tokens, and accessibility config
 */
export function buildTemplate(
  slotGeometries: SlotGeometry[],
  viewBox: [number, number, number, number],
  ast: INode,
  defs?: string
): Template {
  const [vbX, vbY, vbWidth, vbHeight] = viewBox

  // Extract color palette from SVG fills/strokes
  const palette = extractPalette(ast)

  // Build slots array with proper z-ordering
  const slots = buildSlots(slotGeometries, ast, viewBox)

  // Generate constraints based on slot positions
  const constraints = generateConstraints(slotGeometries, viewBox)

  // Extract sample text content
  const sample = extractSampleContent(slotGeometries, ast)

  // Build frames from original geometry (for fallback layout)
  const frames = buildFrames(slotGeometries)
  console.log('[buildTemplate] Created frames for', Object.keys(frames['1:1'] || {}).length, 'slots')

  // Create a single page with slots and frames (multi-page structure)
  const pageId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const page = {
    id: pageId,
    name: 'page-1',
    slots,
    frames
  }

  const template: Template = {
    id: 'imported-' + Math.random().toString(36).slice(2, 8),
    version: 1,
    canvas: {
      baseViewBox: viewBox,
      ratios: ['1:1', '4:5', '9:16', '16:9', '300x250', '728x90']
    },
    tokens: {
      palette: {
        brand: palette.brand || '#1FB6FF',
        accent: palette.accent || '#FF7849',
        neutral: palette.neutral || '#111111',
        surface: palette.surface || '#FFFFFF',
        ...palette.additional
      },
      typography: {
        heading: { family: 'Inter', weight: 700, minSize: 28, maxSize: 64 },
        subhead: { family: 'Inter', weight: 500, minSize: 16, maxSize: 28 },
        cta: { family: 'Inter', weight: 700, minSize: 14, maxSize: 20, upper: true }
      }
    },
    pages: [page], // Multi-page structure with single page
    constraints,
    accessibility: {
      contrastPolicy: { mode: 'WCAG', min: 4.5 },
      fallbacks: ['autoChip', 'invertText', 'increaseOverlay']
    },
    sample,
    ...(defs && { defs })
  }

  return template
}

/**
 * Build slots array with proper configuration based on slot type
 */
function buildSlots(slotGeometries: SlotGeometry[], ast: INode, viewBox: [number, number, number, number]): Slot[] {
  const slotMap = new Map<string, SlotGeometry>()
  for (const sg of slotGeometries) {
    slotMap.set(sg.name, sg)
  }

  const slots: Slot[] = []

  // Define slot order and z-index
  const slotOrder: Array<{ name: string; defaultZ: number }> = [
    { name: 'bg', defaultZ: 0 },
    { name: 'subject', defaultZ: 25 },
    { name: 'headline', defaultZ: 20 },
    { name: 'subhead', defaultZ: 20 },
    { name: 'logo', defaultZ: 30 },
    { name: 'cta', defaultZ: 40 }
  ]

  for (const { name, defaultZ } of slotOrder) {
    const sg = slotMap.get(name)
    if (sg) {
      const slot: Slot = {
        name: sg.name,
        type: refineSlotType(sg),
        z: defaultZ
      }

      // Extract visual properties from SVG attributes
      if (sg.attributes.fill && sg.attributes.fill !== 'none') {
        slot.fill = sg.attributes.fill
      }
      if (sg.attributes['font-size']) {
        slot.fontSize = parseFloat(sg.attributes['font-size'])
      }
      if (sg.attributes['font-family']) {
        slot.fontFamily = sg.attributes['font-family']
      }
      if (sg.attributes['font-weight']) {
        slot.fontWeight = sg.attributes['font-weight']
      }
      if (sg.attributes['text-anchor']) {
        const anchor = sg.attributes['text-anchor']
        slot.textAlign = anchor === 'middle' ? 'center' : anchor === 'end' ? 'right' : 'left'
      }
      if (sg.attributes.rx) {
        slot.rx = parseFloat(sg.attributes.rx)
      }
      if (sg.attributes.ry) {
        slot.ry = parseFloat(sg.attributes.ry)
      }

      // Add type-specific properties
      if (sg.type === 'text' || (sg.type === 'button' && name === 'cta')) {
        if (name === 'headline') {
          slot.style = 'heading'
          slot.maxLines = 3
        } else if (name === 'subhead') {
          slot.style = 'subhead'
          slot.maxLines = 3
        }
      }

      if (sg.type === 'button' || name === 'cta') {
        slot.type = 'button'
        const rx = parseFloat(sg.attributes.rx || '0')
        slot.chip = {
          fill: 'neutral',
          radius: rx || 12,
          padding: [12, 16]
        }
      }

      if (sg.type === 'image' || name === 'bg' || name === 'logo' || name === 'subject') {
        slot.type = 'image'
        if (name === 'bg') {
          slot.fit = 'cover'
          slot.overlay = { fill: '#000000', alpha: 0.2 }
        } else if (name === 'logo') {
          slot.fit = 'contain'
        } else if (name === 'subject') {
          slot.fit = 'contain'
          slot.removeBg = true
          slot.avoidTextOverlap = true
        }
      }

      slots.push(slot)
      slotMap.delete(name)
    }
  }

  // Add any remaining slots that weren't in the standard order
  // Assign z-index based on size and type to prevent large backgrounds from covering everything
  let autoZIndex = 10
  for (const sg of slotMap.values()) {
    // Large shapes that cover most of the canvas should be backgrounds (low z-index)
    const isLikelyBackground = sg.geometry.width * sg.geometry.height > (viewBox[2] * viewBox[3] * 0.5)

    const slot: Slot = {
      name: sg.name,
      type: refineSlotType(sg),
      z: isLikelyBackground ? 0 : autoZIndex++
    }

    if (isLikelyBackground) {
      console.log(`[buildSlots] ${sg.name} detected as background (area: ${sg.geometry.width}x${sg.geometry.height})`)
    }

    // Extract visual properties from SVG attributes
    if (sg.attributes.fill && sg.attributes.fill !== 'none') {
      // Handle fill="url(#...)" patterns/gradients with fallback color
      if (sg.attributes.fill.startsWith('url(')) {
        console.warn(`[buildTemplate] Slot "${sg.name}" uses pattern/gradient fill, using fallback color`)
        slot.fill = '#cccccc' // Light gray fallback for patterns
      } else {
        slot.fill = sg.attributes.fill
      }
    }

    // Preserve original SVG path data for Canva imports
    if (sg.attributes.d) {
      (slot as any).d = sg.attributes.d
    }
    if (sg.attributes['font-size']) {
      slot.fontSize = parseFloat(sg.attributes['font-size'])
    }
    if (sg.attributes['font-family']) {
      slot.fontFamily = sg.attributes['font-family']
    }
    if (sg.attributes['font-weight']) {
      slot.fontWeight = sg.attributes['font-weight']
    }
    if (sg.attributes.rx) {
      slot.rx = parseFloat(sg.attributes.rx)
    }
    if (sg.attributes.ry) {
      slot.ry = parseFloat(sg.attributes.ry)
    }
    if (sg.attributes.stroke && sg.attributes.stroke !== 'none') {
      // Store stroke for later (not in schema but useful)
      ;(slot as any).stroke = sg.attributes.stroke
    }

    // For image slots, store href (normalize xlink:href to href for SVG2)
    if (sg.type === 'image') {
      const href = sg.attributes.href || sg.attributes['xlink:href']
      if (href) {
        ;(slot as any).href = href
        // Warn if using data URL (can be large)
        if (href.startsWith('data:') && href.length > 10000) {
          console.warn(`[buildTemplate] Slot "${sg.name}" uses large embedded image (${(href.length / 1024).toFixed(1)}KB)`)
        }
      }
    }

    slots.push(slot)
  }

  return slots
}

/**
 * Refine slot type based on name and attributes
 */
function refineSlotType(sg: SlotGeometry): 'image' | 'text' | 'button' | 'shape' {
  const name = sg.name.toLowerCase()

  if (name.includes('headline') || name.includes('title') || name.includes('subhead') || name.includes('body')) {
    return 'text'
  }
  if (name === 'cta' || name.includes('button')) {
    return 'button'
  }
  if (name === 'bg' || name === 'logo' || name === 'subject' || name.includes('image') || name.includes('photo')) {
    return 'image'
  }

  return sg.type
}

/**
 * Generate constraints based on slot positions
 */
function generateConstraints(
  slotGeometries: SlotGeometry[],
  viewBox: [number, number, number, number]
): { global: ConstraintRule[]; byRatio: Record<string, ConstraintRule[]> } {
  const [vbX, vbY, vbWidth, vbHeight] = viewBox
  const global: ConstraintRule[] = []

  const slotMap = new Map<string, SlotGeometry>()
  for (const sg of slotGeometries) {
    slotMap.set(sg.name, sg)
  }

  const logo = slotMap.get('logo')
  const headline = slotMap.get('headline')
  const subhead = slotMap.get('subhead')
  const cta = slotMap.get('cta')
  const subject = slotMap.get('subject')

  // Logo positioning (typically top-left)
  if (logo) {
    const leftPad = Math.round(logo.geometry.x - vbX)
    const topPad = Math.round(logo.geometry.y - vbY)
    global.push({ eq: `logo.left = canvas.left + ${leftPad}` })
    global.push({ eq: `logo.top = canvas.top + ${topPad}` })
  }

  // Headline below logo
  if (headline && logo) {
    const gap = Math.round(headline.geometry.y - (logo.geometry.y + logo.geometry.height))
    if (gap > 0) {
      global.push({ ineq: `headline.top >= logo.bottom + ${gap}` })
    }
  }

  // Subhead below headline
  if (subhead && headline) {
    const gap = Math.round(subhead.geometry.y - (headline.geometry.y + headline.geometry.height))
    if (gap > 0) {
      global.push({ ineq: `subhead.top >= headline.bottom + ${gap}` })
    }
  }

  // CTA positioning (typically bottom)
  if (cta) {
    const bottomPad = Math.round((vbY + vbHeight) - (cta.geometry.y + cta.geometry.height))
    const leftPad = Math.round(cta.geometry.x - vbX)
    global.push({ eq: `cta.bottom = canvas.bottom - ${bottomPad}` })
    global.push({ ineq: `cta.left >= canvas.left + ${leftPad}` })
  }

  // Avoid overlap with subject image
  if (subject && (headline || subhead || cta)) {
    const textSlots: string[] = []
    if (headline) textSlots.push('headline')
    if (subhead) textSlots.push('subhead')
    if (cta) textSlots.push('cta')
    global.push({ avoidOverlap: textSlots, with: 'subject' })
  }

  // Ratio-specific constraints for ultra-wide banners (728x90, etc.)
  const byRatio: Record<string, ConstraintRule[]> = {
    '728x90': [
      { switch: 'stackHorizontal', targets: ['logo', 'headline', 'cta'] },
      { ineq: 'headline.fontSize <= 36' }
    ],
    '9:16': [
      { switch: 'stackVertical', targets: ['logo', 'headline', 'subhead', 'cta'] }
    ]
  }

  // Only include byRatio if we have subject to constrain for 9:16
  if (subject) {
    byRatio['9:16'].push({ ineq: 'subject.height <= canvas.height * 0.45' })
  }

  return { global, byRatio }
}

/**
 * Build frames object from slot geometries for fallback layout
 */
function buildFrames(slotGeometries: SlotGeometry[]): Record<string, Record<string, { x: number; y: number; width: number; height: number }>> {
  const frames: Record<string, Record<string, { x: number; y: number; width: number; height: number }>> = {
    '1:1': {}
  }

  for (const sg of slotGeometries) {
    frames['1:1'][sg.name] = {
      x: sg.geometry.x,
      y: sg.geometry.y,
      width: sg.geometry.width,
      height: sg.geometry.height
    }
    console.log(`[buildFrames] ${sg.name}: x=${sg.geometry.x}, y=${sg.geometry.y}, w=${sg.geometry.width}, h=${sg.geometry.height}`)

    // Warn if position is (0,0) - likely missing transform handling
    if (sg.geometry.x === 0 && sg.geometry.y === 0 && sg.name !== 'bg') {
      console.warn(`[buildFrames] ${sg.name} is at (0,0) - SVG may use transforms instead of x/y attributes`)
    }
  }

  return frames
}

/**
 * Extract color palette from SVG fills and strokes
 */
function extractPalette(ast: INode): {
  brand?: string
  accent?: string
  neutral?: string
  surface?: string
  additional: Record<string, string>
} {
  const colors = new Set<string>()

  function walk(node: INode) {
    const fill = node.attributes?.fill
    const stroke = node.attributes?.stroke

    if (fill && fill !== 'none' && fill.startsWith('#')) {
      colors.add(fill.toLowerCase())
    }
    if (stroke && stroke !== 'none' && stroke.startsWith('#')) {
      colors.add(stroke.toLowerCase())
    }

    node.children?.forEach(walk)
  }

  walk(ast)

  const colorArray = Array.from(colors)
  const result: { brand?: string; accent?: string; neutral?: string; surface?: string; additional: Record<string, string> } = {
    additional: {}
  }

  // Try to categorize colors
  for (const color of colorArray) {
    const rgb = hexToRgb(color)
    if (!rgb) continue

    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000

    if (brightness < 50 && !result.neutral) {
      result.neutral = color
    } else if (brightness > 200 && !result.surface) {
      result.surface = color
    } else if (!result.brand) {
      result.brand = color
    } else if (!result.accent) {
      result.accent = color
    } else {
      result.additional[`color${Object.keys(result.additional).length + 1}`] = color
    }
  }

  return result
}

/**
 * Extract sample text content from text slots
 */
function extractSampleContent(slotGeometries: SlotGeometry[], ast: INode): Record<string, string> {
  const sample: Record<string, string> = {}

  for (const sg of slotGeometries) {
    if (sg.type === 'text') {
      // Find the text node in AST
      let textContent = ''
      function walk(node: INode) {
        if (node.attributes?.['data-slot'] === sg.name && node.name === 'text') {
          textContent = extractTextContent(node)
        }
        node.children?.forEach(walk)
      }
      walk(ast)

      if (textContent) {
        sample[sg.name] = textContent
      }
    }
  }

  // Defaults if not found
  if (!sample.headline) sample.headline = 'Modern Home For Sale'
  if (!sample.subhead) sample.subhead = 'A lovely 2BR with tons of light.'

  return sample
}

function extractTextContent(node: INode): string {
  let text = ''
  if (node.children) {
    for (const child of node.children) {
      if (child.type === 'text') {
        text += child.value || ''
      } else if (child.name === 'tspan') {
        text += extractTextContent(child)
      }
    }
  }
  return text.trim()
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

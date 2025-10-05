import { parse, INode } from 'svgson'
import type { Template, Slot, SlotType } from '../schema/types'
import { buildTemplate } from './buildTemplate'
import { preloadTemplateFonts } from '../utils/fontLoader'

interface SlotGeometry {
  name: string
  type: SlotType
  geometry: {
    x: number
    y: number
    width: number
    height: number
  }
  attributes: Record<string, string>
}

export interface ImportReport {
  foundSlots: string[]
  warnings: string[]
  optimizationStats?: {
    originalSize: number
    optimizedSize: number
    reduction: string
  }
}

/**
 * Extract geometries using browser DOM - this handles ALL transforms automatically!
 * The browser's SVG engine computes final positions after all transforms are applied.
 */
async function extractGeometriesFromDOM(svgText: string, warnings: string[]): Promise<SlotGeometry[]> {
  // Parse SVG into DOM
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')
  const svgElement = doc.documentElement as unknown as SVGSVGElement

  // Check for parser errors
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    throw new Error('Failed to parse SVG: ' + parserError.textContent)
  }

  // Temporarily add to DOM to get computed styles (required for getBBox)
  const tempContainer = document.createElement('div')
  tempContainer.style.position = 'absolute'
  tempContainer.style.left = '-9999px'
  tempContainer.style.top = '-9999px'
  tempContainer.style.visibility = 'hidden'
  document.body.appendChild(tempContainer)
  tempContainer.appendChild(svgElement)

  const slotGeometries: SlotGeometry[] = []
  let textCounter = 1
  let shapeCounter = 1
  let pathCounter = 1
  let imageCounter = 1

  try {
    // First, try to extract elements with data-slot attributes
    const slottedElements = svgElement.querySelectorAll('[data-slot]')

    if (slottedElements.length > 0) {
      console.log(`[DOM] Found ${slottedElements.length} elements with data-slot attributes`)
      slottedElements.forEach((el) => {
        const slotName = el.getAttribute('data-slot')!
        const bbox = (el as SVGGraphicsElement).getBBox()
        const tagName = el.tagName.toLowerCase()

        slotGeometries.push({
          name: slotName,
          type: inferSlotTypeFromTag(tagName),
          geometry: {
            x: bbox.x,
            y: bbox.y,
            width: bbox.width,
            height: bbox.height
          },
          attributes: extractAttributes(el)
        })
      })
    } else {
      // Auto-detect all renderable elements
      warnings.push('No data-slot attributes found. Auto-detecting elements from SVG...')

      // Strategy: Look for groups first (Canva uses groups for text, icons, etc.)
      // Then fall back to individual elements that aren't in groups
      const processedElements = new Set<Element>()

      // First pass: Find all groups and process them as single units
      const groups = svgElement.querySelectorAll('g')
      console.log(`[DOM] Found ${groups.length} groups`)

      groups.forEach((group) => {
        // Skip defs and already-processed groups
        if (group.closest('defs') || processedElements.has(group)) {
          return
        }

        // Skip groups that are parents of other groups (we want leaf groups)
        const childGroups = group.querySelectorAll('g')
        if (childGroups.length > 0) {
          return
        }

        try {
          const bbox = (group as SVGGraphicsElement).getBBox()

          // Skip tiny groups (artifacts)
          if (bbox.width < 5 || bbox.height < 5) {
            return
          }

          // Detect group type based on content
          const hasText = group.querySelector('text, tspan') !== null
          const hasPaths = group.querySelectorAll('path').length > 0
          const hasImages = group.querySelector('image') !== null

          let slotName = ''
          let slotType: SlotType = 'shape'

          if (hasImages) {
            slotName = `image-${imageCounter++}`
            slotType = 'image'
          } else if (hasText || hasPaths) {
            // Groups with paths are likely text (Canva text-to-path)
            // Groups with actual text elements are also text
            const aspectRatio = bbox.width / bbox.height
            const isLikelyText = aspectRatio > 1.5 || (hasPaths && bbox.height < 150)

            if (isLikelyText || hasText) {
              slotName = `text-${textCounter++}`
              slotType = 'text'
            } else {
              slotName = `shape-${shapeCounter++}`
              slotType = 'shape'
            }
          } else {
            slotName = `shape-${shapeCounter++}`
            slotType = 'shape'
          }

          slotGeometries.push({
            name: slotName,
            type: slotType,
            geometry: {
              x: bbox.x,
              y: bbox.y,
              width: bbox.width,
              height: bbox.height
            },
            attributes: extractAttributes(group)
          })

          console.log(`[DOM] ${slotName} (group): x=${bbox.x.toFixed(2)}, y=${bbox.y.toFixed(2)}, w=${bbox.width.toFixed(2)}, h=${bbox.height.toFixed(2)}`)

          // Mark all children as processed
          const allChildren = group.querySelectorAll('*')
          allChildren.forEach(child => processedElements.add(child))
          processedElements.add(group)
        } catch (err) {
          console.warn(`[DOM] Failed to extract bbox for group:`, err)
        }
      })

      // Second pass: Process individual elements not in groups
      const allElements = svgElement.querySelectorAll('rect, circle, ellipse, path, polygon, polyline, text, image')
      console.log(`[DOM] Processing ${allElements.length} individual elements`)

      allElements.forEach((el) => {
        try {
          // Skip if inside defs, already processed, or part of a group we already handled
          if (el.closest('defs') || processedElements.has(el) || el.closest('g:not(:root)')) {
            return
          }

          const bbox = (el as SVGGraphicsElement).getBBox()

          // Skip tiny elements (likely artifacts)
          if (bbox.width < 1 || bbox.height < 1) {
            return
          }

          const tagName = el.tagName.toLowerCase()
          let slotName = ''
          let slotType: SlotType = 'shape'

          // Determine slot name and type based on element type
          if (tagName === 'text') {
            slotName = `text-${textCounter++}`
            slotType = 'text'
          } else if (tagName === 'image') {
            slotName = `image-${imageCounter++}`
            slotType = 'image'
          } else if (tagName === 'rect') {
            // Large rects are likely backgrounds
            const viewBox = svgElement.viewBox.baseVal
            const isBackground = bbox.width > viewBox.width * 0.5 && bbox.height > viewBox.height * 0.5
            slotName = `shape-${shapeCounter++}`
            slotType = 'shape'
          } else if (tagName === 'path') {
            // Paths can be text (Canva converts text to paths) or shapes
            const aspectRatio = bbox.width / bbox.height
            const isLikelyText = aspectRatio > 2 && bbox.height < 100

            if (isLikelyText) {
              slotName = `text-${textCounter++}`
              slotType = 'text'
            } else {
              slotName = `path-${pathCounter++}`
              slotType = 'shape'
            }
          } else {
            slotName = `shape-${shapeCounter++}`
            slotType = 'shape'
          }

          slotGeometries.push({
            name: slotName,
            type: slotType,
            geometry: {
              x: bbox.x,
              y: bbox.y,
              width: bbox.width,
              height: bbox.height
            },
            attributes: extractAttributes(el)
          })

          console.log(`[DOM] ${slotName}: x=${bbox.x.toFixed(2)}, y=${bbox.y.toFixed(2)}, w=${bbox.width.toFixed(2)}, h=${bbox.height.toFixed(2)}`)
        } catch (err) {
          console.warn(`[DOM] Failed to extract bbox for ${el.tagName}:`, err)
        }
      })

      warnings.push(`Auto-detected ${slotGeometries.length} elements using browser DOM. Add data-slot attributes for precise control.`)
    }
  } finally {
    // Clean up temp DOM element
    document.body.removeChild(tempContainer)
  }

  return slotGeometries
}

/**
 * Extract relevant attributes from SVG element
 */
function extractAttributes(el: Element): Record<string, string> {
  const attrs: Record<string, string> = {}

  // Common attributes to preserve
  const attrNames = ['fill', 'stroke', 'stroke-width', 'font-size', 'font-family', 'font-weight',
                     'text-anchor', 'rx', 'ry', 'd', 'href', 'xlink:href', 'transform']

  attrNames.forEach(name => {
    const value = el.getAttribute(name)
    if (value) {
      attrs[name] = value
    }
  })

  return attrs
}

/**
 * Infer slot type from SVG tag name
 */
function inferSlotTypeFromTag(tagName: string): SlotType {
  switch (tagName) {
    case 'text':
    case 'tspan':
      return 'text'
    case 'image':
      return 'image'
    case 'rect':
    case 'circle':
    case 'ellipse':
    case 'path':
    case 'polygon':
    case 'polyline':
      return 'shape'
    default:
      return 'shape'
  }
}

export async function importSvgToTemplate(svgText: string) {
  const warnings: string[] = []
  const originalSize = svgText.length

  // Warn about large files
  const sizeInMB = originalSize / (1024 * 1024)
  if (sizeInMB > 10) {
    warnings.push(`WARNING: Large file detected (${sizeInMB.toFixed(1)}MB). For best performance, export SVGs from Canva without embedded images.`)
  } else if (sizeInMB > 1) {
    warnings.push(`File size: ${sizeInMB.toFixed(2)}MB. Consider using placeholder rectangles instead of embedded images.`)
  }

  // Skip SVGO optimization in browser (causes Node.js module errors)
  // SVGO should only be used server-side, not in browser
  const data = svgText
  const optimizedSize = data.length
  const reduction = '0.0'

  // NEW: Use browser DOM to extract geometry with computed transforms
  const slotGeometries = await extractGeometriesFromDOM(data, warnings)

  // Step 2: svgson parse to AST
  const ast = await parse(data)
  const viewBox = getViewBox(ast)

  if (!viewBox) {
    warnings.push('No viewBox found in SVG. Using default [0,0,1080,1080].')
  }

  // Note: slotGeometries already extracted via DOM above
  console.log(`[importSvg] Extracted ${slotGeometries.length} elements using browser DOM with computed transforms`)

  // Check for complex SVG features that may not round-trip well
  let hasFilters = false
  let hasMasks = false
  let hasClipPaths = false
  let hasXlinkHref = false
  walk(ast, (node) => {
    if (node.name === 'filter') hasFilters = true
    if (node.name === 'mask') hasMasks = true
    if (node.name === 'clipPath') hasClipPaths = true
    if (node.attributes?.['xlink:href']) hasXlinkHref = true
  })
  if (hasFilters) warnings.push('WARNING: SVG contains <filter> elements which may not render correctly in canvas.')
  if (hasMasks) warnings.push('WARNING: SVG contains <mask> elements which may have limited support.')
  if (hasClipPaths) warnings.push('WARNING: SVG contains <clipPath> elements which may have limited support.')
  if (hasXlinkHref) warnings.push('WARNING: SVG uses deprecated xlink:href. Use href instead (SVG2 standard).')

  // Step 4: Extract defs for gradients, clipPaths, masks, patterns
  const defs = extractDefs(ast)
  if (defs) {
    console.log('[importSvg] Extracted SVG defs for gradients/clipPaths/masks/patterns')
  }

  // Step 5: Seed slots/frames + default constraints
  const template = buildTemplate(slotGeometries, viewBox || [0, 0, 1080, 1080], ast, defs)

  // Step 5: Preload fonts used in template
  try {
    await preloadTemplateFonts(template)
    const allSlots = template.pages.flatMap(page => page.slots)
    const loadedFonts = allSlots
      .filter((s: any) => s.fontFamily)
      .map((s: any) => s.fontFamily)
      .filter((f: string, i: number, arr: string[]) => arr.indexOf(f) === i)

    if (loadedFonts.length > 0) {
      warnings.push(`SUCCESS: Loaded ${loadedFonts.length} font(s) from Google Fonts: ${loadedFonts.join(', ')}`)
    }
  } catch (error) {
    warnings.push('WARNING: Failed to preload some fonts. Text may fall back to system fonts.')
    console.error('[FontLoader]', error)
  }

  const report: ImportReport = {
    foundSlots: slotGeometries.map(s => s.name),
    warnings,
    optimizationStats: {
      originalSize,
      optimizedSize,
      reduction: `${reduction}%`
    }
  }

  return { template, report }
}

// helpers

function getViewBox(ast: INode): [number,number,number,number] | null {
  const vb = ast.attributes?.viewBox
  if (!vb) return null
  const parts = vb.split(/\s+/).map(Number)
  if (parts.length === 4 && parts.every(n => Number.isFinite(n))) return parts as any
  return null
}

function walk(n: INode, visit: (n: INode) => void) {
  visit(n)
  n.children?.forEach((c: INode) => walk(c, visit))
}

/**
 * Parse transform attribute to extract translate values
 * Supports: translate(x, y), translate(x y), matrix(a b c d e f)
 */
function parseTransform(transformStr: string): { x: number; y: number } {
  if (!transformStr) return { x: 0, y: 0 }

  // Try translate(x, y) or translate(x y)
  const translateMatch = transformStr.match(/translate\s*\(\s*([^,\s)]+)[\s,]+([^)]+)\)/)
  if (translateMatch) {
    return {
      x: parseFloat(translateMatch[1]) || 0,
      y: parseFloat(translateMatch[2]) || 0
    }
  }

  // Try matrix(a b c d e f) - e and f are translation
  const matrixMatch = transformStr.match(/matrix\s*\(\s*([^,\s]+)[\s,]+([^,\s]+)[\s,]+([^,\s]+)[\s,]+([^,\s]+)[\s,]+([^,\s)]+)[\s,]+([^)]+)\)/)
  if (matrixMatch) {
    return {
      x: parseFloat(matrixMatch[5]) || 0,
      y: parseFloat(matrixMatch[6]) || 0
    }
  }

  return { x: 0, y: 0 }
}

/**
 * Compute bounding box from SVG path data
 * Handles M, L, H, V, C, S, Q, T, A commands
 */
function pathBoundingBox(d: string): { x: number; y: number; width: number; height: number } | null {
  if (!d) return null

  let minX = Infinity, minY = Infinity
  let maxX = -Infinity, maxY = -Infinity
  let currentX = 0, currentY = 0

  // Simple command parser - handles absolute commands only for speed
  const commands = d.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || []

  for (const cmd of commands) {
    const type = cmd[0].toUpperCase()
    const args = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n))

    switch (type) {
      case 'M': // moveto
      case 'L': // lineto
        if (args.length >= 2) {
          currentX = args[0]
          currentY = args[1]
          minX = Math.min(minX, currentX)
          maxX = Math.max(maxX, currentX)
          minY = Math.min(minY, currentY)
          maxY = Math.max(maxY, currentY)
        }
        break
      case 'H': // horizontal lineto
        if (args.length >= 1) {
          currentX = args[0]
          minX = Math.min(minX, currentX)
          maxX = Math.max(maxX, currentX)
        }
        break
      case 'V': // vertical lineto
        if (args.length >= 1) {
          currentY = args[0]
          minY = Math.min(minY, currentY)
          maxY = Math.max(maxY, currentY)
        }
        break
      case 'C': // cubic bezier
        for (let i = 0; i < args.length; i += 6) {
          if (i + 5 < args.length) {
            const x1 = args[i], y1 = args[i + 1]
            const x2 = args[i + 2], y2 = args[i + 3]
            currentX = args[i + 4]
            currentY = args[i + 5]
            minX = Math.min(minX, x1, x2, currentX)
            maxX = Math.max(maxX, x1, x2, currentX)
            minY = Math.min(minY, y1, y2, currentY)
            maxY = Math.max(maxY, y1, y2, currentY)
          }
        }
        break
      case 'Q': // quadratic bezier
        for (let i = 0; i < args.length; i += 4) {
          if (i + 3 < args.length) {
            const x1 = args[i], y1 = args[i + 1]
            currentX = args[i + 2]
            currentY = args[i + 3]
            minX = Math.min(minX, x1, currentX)
            maxX = Math.max(maxX, x1, currentX)
            minY = Math.min(minY, y1, currentY)
            maxY = Math.max(maxY, y1, currentY)
          }
        }
        break
    }
  }

  if (!isFinite(minX) || !isFinite(minY)) return null

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * Compute bounding box of a group by combining children bounds
 */
function groupBoundingBox(node: INode, accumulatedTransformX: number = 0, accumulatedTransformY: number = 0): { x: number; y: number; width: number; height: number } | null {
  if (!node.children || node.children.length === 0) return null

  // Apply this node's transform
  const transform = parseTransform(node.attributes?.transform || '')
  const transformX = accumulatedTransformX + transform.x
  const transformY = accumulatedTransformY + transform.y

  let minX = Infinity, minY = Infinity
  let maxX = -Infinity, maxY = -Infinity

  for (const child of node.children) {
    const childBox = extractGeometry(child, transformX, transformY)
    if (childBox) {
      minX = Math.min(minX, childBox.x)
      maxX = Math.max(maxX, childBox.x + childBox.width)
      minY = Math.min(minY, childBox.y)
      maxY = Math.max(maxY, childBox.y + childBox.height)
    }
  }

  if (!isFinite(minX) || !isFinite(minY)) return null

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * Extract geometry from SVG element node
 * Handles rect, circle, ellipse, text, image, path, and group elements
 */
function extractGeometry(node: INode, transformX: number = 0, transformY: number = 0): { x: number; y: number; width: number; height: number } | null {
  const attrs = node.attributes || {}

  // Apply this node's transform if present
  const nodeTransform = parseTransform(attrs.transform || '')
  const totalTransformX = transformX + nodeTransform.x
  const totalTransformY = transformY + nodeTransform.y

  switch (node.name) {
    case 'rect':
    case 'image': {
      const x = parseFloat(attrs.x || '0') + totalTransformX
      const y = parseFloat(attrs.y || '0') + totalTransformY
      const width = parseFloat(attrs.width || '0')
      const height = parseFloat(attrs.height || '0')
      if (width > 0 && height > 0) return { x, y, width, height }
      break
    }

    case 'circle': {
      const cx = parseFloat(attrs.cx || '0') + totalTransformX
      const cy = parseFloat(attrs.cy || '0') + totalTransformY
      const r = parseFloat(attrs.r || '0')
      if (r > 0) {
        return { x: cx - r, y: cy - r, width: r * 2, height: r * 2 }
      }
      break
    }

    case 'ellipse': {
      const cx = parseFloat(attrs.cx || '0') + totalTransformX
      const cy = parseFloat(attrs.cy || '0') + totalTransformY
      const rx = parseFloat(attrs.rx || '0')
      const ry = parseFloat(attrs.ry || '0')
      if (rx > 0 && ry > 0) {
        return { x: cx - rx, y: cy - ry, width: rx * 2, height: ry * 2 }
      }
      break
    }

    case 'text': {
      const x = parseFloat(attrs.x || '0') + totalTransformX
      const y = parseFloat(attrs.y || '0') + totalTransformY
      const fontSize = parseFloat(attrs['font-size'] || '16')
      // Estimate text dimensions (crude approximation)
      const textContent = getTextContent(node)
      const width = textContent.length * fontSize * 0.6
      const height = fontSize * 1.2
      return { x, y: y - height, width, height }
    }

    case 'path': {
      // Compute bounding box from path data
      const bbox = pathBoundingBox(attrs.d || '')
      if (bbox) {
        return {
          x: bbox.x + totalTransformX,
          y: bbox.y + totalTransformY,
          width: bbox.width,
          height: bbox.height
        }
      }
      return null
    }

    case 'g':
    case 'svg': {
      // Compute bounding box from children
      return groupBoundingBox(node, transformX, transformY)
    }

    default:
      return null
  }

  return null
}

/**
 * Infer slot type from SVG element
 */
function inferSlotType(node: INode): SlotType {
  switch (node.name) {
    case 'text':
      return 'text'
    case 'image':
      return 'image'
    case 'rect':
      // Check if it looks like a button (has text nearby or specific attributes)
      if (node.attributes?.['data-type'] === 'button') {
        return 'button'
      }
      // Otherwise could be bg, logo, or shape
      return 'shape'
    case 'circle':
    case 'ellipse':
    case 'path':
    case 'polygon':
    case 'polyline':
      return 'shape'
    default:
      return 'image'
  }
}

/**
 * Extract text content from text node and its children
 */
function getTextContent(node: INode): string {
  if (node.name === 'text' || node.name === 'tspan') {
    let text = ''
    if (node.children) {
      for (const child of node.children) {
        if (child.type === 'text') {
          text += child.value || ''
        } else if (child.name === 'tspan') {
          text += getTextContent(child)
        }
      }
    }
    return text
  }
  return ''
}

/**
 * Extract defs section from SVG AST
 * Returns serialized defs content (without <defs> wrapper)
 */
function extractDefs(ast: INode): string | undefined {
  let defsContent = ''

  function findDefs(node: INode) {
    if (node.name === 'defs' && node.children) {
      // Serialize all children of <defs>
      for (const child of node.children) {
        defsContent += serializeNode(child)
      }
    }
    node.children?.forEach(findDefs)
  }

  findDefs(ast)
  return defsContent || undefined
}

/**
 * Serialize INode back to SVG string
 */
function serializeNode(node: INode): string {
  if (node.type === 'text') {
    return node.value || ''
  }

  // Build opening tag with attributes
  let tag = `<${node.name}`
  if (node.attributes) {
    for (const [key, value] of Object.entries(node.attributes)) {
      tag += ` ${key}="${value}"`
    }
  }

  // Self-closing or with children
  if (!node.children || node.children.length === 0) {
    tag += ' />'
  } else {
    tag += '>'
    for (const child of node.children) {
      tag += serializeNode(child)
    }
    tag += `</${node.name}>`
  }

  return tag
}

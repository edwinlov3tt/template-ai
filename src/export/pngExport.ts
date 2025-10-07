/**
 * PNG export utilities for rendering templates to image files
 * Uses Canvg to render SVG to Canvas for accurate clipPath/mask/gradient support
 */

import { Canvg } from 'canvg'
import type { Template } from '../schema/types'
import { convertSvgImagesToDataUris, hasExternalImages } from './imageUtils'

export interface ExportOptions {
  width: number
  height: number
  format?: 'png' | 'jpeg'
  quality?: number // 0-1 for jpeg
  multiplier?: number // Scale factor for higher resolution (e.g., 2 for @2x)
  backgroundColor?: string
}

/**
 * Export SVG string to PNG using Canvg
 * This accurately renders clipPath, masks, gradients, and patterns
 */
export async function exportSvgToPng(
  svgString: string,
  width: number,
  height: number,
  options: Partial<ExportOptions> = {}
): Promise<string> {
  const {
    format = 'png',
    quality = 1,
    multiplier = 1,
    backgroundColor = '#FFFFFF'
  } = options

  console.log('[exportSvgToPng] Starting export with:', { width, height, format, quality, multiplier })
  console.log('[exportSvgToPng] SVG string length:', svgString.length)
  console.log('[exportSvgToPng] SVG preview (first 500 chars):', svgString.substring(0, 500))

  // Convert external images to data URIs to avoid CORS issues
  const hasExternal = hasExternalImages(svgString)
  if (hasExternal) {
    console.log('[exportSvgToPng] Converting external images to data URIs...')
    svgString = await convertSvgImagesToDataUris(svgString)
    console.log('[exportSvgToPng] Image conversion complete')
  }

  // Create canvas
  const canvas = document.createElement('canvas')
  canvas.width = width * multiplier
  canvas.height = height * multiplier

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get 2D context')
  }

  // Fill background
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Render SVG to canvas using Canvg
  try {
    const v = await Canvg.from(ctx, svgString, {
      ignoreMouse: true,
      ignoreAnimation: true,
      ignoreClear: true,
      // CRITICAL: Don't ignore dimensions - use SVG's width/height exactly
      ignoreDimensions: false,
      // Position at top-left corner of canvas (no offset)
      offsetX: 0,
      offsetY: 0,
      // Enable CORS for cross-origin images
      anonymousCrossOrigin: true,
      // Custom image loader to handle CORS
      createImage: (src: string) => {
        const img = new Image()
        // Set crossOrigin BEFORE setting src to enable CORS
        img.crossOrigin = 'anonymous'
        img.src = src
        return img
      }
    })

    console.log('[exportSvgToPng] Canvg instance created, rendering...')
    console.log('[exportSvgToPng] Canvas dimensions:', canvas.width, 'x', canvas.height)
    console.log('[exportSvgToPng] About to render SVG...')

    // Render the entire SVG to the canvas at exact dimensions
    await v.render()

    console.log('[exportSvgToPng] Render complete!')
    console.log('[exportSvgToPng] SVG should now cover full canvas without cropping')
  } catch (error) {
    console.error('[exportSvgToPng] Canvg render error:', error)
    throw error
  }

  // Export to data URL
  const dataUrl = canvas.toDataURL(`image/${format}`, quality)
  console.log('[exportSvgToPng] DataURL generated, length:', dataUrl.length)

  return dataUrl
}

/**
 * Export template to PNG data URL
 * Requires the SVG element from the DOM
 */
export async function exportToPng(
  svgElement: SVGSVGElement,
  options: ExportOptions
): Promise<string> {
  console.log('[exportToPng] SVG element:', svgElement)
  console.log('[exportToPng] viewBox:', svgElement.getAttribute('viewBox'))
  console.log('[exportToPng] width:', svgElement.getAttribute('width'))
  console.log('[exportToPng] height:', svgElement.getAttribute('height'))

  // Clone the SVG to avoid modifying the original
  const svgClone = svgElement.cloneNode(true) as SVGSVGElement

  // Get the original viewBox and dimensions
  const originalViewBox = svgElement.getAttribute('viewBox')
  const originalWidth = svgElement.getAttribute('width')
  const originalHeight = svgElement.getAttribute('height')

  console.log('[exportToPng] Original SVG:', {
    viewBox: originalViewBox,
    width: originalWidth,
    height: originalHeight
  })

  // CRITICAL FIX: Set viewBox to match the ACTUAL canvas dimensions
  // This prevents distortion when exporting different aspect ratios
  // The content is positioned in canvas coordinate space, not baseViewBox space
  const exportViewBoxWidth = options.width
  const exportViewBoxHeight = options.height
  const exportRenderWidth = options.width * options.multiplier
  const exportRenderHeight = options.height * options.multiplier

  console.log('[exportToPng] Export config:', {
    viewBox: `0 0 ${exportViewBoxWidth} ${exportViewBoxHeight}`,
    renderDimensions: `${exportRenderWidth}x${exportRenderHeight}`,
    multiplier: options.multiplier
  })

  // Set the viewBox to match canvas dimensions (not baseViewBox)
  svgClone.setAttribute('viewBox', `0 0 ${exportViewBoxWidth} ${exportViewBoxHeight}`)

  // Set render dimensions (multiplied for high-res export)
  svgClone.setAttribute('width', String(exportRenderWidth))
  svgClone.setAttribute('height', String(exportRenderHeight))

  // CRITICAL: Remove preserveAspectRatio='none' - it distorts the viewBox
  // Use default behavior (xMidYMid meet) or explicitly set to avoid distortion
  svgClone.removeAttribute('preserveAspectRatio')

  // Serialize SVG to string
  const serializer = new XMLSerializer()
  let svgString = serializer.serializeToString(svgClone)

  console.log('[exportToPng] Serialized SVG length:', svgString.length)

  // Ensure xmlns attributes
  if (!svgString.includes('xmlns=')) {
    svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  }
  if (!svgString.includes('xmlns:xlink=')) {
    svgString = svgString.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"')
  }

  // Use the multiplied dimensions directly since we already set them on the SVG
  return exportSvgToPng(svgString, options.width * options.multiplier, options.height * options.multiplier, {
    ...options,
    multiplier: 1 // Already applied to SVG dimensions
  })
}

/**
 * Download PNG file
 */
export function downloadPng(dataUrl: string, filename: string = 'template.png') {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export SVG element and trigger download
 */
export async function exportAndDownload(
  svgElement: SVGSVGElement,
  options: ExportOptions,
  filename?: string
): Promise<void> {
  const dataUrl = await exportToPng(svgElement, options)
  const name = filename || `template-${options.width}x${options.height}.png`
  downloadPng(dataUrl, name)
}

/**
 * Export as Blob (for more flexible handling)
 */
export async function exportToBlob(
  svgElement: SVGSVGElement,
  options: ExportOptions
): Promise<Blob> {
  const dataUrl = await exportToPng(svgElement, options)

  // Convert data URL to Blob
  const response = await fetch(dataUrl)
  return response.blob()
}

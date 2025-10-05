/**
 * PNG export utilities for rendering templates to image files
 * Uses Canvg to render SVG to Canvas for accurate clipPath/mask/gradient support
 */

import { Canvg } from 'canvg'
import type { Template } from '../schema/types'

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
  const v = await Canvg.from(ctx, svgString, {
    scaleWidth: canvas.width,
    scaleHeight: canvas.height
  })

  await v.render()

  // Export to data URL
  return canvas.toDataURL(`image/${format}`, quality)
}

/**
 * Export template to PNG data URL
 * Requires the SVG element from the DOM
 */
export async function exportToPng(
  svgElement: SVGSVGElement,
  options: ExportOptions
): Promise<string> {
  // Serialize SVG to string
  const serializer = new XMLSerializer()
  let svgString = serializer.serializeToString(svgElement)

  // Ensure xmlns attributes
  if (!svgString.includes('xmlns=')) {
    svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  }
  if (!svgString.includes('xmlns:xlink=')) {
    svgString = svgString.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"')
  }

  return exportSvgToPng(svgString, options.width, options.height, options)
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

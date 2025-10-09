/**
 * Blob export utilities for iframe embedding
 * Exports templates to various formats and returns results as blobs or data URLs
 * for transmission via postMessage
 */

import { exportToBlob as exportPngToBlob, type ExportOptions } from './pngExport'
import { exportSVG } from './svgExport'
import type { ExportFormat } from '../embed/messageProtocol'

export interface BlobExportOptions {
  format: ExportFormat
  width: number
  height: number
  quality?: number
  multiplier?: number
}

export interface ExportResult {
  dataUrl?: string
  svgString?: string
  blob?: Blob
  format: ExportFormat
  dimensions: { w: number; h: number }
}

/**
 * Export SVG element to specified format
 * Returns data URL or SVG string suitable for postMessage
 */
export async function exportForEmbed(
  svgElement: SVGSVGElement,
  options: BlobExportOptions
): Promise<ExportResult> {
  const { format, width, height, quality = 1, multiplier = 1 } = options

  console.log('[blobExport] Exporting:', { format, width, height, quality, multiplier })

  switch (format) {
    case 'png':
    case 'jpeg': {
      const exportOptions: ExportOptions = {
        width,
        height,
        format,
        quality,
        multiplier
      }

      const blob = await exportPngToBlob(svgElement, exportOptions)
      const dataUrl = await blobToDataUrl(blob)

      return {
        dataUrl,
        blob,
        format,
        dimensions: { w: width, h: height }
      }
    }

    case 'svg': {
      const svgString = exportSVG(svgElement)

      // Also create blob for consistency
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const dataUrl = await blobToDataUrl(blob)

      return {
        dataUrl,
        svgString,
        blob,
        format,
        dimensions: { w: width, h: height }
      }
    }

    case 'json': {
      // JSON export is handled separately (just template data)
      // This shouldn't be called for JSON format
      throw new Error('JSON format should be handled by template serialization, not visual export')
    }

    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

/**
 * Export multiple formats in one call
 * Useful for returning both PNG and thumbnail
 */
export async function exportMultipleFormats(
  svgElement: SVGSVGElement,
  formats: Array<{ format: ExportFormat; width: number; height: number; quality?: number; multiplier?: number }>
): Promise<Record<string, ExportResult>> {
  const results: Record<string, ExportResult> = {}

  for (const options of formats) {
    const key = `${options.format}_${options.width}x${options.height}`
    results[key] = await exportForEmbed(svgElement, options)
  }

  return results
}

/**
 * Create a thumbnail export
 */
export async function exportThumbnail(
  svgElement: SVGSVGElement,
  maxDimension: number = 200
): Promise<ExportResult> {
  // Get original dimensions
  const viewBox = svgElement.viewBox.baseVal
  const originalWidth = viewBox.width
  const originalHeight = viewBox.height

  // Calculate thumbnail dimensions maintaining aspect ratio
  let thumbWidth = originalWidth
  let thumbHeight = originalHeight

  if (originalWidth > originalHeight) {
    thumbWidth = maxDimension
    thumbHeight = Math.round((maxDimension / originalWidth) * originalHeight)
  } else {
    thumbHeight = maxDimension
    thumbWidth = Math.round((maxDimension / originalHeight) * originalWidth)
  }

  return exportForEmbed(svgElement, {
    format: 'jpeg',
    width: thumbWidth,
    height: thumbHeight,
    quality: 0.8,
    multiplier: 1
  })
}

/**
 * Helper: Convert Blob to data URL
 */
async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Helper: Convert data URL to Blob
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  return response.blob()
}

/**
 * Helper: Get blob URL (object URL)
 * Remember to revoke with URL.revokeObjectURL() when done
 */
export function getBlobUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}

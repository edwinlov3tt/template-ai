// src/workers/svgImport.worker.ts
import * as Comlink from 'comlink'
import { optimize, type Config } from 'svgo'

export interface SvgImportResult {
  optimizedSvg: string
  warnings: string[]
  stats: {
    originalSize: number
    optimizedSize: number
    reductionPercent: number
  }
}

/**
 * SVGO configuration with viewBox preserved and dimensions removed
 */
const svgoConfig: Config = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // CRITICAL: Keep viewBox (task requirement)
          removeViewBox: false,
        },
      },
    },
    // CRITICAL: Remove width/height attributes (task requirement)
    // This must be added as a separate plugin, not in preset-default overrides
    'removeDimensions',
  ],
}

/**
 * Detect large embedded data URIs and generate warnings
 * Threshold: 50KB (configurable)
 */
function detectLargeDataURIs(svg: string, threshold = 50 * 1024): string[] {
  const warnings: string[] = []

  // Match data URIs in href, xlink:href, src attributes
  const dataUriRegex = /(href|xlink:href|src)=["']data:([^"']+)["']/gi
  let match: RegExpExecArray | null

  while ((match = dataUriRegex.exec(svg)) !== null) {
    const fullDataUri = match[2]
    const sizeInBytes = fullDataUri.length

    if (sizeInBytes > threshold) {
      const sizeInKB = (sizeInBytes / 1024).toFixed(1)
      warnings.push(
        `Large embedded image detected (${sizeInKB}KB). Consider externalizing to improve performance and reduce file size.`
      )
    }
  }

  return warnings
}

/**
 * Normalize deprecated xlink:href to modern href attribute
 * SVG2 standard uses href, not xlink:href
 */
function normalizeXlinkHref(svg: string): string {
  // Replace xlink:href with href (SVG2 standard)
  // Also remove xmlns:xlink if no other xlink attributes remain
  let normalized = svg.replace(/xlink:href=/g, 'href=')

  // Check if any other xlink: attributes remain
  const hasOtherXlinkAttrs = /xlink:[a-z]+=/i.test(normalized)

  // Remove xmlns:xlink declaration if no other xlink attributes
  if (!hasOtherXlinkAttrs) {
    normalized = normalized.replace(/\s*xmlns:xlink=["'][^"']*["']/g, '')
  }

  return normalized
}

/**
 * Process SVG: optimize with SVGO, normalize hrefs, detect large data URIs
 * This runs in a Web Worker, so NO DOM APIs allowed
 */
async function processSvg(svgText: string): Promise<SvgImportResult> {
  const warnings: string[] = []
  const originalSize = svgText.length

  // Step 1: Optimize with SVGO (multipass, preserves viewBox, removes dimensions)
  let optimized: string
  try {
    const result = optimize(svgText, svgoConfig)
    optimized = result.data
  } catch (error) {
    warnings.push(`SVGO optimization failed: ${error instanceof Error ? error.message : String(error)}`)
    optimized = svgText // Fall back to original
  }

  // Step 2: Normalize xlink:href → href (SVG2 standard)
  const xlinkCount = (optimized.match(/xlink:href=/g) || []).length
  if (xlinkCount > 0) {
    optimized = normalizeXlinkHref(optimized)
    warnings.push(`Normalized ${xlinkCount} deprecated xlink:href attribute(s) to modern href (SVG2 standard)`)
  }

  // Step 3: Detect large embedded data URIs (suggest externalization)
  const dataUriWarnings = detectLargeDataURIs(optimized, 50 * 1024)
  warnings.push(...dataUriWarnings)

  // Calculate size reduction
  const optimizedSize = optimized.length
  const reductionPercent = ((originalSize - optimizedSize) / originalSize) * 100

  // Log stats (only in development, not production)
  if (import.meta.env.DEV) {
    console.log('[SVG Worker] Optimization complete:', {
      originalSize: `${(originalSize / 1024).toFixed(2)}KB`,
      optimizedSize: `${(optimizedSize / 1024).toFixed(2)}KB`,
      reduction: `${reductionPercent.toFixed(1)}%`,
      warnings: warnings.length,
    })
  }

  return {
    optimizedSvg: optimized,
    warnings,
    stats: {
      originalSize,
      optimizedSize,
      reductionPercent: Math.max(0, reductionPercent), // Never negative
    },
  }
}

// API exposed to main thread via Comlink
const api = {
  processSvg,
}

Comlink.expose(api)

// Export types for main thread usage
export type SvgImportWorker = typeof api

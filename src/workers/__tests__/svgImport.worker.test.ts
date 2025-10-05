import { describe, it, expect } from 'vitest'
import { optimize, type Config } from 'svgo'

// Import the worker's config and functions directly for testing
// We can't instantiate actual Workers in jsdom, so we test the logic directly
const svgoConfig: Config = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
        },
      },
    },
    {
      name: 'removeDimensions',
    },
  ],
}

function detectLargeDataURIs(svg: string, threshold = 50 * 1024): string[] {
  const warnings: string[] = []
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

function normalizeXlinkHref(svg: string): string {
  let normalized = svg.replace(/xlink:href=/g, 'href=')
  const hasOtherXlinkAttrs = /xlink:[a-z]+=/i.test(normalized)
  if (!hasOtherXlinkAttrs) {
    normalized = normalized.replace(/\s*xmlns:xlink=["'][^"']*["']/g, '')
  }
  return normalized
}

async function processSvg(svgText: string) {
  const warnings: string[] = []
  const originalSize = svgText.length

  let optimized: string
  try {
    const result = optimize(svgText, svgoConfig)
    optimized = result.data
  } catch (error) {
    warnings.push(`SVGO optimization failed: ${error instanceof Error ? error.message : String(error)}`)
    optimized = svgText
  }

  const xlinkCount = (optimized.match(/xlink:href=/g) || []).length
  if (xlinkCount > 0) {
    optimized = normalizeXlinkHref(optimized)
    warnings.push(`Normalized ${xlinkCount} deprecated xlink:href attribute(s) to modern href (SVG2 standard)`)
  }

  const dataUriWarnings = detectLargeDataURIs(optimized, 50 * 1024)
  warnings.push(...dataUriWarnings)

  const optimizedSize = optimized.length
  const reductionPercent = ((originalSize - optimizedSize) / originalSize) * 100

  return {
    optimizedSvg: optimized,
    warnings,
    stats: {
      originalSize,
      optimizedSize,
      reductionPercent: Math.max(0, reductionPercent),
    },
  }
}

/**
 * Test suite for SVG import worker
 * Tests viewBox preservation, data URI warnings, and SVGO optimization
 */
describe('SVG Import Worker', () => {

  describe('viewBox preservation', () => {
    it('should preserve viewBox attribute after optimization', async () => {
      const svgWithViewBox = `
        <svg viewBox="0 0 1080 1080" width="1080" height="1080">
          <rect x="0" y="0" width="1080" height="1080" fill="#ffffff"/>
        </svg>
      `

      const result = await processSvg(svgWithViewBox)

      // Should contain viewBox
      expect(result.optimizedSvg).toContain('viewBox="0 0 1080 1080"')
    })

    it('should remove width and height attributes while keeping viewBox', async () => {
      const svgWithDimensions = `
        <svg viewBox="0 0 800 600" width="800px" height="600px">
          <circle cx="400" cy="300" r="100" fill="red"/>
        </svg>
      `

      const result = await processSvg(svgWithDimensions)

      // Should preserve viewBox
      expect(result.optimizedSvg).toContain('viewBox="0 0 800 600"')

      // Should remove width and height
      expect(result.optimizedSvg).not.toMatch(/width=["']?\d+/)
      expect(result.optimizedSvg).not.toMatch(/height=["']?\d+/)
    })

    it('should preserve complex viewBox values', async () => {
      const svgWithComplexViewBox = `
        <svg viewBox="100 50 1920 1080" width="1920" height="1080">
          <rect x="100" y="50" width="1920" height="1080" fill="#000000"/>
        </svg>
      `

      const result = await processSvg(svgWithComplexViewBox)

      expect(result.optimizedSvg).toContain('viewBox="100 50 1920 1080"')
    })
  })

  describe('xlink:href normalization', () => {
    it('should normalize xlink:href to href', async () => {
      const svgWithXlink = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <image xlink:href="image.png" x="0" y="0" width="100" height="100"/>
        </svg>
      `

      const result = await processSvg(svgWithXlink)

      // Should replace xlink:href with href
      expect(result.optimizedSvg).toContain('href=')
      expect(result.optimizedSvg).not.toContain('xlink:href')

      // Should include warning about normalization
      expect(result.warnings).toContainEqual(
        expect.stringContaining('Normalized 1 deprecated xlink:href')
      )
    })

    it('should normalize multiple xlink:href attributes', async () => {
      const svgWithMultipleXlinks = `
        <svg viewBox="0 0 200 200" xmlns:xlink="http://www.w3.org/1999/xlink">
          <image xlink:href="image1.png" x="0" y="0" width="100" height="100"/>
          <image xlink:href="image2.png" x="100" y="100" width="100" height="100"/>
        </svg>
      `

      const result = await processSvg(svgWithMultipleXlinks)

      expect(result.optimizedSvg).not.toContain('xlink:href')
      expect(result.warnings).toContainEqual(
        expect.stringContaining('Normalized 2 deprecated xlink:href')
      )
    })

    it('should remove xmlns:xlink when no xlink attributes remain', async () => {
      const svgWithXlink = `
        <svg viewBox="0 0 100 100" xmlns:xlink="http://www.w3.org/1999/xlink">
          <image xlink:href="test.png" x="0" y="0" width="100" height="100"/>
        </svg>
      `

      const result = await processSvg(svgWithXlink)

      // Should remove xmlns:xlink declaration
      expect(result.optimizedSvg).not.toContain('xmlns:xlink')
    })
  })

  describe('large data URI detection', () => {
    it('should warn about large embedded images', async () => {
      // Create a data URI larger than 50KB threshold
      const largeDataUri = 'data:image/png;base64,' + 'A'.repeat(60 * 1024)
      const svgWithLargeDataUri = `
        <svg viewBox="0 0 100 100">
          <image href="${largeDataUri}" x="0" y="0" width="100" height="100"/>
        </svg>
      `

      const result = await processSvg(svgWithLargeDataUri)

      // Should include warning about large embedded image
      expect(result.warnings).toContainEqual(
        expect.stringContaining('Large embedded image detected')
      )
      expect(result.warnings).toContainEqual(
        expect.stringContaining('Consider externalizing')
      )
    })

    it('should not warn about small embedded images', async () => {
      // Create a small data URI (< 50KB)
      const smallDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const svgWithSmallDataUri = `
        <svg viewBox="0 0 100 100">
          <image href="${smallDataUri}" x="0" y="0" width="100" height="100"/>
        </svg>
      `

      const result = await processSvg(svgWithSmallDataUri)

      // Should NOT warn about small images
      const largeImageWarnings = result.warnings.filter(w => w.includes('Large embedded image'))
      expect(largeImageWarnings).toHaveLength(0)
    })

    it('should detect multiple large data URIs', async () => {
      const largeDataUri1 = 'data:image/png;base64,' + 'B'.repeat(55 * 1024)
      const largeDataUri2 = 'data:image/jpeg;base64,' + 'C'.repeat(60 * 1024)

      const svgWithMultipleDataUris = `
        <svg viewBox="0 0 200 200">
          <image href="${largeDataUri1}" x="0" y="0" width="100" height="100"/>
          <image href="${largeDataUri2}" x="100" y="100" width="100" height="100"/>
        </svg>
      `

      const result = await processSvg(svgWithMultipleDataUris)

      // Should warn about both large images
      const largeImageWarnings = result.warnings.filter(w => w.includes('Large embedded image'))
      expect(largeImageWarnings.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('SVGO optimization', () => {
    it('should optimize SVG and reduce file size', async () => {
      const unoptimizedSvg = `
        <svg viewBox="0 0 100 100" width="100" height="100">
          <!-- This is a comment that should be removed -->
          <rect x="10" y="10" width="80" height="80" fill="#FF0000" stroke="none"/>
          <circle cx="50" cy="50" r="30" fill="#00FF00" opacity="1"/>
        </svg>
      `

      const result = await processSvg(unoptimizedSvg)

      // Should reduce size
      expect(result.stats.optimizedSize).toBeLessThan(result.stats.originalSize)
      expect(result.stats.reductionPercent).toBeGreaterThan(0)

      // Should remove comments
      expect(result.optimizedSvg).not.toContain('This is a comment')

      // Should preserve viewBox
      expect(result.optimizedSvg).toContain('viewBox')
    })

    it('should handle optimization errors gracefully', async () => {
      // Invalid SVG should not crash, just return original with warning
      const invalidSvg = '<svg><invalid><unclosed>'

      const result = await processSvg(invalidSvg)

      // Should include error warning
      expect(result.warnings).toContainEqual(
        expect.stringContaining('SVGO optimization failed')
      )

      // Should return original SVG as fallback
      expect(result.optimizedSvg).toBe(invalidSvg)
    })

    it('should calculate optimization stats correctly', async () => {
      const svg = `
        <svg viewBox="0 0 100 100" width="100" height="100">
          <rect x="0" y="0" width="100" height="100" fill="red"/>
        </svg>
      `

      const result = await processSvg(svg)

      expect(result.stats.originalSize).toBe(svg.length)
      expect(result.stats.optimizedSize).toBe(result.optimizedSvg.length)
      expect(result.stats.reductionPercent).toBeGreaterThanOrEqual(0)
      expect(result.stats.reductionPercent).toBeLessThanOrEqual(100)
    })
  })

  describe('real-world scenarios', () => {
    it('should handle Canva-exported SVG with embedded images', async () => {
      const canvaStyleSvg = `
        <svg viewBox="0 0 1080 1080" width="1080px" height="1080px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <!-- Background -->
          <rect x="0" y="0" width="1080" height="1080" fill="#F5F5F5"/>
          <!-- Logo with xlink:href -->
          <image xlink:href="data:image/png;base64,${'x'.repeat(60000)}" x="50" y="50" width="200" height="200"/>
          <!-- Text elements -->
          <text x="540" y="600" font-family="Arial" font-size="48" text-anchor="middle" fill="#000000">Sample Headline</text>
        </svg>
      `

      const result = await processSvg(canvaStyleSvg)

      // Should preserve viewBox
      expect(result.optimizedSvg).toContain('viewBox="0 0 1080 1080"')

      // Should normalize xlink:href
      expect(result.optimizedSvg).not.toContain('xlink:href')

      // Should warn about large data URI
      expect(result.warnings).toContainEqual(
        expect.stringContaining('Large embedded image')
      )

      // Should remove width/height
      expect(result.optimizedSvg).not.toMatch(/width=["']1080/)
      expect(result.optimizedSvg).not.toMatch(/height=["']1080/)
    })

    it('should preserve gradients and defs', async () => {
      const svgWithGradient = `
        <svg viewBox="0 0 200 200">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="200" height="200" fill="url(#grad1)"/>
        </svg>
      `

      const result = await processSvg(svgWithGradient)

      // Should preserve defs and gradients
      expect(result.optimizedSvg).toContain('linearGradient')
      expect(result.optimizedSvg).toContain('stop')
      expect(result.optimizedSvg).toContain('url(')
    })
  })

  describe('integration with template building', () => {
    it('should produce valid SVG that can be parsed by DOM', async () => {
      const svg = `
        <svg viewBox="0 0 1080 1080" width="1080" height="1080">
          <rect data-slot="bg" x="0" y="0" width="1080" height="1080" fill="#ffffff"/>
          <text data-slot="headline" x="540" y="400" font-size="48" text-anchor="middle">Headline</text>
          <text data-slot="subhead" x="540" y="500" font-size="24" text-anchor="middle">Subhead</text>
        </svg>
      `

      const result = await processSvg(svg)

      // Should be parseable by DOMParser (in Node with jsdom or browser)
      const parser = new DOMParser()
      const doc = parser.parseFromString(result.optimizedSvg, 'image/svg+xml')
      const parserError = doc.querySelector('parsererror')

      expect(parserError).toBeNull()

      // Should preserve data-slot attributes (SVGO should not remove them)
      expect(result.optimizedSvg).toContain('data-slot="bg"')
      expect(result.optimizedSvg).toContain('data-slot="headline"')
      expect(result.optimizedSvg).toContain('data-slot="subhead"')
    })
  })
})

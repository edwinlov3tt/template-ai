/**
 * Image utilities for export
 * Handles CORS issues by converting images to data URIs
 */

/**
 * Convert an image URL to a data URI
 * This solves CORS issues by embedding the image as base64
 */
export async function imageUrlToDataUri(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // Try to load with CORS

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get 2D context'))
          return
        }

        ctx.drawImage(img, 0, 0)
        const dataUri = canvas.toDataURL('image/png')
        resolve(dataUri)
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`))
    }

    img.src = url
  })
}

/**
 * Convert all external image URLs in SVG string to data URIs
 * This prevents CORS issues during canvas export
 */
export async function convertSvgImagesToDataUris(svgString: string): Promise<string> {
  // Find all image elements with href/xlink:href
  const imageRegex = /<image[^>]*(?:href|xlink:href)="([^"]+)"[^>]*>/gi
  const matches = Array.from(svgString.matchAll(imageRegex))

  if (matches.length === 0) {
    return svgString // No images, return as-is
  }

  let modifiedSvg = svgString

  // Convert each external image to data URI
  for (const match of matches) {
    const fullMatch = match[0]
    const imageUrl = match[1]

    // Skip if already a data URI
    if (imageUrl.startsWith('data:')) {
      continue
    }

    try {
      console.log('[convertSvgImagesToDataUris] Converting image:', imageUrl)
      const dataUri = await imageUrlToDataUri(imageUrl)

      // Replace both href and xlink:href with data URI
      const replacedImage = fullMatch
        .replace(/href="[^"]+"/g, `href="${dataUri}"`)
        .replace(/xlink:href="[^"]+"/g, `xlink:href="${dataUri}"`)

      modifiedSvg = modifiedSvg.replace(fullMatch, replacedImage)
      console.log('[convertSvgImagesToDataUris] Converted successfully')
    } catch (error) {
      console.error('[convertSvgImagesToDataUris] Failed to convert image:', imageUrl, error)
      // Continue with other images even if one fails
    }
  }

  return modifiedSvg
}

/**
 * Check if an SVG string contains external images
 */
export function hasExternalImages(svgString: string): boolean {
  const imageRegex = /<image[^>]*(?:href|xlink:href)="([^"]+)"[^>]*>/gi
  const matches = Array.from(svgString.matchAll(imageRegex))

  return matches.some(match => {
    const url = match[1]
    return !url.startsWith('data:')
  })
}

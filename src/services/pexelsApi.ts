/**
 * Pexels API Service
 * Provides access to stock photos from Pexels.com
 * API Documentation: https://www.pexels.com/api/documentation/
 */

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY
const PEXELS_API_BASE = 'https://api.pexels.com/v1'

export interface PexelsPhoto {
  id: number
  width: number
  height: number
  url: string
  photographer: string
  photographer_url: string
  avg_color: string
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
    portrait: string
    landscape: string
    tiny: string
  }
  alt: string
}

export interface PexelsSearchResponse {
  page: number
  per_page: number
  photos: PexelsPhoto[]
  total_results: number
  next_page?: string
}

export interface PexelsError {
  error: string
  message?: string
}

/**
 * Check if API key is configured
 */
export function hasApiKey(): boolean {
  return !!PEXELS_API_KEY && PEXELS_API_KEY !== 'YOUR_PEXELS_API_KEY_HERE'
}

/**
 * Make authenticated request to Pexels API
 */
async function pexelsFetch(endpoint: string): Promise<any> {
  if (!hasApiKey()) {
    throw new Error('Pexels API key is not configured. Please add VITE_PEXELS_API_KEY to your .env file.')
  }

  const response = await fetch(`${PEXELS_API_BASE}${endpoint}`, {
    headers: {
      'Authorization': PEXELS_API_KEY
    }
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid Pexels API key. Please check your .env configuration.')
    }
    if (response.status === 429) {
      throw new Error('Pexels API rate limit exceeded. Please try again later.')
    }
    throw new Error(`Pexels API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Search for photos by keyword
 * @param query Search term (e.g., "nature", "business", "technology")
 * @param page Page number (default: 1)
 * @param perPage Results per page (default: 15, max: 80)
 * @param orientation Image orientation: 'landscape', 'portrait', or 'square'
 * @param color Color filter: 'red', 'orange', 'yellow', 'green', 'turquoise', 'blue', 'violet', 'pink', 'brown', 'black', 'gray', 'white', or hex code
 */
export async function searchPhotos(
  query: string,
  page: number = 1,
  perPage: number = 15,
  orientation?: 'landscape' | 'portrait' | 'square',
  color?: string
): Promise<PexelsSearchResponse> {
  const params = new URLSearchParams({
    query,
    page: page.toString(),
    per_page: perPage.toString()
  })

  if (orientation) {
    params.append('orientation', orientation)
  }

  if (color) {
    // Remove # from hex codes
    const cleanColor = color.startsWith('#') ? color.substring(1) : color
    params.append('color', cleanColor)
  }

  return pexelsFetch(`/search?${params}`)
}

/**
 * Get curated photos (editorial picks from Pexels)
 * @param page Page number (default: 1)
 * @param perPage Results per page (default: 15, max: 80)
 */
export async function getCuratedPhotos(
  page: number = 1,
  perPage: number = 15
): Promise<PexelsSearchResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString()
  })

  return pexelsFetch(`/curated?${params}`)
}

/**
 * Get orientation based on canvas aspect ratio
 */
export function getOrientationFromRatio(ratioId: string): 'landscape' | 'portrait' | 'square' {
  // Parse ratio
  if (ratioId === '1:1') return 'square'

  // Check for tall formats
  if (ratioId === '4:5' || ratioId === '9:16') return 'portrait'

  // Check for wide formats
  if (ratioId === '16:9' || ratioId.includes('x')) {
    // For formats like 728x90, 300x250, etc.
    const [w, h] = ratioId.split('x').map(Number)
    if (w && h) {
      if (w > h) return 'landscape'
      if (h > w) return 'portrait'
      return 'square'
    }
  }

  // Default to landscape for unknown ratios
  return 'landscape'
}

/**
 * Get URL for optimal image size based on usage
 * @param photo Pexels photo object
 * @param usage Usage context ('thumbnail' | 'canvas' | 'preview' | 'original')
 */
export function getOptimalImageUrl(photo: PexelsPhoto, usage: 'thumbnail' | 'canvas' | 'preview' | 'original' = 'canvas'): string {
  switch (usage) {
    case 'thumbnail':
      return photo.src.tiny
    case 'canvas':
      return photo.src.large2x // Use 2x resolution for better quality when scaling
    case 'preview':
      return photo.src.medium
    case 'original':
      return photo.src.original
    default:
      return photo.src.medium
  }
}

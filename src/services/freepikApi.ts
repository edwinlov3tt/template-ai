/**
 * Freepik API Service
 * Provides access to icons, shapes, and vector elements from Freepik.com
 * API Documentation: https://docs.freepik.com/api-reference/icons/icons-api
 */

const FREEPIK_API_KEY = import.meta.env.VITE_FREEPIK_API_KEY
// Use proxy in development to avoid CORS issues
// In production, you'll need a proper backend API endpoint
const FREEPIK_API_BASE = import.meta.env.DEV ? '/api/freepik' : 'https://api.freepik.com'

export interface FreepikIcon {
  id: number
  name: string
  created: string
  slug: string
  free_svg: boolean
  tags: string[]
  style?: {
    id: number
    name: string
  }
  family?: {
    id: number
    name: string
  }
  author?: {
    id: number
    name: string
  }
  thumbnails: Array<{
    width: number
    height: number
    url: string
  }>
}

export interface FreepikSearchResponse {
  data: FreepikIcon[]
  meta: {
    pagination: {
      per_page: number
      total: number
      last_page: number
      current_page: number
    }
  }
}

export interface FreepikDownloadResponse {
  filename: string
  url: string
}

export interface FreepikError {
  error: string
  message?: string
}

export interface FreepikFilters {
  color?: string // 'red', 'blue', 'green', etc.
  shape?: 'outline' | 'fill' // Icon style
  free_svg?: boolean // Filter for free icons only
  icon_type?: string[] // Array of icon types
}

/**
 * Check if API key is configured
 */
export function hasApiKey(): boolean {
  return !!FREEPIK_API_KEY && FREEPIK_API_KEY !== 'YOUR_FREEPIK_API_KEY_HERE'
}

/**
 * Make authenticated request to Freepik API
 */
async function freepikFetch(endpoint: string): Promise<any> {
  if (!hasApiKey()) {
    throw new Error('Freepik API key is not configured. Please add VITE_FREEPIK_API_KEY to your .env file.')
  }

  // In development, the proxy handles authentication
  // In production, you'd send the API key from your backend
  const headers: Record<string, string> = {
    'Accept-Language': 'en-US'
  }

  // Only send API key directly if not using proxy (production would need backend)
  if (!import.meta.env.DEV) {
    headers['x-freepik-api-key'] = FREEPIK_API_KEY
  }

  const response = await fetch(`${FREEPIK_API_BASE}${endpoint}`, { headers })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid Freepik API key. Please check your .env configuration.')
    }
    if (response.status === 429) {
      throw new Error('Freepik API rate limit exceeded. Please try again later.')
    }
    if (response.status === 403) {
      throw new Error('Access forbidden. Please check your API key permissions.')
    }
    throw new Error(`Freepik API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Search for icons by keyword
 * @param query Search term (e.g., "arrow", "user", "shopping")
 * @param page Page number (default: 1)
 * @param perPage Results per page (default: 15)
 * @param order Sort order: 'relevance' or 'recent' (default: 'relevance')
 */
export async function searchIcons(
  query: string = '',
  page: number = 1,
  perPage: number = 15,
  order: 'relevance' | 'recent' = 'relevance'
): Promise<FreepikSearchResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString()
  })

  // Add search term if provided
  if (query.trim()) {
    params.append('term', query)
  }

  // Add order if specified
  if (order) {
    params.append('order', order)
  }

  return freepikFetch(`/v1/icons?${params}`)
}

/**
 * Get recent/popular icons (no search query)
 * @param page Page number (default: 1)
 * @param perPage Results per page (default: 15)
 * @param order Sort order: 'relevance' or 'recent' (default: 'recent')
 */
export async function getRecentIcons(
  page: number = 1,
  perPage: number = 15,
  order: 'relevance' | 'recent' = 'recent'
): Promise<FreepikSearchResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    order
  })

  return freepikFetch(`/v1/icons?${params}`)
}

/**
 * Get download URL for an icon
 * @param iconId Icon resource ID
 * @param format Download format (default: 'svg')
 * @param pngSize PNG size if format is 'png' (512, 256, 128, 64, 32, 24, 16)
 */
export async function getIconDownloadUrl(
  iconId: number,
  format: 'svg' | 'png' = 'svg',
  pngSize?: number
): Promise<FreepikDownloadResponse> {
  const params = new URLSearchParams({
    format
  })

  if (format === 'png' && pngSize) {
    params.append('png_size', pngSize.toString())
  }

  return freepikFetch(`/v1/icons/${iconId}/download?${params}`)
}

/**
 * Get optimal thumbnail URL based on usage context
 * @param icon Freepik icon object
 * @param preferredSize Preferred thumbnail size (default: 128)
 */
export function getOptimalThumbnailUrl(icon: FreepikIcon, preferredSize: number = 128): string {
  if (!icon.thumbnails || icon.thumbnails.length === 0) {
    return '' // Fallback to empty string
  }

  // Find exact match first
  const exactMatch = icon.thumbnails.find(t => t.width === preferredSize)
  if (exactMatch) {
    return exactMatch.url
  }

  // Find closest larger size
  const largerSizes = icon.thumbnails.filter(t => t.width >= preferredSize)
  if (largerSizes.length > 0) {
    const closest = largerSizes.reduce((prev, curr) =>
      curr.width < prev.width ? curr : prev
    )
    return closest.url
  }

  // Fall back to largest available
  const largest = icon.thumbnails.reduce((prev, curr) =>
    curr.width > prev.width ? curr : prev
  )
  return largest.url
}

/**
 * Get color name from hex code for Freepik filters
 * Freepik uses named colors like 'red', 'blue', 'green', etc.
 */
export function getColorNameFromHex(hex: string): string | undefined {
  const colorMap: Record<string, string> = {
    '#ef4444': 'red',
    '#f97316': 'orange',
    '#eab308': 'yellow',
    '#22c55e': 'green',
    '#06b6d4': 'turquoise',
    '#3b82f6': 'blue',
    '#a855f7': 'violet',
    '#ec4899': 'pink',
    '#92400e': 'brown',
    '#000000': 'black',
    '#6b7280': 'gray',
    '#ffffff': 'white'
  }

  return colorMap[hex.toLowerCase()]
}

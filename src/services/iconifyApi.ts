/**
 * Iconify API Service
 * Provides access to 150,000+ open source icons from multiple icon sets
 * API Documentation: https://iconify.design/docs/api/
 * No API key required - free and CORS-enabled
 */

const ICONIFY_API_BASE = 'https://api.iconify.design'

export interface IconifyIcon {
  prefix: string      // Collection prefix (e.g., "mdi", "fa", "carbon")
  name: string        // Icon name (e.g., "home", "user", "arrow-right")
  fullName: string    // Full identifier: "prefix:name"
}

export interface IconifyCollection {
  name: string
  total: number
  author?: {
    name: string
    url?: string
  }
  license?: {
    title: string
    spdx?: string
    url?: string
  }
  palette?: boolean
  category?: string
}

export interface IconifySearchResponse {
  icons: string[]     // Array of "prefix:name" identifiers
  total: number
  limit: number
  start: number
  collections?: Record<string, IconifyCollection>
}

/**
 * Parse icon identifier into prefix and name
 * @param fullName Icon identifier like "mdi:home" or "carbon:arrow-right"
 */
export function parseIconName(fullName: string): IconifyIcon {
  const [prefix, name] = fullName.split(':')
  return { prefix, name, fullName }
}

/**
 * Get SVG URL for an icon
 * @param prefix Collection prefix (e.g., "mdi", "fa")
 * @param name Icon name (e.g., "home", "user")
 * @param options Optional customization (color, size, flip, rotate)
 */
export function getIconSvgUrl(
  prefix: string,
  name: string,
  options?: {
    color?: string    // CSS color (default: currentColor)
    height?: number   // Height in pixels
    width?: number    // Width in pixels
    flip?: 'horizontal' | 'vertical' | 'horizontal,vertical'
    rotate?: 0 | 90 | 180 | 270
  }
): string {
  const params = new URLSearchParams()

  if (options?.color) params.append('color', options.color)
  if (options?.height) params.append('height', options.height.toString())
  if (options?.width) params.append('width', options.width.toString())
  if (options?.flip) params.append('flip', options.flip)
  if (options?.rotate) params.append('rotate', options.rotate.toString())

  const query = params.toString()
  return `${ICONIFY_API_BASE}/${prefix}/${name}.svg${query ? `?${query}` : ''}`
}

/**
 * Search for icons across all collections
 * @param query Search term (e.g., "arrow", "user", "home")
 * @param limit Maximum results to return (default: 64, max: 999)
 * @param start Offset for pagination (default: 0)
 * @param prefixes Filter by collection prefixes (e.g., ["mdi", "fa"])
 */
export async function searchIcons(
  query: string,
  limit: number = 64,
  start: number = 0,
  prefixes?: string[]
): Promise<IconifySearchResponse> {
  const params = new URLSearchParams({
    query,
    limit: limit.toString()
  })

  if (start > 0) {
    params.append('start', start.toString())
  }

  if (prefixes && prefixes.length > 0) {
    params.append('prefixes', prefixes.join(','))
  }

  const response = await fetch(`${ICONIFY_API_BASE}/search?${params}`)

  if (!response.ok) {
    throw new Error(`Iconify API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get list of popular icon collections
 * Useful for filtering/categorizing icons
 */
export async function getCollections(): Promise<Record<string, IconifyCollection>> {
  const response = await fetch(`${ICONIFY_API_BASE}/collections`)

  if (!response.ok) {
    throw new Error(`Iconify API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get popular/recommended collections for general use
 */
export const POPULAR_COLLECTIONS = [
  'mdi',           // Material Design Icons (7,000+)
  'fa',            // Font Awesome (2,000+)
  'carbon',        // IBM Carbon (2,000+)
  'ic',            // Google Material Icons (2,000+)
  'heroicons',     // Heroicons (300+)
  'feather',       // Feather Icons (280+)
  'bi',            // Bootstrap Icons (2,000+)
  'lucide',        // Lucide Icons (1,000+)
  'tabler',        // Tabler Icons (4,000+)
  'mingcute'       // Mingcute Icons (2,000+)
]

/**
 * Get collection display name
 */
export function getCollectionDisplayName(prefix: string): string {
  const names: Record<string, string> = {
    'mdi': 'Material Design',
    'fa': 'Font Awesome',
    'carbon': 'IBM Carbon',
    'ic': 'Material Icons',
    'heroicons': 'Heroicons',
    'feather': 'Feather',
    'bi': 'Bootstrap Icons',
    'lucide': 'Lucide',
    'tabler': 'Tabler',
    'mingcute': 'Mingcute',
    'la': 'Line Awesome',
    'octicon': 'Octicons',
    'ri': 'Remix Icon',
    'uil': 'Unicons',
    'ion': 'Ionicons',
    'ant-design': 'Ant Design'
  }
  return names[prefix] || prefix.toUpperCase()
}

/**
 * Get thumbnail/preview URL for an icon
 * Uses Iconify's render endpoint with a preview size
 */
export function getIconPreviewUrl(prefix: string, name: string, size: number = 128): string {
  return getIconSvgUrl(prefix, name, {
    height: size,
    width: size
  })
}

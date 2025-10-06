/**
 * React hook for querying Google Fonts API for available font weights
 */

import { useState, useEffect } from 'react'

export interface FontAvailabilityResult {
  availableWeights: number[]
  loading: boolean
  error: string | null
}

/**
 * Common Google Fonts with their available weights
 * This is a fallback list when the API is unavailable
 */
const COMMON_FONTS_WEIGHTS: Record<string, number[]> = {
  'inter': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'roboto': [100, 300, 400, 500, 700, 900],
  'open sans': [300, 400, 500, 600, 700, 800],
  'lato': [100, 300, 400, 700, 900],
  'montserrat': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'poppins': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'raleway': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'source sans pro': [200, 300, 400, 600, 700, 900],
  'oswald': [200, 300, 400, 500, 600, 700],
  'playfair display': [400, 500, 600, 700, 800, 900],
}

/**
 * Standard font weights available for most fonts
 */
const DEFAULT_WEIGHTS = [400, 700]

/**
 * Cache for font availability data
 */
const fontCache = new Map<string, number[]>()

/**
 * Hook to fetch available font weights for a given font family
 *
 * @param family - Font family name
 * @returns Font availability data (weights, loading state, error)
 */
export function useFontAvailability(family: string): FontAvailabilityResult {
  const [availableWeights, setAvailableWeights] = useState<number[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!family) {
      setAvailableWeights(DEFAULT_WEIGHTS)
      setLoading(false)
      return
    }

    const normalizedFamily = family.toLowerCase().trim()

    // Check cache first
    if (fontCache.has(normalizedFamily)) {
      setAvailableWeights(fontCache.get(normalizedFamily)!)
      setLoading(false)
      return
    }

    // Check common fonts fallback
    if (COMMON_FONTS_WEIGHTS[normalizedFamily]) {
      const weights = COMMON_FONTS_WEIGHTS[normalizedFamily]
      fontCache.set(normalizedFamily, weights)
      setAvailableWeights(weights)
      setLoading(false)
      return
    }

    // Fetch from Google Fonts API
    fetchFontWeights(normalizedFamily)
      .then((weights) => {
        fontCache.set(normalizedFamily, weights)
        setAvailableWeights(weights)
        setError(null)
      })
      .catch((err) => {
        console.warn(`[useFontAvailability] Failed to fetch weights for ${family}:`, err)
        setError(err.message || 'Failed to fetch font weights')
        // Fallback to default weights
        setAvailableWeights(DEFAULT_WEIGHTS)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [family])

  return { availableWeights, loading, error }
}

/**
 * Fetch available font weights from Google Fonts API
 *
 * @param family - Normalized font family name
 * @returns Array of available weights
 */
async function fetchFontWeights(family: string): Promise<number[]> {
  // Google Fonts API key (should be in env vars for production)
  const apiKey = import.meta.env.VITE_GOOGLE_FONTS_API_KEY || ''

  if (!apiKey) {
    // No API key - use fallback
    throw new Error('Google Fonts API key not configured')
  }

  const url = `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&family=${encodeURIComponent(
    family
  )}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Google Fonts API error: ${response.status}`)
  }

  const data = await response.json()

  // Find the font in the response
  const fontItem = data.items?.find(
    (item: any) => item.family.toLowerCase() === family.toLowerCase()
  )

  if (!fontItem || !fontItem.variants) {
    throw new Error(`Font "${family}" not found in Google Fonts`)
  }

  // Parse variants to extract numeric weights
  const weights: number[] = []

  for (const variant of fontItem.variants) {
    // Variants are like: "regular", "italic", "100", "100italic", "700", "700italic"
    const match = variant.match(/^(\d+)/)
    if (match) {
      const weight = parseInt(match[1], 10)
      if (!weights.includes(weight)) {
        weights.push(weight)
      }
    } else if (variant === 'regular') {
      if (!weights.includes(400)) {
        weights.push(400)
      }
    }
  }

  // Sort weights
  weights.sort((a, b) => a - b)

  return weights.length > 0 ? weights : DEFAULT_WEIGHTS
}

/**
 * Clear the font cache (useful for testing or manual refresh)
 */
export function clearFontCache(): void {
  fontCache.clear()
}

/**
 * FontPicker.tsx
 *
 * Font family picker with Google Fonts integration and live preview.
 */

import React, { useState, useMemo, useEffect } from 'react'
import { loadFont } from '../../utils/fontLoader'
import {
  SANS_SERIF_FONTS,
  SERIF_FONTS,
  DISPLAY_FONTS,
  MONOSPACE_FONTS,
  HANDWRITING_FONTS,
  TRENDING_FONTS,
  getAllFonts
} from '../../utils/googleFonts'

// Popular fonts (subset of sans-serif for quick access)
const POPULAR_FONTS = SANS_SERIF_FONTS.slice(0, 20)

interface FontPickerProps {
  value: string | 'Mixed' | undefined
  onChange: (family: string) => void
  className?: string
  disabled?: boolean
}

export const FontPicker: React.FC<FontPickerProps> = ({
  value,
  onChange,
  className = '',
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'popular' | 'sans-serif' | 'serif' | 'display' | 'monospace' | 'handwriting' | 'trending'>('popular')
  const [fontsLoading, setFontsLoading] = useState(false)

  // All available fonts
  const allFonts = useMemo(() => getAllFonts(), [])

  // Filter fonts based on category and search
  const filteredFonts = useMemo(() => {
    let fonts: string[] = []

    switch (selectedCategory) {
      case 'popular':
        fonts = POPULAR_FONTS
        break
      case 'sans-serif':
        fonts = SANS_SERIF_FONTS
        break
      case 'serif':
        fonts = SERIF_FONTS
        break
      case 'display':
        fonts = DISPLAY_FONTS
        break
      case 'monospace':
        fonts = MONOSPACE_FONTS
        break
      case 'handwriting':
        fonts = HANDWRITING_FONTS
        break
      case 'trending':
        fonts = TRENDING_FONTS
        break
      default:
        fonts = allFonts
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      fonts = fonts.filter(font => font.toLowerCase().includes(query))
    }

    return fonts
  }, [selectedCategory, searchQuery, allFonts])

  // Reset loading state when category/search changes
  useEffect(() => {
    if (isOpen) {
      setFontsLoading(false)
    }
  }, [selectedCategory, searchQuery])

  // Preload fonts when dropdown opens for accurate previews
  useEffect(() => {
    if (!isOpen) return

    setFontsLoading(true)

    // Load fonts in batches to avoid overwhelming the browser
    const loadFontsBatch = async () => {
      // Load first 20 fonts immediately (visible without scrolling)
      const visibleFonts = filteredFonts.slice(0, 20)
      await Promise.all(visibleFonts.map(font => loadFont(font, 400)))

      // Small delay to let browser actually load the font files
      await new Promise(resolve => setTimeout(resolve, 500))

      // Force re-render after first batch loads
      setFontsLoading(false)

      // Load remaining fonts in background
      const remainingFonts = filteredFonts.slice(20)
      if (remainingFonts.length > 0) {
        Promise.all(remainingFonts.map(font => loadFont(font, 400)))
      }
    }

    loadFontsBatch().catch(error => {
      console.warn('[FontPicker] Font preloading failed:', error)
      setFontsLoading(false)
    })
  }, [isOpen, filteredFonts])

  // Handle font selection
  const handleSelect = async (family: string) => {
    // Load the font before applying
    await loadFont(family, 400)
    onChange(family)
    setIsOpen(false)
    setSearchQuery('')
  }

  // Display value
  const displayValue = value === 'Mixed' ? 'Mixed' : (value || 'Select font')

  return (
    <div className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-between gap-2 px-3 py-1.5 border rounded
          bg-white hover:bg-gray-50 transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${value === 'Mixed' ? 'text-gray-500 italic' : 'text-gray-900'}
        `}
        style={{ fontFamily: value !== 'Mixed' && value ? value : 'inherit', minWidth: '140px' }}
      >
        <span className="truncate">{displayValue}</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="p-2 border-b">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fonts..."
              className="w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Category tabs */}
          <div className="flex border-b bg-gray-50 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'popular', label: 'Popular' },
              { id: 'trending', label: 'Trending' },
              { id: 'sans-serif', label: 'Sans' },
              { id: 'serif', label: 'Serif' },
              { id: 'display', label: 'Display' },
              { id: 'handwriting', label: 'Script' },
              { id: 'monospace', label: 'Mono' },
              { id: 'all', label: 'All' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`
                  px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap
                  ${selectedCategory === cat.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Font list */}
          <div className="overflow-y-auto flex-1">
            {fontsLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="text-sm">Loading fonts...</div>
              </div>
            ) : filteredFonts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No fonts found
              </div>
            ) : (
              filteredFonts.map(font => (
                <button
                  key={`${font}-${fontsLoading}`}
                  type="button"
                  onClick={() => handleSelect(font)}
                  className={`
                    w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors
                    ${value === font ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}
                  `}
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Backdrop (closes dropdown when clicking outside) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false)
            setSearchQuery('')
          }}
        />
      )}
    </div>
  )
}

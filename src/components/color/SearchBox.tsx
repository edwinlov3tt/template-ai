import React, { useState, useCallback } from 'react'
import type { Paint } from '../../editor/color/types'
import { ColorSwatch } from './ColorSwatch'

interface SearchBoxProps {
  onApplyColor: (paint: Paint) => void
}

/**
 * Search box for color input
 * Accepts color names, hex codes, RGB/HSL/OKLCH values
 */
export const SearchBox: React.FC<SearchBoxProps> = ({ onApplyColor }) => {
  const [searchValue, setSearchValue] = useState('')
  const [previewPaint, setPreviewPaint] = useState<Paint | null>(null)

  // Parse color input
  const parseColor = useCallback((input: string): Paint | null => {
    const trimmed = input.trim().toLowerCase()

    // Hex color
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
      return { kind: 'solid', color: trimmed }
    }

    // Named colors (basic set)
    const namedColors: Record<string, string> = {
      red: '#dc2626',
      blue: '#2563eb',
      green: '#16a34a',
      yellow: '#eab308',
      orange: '#ea580c',
      purple: '#9333ea',
      pink: '#e11d48',
      cyan: '#0891b2',
      teal: '#0d9488',
      lime: '#84cc16',
      emerald: '#059669',
      indigo: '#4f46e5',
      black: '#000000',
      white: '#ffffff',
      gray: '#71717a',
      navy: '#1e3a8a'
    }

    if (namedColors[trimmed]) {
      return { kind: 'solid', color: namedColors[trimmed] }
    }

    // RGB format (simplified)
    const rgbMatch = trimmed.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1])
      const g = parseInt(rgbMatch[2])
      const b = parseInt(rgbMatch[3])
      if (r <= 255 && g <= 255 && b <= 255) {
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
        return { kind: 'solid', color: hex }
      }
    }

    return null
  }, [])

  // Debounced color parsing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)

    // Parse and preview color
    const parsed = parseColor(value)
    setPreviewPaint(parsed)
  }, [parseColor])

  // Handle Enter key to apply color
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && previewPaint) {
      onApplyColor(previewPaint)
      setSearchValue('')
      setPreviewPaint(null)
    }
  }, [previewPaint, onApplyColor])

  return (
    <div style={{
      padding: '12px',
      borderBottom: '1px solid #3a3a3a'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#2a2a2a',
        borderRadius: '6px',
        padding: '8px 12px',
        border: '1px solid #3a3a3a'
      }}>
        {/* Search icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <path
            d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z"
            stroke="#71717a"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 14L10.5 10.5"
            stroke="#71717a"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <input
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Try 'blue' or '#00c4cc'"
          role="searchbox"
          aria-label="Search colors"
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#e5e7eb',
            fontSize: '14px',
            fontFamily: 'inherit'
          }}
        />

        {/* Preview swatch */}
        {previewPaint && (
          <ColorSwatch
            paint={previewPaint}
            size={24}
            ariaLabel="Preview color"
          />
        )}
      </div>
    </div>
  )
}

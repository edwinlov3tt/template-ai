/**
 * FontFamilySelect.tsx
 *
 * Font family selector with preview (for FloatingTextToolbar).
 * Shows current family with "Ag" sample, dropdown for selection.
 */

import React, { useState, useMemo, useEffect } from 'react'
import { Popover } from 'antd'
import { loadFont } from '../../utils/fontLoader'
import { getAllFonts } from '../../utils/googleFonts'

/**
 * All available Google Fonts (200+)
 */
const ALL_FONTS = getAllFonts()

interface FontFamilySelectProps {
  value: string | 'Mixed' | undefined
  onChange: (family: string) => void
}

export const FontFamilySelect: React.FC<FontFamilySelectProps> = ({
  value,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [fontsLoading, setFontsLoading] = useState(false)

  // Filter fonts based on search
  const filteredFonts = useMemo(() => {
    if (!searchQuery) return ALL_FONTS.slice(0, 50) // Show first 50 by default
    const query = searchQuery.toLowerCase()
    return ALL_FONTS.filter(font => font.toLowerCase().includes(query)).slice(0, 100) // Limit search results
  }, [searchQuery])

  // Reset loading state when search changes
  useEffect(() => {
    if (isOpen) {
      setFontsLoading(false)
    }
  }, [searchQuery])

  // Preload fonts when dropdown opens for accurate previews
  useEffect(() => {
    if (!isOpen) return

    setFontsLoading(true)

    const loadFontsBatch = async () => {
      // Load first 30 fonts (all visible in compact popover)
      const visibleFonts = filteredFonts.slice(0, 30)
      await Promise.all(visibleFonts.map(font => loadFont(font, 400)))

      // Small delay to let browser actually load the font files
      await new Promise(resolve => setTimeout(resolve, 500))

      // Force re-render
      setFontsLoading(false)

      // Load remaining fonts in background
      const remainingFonts = filteredFonts.slice(30)
      if (remainingFonts.length > 0) {
        Promise.all(remainingFonts.map(font => loadFont(font, 400)))
      }
    }

    loadFontsBatch().catch(error => {
      console.warn('[FontFamilySelect] Font preloading failed:', error)
      setFontsLoading(false)
    })
  }, [isOpen, filteredFonts])

  // Handle font selection
  const handleSelect = async (family: string) => {
    await loadFont(family, 400)
    onChange(family)
    setIsOpen(false)
    setSearchQuery('')
  }

  // Display value
  const displayValue = value === 'Mixed' ? 'Mixed' : (value || 'Inter')

  // Popover content
  const content = (
    <div style={{
      width: '280px',
      maxHeight: '320px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Search */}
      <div style={{ padding: '8px', borderBottom: '1px solid #E5E7EB' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search fonts..."
          autoFocus
          style={{
            width: '100%',
            padding: '6px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: '4px',
            fontSize: '14px',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3B82F6'
            e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#E5E7EB'
            e.target.style.boxShadow = 'none'
          }}
        />
      </div>

      {/* Font list */}
      <div style={{
        overflowY: 'auto',
        flex: 1
      }}>
        {fontsLoading ? (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            color: '#9CA3AF',
            fontSize: '14px'
          }}>
            Loading fonts...
          </div>
        ) : filteredFonts.length === 0 ? (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            color: '#9CA3AF',
            fontSize: '14px'
          }}>
            No fonts found
          </div>
        ) : (
          filteredFonts.map(font => (
            <button
              key={`${font}-${fontsLoading}`}
              type="button"
              onClick={() => handleSelect(font)}
              style={{
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                background: value === font ? '#EFF6FF' : 'transparent',
                color: value === font ? '#1D4ED8' : '#374151',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: font,
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => {
                if (value !== font) {
                  e.currentTarget.style.background = '#F9FAFB'
                }
              }}
              onMouseLeave={(e) => {
                if (value !== font) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {font}
            </button>
          ))
        )}
      </div>
    </div>
  )

  return (
    <Popover
      content={content}
      trigger="click"
      open={isOpen}
      onOpenChange={setIsOpen}
      placement="bottomLeft"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 8px',
          height: '28px',
          border: '1px solid #E5E7EB',
          borderRadius: '4px',
          background: '#FFFFFF',
          cursor: 'pointer',
          width: '180px',
          transition: 'all 0.15s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#F9FAFB'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#FFFFFF'
        }}
      >
        {/* Sample "Ag" */}
        <span
          style={{
            fontFamily: displayValue !== 'Mixed' ? displayValue : 'Inter',
            fontSize: '16px',
            fontWeight: '500',
            color: '#374151',
            lineHeight: 1
          }}
        >
          Ag
        </span>

        {/* Font name */}
        <span
          style={{
            flex: 1,
            fontSize: '13px',
            color: value === 'Mixed' ? '#9CA3AF' : '#374151',
            fontStyle: value === 'Mixed' ? 'italic' : 'normal',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {displayValue}
        </span>

        {/* Dropdown arrow */}
        <svg
          style={{
            width: '14px',
            height: '14px',
            color: '#9CA3AF'
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </Popover>
  )
}

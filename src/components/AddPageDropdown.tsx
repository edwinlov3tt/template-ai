import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FilePlus, ChevronDown } from 'lucide-react'
import { getUiScale } from '../utils/uiScale'

interface PageSize {
  id: string
  w: number
  h: number
  label: string
}

const PAGE_SIZE_PRESETS: PageSize[] = [
  { id: '728x90', w: 728, h: 90, label: 'Leaderboard (728×90)' },
  { id: '300x250', w: 300, h: 250, label: 'Medium Rectangle (300×250)' },
  { id: '160x600', w: 160, h: 600, label: 'Wide Skyscraper (160×600)' },
  { id: '300x600', w: 300, h: 600, label: 'Half Page (300×600)' },
  { id: '320x50', w: 320, h: 50, label: 'Mobile Banner (320×50)' },
  { id: '970x250', w: 970, h: 250, label: 'Billboard (970×250)' },
  { id: '1080x1080', w: 1080, h: 1080, label: 'Instagram Square (1080×1080)' },
  { id: '1080x1920', w: 1080, h: 1920, label: 'YouTube Vertical (1080×1920)' }
]

interface AddPageDropdownProps {
  zoom: number
  onAddPage: (size: PageSize) => void
  onCustomSize: () => void
  variant?: 'compact' | 'large'
}

export function AddPageDropdown({ zoom, onAddPage, onCustomSize, variant = 'compact' }: AddPageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null)

  const buttonScale = getUiScale(zoom, { min: 1, max: 1.6 })

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.right,
        width: rect.width
      })
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Render dropdown menu in portal
  const dropdownMenu = isOpen && dropdownPosition && (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        transform: 'translateX(-100%)', // Align to right edge of button
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
        zIndex: 10000,
        minWidth: '280px',
        maxHeight: '420px',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid #e5e7eb',
        fontSize: '11px',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Select Page Size
      </div>

      {/* Size Options */}
      <div style={{ padding: '6px 0' }}>
        {PAGE_SIZE_PRESETS.map((size) => (
          <button
            key={size.id}
            onClick={() => {
              onAddPage(size)
              setIsOpen(false)
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              background: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#111827'
            }}>
              {size.label}
            </span>
          </button>
        ))}

        {/* Custom Size Option */}
        <div style={{
          margin: '6px 0 4px',
          borderTop: '1px solid #e5e7eb'
        }} />
        <button
          onClick={() => {
            onCustomSize()
            setIsOpen(false)
          }}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: 'none',
            background: 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'background 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#3b82f6'
          }}>
            Custom Size...
          </span>
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ position: 'relative' }}>
      {/* Add Page Button */}
      {variant === 'compact' ? (
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          title="Add page"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: `${Math.round(10 * buttonScale)}px`,
            gap: `${Math.round(4 * buttonScale)}px`
          }}
        >
          <FilePlus size={Math.round(28 * buttonScale)} color="#4b5563" strokeWidth={2} />
          <ChevronDown
            size={Math.round(18 * buttonScale)}
            color="#4b5563"
            strokeWidth={2.2}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}
          />
        </button>
      ) : (
          <button
            ref={buttonRef}
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            style={{
              border: '1px solid #cbd5f5',
              background: '#f8faff',
              cursor: 'pointer',
              padding: `${Math.round(18 * buttonScale)}px ${Math.round(32 * buttonScale)}px`,
              borderRadius: '10px',
              fontSize: `${Math.max(16, Math.round(17 * buttonScale))}px`,
              fontWeight: '600',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: `${Math.round(10 * buttonScale)}px`,
              transition: 'all 0.2s',
              height: 'auto'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#eef2ff'
              e.currentTarget.style.borderColor = '#818cf8'
              e.currentTarget.style.color = '#1f2937'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8faff'
              e.currentTarget.style.borderColor = '#cbd5f5'
              e.currentTarget.style.color = '#1f2937'
            }}
          >
          <FilePlus size={Math.round(22 * buttonScale)} color="currentColor" strokeWidth={2} />
          <span>Add Page</span>
          <ChevronDown
            size={Math.round(20 * buttonScale)}
            color="currentColor"
            strokeWidth={2}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              marginLeft: 'auto'
            }}
          />
        </button>
      )}

      {/* Dropdown menu rendered in portal to avoid clipping */}
      {dropdownMenu && createPortal(dropdownMenu, document.body)}
    </div>
  )
}

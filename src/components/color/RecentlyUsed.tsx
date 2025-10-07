import React from 'react'
import type { Paint } from '../../editor/color/types'
import { ColorSwatch } from './ColorSwatch'
import { useEditorStore } from '../../state/editorStore'

interface RecentlyUsedProps {
  onApplyColor: (paint: Paint) => void
}

/**
 * Recently used colors section
 * Shows color picker button + last 9 colors in LRU order
 */
export const RecentlyUsed: React.FC<RecentlyUsedProps> = ({ onApplyColor }) => {
  const recentPaints = useEditorStore((state) => state.recentPaints)
  const setActivePanelSection = useEditorStore((state) => state.setActivePanelSection)

  // Always show this section (for the color picker button)
  return (
    <div style={{
      padding: '16px 12px',
      borderBottom: '1px solid #3a3a3a'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '12px'
      }}>
        <span style={{
          color: '#e5e7eb',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Recently used
        </span>
      </div>

      {/* Color picker button + Transparent button + Recent colors */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {/* Permanent color picker button */}
        <button
          onClick={() => setActivePanelSection('solid-picker')}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            border: '1px solid #3a3a3a',
            background: '#2a2a2a',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#52525b'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#3a3a3a'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="Open color picker"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            {/* Rainbow circle gradient */}
            <defs>
              <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="25%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#22c55e" />
                <stop offset="75%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>

            {/* Rainbow circle */}
            <circle
              cx="12"
              cy="12"
              r="8"
              fill="none"
              stroke="url(#rainbow-gradient)"
              strokeWidth="3"
            />

            {/* Plus sign */}
            <line x1="12" y1="8" x2="12" y2="16" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="12" x2="16" y2="12" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Permanent transparent/no-fill button */}
        <button
          onClick={() => onApplyColor({ kind: 'solid', color: 'transparent' })}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            border: '1px solid #3a3a3a',
            background: '#2a2a2a',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#52525b'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#3a3a3a'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="Transparent (no fill)"
        >
          {/* Checkerboard pattern */}
          <svg width="24" height="24" viewBox="0 0 24 24">
            <defs>
              <pattern id="checkerboard" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="4" height="4" fill="#52525b" />
                <rect x="4" y="0" width="4" height="4" fill="#71717a" />
                <rect x="0" y="4" width="4" height="4" fill="#71717a" />
                <rect x="4" y="4" width="4" height="4" fill="#52525b" />
              </pattern>
            </defs>
            <rect x="4" y="4" width="16" height="16" rx="2" fill="url(#checkerboard)" />
            {/* Red diagonal line */}
            <line x1="6" y1="18" x2="18" y2="6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Recent colors (limit to 8 to make room for picker + transparent buttons) */}
        {recentPaints.slice(0, 8).map((paint, index) => (
          <ColorSwatch
            key={index}
            paint={paint}
            onClick={() => onApplyColor(paint)}
            ariaLabel={`Recent color ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

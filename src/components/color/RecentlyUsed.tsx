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

      {/* Color picker button + Recent colors */}
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
            border: '2px dashed #52525b',
            background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 25%, #22c55e 50%, #3b82f6 75%, #8b5cf6 100%)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#71717a'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#52525b'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="Open color picker"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))'
            }}
          >
            <circle cx="10" cy="10" r="8" fill="white" />
            <circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        {/* Recent colors (limit to 9 to make room for picker button) */}
        {recentPaints.slice(0, 9).map((paint, index) => (
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

import React from 'react'

interface GradientStyleChipsProps {
  activeStyle: 'linear' | 'radial'
  onStyleChange: (style: 'linear' | 'radial') => void
}

/**
 * Style selector chips for gradient type
 *
 * Displays Linear | Radial chips with icons
 */
export const GradientStyleChips: React.FC<GradientStyleChipsProps> = ({
  activeStyle,
  onStyleChange
}) => {
  const chipBaseStyle: React.CSSProperties = {
    flex: 1,
    padding: '8px 12px',
    background: 'none',
    border: '1px solid #3a3a3a',
    color: '#e5e7eb',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.15s ease'
  }

  const activeChipStyle: React.CSSProperties = {
    ...chipBaseStyle,
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
    color: '#ffffff'
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '500',
          color: '#9ca3af',
          marginBottom: '8px'
        }}
      >
        Style
      </label>
      <div style={{ display: 'flex', gap: '8px' }}>
        {/* Linear chip */}
        <button
          onClick={() => onStyleChange('linear')}
          style={
            activeStyle === 'linear'
              ? { ...activeChipStyle, borderRadius: '6px' }
              : { ...chipBaseStyle, borderRadius: '6px' }
          }
          onMouseEnter={(e) => {
            if (activeStyle !== 'linear') {
              e.currentTarget.style.backgroundColor = '#2a2a2a'
            }
          }}
          onMouseLeave={(e) => {
            if (activeStyle !== 'linear') {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          {/* Linear gradient icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <line
              x1="2"
              y1="14"
              x2="14"
              y2="2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="2" cy="14" r="1.5" fill="currentColor" />
            <circle cx="14" cy="2" r="1.5" fill="currentColor" />
          </svg>
          <span>Linear</span>
        </button>

        {/* Radial chip */}
        <button
          onClick={() => onStyleChange('radial')}
          style={
            activeStyle === 'radial'
              ? { ...activeChipStyle, borderRadius: '6px' }
              : { ...chipBaseStyle, borderRadius: '6px' }
          }
          onMouseEnter={(e) => {
            if (activeStyle !== 'radial') {
              e.currentTarget.style.backgroundColor = '#2a2a2a'
            }
          }}
          onMouseLeave={(e) => {
            if (activeStyle !== 'radial') {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          {/* Radial gradient icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle
              cx="8"
              cy="8"
              r="6"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          </svg>
          <span>Radial</span>
        </button>
      </div>
    </div>
  )
}

/**
 * AlignmentButtons.tsx
 *
 * Alignment controls for positioning slots relative to page.
 */

import React from 'react'
import type { AlignMode } from '../../editor/transforms/operations'

interface AlignmentButtonsProps {
  onAlign: (mode: AlignMode) => void
  disabled?: boolean
  className?: string
}

export const AlignmentButtons: React.FC<AlignmentButtonsProps> = ({
  onAlign,
  disabled = false,
  className = ''
}) => {
  const buttonStyle = (isHovered: boolean) => ({
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #4B5563',
    borderRadius: '4px',
    background: isHovered && !disabled ? '#374151' : 'transparent',
    color: disabled ? '#6B7280' : '#ffffff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s'
  })

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#e5e7eb',
          marginBottom: '8px',
          display: 'block'
        }}>
          Alignment
        </label>

        {/* Horizontal alignment */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <button
            type="button"
            onClick={() => onAlign('left')}
            disabled={disabled}
            style={buttonStyle(false)}
            onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = '#374151')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            title="Align left"
          >
            <svg style={{ width: '16px', height: '16px', margin: '0 auto', display: 'block' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => onAlign('center')}
            disabled={disabled}
            style={buttonStyle(false)}
            onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = '#374151')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            title="Align center"
          >
            <svg style={{ width: '16px', height: '16px', margin: '0 auto', display: 'block' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M9 18h6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => onAlign('right')}
            disabled={disabled}
            style={buttonStyle(false)}
            onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = '#374151')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            title="Align right"
          >
            <svg style={{ width: '16px', height: '16px', margin: '0 auto', display: 'block' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M13 18h7" />
            </svg>
          </button>
        </div>

        {/* Vertical alignment */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={() => onAlign('top')}
            disabled={disabled}
            style={buttonStyle(false)}
            onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = '#374151')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            title="Align top"
          >
            <svg style={{ width: '16px', height: '16px', margin: '0 auto', display: 'block' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h12M6 8h8M6 12h10" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => onAlign('middle')}
            disabled={disabled}
            style={buttonStyle(false)}
            onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = '#374151')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            title="Align middle"
          >
            <svg style={{ width: '16px', height: '16px', margin: '0 auto', display: 'block' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8h12M6 12h10M6 16h8" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => onAlign('bottom')}
            disabled={disabled}
            style={buttonStyle(false)}
            onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = '#374151')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            title="Align bottom"
          >
            <svg style={{ width: '16px', height: '16px', margin: '0 auto', display: 'block' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h10M6 16h8M6 20h12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

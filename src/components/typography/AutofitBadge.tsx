/**
 * AutofitBadge.tsx
 *
 * AUTOFIT status badge (for FloatingTextToolbar).
 * Shows "AUTOFIT ON" or "AUTOFIT OFF" with color coding.
 * Only visible when anchorBox is 'fixed'.
 */

import React from 'react'

interface AutofitBadgeProps {
  anchorBox: string | 'Mixed' | undefined
  autoFit: boolean | 'Mixed' | undefined
  onToggle: () => void
}

export const AutofitBadge: React.FC<AutofitBadgeProps> = ({
  anchorBox,
  autoFit,
  onToggle
}) => {
  // Only show badge when anchorBox is 'fixed'
  if (anchorBox !== 'fixed') return null

  // Determine badge state
  const isOn = autoFit === true
  const isMixed = autoFit === 'Mixed'

  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        height: '28px',
        padding: '0 10px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        border: '1px solid',
        borderColor: isOn ? '#10B981' : '#EF4444',
        borderRadius: '4px',
        background: isOn ? '#D1FAE5' : '#FEE2E2',
        color: isOn ? '#047857' : '#DC2626',
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '0.025em',
        cursor: 'pointer',
        transition: 'all 0.15s',
        textTransform: 'uppercase'
      }}
      title={isOn ? 'Autofit is ON (text scales to fit box)' : 'Autofit is OFF (text may overflow)'}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.8'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1'
      }}
    >
      <span>AUTOFIT</span>
      <span style={{
        fontSize: '10px',
        fontWeight: '700'
      }}>
        {isMixed ? '—' : (isOn ? 'ON' : 'OFF')}
      </span>
    </button>
  )
}

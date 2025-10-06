/**
 * ArrangeButtons.tsx
 *
 * Z-order/arrange controls for layering slots.
 */

import React from 'react'

interface ArrangeButtonsProps {
  onBringToFront: () => void
  onBringForward: () => void
  onSendBackward: () => void
  onSendToBack: () => void
  canBringForward: boolean
  canSendBackward: boolean
  disabled?: boolean
  className?: string
}

export const ArrangeButtons: React.FC<ArrangeButtonsProps> = ({
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
  canBringForward,
  canSendBackward,
  disabled = false,
  className = ''
}) => {
  const buttonStyle = (isDisabled: boolean) => ({
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #4B5563',
    borderRadius: '4px',
    background: 'transparent',
    color: isDisabled ? '#6B7280' : '#ffffff',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.5 : 1,
    transition: 'all 0.15s'
  })

  return (
    <div>
      <label style={{
        fontSize: '14px',
        fontWeight: '500',
        color: '#e5e7eb',
        marginBottom: '8px',
        display: 'block'
      }}>
        Arrange
      </label>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px'
      }}>
        <button
          type="button"
          onClick={onBringToFront}
          disabled={disabled || !canBringForward}
          style={buttonStyle(disabled || !canBringForward)}
          onMouseEnter={(e) => {
            if (!disabled && canBringForward) {
              e.currentTarget.style.background = '#374151'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
          title="Bring to front"
        >
          To Front
        </button>

        <button
          type="button"
          onClick={onBringForward}
          disabled={disabled || !canBringForward}
          style={buttonStyle(disabled || !canBringForward)}
          onMouseEnter={(e) => {
            if (!disabled && canBringForward) {
              e.currentTarget.style.background = '#374151'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
          title="Bring forward"
        >
          Forward
        </button>

        <button
          type="button"
          onClick={onSendBackward}
          disabled={disabled || !canSendBackward}
          style={buttonStyle(disabled || !canSendBackward)}
          onMouseEnter={(e) => {
            if (!disabled && canSendBackward) {
              e.currentTarget.style.background = '#374151'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
          title="Send backward"
        >
          Backward
        </button>

        <button
          type="button"
          onClick={onSendToBack}
          disabled={disabled || !canSendBackward}
          style={buttonStyle(disabled || !canSendBackward)}
          onMouseEnter={(e) => {
            if (!disabled && canSendBackward) {
              e.currentTarget.style.background = '#374151'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
          title="Send to back"
        >
          To Back
        </button>
      </div>
    </div>
  )
}

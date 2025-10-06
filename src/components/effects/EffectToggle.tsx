/**
 * EffectToggle.tsx
 *
 * Individual effect toggle with fine controls.
 */

import React from 'react'

interface EffectToggleProps {
  label: string
  enabled: boolean | 'Mixed'
  onToggle: (enabled: boolean) => void
  experimental?: boolean
  className?: string
  children?: React.ReactNode
}

export const EffectToggle: React.FC<EffectToggleProps> = ({
  label,
  enabled,
  onToggle,
  experimental = false,
  className = '',
  children
}) => {
  const isEnabled = enabled === true
  const isMixed = enabled === 'Mixed'
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <div style={{ borderBottom: '1px solid #333' }}>
      {/* Toggle header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          background: isHovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          transition: 'background 0.15s'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#ffffff'
          }}>
            {label}
          </span>
          {experimental && (
            <span style={{
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: '500',
              color: '#A78BFA',
              background: 'rgba(167, 139, 250, 0.1)',
              borderRadius: '3px'
            }}>
              Experimental
            </span>
          )}
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          onClick={() => onToggle(!isEnabled)}
          style={{
            position: 'relative',
            display: 'inline-flex',
            height: '24px',
            width: '44px',
            alignItems: 'center',
            borderRadius: '12px',
            background: isMixed ? '#9CA3AF' : (isEnabled ? '#3B82F6' : '#4B5563'),
            transition: 'background 0.2s',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <span
            style={{
              display: 'inline-block',
              height: '16px',
              width: '16px',
              borderRadius: '50%',
              background: '#ffffff',
              transform: isEnabled ? 'translateX(24px)' : 'translateX(4px)',
              transition: 'transform 0.2s'
            }}
          />
          {isMixed && (
            <span style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '12px'
            }}>
              —
            </span>
          )}
        </button>
      </div>

      {/* Fine controls (shown when enabled) */}
      {isEnabled && children && (
        <div style={{ paddingBottom: '12px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

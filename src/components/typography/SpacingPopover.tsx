/**
 * SpacingPopover.tsx
 *
 * Popover for adjusting letter spacing and line height.
 * Updated for FloatingTextToolbar with inline styles.
 */

import React, { useState } from 'react'
import { Popover } from 'antd'
import { Type } from 'lucide-react'

interface SpacingPopoverProps {
  letterSpacing: number | 'Mixed' | undefined
  lineHeight: number | 'Mixed' | undefined
  onLetterSpacingChange: (value: number) => void
  onLineHeightChange: (value: number) => void
}

export const SpacingPopover: React.FC<SpacingPopoverProps> = ({
  letterSpacing,
  lineHeight,
  onLetterSpacingChange,
  onLineHeightChange
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const letterSpacingValue = letterSpacing === 'Mixed' || letterSpacing === undefined ? 0 : letterSpacing
  const lineHeightValue = lineHeight === 'Mixed' || lineHeight === undefined ? 1.2 : lineHeight

  // Popover content
  const content = (
    <div style={{
      width: '240px',
      padding: '12px'
    }}>
      {/* Letter Spacing */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize: '13px',
            fontWeight: '500',
            color: '#374151'
          }}>
            Letter Spacing
          </span>
          <span style={{
            fontSize: '13px',
            color: '#9CA3AF'
          }}>
            {letterSpacing === 'Mixed' ? 'Mixed' : letterSpacingValue.toFixed(1)}
          </span>
        </div>
        <input
          type="range"
          min="-2"
          max="10"
          step="0.1"
          value={letterSpacingValue}
          onChange={(e) => onLetterSpacingChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            appearance: 'none',
            background: '#E5E7EB',
            outline: 'none',
            cursor: 'pointer'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '4px'
        }}>
          <span style={{
            fontSize: '11px',
            color: '#9CA3AF'
          }}>
            Tight
          </span>
          <span style={{
            fontSize: '11px',
            color: '#9CA3AF'
          }}>
            Wide
          </span>
        </div>
      </div>

      {/* Line Height */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize: '13px',
            fontWeight: '500',
            color: '#374151'
          }}>
            Line Height
          </span>
          <span style={{
            fontSize: '13px',
            color: '#9CA3AF'
          }}>
            {lineHeight === 'Mixed' ? 'Mixed' : lineHeightValue.toFixed(1)}
          </span>
        </div>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={lineHeightValue}
          onChange={(e) => onLineHeightChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            appearance: 'none',
            background: '#E5E7EB',
            outline: 'none',
            cursor: 'pointer'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '4px'
        }}>
          <span style={{
            fontSize: '11px',
            color: '#9CA3AF'
          }}>
            Tight
          </span>
          <span style={{
            fontSize: '11px',
            color: '#9CA3AF'
          }}>
            Loose
          </span>
        </div>
      </div>

      {/* Reset button */}
      <button
        type="button"
        onClick={() => {
          onLetterSpacingChange(0)
          onLineHeightChange(1.2)
        }}
        style={{
          width: '100%',
          padding: '6px 12px',
          fontSize: '13px',
          fontWeight: '500',
          color: '#374151',
          background: '#F3F4F6',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background 0.15s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#E5E7EB'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#F3F4F6'
        }}
      >
        Reset to Defaults
      </button>
    </div>
  )

  return (
    <Popover
      content={content}
      trigger="click"
      open={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom"
    >
      <button
        type="button"
        style={{
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #E5E7EB',
          borderRadius: '4px',
          background: '#FFFFFF',
          color: '#374151',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
        title="Letter & Line Spacing"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#F9FAFB'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#FFFFFF'
        }}
      >
        <Type size={16} />
      </button>
    </Popover>
  )
}

/**
 * CaseMenu.tsx
 *
 * Text transform menu (for FloatingTextToolbar).
 * Options: None, UPPERCASE, Title Case, Sentence case
 */

import React, { useState } from 'react'
import { Popover } from 'antd'

const CASE_OPTIONS = [
  { value: 'none', label: 'None', display: 'Aa' },
  { value: 'uppercase', label: 'UPPERCASE', display: 'AA' },
  { value: 'title', label: 'Title Case', display: 'Aa' },
  { value: 'sentence', label: 'Sentence case', display: 'Aa' }
] as const

interface CaseMenuProps {
  value: string | 'Mixed' | undefined
  onChange: (transform: 'none' | 'uppercase' | 'title' | 'sentence') => void
}

export const CaseMenu: React.FC<CaseMenuProps> = ({
  value,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false)

  // Find current option
  const currentOption = CASE_OPTIONS.find(opt => opt.value === value)
  const displayText = value === 'Mixed' ? '—' : (currentOption?.display || 'Aa')

  // Handle selection
  const handleSelect = (caseValue: typeof CASE_OPTIONS[number]['value']) => {
    onChange(caseValue)
    setIsOpen(false)
  }

  // Popover content
  const content = (
    <div style={{
      width: '160px',
      background: '#FFFFFF',
      borderRadius: '6px'
    }}>
      {CASE_OPTIONS.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleSelect(option.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            textAlign: 'left',
            background: value === option.value ? '#EFF6FF' : 'transparent',
            color: value === option.value ? '#1D4ED8' : '#374151',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background 0.15s',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => {
            if (value !== option.value) {
              e.currentTarget.style.background = '#F9FAFB'
            }
          }}
          onMouseLeave={(e) => {
            if (value !== option.value) {
              e.currentTarget.style.background = 'transparent'
            }
          }}
        >
          {option.label}
        </button>
      ))}
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
      <button
        type="button"
        style={{
          width: '38px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
          border: '1px solid #E5E7EB',
          borderRadius: '4px',
          background: '#FFFFFF',
          color: '#374151',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#F9FAFB'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#FFFFFF'
        }}
        title="Text Transform (⌘⇧K)"
      >
        <span>{displayText}</span>
        <svg
          style={{
            width: '12px',
            height: '12px',
            color: '#9CA3AF'
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </Popover>
  )
}

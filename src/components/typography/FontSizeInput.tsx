/**
 * FontSizeInput.tsx
 *
 * Font size input with steppers (for FloatingTextToolbar).
 * Shows: [-] [64] [+] with scrubbable number input.
 */

import React, { useState, useRef } from 'react'
import { Minus, Plus } from 'lucide-react'

interface FontSizeInputProps {
  value: number | 'Mixed' | undefined
  onChange: (size: number) => void
}

export const FontSizeInput: React.FC<FontSizeInputProps> = ({
  value,
  onChange
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const startPosRef = useRef({ x: 0, value: 0 })

  // Display value
  const displayValue = value === 'Mixed' ? '' : (value || 16)

  // Handle increment/decrement
  const increment = () => {
    const current = typeof value === 'number' ? value : 16
    onChange(Math.min(current + 1, 500))
  }

  const decrement = () => {
    const current = typeof value === 'number' ? value : 16
    onChange(Math.max(current - 1, 6))
  }

  // Handle direct input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value)
    if (!isNaN(val) && val >= 6 && val <= 500) {
      onChange(val)
    }
  }

  // Handle scrubbing (drag to change value)
  const handleMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
    if (e.button !== 0) return // Left mouse button only
    setIsDragging(true)
    startPosRef.current = {
      x: e.clientX,
      value: typeof value === 'number' ? value : 16
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startPosRef.current.x
      const deltaValue = Math.round(deltaX / 2) // 2px = 1 unit
      const newValue = Math.max(6, Math.min(500, startPosRef.current.value + deltaValue))
      onChange(newValue)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}
    >
      {/* Decrement button */}
      <button
        type="button"
        onClick={decrement}
        style={{
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #E5E7EB',
          borderRadius: '3px',
          background: '#FFFFFF',
          color: '#374151',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#F9FAFB'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#FFFFFF'
        }}
        title="Decrease (⌘⇧,)"
      >
        <Minus size={12} />
      </button>

      {/* Number input (scrubbable) */}
      <input
        type="number"
        value={displayValue}
        onChange={handleInputChange}
        onMouseDown={handleMouseDown}
        placeholder={value === 'Mixed' ? '—' : ''}
        min={6}
        max={500}
        style={{
          width: '48px',
          height: '24px',
          padding: '0 6px',
          border: '1px solid #E5E7EB',
          borderRadius: '3px',
          background: '#FFFFFF',
          color: '#374151',
          fontSize: '13px',
          textAlign: 'center',
          outline: 'none',
          cursor: isDragging ? 'ew-resize' : 'text',
          userSelect: isDragging ? 'none' : 'auto',
          transition: 'border-color 0.15s'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3B82F6'
          e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#E5E7EB'
          e.target.style.boxShadow = 'none'
        }}
      />

      {/* Increment button */}
      <button
        type="button"
        onClick={increment}
        style={{
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #E5E7EB',
          borderRadius: '3px',
          background: '#FFFFFF',
          color: '#374151',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#F9FAFB'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#FFFFFF'
        }}
        title="Increase (⌘⇧.)"
      >
        <Plus size={12} />
      </button>
    </div>
  )
}

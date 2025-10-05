import React, { useState } from 'react'
import { HexColorPicker, HexColorInput } from 'react-colorful'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  label?: string
}

export function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '6px'
        }}>
          {label}
        </label>
      )}

      {/* Color swatch button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          height: '36px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          background: color,
          cursor: 'pointer',
          position: 'relative',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
        title={color}
      >
        <span style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '11px',
          fontWeight: '600',
          color: '#ffffff',
          textShadow: '0 0 2px rgba(0,0,0,0.8)',
          background: 'rgba(0,0,0,0.2)',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          {color}
        </span>
      </button>

      {/* Popover with picker */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Picker popover */}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '8px',
            background: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}>
            <HexColorPicker color={color} onChange={onChange} />

            <div style={{ marginTop: '12px' }}>
              <HexColorInput
                color={color}
                onChange={onChange}
                prefixed
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  textAlign: 'center'
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

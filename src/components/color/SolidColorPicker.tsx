import React, { useState, useCallback } from 'react'
import { HexColorPicker, HexColorInput } from 'react-colorful'
import type { Paint } from '../../editor/color/types'
import { useEditorStore } from '../../state/editorStore'

interface SolidColorPickerProps {
  initialColor?: string
  onApplyColor: (paint: Paint) => void
}

/**
 * Advanced solid color picker
 * Uses react-colorful for 2D picker + hue slider
 * Includes eyedropper support (native EyeDropper API)
 */
export const SolidColorPicker: React.FC<SolidColorPickerProps> = ({
  initialColor = '#3b82f6',
  onApplyColor
}) => {
  const [color, setColor] = useState(initialColor)
  const [eyedropperSupported] = useState(() => 'EyeDropper' in window)
  const setActivePanelSection = useEditorStore((state) => state.setActivePanelSection)
  const template = useEditorStore((state) => state.template)
  const selectedSlots = useEditorStore((state) => state.selectedSlots)
  const currentPageId = useEditorStore((state) => state.currentPageId)

  // Check if selected slot is text/button (don't show gradient for text)
  const selectedSlot = React.useMemo(() => {
    if (!template || !currentPageId || selectedSlots.length === 0) return null
    const currentPage = template.pages.find(p => p.id === currentPageId)
    if (!currentPage) return null
    return currentPage.slots.find(s => s.name === selectedSlots[0])
  }, [template, currentPageId, selectedSlots])

  const showGradientTab = selectedSlot && !['text', 'button'].includes(selectedSlot.type)

  // Handle color change
  const handleColorChange = useCallback((newColor: string) => {
    setColor(newColor)
    // Apply color in real-time
    onApplyColor({ kind: 'solid', color: newColor })
  }, [onApplyColor])

  // Handle eyedropper
  const handleEyedropper = useCallback(async () => {
    if (!eyedropperSupported) return

    try {
      // @ts-ignore - EyeDropper API not yet in TypeScript
      const eyeDropper = new EyeDropper()
      const result = await eyeDropper.open()
      const pickedColor = result.sRGBHex
      handleColorChange(pickedColor)
    } catch (error) {
      console.log('Eyedropper cancelled or failed:', error)
    }
  }, [eyedropperSupported, handleColorChange])

  return (
    <div style={{
      padding: '16px 12px'
    }}>
      {/* Tabs - Only show gradient tab for shapes/images, not text/buttons */}
      {showGradientTab ? (
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #3a3a3a',
          marginBottom: '16px'
        }}>
          <button
            style={{
              flex: 1,
              padding: '8px',
              background: 'none',
              border: 'none',
              borderBottom: '2px solid #3b82f6',
              color: '#e5e7eb',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Solid color
          </button>
          <button
            onClick={() => setActivePanelSection('gradient-picker')}
            style={{
              flex: 1,
              padding: '8px',
              background: 'none',
              border: 'none',
              borderBottom: '2px solid transparent',
              color: '#e5e7eb',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#3b82f6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#e5e7eb'
            }}
          >
            Gradient
          </button>
        </div>
      ) : (
        <div style={{
          borderBottom: '1px solid #3a3a3a',
          marginBottom: '16px',
          padding: '8px',
          textAlign: 'center'
        }}>
          <span style={{
            color: '#e5e7eb',
            fontSize: '13px',
            fontWeight: '500'
          }}>
            Solid color
          </span>
        </div>
      )}

      {/* Color picker */}
      <div style={{
        marginBottom: '16px'
      }}>
        <HexColorPicker
          color={color}
          onChange={handleColorChange}
          style={{
            width: '100%',
            height: '200px'
          }}
        />
      </div>

      {/* Hex input and eyedropper */}
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#2a2a2a',
          borderRadius: '6px',
          padding: '8px 12px',
          border: '1px solid #3a3a3a'
        }}>
          <span style={{
            color: '#71717a',
            fontSize: '13px'
          }}>
            #
          </span>
          <HexColorInput
            color={color}
            onChange={handleColorChange}
            prefixed={false}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e5e7eb',
              fontSize: '13px',
              fontFamily: 'monospace',
              textTransform: 'uppercase'
            }}
          />
        </div>

        {/* Eyedropper button */}
        <button
          onClick={handleEyedropper}
          disabled={!eyedropperSupported}
          title={eyedropperSupported ? 'Pick color from screen' : 'Eyedropper not supported'}
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: eyedropperSupported ? '#2a2a2a' : '#1f1f1f',
            border: '1px solid #3a3a3a',
            borderRadius: '6px',
            cursor: eyedropperSupported ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
            opacity: eyedropperSupported ? 1 : 0.5
          }}
          onMouseEnter={(e) => {
            if (eyedropperSupported) {
              e.currentTarget.style.backgroundColor = '#3a3a3a'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = eyedropperSupported ? '#2a2a2a' : '#1f1f1f'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M13 3L12 2L10 4L9 5M13 3L14 4L12 6L11 7M13 3L11 5M9 5L11 7M9 5L3 11L2 14L5 13L11 7M9 5L11 7"
              stroke={eyedropperSupported ? '#e5e7eb' : '#52525b'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

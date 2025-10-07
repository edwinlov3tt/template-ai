import React, { useCallback } from 'react'
import type { Paint } from '../../editor/color/types'
import { useEditorStore } from '../../state/editorStore'
import { SearchBox } from './SearchBox'
import { DocumentColors } from './DocumentColors'
import { PhotoColors } from './PhotoColors'
import { DefaultSolidColors } from './DefaultSolidColors'
import { DefaultGradientColors } from './DefaultGradientColors'
import { RecentlyUsed } from './RecentlyUsed'
import { SolidColorPicker } from './SolidColorPicker'
import { GradientColorPicker } from './GradientColorPicker'

/**
 * Main color panel component
 * Canva-style color picker with search, swatches, presets, and advanced picker
 */
export const ColorPanel: React.FC = () => {
  const activePanelSection = useEditorStore((state) => state.activePanelSection)
  const setActivePanelSection = useEditorStore((state) => state.setActivePanelSection)
  const updateSlotFill = useEditorStore((state) => state.updateSlotFill)
  const selectedSlots = useEditorStore((state) => state.selectedSlots)

  // Handle color application
  const handleApplyColor = useCallback((paint: Paint) => {
    // Apply to selected slot (first selected if multiple)
    if (selectedSlots.length > 0) {
      updateSlotFill(selectedSlots[0], paint)
    }
  }, [selectedSlots, updateSlotFill])

  // Handle back navigation
  const handleBack = useCallback(() => {
    setActivePanelSection('main')
  }, [setActivePanelSection])

  // Render expanded view (solid picker, gradient picker, or default colors)
  if (activePanelSection === 'solid-picker' || activePanelSection === 'gradient-picker' || activePanelSection === 'default-colors') {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a1a1a',
        color: '#e5e7eb'
      }}>
        {/* Header with back button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px',
          borderBottom: '1px solid #3a3a3a'
        }}>
          <button
            onClick={handleBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#e5e7eb',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2a2a2a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span style={{
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {activePanelSection === 'solid-picker' ? 'Color Picker' :
             activePanelSection === 'gradient-picker' ? 'Gradient Picker' : 'All Colors'}
          </span>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto'
        }}>
          {activePanelSection === 'solid-picker' && (
            <SolidColorPicker onApplyColor={handleApplyColor} />
          )}
          {activePanelSection === 'gradient-picker' && (
            <GradientColorPicker />
          )}
        </div>
      </div>
    )
  }

  // Render main panel view
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1a1a1a',
      color: '#e5e7eb',
      overflow: 'auto'
    }}>
      <SearchBox onApplyColor={handleApplyColor} />
      <RecentlyUsed onApplyColor={handleApplyColor} />
      <DocumentColors onApplyColor={handleApplyColor} />
      <PhotoColors onApplyColor={handleApplyColor} />
      <DefaultSolidColors onApplyColor={handleApplyColor} />
      <DefaultGradientColors onApplyColor={handleApplyColor} />
    </div>
  )
}

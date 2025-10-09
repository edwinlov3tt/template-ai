import React from 'react'
import { Copy, Lock, Unlock, Trash2 } from 'lucide-react'
import { Tooltip } from 'antd'
import { getDuplicateShortcut, getLockShortcut, getDeleteShortcut } from '../utils/keyboardShortcuts'
import type { Slot } from '../schema/types'

interface LayerActionsChipOverlayProps {
  svgElement: SVGSVGElement | null
  selectedSlot: Slot | null
  frame: { x: number; y: number; width: number; height: number } | null
  zoom: number
  panOffset: { x: number; y: number }
  onDuplicate: () => void
  onToggleLock: () => void
  onRemove: () => void
}

/**
 * DOM-based chip overlay that renders OUTSIDE the SVG
 * Calculates screen position from SVG viewBox coordinates
 * Never gets clipped by overflow: hidden
 */
export const LayerActionsChipOverlay: React.FC<LayerActionsChipOverlayProps> = ({
  svgElement,
  selectedSlot,
  frame,
  zoom,
  panOffset,
  onDuplicate,
  onToggleLock,
  onRemove
}) => {
  if (!svgElement || !selectedSlot || !frame) {
    return null
  }

  // Get SVG bounding box in screen coordinates (already includes zoom from transform)
  const svgRect = svgElement.getBoundingClientRect()

  // Get viewBox to calculate coordinate transformation
  const viewBox = svgElement.viewBox.baseVal
  const viewBoxWidth = viewBox.width
  const viewBoxHeight = viewBox.height

  // Calculate scale from viewBox to screen coordinates (zoom already applied via transform)
  const scaleX = svgRect.width / viewBoxWidth
  const scaleY = svgRect.height / viewBoxHeight

  // Convert element position from viewBox to screen coordinates
  const elementScreenX = svgRect.left + (frame.x - viewBox.x) * scaleX
  const elementScreenY = svgRect.top + (frame.y - viewBox.y) * scaleY
  const elementScreenWidth = frame.width * scaleX
  const elementScreenHeight = frame.height * scaleY

  // Center horizontally on the element
  const screenCenterX = elementScreenX + elementScreenWidth / 2

  // Position chip above the element with 12px gap
  const chipY = elementScreenY - 12

  // Scale factor to ensure chip stays readable at all zoom levels
  // Clamp between 0.8x and 1.2x to prevent extremes
  const chipScale = Math.min(1.2, Math.max(0.8, 100 / zoom))

  return (
    <div
      style={{
        position: 'fixed',
        left: screenCenterX,
        top: chipY,
        transform: 'translate(-50%, -100%)',
        zIndex: 1000,
        pointerEvents: 'auto',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: `${14 * chipScale}px`,  // Increased from 12px, scales with zoom
          padding: `${10 * chipScale}px`,  // Increased from 8px, scales with zoom
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',  // Increased from 6px
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',  // Enhanced shadow
          userSelect: 'none',
          whiteSpace: 'nowrap'
        }}
      >
        {/* Dark pill-shaped layer name */}
        <div
          style={{
            background: '#2D2D2D',
            color: '#FFFFFF',
            padding: `${8 * chipScale}px ${12 * chipScale}px`,  // Increased from 6px 10px, scales
            borderRadius: '20px',  // Increased from 16px
            fontSize: `${16 * chipScale}px`,  // Increased from 13px to 16px, scales
            fontWeight: 600  // Increased from 500
          }}
        >
          {selectedSlot.name}
        </div>

        {/* Action icons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: `${12 * chipScale}px`  // Increased from 10px, scales
        }}>
          {/* Duplicate */}
          <Tooltip title={`Duplicate (${getDuplicateShortcut()})`}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate()
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#4A4A4A',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.6'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Copy size={18 * chipScale} />  {/* Increased from 14 to 18, scales */}
            </button>
          </Tooltip>

          {/* Lock/Unlock */}
          <Tooltip title={`${selectedSlot.locked ? 'Unlock' : 'Lock'} (${getLockShortcut()})`}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleLock()
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#4A4A4A',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.6'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {selectedSlot.locked ? <Lock size={18 * chipScale} /> : <Unlock size={18 * chipScale} />}  {/* Increased from 14 to 18, scales */}
            </button>
          </Tooltip>

          {/* Delete */}
          <Tooltip title={`Delete (${getDeleteShortcut()})`}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#4A4A4A',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.6'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Trash2 size={18 * chipScale} />  {/* Increased from 14 to 18, scales */}
            </button>
          </Tooltip>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

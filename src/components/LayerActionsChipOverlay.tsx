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
          gap: '12px',
          padding: '8px',
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '6px',
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
          userSelect: 'none',
          whiteSpace: 'nowrap'
        }}
      >
        {/* Dark pill-shaped layer name */}
        <div
          style={{
            background: '#2D2D2D',
            color: '#FFFFFF',
            padding: '6px 10px',
            borderRadius: '16px',
            fontSize: '13px',
            fontWeight: 500
          }}
        >
          {selectedSlot.name}
        </div>

        {/* Action icons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
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
              <Copy size={14} />
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
              {selectedSlot.locked ? <Lock size={14} /> : <Unlock size={14} />}
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
              <Trash2 size={14} />
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

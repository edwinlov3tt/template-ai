import React, { useRef, useState } from 'react'
import Moveable from 'react-moveable'
import type { Slot } from '../../schema/types'

export interface SelectionOverlayProps {
  svgElement: SVGSVGElement
  selectedSlots: string[]
  frames: Record<string, { x: number; y: number; width: number; height: number; rotation?: number }>
  slots: Slot[]
  onFrameChange: (slotName: string, frame: { x?: number; y?: number; width?: number; height?: number; rotation?: number }) => void
}

/**
 * Renders moveable handles over selected SVG elements
 * Converts viewBox coordinates to screen coordinates for overlay positioning
 */
export function SelectionOverlay({
  svgElement,
  selectedSlots,
  frames,
  slots,
  onFrameChange
}: SelectionOverlayProps) {
  const targetRef = useRef<HTMLDivElement>(null)
  const moveableRef = useRef<Moveable>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDimensions, setResizeDimensions] = useState<{ width: number; height: number } | null>(null)

  // Only handle single selection for now
  const selectedSlot = selectedSlots[0]
  if (!selectedSlot) return null

  const frame = frames[selectedSlot]
  const slot = slots.find(s => s.name === selectedSlot)

  if (!frame || !slot || (slot as any).locked) return null

  // Get the SVG's screen CTM for coordinate transformation
  const ctm = svgElement.getScreenCTM()
  if (!ctm) return null

  // Convert frame viewBox coordinates to screen coordinates
  const topLeft = svgElement.createSVGPoint()
  topLeft.x = frame.x
  topLeft.y = frame.y
  const screenTopLeft = topLeft.matrixTransform(ctm)

  const bottomRight = svgElement.createSVGPoint()
  bottomRight.x = frame.x + frame.width
  bottomRight.y = frame.y + frame.height
  const screenBottomRight = bottomRight.matrixTransform(ctm)

  const screenWidth = screenBottomRight.x - screenTopLeft.x
  const screenHeight = screenBottomRight.y - screenTopLeft.y

  return (
    <>
      {/* Target div positioned exactly over the SVG element */}
      <div
        ref={targetRef}
        style={{
          position: 'absolute',
          left: `${screenTopLeft.x}px`,
          top: `${screenTopLeft.y}px`,
          width: `${screenWidth}px`,
          height: `${screenHeight}px`,
          pointerEvents: isDragging ? 'auto' : 'none',
          zIndex: 1000
        }}
      />

      {/* Moveable handles */}
      {targetRef.current && (
        <Moveable
          ref={moveableRef}
          target={targetRef.current}
          draggable={true}
          resizable={true}
          rotatable={true}
          snappable={true}
          snapThreshold={5}
          snapGridWidth={10}
          snapGridHeight={10}
          origin={false}
          keepRatio={false}

          // Canva-style visual styling
          renderDirections={['nw', 'ne', 'sw', 'se', 'n', 'e', 's', 'w']}
          edge={true}

          // Custom control styles (Canva-like)
          className="moveable-control"

          // Drag handlers
          onDragStart={() => setIsDragging(true)}
          onDrag={(e) => {
            // Convert screen delta to viewBox delta
            const deltaX = e.delta[0] / ctm.a
            const deltaY = e.delta[1] / ctm.d

            onFrameChange(selectedSlot, {
              x: frame.x + deltaX,
              y: frame.y + deltaY
            })
          }}
          onDragEnd={() => setIsDragging(false)}

          // Resize handlers
          onResizeStart={() => {
            setIsDragging(true)
            setIsResizing(true)
          }}
          onResize={(e) => {
            // Convert screen dimensions to viewBox dimensions
            const newWidth = e.width / ctm.a
            const newHeight = e.height / ctm.d
            const deltaX = e.delta[0] / ctm.a
            const deltaY = e.delta[1] / ctm.d

            // Update dimensions display
            setResizeDimensions({
              width: Math.round(newWidth),
              height: Math.round(newHeight)
            })

            onFrameChange(selectedSlot, {
              x: frame.x + deltaX,
              y: frame.y + deltaY,
              width: newWidth,
              height: newHeight
            })
          }}
          onResizeEnd={() => {
            setIsDragging(false)
            setIsResizing(false)
            setResizeDimensions(null)
          }}

          // Rotation handlers
          onRotateStart={() => setIsDragging(true)}
          onRotate={(e) => {
            onFrameChange(selectedSlot, {
              rotation: e.rotate
            })
          }}
          onRotateEnd={() => setIsDragging(false)}
        />
      )}

      {/* Resize Dimensions Display */}
      {isResizing && resizeDimensions && (
        <div style={{
          position: 'absolute',
          left: `${screenTopLeft.x + screenWidth / 2}px`,
          top: `${screenTopLeft.y - 30}px`,
          transform: 'translateX(-50%)',
          background: '#1f2937',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          pointerEvents: 'none',
          zIndex: 1001,
          whiteSpace: 'nowrap'
        }}>
          {resizeDimensions.width} × {resizeDimensions.height}
        </div>
      )}

      {/* Custom CSS for viewport-relative handles */}
      <style>{`
        /* Selection border - thicker with rounded corners */
        .moveable-control .moveable-line {
          background: #3b82f6 !important;
          width: 2px !important;
          height: 2px !important;
        }
        .moveable-control .moveable-control-box {
          border: 2px solid #3b82f6 !important;
          border-radius: 8px !important;
        }

        /* Corner handles - larger circles */
        .moveable-control .moveable-control {
          width: 12px !important;
          height: 12px !important;
          margin-top: -6px !important;
          margin-left: -6px !important;
          border: 2px solid #3b82f6 !important;
          background: white !important;
          border-radius: 50% !important;
        }

        /* Edge handles - rectangular bars */
        .moveable-control .moveable-direction.moveable-n,
        .moveable-control .moveable-direction.moveable-s {
          width: 20px !important;
          height: 8px !important;
          margin-top: -4px !important;
          margin-left: -10px !important;
          background: white !important;
          border: 2px solid #3b82f6 !important;
          border-radius: 2px !important;
        }
        .moveable-control .moveable-direction.moveable-e,
        .moveable-control .moveable-direction.moveable-w {
          width: 8px !important;
          height: 20px !important;
          margin-top: -10px !important;
          margin-left: -4px !important;
          background: white !important;
          border: 2px solid #3b82f6 !important;
          border-radius: 2px !important;
        }

        /* Rotation handle - below element */
        .moveable-control .moveable-rotation {
          width: 20px !important;
          height: 20px !important;
          margin-top: -40px !important;
          margin-left: -10px !important;
          border: 2px solid #3b82f6 !important;
          background: white !important;
          border-radius: 50% !important;
        }
        .moveable-control .moveable-rotation .moveable-rotation-control {
          display: none !important;
        }
      `}</style>
    </>
  )
}

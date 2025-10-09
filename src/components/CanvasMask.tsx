import React from 'react'

interface CanvasMaskProps {
  width: number
  height: number
  children: React.ReactNode
  backgroundColor?: string
  borderRadius?: string  // Keep as prop for flexibility
}

/**
 * Canvas mask wrapper that handles clipping and handle bleed
 * - Inner container clips slot content with overflow:hidden
 * - Outer container has padding for selection handle bleed
 * - Content is translated to compensate for padding
 */
export function CanvasMask({
  width,
  height,
  children,
  backgroundColor = '#ffffff',
  borderRadius = '0'  // Changed default from 12px to 0 for square canvas
}: CanvasMaskProps) {
  // Padding for handle bleed (handles can extend 24px beyond canvas edge)
  const handleBleed = 24

  return (
    <div
      className="canvas-mask-outer"
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        padding: `${handleBleed}px`,
        margin: `-${handleBleed}px`, // Negative margin to counteract padding
        pointerEvents: 'none' // Allow clicks to pass through to children
      }}
    >
      <div
        className="canvas-mask-inner"
        style={{
          position: 'relative',
          width: `${width}px`,
          height: `${height}px`,
          background: backgroundColor,
          borderRadius,
          overflow: 'hidden', // Clip slot content
          pointerEvents: 'auto' // Re-enable pointer events for content
        }}
      >
        {children}
      </div>
    </div>
  )
}

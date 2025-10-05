import React from 'react'
import type { SnapGuide } from '../utils/smartSnapping'

export interface SmartGuidesProps {
  svgElement: SVGSVGElement
  guides: SnapGuide[]
  viewBox: [number, number, number, number]
}

/**
 * Renders smart alignment guides with viewport-relative styling
 * Shows vertical and horizontal snap lines when elements align
 */
export function SmartGuides({ svgElement, guides, viewBox }: SmartGuidesProps) {
  if (guides.length === 0) return null

  // Get current zoom/scale from CTM for viewport-relative styling
  const ctm = svgElement.getScreenCTM()
  const scale = ctm ? ctm.a : 1

  const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox

  // Viewport-relative sizes
  const strokeWidth = 1.5 / scale
  const fontSize = 11 / scale
  const labelPadding = 4 / scale
  const labelHeight = 18 / scale

  return (
    <g className="smart-guides" style={{ pointerEvents: 'none' }}>
      {guides.map((guide, index) => {
        const isVertical = guide.type === 'vertical'
        const color = guide.color || '#3b82f6'
        const isCenterGuide = guide.label === 'Center'

        if (isVertical) {
          // Vertical guide line
          return (
            <g key={`guide-${index}`}>
              {/* Guide line */}
              <line
                x1={guide.position}
                y1={viewBoxY}
                x2={guide.position}
                y2={viewBoxY + viewBoxHeight}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={isCenterGuide ? '4,2' : '6,3'}
                opacity={isCenterGuide ? 0.8 : 0.6}
              />

              {/* Label (if provided) */}
              {guide.label && (
                <g transform={`translate(${guide.position}, ${viewBoxY + viewBoxHeight / 2})`}>
                  <rect
                    x={labelPadding}
                    y={-labelHeight / 2}
                    width={50 / scale}
                    height={labelHeight}
                    fill={color}
                    rx={3 / scale}
                  />
                  <text
                    x={labelPadding + 25 / scale}
                    y={fontSize / 3}
                    fill="white"
                    fontSize={fontSize}
                    fontFamily="Inter, sans-serif"
                    fontWeight="500"
                    textAnchor="middle"
                  >
                    {guide.label}
                  </text>
                </g>
              )}
            </g>
          )
        } else {
          // Horizontal guide line
          return (
            <g key={`guide-${index}`}>
              {/* Guide line */}
              <line
                x1={viewBoxX}
                y1={guide.position}
                x2={viewBoxX + viewBoxWidth}
                y2={guide.position}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={isCenterGuide ? '4,2' : '6,3'}
                opacity={isCenterGuide ? 0.8 : 0.6}
              />

              {/* Label (if provided) */}
              {guide.label && (
                <g transform={`translate(${viewBoxX + viewBoxWidth / 2}, ${guide.position})`}>
                  <rect
                    x={-25 / scale}
                    y={-labelHeight - labelPadding}
                    width={50 / scale}
                    height={labelHeight}
                    fill={color}
                    rx={3 / scale}
                  />
                  <text
                    x={0}
                    y={-labelHeight / 2 - labelPadding + fontSize / 3}
                    fill="white"
                    fontSize={fontSize}
                    fontFamily="Inter, sans-serif"
                    fontWeight="500"
                    textAnchor="middle"
                  >
                    {guide.label}
                  </text>
                </g>
              )}
            </g>
          )
        }
      })}
    </g>
  )
}

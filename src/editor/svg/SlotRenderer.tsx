import React from 'react'
import type { Slot, Template } from '../../schema/types'
import { createTransform } from '../../utils/svgTransforms'
import { shapeRegistry, type ShapeDefinition } from '../../shapes/registry'
import { renderShapeGeometry } from '../../shapes/render'

export interface SlotRendererProps {
  slot: Slot
  frame: { x: number; y: number; width: number; height: number; rotation?: number }
  template: Template
  isSelected: boolean
  onPointerDown?: (e: React.MouseEvent<SVGGElement>) => void
}

/**
 * Renders a single template slot as SVG elements
 * Handles image, text, shape, and button slot types
 */
export function SlotRenderer({ slot, frame, template, isSelected, onPointerDown }: SlotRendererProps) {
  const { x, y, width, height, rotation = 0 } = frame

  // Use native SVG positioning - no transforms needed!
  // The viewBox handles all coordinate mapping automatically

  // Common props for interactive elements
  const interactiveProps = {
    onMouseDown: (e: React.MouseEvent<SVGGElement>) => {
      onPointerDown?.(e)
    },
    onClick: (e: React.MouseEvent<SVGGElement>) => {
      e.stopPropagation()
    },
    style: {
      cursor: slot.locked ? 'default' : 'move',
      pointerEvents: slot.locked ? 'none' : 'auto'
    } as React.CSSProperties,
    'data-slot-name': slot.name,
    'data-slot-type': slot.type
  }

  // Don't render if not visible
  if (slot.visible === false) {
    return null
  }

  switch (slot.type) {
    case 'image': {
      const href = (slot as any).href
      if (!href) {
        // Placeholder for missing image
        return (
          <g {...interactiveProps}>
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill="#e5e7eb"
              stroke="#9ca3af"
              strokeWidth="2"
            />
            <text
              x={x + width / 2}
              y={y + height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#6b7280"
              fontSize="14"
              fontFamily="Inter, sans-serif"
            >
              No Image
            </text>
          </g>
        )
      }

      return (
        <g {...interactiveProps}>
          <image
            href={href}
            xlinkHref={href} // Fallback for older SVG viewers
            x={x}
            y={y}
            width={width}
            height={height}
            preserveAspectRatio={
              slot.fit === 'cover'
                ? 'xMidYMid slice'
                : slot.fit === 'contain'
                ? 'xMidYMid meet'
                : 'none'
            }
          />
          {/* Overlay if specified */}
          {slot.overlay && (
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill={slot.overlay.fill}
              opacity={slot.overlay.alpha}
            />
          )}
        </g>
      )
    }

    case 'text': {
      const content = slot.content || template.sample?.[slot.name] || ''

      // Don't render text slots with no content (Canva text is converted to paths)
      if (!content) {
        return null
      }

      const fontSize = slot.fontSize || 16
      const fontFamily = slot.fontFamily || template.tokens.typography.heading?.family || 'Inter'
      const fontWeight = slot.fontWeight || 'normal'
      const fill = slot.fill || '#000000'
      const textAlign = slot.textAlign || 'left'

      let textAnchor: 'start' | 'middle' | 'end' = 'start'
      let xPos = x
      if (textAlign === 'center') {
        textAnchor = 'middle'
        xPos = x + width / 2
      } else if (textAlign === 'right') {
        textAnchor = 'end'
        xPos = x + width
      }

      return (
        <g {...interactiveProps}>
          <text
            x={xPos}
            y={y + fontSize}
            fill={fill}
            fontSize={fontSize}
            fontFamily={fontFamily}
            fontWeight={fontWeight}
            textAnchor={textAnchor}
          >
            {content}
          </text>
        </g>
      )
    }

    case 'shape': {
      const fill = slot.fill ?? template.tokens.palette.neutral ?? '#e5e7eb'
      const stroke = slot.stroke ?? '#111827'
      const strokeWidth = slot.strokeWidth ?? 2
      const opacity = slot.opacity ?? 1
      const pathData = (slot as any).d

      // Back-compat: shapes imported as raw paths
      if (pathData && !slot.shape) {
        const transform = createTransform(x, y, rotation)
        return (
          <g {...interactiveProps} transform={transform}>
            <path
              d={pathData}
              fill={fill}
              stroke={slot.stroke}
              strokeWidth={slot.strokeWidth ?? (slot.stroke ? slot.strokeWidth ?? 2 : 0)}
              opacity={opacity}
            />
          </g>
        )
      }

      const shapeId = slot.shape?.id ?? 'rectangle'
      const definition: ShapeDefinition | undefined = shapeRegistry[shapeId as keyof typeof shapeRegistry]

      if (!definition) {
        console.warn(`[SlotRenderer] Unknown shape id: ${shapeId}`)
        return null
      }

      const geometry = definition.geometry({ width, height, slot })
      const translatedTransform = buildShapeTransform(x, y, width, height, rotation)
      const markerEndAttr = slot.markerEnd ? 'url(#arrow-end)' : undefined

      return (
        <g {...interactiveProps} transform={translatedTransform}>
          {renderShapeGeometry({
            geometry,
            width,
            height,
            fill,
            stroke,
            strokeWidth,
            opacity,
            markerEnd: markerEndAttr
          })}
        </g>
      )
    }

    case 'button': {
      const chipFill =
        slot.chip?.fill === 'neutral'
          ? template.tokens.palette.neutral
          : slot.fill || template.tokens.palette.accent || '#000000'
      const chipRadius = slot.chip?.radius || slot.rx || 8
      const content = slot.content || template.sample?.[slot.name] || 'Click Here'
      const fontSize = slot.fontSize || 16
      const fontFamily = slot.fontFamily || template.tokens.typography.cta?.family || 'Inter'
      const fontWeight = slot.fontWeight || '600'

      return (
        <g {...interactiveProps}>
          {/* Button background */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={chipFill}
            rx={chipRadius}
            ry={chipRadius}
          />
          {/* Button text */}
          <text
            x={x + width / 2}
            y={y + height / 2}
            fill="#ffffff"
            fontSize={fontSize}
            fontFamily={fontFamily}
            fontWeight={fontWeight}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {content}
          </text>
        </g>
      )
    }

    default:
      return null
  }
}

function buildShapeTransform(x: number, y: number, width: number, height: number, rotation: number) {
  if (!rotation) {
    return `translate(${x} ${y})`
  }

  const cx = x + width / 2
  const cy = y + height / 2
  return `translate(${cx} ${cy}) rotate(${rotation}) translate(${-width / 2} ${-height / 2})`
}

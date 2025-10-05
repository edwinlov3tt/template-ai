import React from 'react'
import { shapeAssets } from './registry'
import type { ShapeGeometry } from './registry'

export interface RenderShapeArgs {
  geometry: ShapeGeometry
  width: number
  height: number
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
  markerEnd?: string
}

export function renderShapeGeometry({ geometry, width, height, fill, stroke, strokeWidth, opacity, markerEnd }: RenderShapeArgs) {
  switch (geometry.type) {
    case 'rect':
      return (
        <rect
          width={width}
          height={height}
          rx={geometry.rx}
          ry={geometry.ry ?? geometry.rx}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
        />
      )

    case 'ellipse':
      return (
        <ellipse
          cx={width / 2}
          cy={height / 2}
          rx={width / 2}
          ry={height / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
        />
      )

    case 'polygon':
      return (
        <polygon
          points={geometry.points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
        />
      )

    case 'line':
      return (
        <line
          x1={geometry.x1}
          y1={geometry.y1}
          x2={geometry.x2}
          y2={geometry.y2}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
          markerEnd={markerEnd}
          strokeLinecap="round"
          fill="none"
        />
      )

    case 'asset': {
      const asset = shapeAssets[geometry.assetKey]
      if (!asset) {
        console.warn(`[renderShapeGeometry] Missing asset for key: ${geometry.assetKey}`)
        return null
      }

      const [vbX, vbY, vbW, vbH] = asset.viewBox.split(/\s+/).map(Number)
      const scaleX = width / vbW
      const scaleY = height / vbH
      const translateX = -vbX
      const translateY = -vbY
      const assetTransform = `translate(${translateX} ${translateY}) scale(${scaleX} ${scaleY})`
      const adjustedStrokeWidth = strokeWidth / Math.max(scaleX, scaleY)

      return (
        <g transform={assetTransform}>
          <path
            d={asset.d}
            fill={fill}
            stroke={stroke}
            strokeWidth={adjustedStrokeWidth}
            opacity={opacity}
            markerEnd={markerEnd}
          />
        </g>
      )
    }

    default:
      return null
  }
}

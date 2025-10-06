/**
 * ShadowControls.tsx
 *
 * Fine controls for text shadow effect.
 */

import React from 'react'

interface ShadowParams {
  dx: number
  dy: number
  blur: number
  color: string
  alpha: number
}

interface ShadowControlsProps {
  params: ShadowParams | 'Mixed' | undefined
  onChange: (params: ShadowParams) => void
}

export const ShadowControls: React.FC<ShadowControlsProps> = ({
  params,
  onChange
}) => {
  const values: ShadowParams = params === 'Mixed' || !params
    ? { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 }
    : params

  // Calculate offset and direction from dx/dy
  const offset = Math.sqrt(values.dx ** 2 + values.dy ** 2)
  const direction = Math.atan2(values.dy, values.dx) * (180 / Math.PI)

  const handleOffsetChange = (newOffset: number) => {
    const rad = (direction * Math.PI) / 180
    onChange({
      ...values,
      dx: Math.cos(rad) * newOffset,
      dy: Math.sin(rad) * newOffset
    })
  }

  const handleDirectionChange = (newDirection: number) => {
    const rad = (newDirection * Math.PI) / 180
    onChange({
      ...values,
      dx: Math.cos(rad) * offset,
      dy: Math.sin(rad) * offset
    })
  }

  return (
    <div className="space-y-3">
      {/* Offset */}
      <div>
        <label className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Offset</span>
          <span>{offset.toFixed(1)}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={offset}
          onChange={(e) => handleOffsetChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Direction */}
      <div>
        <label className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Direction</span>
          <span>{Math.round(direction)}°</span>
        </label>
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          value={direction}
          onChange={(e) => handleDirectionChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Blur */}
      <div>
        <label className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Blur</span>
          <span>{values.blur}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={values.blur}
          onChange={(e) => onChange({ ...values, blur: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Alpha/Transparency */}
      <div>
        <label className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Transparency</span>
          <span>{Math.round(values.alpha * 100)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={values.alpha}
          onChange={(e) => onChange({ ...values, alpha: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Color */}
      <div>
        <label className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Color</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={values.color}
            onChange={(e) => onChange({ ...values, color: e.target.value })}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={values.color}
            onChange={(e) => onChange({ ...values, color: e.target.value })}
            className="flex-1 px-2 py-1 text-xs border rounded"
          />
        </div>
      </div>
    </div>
  )
}

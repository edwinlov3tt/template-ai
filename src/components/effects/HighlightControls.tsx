/**
 * HighlightControls.tsx
 *
 * Fine controls for background highlight effect.
 */

import React from 'react'

interface HighlightParams {
  fill: string
  padding: [number, number]
}

interface HighlightControlsProps {
  params: HighlightParams | 'Mixed' | undefined
  onChange: (params: HighlightParams) => void
}

export const HighlightControls: React.FC<HighlightControlsProps> = ({
  params,
  onChange
}) => {
  const values: HighlightParams = params === 'Mixed' || !params
    ? { fill: '#000000', padding: [8, 4] }
    : params

  return (
    <div className="space-y-3">
      {/* Fill Color */}
      <div>
        <label className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Fill Color</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={values.fill}
            onChange={(e) => onChange({ ...values, fill: e.target.value })}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={values.fill}
            onChange={(e) => onChange({ ...values, fill: e.target.value })}
            className="flex-1 px-2 py-1 text-xs border rounded"
          />
        </div>
      </div>

      {/* Padding X */}
      <div>
        <label className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Padding X</span>
          <span>{values.padding[0]}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={values.padding[0]}
          onChange={(e) => onChange({ ...values, padding: [parseFloat(e.target.value), values.padding[1]] })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Padding Y */}
      <div>
        <label className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Padding Y</span>
          <span>{values.padding[1]}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={values.padding[1]}
          onChange={(e) => onChange({ ...values, padding: [values.padding[0], parseFloat(e.target.value)] })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
    </div>
  )
}

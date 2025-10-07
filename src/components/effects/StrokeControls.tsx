/**
 * StrokeControls.tsx
 *
 * Fine controls for text stroke effect.
 */

import React from 'react'

interface StrokeConfig {
  width: number
  color: string
  paintOrder?: string
}

interface StrokeControlsProps {
  config: StrokeConfig | 'Mixed' | undefined
  onChange: (config: StrokeConfig) => void
}

export const StrokeControls: React.FC<StrokeControlsProps> = ({
  config,
  onChange
}) => {
  const values: StrokeConfig = config === 'Mixed' || !config
    ? { width: 2, color: '#000000', paintOrder: 'fill stroke' }
    : config

  return (
    <div className="space-y-3">
      {/* Width */}
      <div>
        <label className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Width</span>
          <span>{values.width}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="20"
          step="0.5"
          value={values.width}
          onChange={(e) => onChange({ ...values, width: parseFloat(e.target.value) })}
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

      {/* Paint Order */}
      <div>
        <label className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Paint Order</span>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...values, paintOrder: 'fill stroke' })}
            className={`
              flex-1 px-2 py-1 text-xs border rounded transition-colors
              ${values.paintOrder === 'fill stroke' || !values.paintOrder
                ? 'bg-blue-100 border-blue-500 text-blue-700'
                : 'bg-white hover:bg-gray-50'
              }
            `}
          >
            Fill over Stroke
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...values, paintOrder: 'stroke fill' })}
            className={`
              flex-1 px-2 py-1 text-xs border rounded transition-colors
              ${values.paintOrder === 'stroke fill'
                ? 'bg-blue-100 border-blue-500 text-blue-700'
                : 'bg-white hover:bg-gray-50'
              }
            `}
          >
            Stroke over Fill
          </button>
        </div>
      </div>
    </div>
  )
}

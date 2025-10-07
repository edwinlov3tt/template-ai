import React from 'react'
import type { Paint } from '../../editor/color/types'
import { ColorSwatch } from './ColorSwatch'
import { DEFAULT_GRADIENTS } from '../../editor/color/defaultPalettes'

interface DefaultGradientColorsProps {
  onApplyColor: (paint: Paint) => void
}

/**
 * Default gradient colors section
 * Shows curated gradient swatches (3 rows × 7 columns)
 */
export const DefaultGradientColors: React.FC<DefaultGradientColorsProps> = ({ onApplyColor }) => {
  // Show first 21 gradients (3 rows × 7 columns)
  const previewGradients = DEFAULT_GRADIENTS.slice(0, 21)

  return (
    <div style={{
      padding: '16px 12px',
      borderBottom: '1px solid #3a3a3a'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <span style={{
          color: '#e5e7eb',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Default gradient colors
        </span>
      </div>

      {/* Gradient grid - 3 rows × 7 columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px'
      }}>
        {previewGradients.map((gradient, index) => (
          <ColorSwatch
            key={index}
            paint={gradient}
            onClick={() => onApplyColor(gradient)}
            ariaLabel={`Gradient ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

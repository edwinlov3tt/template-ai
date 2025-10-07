import React from 'react'
import type { Paint } from '../../editor/color/types'
import { ColorSwatch } from './ColorSwatch'
import { DEFAULT_SOLID_COLORS } from '../../editor/color/defaultPalettes'
import { useEditorStore } from '../../state/editorStore'

interface DefaultSolidColorsProps {
  onApplyColor: (paint: Paint) => void
}

/**
 * Default solid colors section
 * Shows static color grid (4 rows × 7 columns preview, expandable to full 98 colors)
 */
export const DefaultSolidColors: React.FC<DefaultSolidColorsProps> = ({ onApplyColor }) => {
  const setActivePanelSection = useEditorStore((state) => state.setActivePanelSection)

  // Show first 28 colors (4 rows × 7 columns)
  const previewColors = DEFAULT_SOLID_COLORS.slice(0, 28)

  const handleSeeAll = () => {
    setActivePanelSection('default-colors')
  }

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
          Default solid colors
        </span>

        <button
          onClick={handleSeeAll}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1e3a8a'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          See all
        </button>
      </div>

      {/* Color grid - 4 rows × 7 columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px'
      }}>
        {previewColors.map((color, index) => (
          <ColorSwatch
            key={index}
            paint={{ kind: 'solid', color }}
            onClick={() => onApplyColor({ kind: 'solid', color })}
            ariaLabel={`Color ${color}`}
          />
        ))}
      </div>
    </div>
  )
}

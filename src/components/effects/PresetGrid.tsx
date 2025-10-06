/**
 * PresetGrid.tsx
 *
 * Grid of visual effect preset tiles (Canva-style).
 */

import React from 'react'
import type { EffectPresetName } from '../../editor/effects/presets'

interface PresetGridProps {
  selectedPreset?: EffectPresetName
  onPresetClick: (preset: EffectPresetName) => void
  className?: string
}

const PRESET_DISPLAY: Array<{ name: EffectPresetName; label: string }> = [
  { name: 'none', label: 'None' },
  { name: 'shadow', label: 'Shadow' },
  { name: 'lift', label: 'Lift' },
  { name: 'hollow', label: 'Hollow' },
  { name: 'outline', label: 'Outline' },
  { name: 'echo', label: 'Echo' },
  { name: 'glitch', label: 'Glitch' },
  { name: 'neon', label: 'Neon' },
  { name: 'background', label: 'Background' }
]

export const PresetGrid: React.FC<PresetGridProps> = ({
  selectedPreset,
  onPresetClick,
  className = ''
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '8px'
    }}>
      {PRESET_DISPLAY.map(({ name, label }) => (
        <button
          key={name}
          type="button"
          onClick={() => onPresetClick(name)}
          style={{
            position: 'relative',
            width: '100%',
            height: '80px',
            borderRadius: '8px',
            border: `2px solid ${selectedPreset === name ? '#3B82F6' : '#E5E7EB'}`,
            background: selectedPreset === name ? '#EFF6FF' : '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            if (selectedPreset !== name) {
              e.currentTarget.style.borderColor = '#D1D5DB'
              e.currentTarget.style.background = '#F9FAFB'
            }
          }}
          onMouseLeave={(e) => {
            if (selectedPreset !== name) {
              e.currentTarget.style.borderColor = '#E5E7EB'
              e.currentTarget.style.background = '#FFFFFF'
            }
          }}
        >
          {/* Preview */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                userSelect: 'none',
                ...getPresetStyle(name)
              }}
            >
              Ag
            </span>
          </div>

          {/* Label */}
          <div style={{
            position: 'absolute',
            bottom: '4px',
            left: 0,
            right: 0,
            textAlign: 'center'
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: '500',
              color: '#6B7280'
            }}>
              {label}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}

/**
 * Get inline styles to preview effect style
 */
function getPresetStyle(preset: EffectPresetName): React.CSSProperties {
  switch (preset) {
    case 'none':
      return { color: '#111827' }
    case 'shadow':
      return {
        color: '#111827',
        filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))'
      }
    case 'lift':
      return {
        color: '#111827',
        filter: 'drop-shadow(0 20px 13px rgb(0 0 0 / 0.03)) drop-shadow(0 8px 5px rgb(0 0 0 / 0.08))'
      }
    case 'hollow':
      return {
        color: 'transparent',
        textShadow: '0 0 2px #000, 0 0 2px #000, 0 0 2px #000, 0 0 2px #000'
      }
    case 'outline':
      return {
        color: '#111827',
        textShadow: '0 0 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
      }
    case 'echo':
      return {
        color: '#111827',
        textShadow: '2px 2px 0 rgba(0,0,0,0.4), 4px 4px 0 rgba(0,0,0,0.3), 6px 6px 0 rgba(0,0,0,0.2)'
      }
    case 'glitch':
      return {
        color: '#111827',
        textShadow: '2px 0 0 #ff00ff, -2px 0 0 #00ffff'
      }
    case 'neon':
      return {
        color: '#ec4899',
        textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff'
      }
    case 'background':
      return {
        color: '#ffffff',
        background: '#000000',
        padding: '0 8px'
      }
    default:
      return { color: '#111827' }
  }
}

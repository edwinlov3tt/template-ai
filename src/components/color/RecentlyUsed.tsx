import React from 'react'
import type { Paint } from '../../editor/color/types'
import { ColorSwatch } from './ColorSwatch'
import { useEditorStore } from '../../state/editorStore'

interface RecentlyUsedProps {
  onApplyColor: (paint: Paint) => void
}

/**
 * Recently used colors section
 * Shows last 10 colors in LRU order
 */
export const RecentlyUsed: React.FC<RecentlyUsedProps> = ({ onApplyColor }) => {
  const recentPaints = useEditorStore((state) => state.recentPaints)

  if (recentPaints.length === 0) {
    return null
  }

  return (
    <div style={{
      padding: '16px 12px',
      borderBottom: '1px solid #3a3a3a'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '12px'
      }}>
        <span style={{
          color: '#e5e7eb',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Recently used
        </span>
      </div>

      {/* Recent colors */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {recentPaints.map((paint, index) => (
          <ColorSwatch
            key={index}
            paint={paint}
            onClick={() => onApplyColor(paint)}
            ariaLabel={`Recent color ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

import React from 'react'
import { Copy, Lock, Unlock, Trash2 } from 'lucide-react'
import { Tooltip } from 'antd'
import { getDuplicateShortcut, getLockShortcut, getDeleteShortcut } from '../../utils/keyboardShortcuts'

interface LayerActionsChipProps {
  layerName: string
  isLocked: boolean
  position: { x: number; y: number }
  scale: number
  onDuplicate: () => void
  onToggleLock: () => void
  onRemove: () => void
}

export const LayerActionsChip: React.FC<LayerActionsChipProps> = ({
  layerName,
  isLocked,
  position,
  scale,
  onDuplicate,
  onToggleLock,
  onRemove
}) => {
  // Viewport-relative sizing
  const iconSize = 14 / scale
  const iconSpacing = 10 / scale
  const pillPaddingH = 10 / scale
  const pillPaddingV = 6 / scale
  const pillRadius = 16 / scale
  const containerPadding = 8 / scale

  return (
    <foreignObject
      x={position.x}
      y={position.y}
      width={1}
      height={1}
      style={{
        overflow: 'visible',
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translate(-50%, -100%)',
          marginTop: `-${12 / scale}px`,
          pointerEvents: 'auto',
          animation: 'fadeIn 0.15s ease-out'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: `${12 / scale}px`,
            padding: `${containerPadding}px`,
            background: '#FFFFFF',
            border: `${1 / scale}px solid #E5E7EB`,
            borderRadius: `${6 / scale}px`,
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
            userSelect: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          {/* Dark pill-shaped layer name button */}
          <div
            style={{
              background: '#2D2D2D',
              color: '#FFFFFF',
              padding: `${pillPaddingV}px ${pillPaddingH}px`,
              borderRadius: `${pillRadius}px`,
              fontSize: `${13 / scale}px`,
              fontWeight: 500
            }}
          >
            {layerName}
          </div>

          {/* Icons container */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: `${iconSpacing}px`
          }}>

            {/* Duplicate Icon */}
            <Tooltip title={`Duplicate (${getDuplicateShortcut()})`}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate()
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#4A4A4A',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'opacity 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.6'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <Copy size={iconSize} />
              </button>
            </Tooltip>

            {/* Lock Icon */}
            <Tooltip title={`${isLocked ? 'Unlock' : 'Lock'} (${getLockShortcut()})`}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleLock()
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#4A4A4A',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'opacity 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.6'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                {isLocked ? <Lock size={iconSize} /> : <Unlock size={iconSize} />}
              </button>
            </Tooltip>

            {/* Delete Icon */}
            <Tooltip title={`Delete (${getDeleteShortcut()})`}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#4A4A4A',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'opacity 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.6'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <Trash2 size={iconSize} />
              </button>
            </Tooltip>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </foreignObject>
  )
}

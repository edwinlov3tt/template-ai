import React, { useState } from 'react'
import { Square, SquareDashed, Circle, Grid3x3 } from 'lucide-react'
import { Popover } from 'antd'
import type { Slot } from '../schema/types'
import { ColorControl, SliderControl, NumberControl } from './controls/PropertyControls'

interface PropertiesToolbarProps {
  selectedSlot: string | null
  slot: Slot | null
  onUpdateSlot?: (slotId: string, updates: Partial<Slot>) => void
  onOpenColorPanel?: () => void
}

export function PropertiesToolbar({ selectedSlot, slot, onUpdateSlot, onOpenColorPanel }: PropertiesToolbarProps) {
  // All hooks must be called before any early returns
  const [fillPopoverOpen, setFillPopoverOpen] = useState(false)
  const [borderPopoverOpen, setBorderPopoverOpen] = useState(false)
  const [radiusPopoverOpen, setRadiusPopoverOpen] = useState(false)

  // Early return AFTER all hooks
  if (!selectedSlot || !slot || slot.type !== 'shape') return null

  // Handle property updates
  const handleUpdate = (updates: Partial<Slot>) => {
    if (onUpdateSlot) {
      onUpdateSlot(selectedSlot, updates)
    }
  }

  // Fill control popover content
  const fillContent = (
    <div>
      <ColorControl
        label="Fill Color"
        value={slot.fill}
        onChange={(fill) => handleUpdate({ fill })}
      />
      <SliderControl
        label="Opacity"
        value={(slot.opacity ?? 1) * 100}
        min={0}
        max={100}
        step={1}
        suffix="%"
        onChange={(value) => handleUpdate({ opacity: value / 100 })}
      />
    </div>
  )

  // Border control popover content
  const borderContent = (
    <div>
      <ColorControl
        label="Border Color"
        value={slot.stroke}
        onChange={(stroke) => handleUpdate({ stroke })}
      />
      <NumberControl
        label="Border Width"
        value={slot.strokeWidth}
        min={0}
        max={20}
        step={1}
        suffix="px"
        onChange={(strokeWidth) => handleUpdate({ strokeWidth })}
      />
    </div>
  )

  // Radius control popover content
  const radiusContent = (
    <div>
      <NumberControl
        label="Corner Radius"
        value={slot.rx}
        min={0}
        max={100}
        step={1}
        suffix="px"
        onChange={(rx) => handleUpdate({ rx, ry: rx })}
      />
    </div>
  )

  return (
    <div style={{
      position: 'fixed',
      top: '72px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#F3F4F6',
      padding: '0',
      zIndex: 40,
      borderRadius: '8px'
    }}>
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Section 1: Fill Control */}
        <div
          onClick={() => {
            if (onOpenColorPanel) {
              onOpenColorPanel()
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'opacity 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <Square size={16} color="#374151" fill={slot.fill || '#374151'} />
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            userSelect: 'none'
          }}>
            Fill
          </span>
        </div>

        {/* Divider 1 */}
        <div style={{
          width: '1px',
          height: '24px',
          background: '#E5E7EB'
        }} />

        {/* Section 2: Border Control */}
        <Popover
          content={borderContent}
          trigger="click"
          open={borderPopoverOpen}
          onOpenChange={setBorderPopoverOpen}
          placement="bottom"
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'opacity 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <Square size={16} color="#374151" />
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              userSelect: 'none'
            }}>
              Border
            </span>
          </div>
        </Popover>

        {/* Divider 2 */}
        <div style={{
          width: '1px',
          height: '24px',
          background: '#E5E7EB'
        }} />

        {/* Section 3: Stroke Style Control (Dotted/Dashed) - Future feature */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'not-allowed',
          opacity: 0.4,
          transition: 'opacity 0.15s'
        }}
        title="Coming soon"
        >
          <SquareDashed size={16} color="#374151" />
        </div>

        {/* Divider 3 */}
        <div style={{
          width: '1px',
          height: '24px',
          background: '#E5E7EB'
        }} />

        {/* Section 4: Corner Radius Control */}
        <Popover
          content={radiusContent}
          trigger="click"
          open={radiusPopoverOpen}
          onOpenChange={setRadiusPopoverOpen}
          placement="bottom"
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'opacity 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <Circle size={16} color="#374151" />
          </div>
        </Popover>

        {/* Divider 4 */}
        <div style={{
          width: '1px',
          height: '24px',
          background: '#E5E7EB'
        }} />

        {/* Section 5: Position Control - Future feature */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'not-allowed',
          opacity: 0.4,
          transition: 'opacity 0.15s'
        }}
        title="Coming soon"
        >
          <Grid3x3 size={16} color="#374151" />
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            userSelect: 'none'
          }}>
            Position
          </span>
        </div>
      </div>
    </div>
  )
}

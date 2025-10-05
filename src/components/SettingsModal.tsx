import React, { useState } from 'react'
import { Modal, Switch, InputNumber, Divider, Slider } from 'antd'
import type { SmartSnapOptions } from '../editor/utils/smartSnapping'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  snapToGrid: boolean
  snapGridSize: number
  onSnapToGridChange: (enabled: boolean) => void
  onSnapGridSizeChange: (size: number) => void
  smartSnapOptions: SmartSnapOptions
  onSmartSnapOptionsChange: (options: SmartSnapOptions) => void
}

export function SettingsModal({
  isOpen,
  onClose,
  snapToGrid,
  snapGridSize,
  onSnapToGridChange,
  onSnapGridSizeChange,
  smartSnapOptions,
  onSmartSnapOptionsChange
}: SettingsModalProps) {
  const [localSnapSize, setLocalSnapSize] = useState(snapGridSize)

  const handleSnapSizeChange = (value: number | null) => {
    if (value && value > 0) {
      setLocalSnapSize(value)
      onSnapGridSizeChange(value)
    }
  }

  const updateSmartSnapOption = <K extends keyof SmartSnapOptions>(
    key: K,
    value: SmartSnapOptions[K]
  ) => {
    onSmartSnapOptionsChange({ ...smartSnapOptions, [key]: value })
  }

  return (
    <Modal
      title="Editor Settings"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <div style={{ padding: '16px 0' }}>
        {/* Snap to Grid */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
              Snap to Grid
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              Snap elements to a grid when moving or resizing
            </div>
          </div>
          <Switch
            checked={snapToGrid}
            onChange={onSnapToGridChange}
          />
        </div>

        {/* Grid Size Input */}
        {snapToGrid && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                Grid Size (pixels)
              </div>
              <InputNumber
                value={localSnapSize}
                onChange={handleSnapSizeChange}
                min={1}
                max={100}
                style={{ width: '100%' }}
                addonAfter="px"
              />
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                Common values: 1px (precise), 5px, 10px (standard), 25px, 50px (coarse)
              </div>
            </div>
          </>
        )}

        <Divider style={{ margin: '24px 0' }} />

        {/* Smart Guides */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
              Smart Guides
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              Show alignment guides when moving or resizing elements
            </div>
          </div>
          <Switch
            checked={smartSnapOptions.enabled}
            onChange={(enabled) => updateSmartSnapOption('enabled', enabled)}
          />
        </div>

        {/* Smart Guides Options */}
        {smartSnapOptions.enabled && (
          <>
            <Divider style={{ margin: '16px 0' }} />

            {/* Snap Threshold */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
                Snap Distance: {smartSnapOptions.threshold}px
              </div>
              <Slider
                min={1}
                max={50}
                value={smartSnapOptions.threshold}
                onChange={(value) => updateSmartSnapOption('threshold', value)}
                marks={{
                  1: '1px',
                  10: '10px',
                  20: '20px',
                  30: '30px',
                  50: '50px'
                }}
              />
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                How close elements need to be before snapping
              </div>
            </div>

            {/* Snap to Canvas Edges */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div style={{ fontSize: '13px', color: '#374151' }}>
                Snap to canvas edges
              </div>
              <Switch
                size="small"
                checked={smartSnapOptions.snapToEdges}
                onChange={(enabled) => updateSmartSnapOption('snapToEdges', enabled)}
              />
            </div>

            {/* Snap to Center */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div style={{ fontSize: '13px', color: '#374151' }}>
                Snap to canvas center
              </div>
              <Switch
                size="small"
                checked={smartSnapOptions.snapToCenter}
                onChange={(enabled) => updateSmartSnapOption('snapToCenter', enabled)}
              />
            </div>

            {/* Snap to Objects */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div style={{ fontSize: '13px', color: '#374151' }}>
                Snap to other elements
              </div>
              <Switch
                size="small"
                checked={smartSnapOptions.snapToObjects}
                onChange={(enabled) => updateSmartSnapOption('snapToObjects', enabled)}
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

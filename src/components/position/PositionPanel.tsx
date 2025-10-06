/**
 * PositionPanel.tsx
 *
 * Position and size controls with alignment and z-order.
 */

import React from 'react'
import { useEditorStore } from '../../state/editorStore'
import { AlignmentButtons } from './AlignmentButtons'
import { ArrangeButtons } from './ArrangeButtons'
import { getMixedState } from '../controls/MixedIndicator'
import {
  bringToFront,
  bringForward,
  sendBackward,
  sendToBack,
  alignToPage,
  type AlignMode
} from '../../editor/transforms/operations'

export const PositionPanel: React.FC = () => {
  const { template, selectedSlots, currentPageId, canvasSize, updateSlotFrame, reorderSlots } = useEditorStore()

  // Get current page
  const currentPage = template?.pages?.find(p => p.id === currentPageId)
  if (!currentPage) return null

  // Get selected slot objects
  const selectedSlotObjects = currentPage.slots.filter(slot =>
    selectedSlots.includes(slot.name)
  )

  if (selectedSlotObjects.length === 0) {
    return (
      <div style={{
        padding: '16px',
        fontSize: '14px',
        color: '#9ca3af',
        textAlign: 'center'
      }}>
        Select an element to edit position
      </div>
    )
  }

  // Get current frames for selected slots
  const currentRatioId = canvasSize.id
  const frames = selectedSlotObjects.map(slot => ({
    slot,
    frame: currentPage.frames[currentRatioId]?.[slot.name] || { x: 0, y: 0, width: 100, height: 100 }
  }))

  // Get mixed states
  const x = getMixedState(frames.map(f => f.frame.x))
  const y = getMixedState(frames.map(f => f.frame.y))
  const width = getMixedState(frames.map(f => f.frame.width))
  const height = getMixedState(frames.map(f => f.frame.height))
  const rotation = getMixedState(frames.map(f => f.frame.rotation || 0))

  // Z-order capabilities
  const zValues = selectedSlotObjects.map(s => s.z)
  const maxZ = Math.max(...currentPage.slots.map(s => s.z))
  const minZ = Math.min(...currentPage.slots.map(s => s.z))
  const canBringForward = zValues.some(z => z < maxZ)
  const canSendBackward = zValues.some(z => z > minZ)

  // Update handlers
  const handleFrameUpdate = (property: 'x' | 'y' | 'width' | 'height' | 'rotation', value: number) => {
    selectedSlotObjects.forEach(slot => {
      updateSlotFrame(slot.name, { [property]: value })
    })
  }

  const handleAlign = (mode: AlignMode) => {
    const context = {
      slots: currentPage.slots,
      frames: currentPage.frames[currentRatioId] || {},
      canvasBounds: { x: 0, y: 0, width: canvasSize.w, height: canvasSize.h }
    }

    const updates = alignToPage(selectedSlots, mode, context)

    // Apply frame updates
    Object.entries(updates).forEach(([slotName, frameUpdate]) => {
      updateSlotFrame(slotName, frameUpdate)
    })
  }

  const handleBringToFront = () => {
    const context = {
      slots: currentPage.slots,
      frames: currentPage.frames[currentRatioId] || {},
      canvasBounds: { x: 0, y: 0, width: canvasSize.w, height: canvasSize.h }
    }

    selectedSlots.forEach(slotName => {
      const updatedSlots = bringToFront(slotName, context)
      reorderSlots(updatedSlots.map(s => s.name))
    })
  }

  const handleBringForward = () => {
    const context = {
      slots: currentPage.slots,
      frames: currentPage.frames[currentRatioId] || {},
      canvasBounds: { x: 0, y: 0, width: canvasSize.w, height: canvasSize.h }
    }

    selectedSlots.forEach(slotName => {
      const updatedSlots = bringForward(slotName, context)
      reorderSlots(updatedSlots.map(s => s.name))
    })
  }

  const handleSendBackward = () => {
    const context = {
      slots: currentPage.slots,
      frames: currentPage.frames[currentRatioId] || {},
      canvasBounds: { x: 0, y: 0, width: canvasSize.w, height: canvasSize.h }
    }

    selectedSlots.forEach(slotName => {
      const updatedSlots = sendBackward(slotName, context)
      reorderSlots(updatedSlots.map(s => s.name))
    })
  }

  const handleSendToBack = () => {
    const context = {
      slots: currentPage.slots,
      frames: currentPage.frames[currentRatioId] || {},
      canvasBounds: { x: 0, y: 0, width: canvasSize.w, height: canvasSize.h }
    }

    selectedSlots.forEach(slotName => {
      const updatedSlots = sendToBack(slotName, context)
      reorderSlots(updatedSlots.map(s => s.name))
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Position & Size */}
        <div>
          <label style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#e5e7eb',
            marginBottom: '8px',
            display: 'block'
          }}>
            Position
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <div>
              <label style={{
                fontSize: '12px',
                color: '#9ca3af',
                display: 'block',
                marginBottom: '4px'
              }}>
                X
              </label>
              <input
                type="number"
                value={x === 'Mixed' ? '' : x}
                onChange={(e) => handleFrameUpdate('x', parseFloat(e.target.value) || 0)}
                placeholder={x === 'Mixed' ? '—' : ''}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '14px',
                  border: '1px solid #4B5563',
                  borderRadius: '4px',
                  background: '#374151',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{
                fontSize: '12px',
                color: '#9ca3af',
                display: 'block',
                marginBottom: '4px'
              }}>
                Y
              </label>
              <input
                type="number"
                value={y === 'Mixed' ? '' : y}
                onChange={(e) => handleFrameUpdate('y', parseFloat(e.target.value) || 0)}
                placeholder={y === 'Mixed' ? '—' : ''}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '14px',
                  border: '1px solid #4B5563',
                  borderRadius: '4px',
                  background: '#374151',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <label style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#e5e7eb',
            marginBottom: '8px',
            display: 'block',
            marginTop: '16px'
          }}>
            Size
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <div>
              <label style={{
                fontSize: '12px',
                color: '#9ca3af',
                display: 'block',
                marginBottom: '4px'
              }}>
                Width
              </label>
              <input
                type="number"
                value={width === 'Mixed' ? '' : width}
                onChange={(e) => handleFrameUpdate('width', parseFloat(e.target.value) || 0)}
                placeholder={width === 'Mixed' ? '—' : ''}
                min="1"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '14px',
                  border: '1px solid #4B5563',
                  borderRadius: '4px',
                  background: '#374151',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{
                fontSize: '12px',
                color: '#9ca3af',
                display: 'block',
                marginBottom: '4px'
              }}>
                Height
              </label>
              <input
                type="number"
                value={height === 'Mixed' ? '' : height}
                onChange={(e) => handleFrameUpdate('height', parseFloat(e.target.value) || 0)}
                placeholder={height === 'Mixed' ? '—' : ''}
                min="1"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '14px',
                  border: '1px solid #4B5563',
                  borderRadius: '4px',
                  background: '#374151',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '8px', marginTop: '16px' }}>
            <label style={{
              fontSize: '12px',
              color: '#9ca3af',
              display: 'block',
              marginBottom: '4px'
            }}>
              Rotation
            </label>
            <input
              type="number"
              value={rotation === 'Mixed' ? '' : rotation}
              onChange={(e) => handleFrameUpdate('rotation', parseFloat(e.target.value) || 0)}
              placeholder={rotation === 'Mixed' ? '—' : ''}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '14px',
                border: '1px solid #4B5563',
                borderRadius: '4px',
                background: '#374151',
                color: '#ffffff',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Alignment */}
        <AlignmentButtons
          onAlign={handleAlign}
          disabled={selectedSlots.length === 0}
        />

        {/* Arrange (Z-order) */}
        <ArrangeButtons
          onBringToFront={handleBringToFront}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onSendToBack={handleSendToBack}
          canBringForward={canBringForward}
          canSendBackward={canSendBackward}
          disabled={selectedSlots.length === 0}
        />
      </div>
    </div>
  )
}

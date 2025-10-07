import React, { useState, useCallback } from 'react'
import { HexColorPicker, HexColorInput } from 'react-colorful'
import { useEditorStore } from '../../state/editorStore'
import { GradientBar } from './GradientBar'
import { GradientStyleChips } from './GradientStyleChips'
import type { GradientStop } from '../../editor/color/types'

/**
 * Gradient color picker
 *
 * Main gradient tab with:
 * - Style selector (Linear/Radial)
 * - Gradient bar with draggable stops
 * - Color picker for selected stop
 * - Opacity slider
 * - Angle slider (linear only)
 * - Position inputs (radial only)
 */
export const GradientColorPicker: React.FC = () => {
  const editingGradient = useEditorStore((state) => state.editingGradient)
  const updateGradientStyle = useEditorStore((state) => state.updateGradientStyle)
  const updateGradientAngle = useEditorStore((state) => state.updateGradientAngle)
  const updateGradientPosition = useEditorStore((state) => state.updateGradientPosition)
  const updateGradientStop = useEditorStore((state) => state.updateGradientStop)
  const addGradientStop = useEditorStore((state) => state.addGradientStop)
  const removeGradientStop = useEditorStore((state) => state.removeGradientStop)
  const selectGradientStop = useEditorStore((state) => state.selectGradientStop)

  // If no gradient being edited, show empty state
  if (!editingGradient) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          color: '#71717a',
          fontSize: '13px'
        }}
      >
        Select a shape to edit its gradient
      </div>
    )
  }

  const { paint, selectedStopIndex } = editingGradient
  const selectedStop = paint.stops[selectedStopIndex]

  // Extract opacity from color (simplified - assumes solid colors for now)
  const [opacity, setOpacity] = useState(100)

  // Handle color change for selected stop
  const handleColorChange = useCallback(
    (newColor: string) => {
      if (!selectedStop) return
      updateGradientStop(selectedStopIndex, {
        ...selectedStop,
        color: newColor
      })
    },
    [selectedStop, selectedStopIndex, updateGradientStop]
  )

  // Handle stop removal
  const handleRemoveStop = useCallback(() => {
    if (paint.stops.length <= 2) {
      alert('A gradient must have at least 2 stops')
      return
    }
    removeGradientStop(selectedStopIndex)
  }, [paint.stops.length, selectedStopIndex, removeGradientStop])

  return (
    <div
      style={{
        padding: '16px 12px',
        height: '100%',
        overflow: 'auto'
      }}
    >
      {/* Style chips */}
      <GradientStyleChips
        activeStyle={paint.kind === 'linear-gradient' ? 'linear' : 'radial'}
        onStyleChange={updateGradientStyle}
      />

      {/* Gradient bar */}
      <GradientBar
        paint={paint}
        selectedStopIndex={selectedStopIndex}
        onSelectStop={selectGradientStop}
        onUpdateStop={updateGradientStop}
        onAddStop={addGradientStop}
      />

      {/* Delete stop button */}
      <button
        onClick={handleRemoveStop}
        disabled={paint.stops.length <= 2}
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: '16px',
          backgroundColor: paint.stops.length <= 2 ? '#1f1f1f' : '#dc2626',
          border: '1px solid #3a3a3a',
          borderRadius: '6px',
          color: paint.stops.length <= 2 ? '#52525b' : '#ffffff',
          fontSize: '13px',
          fontWeight: '500',
          cursor: paint.stops.length <= 2 ? 'not-allowed' : 'pointer',
          opacity: paint.stops.length <= 2 ? 0.5 : 1,
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => {
          if (paint.stops.length > 2) {
            e.currentTarget.style.backgroundColor = '#b91c1c'
          }
        }}
        onMouseLeave={(e) => {
          if (paint.stops.length > 2) {
            e.currentTarget.style.backgroundColor = '#dc2626'
          }
        }}
      >
        Delete Stop
      </button>

      {/* Color picker for selected stop */}
      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '500',
            color: '#9ca3af',
            marginBottom: '8px'
          }}
        >
          Stop Color
        </label>
        <HexColorPicker
          color={selectedStop?.color ?? '#000000'}
          onChange={handleColorChange}
          style={{
            width: '100%',
            height: '200px'
          }}
        />
      </div>

      {/* Hex input */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#2a2a2a',
            borderRadius: '6px',
            padding: '8px 12px',
            border: '1px solid #3a3a3a'
          }}
        >
          <span style={{ color: '#71717a', fontSize: '13px' }}>#</span>
          <HexColorInput
            color={selectedStop?.color ?? '#000000'}
            onChange={handleColorChange}
            prefixed={false}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e5e7eb',
              fontSize: '13px',
              fontFamily: 'monospace',
              textTransform: 'uppercase'
            }}
          />
        </div>
      </div>

      {/* Opacity slider (future enhancement - for now just UI) */}
      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '500',
            color: '#9ca3af',
            marginBottom: '8px'
          }}
        >
          Opacity: {opacity}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background: '#3a3a3a',
            outline: 'none',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* Linear gradient controls */}
      {paint.kind === 'linear-gradient' && (
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '500',
              color: '#9ca3af',
              marginBottom: '8px'
            }}
          >
            Angle: {paint.angle}°
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={paint.angle}
            onChange={(e) => updateGradientAngle(Number(e.target.value))}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: '#3a3a3a',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
        </div>
      )}

      {/* Radial gradient controls */}
      {paint.kind === 'radial-gradient' && (
        <div>
          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: '#9ca3af',
                marginBottom: '8px'
              }}
            >
              Center X: {(paint.cx * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={paint.cx * 100}
              onChange={(e) =>
                updateGradientPosition(
                  Number(e.target.value) / 100,
                  paint.cy,
                  paint.radius
                )
              }
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: '#3a3a3a',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: '#9ca3af',
                marginBottom: '8px'
              }}
            >
              Center Y: {(paint.cy * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={paint.cy * 100}
              onChange={(e) =>
                updateGradientPosition(
                  paint.cx,
                  Number(e.target.value) / 100,
                  paint.radius
                )
              }
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: '#3a3a3a',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: '#9ca3af',
                marginBottom: '8px'
              }}
            >
              Radius: {(paint.radius * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={paint.radius * 100}
              onChange={(e) =>
                updateGradientPosition(
                  paint.cx,
                  paint.cy,
                  Number(e.target.value) / 100
                )
              }
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: '#3a3a3a',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

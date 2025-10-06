/**
 * EffectsPanel.tsx
 *
 * Main effects panel combining preset grid and toggle list.
 */

import React, { useState } from 'react'
import { useEditorStore } from '../../state/editorStore'
import { PresetGrid } from './PresetGrid'
import { EffectToggle } from './EffectToggle'
import { ShadowControls } from './ShadowControls'
import { StrokeControls } from './StrokeControls'
import { HighlightControls } from './HighlightControls'
import { MixedColorSwatch, getMixedState } from '../controls/MixedIndicator'
import { applyPreset, type EffectPresetName, getActiveEffects } from '../../editor/effects/presets'

export const EffectsPanel: React.FC = () => {
  const { template, selectedSlots, currentPageId, updateSlot } = useEditorStore()
  const [showPresets, setShowPresets] = useState(true)

  // Get current page
  const currentPage = template?.pages?.find(p => p.id === currentPageId)
  if (!currentPage) return null

  // Get selected slot objects
  const selectedSlotObjects = currentPage.slots.filter(slot =>
    selectedSlots.includes(slot.name)
  )

  // Only show panel for text/button slots
  const textSlots = selectedSlotObjects.filter(
    slot => slot.type === 'text' || slot.type === 'button'
  )

  if (textSlots.length === 0) {
    return (
      <div style={{
        padding: '16px',
        fontSize: '14px',
        color: '#9ca3af',
        textAlign: 'center'
      }}>
        Select text or button to edit effects
      </div>
    )
  }

  // Get mixed states for all effect properties
  const color = getMixedState(textSlots.map(s => s.color || '#000000')) as string | 'Mixed' | undefined
  const hasShadow = getMixedState(textSlots.map(s => !!s.shadow)) as boolean | 'Mixed'
  const hasStroke = getMixedState(textSlots.map(s => !!s.strokeConfig)) as boolean | 'Mixed'
  const hasHighlight = getMixedState(textSlots.map(s => !!s.highlight)) as boolean | 'Mixed'
  const hasCurve = getMixedState(textSlots.map(s => !!s.curve)) as boolean | 'Mixed'

  // Get current preset (if all slots have same active effects)
  const activeEffects = textSlots.map(s => getActiveEffects(s).sort().join(','))
  const currentPreset = getMixedState(activeEffects)

  // Update handlers
  const handlePresetClick = (preset: EffectPresetName) => {
    textSlots.forEach(slot => {
      const updated = applyPreset(slot, preset)
      updateSlot(slot.name, updated)
    })
  }

  const handleColorChange = (newColor: string) => {
    textSlots.forEach(slot => {
      updateSlot(slot.name, { color: newColor })
    })
  }

  const handleShadowToggle = (enabled: boolean) => {
    textSlots.forEach(slot => {
      updateSlot(slot.name, {
        shadow: enabled ? { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 } : undefined
      })
    })
  }

  const handleStrokeToggle = (enabled: boolean) => {
    textSlots.forEach(slot => {
      updateSlot(slot.name, {
        strokeConfig: enabled ? { width: 2, color: '#000000' } : undefined
      })
    })
  }

  const handleHighlightToggle = (enabled: boolean) => {
    textSlots.forEach(slot => {
      updateSlot(slot.name, {
        highlight: enabled ? { fill: '#000000', padding: [8, 4] } : undefined
      })
    })
  }

  const handleCurveToggle = (enabled: boolean) => {
    textSlots.forEach(slot => {
      updateSlot(slot.name, {
        curve: enabled ? { radius: 50 } as any : undefined
      })
    })
  }

  const handleShadowChange = (params: any) => {
    textSlots.forEach(slot => {
      updateSlot(slot.name, { shadow: params })
    })
  }

  const handleStrokeChange = (config: any) => {
    textSlots.forEach(slot => {
      updateSlot(slot.name, { strokeConfig: config })
    })
  }

  const handleHighlightChange = (params: any) => {
    textSlots.forEach(slot => {
      updateSlot(slot.name, { highlight: params })
    })
  }

  // Get shadow/stroke/highlight params for controls
  const shadowParams = textSlots.length === 1 ? textSlots[0].shadow : getMixedState(textSlots.map(s => s.shadow))
  const strokeConfig = textSlots.length === 1 ? textSlots[0].strokeConfig : getMixedState(textSlots.map(s => s.strokeConfig))
  const highlightParams = textSlots.length === 1 ? textSlots[0].highlight : getMixedState(textSlots.map(s => s.highlight))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Preset Grid Section */}
        <div style={{
          padding: '16px 0',
          borderBottom: '1px solid #333'
        }}>
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              marginBottom: '12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#e5e7eb'
            }}>
              Presets
            </span>
            <svg
              style={{
                width: '16px',
                height: '16px',
                color: '#9ca3af',
                transform: showPresets ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showPresets && (
            <PresetGrid
              selectedPreset={typeof currentPreset === 'string' ? undefined : undefined}
              onPresetClick={handlePresetClick}
            />
          )}
        </div>

        {/* Text Color */}
        <div style={{
          padding: '16px 0',
          borderBottom: '1px solid #333'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff'
            }}>
              Text Color
            </span>
            <MixedColorSwatch
              value={color}
              onChange={handleColorChange}
            />
          </div>
        </div>

        {/* Effect Toggles */}
        <EffectToggle
          label="Text Stroke"
          enabled={hasStroke}
          onToggle={handleStrokeToggle}
        >
          <StrokeControls
            config={strokeConfig}
            onChange={handleStrokeChange}
          />
        </EffectToggle>

        <EffectToggle
          label="Text Highlight"
          enabled={hasHighlight}
          onToggle={handleHighlightToggle}
        >
          <HighlightControls
            params={highlightParams}
            onChange={handleHighlightChange}
          />
        </EffectToggle>

        <EffectToggle
          label="Text Shadow"
          enabled={hasShadow}
          onToggle={handleShadowToggle}
        >
          <ShadowControls
            params={shadowParams}
            onChange={handleShadowChange}
          />
        </EffectToggle>

        <EffectToggle
          label="Text Curve"
          enabled={hasCurve}
          onToggle={handleCurveToggle}
          experimental
        >
          <div className="text-xs text-gray-500">
            Curve controls coming soon
          </div>
        </EffectToggle>
      </div>
    </div>
  )
}

import React from 'react'
import { useEditorStore } from '../state/editorStore'
import { ColorPicker } from 'antd'
import type { Color } from 'antd/es/color-picker'

interface CanvasPropertiesPanelProps {
  pageId: string
}

export function CanvasPropertiesPanel({ pageId }: CanvasPropertiesPanelProps) {
  const template = useEditorStore(state => state.template)
  const updatePageBackgroundColor = useEditorStore(state => state.updatePageBackgroundColor)

  if (!template) return null

  const page = template.pages.find(p => p.id === pageId)
  if (!page) return null

  const backgroundColor = page.backgroundColor || '#ffffff'

  const handleColorChange = (color: Color) => {
    updatePageBackgroundColor(pageId, color.toHexString())
  }

  return (
    <div style={{
      position: 'absolute',
      top: '48px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 1000,
      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)'
    }}>
      <span style={{
        fontSize: '13px',
        fontWeight: '500',
        color: '#111827'
      }}>
        Background Color
      </span>
      <ColorPicker
        value={backgroundColor}
        onChange={handleColorChange}
        showText
        presets={[
          {
            label: 'Recommended',
            colors: [
              '#ffffff',
              '#f3f4f6',
              '#e5e7eb',
              '#000000',
              '#1a1a1a',
              '#3b82f6',
              '#ef4444',
              '#22c55e',
              '#f59e0b',
              '#8b5cf6'
            ]
          }
        ]}
      />
    </div>
  )
}

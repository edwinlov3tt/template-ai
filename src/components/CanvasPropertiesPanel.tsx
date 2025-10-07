import React from 'react'
import { useEditorStore } from '../state/editorStore'
import { Square } from 'lucide-react'

interface CanvasPropertiesPanelProps {
  pageId: string
  onOpenColorPanel?: () => void
}

export function CanvasPropertiesPanel({ pageId, onOpenColorPanel }: CanvasPropertiesPanelProps) {
  const template = useEditorStore(state => state.template)

  if (!template) return null

  const page = template.pages.find(p => p.id === pageId)
  if (!page) return null

  const backgroundColor = page.backgroundColor || '#ffffff'

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
      <button
        onClick={() => {
          if (onOpenColorPanel) {
            onOpenColorPanel()
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: '#ffffff',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#3b82f6'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db'
        }}
      >
        <Square size={20} color="#374151" fill={backgroundColor} strokeWidth={1.5} />
        <span style={{
          fontSize: '13px',
          fontWeight: '500',
          color: '#374151',
          fontFamily: 'monospace'
        }}>
          {backgroundColor.toUpperCase()}
        </span>
      </button>
    </div>
  )
}

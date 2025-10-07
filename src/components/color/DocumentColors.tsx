import React from 'react'
import type { Paint } from '../../editor/color/types'
import { ColorSwatch } from './ColorSwatch'
import { useEditorStore } from '../../state/editorStore'

interface DocumentColorsProps {
  onApplyColor: (paint: Paint) => void
}

/**
 * Document colors section
 * Shows colors used in the current template
 */
export const DocumentColors: React.FC<DocumentColorsProps> = ({ onApplyColor }) => {
  const documentSwatches = useEditorStore((state) => state.documentSwatches)
  const addDocumentSwatch = useEditorStore((state) => state.addDocumentSwatch)
  const removeDocumentSwatch = useEditorStore((state) => state.removeDocumentSwatch)

  const handleAddCurrent = () => {
    // TODO: Add current selected slot's fill color
    // For now, add a default color as placeholder
    const defaultPaint: Paint = { kind: 'solid', color: '#3b82f6' }
    addDocumentSwatch(defaultPaint)
  }

  const handleRemoveSwatch = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    removeDocumentSwatch(index)
  }

  return (
    <div style={{
      padding: '16px 12px',
      borderBottom: '1px solid #3a3a3a'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {/* Palette icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 9.5 2.5 10.5 3.5 11C4 11.3 4.5 11 4.5 10.5C4.5 10.2 4.3 10 4.1 9.8C3.4 9.1 3 8.1 3 7C3 4.8 4.8 3 7 3C9.2 3 11 4.8 11 7C11 7.6 10.6 8 10 8C9.4 8 9 7.6 9 7V5"
              stroke="#a1a1aa"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="5.5" cy="6.5" r="1" fill="#a1a1aa" />
            <circle cx="8" cy="5.5" r="1" fill="#a1a1aa" />
            <circle cx="10.5" cy="6.5" r="1" fill="#a1a1aa" />
          </svg>
          <span style={{
            color: '#e5e7eb',
            fontSize: '13px',
            fontWeight: '500'
          }}>
            Document colors
          </span>
        </div>

        <button
          onClick={handleAddCurrent}
          style={{
            background: 'none',
            border: 'none',
            color: '#71717a',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2a2a2a'
            e.currentTarget.style.color = '#e5e7eb'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#71717a'
          }}
        >
          + Add
        </button>
      </div>

      {/* Swatches */}
      {documentSwatches.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '24px 12px',
          color: '#71717a',
          fontSize: '13px'
        }}>
          <p style={{ margin: 0 }}>No colors yet</p>
          <button
            onClick={handleAddCurrent}
            style={{
              marginTop: '8px',
              background: 'none',
              border: '1px solid #3a3a3a',
              color: '#e5e7eb',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '4px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2a2a2a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            Add first color
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {documentSwatches.map((paint, index) => (
            <ColorSwatch
              key={index}
              paint={paint}
              onClick={() => onApplyColor(paint)}
              onContextMenu={(e) => handleRemoveSwatch(e, index)}
              ariaLabel={`Document color ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

import React from 'react'
import type { Paint } from '../../editor/color/types'

interface PhotoColorsProps {
  onApplyColor: (paint: Paint) => void
}

/**
 * Photo colors section (placeholder)
 * Will show colors extracted from images in template
 * Image palette extraction to be implemented in Phase 2
 */
export const PhotoColors: React.FC<PhotoColorsProps> = ({ onApplyColor }) => {
  // TODO: Implement image palette extraction
  // For now, show placeholder message

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
          {/* Image icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="#a1a1aa" strokeWidth="1.5" />
            <circle cx="6" cy="6" r="1.5" fill="#a1a1aa" />
            <path d="M14 11L10 7L6 11" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{
            color: '#e5e7eb',
            fontSize: '13px',
            fontWeight: '500'
          }}>
            Photo colors
          </span>
        </div>
      </div>

      {/* Placeholder content */}
      <div style={{
        textAlign: 'center',
        padding: '24px 12px',
        color: '#71717a',
        fontSize: '13px',
        backgroundColor: '#1f1f1f',
        borderRadius: '6px',
        border: '1px dashed #3a3a3a'
      }}>
        <p style={{ margin: 0 }}>No images in template</p>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#52525b' }}>
          Colors will appear when you add images
        </p>
      </div>
    </div>
  )
}

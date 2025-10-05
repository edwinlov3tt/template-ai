import React from 'react'
import type { AutoFixSuggestion } from '../accessibility/contrastUtils'

interface ContrastFixModalProps {
  isOpen: boolean
  onClose: () => void
  slotName: string
  currentRatio: number
  suggestions: AutoFixSuggestion[]
  onApplyFix: (suggestion: AutoFixSuggestion) => void
}

export function ContrastFixModal({
  isOpen,
  onClose,
  slotName,
  currentRatio,
  suggestions,
  onApplyFix
}: ContrastFixModalProps) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '8px',
        width: '480px',
        maxWidth: '90vw',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Fix Contrast Issue
            </h3>
            <p style={{
              fontSize: '13px',
              color: '#6b7280',
              margin: '4px 0 0 0'
            }}>
              {slotName} • Current ratio: {currentRatio.toFixed(2)}:1
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#9ca3af',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Suggestions */}
        <div style={{ padding: '24px' }}>
          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            marginBottom: '16px'
          }}>
            Choose a fix to improve contrast to WCAG AA (4.5:1) or better:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {suggestions.map((suggestion, index) => (
              <SuggestionCard
                key={index}
                suggestion={suggestion}
                onApply={() => {
                  onApplyFix(suggestion)
                  onClose()
                }}
              />
            ))}
          </div>

          {suggestions.length === 0 && (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '13px',
              background: '#f9fafb',
              borderRadius: '6px'
            }}>
              No automatic fixes available. Try manually adjusting colors.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px'
        }}>
          <button
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

interface SuggestionCardProps {
  suggestion: AutoFixSuggestion
  onApply: () => void
}

function SuggestionCard({ suggestion, onApply }: SuggestionCardProps) {
  const getIcon = () => {
    switch (suggestion.strategy) {
      case 'invertText':
        return '🔄'
      case 'addChip':
        return '🏷️'
      case 'increaseOverlay':
        return '🌑'
      default:
        return '✨'
    }
  }

  const getPreviewText = () => {
    if (suggestion.preview.textColor) {
      return `New color: ${suggestion.preview.textColor}`
    }
    if (suggestion.preview.chipColor) {
      return `Chip color: ${suggestion.preview.chipColor}`
    }
    if (suggestion.preview.overlayAlpha !== undefined) {
      return `Opacity: ${Math.round(suggestion.preview.overlayAlpha * 100)}%`
    }
    return ''
  }

  return (
    <div style={{
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      padding: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer',
      transition: 'all 0.15s'
    }}
    onClick={onApply}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = '#f3f4f6'
      e.currentTarget.style.borderColor = '#d1d5db'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = '#f9fafb'
      e.currentTarget.style.borderColor = '#e5e7eb'
    }}
    >
      <div style={{
        fontSize: '24px',
        lineHeight: 1
      }}>
        {getIcon()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '13px',
          fontWeight: '500',
          color: '#111827',
          marginBottom: '2px'
        }}>
          {suggestion.description}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#6b7280'
        }}>
          {getPreviewText()}
        </div>
      </div>
      <button
        style={{
          background: '#3b82f6',
          border: 'none',
          borderRadius: '4px',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: '500',
          color: '#ffffff',
          cursor: 'pointer'
        }}
      >
        Apply
      </button>
    </div>
  )
}

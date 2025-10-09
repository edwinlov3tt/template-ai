import React, { useState } from 'react'

interface CustomPageSizeModalProps {
  isOpen: boolean
  onClose: () => void
  onAddPage: (size: { id: string; w: number; h: number }) => void
}

export function CustomPageSizeModal({ isOpen, onClose, onAddPage }: CustomPageSizeModalProps) {
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const w = parseInt(width)
    const h = parseInt(height)

    // Validation
    if (isNaN(w) || w <= 0) {
      setError('Width must be a positive number')
      return
    }
    if (isNaN(h) || h <= 0) {
      setError('Height must be a positive number')
      return
    }
    if (w > 10000 || h > 10000) {
      setError('Maximum dimension is 10,000 pixels')
      return
    }

    // Create size object
    const size = {
      id: `${w}x${h}`,
      w,
      h
    }

    onAddPage(size)
    handleClose()
  }

  function handleClose() {
    setWidth('')
    setHeight('')
    setError('')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(17, 24, 39, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            width: '400px',
            maxWidth: '90%'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Custom Page Size
            </h2>
            <button
              onClick={handleClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '20px',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '4px',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '24px' }}>
              {/* Width Input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Width (px)
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => {
                    setWidth(e.target.value)
                    setError('')
                  }}
                  placeholder="e.g., 1080"
                  min="1"
                  max="10000"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    transition: 'border-color 0.15s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                />
              </div>

              {/* Height Input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Height (px)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => {
                    setHeight(e.target.value)
                    setError('')
                  }}
                  placeholder="e.g., 1920"
                  min="1"
                  max="10000"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    transition: 'border-color 0.15s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  padding: '10px 12px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  color: '#dc2626',
                  fontSize: '13px',
                  marginBottom: '20px'
                }}>
                  {error}
                </div>
              )}

              {/* Info */}
              <div style={{
                padding: '10px 12px',
                background: '#f0f9ff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#1e40af'
              }}>
                Page size will be saved as {width && height ? `${width}×${height}` : 'W×H'} pixels
              </div>
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
                type="button"
                onClick={handleClose}
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
              <button
                type="submit"
                style={{
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Add Page
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

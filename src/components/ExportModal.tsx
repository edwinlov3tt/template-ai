import React, { useState } from 'react'
import type { Template } from '../schema/types'
import { exportAndDownload } from '../export/pngExport'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  template: Template | null
  currentSize: { w: number; h: number }
}

export function ExportModal({ isOpen, onClose, template, currentSize }: ExportModalProps) {
  const [format, setFormat] = useState<'png' | 'jpeg'>('png')
  const [quality, setQuality] = useState(100)
  const [scale, setScale] = useState(1)
  const [exporting, setExporting] = useState(false)

  if (!isOpen || !template) return null

  const handleExport = async () => {
    setExporting(true)
    try {
      // Find the SVG element in the DOM
      const svgElement = document.querySelector('svg[viewBox]') as SVGSVGElement
      if (!svgElement) {
        throw new Error('No SVG canvas found')
      }

      await exportAndDownload(
        svgElement,
        {
          width: currentSize.w,
          height: currentSize.h,
          format,
          quality: quality / 100,
          multiplier: scale
        }
      )
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

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
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            Export Template
          </h3>
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

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Current Size */}
          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Export Size
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
              {currentSize.w * scale} × {currentSize.h * scale} px
              {scale > 1 && <span style={{ color: '#6b7280', fontWeight: '400' }}> (@{scale}x)</span>}
            </div>
          </div>

          {/* Format */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Format
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <FormatButton
                active={format === 'png'}
                onClick={() => setFormat('png')}
                label="PNG"
              />
              <FormatButton
                active={format === 'jpeg'}
                onClick={() => setFormat('jpeg')}
                label="JPEG"
              />
            </div>
          </div>

          {/* Quality (JPEG only) */}
          {format === 'jpeg' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Quality: {quality}%
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {/* Scale */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Resolution
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <ScaleButton active={scale === 1} onClick={() => setScale(1)} label="1x" />
              <ScaleButton active={scale === 2} onClick={() => setScale(2)} label="2x" />
              <ScaleButton active={scale === 3} onClick={() => setScale(3)} label="3x" />
              <ScaleButton active={scale === 4} onClick={() => setScale(4)} label="4x" />
            </div>
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
            onClick={onClose}
            disabled={exporting}
            style={{
              background: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#374151',
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              background: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#ffffff',
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.7 : 1
            }}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface FormatButtonProps {
  active: boolean
  onClick: () => void
  label: string
}

function FormatButton({ active, onClick, label }: FormatButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? '#3b82f6' : '#ffffff',
        border: `1px solid ${active ? '#3b82f6' : '#d1d5db'}`,
        borderRadius: '6px',
        padding: '8px',
        fontSize: '13px',
        fontWeight: '500',
        color: active ? '#ffffff' : '#374151',
        cursor: 'pointer',
        transition: 'all 0.15s'
      }}
    >
      {label}
    </button>
  )
}

interface ScaleButtonProps {
  active: boolean
  onClick: () => void
  label: string
}

function ScaleButton({ active, onClick, label }: ScaleButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? '#3b82f6' : '#ffffff',
        border: `1px solid ${active ? '#3b82f6' : '#d1d5db'}`,
        borderRadius: '6px',
        padding: '8px',
        fontSize: '13px',
        fontWeight: '500',
        color: active ? '#ffffff' : '#374151',
        cursor: 'pointer',
        transition: 'all 0.15s'
      }}
    >
      {label}
    </button>
  )
}

import React, { useState } from 'react'
import type { Template } from '../schema/types'
import { exportAndDownload } from '../export/pngExport'
import { exportSVG, downloadSVG } from '../export/svgExport'
import { getExportDimensions } from '../editor/utils/normalization'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  template: Template | null
  currentSize: { id: string; w: number; h: number }
  currentPageId?: string | null
  onCanvasSizeChange?: (size: { id: string; w: number; h: number }) => void
}

export function ExportModal({ isOpen, onClose, template, currentSize, currentPageId, onCanvasSizeChange }: ExportModalProps) {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'svg'>('png')
  const [quality, setQuality] = useState(100)
  const [scale, setScale] = useState(1)
  const [exporting, setExporting] = useState(false)
  const [exportMode, setExportMode] = useState<'single' | 'batch'>('single')
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null)

  if (!isOpen || !template) return null

  // Get available ratios from template
  const availableRatios = template.canvas?.ratios || []
  const hasMultipleRatios = availableRatios.length > 1

  const exportSingleSize = async (size: { id: string; w: number; h: number }, filename?: string) => {
    // Find the main canvas SVG element for the current page
    const selector = currentPageId
      ? `svg[data-canvas-svg="true"][data-page-id="${currentPageId}"]`
      : 'svg[data-canvas-svg="true"]'

    const svgElement = document.querySelector(selector) as SVGSVGElement
    if (!svgElement) {
      console.error('[ExportModal] No canvas SVG found. Available SVGs:',
        Array.from(document.querySelectorAll('svg')).map(s => ({
          viewBox: s.getAttribute('viewBox'),
          dataAttrs: Array.from(s.attributes).filter(a => a.name.startsWith('data-'))
        }))
      )
      throw new Error('No SVG canvas found')
    }

    // Get actual export pixel dimensions for this ratio
    const exportDims = getExportDimensions(size.id)
    const exportFilename = filename || `template-${exportDims.w}x${exportDims.h}`

    console.log('[ExportModal] Exporting:', {
      ratioId: size.id,
      canvasDims: { w: size.w, h: size.h },
      exportDims,
      format
    })

    if (format === 'svg') {
      const svgString = exportSVG(svgElement)
      downloadSVG(svgString, `${exportFilename}.svg`)
    } else {
      // Export at actual pixel dimensions (pngExport handles the scaling from viewBox)
      await exportAndDownload(
        svgElement,
        {
          width: exportDims.w,
          height: exportDims.h,
          format,
          quality: quality / 100,
          multiplier: scale
        },
        `${exportFilename}.${format}`
      )
    }
  }

  const handleExport = async () => {
    setExporting(true)
    setExportProgress(null)

    try {
      if (exportMode === 'single') {
        // Export current size only
        await exportSingleSize(currentSize)
        onClose()
      } else {
        // Batch export all ratios
        if (!onCanvasSizeChange) {
          throw new Error('Batch export requires onCanvasSizeChange callback')
        }

        const originalSize = currentSize
        const templateName = template.id || 'template'

        for (let i = 0; i < availableRatios.length; i++) {
          const ratioId = availableRatios[i]
          setExportProgress({ current: i + 1, total: availableRatios.length })

          // Convert ratio ID to dimensions
          const size = getExportDimensions(ratioId)

          // Switch canvas to this size
          onCanvasSizeChange(size)

          // Wait for React to render the new size
          await new Promise(resolve => setTimeout(resolve, 300))

          // Export this size
          const filename = `${templateName}-${size.id}`
          await exportSingleSize(size, filename)
        }

        // Restore original size
        onCanvasSizeChange(originalSize)
        setExportProgress(null)
        onClose()
      }
    } catch (error) {
      console.error('Export failed:', error)
      setExportProgress(null)

      // Provide specific error messages
      let errorMessage = 'Export failed. Please try again.'

      if (error instanceof Error) {
        if (error.message.includes('Tainted canvases') || error.message.includes('SecurityError')) {
          errorMessage = 'Export failed due to CORS restrictions.\n\n' +
            'Your template contains images from external URLs that don\'t allow cross-origin access. ' +
            'To fix this:\n' +
            '1. Use images from the same domain\n' +
            '2. Convert images to data URIs (base64)\n' +
            '3. Host images on a CORS-enabled server\n\n' +
            'SVG export may still work as an alternative.'
        } else if (error.message.includes('No SVG canvas found')) {
          errorMessage = 'No canvas found to export. Please make sure your template is loaded.'
        } else {
          errorMessage = `Export failed: ${error.message}`
        }
      }

      alert(errorMessage)
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
          {/* Export Mode (only show if multiple ratios available) */}
          {hasMultipleRatios && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Export Mode
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <FormatButton
                  active={exportMode === 'single'}
                  onClick={() => setExportMode('single')}
                  label="Current Size"
                />
                <FormatButton
                  active={exportMode === 'batch'}
                  onClick={() => setExportMode('batch')}
                  label={`All Sizes (${availableRatios.length})`}
                />
              </div>
            </div>
          )}

          {/* Current Size / Export Info */}
          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              {exportMode === 'batch' ? 'Export Sizes' : 'Export Size'}
            </div>
            {exportMode === 'batch' ? (
              <div style={{ fontSize: '13px', color: '#111827' }}>
                {availableRatios.map((ratioId, index) => {
                  const size = getExportDimensions(ratioId)
                  return (
                    <div key={ratioId} style={{
                      marginTop: index > 0 ? '4px' : 0,
                      fontWeight: '500'
                    }}>
                      {size.id}: {format === 'svg' ? (
                        <>{size.w} × {size.h} <span style={{ color: '#6b7280', fontWeight: '400' }}>(Vector)</span></>
                      ) : (
                        <>{size.w * scale} × {size.h * scale} px{scale > 1 && <span style={{ color: '#6b7280', fontWeight: '400' }}> (@{scale}x)</span>}</>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                {format === 'svg' ? (
                  <>
                    {currentSize.w} × {currentSize.h} <span style={{ color: '#6b7280', fontWeight: '400' }}>(Vector)</span>
                  </>
                ) : (
                  <>
                    {currentSize.w * scale} × {currentSize.h * scale} px
                    {scale > 1 && <span style={{ color: '#6b7280', fontWeight: '400' }}> (@{scale}x)</span>}
                  </>
                )}
              </div>
            )}
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
              <FormatButton
                active={format === 'svg'}
                onClick={() => setFormat('svg')}
                label="SVG"
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

          {/* Scale (PNG/JPEG only - SVG is vector) */}
          {format !== 'svg' && (
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
            {exporting
              ? exportProgress
                ? `Exporting ${exportProgress.current}/${exportProgress.total}...`
                : 'Exporting...'
              : 'Export'}
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

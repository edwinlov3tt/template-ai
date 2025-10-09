import React, { useEffect, useState, useCallback, useRef } from 'react'
import { CanvasStage } from '../components/CanvasStage'
import { useEditorStore } from '../state/editorStore'
import {
  sendToParent,
  getParentOrigin,
  isAllowedOrigin,
  isEditorMessage,
  type EditorMessage,
  type EditorMode,
  type OpenMessage
} from '../embed/messageProtocol'
import type { SmartSnapOptions } from '../editor/utils/smartSnapping'

export default function Embed() {
  // Get state and actions from store
  const template = useEditorStore(state => state.template)
  const setTemplate = useEditorStore(state => state.setTemplate)
  const selectedSlots = useEditorStore(state => state.selectedSlots)
  const setSelection = useEditorStore(state => state.setSelection)
  const canvasSize = useEditorStore(state => state.canvasSize)
  const setCanvasSize = useEditorStore(state => state.setCanvasSize)
  const zoom = useEditorStore(state => state.zoom)
  const setZoom = useEditorStore(state => state.setZoom)
  const gridVisible = useEditorStore(state => state.gridVisible)
  const toggleGrid = useEditorStore(state => state.toggleGrid)
  const updateSlotFrame = useEditorStore(state => state.updateSlotFrame)
  const undo = useEditorStore(state => state.undo)
  const redo = useEditorStore(state => state.redo)
  const deleteSlot = useEditorStore(state => state.deleteSlot)
  const duplicateSlot = useEditorStore(state => state.duplicateSlot)
  const toggleLockSlot = useEditorStore(state => state.toggleLockSlot)
  const currentPageId = useEditorStore(state => state.currentPageId)

  // Local state
  const [mode, setMode] = useState<EditorMode>('full')
  const [parentOrigin, setParentOrigin] = useState<string>('*')
  const [isReady, setIsReady] = useState(false)
  const hasChangesRef = useRef(false)

  // Settings (simplified for embed)
  const [smartSnapOptions] = useState<SmartSnapOptions>({
    enabled: true,
    threshold: 4,
    snapToEdges: true,
    snapToCenter: true,
    snapToObjects: true,
    showDistances: false
  })

  /**
   * Send ready message on mount and set default zoom
   */
  useEffect(() => {
    const origin = getParentOrigin()
    setParentOrigin(origin)

    console.log('[Embed] Mounted, sending ready message to:', origin)

    // Set default zoom to 35% for better initial view
    setZoom(35)

    sendToParent(
      {
        type: 'editor:ready',
        payload: {
          version: '1.0.0',
          capabilities: ['crop', 'full', 'png', 'svg', 'jpeg', 'json']
        }
      },
      origin
    )

    setIsReady(true)
  }, [setZoom])

  /**
   * Handle messages from parent
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Validate origin
      if (!isAllowedOrigin(event.origin)) {
        console.warn('[Embed] Rejected message from untrusted origin:', event.origin)
        return
      }

      // Validate message structure
      if (!isEditorMessage(event.data)) {
        return
      }

      const message = event.data as EditorMessage

      console.log('[Embed] Received message:', message.type, message)

      switch (message.type) {
        case 'editor:open':
          handleOpen(message as OpenMessage)
          break

        case 'editor:close':
          handleClose()
          break

        default:
          console.warn('[Embed] Unknown message type:', message.type)
      }
    },
    []
  )

  /**
   * Handle open message from parent
   */
  const handleOpen = useCallback((message: OpenMessage) => {
    const { mode: requestedMode, template: templateData, ratio, templateId, focusSlot, cropRect } = message.payload

    console.log('[Embed] Opening editor:', { mode: requestedMode, ratio, templateId })

    // Set mode
    if (requestedMode) {
      setMode(requestedMode)
    }

    // Load template
    if (templateData) {
      setTemplate(templateData)

      // Set canvas size to match template or requested ratio
      if (ratio) {
        const parts = ratio.split('x')
        if (parts.length === 2) {
          const w = parseInt(parts[0])
          const h = parseInt(parts[1])
          setCanvasSize({ id: ratio, w, h })
        }
      }
    } else if (templateId) {
      // TODO: Fetch template by ID from API
      console.warn('[Embed] Template fetch by ID not yet implemented')
      sendToParent(
        {
          type: 'editor:error',
          payload: {
            error: 'Template fetch not implemented',
            details: { templateId }
          }
        },
        parentOrigin
      )
    }

    // Focus slot if requested
    if (focusSlot && templateData) {
      const page = templateData.pages[0] // Assuming single page for crop mode
      const slot = page?.slots.find(s => s.name === focusSlot)
      if (slot) {
        setSelection([focusSlot])
      }
    }

    // TODO: Apply crop rect if provided
    if (cropRect) {
      console.log('[Embed] Crop rect:', cropRect)
    }
  }, [setTemplate, setCanvasSize, setSelection, parentOrigin])

  /**
   * Handle close message from parent
   */
  const handleClose = useCallback(() => {
    console.log('[Embed] Close requested')
    // Could show unsaved changes warning if hasChangesRef.current
    sendToParent(
      {
        type: 'editor:cancel',
        payload: { reason: 'Parent requested close' }
      },
      parentOrigin
    )
  }, [parentOrigin])

  /**
   * Handle complete (user clicks Done)
   */
  const handleComplete = useCallback(async () => {
    console.log('[Embed] Complete requested')

    if (!template) {
      sendToParent(
        {
          type: 'editor:error',
          payload: { error: 'No template loaded' }
        },
        parentOrigin
      )
      return
    }

    try {
      // Find the SVG element for the current page
      const selector = currentPageId
        ? `svg[data-canvas-svg="true"][data-page-id="${currentPageId}"]`
        : 'svg[data-canvas-svg="true"]'

      const svgElement = document.querySelector(selector) as SVGSVGElement
      if (!svgElement) {
        console.error('[Embed] No canvas SVG found')
        throw new Error('No SVG canvas found')
      }

      // Import blob export utilities
      const { exportForEmbed, exportThumbnail } = await import('../export/blobExport')

      console.log('[Embed] Exporting canvas:', { width: canvasSize.w, height: canvasSize.h })

      // Export full-size PNG
      const pngExport = await exportForEmbed(svgElement, {
        format: 'png',
        width: canvasSize.w,
        height: canvasSize.h,
        quality: 1,
        multiplier: 1
      })

      // Export thumbnail (200px max dimension)
      const thumbnailExport = await exportThumbnail(svgElement, 200)

      // Export SVG
      const svgExport = await exportForEmbed(svgElement, {
        format: 'svg',
        width: canvasSize.w,
        height: canvasSize.h
      })

      console.log('[Embed] Export complete, sending to parent')

      sendToParent(
        {
          type: 'editor:complete',
          payload: {
            template,
            exports: {
              png: pngExport.dataUrl,
              svg: svgExport.svgString,
              thumbnail: thumbnailExport.dataUrl
            },
            metadata: {
              dimensions: canvasSize,
              modified: new Date().toISOString()
            }
          }
        },
        parentOrigin
      )
    } catch (error) {
      console.error('[Embed] Export error:', error)
      sendToParent(
        {
          type: 'editor:error',
          payload: {
            error: 'Export failed',
            details: error instanceof Error ? error.message : String(error)
          }
        },
        parentOrigin
      )
    }
  }, [template, canvasSize, parentOrigin, currentPageId])

  /**
   * Handle cancel (user clicks Cancel)
   */
  const handleCancel = useCallback(() => {
    console.log('[Embed] Cancel requested')
    sendToParent(
      {
        type: 'editor:cancel',
        payload: {}
      },
      parentOrigin
    )
  }, [parentOrigin])

  /**
   * Listen for messages
   */
  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  /**
   * Track changes for dirty state
   */
  useEffect(() => {
    if (isReady && template) {
      hasChangesRef.current = true

      // Throttle change notifications
      const timer = setTimeout(() => {
        sendToParent(
          {
            type: 'editor:change',
            payload: {
              hasChanges: true,
              modifiedSlots: selectedSlots
            }
          },
          parentOrigin
        )
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [template, selectedSlots, isReady, parentOrigin])

  if (!isReady) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F3F6F6'
      }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          Initializing editor...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#F3F6F6',
      overflow: 'hidden'
    }}>
      {/* Minimal Toolbar */}
      <div style={{
        height: '48px',
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#111827'
        }}>
          {mode === 'crop' ? 'Crop Mode' : 'Edit Mode'}
        </div>

        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '6px 16px',
              background: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleComplete}
            disabled={!template}
            style={{
              padding: '6px 16px',
              background: template ? '#3b82f6' : '#d1d5db',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#ffffff',
              cursor: template ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              if (template) {
                e.currentTarget.style.background = '#2563eb'
              }
            }}
            onMouseLeave={(e) => {
              if (template) {
                e.currentTarget.style.background = '#3b82f6'
              }
            }}
          >
            Done
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        {template ? (
          <CanvasStage
            template={template}
            width={canvasSize.w}
            height={canvasSize.h}
            zoom={zoom}
            gridVisible={gridVisible}
            onGridToggle={toggleGrid}
            selectedSlots={selectedSlots}
            onSelectionChange={setSelection}
            onSlotModified={(slotName, frame) => {
              updateSlotFrame(slotName, frame)
            }}
            onDuplicateSlot={duplicateSlot}
            onToggleLockSlot={toggleLockSlot}
            onRemoveSlot={deleteSlot}
            onZoomChange={setZoom}
            snapToGrid={false}
            snapGridSize={4}
            smartSnapOptions={smartSnapOptions}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                Waiting for template...
              </div>
              <div style={{ fontSize: '12px' }}>
                Parent will send template data
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { useGesture } from '@use-gesture/react'
import { Flex } from 'antd'
import { SvgStage } from '../editor/svg/SvgStage'
import { SvgStageV2 } from '../editor/svg-v2/SvgStageV2'
import { SearchOutlined, ZoomInOutlined, ZoomOutOutlined, BorderOutlined, PlusOutlined } from '@ant-design/icons'
import { FilePlus } from 'lucide-react'
import type { Template } from '../schema/types'
import type { SmartSnapOptions } from '../editor/utils/smartSnapping'
import { LayerActionsChipOverlay } from './LayerActionsChipOverlay'
import { PageControls } from './PageControls'
import { CustomPageSizeModal } from './CustomPageSizeModal'
import { AddPageDropdown } from './AddPageDropdown'
import { AddPageModal } from './AddPageModal'
import { useEditorStore } from '../state/editorStore'
import { GradientOverlay } from './color/GradientOverlay'
import type { Page } from '../schema/types'
import { getNormalizedDimensions } from '../editor/utils/normalization'
import { getUiScale } from '../utils/uiScale'

// Feature flag for V2 canvas
const USE_V2_CANVAS = import.meta.env.VITE_USE_V2_CANVAS === 'true'

/**
 * Get pixel dimensions for a page based on its preferred ratio
 * Falls back to template's first ratio if page has no preference
 */
function getPageDimensions(page: Page, template: Template): { id: string; w: number; h: number } {
  const frameRatios = page.frames ? Object.keys(page.frames) : []
  const preferredRatio = page.preferredRatio || frameRatios[0] || template.canvas?.ratios?.[0] || '1080x1080'
  const normalized = getNormalizedDimensions(preferredRatio)

  return {
    id: preferredRatio,
    w: normalized.w,
    h: normalized.h
  }
}

interface CanvasStageProps {
  template: Template | null
  width: number
  height: number
  zoom: number
  gridVisible: boolean
  onGridToggle: () => void
  selectedSlots: string[]
  onSelectionChange: (slotNames: string[]) => void
  onSlotModified: (slotName: string, frame: { x?: number; y?: number; width?: number; height?: number; rotation?: number }) => void
  onDuplicateSlot?: (slotName: string) => void
  onToggleLockSlot?: (slotName: string) => void
  onRemoveSlot?: (slotName: string) => void
  onZoomChange: (zoom: number) => void
  snapToGrid?: boolean
  snapGridSize?: number
  smartSnapOptions?: SmartSnapOptions
}

interface CanvasStageInternalProps extends CanvasStageProps {
  sidebarWidth?: number
}

export function CanvasStage({
  template,
  width,
  height,
  zoom,
  gridVisible,
  onGridToggle,
  selectedSlots,
  onSelectionChange,
  onSlotModified,
  onDuplicateSlot,
  onToggleLockSlot,
  onRemoveSlot,
  onZoomChange,
  sidebarWidth = 76,
  snapToGrid = false,
  snapGridSize = 4,
  smartSnapOptions
}: CanvasStageInternalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRefs = useRef<{ [pageId: string]: SVGSVGElement | null }>({})
  const pageRefs = useRef<{ [pageId: string]: HTMLDivElement | null }>({})
  const prevPageCountRef = useRef<number>(0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanEnabled, setIsPanEnabled] = useState(false) // Locked by default
  const [isZooming, setIsZooming] = useState(false) // Track if actively using zoom slider
  const [customSizeModalOpen, setCustomSizeModalOpen] = useState(false)
  const [addPageModalOpen, setAddPageModalOpen] = useState(false)

  // Get page actions from store
  const currentPageId = useEditorStore(state => state.currentPageId)
  const setCurrentPage = useEditorStore(state => state.setCurrentPage)
  const renamePage = useEditorStore(state => state.renamePage)
  const reorderPage = useEditorStore(state => state.reorderPage)
  const duplicatePage = useEditorStore(state => state.duplicatePage)
  const deletePage = useEditorStore(state => state.deletePage)
  const addPage = useEditorStore(state => state.addPage)
  const canvasSize = useEditorStore(state => state.canvasSize)
  const setCanvasSelected = useEditorStore(state => state.setCanvasSelected)
  const setHoveredSlot = useEditorStore(state => state.setHoveredSlot)

  // Smooth pan and pinch-to-zoom gestures (only when pan enabled)
  const bind = useGesture(
    {
      onDrag: ({ offset: [x, y], pinching, cancel, event }) => {
        if (!isPanEnabled) return // Don't allow panning when locked
        if (pinching) return cancel()
        // Only pan on background, not on canvas elements
        if ((event.target as HTMLElement).closest('.canvas-container')) return
        setPan({ x, y })
      },
      onPinch: ({ offset: [scale] }) => {
        onZoomChange(Math.max(10, Math.min(200, scale)))
      },
      onWheel: ({ event, delta: [, dy], metaKey, ctrlKey }) => {
        // Ctrl/Cmd + Wheel = Zoom
        if (metaKey || ctrlKey) {
          event.preventDefault()
          const newZoom = zoom - dy * 0.5
          onZoomChange(Math.max(10, Math.min(200, newZoom)))
        }
      }
    },
    {
      drag: { from: () => [pan.x, pan.y], enabled: isPanEnabled },
      pinch: { from: () => [zoom, zoom], scaleBounds: { min: 10, max: 200 } }
    }
  )

  // Calculate scaled content dimensions to prevent excess scroll space
  const pageControlsHeight = 100 // Approximate height of page controls (increased for larger icons)
  const gapHeight = 120 // marginBottom between pages (increased 50% from 80px for better separation)

  const pageMetrics = useMemo(() => {
    if (!template) return null
    return template.pages.map(page => ({
      page,
      dimensions: getPageDimensions(page, template)
    }))
  }, [template])

  const maxPageWidth = pageMetrics && pageMetrics.length > 0
    ? Math.max(...pageMetrics.map(metric => metric.dimensions.w))
    : width

  const totalUnscaledHeight = pageMetrics && pageMetrics.length > 0
    ? pageMetrics.reduce((sum, metric, index) => (
        sum + metric.dimensions.h + pageControlsHeight + (index < pageMetrics.length - 1 ? gapHeight : 0)
      ), 0)
    : height + pageControlsHeight

  const scaledHeight = totalUnscaledHeight * (zoom / 100)
  const scaledWidth = maxPageWidth * (zoom / 100)

  const handleContainerMouseDownCapture = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return

    const target = event.target as HTMLElement

    if (target.closest('[data-canvas-svg="true"]')) {
      return
    }

    const canvasContainer = target.closest('.canvas-container')
    if (canvasContainer) {
      const svgElement = canvasContainer.querySelector('[data-canvas-svg="true"]') as SVGSVGElement | null
      if (svgElement) {
        setHoveredSlot(null)
        setCanvasSelected(false)
        const marqueeEvent = new CustomEvent('external-marquee-start', {
          detail: {
            clientX: event.clientX,
            clientY: event.clientY,
            shiftKey: event.shiftKey
          }
        })
        svgElement.dispatchEvent(marqueeEvent)
        return
      }
    }

    setHoveredSlot(null)
    onSelectionChange([])
    setCanvasSelected(false)
  }, [onSelectionChange, setHoveredSlot, setCanvasSelected])

  // Function to scroll to a specific page
  const scrollToPage = useCallback((pageId: string) => {
    const pageElement = pageRefs.current[pageId]
    const container = containerRef.current

    if (!pageElement || !container) return

    // Calculate the scroll position to center the page
    const containerHeight = container.clientHeight
    const pageTop = pageElement.offsetTop
    const pageHeight = pageElement.clientHeight

    // Scroll to center the page in the viewport
    const scrollTarget = pageTop - (containerHeight - pageHeight) / 2

    container.scrollTo({
      top: Math.max(0, scrollTarget),
      behavior: 'smooth'
    })
  }, [])

  // Auto-scroll to newly added pages
  useEffect(() => {
    if (!template) return

    const currentPageCount = template.pages.length
    const prevPageCount = prevPageCountRef.current

    // If a page was added (not initial render)
    if (prevPageCount > 0 && currentPageCount > prevPageCount) {
      // Scroll to the last (newly added) page
      const lastPage = template.pages[template.pages.length - 1]
      if (lastPage) {
        // Small delay to ensure DOM has updated
        setTimeout(() => {
          scrollToPage(lastPage.id)
          setCurrentPage(lastPage.id)
        }, 100)
      }
    }

    prevPageCountRef.current = currentPageCount
  }, [template, scrollToPage, setCurrentPage])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'visible',
        background: '#F3F6F6'
      }}
    >
      {/* Dotted Background Pattern - Fixed position, doesn't scroll */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, #E1DFF6 1px, transparent 1px)',
        backgroundSize: '16px 16px',
        pointerEvents: 'none',
        opacity: 1,
        zIndex: 0
      }} />

      {/* Scrollable Canvas Container - Allows vertical scroll for multi-page */}
      <div
        ref={containerRef}
        {...bind()}
        onMouseDownCapture={handleContainerMouseDownCapture}
        style={{
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          zIndex: 1,
          touchAction: 'none',
          cursor: isPanEnabled ? 'grab' : 'default'
        }}
      >
        <Flex vertical align="center" style={{ padding: '80px 0 24px 0', minHeight: 0 }}>
          {/* Scaled container wrapper - prevents excess scroll space */}
          <div style={{
            height: `${scaledHeight}px`,
            width: `${scaledWidth}px`,
            position: 'relative'
          }}>
            {/* Single Zoom Transform Container - All pages scale together */}
            <div
              id="canvas-scaler"
              style={{
                transform: `translateX(-50%) scale(${zoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
                position: 'absolute',
                top: 0,
                left: '50%'
              }}
            >
            {/* Multi-Page Canvas - Each page in unified wrapper */}
            {template && pageMetrics?.map(({ page, dimensions: pageDimensions }, pageIndex) => {
              const safeInset = Math.min(pageDimensions.w, pageDimensions.h) * 0.05

              return (
              <div
                key={page.id}
                ref={(el) => { pageRefs.current[page.id] = el }}
                className="page-wrapper"
                style={{
                  position: 'relative',
                  width: `${pageDimensions.w}px`,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  marginBottom: pageIndex < template.pages.length - 1 ? '120px' : '0',  // Increased 50% from 80px
                  overflow: 'visible'
                }}
              >
                {/* Page Controls - Locked directly above canvas */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: template.pages.length > 1 ? 'space-between' : 'flex-end',
                  paddingLeft: '18px',
                  paddingRight: '18px',
                  paddingTop: '16px',
                  paddingBottom: '12px',
                  maxWidth: '100%',
                  overflow: 'visible',
                  position: 'relative',
                  zIndex: 3
                }}>
                  <PageControls
                    page={page}
                    pageIndex={pageIndex}
                    totalPages={template.pages.length}
                    showName={template.pages.length > 1}
                    zoom={zoom}
                    onRename={(name) => renamePage(page.id, name)}
                    onMoveUp={() => reorderPage(page.id, 'up')}
                    onMoveDown={() => reorderPage(page.id, 'down')}
                    onDuplicate={() => duplicatePage(page.id)}
                    onDelete={() => deletePage(page.id)}
                    onAddPage={(size) => addPage(size)}
                    onCustomPageSize={() => setCustomSizeModalOpen(true)}
                  />
                </div>

                {/* Canvas Container - Directly below controls */}
                <div
                  onClick={(event) => {
                    if (event.target === event.currentTarget) {
                      setCurrentPage(page.id)
                    }
                  }}
                  className="canvas-container"
                  style={{
                    background: '#ffffff',
                    boxShadow: currentPageId === page.id
                      ? '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)'
                      : '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.15s ease-out',
                    position: 'relative',
                    overflow: 'hidden',
                    width: `${pageDimensions.w}px`,
                    height: `${pageDimensions.h}px`,
                    borderRadius: '0',  // Removed rounded corners for perfectly square canvas
                    zIndex: 1
                  }}
                >
                  {/* SVG Stage - Feature-flagged V1/V2 rendering */}
                  {USE_V2_CANVAS ? (
                    <SvgStageV2
                      ref={(el) => { svgRefs.current[page.id] = el }}
                      template={template}
                      page={page}
                      width={pageDimensions.w}
                      height={pageDimensions.h}
                      ratioId={pageDimensions.id}
                      selectedSlots={currentPageId === page.id ? selectedSlots : []}
                      onSelectionChange={onSelectionChange}
                      onSlotModified={onSlotModified}
                      onDuplicateSlot={onDuplicateSlot}
                      onToggleLockSlot={onToggleLockSlot}
                      onRemoveSlot={onRemoveSlot}
                      snapToGrid={snapToGrid}
                      snapGridSize={snapGridSize}
                      smartSnapOptions={smartSnapOptions}
                      onRequestPageFocus={setCurrentPage}
                    />
                  ) : (
                    <SvgStage
                      ref={(el) => { svgRefs.current[page.id] = el }}
                      template={template}
                      page={page}
                      width={pageDimensions.w}
                      height={pageDimensions.h}
                      ratioId={pageDimensions.id}
                      selectedSlots={currentPageId === page.id ? selectedSlots : []}
                      onSelectionChange={onSelectionChange}
                      onSlotModified={onSlotModified}
                      onDuplicateSlot={onDuplicateSlot}
                      onToggleLockSlot={onToggleLockSlot}
                      onRemoveSlot={onRemoveSlot}
                      snapToGrid={snapToGrid}
                      snapGridSize={snapGridSize}
                      smartSnapOptions={smartSnapOptions}
                      onRequestPageFocus={setCurrentPage}
                    />
                  )}

                  {/* Safe Area Guides - Uses page-specific dimensions */}
                  <svg
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none'
                    }}
                    viewBox={`0 0 ${pageDimensions.w} ${pageDimensions.h}`}
                  >
                    <rect
                      x={safeInset}
                      y={safeInset}
                      width={Math.max(pageDimensions.w - safeInset * 2, 0)}
                      height={Math.max(pageDimensions.h - safeInset * 2, 0)}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      opacity="0.5"
                    />
                  </svg>

                  {/* Gradient Editing Overlay - Shows gradient handles on canvas */}
                  {currentPageId === page.id && (
                    <svg
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none'
                      }}
                      viewBox={`0 0 ${pageDimensions.w} ${pageDimensions.h}`}
                    >
                      <g style={{ pointerEvents: 'all' }}>
                        <GradientOverlay />
                      </g>
                    </svg>
                  )}
                </div>
              </div>
              )
            })}

            {/* Add Page Button - Opens modal with size options */}
            {template && (() => {
              const buttonScale = getUiScale(zoom, { min: 1, max: 1.6 })

              return (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  paddingTop: '40px',
                  paddingBottom: template.pages.length > 1 ? '80px' : '40px',  // Dynamic margin for multi-page
                  marginTop: '24px',
                  animation: 'fadeIn 0.4s ease-out',
                  position: 'relative'
                }}>
                  <button
                    onClick={() => setAddPageModalOpen(true)}
                    style={{
                      border: '2px solid #3b82f6',
                      background: '#ffffff',
                      color: '#3b82f6',
                      padding: `${Math.round(12 * buttonScale)}px ${Math.round(28 * buttonScale)}px`,
                      fontSize: `${Math.round(16 * buttonScale)}px`,
                      fontWeight: '700',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: `${Math.round(10 * buttonScale)}px`,
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#3b82f6'
                      e.currentTarget.style.color = '#ffffff'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.25)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff'
                      e.currentTarget.style.color = '#3b82f6'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)'
                    }}
                  >
                    <FilePlus size={Math.round(22 * buttonScale)} />
                    <span>Add Page</span>
                  </button>
                </div>
              )
            })()}
            </div>
          </div>
        </Flex>
      </div>

      {/* Bottom-Left Zoom Controls - Follows sidebar - Only show when template exists */}
      {template && (
        <div style={{
          position: 'fixed',
          bottom: '16px',
          left: `${sidebarWidth + 16}px`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#ffffff',
          padding: '6px 12px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 100
        }}>
        {/* Zoom Out Icon */}
        <button
          onClick={() => onZoomChange(Math.max(10, zoom - 10))}
          style={{
            width: '28px',
            height: '28px',
            border: 'none',
            background: 'transparent',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            color: '#6b7280',
            transition: 'background 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <ZoomOutOutlined />
        </button>

        {/* Zoom Slider */}
        <input
          type="range"
          min="10"
          max="200"
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          onMouseDown={() => setIsZooming(true)}
          onMouseUp={() => setIsZooming(false)}
          onMouseLeave={() => setIsZooming(false)}
          style={{
            width: '100px',
            cursor: 'pointer',
            accentColor: '#3b82f6'
          }}
        />

        {/* Zoom In Icon */}
        <button
          onClick={() => onZoomChange(Math.min(200, zoom + 10))}
          style={{
            width: '28px',
            height: '28px',
            border: 'none',
            background: 'transparent',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            color: '#6b7280',
            transition: 'background 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <ZoomInOutlined />
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', background: '#e5e7eb' }} />

        {/* Grid Toggle */}
        <button
          onClick={onGridToggle}
          style={{
            width: '28px',
            height: '28px',
            border: 'none',
            background: gridVisible ? '#3b82f6' : 'transparent',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            color: gridVisible ? '#ffffff' : '#6b7280',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            if (!gridVisible) e.currentTarget.style.background = '#f3f4f6'
          }}
          onMouseLeave={(e) => {
            if (!gridVisible) e.currentTarget.style.background = 'transparent'
          }}
        >
          <BorderOutlined />
        </button>

        {/* Zoom Percentage - Only show when actively using slider */}
        {isZooming && (
          <span style={{
            fontSize: '12px',
            color: '#6b7280',
            fontWeight: '500',
            minWidth: '42px',
            textAlign: 'center'
          }}>
            {zoom}%
          </span>
        )}
        </div>
      )}

      {/* DOM-based Chip Overlay - Renders outside SVG, never gets clipped */}
      {template && currentPageId && selectedSlots.length > 0 && (() => {
        const currentPage = template.pages.find(p => p.id === currentPageId)
        if (!currentPage) return null

        const selectedSlot = currentPage.slots.find(s => s.name === selectedSlots[0])
        if (!selectedSlot) return null

        // Get frame for current canvas size from the current page
        const frame = currentPage.frames[canvasSize.id]?.[selectedSlots[0]]

        return (
          <LayerActionsChipOverlay
            svgElement={svgRefs.current[currentPageId]}
            selectedSlot={selectedSlot}
            frame={frame || null}
            zoom={zoom}
            panOffset={pan}
            onDuplicate={() => onDuplicateSlot?.(selectedSlots[0])}
            onToggleLock={() => onToggleLockSlot?.(selectedSlots[0])}
            onRemove={() => onRemoveSlot?.(selectedSlots[0])}
          />
        )
      })()}

      {/* Custom Page Size Modal */}
      <CustomPageSizeModal
        isOpen={customSizeModalOpen}
        onClose={() => setCustomSizeModalOpen(false)}
        onAddPage={(size) => {
          addPage(size)
          setCustomSizeModalOpen(false)
        }}
      />

      {/* Add Page Modal */}
      <AddPageModal
        isOpen={addPageModalOpen}
        onClose={() => setAddPageModalOpen(false)}
        onAddPage={(size) => {
          addPage(size)
          setAddPageModalOpen(false)
        }}
        onCustomSize={() => {
          setCustomSizeModalOpen(true)
          setAddPageModalOpen(false)
        }}
      />
    </div>
  )
}

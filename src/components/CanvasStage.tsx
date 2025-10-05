import React, { useRef, useState } from 'react'
import { useGesture } from '@use-gesture/react'
import { Flex } from 'antd'
import { SvgStage } from '../editor/svg/SvgStage'
import { SvgStageV2 } from '../editor/svg-v2/SvgStageV2'
import { SearchOutlined, ZoomInOutlined, ZoomOutOutlined, BorderOutlined } from '@ant-design/icons'
import type { Template } from '../schema/types'
import type { SmartSnapOptions } from '../editor/utils/smartSnapping'
import { LayerActionsChipOverlay } from './LayerActionsChipOverlay'
import { PageControls } from './PageControls'
import { applyLayoutForSize } from '../layout/layoutEngine'
import { useEditorStore } from '../state/editorStore'

// Feature flag for V2 canvas
const USE_V2_CANVAS = import.meta.env.VITE_USE_V2_CANVAS === 'true'

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
  snapGridSize = 10,
  smartSnapOptions
}: CanvasStageInternalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRefs = useRef<{ [pageId: string]: SVGSVGElement | null }>({})
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanEnabled, setIsPanEnabled] = useState(false) // Locked by default
  const [isZooming, setIsZooming] = useState(false) // Track if actively using zoom slider

  // Get page actions from store
  const currentPageId = useEditorStore(state => state.currentPageId)
  const setCurrentPage = useEditorStore(state => state.setCurrentPage)
  const renamePage = useEditorStore(state => state.renamePage)
  const reorderPage = useEditorStore(state => state.reorderPage)
  const duplicatePage = useEditorStore(state => state.duplicatePage)
  const deletePage = useEditorStore(state => state.deletePage)
  const canvasSize = useEditorStore(state => state.canvasSize)

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
  const pageControlsHeight = 80 // Approximate height of page controls
  const singlePageHeight = height + pageControlsHeight
  const gapHeight = 60 // marginBottom between pages
  const numPages = template?.pages.length || 1
  const totalUnscaledHeight = (singlePageHeight * numPages) + (gapHeight * (numPages - 1))
  const scaledHeight = totalUnscaledHeight * (zoom / 100)
  const scaledWidth = width * (zoom / 100)

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
        <Flex vertical align="center" style={{ padding: '110px 0 24px 0', minHeight: 0 }}>
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
            {template && template.pages.map((page, pageIndex) => (
              <div
                key={page.id}
                className="page-wrapper"
                style={{
                  position: 'relative',
                  width: `${width}px`,
                  marginBottom: pageIndex < template.pages.length - 1 ? '60px' : '0'
                }}
              >
                {/* Page Controls - Locked directly above canvas */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: template.pages.length > 1 ? 'space-between' : 'flex-end',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  paddingTop: '12px',
                  paddingBottom: '8px'
                }}>
                  <PageControls
                    page={page}
                    pageIndex={pageIndex}
                    totalPages={template.pages.length}
                    showName={template.pages.length > 1}
                    onRename={(name) => renamePage(page.id, name)}
                    onMoveUp={() => reorderPage(page.id, 'up')}
                    onMoveDown={() => reorderPage(page.id, 'down')}
                    onDuplicate={() => duplicatePage(page.id)}
                    onDelete={() => deletePage(page.id)}
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
                      ? '0 4px 6px -1px rgb(59 130 246 / 0.3), 0 2px 4px -2px rgb(59 130 246 / 0.2)'
                      : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    transition: 'all 0.15s ease-out',
                    position: 'relative',
                    overflow: 'visible'
                  }}
                >
                  {/* SVG Stage - Feature-flagged V1/V2 rendering */}
                  {USE_V2_CANVAS ? (
                    <SvgStageV2
                      ref={(el) => { svgRefs.current[page.id] = el }}
                      template={template}
                      page={page}
                      width={width}
                      height={height}
                      ratioId={canvasSize.id}
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
                      width={width}
                      height={height}
                      ratioId={canvasSize.id}
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

                  {/* Safe Area Guides */}
                  <svg
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none'
                    }}
                    viewBox={`${template.canvas.baseViewBox[0]} ${template.canvas.baseViewBox[1]} ${template.canvas.baseViewBox[2]} ${template.canvas.baseViewBox[3]}`}
                  >
                    <rect
                      x={template.canvas.baseViewBox[0] + 32}
                      y={template.canvas.baseViewBox[1] + 32}
                      width={template.canvas.baseViewBox[2] - 64}
                      height={template.canvas.baseViewBox[3] - 64}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      opacity="0.5"
                    />
                  </svg>
                </div>
              </div>
            ))}
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
    </div>
  )
}

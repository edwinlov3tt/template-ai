import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { importSvgToTemplate } from '../importer/importSvg'
import { validateTemplate } from '../schema/validateTemplate'
import type { Template, Slot } from '../schema/types'
import { TopBar } from '../components/TopBar'
import { LeftRail } from '../components/LeftRail'
import { RightRail } from '../components/RightRail'
import { CanvasStage } from '../components/CanvasStage'
import { ResizeModal } from '../components/ResizeModal'
import { ExportModal } from '../components/ExportModal'
import { SettingsModal } from '../components/SettingsModal'
import { PropertiesToolbar } from '../components/PropertiesToolbar'
import { FloatingTextToolbar } from '../components/typography/FloatingTextToolbar'
import { LeftSidePanel, type LeftPanelView } from '../components/LeftSidePanel'
import { CanvasPropertiesPanel } from '../components/CanvasPropertiesPanel'
import { ColorPanel } from '../components/color/ColorPanel'
import { useEditorStore } from '../state/editorStore'
import { preloadTemplateFonts } from '../utils/fontLoader'
import type { SmartSnapOptions } from '../editor/utils/smartSnapping'
import type { ShapeId } from '../shapes/registry'

export default function Editor() {
  const navigate = useNavigate()

  // Get state and actions from Zustand store
  const template = useEditorStore(state => state.template)
  const setTemplate = useEditorStore(state => state.setTemplate)
  const templateName = useEditorStore(state => state.templateName)
  const setTemplateName = useEditorStore(state => state.setTemplateName)
  const selectedSlots = useEditorStore(state => state.selectedSlots)
  const setSelection = useEditorStore(state => state.setSelection)
  const editingSlot = useEditorStore(state => state.editingSlot)
  const canvasSize = useEditorStore(state => state.canvasSize)
  const setCanvasSize = useEditorStore(state => state.setCanvasSize)
  const zoom = useEditorStore(state => state.zoom)
  const setZoom = useEditorStore(state => state.setZoom)
  const gridVisible = useEditorStore(state => state.gridVisible)
  const toggleGrid = useEditorStore(state => state.toggleGrid)
  const updateSlot = useEditorStore(state => state.updateSlot)
  const updateSlotFrame = useEditorStore(state => state.updateSlotFrame)
  const undo = useEditorStore(state => state.undo)
  const redo = useEditorStore(state => state.redo)
  const canUndo = useEditorStore(state => state.canUndo)
  const canRedo = useEditorStore(state => state.canRedo)
  const addSlot = useEditorStore(state => state.addSlot)
  const deleteSlot = useEditorStore(state => state.deleteSlot)
  const createNewTemplate = useEditorStore(state => state.createNewTemplate)
  const setCurrentPage = useEditorStore(state => state.setCurrentPage)
  const currentPageId = useEditorStore(state => state.currentPageId)
  const reorderSlots = useEditorStore(state => state.reorderSlots)
  const canvasSelected = useEditorStore(state => state.canvasSelected)

  // Local UI state (modals)
  const [resizeModalOpen, setResizeModalOpen] = React.useState(false)
  const [exportModalOpen, setExportModalOpen] = React.useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false)
  type ToolId = 'templates' | 'text' | 'images' | 'shapes' | 'vectors' | 'uploads' | 'more' | 'colors'
  const [leftPanelCollapsed, setLeftPanelCollapsed] = React.useState(false)
  const [activeTool, setActiveTool] = React.useState<ToolId | null>(null)
  const [leftSidePanelView, setLeftSidePanelView] = React.useState<LeftPanelView>(null)

  // Settings state
  const [snapToGrid, setSnapToGrid] = React.useState(false)
  const [snapGridSize, setSnapGridSize] = React.useState(4)
  const [smartSnapOptions, setSmartSnapOptions] = React.useState<SmartSnapOptions>({
    enabled: true,
    threshold: 4,
    snapToEdges: true,
    snapToCenter: true,
    snapToObjects: true,
    showDistances: false
  })

  // Calculate sidebar width: icon bar (76px) + panel (300px if open)
  const sidebarWidth = 76 + (!leftPanelCollapsed && activeTool ? 300 : 0)

  // Get current page and its slots
  const currentPage = template?.pages.find(p => p.id === currentPageId)
  const currentPageSlots = currentPage?.slots || []

  // If no template exists, create a default one on mount
  useEffect(() => {
    if (!template) {
      createNewTemplate()
    }
  }, [])

  function handleUpdateSlot(slotName: string, updates: Partial<Slot>) {
    updateSlot(slotName, updates, `Updated ${slotName}`)
  }

  function handleSlotModified(slotName: string, frame: { x?: number; y?: number; width?: number; height?: number; rotation?: number }) {
    updateSlotFrame(slotName, frame)
  }

  function handleSelectionChange(slotNames: string[]) {
    setSelection(slotNames)
  }

  function handleInsertShape(shapeId: ShapeId, shapeOptions?: Record<string, unknown>) {
    addSlot('shape', { shapeId, shapeOptions })
  }

  function handleDuplicateSlot(slotName: string) {
    if (!template || !currentPageId) return

    const currentPage = template.pages.find(p => p.id === currentPageId)
    if (!currentPage) return

    const slot = currentPage.slots.find(s => s.name === slotName)
    if (!slot) return

    // Generate unique name
    const baseName = slotName.replace(/-\d+$/, '')
    let counter = 1
    let newName = `${baseName}-${counter}`
    while (currentPage.slots.some(s => s.name === newName)) {
      counter++
      newName = `${baseName}-${counter}`
    }

    // Find current frame
    const currentRatio = canvasSize.id
    const frame = currentPage.frames[currentRatio]?.[slotName]

    // Duplicate slot
    const newSlot = { ...slot, name: newName, z: slot.z + 1 }
    const newSlots = [...currentPage.slots, newSlot]

    // Duplicate frame with slight offset
    const newFrames = { ...currentPage.frames }
    if (frame && newFrames[currentRatio]) {
      newFrames[currentRatio][newName] = {
        ...frame,
        x: frame.x + 20,
        y: frame.y + 20
      }
    }

    // Update the current page
    const updatedPage = {
      ...currentPage,
      slots: newSlots,
      frames: newFrames
    }

    // Update template with new page
    const newTemplate = {
      ...template,
      pages: template.pages.map(p => p.id === currentPageId ? updatedPage : p)
    }

    setTemplate(newTemplate)
    setSelection([newName])
  }

  function handleToggleLockSlot(slotName: string) {
    if (!template || !currentPageId) return

    const currentPage = template.pages.find(p => p.id === currentPageId)
    if (!currentPage) return

    const slot = currentPage.slots.find(s => s.name === slotName)
    if (!slot) return

    updateSlot(slotName, { locked: !slot.locked }, `${slot.locked ? 'Unlocked' : 'Locked'} ${slotName}`)
  }

  function handleRemoveSlot(slotName: string) {
    deleteSlot(slotName)
  }

  function handleSelectSlot(slotName: string, pageId: string, options?: { extend?: boolean; toggle?: boolean }) {
    setCurrentPage(pageId)

    if (options?.extend) {
      const alreadySelected = selectedSlots.includes(slotName)
      if (alreadySelected) {
        if (options.toggle) {
          setSelection(selectedSlots.filter(name => name !== slotName))
        }
        return
      }

      setSelection([...selectedSlots, slotName])
      return
    }

    setSelection([slotName])
  }

  function handleBackToHome() {
    navigate('/')
  }

  // Update document title with template name and canvas size
  useEffect(() => {
    if (template) {
      const title = `${templateName} - ${canvasSize.w}×${canvasSize.h}px`
      document.title = title
    } else {
      document.title = 'Template Editor'
    }
  }, [templateName, canvasSize, template])

  // Preload fonts when template changes
  useEffect(() => {
    if (template) {
      preloadTemplateFonts(template).catch(error => {
        console.error('[App] Font preloading failed:', error)
      })
    }
  }, [template])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey

      // Cmd/Ctrl+Z: Undo
      if (cmdOrCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }

      // Cmd/Ctrl+Shift+Z: Redo
      if (cmdOrCtrl && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
      }

      // Cmd/Ctrl+S: Save
      if (cmdOrCtrl && e.key === 's') {
        e.preventDefault()
        console.log('Save template')
        // TODO: Implement save functionality
      }

      // Cmd/Ctrl+D: Duplicate selected slot
      if (cmdOrCtrl && e.key === 'd' && selectedSlots.length > 0) {
        e.preventDefault()
        handleDuplicateSlot(selectedSlots[0])
      }

      // Cmd/Ctrl+L: Toggle lock on selected slot
      if (cmdOrCtrl && e.key === 'l' && selectedSlots.length > 0) {
        e.preventDefault()
        handleToggleLockSlot(selectedSlots[0])
      }

      // Delete/Backspace: Delete selected slot (only when NOT editing text)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedSlots.length > 0 && !editingSlot) {
        e.preventDefault()
        handleRemoveSlot(selectedSlots[0])
      }

      // Arrow keys: Nudge selected slot (1px or 10px with Shift)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedSlots.length > 0 && template && currentPageId) {
          e.preventDefault()
          const nudge = e.shiftKey ? 10 : 1
          const deltaX = e.key === 'ArrowLeft' ? -nudge : e.key === 'ArrowRight' ? nudge : 0
          const deltaY = e.key === 'ArrowUp' ? -nudge : e.key === 'ArrowDown' ? nudge : 0

          const currentPage = template.pages.find(p => p.id === currentPageId)
          if (!currentPage) return

          const currentRatio = canvasSize.id

          selectedSlots.forEach(slotName => {
            const slot = currentPage.slots.find(s => s.name === slotName)
            if (!slot || (slot as any).locked) return

            const frame = currentPage.frames[currentRatio]?.[slotName]
            if (!frame) return

            updateSlotFrame(slotName, {
              x: frame.x + deltaX,
              y: frame.y + deltaY
            })
          })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedSlots, template, undo, redo, updateSlotFrame, handleDuplicateSlot, handleToggleLockSlot, handleRemoveSlot, editingSlot, canvasSize, currentPageId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const { template: importedTemplate, report } = await importSvgToTemplate(text)
    const result = validateTemplate(importedTemplate)

    if (!result.valid) {
      console.error('Schema validation errors:', result.errors)
      alert(`Template failed schema validation:\n${result.errorSummary}`)
      return
    }

    if (report.warnings.length > 0) {
      console.warn('Import warnings:', report.warnings)
    }

    console.log('Import report:', report)
    const validTemplate = importedTemplate as Template
    setTemplate(validTemplate)
  }

  function handleValidate() {
    if (!template) {
      alert('No template loaded')
      return
    }

    const result = validateTemplate(template)
    if (result.valid) {
      alert('Template is valid!')
    } else {
      console.error('Validation errors:', result.errors)
      alert(`Validation failed:\n${result.errorSummary}`)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, ui-sans-serif, system-ui'
      }}
      onClick={(e) => {
        // Deselect when clicking on background (outside canvas)
        if (e.target === e.currentTarget) {
          setSelection([])
        }
      }}
    >
      {/* Top Bar */}
      <div style={{ height: '48px', zIndex: 50 }}>
        <TopBar
          onFileClick={handleBackToHome}
          onResizeClick={() => setResizeModalOpen(true)}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo()}
          canRedo={canRedo()}
          onValidate={handleValidate}
          onPreview={() => console.log('Preview')}
          onExport={() => {
            setSelection([]) // Clear selection before export to avoid border in output
            setExportModalOpen(true)
          }}
          onSave={() => {
            setSelection([]) // Clear selection before save
            console.log('Save')
          }}
          onSettingsClick={() => setSettingsModalOpen(true)}
          canvasSize={canvasSize}
          templateName={templateName}
          onTemplateNameChange={setTemplateName}
          hasTemplate={!!template}
        />
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflowX: 'hidden', overflowY: 'visible' }}>
        {/* Left Rail - Returns both icon bar and slide-out panel */}
        <LeftRail
          onUploadSvg={handleUpload}
          onAddSlot={addSlot}
          onInsertShape={handleInsertShape}
          onCreateNewTemplate={createNewTemplate}
          hasTemplate={!!template}
          isCollapsed={leftPanelCollapsed}
          onToggleCollapse={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
          activeTool={activeTool}
          onActiveToolChange={setActiveTool}
        />

        {/* Canvas Stage - Flex fill remaining space */}
        <div style={{ flex: 1, position: 'relative' }}>
          <CanvasStage
            template={template}
            width={canvasSize.w}
            height={canvasSize.h}
            zoom={zoom}
            gridVisible={gridVisible}
            onGridToggle={toggleGrid}
            selectedSlots={selectedSlots}
            onSelectionChange={handleSelectionChange}
            onSlotModified={handleSlotModified}
            onDuplicateSlot={handleDuplicateSlot}
            onToggleLockSlot={handleToggleLockSlot}
            onRemoveSlot={handleRemoveSlot}
            onZoomChange={setZoom}
            sidebarWidth={sidebarWidth}
            snapToGrid={snapToGrid}
            snapGridSize={snapGridSize}
            smartSnapOptions={smartSnapOptions}
          />

          {/* Floating Text Toolbar - Show ONLY when text/button slots are selected (if enabled) */}
          {import.meta.env.VITE_ADVANCED_TYPOGRAPHY === 'true' &&
           template &&
           selectedSlots.length > 0 &&
           currentPageSlots.find(s => s.name === selectedSlots[0])?.type &&
           ['text', 'button'].includes(currentPageSlots.find(s => s.name === selectedSlots[0])!.type) && (
            <FloatingTextToolbar
              onOpenEffects={() => setLeftSidePanelView('effects')}
              onOpenPosition={() => setLeftSidePanelView('position')}
            />
          )}

          {/* Properties Toolbar - Show for non-text slots OR when VITE_ADVANCED_TYPOGRAPHY is disabled */}
          {template && selectedSlots.length > 0 && (
            import.meta.env.VITE_ADVANCED_TYPOGRAPHY !== 'true' ||
            !['text', 'button'].includes(currentPageSlots.find(s => s.name === selectedSlots[0])?.type || '')
          ) && (
            <PropertiesToolbar
              selectedSlot={selectedSlots[0]}
              slot={currentPageSlots.find(s => s.name === selectedSlots[0]) || null}
              onUpdateSlot={handleUpdateSlot}
            />
          )}

          {/* Canvas Properties Panel - Show when canvas background is selected */}
          {canvasSelected && currentPageId && (
            <CanvasPropertiesPanel pageId={currentPageId} />
          )}

          {/* Floating Layers Panel - Only show when template exists */}
          {template && (
            <RightRail
              template={template}
              selectedLayer={selectedSlots[0] || null}
              selectedSlots={selectedSlots}
              onUpdateSlot={handleUpdateSlot}
              onDuplicateSlot={handleDuplicateSlot}
              onToggleLockSlot={handleToggleLockSlot}
              onRemoveSlot={handleRemoveSlot}
              onSelectSlot={handleSelectSlot}
              onReorderSlots={reorderSlots}
            />
          )}

          {/* Color Panel moved to LeftRail as 'colors' tool */}
        </div>
      </div>

      {/* Resize Modal */}
      <ResizeModal
        isOpen={resizeModalOpen}
        onClose={() => setResizeModalOpen(false)}
        currentSize={canvasSize}
        onSelectSize={(size) => setCanvasSize(size)}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        template={template}
        currentSize={canvasSize}
        currentPageId={currentPageId}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        snapToGrid={snapToGrid}
        snapGridSize={snapGridSize}
        onSnapToGridChange={setSnapToGrid}
        onSnapGridSizeChange={setSnapGridSize}
        smartSnapOptions={smartSnapOptions}
        onSmartSnapOptionsChange={setSmartSnapOptions}
      />

      {/* Left Side Panel (Effects/Position) - Show when enabled */}
      {import.meta.env.VITE_TEXT_EFFECTS === 'true' && (
        <LeftSidePanel
          activeView={leftSidePanelView}
          onClose={() => setLeftSidePanelView(null)}
        />
      )}
    </div>
  )
}

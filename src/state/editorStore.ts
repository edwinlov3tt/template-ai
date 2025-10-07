import { create } from 'zustand'
import type { Template, Slot, Page } from '../schema/types'
import { shapeRegistry, type ShapeId } from '../shapes/registry'
import { initializeHistory, addVersion, undo as undoHistory, redo as redoHistory, canUndo as checkCanUndo, canRedo as checkCanRedo, type HistoryState } from '../history/versionControl'
import { migrateTemplate } from '../utils/templateMigration'
import type { Paint, LinearGradientPaint, RadialGradientPaint, GradientStop } from '../editor/color/types'
import { sortStops, interpolateStopColor } from '../editor/color/gradientMath'
import { clampToSrgb } from '../editor/color/colorMath'

export interface EditorState {
  // Template & content
  template: Template | null
  setTemplate: (template: Template | null) => void
  templateName: string
  setTemplateName: (name: string) => void

  // History
  history: HistoryState | null
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  // Page management
  currentPageId: string | null
  setCurrentPage: (pageId: string) => void
  addPage: () => void
  deletePage: (pageId: string) => void
  duplicatePage: (pageId: string) => void
  renamePage: (pageId: string, name: string) => void
  reorderPage: (pageId: string, direction: 'up' | 'down') => void
  updatePageBackgroundColor: (pageId: string, color: string) => void

  // Selection
  selectedSlots: string[]
  setSelection: (slots: string[]) => void
  selectSlot: (slotName: string) => void
  deselectAll: () => void
  hoveredSlot: string | null
  setHoveredSlot: (slotName: string | null) => void
  canvasSelected: boolean
  setCanvasSelected: (selected: boolean) => void
  groupSlots: (slotNames: string[]) => void
  lockSlots: (slotNames: string[], locked: boolean) => void
  duplicateSlots: (slotNames: string[]) => string[]
  deleteSlots: (slotNames: string[]) => void

  // Text editing
  editingSlot: string | null
  startEditing: (slotName: string) => void
  stopEditing: () => void

  // Gradient editing
  editingGradient: {
    slotId: string
    paint: LinearGradientPaint | RadialGradientPaint
    selectedStopIndex: number
  } | null
  startEditingGradient: (slotId: string, paint: LinearGradientPaint | RadialGradientPaint) => void
  stopEditingGradient: () => void
  updateGradientStyle: (style: 'linear' | 'radial') => void
  updateGradientAngle: (angle: number) => void
  updateGradientPosition: (cx: number, cy: number, r: number) => void
  updateGradientStop: (index: number, stop: GradientStop) => void
  addGradientStop: (offset: number) => void
  removeGradientStop: (index: number) => void
  selectGradientStop: (index: number) => void

  // Canvas view
  canvasSize: { id: string; w: number; h: number }
  setCanvasSize: (size: { id: string; w: number; h: number }) => void
  zoom: number
  setZoom: (zoom: number) => void
  gridVisible: boolean
  toggleGrid: () => void

  // Color panel
  documentSwatches: Paint[]
  recentPaints: Paint[]
  colorPanelOpen: boolean
  activePanelSection: 'main' | 'solid-picker' | 'gradient-picker' | 'photo-colors' | 'default-colors'
  addDocumentSwatch: (paint: Paint) => void
  removeDocumentSwatch: (index: number) => void
  addRecentPaint: (paint: Paint) => void
  updateSlotFill: (slotId: string, paint: Paint) => void
  toggleColorPanel: () => void
  setActivePanelSection: (section: 'main' | 'solid-picker' | 'gradient-picker' | 'photo-colors' | 'default-colors') => void

  // Slot modifications
  updateSlot: (slotName: string, updates: Partial<Slot>, description?: string) => void
  updateSlotFrame: (slotName: string, frame: { x?: number; y?: number; width?: number; height?: number; rotation?: number }) => void
  reorderSlots: (slotNames: string[]) => void
  deleteSlot: (slotName: string) => void
  addSlot: (
    slotType: 'text' | 'image' | 'shape' | 'button',
    options?: {
      shapeId?: ShapeId
      shapeOptions?: Record<string, unknown>
      textStyle?: 'heading' | 'subheading' | 'body'
      frame?: { x: number; y: number; width: number; height: number }
      textOverrides?: Partial<Slot>
    }
  ) => void
  createNewTemplate: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  template: null,
  templateName: 'Untitled Template',
  history: null,
  currentPageId: null,
  selectedSlots: [],
  editingSlot: null,
  editingGradient: null,
  hoveredSlot: null,
  canvasSelected: false,
  canvasSize: { id: '1:1', w: 1080, h: 1080 },
  zoom: 100,
  gridVisible: false,
  documentSwatches: [],
  recentPaints: [],
  colorPanelOpen: false,
  activePanelSection: 'main',

  // Template actions
  setTemplate: (template) => {
    if (template) {
      // Migrate template to ensure pages array exists
      const migratedTemplate = migrateTemplate(template)

      set({
        template: migratedTemplate,
        history: initializeHistory(migratedTemplate),
        currentPageId: migratedTemplate.pages[0]?.id || null,
        selectedSlots: [],
        canvasSelected: false
      })
    } else {
      set({
        template: null,
        history: null,
        currentPageId: null,
        selectedSlots: [],
        canvasSelected: false
      })
    }
  },

  setTemplateName: (name) => set({ templateName: name }),

  // History actions
  undo: () => {
    const { history } = get()
    if (!history) return

    const { history: newHistory, template: prevTemplate } = undoHistory(history)
    if (prevTemplate) {
      set({ history: newHistory, template: prevTemplate })
    }
  },

  redo: () => {
    const { history } = get()
    if (!history) return

    const { history: newHistory, template: nextTemplate } = redoHistory(history)
    if (nextTemplate) {
      set({ history: newHistory, template: nextTemplate })
    }
  },

  canUndo: () => {
    const { history } = get()
    return history ? checkCanUndo(history) : false
  },

  canRedo: () => {
    const { history } = get()
    return history ? checkCanRedo(history) : false
  },

  // Selection actions
  setSelection: (slots) => {
    set((state) => ({
      selectedSlots: slots,
      canvasSelected: slots.length === 0 ? state.canvasSelected : false
    }))
  },

  selectSlot: (slotName) => {
    const { selectedSlots, template, currentPageId } = get()
    if (selectedSlots.includes(slotName)) {
      return
    }

    let newSelection = [slotName]
    if (template && currentPageId) {
      const page = template.pages.find(p => p.id === currentPageId)
      const slot = page?.slots.find(s => s.name === slotName)
      if (slot?.groupId) {
        newSelection = page!.slots
          .filter(s => s.groupId === slot.groupId)
          .map(s => s.name)
      }
    }

    set({ selectedSlots: newSelection, canvasSelected: false })
  },

  deselectAll: () => set({ selectedSlots: [], canvasSelected: false }),

  setHoveredSlot: (slotName) => set({ hoveredSlot: slotName }),

  setCanvasSelected: (selected) => {
    if (selected) {
      set({ canvasSelected: true, selectedSlots: [] })
    } else {
      set({ canvasSelected: false })
    }
  },

  groupSlots: (slotNames) => {
    const { template, history, currentPageId } = get()
    if (!template || !currentPageId || slotNames.length === 0) return

    const pageIndex = template.pages.findIndex(p => p.id === currentPageId)
    if (pageIndex === -1) return

    const page = template.pages[pageIndex]
    const selectedSlots = page.slots.filter(slot => slotNames.includes(slot.name))
    if (selectedSlots.length === 0) return

    const uniqueGroupIds = new Set(selectedSlots.map(slot => slot.groupId).filter(Boolean))
    const shouldUngroup = uniqueGroupIds.size === 1 && selectedSlots.every(slot => slot.groupId)
    const targetGroupId = shouldUngroup ? undefined : `group_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const newSlots = page.slots.map(slot =>
      slotNames.includes(slot.name) ? { ...slot, groupId: targetGroupId } : slot
    )

    const newPages = template.pages.map((p, idx) =>
      idx === pageIndex ? { ...p, slots: newSlots } : p
    )

    const newTemplate: Template = {
      ...template,
      pages: newPages
    }

    set({
      template: newTemplate,
      history: history ? addVersion(history, newTemplate, shouldUngroup ? 'Ungrouped slots' : 'Grouped slots') : history
    })
  },

  lockSlots: (slotNames, locked) => {
    const { template, history, currentPageId } = get()
    if (!template || !currentPageId || slotNames.length === 0) return

    const newPages = template.pages.map(page => {
      if (page.id !== currentPageId) return page
      return {
        ...page,
        slots: page.slots.map(slot =>
          slotNames.includes(slot.name) ? { ...slot, locked } : slot
        )
      }
    })

    const newTemplate: Template = {
      ...template,
      pages: newPages
    }

    set({
      template: newTemplate,
      history: history ? addVersion(history, newTemplate, locked ? 'Locked slots' : 'Unlocked slots') : history
    })
  },

  duplicateSlots: (slotNames) => {
    const { template, history, currentPageId, canvasSize } = get()
    if (!template || !currentPageId || slotNames.length === 0) return []

    const pageIndex = template.pages.findIndex(p => p.id === currentPageId)
    if (pageIndex === -1) return []

    const page = template.pages[pageIndex]
    const currentRatio = canvasSize.id
    const existingNames = new Set<string>(page.slots.map(slot => slot.name))
    const newSlots = [...page.slots]
    const newFrames = { ...page.frames }
    if (!newFrames[currentRatio]) {
      newFrames[currentRatio] = {}
    }

    const allNames = new Set<string>(template.pages.flatMap(p => p.slots.map(s => s.name)))
    const newSlotNames: string[] = []

    let maxZ = Math.max(0, ...page.slots.map(slot => slot.z))

    const generateUniqueName = (base: string) => {
      let counter = 1
      let candidate = `${base}-${counter}`
      while (allNames.has(candidate)) {
        counter += 1
        candidate = `${base}-${counter}`
      }
      allNames.add(candidate)
      existingNames.add(candidate)
      return candidate
    }

    slotNames.forEach((slotName, index) => {
      const slot = page.slots.find(s => s.name === slotName)
      if (!slot) return
      const frameByRatio = page.frames[currentRatio]?.[slotName]
      if (!frameByRatio) return

      const baseName = slotName.replace(/-\d+$/, '')
      const newName = generateUniqueName(baseName)
      const duplicatedSlot: Slot = {
        ...slot,
        name: newName,
        z: ++maxZ
      }

      newSlots.push(duplicatedSlot)

      // Copy frames for each ratio
      const updatedFrames = { ...newFrames }
      Object.entries(page.frames).forEach(([ratio, ratioFrames]) => {
        if (!updatedFrames[ratio]) {
          updatedFrames[ratio] = {}
        }
        const sourceFrame = ratioFrames?.[slotName]
        if (sourceFrame) {
          updatedFrames[ratio][newName] = {
            ...sourceFrame,
            x: sourceFrame.x + 20 + index * 10,
            y: sourceFrame.y + 20 + index * 10
          }
        }
      })
      Object.assign(newFrames, updatedFrames)

      newSlotNames.push(newName)
    })

    const updatedPage: Page = {
      ...page,
      slots: newSlots,
      frames: newFrames
    }

    const newTemplate: Template = {
      ...template,
      pages: template.pages.map((p, idx) => (idx === pageIndex ? updatedPage : p))
    }

    set({
      template: newTemplate,
      history: history ? addVersion(history, newTemplate, `Duplicated slots`) : history,
      selectedSlots: newSlotNames,
      canvasSelected: false
    })

    return newSlotNames
  },

  deleteSlots: (slotNames) => {
    const { template, history, currentPageId } = get()
    if (!template || !currentPageId || slotNames.length === 0) return

    const pageIndex = template.pages.findIndex(p => p.id === currentPageId)
    if (pageIndex === -1) return

    const page = template.pages[pageIndex]

    const remainingSlots = page.slots.filter(slot => !slotNames.includes(slot.name))

    const newFrames: typeof page.frames = {}
    Object.entries(page.frames).forEach(([ratio, ratioFrames]) => {
      const filteredFrames: Record<string, typeof ratioFrames[string]> = {}
      Object.entries(ratioFrames).forEach(([name, frame]) => {
        if (!slotNames.includes(name)) {
          filteredFrames[name] = frame
        }
      })
      newFrames[ratio] = filteredFrames
    })

    const updatedPage: Page = {
      ...page,
      slots: remainingSlots,
      frames: newFrames
    }

    const newTemplate: Template = {
      ...template,
      pages: template.pages.map((p, idx) => (idx === pageIndex ? updatedPage : p))
    }

    set({
      template: newTemplate,
      selectedSlots: [],
      canvasSelected: false,
      history: history ? addVersion(history, newTemplate, `Deleted slots`) : history
    })
  },

  // Text editing actions
  startEditing: (slotName) => {
    set({ editingSlot: slotName, selectedSlots: [slotName] })
  },

  stopEditing: () => {
    set({ editingSlot: null })
  },

  // Gradient editing actions
  startEditingGradient: (slotId, paint) => {
    set({
      editingGradient: {
        slotId,
        paint,
        selectedStopIndex: 0 // Select first stop by default
      }
    })
  },

  stopEditingGradient: () => {
    set({ editingGradient: null })
  },

  updateGradientStyle: (style) => {
    const { editingGradient, template, history } = get()
    if (!editingGradient || !template) return

    const currentPaint = editingGradient.paint

    // Convert gradient type
    let newPaint: LinearGradientPaint | RadialGradientPaint

    if (style === 'linear') {
      // Convert to linear (use existing stops)
      newPaint = {
        kind: 'linear-gradient',
        angle: currentPaint.kind === 'linear-gradient' ? currentPaint.angle : 0,
        stops: currentPaint.stops
      }
    } else {
      // Convert to radial (use existing stops)
      newPaint = {
        kind: 'radial-gradient',
        cx: currentPaint.kind === 'radial-gradient' ? currentPaint.cx : 0.5,
        cy: currentPaint.kind === 'radial-gradient' ? currentPaint.cy : 0.5,
        radius: currentPaint.kind === 'radial-gradient' ? currentPaint.radius : 0.5,
        stops: currentPaint.stops
      }
    }

    // Update editing state
    set({
      editingGradient: {
        ...editingGradient,
        paint: newPaint
      }
    })

    // Update slot fill in template (will be done on apply)
  },

  updateGradientAngle: (angle) => {
    const { editingGradient } = get()
    if (!editingGradient || editingGradient.paint.kind !== 'linear-gradient') return

    const newPaint: LinearGradientPaint = {
      ...editingGradient.paint,
      angle
    }

    set({
      editingGradient: {
        ...editingGradient,
        paint: newPaint
      }
    })
  },

  updateGradientPosition: (cx, cy, r) => {
    const { editingGradient } = get()
    if (!editingGradient || editingGradient.paint.kind !== 'radial-gradient') return

    const newPaint: RadialGradientPaint = {
      ...editingGradient.paint,
      cx,
      cy,
      radius: r
    }

    set({
      editingGradient: {
        ...editingGradient,
        paint: newPaint
      }
    })
  },

  updateGradientStop: (index, stop) => {
    const { editingGradient } = get()
    if (!editingGradient) return

    const currentPaint = editingGradient.paint
    const newStops = [...currentPaint.stops]

    // Clamp color to sRGB
    const clampedStop = {
      ...stop,
      color: clampToSrgb(stop.color)
    }

    newStops[index] = clampedStop

    // Sort stops by offset
    sortStops(newStops)

    const newPaint = {
      ...currentPaint,
      stops: newStops
    } as LinearGradientPaint | RadialGradientPaint

    set({
      editingGradient: {
        ...editingGradient,
        paint: newPaint
      }
    })
  },

  addGradientStop: (offset) => {
    const { editingGradient } = get()
    if (!editingGradient) return

    const currentPaint = editingGradient.paint
    const currentStops = currentPaint.stops

    // Enforce max 10 stops
    if (currentStops.length >= 10) {
      console.warn('Maximum 10 gradient stops allowed')
      return
    }

    // Interpolate color at offset
    const color = interpolateStopColor(currentStops, offset)
    const newStop: GradientStop = { offset, color }

    const newStops = [...currentStops, newStop]
    sortStops(newStops)

    // Find the index of the newly added stop after sorting
    const newStopIndex = newStops.findIndex(s => s.offset === offset && s.color === color)

    const newPaint = {
      ...currentPaint,
      stops: newStops
    } as LinearGradientPaint | RadialGradientPaint

    set({
      editingGradient: {
        ...editingGradient,
        paint: newPaint,
        selectedStopIndex: newStopIndex >= 0 ? newStopIndex : editingGradient.selectedStopIndex
      }
    })
  },

  removeGradientStop: (index) => {
    const { editingGradient } = get()
    if (!editingGradient) return

    const currentPaint = editingGradient.paint
    const currentStops = currentPaint.stops

    // Enforce min 2 stops
    if (currentStops.length <= 2) {
      console.warn('Minimum 2 gradient stops required')
      return
    }

    const newStops = currentStops.filter((_, i) => i !== index)

    const newPaint = {
      ...currentPaint,
      stops: newStops
    } as LinearGradientPaint | RadialGradientPaint

    // Adjust selected stop index if needed
    let newSelectedIndex = editingGradient.selectedStopIndex
    if (newSelectedIndex >= newStops.length) {
      newSelectedIndex = newStops.length - 1
    }

    set({
      editingGradient: {
        ...editingGradient,
        paint: newPaint,
        selectedStopIndex: newSelectedIndex
      }
    })
  },

  selectGradientStop: (index) => {
    const { editingGradient } = get()
    if (!editingGradient) return

    set({
      editingGradient: {
        ...editingGradient,
        selectedStopIndex: index
      }
    })
  },

  // Page management actions
  setCurrentPage: (pageId) => {
    const { currentPageId } = get()
    if (currentPageId === pageId) {
      return // Don't clear selection if already on this page
    }
    set({ currentPageId: pageId, selectedSlots: [], canvasSelected: false })
  },

  addPage: () => {
    const { template, history } = get()
    if (!template) return

    // Find the next available page number (reuse deleted numbers)
    const existingPageNumbers = template.pages
      .map(p => {
        const match = p.name.match(/^page-(\d+)$/)
        return match ? parseInt(match[1], 10) : null
      })
      .filter((n): n is number => n !== null)

    let pageNumber = 1
    while (existingPageNumbers.includes(pageNumber)) {
      pageNumber++
    }

    const newPageName = `page-${pageNumber}`
    const newPageId = `page_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    const newPage: Page = {
      id: newPageId,
      name: newPageName,
      slots: [],
      frames: {},
      backgroundColor: '#ffffff'
    }

    const newTemplate: Template = {
      ...template,
      pages: [...template.pages, newPage]
    }

    set({
      template: newTemplate,
      currentPageId: newPageId,
      selectedSlots: [],
      canvasSelected: false,
      history: history ? addVersion(history, newTemplate, `Added ${newPageName}`) : history
    })
  },

  deletePage: (pageId) => {
    const { template, history, currentPageId } = get()
    if (!template || template.pages.length <= 1) return // Can't delete last page

    const pageIndex = template.pages.findIndex(p => p.id === pageId)
    if (pageIndex === -1) return

    const newPages = template.pages.filter(p => p.id !== pageId)
    const newTemplate: Template = {
      ...template,
      pages: newPages
    }

    // If deleting current page, switch to another page
    let newCurrentPageId = currentPageId
    if (currentPageId === pageId) {
      // Switch to previous page, or next if deleting first
      newCurrentPageId = newPages[Math.max(0, pageIndex - 1)]?.id || null
    }

    set({
      template: newTemplate,
      currentPageId: newCurrentPageId,
      selectedSlots: [],
      history: history ? addVersion(history, newTemplate, `Deleted ${template.pages[pageIndex].name}`) : history
    })
  },

  duplicatePage: (pageId) => {
    const { template, history } = get()
    if (!template) return

    const pageIndex = template.pages.findIndex(p => p.id === pageId)
    if (pageIndex === -1) return

    const originalPage = template.pages[pageIndex]
    const newPageId = `page_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    // Generate new page name
    const baseName = originalPage.name.replace(/-copy(-\d+)?$/, '')
    let copyCounter = 1
    let newPageName = `${baseName}-copy`
    while (template.pages.some(p => p.name === newPageName)) {
      copyCounter++
      newPageName = `${baseName}-copy-${copyCounter}`
    }

    // Deep copy slots with new names
    const copiedSlots = originalPage.slots.map(slot => {
      const newSlotName = `${slot.name}-copy`
      return { ...slot, name: newSlotName }
    })

    // Copy frames with new slot names
    const copiedFrames: any = {}
    Object.keys(originalPage.frames).forEach(ratioId => {
      copiedFrames[ratioId] = {}
      Object.keys(originalPage.frames[ratioId]).forEach(oldSlotName => {
        const newSlotName = `${oldSlotName}-copy`
        copiedFrames[ratioId][newSlotName] = { ...originalPage.frames[ratioId][oldSlotName] }
      })
    })

    const newPage: Page = {
      id: newPageId,
      name: newPageName,
      slots: copiedSlots,
      frames: copiedFrames
    }

    // Insert duplicated page after original
    const newPages = [...template.pages]
    newPages.splice(pageIndex + 1, 0, newPage)

    const newTemplate: Template = {
      ...template,
      pages: newPages
    }

    set({
      template: newTemplate,
      currentPageId: newPageId,
      selectedSlots: [],
      history: history ? addVersion(history, newTemplate, `Duplicated ${originalPage.name}`) : history
    })
  },

  renamePage: (pageId, name) => {
    const { template, history } = get()
    if (!template) return

    const newPages = template.pages.map(page =>
      page.id === pageId ? { ...page, name } : page
    )

    const newTemplate: Template = {
      ...template,
      pages: newPages
    }

    set({
      template: newTemplate,
      history: history ? addVersion(history, newTemplate, `Renamed page to ${name}`) : history
    })
  },

  reorderPage: (pageId, direction) => {
    const { template, history } = get()
    if (!template) return

    const pageIndex = template.pages.findIndex(p => p.id === pageId)
    if (pageIndex === -1) return

    const newIndex = direction === 'up' ? pageIndex - 1 : pageIndex + 1

    // Check bounds
    if (newIndex < 0 || newIndex >= template.pages.length) return

    // Swap pages
    const newPages = [...template.pages]
    ;[newPages[pageIndex], newPages[newIndex]] = [newPages[newIndex], newPages[pageIndex]]

    const newTemplate: Template = {
      ...template,
      pages: newPages
    }

    set({
      template: newTemplate,
      history: history ? addVersion(history, newTemplate, `Reordered pages`) : history
    })
  },

  updatePageBackgroundColor: (pageId, color) => {
    const { template, history } = get()
    if (!template) return

    const newPages = template.pages.map(page =>
      page.id === pageId ? { ...page, backgroundColor: color } : page
    )

    const newTemplate: Template = {
      ...template,
      pages: newPages
    }

    set({
      template: newTemplate,
      history: history ? addVersion(history, newTemplate, `Changed background color`) : history
    })
  },

  // Canvas view actions
  setCanvasSize: (size) => set({ canvasSize: size }),
  setZoom: (zoom) => set({ zoom }),
  toggleGrid: () => set((state) => ({ gridVisible: !state.gridVisible })),

  // Color panel actions
  addDocumentSwatch: (paint) => {
    const { documentSwatches } = get()
    // Check if paint already exists (prevent duplicates)
    const paintExists = documentSwatches.some(swatch =>
      JSON.stringify(swatch) === JSON.stringify(paint)
    )
    if (!paintExists) {
      set({ documentSwatches: [...documentSwatches, paint] })
    }
  },

  removeDocumentSwatch: (index) => {
    const { documentSwatches } = get()
    set({ documentSwatches: documentSwatches.filter((_, i) => i !== index) })
  },

  addRecentPaint: (paint) => {
    const { recentPaints } = get()
    // Remove if already exists (to avoid duplicates)
    const filtered = recentPaints.filter(p =>
      JSON.stringify(p) !== JSON.stringify(paint)
    )
    // Add to front, limit to 10 items
    const newRecentPaints = [paint, ...filtered].slice(0, 10)
    set({ recentPaints: newRecentPaints })
  },

  updateSlotFill: (slotId, paint) => {
    const { template, history, currentPageId } = get()
    if (!template || !currentPageId) return

    // Add to recent paints
    get().addRecentPaint(paint)

    // Update the slot's fill property
    const newPages = template.pages.map(page => {
      if (page.id !== currentPageId) return page

      return {
        ...page,
        slots: page.slots.map(slot =>
          slot.name === slotId
            ? { ...slot, fill: paint.kind === 'solid' ? paint.color : undefined }
            : slot
        )
      }
    })

    const newTemplate: Template = {
      ...template,
      pages: newPages
    }

    set({
      template: newTemplate,
      history: history ? addVersion(history, newTemplate, `Updated ${slotId} fill`) : history
    })
  },

  toggleColorPanel: () => {
    set((state) => ({ colorPanelOpen: !state.colorPanelOpen }))
  },

  setActivePanelSection: (section) => {
    set({ activePanelSection: section })
  },

  // Slot modification actions
  updateSlot: (slotName, updates, description) => {
    const { template, history, currentPageId } = get()
    if (!template || !currentPageId) return

    const newPages = template.pages.map(page => {
      if (page.id !== currentPageId) return page

      return {
        ...page,
        slots: page.slots.map(slot =>
          slot.name === slotName ? { ...slot, ...updates } : slot
        )
      }
    })

    const newTemplate: Template = {
      ...template,
      pages: newPages
    }

    set({
      template: newTemplate,
      history: history ? addVersion(history, newTemplate, description || `Updated ${slotName}`) : history
    })
  },

  updateSlotFrame: (slotName, frame) => {
    const { template, history, currentPageId } = get()
    if (!template || !currentPageId) return

    const currentRatio = get().canvasSize.id

    const newPages = template.pages.map(page => {
      if (page.id !== currentPageId) return page

      // Update frame in page.frames
      const newFrames = { ...page.frames }
      if (!newFrames[currentRatio]) {
        newFrames[currentRatio] = {}
      }

      newFrames[currentRatio][slotName] = {
        ...newFrames[currentRatio][slotName],
        ...frame
      }

      return {
        ...page,
        frames: newFrames
      }
    })

    const newTemplate: Template = {
      ...template,
      pages: newPages
    }

    set({
      template: newTemplate,
      history: history ? addVersion(history, newTemplate, `Moved ${slotName}`) : history
    })
  },

  reorderSlots: (slotNames) => {
    const { template, history, currentPageId } = get()
    if (!template || !currentPageId) return

    const newPages = template.pages.map(page => {
      if (page.id !== currentPageId) return page

      // Reorder by updating z-index
      // IMPORTANT: First item in visual list (position 0) should have HIGHEST z-index
      const newSlots = page.slots.map(slot => {
        const newIndex = slotNames.indexOf(slot.name)
        // Invert: position 0 → highest z, last position → lowest z
        return newIndex >= 0 ? { ...slot, z: slotNames.length - 1 - newIndex } : slot
      })

      return {
        ...page,
        slots: newSlots
      }
    })

    const newTemplate: Template = {
      ...template,
      pages: newPages
    }

    set({
      template: newTemplate,
      history: history ? addVersion(history, newTemplate, 'Reordered layers') : history
    })
  },

  deleteSlot: (slotName) => {
    const { template, history, selectedSlots, currentPageId } = get()
    if (!template || !currentPageId) return

    const newPages = template.pages.map(page => {
      if (page.id !== currentPageId) return page

      return {
        ...page,
        slots: page.slots.filter(s => s.name !== slotName)
      }
    })

    const newTemplate: Template = {
      ...template,
      pages: newPages
    }

    set({
      template: newTemplate,
      selectedSlots: selectedSlots.filter(s => s !== slotName),
      history: history ? addVersion(history, newTemplate, `Deleted ${slotName}`) : history
    })
  },

  addSlot: (slotType, options) => {
    const { template, history, canvasSize, currentPageId } = get()
    if (!template || !currentPageId) return

    const currentPage = template.pages.find(p => p.id === currentPageId)
    if (!currentPage) return

    // Generate unique slot name (across all pages to avoid confusion)
    const allExistingNames = template.pages.flatMap(p => p.slots.map(s => s.name))
    let counter = 1
    let slotName = `${slotType}-${counter}`
    while (allExistingNames.includes(slotName)) {
      counter++
      slotName = `${slotType}-${counter}`
    }

    // Get viewBox for positioning
    const [vbX, vbY, vbWidth, vbHeight] = template.canvas.baseViewBox

    // Default properties based on slot type
    const shapeId = options?.shapeId ?? 'rectangle'
    const shapeDefinition = shapeRegistry[shapeId as ShapeId]

    const defaultShapeOptions = {
      ...(shapeDefinition?.defaultOptions ?? {}),
      ...(options?.shapeOptions ?? {})
    }

    // Text style presets
    const textStylePresets = {
      heading: {
        fontSize: 48,
        fill: '#111827',
        color: '#111827',
        fontFamily: 'Inter',
        fontWeight: '700',
        textAlign: 'center',
        style: 'heading',
        maxLines: 2,
        content: 'Add heading'
      },
      subheading: {
        fontSize: 32,
        fill: '#111827',
        color: '#111827',
        fontFamily: 'Inter',
        fontWeight: '600',
        textAlign: 'center',
        style: 'subheading',
        maxLines: 3,
        content: 'Add subheading'
      },
      body: {
        fontSize: 16,
        fill: '#374151',
        color: '#374151',
        fontFamily: 'Inter',
        fontWeight: '400',
        textAlign: 'center',
        style: 'body',
        maxLines: 10,
        content: 'Add body text'
      }
    }

    const textStyle = options?.textStyle ?? 'heading'
    const textPreset = {
      ...textStylePresets[textStyle]
    }

    if (options?.textOverrides && slotType === 'text') {
      Object.assign(textPreset, options.textOverrides)
    }

    const defaultProps: Record<string, any> = {
      text: textPreset,
      image: {
        fit: 'cover'
      },
      shape: {
        fill: '#e5e7eb',
        stroke: '#111827',
        strokeWidth: 2,
        opacity: 1,
        ...shapeDefinition?.defaults,
        shape: {
          id: shapeId,
          options: Object.keys(defaultShapeOptions).length > 0 ? defaultShapeOptions : undefined
        }
      },
      button: {
        chip: {
          fill: '#111827',
          radius: 8,
          padding: [12, 24]
        }
      }
    }

    // Calculate center position with default size
    const defaultSize = slotType === 'text'
      ? textStyle === 'heading'
        ? { w: vbWidth * 0.7, h: 80 }
        : textStyle === 'subheading'
        ? { w: vbWidth * 0.6, h: 60 }
        : { w: vbWidth * 0.5, h: 120 }  // body text, taller for multiple lines
      : slotType === 'image'
      ? { w: vbWidth * 0.4, h: vbHeight * 0.4 }
      : slotType === 'button'
      ? { w: 150, h: 50 }
      : {
          w: shapeDefinition?.defaultSize.width ?? 120,
          h: shapeDefinition?.defaultSize.height ?? 120
        }

    const defaultFrame = options?.frame ?? {
      x: vbX + (vbWidth - defaultSize.w) / 2,
      y: vbY + (vbHeight - defaultSize.h) / 2,
      width: defaultSize.w,
      height: defaultSize.h
    }

    // Find highest z-index in current page and add 1
    const maxZ = currentPage.slots.reduce((max, slot) => Math.max(max, slot.z), 0)

    const newSlot: Slot = {
      name: slotName,
      type: slotType,
      z: maxZ + 1,
      ...defaultProps[slotType]
    }

    const newPages = template.pages.map(page => {
      if (page.id !== currentPageId) return page

      // Create frame for this slot
      const newFrames = { ...page.frames }
      const currentRatio = canvasSize.id
      if (!newFrames[currentRatio]) {
        newFrames[currentRatio] = {}
      }
      newFrames[currentRatio][slotName] = defaultFrame

      return {
        ...page,
        slots: [...page.slots, newSlot],
        frames: newFrames
      }
    })

    const newTemplate: Template = {
      ...template,
      pages: newPages
    }

    set({
      template: newTemplate,
      selectedSlots: [slotName],
      history: history ? addVersion(history, newTemplate, `Added ${slotName}`) : history
    })
  },

  createNewTemplate: () => {
    const { canvasSize } = get()

    const firstPageId = `page_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    const newTemplate: Template = {
      id: 'template-' + Date.now(),
      version: 1,
      canvas: {
        baseViewBox: [0, 0, canvasSize.w, canvasSize.h],
        ratios: ['1:1', '4:5', '9:16', '16:9', '300x250', '728x90']
      },
      tokens: {
        palette: {
          brand: '#3b82f6',
          accent: '#10b981',
          neutral: '#111827',
          surface: '#ffffff'
        },
        typography: {
          heading: { family: 'Inter', weight: 700, minSize: 28, maxSize: 64 },
          subhead: { family: 'Inter', weight: 500, minSize: 16, maxSize: 28 },
          body: { family: 'Inter', weight: 400, minSize: 14, maxSize: 18 }
        }
      },
      pages: [{
        id: firstPageId,
        name: 'page-1',
        slots: [],
        frames: {},
        backgroundColor: '#ffffff'
      }],
      constraints: {
        global: [],
        byRatio: {}
      },
      accessibility: {
        contrastPolicy: { mode: 'WCAG', min: 4.5 },
        fallbacks: ['autoChip', 'invertText', 'increaseOverlay']
      },
      sample: {}
    }

    set({
      template: newTemplate,
      currentPageId: firstPageId,
      history: initializeHistory(newTemplate),
      selectedSlots: [],
      zoom: 55,
      canvasSelected: false
    })
  }
}))

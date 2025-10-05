import { create } from 'zustand'
import type { Template, Slot, Page } from '../schema/types'
import { shapeRegistry, type ShapeId } from '../shapes/registry'
import { initializeHistory, addVersion, undo as undoHistory, redo as redoHistory, canUndo as checkCanUndo, canRedo as checkCanRedo, type HistoryState } from '../history/versionControl'
import { migrateTemplate } from '../utils/templateMigration'

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

  // Selection
  selectedSlots: string[]
  setSelection: (slots: string[]) => void
  selectSlot: (slotName: string) => void
  deselectAll: () => void

  // Canvas view
  canvasSize: { id: string; w: number; h: number }
  setCanvasSize: (size: { id: string; w: number; h: number }) => void
  zoom: number
  setZoom: (zoom: number) => void
  gridVisible: boolean
  toggleGrid: () => void

  // Slot modifications
  updateSlot: (slotName: string, updates: Partial<Slot>, description?: string) => void
  updateSlotFrame: (slotName: string, frame: { x?: number; y?: number; width?: number; height?: number; rotation?: number }) => void
  reorderSlots: (slotNames: string[]) => void
  deleteSlot: (slotName: string) => void
  addSlot: (
    slotType: 'text' | 'image' | 'shape' | 'button',
    options?: { shapeId?: ShapeId; shapeOptions?: Record<string, unknown> }
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
  canvasSize: { id: '1:1', w: 1080, h: 1080 },
  zoom: 100,
  gridVisible: false,

  // Template actions
  setTemplate: (template) => {
    if (template) {
      // Migrate template to ensure pages array exists
      const migratedTemplate = migrateTemplate(template)

      set({
        template: migratedTemplate,
        history: initializeHistory(migratedTemplate),
        currentPageId: migratedTemplate.pages[0]?.id || null,
        selectedSlots: []
      })
    } else {
      set({
        template: null,
        history: null,
        currentPageId: null,
        selectedSlots: []
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
  setSelection: (slots) => set({ selectedSlots: slots }),

  selectSlot: (slotName) => {
    const { selectedSlots } = get()
    if (!selectedSlots.includes(slotName)) {
      set({ selectedSlots: [slotName] })
    }
  },

  deselectAll: () => set({ selectedSlots: [] }),

  // Page management actions
  setCurrentPage: (pageId) => {
    const { currentPageId } = get()
    console.log('[setCurrentPage] called with:', pageId, 'current:', currentPageId)
    if (currentPageId === pageId) {
      console.log('[setCurrentPage] same page, not clearing selection')
      return // Don't clear selection if already on this page
    }
    console.log('[setCurrentPage] switching page, clearing selection')
    set({ currentPageId: pageId, selectedSlots: [] })
  },

  addPage: () => {
    const { template, history } = get()
    if (!template) return

    // Generate unique page name
    const pageCount = template.pages.length
    const newPageName = `page-${pageCount + 1}`
    const newPageId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newPage: Page = {
      id: newPageId,
      name: newPageName,
      slots: [],
      frames: {}
    }

    const newTemplate: Template = {
      ...template,
      pages: [...template.pages, newPage]
    }

    set({
      template: newTemplate,
      currentPageId: newPageId,
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
    const newPageId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

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

  // Canvas view actions
  setCanvasSize: (size) => set({ canvasSize: size }),
  setZoom: (zoom) => set({ zoom }),
  toggleGrid: () => set((state) => ({ gridVisible: !state.gridVisible })),

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
      const newSlots = page.slots.map(slot => {
        const newIndex = slotNames.indexOf(slot.name)
        return newIndex >= 0 ? { ...slot, z: newIndex } : slot
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

    const defaultProps: Record<string, any> = {
      text: {
        fontSize: 32,
        fill: '#111827',
        fontFamily: 'Inter',
        fontWeight: '600',
        style: 'heading',
        maxLines: 2
      },
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
      ? { w: vbWidth * 0.6, h: 60 }
      : slotType === 'image'
      ? { w: vbWidth * 0.4, h: vbHeight * 0.4 }
      : slotType === 'button'
      ? { w: 150, h: 50 }
      : {
          w: shapeDefinition?.defaultSize.width ?? 120,
          h: shapeDefinition?.defaultSize.height ?? 120
        }

    const x = vbX + (vbWidth - defaultSize.w) / 2
    const y = vbY + (vbHeight - defaultSize.h) / 2

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
      newFrames[currentRatio][slotName] = {
        x,
        y,
        width: defaultSize.w,
        height: defaultSize.h
      }

      console.log('[addSlot] Creating new slot:', {
        slotName,
        slotType,
        currentRatio,
        frame: newFrames[currentRatio][slotName],
        pageId: page.id,
        locked: newSlot.locked || false
      })

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

    const firstPageId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

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
        frames: {}
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
      zoom: 55
    })
  }
}))

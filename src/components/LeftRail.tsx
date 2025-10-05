import React, { useState } from 'react'
import {
  AppstoreFilled,
  FontSizeOutlined,
  PictureOutlined,
  AppstoreAddOutlined,
  BgColorsOutlined,
  CloudUploadOutlined,
  EllipsisOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons'
import { Tooltip, Button, Typography, Divider, Upload, Input, Spin } from 'antd'
import { useEditorStore } from '../state/editorStore'
import * as PexelsAPI from '../services/pexelsApi'
import { shapeCategories, shapeRegistry, type ShapeDefinition, type ShapeId } from '../shapes/registry'
import { renderShapeGeometry } from '../shapes/render'
import type { Slot } from '../schema/types'

const { Title, Text } = Typography

type Tool = 'templates' | 'text' | 'images' | 'shapes' | 'vectors' | 'uploads' | 'more'

interface LeftRailProps {
  onUploadSvg: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAddSlot: (slotType: 'text' | 'image' | 'shape' | 'button') => void
  onInsertShape: (shapeId: ShapeId, shapeOptions?: Record<string, unknown>) => void
  onCreateNewTemplate: () => void
  onSelectSize?: (size: { id: string; w: number; h: number }) => void
  hasTemplate?: boolean
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  activeTool?: Tool | null
  onActiveToolChange?: (tool: Tool | null) => void
}

export function LeftRail({
  onUploadSvg,
  onAddSlot,
  onInsertShape,
  onCreateNewTemplate,
  onSelectSize,
  hasTemplate = true,
  isCollapsed = false,
  onToggleCollapse,
  activeTool: externalActiveTool,
  onActiveToolChange
}: LeftRailProps) {
  const [internalActiveTool, setInternalActiveTool] = useState<Tool | null>(null)
  const activeTool = externalActiveTool !== undefined ? externalActiveTool : internalActiveTool
  const setActiveTool = onActiveToolChange || setInternalActiveTool

  const handleToolClick = (tool: Tool) => {
    if (isCollapsed) {
      // If collapsed, expand and show panel
      onToggleCollapse?.()
      setActiveTool(tool)
    } else {
      // If expanded, toggle the active tool
      setActiveTool(activeTool === tool ? null : tool)
    }
  }

  const tools = [
    { id: 'templates' as Tool, icon: <AppstoreFilled />, label: 'Templates' },
    { id: 'text' as Tool, icon: <FontSizeOutlined />, label: 'Text' },
    { id: 'images' as Tool, icon: <PictureOutlined />, label: 'Images' },
    { id: 'shapes' as Tool, icon: <AppstoreAddOutlined />, label: 'Shapes' },
    { id: 'vectors' as Tool, icon: <BgColorsOutlined />, label: 'Vectors' },
    { id: 'uploads' as Tool, icon: <CloudUploadOutlined />, label: 'Uploads' },
    { id: 'more' as Tool, icon: <EllipsisOutlined />, label: 'More' }
  ]

  // Show initial screen when no template
  if (!hasTemplate && onSelectSize) {
    return <InitialScreen onSelectSize={onSelectSize} onUploadSvg={onUploadSvg} />
  }

  return (
    <>
      {/* Dark Sidebar with Icons */}
      <div style={{
        width: '76px',
        background: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        zIndex: 10,
        borderRight: '1px solid #2a2a2a'
      }}>

        {/* Tool Navigation */}
        <nav style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '8px 0'
        }}>
          {tools.map((tool) => {
            const isActive = activeTool === tool.id

            return (
              <Tooltip key={tool.id} title={tool.label} placement="right">
                <button
                  onClick={() => handleToolClick(tool.id)}
                  style={{
                    background: isActive ? '#2a2a2a' : 'transparent',
                    border: 'none',
                    borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                    padding: '16px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '24px',
                    color: isActive ? '#ffffff' : '#e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#2a2a2a'
                      e.currentTarget.style.color = '#ffffff'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#e5e7eb'
                    }
                  }}
                >
                  {tool.icon}
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '500',
                    textTransform: 'capitalize',
                    color: isActive ? '#ffffff' : '#e5e7eb'
                  }}>
                    {tool.label}
                  </span>
                </button>
              </Tooltip>
            )
          })}
        </nav>
      </div>

      {/* Slide-out Right Panel - 300px */}
      <div style={{
        width: activeTool ? '300px' : '0',
        background: '#2a2a2a',
        borderRight: activeTool ? '1px solid #3a3a3a' : 'none',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        zIndex: 9,
        transition: 'all 0.3s ease-in-out',
        transform: activeTool ? 'translateX(0)' : 'translateX(-375px)',
        overflow: 'visible',
        opacity: activeTool ? 1 : 0
      }}>
        {/* Collapse Tab - Sticks out from right edge of panel */}
        <button
          onClick={() => setActiveTool(null)}
          style={{
            position: 'absolute',
            top: '50%',
            right: '-20px',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '48px',
            borderRadius: '0 8px 8px 0',
            background: '#2a2a2a',
            border: '1px solid #3a3a3a',
            borderLeft: 'none',
            zIndex: 100,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#9ca3af',
            fontSize: '12px',
            transition: 'all 0.15s',
            boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff'
            e.currentTarget.style.background = '#3a3a3a'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9ca3af'
            e.currentTarget.style.background = '#2a2a2a'
          }}
        >
          <LeftOutlined />
        </button>

        {/* Panel Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px', color: '#ffffff' }}>
          {activeTool === 'text' && <TextPanel onAddSlot={onAddSlot} />}
          {activeTool === 'templates' && <TemplatesPanel onCreateNew={onCreateNewTemplate} />}
          {activeTool === 'images' && <ImagesPanel onAddSlot={onAddSlot} />}
          {activeTool === 'shapes' && <ShapesPanel onInsertShape={onInsertShape} />}
          {activeTool === 'vectors' && <VectorsPanel />}
          {activeTool === 'uploads' && <UploadsPanel onUploadSvg={onUploadSvg} />}
          {activeTool === 'more' && <MorePanel />}
        </div>
      </div>
    </>
  )
}

function TextPanel({ onAddSlot }: { onAddSlot: (slotType: 'text' | 'button') => void }) {
  return (
    <div>
      <PanelHeading>Add a heading</PanelHeading>
      <PanelButton onClick={() => onAddSlot('text')}>Add a subheading</PanelButton>
      <PanelButton onClick={() => onAddSlot('text')}>Add body text</PanelButton>

      <Divider style={{ borderColor: '#3a3a3a', margin: '24px 0' }} />

      <PanelSectionTitle>Quick Text Chips</PanelSectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <TextChip color="#ef4444">SPECIAL{'\n'}OFFER</TextChip>
        <TextChip color="#22c55e">BUY ONE{'\n'}GET ONE</TextChip>
        <TextChip color="#8b5cf6">Winter{'\n'}Collection</TextChip>
        <TextChip color="#06b6d4">COMING{'\n'}SOON</TextChip>
        <TextChip color="#eab308">Best Service</TextChip>
        <TextChip color="#f97316">DOWNLOAD{'\n'}NOW</TextChip>
      </div>
    </div>
  )
}

function TemplatesPanel({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div>
      <PanelSectionTitle>START FRESH</PanelSectionTitle>
      <PanelButton onClick={onCreateNew}>+ Create New Template</PanelButton>

      <Divider style={{ borderColor: '#3a3a3a', margin: '24px 0' }} />

      <PanelSectionTitle>TEMPLATE GALLERY</PanelSectionTitle>
      <EmptyState>Saved templates coming soon</EmptyState>
    </div>
  )
}

function ImagesPanel({ onAddSlot }: { onAddSlot: (slotType: 'image') => void }) {
  const [activeTab, setActiveTab] = React.useState<'gallery' | 'placeholders'>('gallery')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [photos, setPhotos] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [filtersOpen, setFiltersOpen] = React.useState(false)

  // Get editor store for adding images directly
  const template = useEditorStore(state => state.template)
  const setTemplate = useEditorStore(state => state.setTemplate)
  const canvasSize = useEditorStore(state => state.canvasSize)
  const setSelection = useEditorStore(state => state.setSelection)
  const currentPageId = useEditorStore(state => state.currentPageId)
  const history = useEditorStore(state => state.history)

  // Filters
  const defaultOrientation = PexelsAPI.getOrientationFromRatio(canvasSize.id)
  const [selectedOrientation, setSelectedOrientation] = React.useState<'landscape' | 'portrait' | 'square' | null>(defaultOrientation)
  const [selectedColor, setSelectedColor] = React.useState<string | null>(null)


  // Load curated photos on mount
  React.useEffect(() => {
    if (activeTab === 'gallery' && photos.length === 0) {
      loadCuratedPhotos()
    }
  }, [activeTab])

  async function loadCuratedPhotos() {
    if (!PexelsAPI.hasApiKey()) {
      setError('Pexels API key not configured. Please add VITE_PEXELS_API_KEY to your .env file.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await PexelsAPI.getCuratedPhotos(page, 15)
      setPhotos(response.photos)
    } catch (err: any) {
      console.error('Failed to load curated photos:', err)
      setError(err.message || 'Failed to load images')
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(value: string) {
    if (!value.trim()) {
      loadCuratedPhotos()
      return
    }

    if (!PexelsAPI.hasApiKey()) {
      setError('Pexels API key not configured')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSearchQuery(value)
      const response = await PexelsAPI.searchPhotos(
        value,
        1,
        15,
        selectedOrientation || undefined,
        selectedColor || undefined
      )
      setPhotos(response.photos)
      setPage(1)
    } catch (err: any) {
      console.error('Failed to search photos:', err)
      setError(err.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  function handleClearFilters() {
    setSelectedOrientation(defaultOrientation)
    setSelectedColor(null)
    if (searchQuery) {
      handleSearch(searchQuery)
    } else {
      loadCuratedPhotos()
    }
  }

  // Re-search when filters change
  React.useEffect(() => {
    if (searchQuery && activeTab === 'gallery') {
      handleSearch(searchQuery)
    }
  }, [selectedOrientation, selectedColor])

  // Update default orientation when canvas size changes
  React.useEffect(() => {
    const newDefaultOrientation = PexelsAPI.getOrientationFromRatio(canvasSize.id)
    setSelectedOrientation(newDefaultOrientation)
  }, [canvasSize.id])

  function handleImageClick(photo: any) {
    if (!template || !currentPageId) return

    // Find current page
    const currentPage = template.pages.find(p => p.id === currentPageId)
    if (!currentPage) return

    // Generate unique slot name
    const existingNames = currentPage.slots.map(s => s.name)
    let counter = 1
    let slotName = `image-${counter}`
    while (existingNames.includes(slotName)) {
      counter++
      slotName = `image-${counter}`
    }

    // Get viewBox for positioning
    const [vbX, vbY, vbWidth, vbHeight] = template.canvas.baseViewBox

    // Calculate default size (40% of canvas width/height)
    const defaultWidth = vbWidth * 0.4
    const defaultHeight = vbHeight * 0.4

    // Center position
    const x = vbX + (vbWidth - defaultWidth) / 2
    const y = vbY + (vbHeight - defaultHeight) / 2

    // Find highest z-index in current page
    const maxZ = currentPage.slots.reduce((max, slot) => Math.max(max, slot.z), 0)

    // Create new slot with Pexels image
    const newSlot: any = {
      name: slotName,
      type: 'image',
      z: maxZ + 1,
      fit: 'cover',
      href: PexelsAPI.getOptimalImageUrl(photo, 'canvas'), // Use large size for canvas
      attribution: {
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        source: 'Pexels',
        sourceUrl: photo.url
      }
    }

    // Create frame for this slot on current page
    const currentRatio = canvasSize.id
    const updatedPage = {
      ...currentPage,
      slots: [...currentPage.slots, newSlot],
      frames: {
        ...currentPage.frames,
        [currentRatio]: {
          ...(currentPage.frames[currentRatio] || {}),
          [slotName]: {
            x,
            y,
            width: defaultWidth,
            height: defaultHeight
          }
        }
      }
    }

    // Update template with modified page
    const newTemplate = {
      ...template,
      pages: template.pages.map(p => p.id === currentPageId ? updatedPage : p)
    }

    setTemplate(newTemplate)
    setSelection([slotName])

    console.log(`Added Pexels image to page ${currentPageId}: ${slotName}`, photo)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab Selector */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #3a3a3a',
        marginBottom: '16px',
        gap: '4px'
      }}>
        <button
          onClick={() => setActiveTab('gallery')}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'gallery' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'gallery' ? '#ffffff' : '#9ca3af',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Gallery
        </button>
        <button
          onClick={() => setActiveTab('placeholders')}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'placeholders' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'placeholders' ? '#ffffff' : '#9ca3af',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Placeholders
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'auto', overflowX: 'hidden', position: 'relative' }}>
        {activeTab === 'placeholders' ? (
          <div>
            <PanelSectionTitle>Add Image Slot</PanelSectionTitle>
            <PanelButton onClick={() => onAddSlot('image')}>+ Add Image Placeholder</PanelButton>
          </div>
        ) : (
          <div>
            {/* Search Bar */}
            <div style={{ marginBottom: '16px' }}>
              <Input.Search
                placeholder="Search images..."
                onSearch={handleSearch}
                style={{
                  background: '#1a1a1a',
                  borderColor: '#3a3a3a'
                }}
                styles={{
                  input: {
                    background: '#1a1a1a',
                    color: '#ffffff',
                    borderColor: '#3a3a3a'
                  },
                }}
                classNames={{
                  input: 'dark-search-input'
                }}
              />
              <style>{`
                .dark-search-input::placeholder {
                  color: #6b7280 !important;
                  opacity: 1;
                }
                .dark-search-input {
                  background: #1a1a1a !important;
                  color: #ffffff !important;
                }
                .ant-input-search-button {
                  background: #3a3a3a !important;
                  border-color: #3a3a3a !important;
                  color: #9ca3af !important;
                }
                .ant-input-search-button:hover {
                  background: #4a4a4a !important;
                  border-color: #4a4a4a !important;
                  color: #ffffff !important;
                }
              `}</style>
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              style={{
                width: '100%',
                background: '#2a2a2a',
                border: '1px solid #3a3a3a',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#9ca3af',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3a3a3a'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2a2a2a'
                e.currentTarget.style.color = '#9ca3af'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="21" x2="4" y2="14"></line>
                  <line x1="4" y1="10" x2="4" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12" y2="3"></line>
                  <line x1="20" y1="21" x2="20" y2="16"></line>
                  <line x1="20" y1="12" x2="20" y2="3"></line>
                  <line x1="1" y1="14" x2="7" y2="14"></line>
                  <line x1="9" y1="8" x2="15" y2="8"></line>
                  <line x1="17" y1="16" x2="23" y2="16"></line>
                </svg>
                Filters
              </span>
              <span style={{ fontSize: '16px', transform: filtersOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▾</span>
            </button>

            {/* Filters Panel */}
            {filtersOpen && (
              <div style={{
                background: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                {/* Color Filter */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#e5e7eb',
                    marginBottom: '10px',
                    letterSpacing: '0.5px'
                  }}>
                    COLOR
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '8px'
                  }}>
                    {[
                      { name: 'Red', color: '#ef4444' },
                      { name: 'Orange', color: '#f97316' },
                      { name: 'Yellow', color: '#eab308' },
                      { name: 'Green', color: '#22c55e' },
                      { name: 'Turquoise', color: '#06b6d4' },
                      { name: 'Blue', color: '#3b82f6' },
                      { name: 'Violet', color: '#a855f7' },
                      { name: 'Pink', color: '#ec4899' },
                      { name: 'Brown', color: '#92400e' },
                      { name: 'Black', color: '#000000' },
                      { name: 'Gray', color: '#6b7280' },
                      { name: 'White', color: '#ffffff' }
                    ].map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setSelectedColor(selectedColor === c.name.toLowerCase() ? null : c.name.toLowerCase())}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: c.color,
                          border: selectedColor === c.name.toLowerCase() ? '3px solid #3b82f6' : '2px solid #3a3a3a',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          position: 'relative'
                        }}
                        title={c.name}
                      >
                        {selectedColor === c.name.toLowerCase() && (
                          <span style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: c.name === 'White' ? '#000000' : '#ffffff',
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orientation Filter */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#e5e7eb',
                    marginBottom: '10px',
                    letterSpacing: '0.5px'
                  }}>
                    ORIENTATION
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      {
                        value: 'square' as const,
                        label: 'Square',
                        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>,
                        desc: '1:1'
                      },
                      {
                        value: 'portrait' as const,
                        label: 'Vertical',
                        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>,
                        desc: 'Tall'
                      },
                      {
                        value: 'landscape' as const,
                        label: 'Horizontal',
                        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>,
                        desc: 'Wide'
                      }
                    ].map((o) => (
                      <label
                        key={o.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          background: selectedOrientation === o.value ? '#2a2a2a' : 'transparent',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: selectedOrientation === o.value ? '1px solid #3b82f6' : '1px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedOrientation !== o.value) {
                            e.currentTarget.style.background = '#2a2a2a'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedOrientation !== o.value) {
                            e.currentTarget.style.background = 'transparent'
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name="orientation"
                          value={o.value}
                          checked={selectedOrientation === o.value}
                          onChange={(e) => setSelectedOrientation(e.target.value as any)}
                          style={{
                            width: '16px',
                            height: '16px',
                            accentColor: '#3b82f6',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center' }}>{o.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', color: '#e5e7eb', fontWeight: '500' }}>{o.label}</div>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>{o.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters Button */}
                <button
                  onClick={handleClearFilters}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: '1px solid #3a3a3a',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#9ca3af',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    marginTop: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#6b7280'
                    e.currentTarget.style.color = '#ffffff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#3a3a3a'
                    e.currentTarget.style.color = '#9ca3af'
                  }}
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div style={{
                padding: '16px',
                background: '#7f1d1d',
                border: '1px solid #991b1b',
                borderRadius: '6px',
                color: '#fecaca',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '40px 0',
                color: '#9ca3af'
              }}>
                <Spin size="large" />
              </div>
            )}

            {/* Image Grid */}
            {!loading && !error && photos.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                marginBottom: '16px'
              }}>
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => handleImageClick(photo)}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '1px solid #3a3a3a',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.borderColor = '#3b82f6'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.borderColor = '#3a3a3a'
                    }}
                  >
                    <img
                      src={PexelsAPI.getOptimalImageUrl(photo, 'thumbnail')}
                      alt={photo.alt || 'Stock photo'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && photos.length === 0 && (
              <EmptyState>No images found</EmptyState>
            )}
          </div>
        )}
      </div>

      {/* Attribution Footer - Only show in Gallery tab */}
      {activeTab === 'gallery' && (
        <div style={{
          borderTop: '1px solid #3a3a3a',
          padding: '12px 0',
          marginTop: 'auto',
          textAlign: 'center'
        }}>
          <a
            href="https://www.pexels.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '11px',
              color: '#9ca3af',
              textDecoration: 'none',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
          >
            Images courtesy of Pexels
          </a>
        </div>
      )}
    </div>
  )
}

function ShapesPanel({ onInsertShape }: { onInsertShape: (shapeId: ShapeId, shapeOptions?: Record<string, unknown>) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {shapeCategories.map((category) => (
        <div key={category.id}>
          <PanelSectionTitle>{category.label}</PanelSectionTitle>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '12px'
            }}
          >
            {category.shapes.map((shapeId) => {
              const definition = shapeRegistry[shapeId]
              if (!definition) return null

              return (
                <ShapeTile
                  key={shapeId}
                  definition={definition}
                  onClick={() => onInsertShape(shapeId)}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function ShapeTile({ definition, onClick }: { definition: ShapeDefinition; onClick: () => void }) {
  const previewSize = 56
  const previewSlot = {
    name: 'preview',
    type: 'shape' as const,
    z: 0,
    fill: definition.defaults?.fill ?? '#e5e7eb',
    stroke: definition.defaults?.stroke ?? '#111827',
    strokeWidth: definition.defaults?.strokeWidth ?? 2,
    rx: definition.defaults?.rx,
    ry: definition.defaults?.ry,
    markerEnd: definition.defaults?.markerEnd,
    shape: {
      id: definition.id,
      options: definition.defaultOptions ? { ...definition.defaultOptions } : undefined
    }
  } as Slot

  const geometry = definition.geometry({ width: previewSize, height: previewSize, slot: previewSlot })
  const fill = previewSlot.fill ?? '#e5e7eb'
  const stroke = previewSlot.stroke ?? '#111827'
  const strokeWidth = previewSlot.strokeWidth ?? 2
  const markerId = previewSlot.markerEnd ? `arrow-preview-end-${definition.id}` : undefined
  const markerEnd = markerId ? `url(#${markerId})` : undefined

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        color: '#e5e7eb',
        cursor: 'pointer',
        transition: 'background 0.2s, border-color 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#27303f'
        e.currentTarget.style.borderColor = '#4b5563'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#1f2937'
        e.currentTarget.style.borderColor = '#374151'
      }}
    >
      <svg
        width={previewSize}
        height={previewSize}
        viewBox={`0 0 ${previewSize} ${previewSize}`}
        style={{ width: '100%', height: 'auto' }}
      >
        {markerId && (
          <defs>
            <marker
              id={markerId}
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
            </marker>
          </defs>
        )}
        {renderShapeGeometry({
          geometry,
          width: previewSize,
          height: previewSize,
          fill,
          stroke,
          strokeWidth,
          opacity: 1,
          markerEnd
        })}
      </svg>
      <span style={{ fontSize: '12px', fontWeight: 500, textAlign: 'center' }}>{definition.label}</span>
    </button>
  )
}

function VectorsPanel() {
  return (
    <div>
      <PanelSectionTitle>Vector Icons</PanelSectionTitle>
      <EmptyState>Icon library coming soon</EmptyState>
    </div>
  )
}

function MorePanel() {
  return (
    <div>
      <PanelSectionTitle>More Options</PanelSectionTitle>
      <EmptyState>Additional tools coming soon</EmptyState>
    </div>
  )
}

interface UploadsPanelProps {
  onUploadSvg: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function UploadsPanel({ onUploadSvg }: UploadsPanelProps) {
  const handleFileChange = (info: any) => {
    const file = info.file.originFileObj || info.file
    const event = {
      target: {
        files: [file]
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>
    onUploadSvg(event)
  }

  return (
    <div>
      <PanelSectionTitle>Upload SVG</PanelSectionTitle>
      <Upload.Dragger
        accept=".svg"
        beforeUpload={() => false}
        onChange={handleFileChange}
        showUploadList={false}
        style={{
          background: '#1a1a1a',
          border: '2px dashed #4a4a4a'
        }}
      >
        <div style={{ padding: '16px' }}>
          <CloudUploadOutlined style={{ fontSize: '40px', color: '#9ca3af', marginBottom: '12px' }} />
          <div style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '6px', fontWeight: '500' }}>
            Click or drag SVG to upload
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            SVG files with data-slot attributes
          </div>
        </div>
      </Upload.Dragger>
    </div>
  )
}

function PanelHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: '18px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '16px'
    }}>
      {children}
    </h2>
  )
}

function PanelSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: '11px',
      fontWeight: '700',
      color: '#9ca3af',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '12px'
    }}>
      {children}
    </h3>
  )
}

function PanelButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <Button
      onClick={onClick}
      block
      style={{
        background: '#3a3a3a',
        border: '1px solid #4a4a4a',
        color: '#e5e7eb',
        textAlign: 'left',
        marginBottom: '8px',
        height: 'auto',
        padding: '10px 14px'
      }}
    >
      {children}
    </Button>
  )
}

function TextChip({ children, color, onClick }: { children: React.ReactNode; color: string; onClick?: () => void }) {
  return (
    <Button
      onClick={onClick}
      style={{
        background: '#1a1a1a',
        border: 'none',
        color: color,
        fontSize: '11px',
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: '1.3',
        padding: '16px 8px',
        height: 'auto',
        whiteSpace: 'pre-wrap'
      }}
    >
      {children}
    </Button>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      color: '#6b7280',
      fontSize: '13px',
      textAlign: 'center',
      padding: '32px 16px',
      fontStyle: 'italic'
    }}>
      {children}
    </div>
  )
}

// Template Size Presets
const SIZE_PRESETS = {
  social: [
    { id: '1:1', w: 1080, h: 1080, label: 'Instagram Square' },
    { id: '4:5', w: 1080, h: 1350, label: 'Instagram Portrait' },
    { id: '9:16', w: 1080, h: 1920, label: 'Instagram Story' },
    { id: '16:9', w: 1920, h: 1080, label: 'YouTube Thumbnail' },
  ],
  display: [
    { id: '300x250', w: 300, h: 250, label: 'Medium Rectangle' },
    { id: '728x90', w: 728, h: 90, label: 'Leaderboard' },
    { id: '160x600', w: 160, h: 600, label: 'Wide Skyscraper' },
    { id: '300x600', w: 300, h: 600, label: 'Half Page' },
    { id: '970x250', w: 970, h: 250, label: 'Billboard' },
    { id: '320x50', w: 320, h: 50, label: 'Mobile Banner' },
  ],
  email: [
    { id: '600x800', w: 600, h: 800, label: 'Email Standard' },
    { id: '600x1200', w: 600, h: 1200, label: 'Email Long' },
    { id: '600x400', w: 600, h: 400, label: 'Email Header' },
  ],
  content: [
    { id: '1200x628', w: 1200, h: 628, label: 'Blog Header' },
    { id: '1200x675', w: 1200, h: 675, label: 'Featured Image' },
    { id: '800x800', w: 800, h: 800, label: 'Social Share' },
  ]
}

interface InitialScreenProps {
  onSelectSize: (size: { id: string; w: number; h: number }) => void
  onUploadSvg: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function InitialScreen({ onSelectSize, onUploadSvg }: InitialScreenProps) {
  const [activeTab, setActiveTab] = useState<'social' | 'display' | 'email' | 'content' | 'custom'>('social')

  const handleFileChange = (info: any) => {
    const file = info.file.originFileObj || info.file
    const event = {
      target: {
        files: [file]
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>
    onUploadSvg(event)
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '85vh',
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px',
          borderBottom: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            Template Editor
          </h1>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        className="hide-scrollbar">
          {[
            { id: 'social' as const, label: 'Social Media' },
            { id: 'display' as const, label: 'Display Ads' },
            { id: 'email' as const, label: 'Email' },
            { id: 'content' as const, label: 'Content' },
            { id: 'custom' as const, label: 'Custom' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '1 0 auto',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? '600' : '500',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#374151'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#6b7280'
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        className="hide-scrollbar">
          {activeTab === 'social' && (
            <SizeSection
              title="Social Media Templates"
              sizes={SIZE_PRESETS.social}
              onSelectSize={onSelectSize}
            />
          )}

          {activeTab === 'display' && (
            <SizeSection
              title="Display Ad Templates"
              sizes={SIZE_PRESETS.display}
              onSelectSize={onSelectSize}
            />
          )}

          {activeTab === 'email' && (
            <SizeSection
              title="Email Templates"
              sizes={SIZE_PRESETS.email}
              onSelectSize={onSelectSize}
            />
          )}

          {activeTab === 'content' && (
            <SizeSection
              title="Content Marketing Templates"
              sizes={SIZE_PRESETS.content}
              onSelectSize={onSelectSize}
            />
          )}

          {activeTab === 'custom' && (
            <div>
              <h3 style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '16px'
              }}>
                Custom Canvas Size
              </h3>
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 16px 0' }}>
                  Custom size builder coming soon
                </p>
              </div>
            </div>
          )}
        </div>

        <style>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </div>
  )
}

interface SizeSectionProps {
  title: string
  sizes: Array<{ id: string; w: number; h: number; label: string }>
  onSelectSize: (size: { id: string; w: number; h: number }) => void
}

function SizeSection({ title, sizes, onSelectSize }: SizeSectionProps) {
  return (
    <div>
      <h3 style={{
        fontSize: '12px',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '16px'
      }}>
        {title}
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '12px'
      }}>
        {sizes.map((size) => (
          <button
            key={size.id}
            onClick={() => onSelectSize(size)}
            style={{
              background: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '16px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#60a5fa'
              e.currentTarget.style.background = '#eff6ff'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db'
              e.currentTarget.style.background = '#ffffff'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '6px'
            }}>
              {size.label}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#6b7280'
            }}>
              {size.w} × {size.h} px
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

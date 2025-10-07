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
import * as IconifyAPI from '../services/iconifyApi'
import { shapeCategories, shapeRegistry, type ShapeDefinition, type ShapeId } from '../shapes/registry'
import { renderShapeGeometry } from '../shapes/render'
import type { Slot } from '../schema/types'
import { ColorPanel } from './color/ColorPanel'

const { Title, Text } = Typography

type Tool = 'templates' | 'text' | 'images' | 'shapes' | 'vectors' | 'uploads' | 'more' | 'colors'

interface LeftRailProps {
  onUploadSvg: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAddSlot: (
    slotType: 'text' | 'image' | 'shape' | 'button',
    options?: {
      shapeId?: ShapeId
      shapeOptions?: Record<string, unknown>
      textStyle?: 'heading' | 'subheading' | 'body'
    }
  ) => void
  onInsertShape: (shapeId: ShapeId, shapeOptions?: Record<string, unknown>) => void
  onCreateNewTemplate: () => void
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
    { id: 'colors' as Tool, icon: <BgColorsOutlined />, label: 'Colors' },
    { id: 'vectors' as Tool, icon: <BgColorsOutlined />, label: 'Vectors' },
    { id: 'uploads' as Tool, icon: <CloudUploadOutlined />, label: 'Uploads' },
    { id: 'more' as Tool, icon: <EllipsisOutlined />, label: 'More' }
  ]

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
        <div style={{ flex: 1, overflow: 'auto', padding: activeTool === 'colors' ? '0' : '20px', color: '#ffffff' }}>
          {activeTool === 'text' && <TextPanel onAddSlot={onAddSlot} />}
          {activeTool === 'templates' && <TemplatesPanel onCreateNew={onCreateNewTemplate} />}
          {activeTool === 'images' && <ImagesPanel onAddSlot={onAddSlot} />}
          {activeTool === 'shapes' && <ShapesPanel onInsertShape={onInsertShape} />}
          {activeTool === 'colors' && <ColorPanel />}
          {activeTool === 'vectors' && <VectorsPanel />}
          {activeTool === 'uploads' && <UploadsPanel onUploadSvg={onUploadSvg} />}
          {activeTool === 'more' && <MorePanel />}
        </div>
      </div>
    </>
  )
}

function TextPanel({ onAddSlot }: {
  onAddSlot: (slotType: 'text' | 'button', options?: { textStyle?: 'heading' | 'subheading' | 'body' }) => void
}) {
  const [textTemplates, setTextTemplates] = React.useState<any[]>([])
  const [buttonTemplates, setButtonTemplates] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const canvasSize = useEditorStore(state => state.canvasSize)
  const setTemplate = useEditorStore(state => state.setTemplate)
  const setSelection = useEditorStore(state => state.setSelection)

  // Load templates on mount and when canvas size changes
  React.useEffect(() => {
    loadTemplates()
  }, [canvasSize.id])

  async function loadTemplates() {
    try {
      setLoading(true)
      setError(null)

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

      // Load text-block templates
      const textRes = await fetch(`${API_URL}/templates?category=text-block&published=true`)
      const textData = await textRes.json()

      // Load cta-button templates
      const buttonRes = await fetch(`${API_URL}/templates?category=cta-button&published=true`)
      const buttonData = await buttonRes.json()

      // Load full template data
      const loadFullTemplates = async (templates: any[]) => {
        const withDetails = await Promise.all(
          templates.map(async (t: any) => {
            try {
              const detailRes = await fetch(`${API_URL}/templates/${t.slug}`)
              if (!detailRes.ok) return null
              return await detailRes.json()
            } catch (err) {
              console.error('Failed to load template details:', err)
              return null
            }
          })
        )

        // Filter out nulls and filter by current canvas ratio
        return withDetails
          .filter(t => t !== null)
          .filter(t => {
            const templateJson = t.template_json
            if (!templateJson || !templateJson.pages) return false
            return templateJson.pages.some((page: any) =>
              page.frames && page.frames[canvasSize.id]
            )
          })
      }

      const validTextTemplates = await loadFullTemplates(textData.templates)
      const validButtonTemplates = await loadFullTemplates(buttonData.templates)

      setTextTemplates(validTextTemplates)
      setButtonTemplates(validButtonTemplates)
    } catch (err: any) {
      console.error('Failed to load templates:', err)
      setError(err.message || 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  async function handleTemplateClick(template: any) {
    try {
      setTemplate(template.template_json)
      setSelection([])
    } catch (err) {
      console.error('Failed to load template:', err)
      setError('Failed to load template')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Text Block Buttons */}
      <PanelSectionTitle>CREATE NEW</PanelSectionTitle>
      <TextBlockButton
        label="Add a heading"
        fontSize="24px"
        fontWeight="700"
        onClick={() => onAddSlot('text', { textStyle: 'heading' })}
      />
      <TextBlockButton
        label="Add a subheading"
        fontSize="18px"
        fontWeight="600"
        onClick={() => onAddSlot('text', { textStyle: 'subheading' })}
      />
      <TextBlockButton
        label="Add body text"
        fontSize="14px"
        fontWeight="400"
        onClick={() => onAddSlot('text', { textStyle: 'body' })}
      />

      <Divider style={{ borderColor: '#3a3a3a', margin: '24px 0' }} />

      {/* Buttons/CTAs Section */}
      <PanelSectionTitle>BUTTONS & CTAS</PanelSectionTitle>
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0', color: '#9ca3af' }}>
          <Spin size="small" />
        </div>
      )}
      {!loading && buttonTemplates.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          {buttonTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              style={{
                background: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '6px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s',
                aspectRatio: '1'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#3a3a3a'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {template.preview_url ? (
                <img
                  src={template.preview_url}
                  alt={template.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: '600',
                  textAlign: 'center',
                  padding: '8px'
                }}>
                  {template.title}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {!loading && buttonTemplates.length === 0 && (
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '20px', textAlign: 'center' }}>
          No button templates yet
        </div>
      )}

      <Divider style={{ borderColor: '#3a3a3a', margin: '24px 0' }} />

      {/* Quick Text Chips */}
      <PanelSectionTitle>QUICK TEXT CHIPS</PanelSectionTitle>
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0', color: '#9ca3af' }}>
          <Spin size="small" />
        </div>
      )}
      {!loading && textTemplates.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {textTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              style={{
                background: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '6px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s',
                aspectRatio: '1'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#3a3a3a'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {template.preview_url ? (
                <img
                  src={template.preview_url}
                  alt={template.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: '600',
                  textAlign: 'center',
                  padding: '8px'
                }}>
                  {template.title}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {!loading && textTemplates.length === 0 && (
        <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
          No text templates yet
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px',
          background: '#7f1d1d',
          border: '1px solid #991b1b',
          borderRadius: '6px',
          color: '#fecaca',
          fontSize: '12px',
          marginTop: '16px'
        }}>
          {error}
        </div>
      )}
    </div>
  )
}

function TemplatesPanel({ onCreateNew }: { onCreateNew: () => void }) {
  const [templates, setTemplates] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const canvasSize = useEditorStore(state => state.canvasSize)
  const setTemplate = useEditorStore(state => state.setTemplate)
  const setSelection = useEditorStore(state => state.setSelection)

  // Load templates on mount and when canvas size changes
  React.useEffect(() => {
    loadTemplates()
  }, [canvasSize.id])

  async function loadTemplates() {
    try {
      setLoading(true)
      setError(null)

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const res = await fetch(`${API_URL}/templates?published=true`)

      if (!res.ok) throw new Error('Failed to load templates')

      const data = await res.json()

      // Load full template data to check for compatible ratios
      const templatesWithDetails = await Promise.all(
        data.templates.map(async (t: any) => {
          try {
            const detailRes = await fetch(`${API_URL}/templates/${t.slug}`)
            if (!detailRes.ok) return null

            const detail = await detailRes.json()
            return detail
          } catch (err) {
            console.error('Failed to load template details:', err)
            return null
          }
        })
      )

      // Filter out nulls and filter by current canvas ratio
      const validTemplates = templatesWithDetails
        .filter(t => t !== null)
        .filter(t => {
          // Check if any page has frames for the current ratio
          const templateJson = t.template_json
          if (!templateJson || !templateJson.pages) return false

          return templateJson.pages.some((page: any) =>
            page.frames && page.frames[canvasSize.id]
          )
        })

      setTemplates(validTemplates)
    } catch (err: any) {
      console.error('Failed to load templates:', err)
      setError(err.message || 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  async function handleTemplateClick(template: any) {
    try {
      setTemplate(template.template_json)
      setSelection([])
    } catch (err) {
      console.error('Failed to load template:', err)
      setError('Failed to load template')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PanelSectionTitle>START FRESH</PanelSectionTitle>
      <PanelButton onClick={onCreateNew}>+ Create New Template</PanelButton>

      <Divider style={{ borderColor: '#3a3a3a', margin: '24px 0' }} />

      <PanelSectionTitle>
        TEMPLATES ({canvasSize.w}×{canvasSize.h})
      </PanelSectionTitle>

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

      {/* Template Grid - Scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {!loading && !error && templates.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '12px',
            paddingBottom: '16px'
          }}>
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#3a3a3a'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {/* Preview Image */}
                <div style={{
                  aspectRatio: `${canvasSize.w} / ${canvasSize.h}`,
                  background: template.preview_url
                    ? '#2a2a2a'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {template.preview_url ? (
                    <img
                      src={template.preview_url}
                      alt={template.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <AppstoreFilled style={{ fontSize: '32px', color: '#ffffff' }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '12px' }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#e5e7eb',
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {template.title}
                  </div>
                  {template.description && (
                    <div style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {template.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && templates.length === 0 && (
          <EmptyState>
            No templates available for {canvasSize.w}×{canvasSize.h}
          </EmptyState>
        )}
      </div>
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
  const [searchQuery, setSearchQuery] = React.useState('')
  const [icons, setIcons] = React.useState<IconifyAPI.IconifyIcon[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Get editor store for adding icons directly
  const template = useEditorStore(state => state.template)
  const setTemplate = useEditorStore(state => state.setTemplate)
  const canvasSize = useEditorStore(state => state.canvasSize)
  const setSelection = useEditorStore(state => state.setSelection)
  const currentPageId = useEditorStore(state => state.currentPageId)

  // Load popular icons on mount
  React.useEffect(() => {
    if (icons.length === 0) {
      loadDefaultIcons()
    }
  }, [])

  async function loadDefaultIcons() {
    try {
      setLoading(true)
      setError(null)

      // Predefined list of popular Flat Color Icons (colorful, marketing-friendly)
      const popularFlatColorIcons = [
        'flat-color-icons:advertising',
        'flat-color-icons:business-contact',
        'flat-color-icons:like',
        'flat-color-icons:voice-presentation',
        'flat-color-icons:business',
        'flat-color-icons:template',
        'flat-color-icons:conference-call',
        'flat-color-icons:sales-performance',
        'flat-color-icons:share',
        'flat-color-icons:timeline',
        'flat-color-icons:comments',
        'flat-color-icons:idea',
        'flat-color-icons:approval',
        'flat-color-icons:gallery',
        'flat-color-icons:video-call',
        'flat-color-icons:phone',
        'flat-color-icons:email',
        'flat-color-icons:search',
        'flat-color-icons:folder',
        'flat-color-icons:settings',
        'flat-color-icons:edit-image',
        'flat-color-icons:manager',
        'flat-color-icons:speaker',
        'flat-color-icons:survey',
        'flat-color-icons:workflow',
        'flat-color-icons:news',
        'flat-color-icons:menu',
        'flat-color-icons:camera',
        'flat-color-icons:calendar',
        'flat-color-icons:database',
        'flat-color-icons:document',
        'flat-color-icons:graduation-cap',
        'flat-color-icons:statistics',
        'flat-color-icons:package',
        'flat-color-icons:globe',
        'flat-color-icons:home',
        'flat-color-icons:services',
        'flat-color-icons:shop',
        'flat-color-icons:todo-list',
        'flat-color-icons:upload',
        'flat-color-icons:download',
        'flat-color-icons:bookmark',
        'flat-color-icons:link',
        'flat-color-icons:rules',
        'flat-color-icons:automatic',
        'flat-color-icons:checkmark',
        'flat-color-icons:cancel',
        'flat-color-icons:info'
      ]

      const parsedIcons = popularFlatColorIcons.map(fullName => IconifyAPI.parseIconName(fullName))
      setIcons(parsedIcons)
    } catch (err: any) {
      console.error('Failed to load icons:', err)
      setError(err.message || 'Failed to load icons')
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(value: string) {
    if (!value.trim()) {
      loadDefaultIcons()
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSearchQuery(value)

      const response = await IconifyAPI.searchIcons(value, 48)
      const parsedIcons = response.icons.map(fullName => IconifyAPI.parseIconName(fullName))
      setIcons(parsedIcons)
    } catch (err: any) {
      console.error('Failed to search icons:', err)
      setError(err.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleIconClick(icon: IconifyAPI.IconifyIcon) {
    if (!template || !currentPageId) return

    try {
      // Get SVG URL from Iconify (no download needed, just construct URL)
      const svgUrl = IconifyAPI.getIconSvgUrl(icon.prefix, icon.name)

      // Find current page
      const currentPage = template.pages.find(p => p.id === currentPageId)
      if (!currentPage) return

      // Generate unique slot name
      const existingNames = currentPage.slots.map(s => s.name)
      let counter = 1
      let slotName = `icon-${counter}`
      while (existingNames.includes(slotName)) {
        counter++
        slotName = `icon-${counter}`
      }

      // Get viewBox for positioning
      const [vbX, vbY, vbWidth, vbHeight] = template.canvas.baseViewBox

      // Calculate default size (20% of canvas width/height for icons - smaller than images)
      const defaultWidth = vbWidth * 0.2
      const defaultHeight = vbHeight * 0.2

      // Center position
      const x = vbX + (vbWidth - defaultWidth) / 2
      const y = vbY + (vbHeight - defaultHeight) / 2

      // Find highest z-index in current page
      const maxZ = currentPage.slots.reduce((max, slot) => Math.max(max, slot.z), 0)

      // Create new slot with Iconify icon
      const newSlot: any = {
        name: slotName,
        type: 'image',
        z: maxZ + 1,
        fit: 'contain', // Icons should use contain, not cover
        href: svgUrl,
        attribution: {
          name: icon.name,
          collection: IconifyAPI.getCollectionDisplayName(icon.prefix),
          source: 'Iconify',
          sourceUrl: `https://icon-sets.iconify.design/${icon.prefix}/${icon.name}/`,
          license: 'Open Source'
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

      console.log(`Added Iconify icon to page ${currentPageId}: ${slotName}`, icon)
    } catch (err: any) {
      console.error('Failed to add icon:', err)
      setError(err.message || 'Failed to add icon')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PanelSectionTitle>Vector Icons & Elements</PanelSectionTitle>

      {/* Search Bar */}
      <div style={{ marginBottom: '16px' }}>
        <Input.Search
          placeholder="Search icons..."
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

      {/* Icon Grid - Scrollable Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        marginBottom: '16px'
      }}>
        {!loading && !error && icons.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px'
          }}>
            {icons.map((icon) => (
              <div
                key={icon.fullName}
                onClick={() => handleIconClick(icon)}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid #3a3a3a',
                  transition: 'all 0.2s',
                  background: '#1a1a1a',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.borderColor = '#3b82f6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.borderColor = '#3a3a3a'
                }}
                title={`${icon.name} (${IconifyAPI.getCollectionDisplayName(icon.prefix)})`}
              >
                <img
                  src={IconifyAPI.getIconPreviewUrl(icon.prefix, icon.name, 64)}
                  alt={icon.name}
                  style={{
                    width: '64px',
                    height: '64px',
                    objectFit: 'contain'
                  }}
                />
                <div style={{
                  fontSize: '10px',
                  color: '#6b7280',
                  marginTop: '4px',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%'
                }}>
                  {icon.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && icons.length === 0 && (
          <EmptyState>No icons found</EmptyState>
        )}
      </div>

      {/* Attribution Footer */}
      <div style={{
        borderTop: '1px solid #3a3a3a',
        padding: '12px 0',
        marginTop: 'auto',
        textAlign: 'center'
      }}>
        <a
          href="https://iconify.design"
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
          150,000+ icons powered by Iconify
        </a>
      </div>
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

function TextBlockButton({
  label,
  fontSize,
  fontWeight,
  onClick
}: {
  label: string
  fontSize: string
  fontWeight: string
  onClick: () => void
}) {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        background: isHovered ? '#3a3a3a' : '#2a2a2a',
        border: '1px solid #3a3a3a',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        color: '#ffffff',
        fontSize,
        fontWeight,
        fontFamily: 'Inter, sans-serif'
      }}
    >
      {label}
    </button>
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

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TemplateService, type TemplateMetadata } from '../services/templateService'
import { useEditorStore } from '../state/editorStore'
import { AppstoreFilled, TagOutlined, SearchOutlined } from '@ant-design/icons'
import { Input } from 'antd'

const CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'full-template', label: 'Full Templates' },
  { id: 'layout', label: 'Layouts' },
  { id: 'text-block', label: 'Text Blocks' },
  { id: 'cta-button', label: 'CTA Buttons' },
  { id: 'shape', label: 'Shapes' },
  { id: 'icon', label: 'Icons' }
]

export default function Templates() {
  const navigate = useNavigate()
  const setTemplate = useEditorStore(state => state.setTemplate)
  const [templates, setTemplates] = useState<TemplateMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Load templates on mount
  useEffect(() => {
    loadTemplates()
  }, [selectedCategory])

  async function loadTemplates() {
    setLoading(true)
    try {
      const category = selectedCategory === 'all' ? undefined : selectedCategory
      const results = await TemplateService.getTemplates(category as any)
      setTemplates(results)
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleTemplateClick(slug: string) {
    try {
      const template = await TemplateService.getTemplateBySlug(slug)
      if (!template) {
        alert('Template not found')
        return
      }

      setTemplate(template.templateJson)
      navigate('/editor')
    } catch (error) {
      console.error('Failed to load template:', error)
      alert('Failed to load template')
    }
  }

  // Filter templates by search query
  const filteredTemplates = templates.filter(t => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.tags.some(tag => tag.toLowerCase().includes(query))
    )
  })

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#F3F6F6',
      overflow: 'hidden'
    }}>
      {/* Dotted Background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, #E1DFF6 1px, transparent 1px)',
        backgroundSize: '16px 16px',
        pointerEvents: 'none',
        opacity: 1,
        zIndex: 0
      }} />

      {/* Header */}
      <div style={{
        height: '64px',
        borderBottom: '1px solid #e5e7eb',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AppstoreFilled style={{ fontSize: '24px', color: '#3b82f6' }} />
          <h1 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            Template Gallery
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 16px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e5e7eb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f3f4f6'
            }}
          >
            Back to Home
          </button>
          <button
            onClick={() => navigate('/editor')}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3b82f6'
            }}
          >
            Start Blank
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px'
        }}>
          {/* Search and Filters */}
          <div style={{
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Search Bar */}
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: '400px' }}
            />

            {/* Category Tabs */}
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '8px 16px',
                    background: selectedCategory === cat.id ? '#3b82f6' : '#ffffff',
                    border: selectedCategory === cat.id ? 'none' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: selectedCategory === cat.id ? '#ffffff' : '#6b7280',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== cat.id) {
                      e.currentTarget.style.background = '#f3f4f6'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== cat.id) {
                      e.currentTarget.style.background = '#ffffff'
                    }
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{
              textAlign: 'center',
              padding: '60px 0',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              Loading templates...
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredTemplates.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 0'
            }}>
              <AppstoreFilled style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
                No templates found
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                {searchQuery ? 'Try a different search query' : 'Create your first template in the editor'}
              </p>
            </div>
          )}

          {/* Templates Grid */}
          {!loading && filteredTemplates.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => handleTemplateClick(template.slug)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface TemplateCardProps {
  template: TemplateMetadata
  onClick: () => void
}

function TemplateCard({ template, onClick }: TemplateCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0, 0, 0, 0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Preview Image */}
      <div style={{
        aspectRatio: '1',
        background: template.previewUrl
          ? '#f3f4f6'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontSize: '48px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {template.previewUrl ? (
          <img
            src={template.previewUrl}
            alt={template.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.style.display = 'none'
              const parent = e.currentTarget.parentElement
              if (parent) {
                parent.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                const icon = document.createElement('div')
                icon.innerHTML = '📄'
                icon.style.fontSize = '48px'
                parent.appendChild(icon)
              }
            }}
          />
        ) : (
          <AppstoreFilled />
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 8px 0',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {template.title}
        </h3>

        {template.description && (
          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            margin: '0 0 12px 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {template.description}
          </p>
        )}

        {/* Tags */}
        {template.tags.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap'
          }}>
            {template.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <TagOutlined style={{ fontSize: '10px' }} />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

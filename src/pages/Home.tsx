import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload } from 'antd'
import { CloudUploadOutlined } from '@ant-design/icons'
import { useEditorStore } from '../state/editorStore'
import { importSvgToTemplate } from '../importer/importSvg'
import { validateTemplate } from '../schema/validateTemplate'
import type { Template } from '../schema/types'

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

export default function Home() {
  const navigate = useNavigate()
  const setCanvasSize = useEditorStore(state => state.setCanvasSize)
  const createNewTemplate = useEditorStore(state => state.createNewTemplate)
  const setTemplate = useEditorStore(state => state.setTemplate)
  const [activeTab, setActiveTab] = useState<'social' | 'display' | 'email' | 'content' | 'custom'>('social')

  function handleSelectSize(size: { id: string; w: number; h: number }) {
    setCanvasSize(size)
    createNewTemplate()
    navigate('/editor')
  }

  async function handleUploadSvg(e: React.ChangeEvent<HTMLInputElement>) {
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

    // Navigate to editor after successful import
    navigate('/editor')
  }

  const handleFileChange = (info: any) => {
    const file = info.file.originFileObj || info.file
    const event = {
      target: {
        files: [file]
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>
    handleUploadSvg(event)
  }

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F3F6F6',
      position: 'relative',
      zIndex: 1
    }}>
      {/* Dotted Background Pattern */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, #E1DFF6 1px, transparent 1px)',
        backgroundSize: '16px 16px',
        pointerEvents: 'none',
        opacity: 1,
        zIndex: 0
      }} />
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
          textAlign: 'center',
          position: 'relative'
        }}>
          {import.meta.env.VITE_TEMPLATE_GALLERY === 'true' && (
            <button
              onClick={() => navigate('/templates')}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                padding: '6px 12px',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
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
              Browse Templates
            </button>
          )}
          <h1 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            Template Editor
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '8px 0 0 0'
          }}>
            Choose a canvas size to get started
          </p>
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
              onSelectSize={handleSelectSize}
            />
          )}

          {activeTab === 'display' && (
            <SizeSection
              title="Display Ad Templates"
              sizes={SIZE_PRESETS.display}
              onSelectSize={handleSelectSize}
            />
          )}

          {activeTab === 'email' && (
            <SizeSection
              title="Email Templates"
              sizes={SIZE_PRESETS.email}
              onSelectSize={handleSelectSize}
            />
          )}

          {activeTab === 'content' && (
            <SizeSection
              title="Content Marketing Templates"
              sizes={SIZE_PRESETS.content}
              onSelectSize={handleSelectSize}
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
                Upload SVG Template
              </h3>
              <Upload.Dragger
                accept=".svg"
                beforeUpload={() => false}
                onChange={handleFileChange}
                showUploadList={false}
                style={{
                  background: '#f9fafb',
                  border: '2px dashed #d1d5db'
                }}
              >
                <div style={{ padding: '16px' }}>
                  <CloudUploadOutlined style={{ fontSize: '40px', color: '#9ca3af', marginBottom: '12px' }} />
                  <div style={{ fontSize: '14px', color: '#374151', marginBottom: '6px', fontWeight: '500' }}>
                    Click or drag SVG to upload
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    SVG files with data-slot attributes
                  </div>
                </div>
              </Upload.Dragger>
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

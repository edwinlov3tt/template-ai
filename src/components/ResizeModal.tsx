import React from 'react'

interface ResizeModalProps {
  isOpen: boolean
  onClose: () => void
  currentSize: { w: number; h: number }
  onSelectSize: (size: { id: string; w: number; h: number }) => void
}

// IAB Standard Ad Sizes + Social Media Sizes
const SIZE_PRESETS = {
  social: [
    { id: '1:1', w: 1080, h: 1080, label: 'Instagram Square' },
    { id: '4:5', w: 1080, h: 1350, label: 'Instagram Portrait' },
    { id: '9:16', w: 1080, h: 1920, label: 'Instagram Story' },
    { id: '16:9', w: 1920, h: 1080, label: 'YouTube Thumbnail' },
  ],
  iab: [
    { id: '300x250', w: 300, h: 250, label: 'Medium Rectangle' },
    { id: '728x90', w: 728, h: 90, label: 'Leaderboard' },
    { id: '160x600', w: 160, h: 600, label: 'Wide Skyscraper' },
    { id: '300x600', w: 300, h: 600, label: 'Half Page' },
    { id: '970x250', w: 970, h: 250, label: 'Billboard' },
    { id: '320x50', w: 320, h: 50, label: 'Mobile Banner' },
    { id: '300x50', w: 300, h: 50, label: 'Mobile Banner (300)' },
  ]
}

export function ResizeModal({ isOpen, onClose, currentSize, onSelectSize }: ResizeModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(17, 24, 39, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Resize Canvas
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '20px',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '4px',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>
            {/* Current Size */}
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '12px 16px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                Current Size
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                {currentSize.w} × {currentSize.h} px
              </div>
            </div>

            {/* Social Media Sizes */}
            <SizeSection
              title="Social Media"
              sizes={SIZE_PRESETS.social}
              currentSize={currentSize}
              onSelectSize={onSelectSize}
              onClose={onClose}
            />

            {/* IAB Display Ads */}
            <SizeSection
              title="IAB Display Ads"
              sizes={SIZE_PRESETS.iab}
              currentSize={currentSize}
              onSelectSize={onSelectSize}
              onClose={onClose}
            />
          </div>
        </div>
      </div>
    </>
  )
}

interface SizeSectionProps {
  title: string
  sizes: Array<{ id: string; w: number; h: number; label: string }>
  currentSize: { w: number; h: number }
  onSelectSize: (size: { id: string; w: number; h: number }) => void
  onClose: () => void
}

function SizeSection({ title, sizes, currentSize, onSelectSize, onClose }: SizeSectionProps) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{
        fontSize: '12px',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '12px'
      }}>
        {title}
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '8px'
      }}>
        {sizes.map((size) => {
          const isCurrent = size.w === currentSize.w && size.h === currentSize.h

          return (
            <button
              key={size.id}
              onClick={() => {
                onSelectSize(size)
                onClose()
              }}
              style={{
                background: isCurrent ? '#eff6ff' : '#ffffff',
                border: isCurrent ? '2px solid #3b82f6' : '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                if (!isCurrent) {
                  e.currentTarget.style.borderColor = '#9ca3af'
                  e.currentTarget.style.background = '#f9fafb'
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrent) {
                  e.currentTarget.style.borderColor = '#d1d5db'
                  e.currentTarget.style.background = '#ffffff'
                }
              }}
            >
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '4px'
              }}>
                {size.label}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                {size.w} × {size.h} px
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

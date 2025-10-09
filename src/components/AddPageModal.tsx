import React from 'react'
import { X } from 'lucide-react'

interface PageSize {
  id: string
  w: number
  h: number
  label: string
}

const PAGE_SIZE_PRESETS: PageSize[] = [
  { id: '728x90', w: 728, h: 90, label: 'Leaderboard (728×90)' },
  { id: '300x250', w: 300, h: 250, label: 'Medium Rectangle (300×250)' },
  { id: '160x600', w: 160, h: 600, label: 'Wide Skyscraper (160×600)' },
  { id: '300x600', w: 300, h: 600, label: 'Half Page (300×600)' },
  { id: '320x50', w: 320, h: 50, label: 'Mobile Banner (320×50)' },
  { id: '970x250', w: 970, h: 250, label: 'Billboard (970×250)' },
  { id: '1080x1080', w: 1080, h: 1080, label: 'Instagram Square (1080×1080)' },
  { id: '1080x1920', w: 1080, h: 1920, label: 'YouTube Vertical (1080×1920)' }
]

interface AddPageModalProps {
  isOpen: boolean
  onClose: () => void
  onAddPage: (size: PageSize) => void
  onCustomSize: () => void
}

export function AddPageModal({ isOpen, onClose, onAddPage, onCustomSize }: AddPageModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          zIndex: 10000,
          width: '90%',
          maxWidth: '720px',
          maxHeight: '80vh',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 32px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#111827',
            margin: 0
          }}>
            Add New Page
          </h2>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={28} color="#6b7280" />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px 32px',
          overflowY: 'auto',
          maxHeight: 'calc(80vh - 140px)'
        }}>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            marginTop: 0,
            marginBottom: '24px'
          }}>
            Choose a canvas size for your new page
          </p>

          {/* Size Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {PAGE_SIZE_PRESETS.map((size) => (
              <button
                key={size.id}
                onClick={() => {
                  onAddPage(size)
                  onClose()
                }}
                style={{
                  padding: '20px 24px',
                  border: '2px solid #e5e7eb',
                  background: '#ffffff',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6'
                  e.currentTarget.style.background = '#eff6ff'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.background = '#ffffff'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <span style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  {size.label}
                </span>
                <span style={{
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  {size.w} × {size.h} pixels
                </span>
              </button>
            ))}
          </div>

          {/* Custom Size Button */}
          <button
            onClick={() => {
              onCustomSize()
              onClose()
            }}
            style={{
              width: '100%',
              padding: '20px 24px',
              border: '2px dashed #3b82f6',
              background: '#eff6ff',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: '600',
              color: '#3b82f6',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#dbeafe'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#eff6ff'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Custom Size...
          </button>
        </div>
      </div>
    </>
  )
}

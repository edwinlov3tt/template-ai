/**
 * LeftSidePanel.tsx
 *
 * Dark-themed side panel for Effects and Position controls.
 * Triggered by buttons in FloatingTextToolbar.
 */

import React from 'react'
import { X } from 'lucide-react'
import { EffectsPanel } from './effects/EffectsPanel'
import { PositionPanel } from './position/PositionPanel'

export type LeftPanelView = 'effects' | 'position' | null

interface LeftSidePanelProps {
  activeView: LeftPanelView
  onClose: () => void
}

export const LeftSidePanel: React.FC<LeftSidePanelProps> = ({
  activeView,
  onClose
}) => {
  if (!activeView) return null

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: 35
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '360px',
          background: '#1e1e1e',
          boxShadow: '4px 0 12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#ffffff',
              margin: 0
            }}
          >
            {activeView === 'effects' ? 'Text Effects' : 'Position & Size'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9ca3af'
            }}
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '20px'
          }}
        >
          {activeView === 'effects' && <EffectsPanel />}
          {activeView === 'position' && <PositionPanel />}
        </div>
      </div>
    </>
  )
}

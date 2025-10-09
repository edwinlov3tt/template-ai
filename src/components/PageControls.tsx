import React, { useState } from 'react'
import { ChevronUp, ChevronDown, Copy, Trash2 } from 'lucide-react'
import type { Page } from '../schema/types'
import { AddPageDropdown } from './AddPageDropdown'
import { getUiScale } from '../utils/uiScale'

interface PageControlsProps {
  page: Page
  pageIndex: number
  totalPages: number
  showName: boolean  // Only show when 2+ pages
  zoom: number  // Zoom percentage for responsive sizing
  onRename: (name: string) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate: () => void
  onDelete: () => void
  onAddPage: (size: { id: string; w: number; h: number }) => void
  onCustomPageSize: () => void
}

export function PageControls({
  page,
  pageIndex,
  totalPages,
  showName,
  zoom,
  onRename,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onAddPage,
  onCustomPageSize
}: PageControlsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(page.name)

  const canMoveUp = pageIndex > 0
  const canMoveDown = pageIndex < totalPages - 1
  const canDelete = totalPages > 1

  // Use moderate scaling to keep icons visible but not huge
  const controlScale = getUiScale(zoom, { min: 1, max: 1.6 })
  const iconSize = Math.round(28 * controlScale)
  const buttonPadding = `${Math.round(8 * controlScale)}px`

  function handleSave() {
    if (editValue.trim()) {
      onRename(editValue.trim())
    } else {
      setEditValue(page.name)
    }
    setIsEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(page.name)
      setIsEditing(false)
    }
  }

  return (
    <>
      {/* Page Name - Left side */}
      {showName && (
        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{
                border: '1px solid #3b82f6',
                borderRadius: '6px',
                padding: `${Math.round(6 * controlScale)}px ${Math.round(10 * controlScale)}px`,
                fontSize: `${Math.round(18 * controlScale)}px`,
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                width: `${Math.round(180 * controlScale)}px`,
                color: '#1f2937'
              }}
            />
          ) : (
            <span
              onClick={() => setIsEditing(true)}
              style={{
                fontSize: `${Math.round(26 * controlScale)}px`,
                fontWeight: '700',
                color: '#1f2937',
                cursor: 'pointer',
                padding: `${Math.round(6 * controlScale)}px ${Math.round(10 * controlScale)}px`,
                borderRadius: '6px',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {page.name}
            </span>
          )}
        </div>
      )}

      {/* Control Buttons - Right side */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${Math.round(16 * controlScale)}px`
      }}>
        {/* Move Up */}
        <button
          onClick={onMoveUp}
          disabled={!canMoveUp}
          title="Move page up"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: canMoveUp ? 'pointer' : 'not-allowed',
            opacity: canMoveUp ? 1 : 0.3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: buttonPadding
          }}
        >
          <ChevronUp size={iconSize} color="#374151" strokeWidth={2.2} />
        </button>

        {/* Move Down */}
        <button
          onClick={onMoveDown}
          disabled={!canMoveDown}
          title="Move page down"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: canMoveDown ? 'pointer' : 'not-allowed',
            opacity: canMoveDown ? 1 : 0.3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: buttonPadding
          }}
        >
          <ChevronDown size={iconSize} color="#374151" strokeWidth={2.2} />
        </button>

        {/* Duplicate */}
        <button
          onClick={onDuplicate}
          title="Duplicate page"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: buttonPadding
          }}
        >
          <Copy size={iconSize} color="#374151" strokeWidth={2.2} />
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          disabled={!canDelete}
          title={canDelete ? "Delete page" : "Can't delete last page"}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: canDelete ? 'pointer' : 'not-allowed',
            opacity: canDelete ? 1 : 0.35,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: buttonPadding
          }}
        >
          <Trash2 size={iconSize} color="#ef4444" strokeWidth={2.2} />
        </button>

        {/* Add Page Dropdown */}
        <AddPageDropdown
          zoom={zoom}
          onAddPage={onAddPage}
          onCustomSize={onCustomPageSize}
        />
      </div>
    </>
  )
}

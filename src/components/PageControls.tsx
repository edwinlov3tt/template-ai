import React, { useState } from 'react'
import { ChevronUp, ChevronDown, Copy, Trash2, FilePlus } from 'lucide-react'
import type { Page } from '../schema/types'

interface PageControlsProps {
  page: Page
  pageIndex: number
  totalPages: number
  showName: boolean  // Only show when 2+ pages
  onRename: (name: string) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate: () => void
  onDelete: () => void
  onAddPage: () => void
}

export function PageControls({
  page,
  pageIndex,
  totalPages,
  showName,
  onRename,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onAddPage
}: PageControlsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(page.name)

  const canMoveUp = pageIndex > 0
  const canMoveDown = pageIndex < totalPages - 1
  const canDelete = totalPages > 1

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
        <div style={{ flex: 1 }}>
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
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '16px',
                fontWeight: '500',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                width: '140px',
                color: '#374151'
              }}
            />
          ) : (
            <span
              onClick={() => setIsEditing(true)}
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#374151',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
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
        gap: '12px'
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
            padding: '4px'
          }}
        >
          <ChevronUp size={28} color="#6b7280" strokeWidth={2} />
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
            padding: '4px'
          }}
        >
          <ChevronDown size={28} color="#6b7280" strokeWidth={2} />
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
            padding: '4px'
          }}
        >
          <Copy size={28} color="#6b7280" strokeWidth={2} />
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
            opacity: canDelete ? 1 : 0.3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px'
          }}
        >
          <Trash2 size={28} color={canDelete ? '#6b7280' : '#6b7280'} strokeWidth={2} />
        </button>

        {/* Add Page */}
        <button
          onClick={onAddPage}
          title="Add page"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px'
          }}
        >
          <FilePlus size={28} color="#6b7280" strokeWidth={2} />
        </button>
      </div>
    </>
  )
}

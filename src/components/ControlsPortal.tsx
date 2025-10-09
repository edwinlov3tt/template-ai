import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Page } from '../schema/types'
import { PageControls } from './PageControls'

interface ControlsPortalProps {
  page: Page
  pageIndex: number
  totalPages: number
  showName: boolean
  onRename: (name: string) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate: () => void
  onDelete: () => void
  onAddPage: (size: { id: string; w: number; h: number }) => void
  onCustomPageSize: () => void
  anchorRef: React.RefObject<HTMLElement>
  zoom: number
}

/**
 * Portal-based controls overlay that renders outside the canvas clipping hierarchy
 * Positioned absolutely relative to the canvas anchor element
 */
export function ControlsPortal({
  page,
  pageIndex,
  totalPages,
  showName,
  onRename,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onAddPage,
  onCustomPageSize,
  anchorRef,
  zoom
}: ControlsPortalProps) {
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null)
  const portalRoot = useRef<HTMLDivElement | null>(null)

  // Create portal root on mount
  useEffect(() => {
    const div = document.createElement('div')
    div.id = `controls-portal-${page.id}`
    div.style.position = 'fixed'
    div.style.zIndex = '100'
    div.style.pointerEvents = 'auto'
    document.body.appendChild(div)
    portalRoot.current = div

    return () => {
      if (portalRoot.current) {
        document.body.removeChild(portalRoot.current)
      }
    }
  }, [page.id])

  // Update position based on anchor element
  useEffect(() => {
    const updatePosition = () => {
      if (!anchorRef.current) return

      const rect = anchorRef.current.getBoundingClientRect()
      setPosition({
        top: rect.top - 80, // Position above canvas (controls height ~80px)
        left: rect.left,
        width: rect.width
      })
    }

    updatePosition()

    // Update on resize/scroll
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    // Update on zoom changes
    const interval = setInterval(updatePosition, 100)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      clearInterval(interval)
    }
  }, [anchorRef, zoom])

  if (!portalRoot.current || !position) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: totalPages > 1 ? 'space-between' : 'flex-end',
        paddingLeft: '18px',
        paddingRight: '18px',
        paddingTop: '16px',
        paddingBottom: '12px',
        pointerEvents: 'auto',
        background: 'transparent'
      }}
    >
      <PageControls
        page={page}
        pageIndex={pageIndex}
        totalPages={totalPages}
        showName={showName}
        onRename={onRename}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onAddPage={onAddPage}
        onCustomPageSize={onCustomPageSize}
      />
    </div>,
    portalRoot.current
  )
}

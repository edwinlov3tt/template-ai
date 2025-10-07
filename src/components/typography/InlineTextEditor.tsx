/**
 * InlineTextEditor.tsx
 *
 * Inline text editor for editing text slot content directly on canvas.
 * Renders as contentEditable div positioned over the text slot.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { Slot } from '../../schema/types'
import { useEditorStore } from '../../state/editorStore'

interface InlineTextEditorProps {
  slot: Slot
  frame: { x: number; y: number; width: number; height: number }
  initialContent: string
  onSave: (content: string) => void
  onCancel: () => void
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  slot,
  frame,
  initialContent,
  onSave,
  onCancel
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [content, setContent] = useState(initialContent)
  const updateSlotFrame = useEditorStore(state => state.updateSlotFrame)

  // Reactive styles that update when slot properties change
  const [fontSize, setFontSize] = useState(slot.fontSize || 16)
  const [fontFamily, setFontFamily] = useState(slot.fontFamily || 'Inter')
  const [fontWeight, setFontWeight] = useState(slot.fontWeight || 400)
  const [fontStyle, setFontStyle] = useState(slot.fontStyle || 'normal')
  const [color, setColor] = useState(slot.color ?? slot.fill ?? '#000000')
  const [textAlign, setTextAlign] = useState(slot.textAlign || 'left')
  const [letterSpacing, setLetterSpacing] = useState(slot.letterSpacing || 0)
  const [lineHeight, setLineHeight] = useState(slot.lineHeight || 1.2)

  // Update styles when slot properties change during editing
  useEffect(() => {
    setFontSize(slot.fontSize || 16)
    setFontFamily(slot.fontFamily || 'Inter')
    setFontWeight(slot.fontWeight || 400)
    setFontStyle(slot.fontStyle || 'normal')
    setColor(slot.color ?? slot.fill ?? '#000000')
    setTextAlign(slot.textAlign || 'left')
    setLetterSpacing(slot.letterSpacing || 0)
    setLineHeight(slot.lineHeight || 1.2)
  }, [slot.fontSize, slot.fontFamily, slot.fontWeight, slot.fontStyle, slot.color, slot.fill, slot.textAlign, slot.letterSpacing, slot.lineHeight])

  // Focus and select all on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus()

      // Select all text
      const range = document.createRange()
      const selection = window.getSelection()
      range.selectNodeContents(editorRef.current)
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        // CMD/CTRL+Enter to save
        e.preventDefault()
        handleSave()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [content])

  // Handle click outside - using useCallback to prevent re-creating the handler
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
      const innerHTML = editorRef.current.innerHTML
      const finalContent = innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')

      // With box-sizing: border-box, scrollHeight includes padding and gives us the total height
      const actualHeight = editorRef.current.scrollHeight

      if (actualHeight > frame.height) {
        updateSlotFrame(slot.name, { height: actualHeight })
      }

      onSave(finalContent)
    }
  }, [onSave, slot.name, frame.height, updateSlotFrame])

  useEffect(() => {
    // Delay adding listener to prevent immediate close on double-click
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeout)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleClickOutside])

  const handleSave = () => {
    if (!editorRef.current) {
      onSave(content)
      return
    }

    // Convert <br> tags back to newlines
    const innerHTML = editorRef.current.innerHTML
    const finalContent = innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')

    // With box-sizing: border-box, scrollHeight includes padding and gives us the total height
    const actualHeight = editorRef.current.scrollHeight

    if (actualHeight > frame.height) {
      updateSlotFrame(slot.name, { height: actualHeight })
    }

    onSave(finalContent)
  }

  const handleInput = () => {
    if (editorRef.current) {
      // Store content with <br> preserved
      const innerHTML = editorRef.current.innerHTML
      const textContent = innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')
      setContent(textContent)
    }
  }

  // Calculate position from frame
  const { x, y, width, height } = frame

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      style={{ overflow: 'visible' }}
    >
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        style={{
          width: '100%',
          minHeight: `${height}px`,
          fontSize: `${fontSize}px`,
          fontFamily,
          fontWeight: fontWeight as any,
          fontStyle: fontStyle as any,
          color,
          textAlign: textAlign as any,
          letterSpacing: `${letterSpacing}px`,
          lineHeight: lineHeight,
          outline: '2px solid #3B82F6',
          outlineOffset: '2px',
          background: 'transparent',
          padding: '4px',
          boxSizing: 'border-box',
          borderRadius: '2px',
          cursor: 'text',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          overflow: 'visible' // Allow content to expand beyond original height
        } as React.CSSProperties}
        // Use dangerouslySetInnerHTML to preserve line breaks
        dangerouslySetInnerHTML={{ __html: initialContent.replace(/\n/g, '<br>') }}
      />
    </foreignObject>
  )
}

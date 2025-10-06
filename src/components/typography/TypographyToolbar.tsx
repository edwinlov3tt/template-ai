/**
 * TypographyToolbar.tsx
 *
 * Quick typography controls toolbar (top bar).
 * Shows font controls for selected text/button slots.
 */

import React from 'react'
import { useEditorStore } from '../../state/editorStore'
import { FontPicker } from './FontPicker'
import { SpacingPopover } from './SpacingPopover'
import { MixedColorSwatch, getMixedState } from '../controls/MixedIndicator'

export const TypographyToolbar: React.FC = () => {
  const { template, selectedSlots, currentPageId, updateSlot } = useEditorStore()

  // Get current page
  const currentPage = template?.pages?.find(p => p.id === currentPageId)
  if (!currentPage) return null

  // Get selected slot objects
  const selectedSlotObjects = currentPage.slots.filter(slot =>
    selectedSlots.includes(slot.name)
  )

  // Only show toolbar for text/button slots
  const textSlots = selectedSlotObjects.filter(
    slot => slot.type === 'text' || slot.type === 'button'
  )

  if (textSlots.length === 0) return null

  // Get mixed states for all properties
  const fontFamily = getMixedState(textSlots.map(s => s.fontFamily || 'Inter'))
  const fontSize = getMixedState(textSlots.map(s => s.fontSize || 16))
  const fontWeight = getMixedState(textSlots.map(s => s.fontWeight || 400))
  const fontStyle = getMixedState(textSlots.map(s => s.fontStyle || 'normal'))
  const textAlign = getMixedState(textSlots.map(s => s.textAlign || 'left'))
  const textTransform = getMixedState(textSlots.map(s => s.textTransform || 'none')) as string | 'Mixed' | undefined
  const color = getMixedState(textSlots.map(s => s.color || '#000000')) as string | 'Mixed' | undefined
  const letterSpacing = getMixedState(textSlots.map(s => s.letterSpacing || 0))
  const lineHeight = getMixedState(textSlots.map(s => s.lineHeight || 1.2))

  // Update handlers (apply to all selected slots)
  const handleUpdate = (property: string, value: any) => {
    textSlots.forEach(slot => {
      updateSlot(slot.name, { [property]: value })
    })
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border-b shadow-sm">
      {/* Font Family */}
      <FontPicker
        value={fontFamily}
        onChange={(family) => handleUpdate('fontFamily', family)}
      />

      {/* Font Size */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={fontSize === 'Mixed' ? '' : fontSize}
          onChange={(e) => handleUpdate('fontSize', parseInt(e.target.value) || 16)}
          placeholder={fontSize === 'Mixed' ? '—' : ''}
          min={6}
          max={500}
          className={`
            w-16 px-2 py-1 border rounded text-sm
            ${fontSize === 'Mixed' ? 'placeholder-gray-500 italic' : ''}
          `}
        />
        <span className="text-xs text-gray-500">px</span>
      </div>

      {/* Color */}
      <MixedColorSwatch
        value={color}
        onChange={(newColor) => handleUpdate('color', newColor)}
      />

      {/* Bold */}
      <button
        type="button"
        onClick={() => handleUpdate('fontWeight', fontWeight === 700 ? 400 : 700)}
        className={`
          px-2 py-1 border rounded font-bold transition-colors
          ${fontWeight === 700 ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white hover:bg-gray-50'}
        `}
        title="Bold"
      >
        B
      </button>

      {/* Italic */}
      <button
        type="button"
        onClick={() => handleUpdate('fontStyle', fontStyle === 'italic' ? 'normal' : 'italic')}
        className={`
          px-2 py-1 border rounded italic transition-colors
          ${fontStyle === 'italic' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white hover:bg-gray-50'}
        `}
        title="Italic"
      >
        I
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300" />

      {/* Text Align */}
      <div className="flex gap-0.5">
        {(['left', 'center', 'right', 'justify'] as const).map(align => (
          <button
            key={align}
            type="button"
            onClick={() => handleUpdate('textAlign', align)}
            className={`
              px-2 py-1 border rounded transition-colors
              ${textAlign === align ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white hover:bg-gray-50'}
            `}
            title={`Align ${align}`}
          >
            {align === 'left' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
              </svg>
            )}
            {align === 'center' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
              </svg>
            )}
            {align === 'right' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
              </svg>
            )}
            {align === 'justify' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300" />

      {/* Text Transform */}
      <button
        type="button"
        onClick={() => {
          const transforms = ['none', 'uppercase', 'title', 'sentence'] as const
          const current = textTransform === 'Mixed' ? 'none' : (textTransform || 'none')
          const currentIndex = transforms.indexOf(current as any)
          const next = transforms[(currentIndex + 1) % transforms.length]
          handleUpdate('textTransform', next)
        }}
        className="px-2 py-1 border rounded hover:bg-gray-50 transition-colors"
        title="Text Transform"
      >
        <span className="text-sm font-medium">
          {textTransform === 'Mixed' ? '—' :
           textTransform === 'none' ? 'Aa' :
           textTransform === 'uppercase' ? 'AA' :
           textTransform === 'title' ? 'Aa' :
           'Aa'}
        </span>
      </button>

      {/* Spacing Popover */}
      <SpacingPopover
        letterSpacing={letterSpacing}
        lineHeight={lineHeight}
        onLetterSpacingChange={(value) => handleUpdate('letterSpacing', value)}
        onLineHeightChange={(value) => handleUpdate('lineHeight', value)}
      />
    </div>
  )
}

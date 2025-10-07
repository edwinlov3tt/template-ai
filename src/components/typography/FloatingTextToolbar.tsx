/**
 * FloatingTextToolbar.tsx
 *
 * Floating toolbar for text slot editing (matches shape toolbar design).
 * Shows font controls when text/button slots are selected.
 */

import React, { useState } from 'react'
import { useEditorStore } from '../../state/editorStore'
import { FontFamilySelect } from './FontFamilySelect'
import { FontSizeInput } from './FontSizeInput'
import { CaseMenu } from './CaseMenu'
import { AutofitBadge } from './AutofitBadge'
import { SpacingPopover } from './SpacingPopover'
import { MixedColorSwatch, getMixedState } from '../controls/MixedIndicator'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify
} from 'lucide-react'

interface FloatingTextToolbarProps {
  onOpenEffects?: () => void
  onOpenPosition?: () => void
}

export const FloatingTextToolbar: React.FC<FloatingTextToolbarProps> = ({
  onOpenEffects,
  onOpenPosition
}) => {
  const { template, selectedSlots, currentPageId, updateSlot } = useEditorStore()
  const [spacingPopoverOpen, setSpacingPopoverOpen] = useState(false)

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
  const textDecoration = getMixedState(textSlots.map(s => s.textDecoration || {}))
  const anchorBox = getMixedState(textSlots.map(s => s.anchorBox || 'auto'))
  const autoFit = getMixedState(textSlots.map(s => s.autoFit || false))
  const opacity = getMixedState(textSlots.map(s => s.opacity ?? 1))

  // Update handlers (apply to all selected slots)
  const handleUpdate = (property: string, value: any) => {
    textSlots.forEach(slot => {
      updateSlot(slot.name, { [property]: value })
    })
  }

  // Text decoration helpers
  const isUnderline = textDecoration !== 'Mixed' && (textDecoration as any)?.underline
  const isStrikethrough = textDecoration !== 'Mixed' && (textDecoration as any)?.strike

  const toggleUnderline = () => {
    const current = textDecoration === 'Mixed' ? {} : (textDecoration || {})
    handleUpdate('textDecoration', {
      ...current,
      underline: !isUnderline
    })
  }

  const toggleStrikethrough = () => {
    const current = textDecoration === 'Mixed' ? {} : (textDecoration || {})
    handleUpdate('textDecoration', {
      ...current,
      strike: !isStrikethrough
    })
  }

  return (
    <div style={{
      position: 'fixed',
      top: '72px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#F3F4F6',
      padding: '0',
      zIndex: 40,
      borderRadius: '10px'
    }}>
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '10px',
        height: '38px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Font Family */}
        <FontFamilySelect
          value={fontFamily}
          onChange={(family) => handleUpdate('fontFamily', family)}
        />

        {/* Divider */}
        <div style={{
          width: '1px',
          height: '24px',
          background: '#E5E7EB'
        }} />

        {/* Font Size */}
        <FontSizeInput
          value={fontSize}
          onChange={(size) => handleUpdate('fontSize', size)}
        />

        {/* Divider */}
        <div style={{
          width: '1px',
          height: '24px',
          background: '#E5E7EB'
        }} />

        {/* Color */}
        <MixedColorSwatch
          value={color}
          onChange={(newColor) => handleUpdate('color', newColor)}
        />

        {/* Divider */}
        <div style={{
          width: '1px',
          height: '24px',
          background: '#E5E7EB'
        }} />

        {/* Bold */}
        <button
          type="button"
          onClick={() => handleUpdate('fontWeight', fontWeight === 700 ? 400 : 700)}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #E5E7EB',
            borderRadius: '4px',
            background: fontWeight === 700 ? '#DBEAFE' : '#FFFFFF',
            borderColor: fontWeight === 700 ? '#3B82F6' : '#E5E7EB',
            color: fontWeight === 700 ? '#1D4ED8' : '#374151',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          title="Bold (⌘B)"
          onMouseEnter={(e) => {
            if (fontWeight !== 700) {
              e.currentTarget.style.background = '#F9FAFB'
            }
          }}
          onMouseLeave={(e) => {
            if (fontWeight !== 700) {
              e.currentTarget.style.background = '#FFFFFF'
            }
          }}
        >
          B
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => handleUpdate('fontStyle', fontStyle === 'italic' ? 'normal' : 'italic')}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #E5E7EB',
            borderRadius: '4px',
            background: fontStyle === 'italic' ? '#DBEAFE' : '#FFFFFF',
            borderColor: fontStyle === 'italic' ? '#3B82F6' : '#E5E7EB',
            color: fontStyle === 'italic' ? '#1D4ED8' : '#374151',
            fontStyle: 'italic',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          title="Italic (⌘I)"
          onMouseEnter={(e) => {
            if (fontStyle !== 'italic') {
              e.currentTarget.style.background = '#F9FAFB'
            }
          }}
          onMouseLeave={(e) => {
            if (fontStyle !== 'italic') {
              e.currentTarget.style.background = '#FFFFFF'
            }
          }}
        >
          I
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={toggleUnderline}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #E5E7EB',
            borderRadius: '4px',
            background: isUnderline ? '#DBEAFE' : '#FFFFFF',
            borderColor: isUnderline ? '#3B82F6' : '#E5E7EB',
            color: isUnderline ? '#1D4ED8' : '#374151',
            textDecoration: 'underline',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          title="Underline (⌘U)"
          onMouseEnter={(e) => {
            if (!isUnderline) {
              e.currentTarget.style.background = '#F9FAFB'
            }
          }}
          onMouseLeave={(e) => {
            if (!isUnderline) {
              e.currentTarget.style.background = '#FFFFFF'
            }
          }}
        >
          U
        </button>

        {/* Strikethrough */}
        <button
          type="button"
          onClick={toggleStrikethrough}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #E5E7EB',
            borderRadius: '4px',
            background: isStrikethrough ? '#DBEAFE' : '#FFFFFF',
            borderColor: isStrikethrough ? '#3B82F6' : '#E5E7EB',
            color: isStrikethrough ? '#1D4ED8' : '#374151',
            textDecoration: 'line-through',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          title="Strikethrough (⌘⇧X)"
          onMouseEnter={(e) => {
            if (!isStrikethrough) {
              e.currentTarget.style.background = '#F9FAFB'
            }
          }}
          onMouseLeave={(e) => {
            if (!isStrikethrough) {
              e.currentTarget.style.background = '#FFFFFF'
            }
          }}
        >
          S
        </button>

        {/* Divider */}
        <div style={{
          width: '1px',
          height: '24px',
          background: '#E5E7EB'
        }} />

        {/* Case Menu */}
        <CaseMenu
          value={textTransform}
          onChange={(transform) => handleUpdate('textTransform', transform)}
        />

        {/* Divider */}
        <div style={{
          width: '1px',
          height: '24px',
          background: '#E5E7EB'
        }} />

        {/* Text Align - Left */}
        <button
          type="button"
          onClick={() => handleUpdate('textAlign', 'left')}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #E5E7EB',
            borderRadius: '4px',
            background: textAlign === 'left' ? '#DBEAFE' : '#FFFFFF',
            borderColor: textAlign === 'left' ? '#3B82F6' : '#E5E7EB',
            color: textAlign === 'left' ? '#1D4ED8' : '#374151',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          title="Align Left (⌘⇧L)"
          onMouseEnter={(e) => {
            if (textAlign !== 'left') {
              e.currentTarget.style.background = '#F9FAFB'
            }
          }}
          onMouseLeave={(e) => {
            if (textAlign !== 'left') {
              e.currentTarget.style.background = '#FFFFFF'
            }
          }}
        >
          <AlignLeft size={16} />
        </button>

        {/* Text Align - Center */}
        <button
          type="button"
          onClick={() => handleUpdate('textAlign', 'center')}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #E5E7EB',
            borderRadius: '4px',
            background: textAlign === 'center' ? '#DBEAFE' : '#FFFFFF',
            borderColor: textAlign === 'center' ? '#3B82F6' : '#E5E7EB',
            color: textAlign === 'center' ? '#1D4ED8' : '#374151',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          title="Align Center (⌘⇧C)"
          onMouseEnter={(e) => {
            if (textAlign !== 'center') {
              e.currentTarget.style.background = '#F9FAFB'
            }
          }}
          onMouseLeave={(e) => {
            if (textAlign !== 'center') {
              e.currentTarget.style.background = '#FFFFFF'
            }
          }}
        >
          <AlignCenter size={16} />
        </button>

        {/* Text Align - Right */}
        <button
          type="button"
          onClick={() => handleUpdate('textAlign', 'right')}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #E5E7EB',
            borderRadius: '4px',
            background: textAlign === 'right' ? '#DBEAFE' : '#FFFFFF',
            borderColor: textAlign === 'right' ? '#3B82F6' : '#E5E7EB',
            color: textAlign === 'right' ? '#1D4ED8' : '#374151',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          title="Align Right (⌘⇧R)"
          onMouseEnter={(e) => {
            if (textAlign !== 'right') {
              e.currentTarget.style.background = '#F9FAFB'
            }
          }}
          onMouseLeave={(e) => {
            if (textAlign !== 'right') {
              e.currentTarget.style.background = '#FFFFFF'
            }
          }}
        >
          <AlignRight size={16} />
        </button>

        {/* Divider */}
        <div style={{
          width: '1px',
          height: '24px',
          background: '#E5E7EB'
        }} />

        {/* Spacing Popover */}
        <SpacingPopover
          letterSpacing={letterSpacing}
          lineHeight={lineHeight}
          onLetterSpacingChange={(value) => handleUpdate('letterSpacing', value)}
          onLineHeightChange={(value) => handleUpdate('lineHeight', value)}
        />

        {/* Divider */}
        <div style={{
          width: '1px',
          height: '24px',
          background: '#E5E7EB'
        }} />

        {/* Effects Button */}
        <button
          type="button"
          onClick={() => {
            if (onOpenEffects) {
              onOpenEffects()
            }
          }}
          style={{
            height: '28px',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: '1px solid #E5E7EB',
            borderRadius: '4px',
            background: '#FFFFFF',
            color: '#374151',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap'
          }}
          title="Open Effects Panel (E)"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F9FAFB'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFFFFF'
          }}
        >
          Effects
        </button>

        {/* Position Button */}
        <button
          type="button"
          onClick={() => {
            if (onOpenPosition) {
              onOpenPosition()
            }
          }}
          style={{
            height: '28px',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: '1px solid #E5E7EB',
            borderRadius: '4px',
            background: '#FFFFFF',
            color: '#374151',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap'
          }}
          title="Open Position Panel (P)"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F9FAFB'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFFFFF'
          }}
        >
          Position
        </button>

        {/* Divider */}
        <div style={{
          width: '1px',
          height: '24px',
          background: '#E5E7EB'
        }} />

        {/* AUTOFIT Badge */}
        <AutofitBadge
          anchorBox={anchorBox}
          autoFit={autoFit}
          onToggle={() => handleUpdate('autoFit', !autoFit)}
        />
      </div>
    </div>
  )
}

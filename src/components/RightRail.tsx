import React, { useState, useMemo } from 'react'
import { Lock, Unlock, Eye, EyeOff, GripVertical, MoreVertical, Edit3, FileText, Copy, Trash2 } from 'lucide-react'
import { Tooltip } from 'antd'
import type { Template, Slot } from '../schema/types'
import { checkTemplateContrast, getContrastBadgeColor, getContrastBadgeLabel, type LayerContrastInfo } from '../accessibility/contrastChecker'
import { ContrastFixModal } from './ContrastFixModal'
import type { AutoFixSuggestion } from '../accessibility/contrastUtils'
import { ColorPicker } from './ColorPicker'
import { getDuplicateShortcut, getLockShortcut, getDeleteShortcut } from '../utils/keyboardShortcuts'

interface RightRailProps {
  template: Template | null
  selectedLayer?: string | null
  onUpdateSlot?: (slotId: string, updates: Partial<Slot>) => void
  onDuplicateSlot?: (slotName: string) => void
  onToggleLockSlot?: (slotName: string) => void
  onRemoveSlot?: (slotName: string) => void
  onSelectSlot?: (slotName: string, pageId: string) => void
}

export function RightRail({ template, selectedLayer, onUpdateSlot, onDuplicateSlot, onToggleLockSlot, onRemoveSlot, onSelectSlot }: RightRailProps) {
  const [activeTab, setActiveTab] = useState<'layers' | 'properties'>('layers')
  const [fixModalOpen, setFixModalOpen] = useState(false)
  const [fixModalData, setFixModalData] = useState<LayerContrastInfo | null>(null)

  const handleApplyFix = (slotId: string, suggestion: AutoFixSuggestion) => {
    if (!onUpdateSlot) return

    const updates: Partial<Slot> = {}

    if (suggestion.preview.textColor) {
      updates.fill = suggestion.preview.textColor
    }

    onUpdateSlot(slotId, updates)
  }

  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* Floating Layers Panel */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: isCollapsed ? '48px' : '300px',
        maxHeight: 'calc(100vh - 128px)',
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 30,
        transition: 'width 0.2s ease'
      }}>
        {/* Header */}
        <div style={{
          padding: '8px 12px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                Layers
              </span>
              <span style={{
                fontSize: '11px',
                color: '#9ca3af',
                background: '#f3f4f6',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                {template?.pages.reduce((total, page) => total + page.slots.length, 0) || 0}
              </span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              fontSize: '10px'
            }}
          >
            {isCollapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* Layers Content */}
        {!isCollapsed && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            <LayersPanel
              template={template}
              onContrastBadgeClick={(info) => {
                setFixModalData(info)
                setFixModalOpen(true)
              }}
              onDuplicateSlot={onDuplicateSlot}
              onToggleLockSlot={onToggleLockSlot}
              onRemoveSlot={onRemoveSlot}
              onSelectSlot={onSelectSlot}
            />
          </div>
        )}
      </div>

      {/* Contrast Fix Modal */}
      {fixModalData && (
        <ContrastFixModal
          isOpen={fixModalOpen}
          onClose={() => setFixModalOpen(false)}
          slotName={fixModalData.slotName}
          currentRatio={fixModalData.contrastResult.ratio}
          suggestions={fixModalData.suggestions}
          onApplyFix={(suggestion) => handleApplyFix(fixModalData.slotId, suggestion)}
        />
      )}
    </>
  )
}

interface TabButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? '#ffffff' : '#f9fafb',
        border: 'none',
        borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
        padding: '12px',
        fontSize: '13px',
        fontWeight: active ? '600' : '500',
        color: active ? '#111827' : '#6b7280',
        cursor: 'pointer',
        transition: 'all 0.15s'
      }}
    >
      {children}
    </button>
  )
}

interface LayersPanelProps {
  template: Template | null
  onContrastBadgeClick?: (info: LayerContrastInfo) => void
  onDuplicateSlot?: (slotName: string) => void
  onToggleLockSlot?: (slotName: string) => void
  onRemoveSlot?: (slotName: string) => void
  onSelectSlot?: (slotName: string, pageId: string) => void
}

function LayersPanel({ template, onContrastBadgeClick, onDuplicateSlot, onToggleLockSlot, onRemoveSlot, onSelectSlot }: LayersPanelProps) {
  if (!template) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: '13px'
      }}>
        No layers yet. Upload an SVG to start.
      </div>
    )
  }

  // Check contrast for all text layers
  const contrastInfo = useMemo(() => {
    const results = checkTemplateContrast(template)
    const map = new Map<string, LayerContrastInfo>()
    results.forEach(info => map.set(info.slotId, info))
    return map
  }, [template])

  const showPageHeaders = template.pages.length > 1

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: showPageHeaders ? '12px' : '4px' }}>
        {template.pages.map((page) => {
          // Sort slots by z-index descending (top layers first)
          const sortedSlots = [...page.slots].sort((a, b) => b.z - a.z)

          return (
            <div key={page.id}>
              {/* Page Header - only show when 2+ pages */}
              {showPageHeaders && (
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px',
                  padding: '4px 8px'
                }}>
                  {page.name}
                </div>
              )}

              {/* Slots for this page */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {sortedSlots.map((slot) => (
                  <LayerItem
                    key={slot.name}
                    slotId={slot.name}
                    slot={slot}
                    pageId={page.id}
                    contrastInfo={contrastInfo.get(slot.name)}
                    onContrastBadgeClick={onContrastBadgeClick}
                    onDuplicateSlot={onDuplicateSlot}
                    onToggleLockSlot={onToggleLockSlot}
                    onRemoveSlot={onRemoveSlot}
                    onSelectSlot={onSelectSlot}
                  />
                ))}

                {/* Empty state for page with no slots */}
                {sortedSlots.length === 0 && (
                  <div style={{
                    padding: '12px',
                    textAlign: 'center',
                    color: '#9ca3af',
                    fontSize: '12px',
                    fontStyle: 'italic'
                  }}>
                    No layers on this page
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface LayerItemProps {
  slotId: string
  slot: Slot
  pageId: string
  contrastInfo?: LayerContrastInfo
  onContrastBadgeClick?: (info: LayerContrastInfo) => void
  onDuplicateSlot?: (slotName: string) => void
  onToggleLockSlot?: (slotName: string) => void
  onRemoveSlot?: (slotName: string) => void
  onSelectSlot?: (slotName: string, pageId: string) => void
}

function LayerItem({ slotId, slot, pageId, contrastInfo, onContrastBadgeClick, onDuplicateSlot, onToggleLockSlot, onRemoveSlot, onSelectSlot }: LayerItemProps) {
  const [visible, setVisible] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const menuButtonRef = React.useRef<HTMLButtonElement>(null)

  const getIcon = () => {
    switch (slot.type) {
      case 'text':
        return 'T'
      case 'image':
        return 'I'
      case 'button':
        return 'B'
      case 'shape':
        return 'S'
      default:
        return 'L'
    }
  }

  return (
    <div
      onClick={() => {
        if (onSelectSlot) {
          onSelectSlot(slot.name, pageId)
        }
      }}
      style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '4px',
        padding: '6px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        position: 'relative'
      }}
    >
      {/* Drag Handle */}
      <div style={{
        color: '#d1d5db',
        display: 'flex',
        alignItems: 'center',
        cursor: 'grab'
      }}>
        <GripVertical size={14} />
      </div>

      {/* Type Icon */}
      <div style={{
        width: '20px',
        height: '20px',
        background: '#ffffff',
        border: '1px solid #d1d5db',
        borderRadius: '3px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: '700',
        color: '#6b7280'
      }}>
        {getIcon()}
      </div>

      {/* Layer Name */}
      <div style={{
        flex: 1,
        fontSize: '13px',
        color: '#374151',
        fontWeight: '500',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {slot.name}
      </div>

      {/* Contrast Badge (only for text layers) */}
      {contrastInfo && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            if (contrastInfo.hasIssue && onContrastBadgeClick) {
              onContrastBadgeClick(contrastInfo)
            }
          }}
          style={{
            background: getContrastBadgeColor(contrastInfo.contrastResult.level),
            color: '#ffffff',
            fontSize: '9px',
            fontWeight: '700',
            padding: '2px 6px',
            borderRadius: '3px',
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
            cursor: contrastInfo.hasIssue ? 'pointer' : 'default'
          }}
          title={`Contrast ratio: ${contrastInfo.contrastResult.ratio.toFixed(2)}:1${contrastInfo.hasIssue ? ' - Click to fix' : ''}`}
        >
          {getContrastBadgeLabel(contrastInfo.contrastResult.level)}
        </div>
      )}

      {/* Lock Button */}
      <Tooltip title={`${slot.locked ? 'Unlock' : 'Lock'} (${getLockShortcut()})`}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (onToggleLockSlot) {
              onToggleLockSlot(slot.name)
            }
          }}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: slot.locked ? '#374151' : '#d1d5db',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {slot.locked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>
      </Tooltip>

      {/* Visibility Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setVisible(!visible)
        }}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: visible ? '#374151' : '#d1d5db',
          display: 'flex',
          alignItems: 'center'
        }}
        title={visible ? 'Hide' : 'Show'}
      >
        {visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>

      {/* Menu Button */}
      <button
        ref={menuButtonRef}
        onClick={(e) => {
          e.stopPropagation()
          if (menuButtonRef.current) {
            const rect = menuButtonRef.current.getBoundingClientRect()
            setMenuPosition({
              top: rect.bottom + 4,
              right: window.innerWidth - rect.right
            })
          }
          setMenuOpen(!menuOpen)
        }}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center'
        }}
        title="More options"
      >
        <MoreVertical size={14} />
      </button>

      {/* Context Menu */}
      {menuOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99
            }}
            onClick={() => setMenuOpen(false)}
          />
          <div style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
            background: '#ffffff',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            padding: '4px',
            zIndex: 100,
            minWidth: '160px'
          }}>
            <ContextMenuItem
              icon={<Edit3 size={14} />}
              label="Rename layer"
              onClick={() => {
                setMenuOpen(false)
                console.log('Rename')
              }}
            />
            <ContextMenuItem
              icon={<FileText size={14} />}
              label="Edit description"
              onClick={() => {
                setMenuOpen(false)
                console.log('Edit description')
              }}
            />
            <ContextMenuItem
              icon={<Copy size={14} />}
              label={`Duplicate (${getDuplicateShortcut()})`}
              onClick={() => {
                setMenuOpen(false)
                if (onDuplicateSlot) {
                  onDuplicateSlot(slot.name)
                }
              }}
            />
            <div style={{ height: '1px', background: '#e5e7eb', margin: '4px 0' }} />
            <ContextMenuItem
              icon={<Trash2 size={14} />}
              label={`Delete (${getDeleteShortcut()})`}
              onClick={() => {
                setMenuOpen(false)
                if (onRemoveSlot) {
                  onRemoveSlot(slot.name)
                }
              }}
              danger
            />
          </div>
        </>
      )}
    </div>
  )
}

interface ContextMenuItemProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}

function ContextMenuItem({ icon, label, onClick, danger }: ContextMenuItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: 'transparent',
        border: 'none',
        borderRadius: '4px',
        fontSize: '13px',
        color: danger ? '#ef4444' : '#374151',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? '#fef2f2' : '#f3f4f6'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

interface PropertiesPanelProps {
  selectedLayer?: string | null
}

function PropertiesPanel({ selectedLayer }: PropertiesPanelProps) {
  if (!selectedLayer) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: '13px'
      }}>
        Select a layer to edit properties
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      <PropertySection title="Slot Meta">
        <PropertyField label="Name">
          <input
            type="text"
            defaultValue={selectedLayer}
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              padding: '6px 8px',
              fontSize: '13px'
            }}
          />
        </PropertyField>
        <PropertyField label="Type">
          <select style={{
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '13px'
          }}>
            <option>text</option>
            <option>image</option>
            <option>button</option>
            <option>shape</option>
          </select>
        </PropertyField>
      </PropertySection>

      <PropertySection title="Text">
        <PropertyField label="Font Family">
          <select style={{
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '13px'
          }}>
            <option>Inter</option>
            <option>Helvetica</option>
            <option>Arial</option>
          </select>
        </PropertyField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <PropertyField label="Weight">
            <select style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              padding: '6px 8px',
              fontSize: '13px'
            }}>
              <option>400</option>
              <option>500</option>
              <option>600</option>
              <option>700</option>
            </select>
          </PropertyField>
          <PropertyField label="Size">
            <input
              type="number"
              defaultValue={16}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                padding: '6px 8px',
                fontSize: '13px'
              }}
            />
          </PropertyField>
        </div>
        <ColorPicker
          label="Fill Color"
          color="#000000"
          onChange={(color) => console.log('Color changed:', color)}
        />
      </PropertySection>
    </div>
  )
}

function PropertySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h4 style={{
        fontSize: '11px',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '12px'
      }}>
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {children}
      </div>
    </div>
  )
}

function PropertyField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '4px'
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

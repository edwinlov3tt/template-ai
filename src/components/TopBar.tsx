import React, { useState } from 'react'
import { Button, Tooltip, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import {
  UndoOutlined,
  RedoOutlined,
  BorderOutlined,
  SaveOutlined,
  SettingOutlined,
  DownOutlined
} from '@ant-design/icons'
import { SaveTemplateDialog } from './admin/SaveTemplateDialog'
import { useEditorStore } from '../state/editorStore'

interface TopBarProps {
  onFileClick?: () => void
  onResizeClick?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onValidate?: () => void
  onPreview?: () => void
  onExport?: () => void
  onSave?: () => void
  onSettingsClick?: () => void
  canUndo?: boolean
  canRedo?: boolean
  canvasSize?: { w: number; h: number }
  templateName?: string
  onTemplateNameChange?: (name: string) => void
  hasTemplate?: boolean
}

export function TopBar({
  onFileClick,
  onResizeClick,
  onUndo,
  onRedo,
  onValidate,
  onPreview,
  onExport,
  onSave,
  onSettingsClick,
  canUndo = false,
  canRedo = false,
  canvasSize,
  templateName = 'Untitled Template',
  onTemplateNameChange,
  hasTemplate = true
}: TopBarProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState(templateName)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const template = useEditorStore(state => state.template)

  const isAdminMode = import.meta.env.VITE_ADMIN_MODE === 'true'

  const handleBlur = () => {
    setIsEditing(false)
    const trimmedValue = editValue.trim()
    if (trimmedValue && onTemplateNameChange) {
      onTemplateNameChange(trimmedValue)
    } else {
      setEditValue(templateName)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      ;(e.target as HTMLElement).blur()
    } else if (e.key === 'Escape') {
      setEditValue(templateName)
      setIsEditing(false)
    }
  }

  React.useEffect(() => {
    setEditValue(templateName)
  }, [templateName])

  const saveMenuItems: MenuProps['items'] = [
    {
      key: 'save',
      label: 'Save',
      icon: <SaveOutlined />,
      onClick: onSave
    },
    {
      key: 'save-template',
      label: 'Save as Template',
      onClick: () => setSaveDialogOpen(true)
    }
  ]

  return (
    <div style={{
      height: '48px',
      background: '#1f1f1f',
      borderBottom: '1px solid #2a2a2a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      gap: '12px'
    }}>
      {/* Left section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Button
          onClick={onFileClick}
          disabled={!hasTemplate}
          style={{
            background: '#2a2a2a',
            border: '1px solid #3a3a3a',
            color: hasTemplate ? '#e5e7eb' : '#6b7280'
          }}
        >
          File
        </Button>
        <Button
          onClick={onResizeClick}
          disabled={!hasTemplate}
          style={{
            background: '#2a2a2a',
            border: '1px solid #3a3a3a',
            color: hasTemplate ? '#e5e7eb' : '#6b7280'
          }}
        >
          Resize
        </Button>

        <Divider />

        <Tooltip title="Undo (Cmd+Z)">
          <Button
            icon={<UndoOutlined />}
            onClick={onUndo}
            disabled={!canUndo || !hasTemplate}
            style={{
              background: '#2a2a2a',
              border: '1px solid #3a3a3a',
              color: (canUndo && hasTemplate) ? '#e5e7eb' : '#6b7280'
            }}
          />
        </Tooltip>

        <Tooltip title="Redo (Cmd+Shift+Z)">
          <Button
            icon={<RedoOutlined />}
            onClick={onRedo}
            disabled={!canRedo || !hasTemplate}
            style={{
              background: '#2a2a2a',
              border: '1px solid #3a3a3a',
              color: (canRedo && hasTemplate) ? '#e5e7eb' : '#6b7280'
            }}
          />
        </Tooltip>

        <Divider />

        <Tooltip title="Settings">
          <Button
            icon={<SettingOutlined />}
            onClick={onSettingsClick}
            disabled={!hasTemplate}
            style={{
              background: '#2a2a2a',
              border: '1px solid #3a3a3a',
              color: hasTemplate ? '#e5e7eb' : '#6b7280'
            }}
          />
        </Tooltip>

        <Divider />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 12px'
        }}>
          {hasTemplate ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onFocus={() => setIsEditing(true)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              style={{
                fontSize: '13px',
                color: '#e5e7eb',
                fontWeight: '500',
                background: isEditing ? '#2a2a2a' : 'transparent',
                border: isEditing ? '1px solid #3a3a3a' : '1px solid transparent',
                borderRadius: '4px',
                padding: '4px 8px',
                outline: 'none',
                transition: 'all 0.15s',
                cursor: isEditing ? 'text' : 'pointer',
                width: `${Math.max(editValue.length * 8, 100)}px`
              }}
            />
          ) : (
            <span style={{
              fontSize: '13px',
              color: '#9ca3af',
              fontWeight: '500'
            }}>
              Template Editor
            </span>
          )}
          {canvasSize && hasTemplate && (
            <span style={{
              fontSize: '12px',
              color: '#9ca3af',
              fontWeight: '400'
            }}>
              {canvasSize.w} × {canvasSize.h} px
            </span>
          )}
        </div>
      </div>

      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Button
          onClick={onPreview}
          disabled={!hasTemplate}
          style={{
            background: '#2a2a2a',
            border: '1px solid #3a3a3a',
            color: hasTemplate ? '#e5e7eb' : '#6b7280'
          }}
        >
          Preview
        </Button>
        <Button
          onClick={onValidate}
          disabled={!hasTemplate}
          style={{
            background: '#2a2a2a',
            border: '1px solid #3a3a3a',
            color: hasTemplate ? '#e5e7eb' : '#6b7280'
          }}
        >
          Validate
        </Button>

        <Divider />

        <Button
          onClick={onExport}
          disabled={!hasTemplate}
          style={{
            background: '#2a2a2a',
            border: '1px solid #3a3a3a',
            color: hasTemplate ? '#e5e7eb' : '#6b7280'
          }}
        >
          Export
        </Button>

        {/* Save button with dropdown in admin mode */}
        {isAdminMode && hasTemplate ? (
          <Dropdown menu={{ items: saveMenuItems }} trigger={['click']}>
            <Button
              type="primary"
              disabled={!hasTemplate}
              style={{
                background: !hasTemplate ? '#6b7db8' : undefined,
                borderColor: !hasTemplate ? '#6b7db8' : undefined,
                color: !hasTemplate ? '#ffffff' : undefined
              }}
            >
              <SaveOutlined />
              Save
              <DownOutlined style={{ fontSize: '10px', marginLeft: '4px' }} />
            </Button>
          </Dropdown>
        ) : (
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={onSave}
            disabled={!hasTemplate}
            style={{
              background: !hasTemplate ? '#6b7db8' : undefined,
              borderColor: !hasTemplate ? '#6b7db8' : undefined,
              color: !hasTemplate ? '#ffffff' : undefined
            }}
          >
            Save
          </Button>
        )}
      </div>

      {/* Save Template Dialog */}
      {isAdminMode && template && (
        <SaveTemplateDialog
          isOpen={saveDialogOpen}
          onClose={() => setSaveDialogOpen(false)}
          template={template}
        />
      )}
    </div>
  )
}

function Divider() {
  return <div style={{ width: '1px', height: '24px', background: '#3a3a3a' }} />
}

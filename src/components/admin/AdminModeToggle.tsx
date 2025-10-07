import React, { useState } from 'react'
import { SaveOutlined, ExportOutlined, SettingOutlined } from '@ant-design/icons'
import { useEditorStore } from '../../state/editorStore'
import { SaveTemplateDialog } from './SaveTemplateDialog'

/**
 * Admin Mode Badge & Actions
 * Shows when VITE_ADMIN_MODE=true
 * Provides "Save as Template" and other admin features
 */
export function AdminModeToggle() {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const template = useEditorStore(state => state.template)

  // Don't render if no template loaded
  if (!template) {
    return null
  }

  return (
    <>
      {/* Admin Mode Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 12px',
        background: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#92400e'
      }}>
        <SettingOutlined style={{ fontSize: '12px' }} />
        <span>Admin Mode</span>
      </div>

      {/* Admin Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setSaveDialogOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: '#3b82f6',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2563eb'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#3b82f6'
          }}
        >
          <SaveOutlined />
          Save as Template
        </button>
      </div>

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        isOpen={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        template={template}
      />
    </>
  )
}

import React, { useState } from 'react'
import { Modal, Input, Select, Button, message, Checkbox } from 'antd'
import { TagsOutlined } from '@ant-design/icons'
import type { Template } from '../../schema/types'
import { TemplateService } from '../../services/templateService'
import { toPng } from 'html-to-image'

const { TextArea } = Input

const CATEGORIES = [
  { value: 'full-template', label: 'Full Template' },
  { value: 'layout', label: 'Layout' },
  { value: 'text-block', label: 'Text Block' },
  { value: 'cta-button', label: 'CTA Button' },
  { value: 'shape', label: 'Shape' },
  { value: 'icon', label: 'Icon' }
]

interface SaveTemplateDialogProps {
  isOpen: boolean
  onClose: () => void
  template: Template
}

export function SaveTemplateDialog({ isOpen, onClose, template }: SaveTemplateDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('full-template')
  const [tags, setTags] = useState<string>('')
  const [publishNow, setPublishNow] = useState(true)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) {
      message.error('Please enter a title')
      return
    }

    setSaving(true)

    try {
      let previewUrl: string | undefined

      // Generate preview image from canvas
      const canvasElement = document.querySelector('.canvas-stage-wrapper svg')
      if (canvasElement) {
        try {
          message.loading('Generating preview image...')

          const dataUrl = await toPng(canvasElement as HTMLElement, {
            quality: 0.95,
            pixelRatio: 2,
            backgroundColor: '#ffffff'
          })

          // Upload preview to backend
          const uploadRes = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`,
              base64Data: dataUrl
            })
          })

          if (uploadRes.ok) {
            const { url } = await uploadRes.json()
            previewUrl = url
          }
        } catch (previewError) {
          console.error('Failed to generate preview:', previewError)
          // Continue without preview
        }
      }

      // Save template
      const savedTemplate = await TemplateService.saveTemplate(template, {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category as any,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        previewUrl
      })

      // Publish if checkbox is checked
      if (publishNow) {
        await TemplateService.publishTemplate(savedTemplate.id)
        message.success(`Template "${savedTemplate.title}" saved and published!`)
      } else {
        message.success(`Template "${savedTemplate.title}" saved as draft!`)
      }

      // Reset form
      setTitle('')
      setDescription('')
      setCategory('full-template')
      setTags('')
      setPublishNow(true)

      onClose()
    } catch (error) {
      console.error('Failed to save template:', error)
      message.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  function handleExportJSON() {
    const savedTemplate = {
      id: crypto.randomUUID(),
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title,
      description,
      category,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      templateJson: template,
      createdAt: new Date().toISOString(),
      published: false,
      featured: false
    }

    const blob = new Blob([JSON.stringify(savedTemplate, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${savedTemplate.slug}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    message.success('Template exported to JSON file')
  }

  return (
    <Modal
      title="Save as Template"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="export" onClick={handleExportJSON} style={{ float: 'left' }}>
          Export JSON
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" loading={saving} onClick={handleSave}>
          Save Template
        </Button>
      ]}
      width={600}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
        {/* Title */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px'
          }}>
            Title *
          </label>
          <Input
            placeholder="e.g., Social Media Header"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            size="large"
          />
        </div>

        {/* Category */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px'
          }}>
            Category *
          </label>
          <Select
            value={category}
            onChange={setCategory}
            options={CATEGORIES}
            size="large"
            style={{ width: '100%' }}
          />
        </div>

        {/* Description */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px'
          }}>
            Description
          </label>
          <TextArea
            placeholder="Brief description of this template..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Tags */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px'
          }}>
            Tags (comma-separated)
          </label>
          <Input
            prefix={<TagsOutlined />}
            placeholder="e.g., instagram, social, header"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            size="large"
          />
          <p style={{
            fontSize: '12px',
            color: '#6b7280',
            margin: '4px 0 0 0'
          }}>
            Separate tags with commas
          </p>
        </div>

        {/* Publish Now */}
        <div>
          <Checkbox
            checked={publishNow}
            onChange={(e) => setPublishNow(e.target.checked)}
            style={{ fontSize: '14px' }}
          >
            <span style={{ color: '#374151', fontWeight: '500' }}>
              Publish immediately (make visible in gallery)
            </span>
          </Checkbox>
          <p style={{
            fontSize: '12px',
            color: '#6b7280',
            margin: '4px 0 0 24px'
          }}>
            Uncheck to save as draft
          </p>
        </div>

        {/* Info Box */}
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '6px',
          padding: '12px',
          fontSize: '13px',
          color: '#1e40af'
        }}>
          <strong>💡 Tip:</strong> Preview images are automatically generated from your canvas. Templates can be exported as JSON for backup.
        </div>
      </div>
    </Modal>
  )
}

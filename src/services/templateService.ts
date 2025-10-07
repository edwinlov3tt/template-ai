import type { Template } from '../schema/types'

/**
 * Template metadata for gallery display
 */
export interface TemplateMetadata {
  id: string
  slug: string
  title: string
  description?: string
  category: 'text-block' | 'cta-button' | 'shape' | 'icon' | 'layout' | 'full-template'
  tags: string[]
  previewUrl?: string
  thumbnailUrl?: string
  createdAt: string
  published: boolean
  featured: boolean
}

/**
 * Saved template with full JSON
 */
export interface SavedTemplate extends TemplateMetadata {
  templateJson: Template
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * Template Service
 * Connected to PostgreSQL backend API
 */
export class TemplateService {
  /**
   * Get all published templates
   */
  static async getTemplates(category?: string): Promise<TemplateMetadata[]> {
    try {
      const url = category
        ? `${API_URL}/templates?category=${category}&published=true`
        : `${API_URL}/templates?published=true`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch templates')

      const data = await res.json()

      return data.templates.map((t: any) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        description: t.description,
        category: t.category,
        tags: t.tags,
        previewUrl: t.preview_url,
        thumbnailUrl: t.thumbnail_url,
        createdAt: t.created_at,
        published: t.published,
        featured: t.featured
      }))
    } catch (error) {
      console.error('Failed to fetch templates:', error)
      return []
    }
  }

  /**
   * Get template by slug
   */
  static async getTemplateBySlug(slug: string): Promise<SavedTemplate | null> {
    try {
      const res = await fetch(`${API_URL}/templates/${slug}`)
      if (!res.ok) return null

      const t = await res.json()

      return {
        id: t.id,
        slug: t.slug,
        title: t.title,
        description: t.description,
        category: t.category,
        tags: t.tags,
        previewUrl: t.preview_url,
        thumbnailUrl: t.thumbnail_url,
        createdAt: t.created_at,
        published: t.published,
        featured: t.featured,
        templateJson: t.template_json
      }
    } catch (error) {
      console.error('Failed to fetch template:', error)
      return null
    }
  }

  /**
   * Save new template
   */
  static async saveTemplate(
    template: Template,
    metadata: {
      title: string
      description?: string
      category: TemplateMetadata['category']
      tags?: string[]
      previewUrl?: string
    }
  ): Promise<SavedTemplate> {
    try {
      const res = await fetch(`${API_URL}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, metadata })
      })

      if (!res.ok) throw new Error('Failed to save template')

      const t = await res.json()

      return {
        id: t.id,
        slug: t.slug,
        title: t.title,
        description: t.description,
        category: t.category,
        tags: t.tags,
        previewUrl: t.preview_url,
        thumbnailUrl: t.thumbnail_url,
        createdAt: t.created_at,
        published: t.published,
        featured: t.featured,
        templateJson: t.template_json
      }
    } catch (error) {
      console.error('Failed to save template:', error)
      throw error
    }
  }

  /**
   * Update existing template
   */
  static async updateTemplate(id: string, updates: Partial<SavedTemplate>): Promise<SavedTemplate> {
    try {
      const res = await fetch(`${API_URL}/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!res.ok) throw new Error('Failed to update template')

      const t = await res.json()

      return {
        id: t.id,
        slug: t.slug,
        title: t.title,
        description: t.description,
        category: t.category,
        tags: t.tags,
        previewUrl: t.preview_url,
        thumbnailUrl: t.thumbnail_url,
        createdAt: t.created_at,
        published: t.published,
        featured: t.featured,
        templateJson: t.template_json
      }
    } catch (error) {
      console.error('Failed to update template:', error)
      throw error
    }
  }

  /**
   * Publish template (makes it visible in gallery)
   */
  static async publishTemplate(id: string): Promise<SavedTemplate> {
    try {
      const res = await fetch(`${API_URL}/templates/${id}/publish`, {
        method: 'PATCH'
      })

      if (!res.ok) throw new Error('Failed to publish template')

      const t = await res.json()

      return {
        id: t.id,
        slug: t.slug,
        title: t.title,
        description: t.description,
        category: t.category,
        tags: t.tags,
        previewUrl: t.preview_url,
        thumbnailUrl: t.thumbnail_url,
        createdAt: t.created_at,
        published: t.published,
        featured: t.featured,
        templateJson: t.template_json
      }
    } catch (error) {
      console.error('Failed to publish template:', error)
      throw error
    }
  }

  /**
   * Delete template
   */
  static async deleteTemplate(id: string): Promise<void> {
    try {
      const res = await fetch(`${API_URL}/templates/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete template')
    } catch (error) {
      console.error('Failed to delete template:', error)
      throw error
    }
  }

  /**
   * Export template as JSON file
   */
  static exportTemplateToFile(template: SavedTemplate): void {
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.slug}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Import template from JSON file
   */
  static async importTemplateFromFile(file: File): Promise<SavedTemplate> {
    try {
      const text = await file.text()
      const templateData = JSON.parse(text) as SavedTemplate

      // Save imported template to database via API
      const res = await fetch(`${API_URL}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: templateData.templateJson,
          metadata: {
            title: templateData.title,
            description: templateData.description,
            category: templateData.category,
            tags: templateData.tags
          }
        })
      })

      if (!res.ok) throw new Error('Failed to import template')

      const t = await res.json()

      return {
        id: t.id,
        slug: t.slug,
        title: t.title,
        description: t.description,
        category: t.category,
        tags: t.tags,
        previewUrl: t.preview_url,
        thumbnailUrl: t.thumbnail_url,
        createdAt: t.created_at,
        published: t.published,
        featured: t.featured,
        templateJson: t.template_json
      }
    } catch (error) {
      console.error('Failed to import template:', error)
      throw error
    }
  }
}

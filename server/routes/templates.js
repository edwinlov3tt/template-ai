/**
 * Templates API Routes
 */

import express from 'express'
import { templateQueries } from '../db.js'

const router = express.Router()

/**
 * GET /api/templates
 * List all templates with optional filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const { category, published, featured, limit, offset } = req.query

    const filters = {}
    if (category) filters.category = category
    if (published !== undefined) filters.published = published === 'true'
    if (featured !== undefined) filters.featured = featured === 'true'
    if (limit) filters.limit = parseInt(limit)
    if (offset) filters.offset = parseInt(offset)

    const templates = await templateQueries.getAll(filters)

    res.json({
      templates,
      count: templates.length
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/templates/:slug
 * Get single template by slug
 */
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params
    const template = await templateQueries.getBySlug(slug)

    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    res.json(template)
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/templates
 * Create new template (admin only)
 */
router.post('/', async (req, res, next) => {
  try {
    const { template, metadata } = req.body

    if (!template || !metadata || !metadata.title) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Generate slug from title
    const slug = metadata.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50)

    const savedTemplate = await templateQueries.create({
      slug,
      title: metadata.title,
      description: metadata.description,
      category: metadata.category,
      tags: metadata.tags || [],
      templateJson: template,
      previewUrl: metadata.previewUrl,
      published: false,
      featured: false
    })

    res.status(201).json(savedTemplate)
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Template with this slug already exists' })
    }
    next(error)
  }
})

/**
 * PUT /api/templates/:id
 * Update template (admin only)
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const updates = req.body

    const template = await templateQueries.update(id, updates)

    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    res.json(template)
  } catch (error) {
    next(error)
  }
})

/**
 * PATCH /api/templates/:id/publish
 * Publish template (admin only)
 */
router.patch('/:id/publish', async (req, res, next) => {
  try {
    const { id } = req.params

    const template = await templateQueries.update(id, { published: true })

    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    res.json(template)
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/templates/:id
 * Delete template (admin only)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const deleted = await templateQueries.delete(id)

    if (!deleted) {
      return res.status(404).json({ error: 'Template not found' })
    }

    res.json({ message: 'Template deleted successfully' })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/templates/search/:query
 * Search templates
 */
router.get('/search/:query', async (req, res, next) => {
  try {
    const { query } = req.params
    const { category, published, limit } = req.query

    const filters = {}
    if (category) filters.category = category
    if (published !== undefined) filters.published = published === 'true'
    if (limit) filters.limit = parseInt(limit)

    const results = await templateQueries.search(query, filters)

    res.json({
      results,
      count: results.length
    })
  } catch (error) {
    next(error)
  }
})

export default router

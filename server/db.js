/**
 * Database connection and queries for backend
 */

import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

// Create connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
  console.error('Database pool error:', err)
})

export const db = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  end: () => pool.end()
}

// Template queries
export const templateQueries = {
  async getAll(filters = {}) {
    let query = 'SELECT * FROM templates WHERE 1=1'
    const params = []
    let paramIndex = 1

    if (filters.category) {
      query += ` AND category = $${paramIndex++}`
      params.push(filters.category)
    }

    if (filters.published !== undefined) {
      query += ` AND published = $${paramIndex++}`
      params.push(filters.published)
    }

    if (filters.featured !== undefined) {
      query += ` AND featured = $${paramIndex++}`
      params.push(filters.featured)
    }

    query += ' ORDER BY created_at DESC'

    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`
      params.push(filters.limit)
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex++}`
      params.push(filters.offset)
    }

    const result = await db.query(query, params)
    return result.rows
  },

  async getBySlug(slug) {
    const result = await db.query(
      'SELECT * FROM templates WHERE slug = $1',
      [slug]
    )
    return result.rows[0] || null
  },

  async getById(id) {
    const result = await db.query(
      'SELECT * FROM templates WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  },

  async create(data) {
    const result = await db.query(
      `INSERT INTO templates
       (slug, title, description, category, tags, template_json, preview_url, thumbnail_url, published, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.slug,
        data.title,
        data.description || null,
        data.category,
        data.tags || [],
        data.templateJson,
        data.previewUrl || null,
        data.thumbnailUrl || null,
        data.published || false,
        data.featured || false
      ]
    )
    return result.rows[0]
  },

  async update(id, data) {
    const fields = []
    const params = []
    let paramIndex = 1

    if (data.title !== undefined) {
      fields.push(`title = $${paramIndex++}`)
      params.push(data.title)
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`)
      params.push(data.description)
    }
    if (data.category !== undefined) {
      fields.push(`category = $${paramIndex++}`)
      params.push(data.category)
    }
    if (data.tags !== undefined) {
      fields.push(`tags = $${paramIndex++}`)
      params.push(data.tags)
    }
    if (data.templateJson !== undefined) {
      fields.push(`template_json = $${paramIndex++}`)
      params.push(data.templateJson)
    }
    if (data.previewUrl !== undefined) {
      fields.push(`preview_url = $${paramIndex++}`)
      params.push(data.previewUrl)
    }
    if (data.thumbnailUrl !== undefined) {
      fields.push(`thumbnail_url = $${paramIndex++}`)
      params.push(data.thumbnailUrl)
    }
    if (data.published !== undefined) {
      fields.push(`published = $${paramIndex++}`)
      params.push(data.published)
    }
    if (data.featured !== undefined) {
      fields.push(`featured = $${paramIndex++}`)
      params.push(data.featured)
    }

    if (fields.length === 0) {
      throw new Error('No fields to update')
    }

    params.push(id)
    const result = await db.query(
      `UPDATE templates SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    )
    return result.rows[0]
  },

  async delete(id) {
    const result = await db.query(
      'DELETE FROM templates WHERE id = $1 RETURNING *',
      [id]
    )
    return result.rows[0]
  },

  async search(query, filters = {}) {
    let sql = `
      SELECT * FROM templates
      WHERE (
        title ILIKE $1
        OR description ILIKE $1
        OR $2 = ANY(tags)
      )
    `
    const params = [`%${query}%`, query]
    let paramIndex = 3

    if (filters.category) {
      sql += ` AND category = $${paramIndex++}`
      params.push(filters.category)
    }

    if (filters.published !== undefined) {
      sql += ` AND published = $${paramIndex++}`
      params.push(filters.published)
    }

    sql += ' ORDER BY created_at DESC'

    if (filters.limit) {
      sql += ` LIMIT $${paramIndex++}`
      params.push(filters.limit)
    }

    const result = await db.query(sql, params)
    return result.rows
  }
}

// Design queries
export const designQueries = {
  async create(shareCode, templateJson, expiresAt = null) {
    const result = await db.query(
      `INSERT INTO designs (share_code, template_json, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [shareCode, templateJson, expiresAt]
    )
    return result.rows[0]
  },

  async getByShareCode(shareCode) {
    const result = await db.query(
      `SELECT * FROM designs
       WHERE share_code = $1
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [shareCode]
    )
    return result.rows[0] || null
  },

  async deleteExpired() {
    const result = await db.query(
      'DELETE FROM designs WHERE expires_at < NOW() RETURNING *'
    )
    return result.rows
  }
}

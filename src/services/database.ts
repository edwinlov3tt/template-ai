/**
 * Database Service
 * PostgreSQL connection and query utilities
 */

import pg from 'pg'

const { Pool } = pg

// Create connection pool
const pool = new Pool({
  host: import.meta.env.POSTGRES_HOST || '34.174.127.137',
  port: parseInt(import.meta.env.POSTGRES_PORT || '5432'),
  database: import.meta.env.POSTGRES_DATABASE || 'dblzgplerkapao',
  user: import.meta.env.POSTGRES_USER || 'udt2m8zip6bij',
  password: import.meta.env.POSTGRES_PASSWORD || '9uwxe9juzdvo',
  ssl: false,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err)
})

export const db = {
  /**
   * Execute a query
   */
  async query(text: string, params?: any[]) {
    const start = Date.now()
    const result = await pool.query(text, params)
    const duration = Date.now() - start

    if (import.meta.env.DEV) {
      console.log('[DB Query]', { text, duration, rows: result.rowCount })
    }

    return result
  },

  /**
   * Get a client from the pool for transactions
   */
  async getClient() {
    return pool.connect()
  },

  /**
   * Close the pool (for cleanup)
   */
  async end() {
    await pool.end()
  }
}

// Template queries
export const templateQueries = {
  /**
   * Get all templates with optional filtering
   */
  async getAll(filters?: {
    category?: string
    published?: boolean
    featured?: boolean
    limit?: number
    offset?: number
  }) {
    let query = 'SELECT * FROM templates WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (filters?.category) {
      query += ` AND category = $${paramIndex++}`
      params.push(filters.category)
    }

    if (filters?.published !== undefined) {
      query += ` AND published = $${paramIndex++}`
      params.push(filters.published)
    }

    if (filters?.featured !== undefined) {
      query += ` AND featured = $${paramIndex++}`
      params.push(filters.featured)
    }

    query += ' ORDER BY created_at DESC'

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex++}`
      params.push(filters.limit)
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramIndex++}`
      params.push(filters.offset)
    }

    const result = await db.query(query, params)
    return result.rows
  },

  /**
   * Get template by slug
   */
  async getBySlug(slug: string) {
    const result = await db.query(
      'SELECT * FROM templates WHERE slug = $1',
      [slug]
    )
    return result.rows[0] || null
  },

  /**
   * Get template by ID
   */
  async getById(id: string) {
    const result = await db.query(
      'SELECT * FROM templates WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  },

  /**
   * Create new template
   */
  async create(data: {
    slug: string
    title: string
    description?: string
    category: string
    tags?: string[]
    templateJson: any
    previewUrl?: string
    thumbnailUrl?: string
    published?: boolean
    featured?: boolean
  }) {
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

  /**
   * Update template
   */
  async update(id: string, data: {
    title?: string
    description?: string
    category?: string
    tags?: string[]
    templateJson?: any
    previewUrl?: string
    thumbnailUrl?: string
    published?: boolean
    featured?: boolean
  }) {
    const fields: string[] = []
    const params: any[] = []
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

  /**
   * Delete template
   */
  async delete(id: string) {
    const result = await db.query(
      'DELETE FROM templates WHERE id = $1 RETURNING *',
      [id]
    )
    return result.rows[0]
  },

  /**
   * Search templates by text
   */
  async search(query: string, filters?: {
    category?: string
    published?: boolean
    limit?: number
  }) {
    let sql = `
      SELECT * FROM templates
      WHERE (
        title ILIKE $1
        OR description ILIKE $1
        OR $2 = ANY(tags)
      )
    `
    const params: any[] = [`%${query}%`, query]
    let paramIndex = 3

    if (filters?.category) {
      sql += ` AND category = $${paramIndex++}`
      params.push(filters.category)
    }

    if (filters?.published !== undefined) {
      sql += ` AND published = $${paramIndex++}`
      params.push(filters.published)
    }

    sql += ' ORDER BY created_at DESC'

    if (filters?.limit) {
      sql += ` LIMIT $${paramIndex++}`
      params.push(filters.limit)
    }

    const result = await db.query(sql, params)
    return result.rows
  }
}

// Design queries (for shareable URLs)
export const designQueries = {
  /**
   * Create shareable design
   */
  async create(shareCode: string, templateJson: any, expiresAt?: Date) {
    const result = await db.query(
      `INSERT INTO designs (share_code, template_json, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [shareCode, templateJson, expiresAt || null]
    )
    return result.rows[0]
  },

  /**
   * Get design by share code
   */
  async getByShareCode(shareCode: string) {
    const result = await db.query(
      `SELECT * FROM designs
       WHERE share_code = $1
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [shareCode]
    )
    return result.rows[0] || null
  },

  /**
   * Delete expired designs
   */
  async deleteExpired() {
    const result = await db.query(
      'DELETE FROM designs WHERE expires_at < NOW() RETURNING *'
    )
    return result.rows
  }
}

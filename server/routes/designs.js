/**
 * Designs API Routes (Shareable URLs)
 */

import express from 'express'
import { designQueries } from '../db.js'

const router = express.Router()

/**
 * POST /api/designs
 * Create shareable design
 */
router.post('/', async (req, res, next) => {
  try {
    const { template, expiresInDays } = req.body

    if (!template) {
      return res.status(400).json({ error: 'Template is required' })
    }

    // Generate unique share code (8 characters)
    const shareCode = generateShareCode()

    // Calculate expiration date if specified
    let expiresAt = null
    if (expiresInDays) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    }

    const design = await designQueries.create(shareCode, template, expiresAt)

    res.status(201).json({
      shareCode: design.share_code,
      shareUrl: `/editor/${design.share_code}`,
      expiresAt: design.expires_at
    })
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      // Retry with new code
      return router.post('/', req, res, next)
    }
    next(error)
  }
})

/**
 * GET /api/designs/:shareCode
 * Get design by share code
 */
router.get('/:shareCode', async (req, res, next) => {
  try {
    const { shareCode } = req.params

    const design = await designQueries.getByShareCode(shareCode)

    if (!design) {
      return res.status(404).json({ error: 'Design not found or expired' })
    }

    res.json({
      template: design.template_json,
      createdAt: design.created_at,
      expiresAt: design.expires_at
    })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/designs/cleanup
 * Delete expired designs (cron job endpoint)
 */
router.delete('/cleanup', async (req, res, next) => {
  try {
    const deleted = await designQueries.deleteExpired()

    res.json({
      message: 'Expired designs cleaned up',
      count: deleted.length
    })
  } catch (error) {
    next(error)
  }
})

/**
 * Generate random 8-character share code
 */
function generateShareCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export default router

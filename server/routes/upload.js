/**
 * Upload API Routes (Cloudflare R2)
 */

import express from 'express'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const router = express.Router()

// Configure Cloudflare R2 client
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
})

/**
 * POST /api/upload
 * Upload preview image to Cloudflare R2
 */
router.post('/', async (req, res, next) => {
  try {
    const { filename, base64Data } = req.body

    if (!filename || !base64Data) {
      return res.status(400).json({ error: 'Missing filename or base64Data' })
    }

    // Extract base64 content (remove data:image/png;base64, prefix)
    const base64Content = base64Data.split(',')[1] || base64Data
    const buffer = Buffer.from(base64Content, 'base64')

    // Upload to R2
    const key = `templates/previews/${filename}`

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
      CacheControl: 'public, max-age=31536000' // Cache for 1 year
    }))

    // Construct public URL
    // Note: You'll need to configure a public R2 domain for this
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

    res.json({
      url: publicUrl,
      key,
      size: buffer.length
    })
  } catch (error) {
    console.error('Upload error:', error)
    next(error)
  }
})

export default router

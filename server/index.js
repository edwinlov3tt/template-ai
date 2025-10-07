/**
 * Template AI - Backend API Server
 * Express server for handling database operations
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Import routes
import templatesRouter from './routes/templates.js'
import designsRouter from './routes/designs.js'
import uploadRouter from './routes/upload.js'

// Routes
app.use('/api/templates', templatesRouter)
app.use('/api/designs', designsRouter)
app.use('/api/upload', uploadRouter)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err)
  res.status(500).json({
    error: err.message || 'Internal server error'
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Template AI API running on http://localhost:${PORT}`)
  console.log(`   Database: ${process.env.POSTGRES_DATABASE}@${process.env.POSTGRES_HOST}`)
})

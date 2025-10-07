/**
 * Database Setup Script
 * Creates the PostgreSQL schema for Template AI
 */

import pg from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') })

const { Client } = pg

// Database connection
const client = new Client({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: false // Disable SSL for this server
})

const schema = `
-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  template_json JSONB NOT NULL,
  preview_url TEXT,
  thumbnail_url TEXT,
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Designs table (for shareable URLs)
CREATE TABLE IF NOT EXISTS designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_code TEXT UNIQUE NOT NULL,
  template_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Indexes for templates
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_templates_published ON templates(published);
CREATE INDEX IF NOT EXISTS idx_templates_slug ON templates(slug);

-- Indexes for designs
CREATE INDEX IF NOT EXISTS idx_designs_share_code ON designs(share_code);
CREATE INDEX IF NOT EXISTS idx_designs_expires ON designs(expires_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`

async function setupDatabase() {
  try {
    console.log('🔌 Connecting to PostgreSQL...')
    console.log(`   Host: ${process.env.POSTGRES_HOST}`)
    console.log(`   Database: ${process.env.POSTGRES_DATABASE}`)
    console.log(`   User: ${process.env.POSTGRES_USER}`)

    await client.connect()
    console.log('✅ Connected to database!')

    console.log('\n📦 Creating schema...')
    await client.query(schema)
    console.log('✅ Schema created successfully!')

    // Verify tables
    console.log('\n🔍 Verifying tables...')
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)

    console.log('   Tables found:')
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`)
    })

    console.log('\n✅ Database setup complete!')
  } catch (error) {
    console.error('❌ Database setup failed:')
    console.error(error.message)

    if (error.code === 'ENOTFOUND') {
      console.error('\n⚠️  HOSTNAME ERROR: Could not resolve database host')
      console.error('   Please check POSTGRES_HOST in your .env file')
      console.error(`   Current value: ${process.env.POSTGRES_HOST}`)
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  CONNECTION REFUSED: Database server not accepting connections')
      console.error('   Check if the host and port are correct')
    } else if (error.code === '28P01') {
      console.error('\n⚠️  AUTHENTICATION FAILED: Invalid username or password')
      console.error('   Please check POSTGRES_USER and POSTGRES_PASSWORD')
    }

    process.exit(1)
  } finally {
    await client.end()
  }
}

setupDatabase()

/**
 * Database Connection Test
 * Tests the PostgreSQL connection
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

async function testConnection() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: false // Disable SSL for this server
  })

  try {
    console.log('🔌 Testing PostgreSQL connection...')
    console.log(`   Host: ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}`)
    console.log(`   Database: ${process.env.POSTGRES_DATABASE}`)
    console.log(`   User: ${process.env.POSTGRES_USER}`)
    console.log('')

    await client.connect()
    console.log('✅ Connected successfully!')

    // Test query
    const result = await client.query('SELECT version()')
    console.log('\n📊 PostgreSQL Version:')
    console.log(`   ${result.rows[0].version}`)

    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)

    if (tables.rows.length > 0) {
      console.log('\n📋 Existing tables:')
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`)
      })
    } else {
      console.log('\n⚠️  No tables found. Run "npm run db:setup" to create the schema.')
    }

    console.log('\n✅ Connection test passed!')
  } catch (error) {
    console.error('\n❌ Connection test failed:')
    console.error(`   ${error.message}`)

    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Tip: Could not resolve database host')
      console.error(`   Current host: ${process.env.POSTGRES_HOST}`)
      console.error('   Make sure the hostname is correct in .env')
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Tip: Connection refused')
      console.error('   Make sure PostgreSQL is running')
      console.error('   Check if you need SSH tunneling for remote access')
    } else if (error.code === '28P01') {
      console.error('\n💡 Tip: Authentication failed')
      console.error('   Check username and password in .env')
    }

    process.exit(1)
  } finally {
    await client.end()
  }
}

testConnection()

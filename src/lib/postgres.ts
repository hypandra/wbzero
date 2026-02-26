import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

const databaseUrl = process.env.DATABASE_URL || ''

const disableSsl =
  process.env.DATABASE_SSL === 'disable' ||
  process.env.DATABASE_SSL === 'false' ||
  databaseUrl.includes('localhost') ||
  databaseUrl.includes('127.0.0.1')

export function getPgSslConfig() {
  if (disableSsl) {
    return false
  }

  const certPath = path.join(process.cwd(), 'prod-ca-2021.crt')

  if (process.env.SUPABASE_CA_CERT) {
    return {
      ca: Buffer.from(process.env.SUPABASE_CA_CERT, 'base64').toString(),
      rejectUnauthorized: true,
    }
  }

  if (fs.existsSync(certPath)) {
    return {
      ca: fs.readFileSync(certPath).toString(),
      rejectUnauthorized: true,
    }
  }

  throw new Error('SSL cert required for production. Set SUPABASE_CA_CERT or add prod-ca-2021.crt')
}

export function createPgPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: getPgSslConfig(),
  })
}

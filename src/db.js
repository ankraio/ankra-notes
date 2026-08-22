// Connection handling lives here so the server file stays about routing.
// The pool reads the standard PG* variables an operator or an operator-managed
// Secret provides; DATABASE_URL wins when it is set.
const { Pool } = require('pg')

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT || 5432),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE || 'notes',
        ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
      },
)

const SCHEMA = `
CREATE TABLE IF NOT EXISTS notes (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  link       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`

// The app almost always starts before the database accepts connections.
// Crash-looping on that is noise, so retry with a bounded budget.
async function migrate({ attempts = 30, waitMs = 2000 } = {}) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await pool.query(SCHEMA)
      return
    } catch (error) {
      lastError = error
      console.warn(`database not ready (${attempt}/${attempts}): ${error.message}`)
      await new Promise((resolve) => setTimeout(resolve, waitMs))
    }
  }
  throw new Error(`database unreachable after ${attempts} attempts: ${lastError?.message}`)
}

module.exports = { pool, migrate }

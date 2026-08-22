const express = require('express')
const { pool, migrate } = require('./db')
const previews = require('./previews')

const app = express()
const PORT = Number(process.env.PORT || 3000)
const POD_NAME = process.env.POD_NAME || 'local'
const APP_VERSION = process.env.APP_VERSION || 'dev'

app.use(express.json())

// Readiness is gated on the database answering: "started" and "serving" are
// different facts and the platform should be told which one this is.
app.get('/healthz', async (_request, response) => {
  try {
    await pool.query('SELECT 1')
    response.json({ ok: true, pod: POD_NAME, version: APP_VERSION, previews: previews.isConfigured() })
  } catch (error) {
    response.status(503).json({ ok: false, error: error.message })
  }
})

app.get('/api/notes', async (_request, response) => {
  const { rows } = await pool.query('SELECT id, title, body, link, created_at FROM notes ORDER BY created_at DESC LIMIT 100')
  response.json(rows)
})

app.post('/api/notes', async (request, response) => {
  const title = String(request.body?.title || '').trim().slice(0, 200)
  const body = String(request.body?.body || '').trim().slice(0, 5000)
  const link = request.body?.link ? String(request.body.link).trim().slice(0, 2000) : null
  if (!title) return response.status(400).json({ error: 'title is required' })

  const { rows } = await pool.query(
    'INSERT INTO notes (title, body, link) VALUES ($1, $2, $3) RETURNING id, title, body, link, created_at',
    [title, body, link],
  )
  const note = rows[0]
  if (link) note.preview = await previews.fetchPreview(link)
  response.status(201).json(note)
})

app.get('/', (_request, response) => {
  response.type('html').send(`<!doctype html><meta charset="utf-8"><title>Ankra Notes</title>
<style>body{font:16px/1.6 system-ui;margin:3rem auto;max-width:44rem;padding:0 1rem}code{background:#0001;padding:.15em .4em;border-radius:4px}</style>
<h1>Ankra Notes</h1>
<p>Served by <code>${POD_NAME}</code>, version <code>${APP_VERSION}</code>.</p>
<p>Link previews: <strong>${previews.isConfigured() ? 'configured' : 'not configured'}</strong></p>
<p><a href="/api/notes">/api/notes</a> &middot; <a href="/healthz">/healthz</a></p>`)
})

migrate()
  .then(() => {
    app.listen(PORT, () => console.log(`ankra-notes listening on ${PORT} as ${POD_NAME}`))
  })
  .catch((error) => {
    console.error(`startup failed: ${error.message}`)
    process.exit(1)
  })

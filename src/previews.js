// Link previews come from an external service. The key is a real secret: the
// app degrades to "no preview" without it rather than refusing to start, so a
// missing value is visible in the UI instead of as a crash loop.
const PREVIEW_API_KEY = process.env.PREVIEW_API_KEY
const PREVIEW_API_URL = process.env.PREVIEW_API_URL || 'https://api.linkpreview.net'

function isConfigured() {
  return Boolean(PREVIEW_API_KEY)
}

async function fetchPreview(link) {
  if (!isConfigured()) return { available: false, reason: 'PREVIEW_API_KEY is not set' }
  try {
    const response = await fetch(`${PREVIEW_API_URL}/?q=${encodeURIComponent(link)}`, {
      headers: { 'X-Linkpreview-Api-Key': PREVIEW_API_KEY },
      signal: AbortSignal.timeout(4000),
    })
    if (!response.ok) return { available: false, reason: `preview service returned ${response.status}` }
    return { available: true, preview: await response.json() }
  } catch (error) {
    return { available: false, reason: error.message }
  }
}

module.exports = { isConfigured, fetchPreview }

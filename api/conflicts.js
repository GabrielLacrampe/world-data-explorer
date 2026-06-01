import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { eventsToGeoJSON } from '../src/utils/acledGeoJson.js'

const TOKEN_URL = 'https://acleddata.com/oauth/token'
const READ_URL = 'https://acleddata.com/api/acled/read'
const MAX_LIMIT = 5000
const CACHE_SECONDS = 600

let cachedToken = null
let tokenExpiry = null
let cachedGeoJSON = null
let geoJsonExpiry = null

/** Load .env files when vercel dev does not inject them into process.env */
function loadEnvFiles() {
  const files = ['.env', '.env.local', '.env.development.local']
  for (const file of files) {
    const path = join(process.cwd(), file)
    if (!existsSync(path)) continue
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (process.env[key] === undefined) process.env[key] = value
    }
  }
}

loadEnvFiles()

function getCredentials() {
  const email = process.env.ACLED_EMAIL || process.env.VITE_ACLED_EMAIL
  const password = process.env.ACLED_PASSWORD || process.env.VITE_ACLED_PASSWORD
  if (!email || !password) {
    throw new Error('ACLED credentials not configured')
  }
  return { email, password }
}

async function readAcledError(res) {
  try {
    const text = await res.text()
    const json = JSON.parse(text)
    return json.message || json.error || text.slice(0, 300)
  } catch {
    return res.statusText || `HTTP ${res.status}`
  }
}

function buildReadParams(limit) {
  const year = new Date().getFullYear()
  return new URLSearchParams({
    _format: 'json',
    limit: String(limit),
    year: `${year - 1}|${year}`,
    year_where: 'BETWEEN',
    fields:
      'event_id_cnty|event_date|event_type|sub_event_type|actor1|actor2|country|latitude|longitude|fatalities|notes',
  })
}

async function getAccessToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const { email, password } = getCredentials()
  const body = new URLSearchParams({
    username: email,
    password,
    grant_type: 'password',
    client_id: 'acled',
    scope: 'authenticated',
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const detail = await readAcledError(res)
    throw new Error(`ACLED auth failed: ${res.status} — ${detail}`)
  }

  const json = await res.json()
  cachedToken = json.access_token
  tokenExpiry = Date.now() + (json.expires_in - 60) * 1000
  return cachedToken
}

function cookieHeaderFromResponse(res) {
  if (typeof res.headers.getSetCookie === 'function') {
    return res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ')
  }
  return res.headers.get('set-cookie') ?? ''
}

/** Fallback when OAuth token lacks API access but myACLED session does */
async function fetchAcledEventsWithSession(limit) {
  const { email, password } = getCredentials()
  const loginRes = await fetch('https://acleddata.com/user/login?_format=json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: email, pass: password }),
  })

  if (!loginRes.ok) {
    const detail = await readAcledError(loginRes)
    throw new Error(`ACLED session login failed: ${loginRes.status} — ${detail}`)
  }

  const loginJson = await loginRes.json()
  if (loginJson.message) {
    throw new Error(`ACLED session login: ${loginJson.message}`)
  }

  const cookie = cookieHeaderFromResponse(loginRes)
  if (!cookie) {
    throw new Error('ACLED session login: no session cookie returned')
  }

  const params = buildReadParams(limit)
  const res = await fetch(`${READ_URL}?${params}`, {
    headers: { Cookie: cookie },
  })

  if (!res.ok) {
    const detail = await readAcledError(res)
    throw new Error(`ACLED API error: ${res.status} — ${detail}`)
  }

  const json = await res.json()
  return json.data ?? []
}

async function fetchAcledEventsWithOAuth(limit) {
  const token = await getAccessToken()
  const params = buildReadParams(limit)

  const res = await fetch(`${READ_URL}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const detail = await readAcledError(res)
    const err = new Error(`ACLED API error: ${res.status} — ${detail}`)
    err.status = res.status
    throw err
  }

  const json = await res.json()
  return json.data ?? []
}

async function fetchAcledEvents(limit) {
  try {
    return await fetchAcledEventsWithOAuth(limit)
  } catch (err) {
    if (err.status !== 403) throw err
    console.warn('ACLED OAuth read returned 403, trying session auth…', err.message)
    return fetchAcledEventsWithSession(limit)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawLimit = parseInt(req.query?.limit ?? '1000', 10)
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT)
    : 1000

  try {
    if (cachedGeoJSON && geoJsonExpiry && Date.now() < geoJsonExpiry) {
      res.setHeader('Cache-Control', `public, max-age=${CACHE_SECONDS}`)
      return res.status(200).json(cachedGeoJSON)
    }

    const events = await fetchAcledEvents(limit)
    const geojson = eventsToGeoJSON(events)

    cachedGeoJSON = geojson
    geoJsonExpiry = Date.now() + CACHE_SECONDS * 1000

    res.setHeader('Cache-Control', `public, max-age=${CACHE_SECONDS}`)
    return res.status(200).json(geojson)
  } catch (err) {
    console.error('ACLED proxy error:', err.message)
    return res.status(502).json({
      error: 'Failed to fetch conflict data',
      hint:
        'Log into https://acleddata.com, accept terms/consent, and complete your myACLED profile. Gmail accounts get Open access; contact access@acleddata.com if API stays denied.',
      detail: err.message,
    })
  }
}

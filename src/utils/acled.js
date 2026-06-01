const BASE_URL = 'https://acleddata.com/api'
const TOKEN_URL = 'https://acleddata.com/oauth/token'
const EMAIL = import.meta.env.VITE_ACLED_EMAIL
const PASSWORD = import.meta.env.VITE_ACLED_PASSWORD

let cachedToken = null
let tokenExpiry = null

async function getAccessToken() {
  // Devuelve el token en caché si sigue válido
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const body = new URLSearchParams({
    username: EMAIL,
    password: PASSWORD,
    grant_type: 'password',
    client_id: 'acled',
    scope: 'authenticated',
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) throw new Error(`ACLED auth failed: ${res.status}`)

  const json = await res.json()
  cachedToken = json.access_token
  tokenExpiry = Date.now() + (json.expires_in - 60) * 1000 // 60s de margen
  return cachedToken
}

export async function fetchConflictEvents(limit = 1000) {
  const token = await getAccessToken()

  const params = new URLSearchParams({
    _format: 'json',
    limit: String(limit),
    fields: 'event_id_cnty|event_date|event_type|sub_event_type|actor1|actor2|country|latitude|longitude|fatalities|notes',
  })

  const res = await fetch(`${BASE_URL}/acled/read?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) throw new Error(`ACLED API error: ${res.status}`)

  const json = await res.json()
  const events = json.data ?? []

  // El resto igual que antes — conversión a GeoJSON
  const features = events
    .filter((e) => e.latitude && e.longitude)
    .map((e) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(e.longitude), parseFloat(e.latitude)],
      },
      properties: {
        id: e.event_id_cnty,
        date: e.event_date,
        eventType: e.event_type,
        subEventType: e.sub_event_type,
        actor1: e.actor1,
        actor2: e.actor2,
        country: e.country,
        fatalities: parseInt(e.fatalities, 10) || 0,
        notes: e.notes,
        color: EVENT_COLORS[e.event_type] ?? DEFAULT_EVENT_COLOR,
      },
    }))

  return { type: 'FeatureCollection', features }
}


const FIELDS = [
  'event_id_cnty',
  'event_date',
  'event_type',
  'sub_event_type',
  'actor1',
  'actor2',
  'country',
  'latitude',
  'longitude',
  'fatalities',
  'notes',
].join(',')

// Event type to color mapping for the points layer
export const EVENT_COLORS = {
  'Battles': '#ef4444',
  'Violence against civilians': '#f97316',
  'Explosions/Remote violence': '#eab308',
  'Protests': '#3b82f6',
  'Riots': '#8b5cf6',
  'Strategic developments': '#6b7280',
}

export const DEFAULT_EVENT_COLOR = '#6b7280'

/**
 * Fetches recent conflict events from ACLED and converts them to GeoJSON.
 * Returns a GeoJSON FeatureCollection ready for MapLibre.
 */
export async function fetchConflictEvents(limit = 1000) {
  const params = new URLSearchParams({
    key: KEY,
    email: EMAIL,
    limit: String(limit),
    fields: FIELDS,
    format: 'json',
  })

  const res = await fetch(`${BASE_URL}?${params}`)
  if (!res.ok) throw new Error(`ACLED API error: ${res.status}`)

  const json = await res.json()
  const events = json.data ?? []

  // Convert to GeoJSON FeatureCollection
  const features = events
    .filter((e) => e.latitude && e.longitude)
    .map((e) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(e.longitude), parseFloat(e.latitude)],
      },
      properties: {
        id: e.event_id_cnty,
        date: e.event_date,
        eventType: e.event_type,
        subEventType: e.sub_event_type,
        actor1: e.actor1,
        actor2: e.actor2,
        country: e.country,
        fatalities: parseInt(e.fatalities, 10) || 0,
        notes: e.notes,
        color: EVENT_COLORS[e.event_type] ?? DEFAULT_EVENT_COLOR,
      },
    }))

  return {
    type: 'FeatureCollection',
    features,
  }
}
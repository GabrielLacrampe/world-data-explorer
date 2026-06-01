export { EVENT_COLORS, DEFAULT_EVENT_COLOR } from './acledGeoJson.js'

export async function fetchConflictEvents(limit = 1000) {
  const res = await fetch(`/api/conflicts?limit=${limit}`)
  if (!res.ok) {
    throw new Error(`Conflicts API error: ${res.status}`)
  }
  return res.json()
}

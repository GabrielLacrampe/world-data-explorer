import { getDatasetsBatch, staticKey } from '../lib/datasets'
import { DATASET_URLS } from '../config/datasets'

async function fetchJson(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Failed to load ${url}`)
  return r.json()
}

/**
 * Loads every static dataset: one Supabase batch query for the snapshots,
 * then a per-file fallback to the self-hosted /data/*.json for any dataset
 * without a snapshot. allSettled (instead of all) so one failed file can't
 * take down the rest — failures fall back to an empty object and are
 * reported in `failed` for the caller to surface.
 */
export async function loadStaticDatasets() {
  const entries = Object.entries(DATASET_URLS)
  const snapshots = await getDatasetsBatch(entries.map(([name]) => staticKey(name)))

  const results = await Promise.allSettled(
    entries.map(([name, url]) => {
      const snapshot = snapshots[staticKey(name)]
      return snapshot !== undefined ? Promise.resolve(snapshot) : fetchJson(url)
    })
  )

  const datasets = {}
  const failed = []
  results.forEach((result, i) => {
    const [key] = entries[i]
    if (result.status === 'fulfilled') {
      datasets[key] = result.value
    } else {
      console.error(`Static dataset "${key}" failed to load:`, result.reason)
      datasets[key] = {}
      failed.push(key)
    }
  })

  return { datasets, failed }
}

export const FREEDOM_STATUS = {
  'Free': { label: 'Free', color: '#22c55e' },
  'Partly Free': { label: 'Partly Free', color: '#eab308' },
  'Not Free': { label: 'Not Free', color: '#ef4444' },
}

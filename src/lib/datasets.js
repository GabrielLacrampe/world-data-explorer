import { supabase } from './supabase'

export { wbKey, imfKey, staticKey, owidKey, COUNTRIES_KEY } from '../config/datasets'

/**
 * Unified dataset access layer.
 *
 * Every dataset the app shows lives as one row in the Supabase `datasets`
 * table (key → jsonb), kept fresh by scripts/refresh-datasets.mjs on a
 * weekly schedule. All reads go through here with the same resolution
 * order regardless of the original source:
 *
 *   in-memory cache → Supabase snapshot → per-dataset fallback fetcher
 *
 * The fallback is the dataset's original source (live World Bank/IMF API,
 * self-hosted /data/*.json, …), so the app keeps working — just slower —
 * when a snapshot is missing or Supabase is unreachable.
 */

const cache = new Map() // key → Promise<data>

async function readSnapshot(key) {
  const { data, error } = await supabase
    .from('datasets')
    .select('data')
    .eq('key', key)
    .maybeSingle()
  if (error) throw error
  return data ? data.data : null
}

/**
 * Resolves one dataset. Concurrent callers share the same promise; failed
 * loads are evicted so a later call can retry.
 *
 * @param {string} key  Dataset key (see src/config/datasets.js builders).
 * @param {() => Promise<any>} [fallback]  Fetches from the original source
 *   when Supabase has no snapshot.
 * @returns {Promise<any>}
 */
export function getDataset(key, fallback) {
  if (cache.has(key)) return cache.get(key)

  const promise = (async () => {
    let snapshot = null
    try {
      snapshot = await readSnapshot(key)
    } catch {
      // Table missing or Supabase unreachable — fall through to fallback.
    }
    if (snapshot !== null) return snapshot
    if (!fallback) throw new Error(`Dataset "${key}" has no snapshot and no fallback`)
    return fallback()
  })().catch((err) => {
    cache.delete(key)
    throw err
  })

  cache.set(key, promise)
  return promise
}

const metaCache = new Map() // key → Promise<{source, fetched_at}|null>

/**
 * Resolves a dataset's provenance metadata (pipeline name + last refresh
 * timestamp) without pulling its `data` payload. Kept separate from
 * getDataset/getDatasetsBatch — which only ever select `data` — so their
 * return shape never changes for the ~20 existing callers.
 *
 * @param {string} key
 * @returns {Promise<{source: string|null, fetched_at: string|null}|null>}
 */
export function getDatasetMeta(key) {
  if (metaCache.has(key)) return metaCache.get(key)

  const promise = (async () => {
    const { data, error } = await supabase
      .from('datasets')
      .select('source, fetched_at')
      .eq('key', key)
      .maybeSingle()
    if (error || !data) return null
    return data
  })().catch(() => null)

  metaCache.set(key, promise)
  return promise
}

/**
 * Resolves many datasets with a single Supabase query (plus whatever is
 * already in memory). No fallbacks: keys without a snapshot are simply
 * absent from the result, and the caller decides how to fill the gaps.
 *
 * @param {string[]} keys
 * @returns {Promise<Record<string, any>>}  key → data, misses omitted.
 */
export async function getDatasetsBatch(keys) {
  const missing = keys.filter((key) => !cache.has(key))

  if (missing.length > 0) {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('key, data')
        .in('key', missing)
      if (!error && data) {
        data.forEach((row) => cache.set(row.key, Promise.resolve(row.data)))
      }
    } catch {
      // Supabase unreachable — callers fall back per key.
    }
  }

  const result = {}
  await Promise.all(
    keys.map(async (key) => {
      if (!cache.has(key)) return
      try {
        result[key] = await cache.get(key)
      } catch {
        // A previously cached load failed — leave the key absent.
      }
    })
  )
  return result
}

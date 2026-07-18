/**
 * Refreshes every row of the Supabase `datasets` table — the single source
 * the frontend reads all its data from (see src/lib/datasets.js):
 *
 *   worldbank/<indicator>   World Bank snapshots  { ISO2: value }
 *   imf/<dataflow>/<code>   IMF SDMX snapshots    { ISO3: value }
 *   static/<name>           curated public/data/*.json files as-is
 *   owid/<chartSlug>        historical series     { year: { ISO2: value } }
 *   countries               world-countries metadata array
 *
 * The indicator list is derived from src/layers.js, so adding a layer there
 * is automatically picked up on the next refresh.
 *
 * Run locally:   npm run refresh-datasets
 *   (needs SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_URL/SUPABASE_URL in
 *    the environment or .env/.env.local)
 * Runs weekly in CI: .github/workflows/refresh-datasets.yml
 */

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { LAYERS, SIDEBAR_INDICATORS, TOOLTIP_AUX_INDICATORS } from '../src/layers.js'
import { fetchIndicatorAllCountries, fetchIndicatorForCountries } from '../src/utils/worldBank.js'
import { fetchImfIndicatorLatest } from '../src/utils/imf.js'
import {
  wbKey, imfKey, staticKey, owidKey,
  COUNTRIES_KEY, COUNTRIES_URL, DATASET_URLS,
} from '../src/config/datasets.js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars: need SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const rows = []
const failures = []

async function retry(fn, attempts = 2) {
  let lastErr
  for (let i = 0; i <= attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i < attempts) await new Promise((r) => setTimeout(r, 2000 * (i + 1)))
    }
  }
  throw lastErr
}

/** Runs one dataset fetch, treating an empty result as a failure so a bad
 *  API response can never overwrite a good snapshot with nothing. */
async function collect(key, source, fn) {
  const t0 = Date.now()
  try {
    const data = await fn()
    const size = Array.isArray(data) ? data.length : Object.keys(data ?? {}).length
    if (size === 0) throw new Error('empty dataset')
    rows.push({ key, source, data, fetched_at: new Date().toISOString() })
    console.log(`  ok    ${key} (${size} entries, ${((Date.now() - t0) / 1000).toFixed(1)}s)`)
  } catch (err) {
    failures.push(key)
    console.error(`  FAIL  ${key}: ${err.message}`)
  }
}

/** Runs async task functions with a small concurrency limit. */
async function runPool(tasks, limit = 4) {
  const queue = [...tasks]
  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      while (queue.length > 0) await queue.shift()()
    })
  )
}

// ── Countries metadata (also needed for the supplemental WB pass) ────────
console.log('Countries metadata:')
let allIso2 = []
await collect(COUNTRIES_KEY, 'countries', async () => {
  const countries = await retry(async () => {
    const res = await fetch(COUNTRIES_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  })
  allIso2 = countries.map((c) => c.cca2).filter(Boolean)
  return countries
})

// ── World Bank indicators ────────────────────────────────────────────────
// Union of everything the app can show: map layers, sidebar, tooltip math.
const wbIndicators = new Map()
Object.values(LAYERS).forEach((layer) => {
  if (layer.source === 'worldbank' && layer.indicator) wbIndicators.set(layer.indicator, layer)
})
SIDEBAR_INDICATORS.forEach(({ indicator }) => {
  if (!wbIndicators.has(indicator)) wbIndicators.set(indicator, {})
})
Object.values(TOOLTIP_AUX_INDICATORS).forEach((indicator) => {
  if (!wbIndicators.has(indicator)) wbIndicators.set(indicator, {})
})

console.log(`World Bank (${wbIndicators.size} indicators):`)
await runPool(
  [...wbIndicators.entries()].map(([indicator, layer]) => () =>
    collect(wbKey(indicator), 'worldbank', async () => {
      const data = await retry(() => fetchIndicatorAllCountries(indicator, { mrv: layer.mrv }))
      // Same supplemental pass the client used to do live (e.g. literacy):
      // a second query for countries absent from the all-countries response.
      if (layer.supplementalFetch && allIso2.length > 0) {
        const missing = allIso2.filter((iso2) => !(iso2 in data))
        if (missing.length > 0) {
          Object.assign(data, await retry(() => fetchIndicatorForCountries(missing, indicator, { mrv: layer.mrv })))
        }
      }
      return data
    })
  )
)

// ── IMF indicators ───────────────────────────────────────────────────────
const imfLayers = Object.values(LAYERS).filter((l) => l.source === 'imf' && l.indicator)
console.log(`IMF (${imfLayers.length} indicators):`)
for (const layer of imfLayers) {
  await collect(imfKey(layer.dataflow, layer.indicator), 'imf', () =>
    retry(() => fetchImfIndicatorLatest(layer.indicator, { dataflow: layer.dataflow }))
  )
}

// ── Curated static datasets (from the committed public/data files) ───────
console.log(`Static datasets (${Object.keys(DATASET_URLS).length}):`)
for (const [name, url] of Object.entries(DATASET_URLS)) {
  await collect(staticKey(name), 'static', () =>
    JSON.parse(readFileSync(new URL(`../public${url}`, import.meta.url), 'utf8'))
  )
}

// ── OWID historical series (from the committed public/data files) ────────
const owidSlugs = [...new Set(
  Object.values(LAYERS).filter((l) => l.historical).map((l) => l.historical.owidChart)
)]
console.log(`OWID historical (${owidSlugs.length}):`)
for (const slug of owidSlugs) {
  await collect(owidKey(slug), 'owid', () =>
    JSON.parse(readFileSync(new URL(`../public/data/historical/${slug}.json`, import.meta.url), 'utf8'))
  )
}

// ── Upsert everything that succeeded ─────────────────────────────────────
console.log(`Upserting ${rows.length} datasets to Supabase...`)
const CHUNK = 5
for (let i = 0; i < rows.length; i += CHUNK) {
  const chunk = rows.slice(i, i + CHUNK)
  const { error } = await supabase.from('datasets').upsert(chunk)
  if (error) {
    console.error(`Upsert failed for [${chunk.map((r) => r.key).join(', ')}]: ${error.message}`)
    failures.push(...chunk.map((r) => r.key))
  }
}

if (failures.length > 0) {
  console.error(`\nDone with ${failures.length} failure(s): ${[...new Set(failures)].join(', ')}`)
  process.exit(1)
}
console.log(`\nDone. ${rows.length} datasets refreshed.`)

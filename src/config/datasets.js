/**
 * Shared dataset registry: key builders and source URLs.
 *
 * This module is dependency-free on purpose — it is imported both by the
 * frontend (src/lib/datasets.js) and by scripts/refresh-datasets.mjs
 * running in Node, so it must not touch supabase-js or import.meta.env.
 *
 * Every dataset the app shows is one row in the Supabase `datasets` table,
 * addressed by the keys built here. The refresh script and the frontend
 * must agree on these keys — that's why they live in one place.
 */

/** World Bank indicator snapshot: { ISO2: value } */
export const wbKey = (indicator) => `worldbank/${indicator}`

/** IMF SDMX indicator snapshot: { ISO3: value } */
export const imfKey = (dataflow, indicator) => `imf/${dataflow ?? 'GDD'}/${indicator}`

/** Curated static dataset (same shape as its public/data/*.json file). */
export const staticKey = (name) => `static/${name}`

/** OWID historical series: { year: { ISO2: value } } */
export const owidKey = (chartSlug) => `owid/${chartSlug}`

/** REST-countries metadata array (world-countries package shape). */
export const COUNTRIES_KEY = 'countries'

/** Static curated datasets and their self-hosted fallback URLs. */
export const DATASET_URLS = {
  sipri: '/data/sipri.json',
  vdem: '/data/vdem.json',
  alliances: '/data/alliances.json',
  governments: '/data/governments.json',
  ethnicGroups: '/data/ethnicGroups.json',
  religions: '/data/religions.json',
  militaryPersonnel: '/data/militaryPersonnel.json',
  freedomhouse: '/data/freedomhouse.json',
  factbook: '/data/factbook.json',
  cpi: '/data/cpi.json',
}

/** Country metadata source (fallback when Supabase has no snapshot). */
export const COUNTRIES_URL = 'https://cdn.jsdelivr.net/npm/world-countries/countries.json'

async function fetchJson(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Failed to load ${url}`)
  return r.json()
}

const DATASET_URLS = {
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

/**
 * Loads every static dataset in parallel. allSettled (instead of all) so one
 * failed file can't take down the rest — failures fall back to an empty
 * object and are reported in `failed` for the caller to surface.
 */
export async function loadStaticDatasets() {
  const entries = Object.entries(DATASET_URLS)
  const results = await Promise.allSettled(entries.map(([, url]) => fetchJson(url)))

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

export function formatMilSpending(millionsUSD) {
  if (!millionsUSD) return 'No data'
  if (millionsUSD >= 1000) {
    return `$${(millionsUSD / 1000).toFixed(1)}B`
  }
  return `$${millionsUSD.toLocaleString('en-US')}M`
}

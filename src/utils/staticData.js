async function fetchJson(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Failed to load ${url}`)
  return r.json()
}

export async function loadStaticDatasets() {
  const [sipri, vdem, alliances, governments, ethnicGroups, religions, militaryPersonnel, freedomhouse, factbook, cpi] =
    await Promise.all([
      fetchJson('/data/sipri.json'),
      fetchJson('/data/vdem.json'),
      fetchJson('/data/alliances.json'),
      fetchJson('/data/governments.json').catch(() => ({})),
      fetchJson('/data/ethnicGroups.json').catch(() => ({})),
      fetchJson('/data/religions.json').catch(() => ({})),
      fetchJson('/data/militaryPersonnel.json').catch(() => ({})),
      fetchJson('/data/freedomhouse.json').catch(() => ({})),
      fetchJson('/data/factbook.json').catch(() => ({})),
      fetchJson('/data/cpi.json').catch(() => ({})),
    ])

  return { sipri, vdem, freedomhouse, alliances, governments, ethnicGroups, religions, militaryPersonnel, factbook, cpi }
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

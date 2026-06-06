export async function loadStaticDatasets() {
  const [sipri, vdem, alliances] = await Promise.all([
    fetch('/data/sipri.json').then((r) => r.json()),
    fetch('/data/vdem.json').then((r) => r.json()),
    fetch('/data/alliances.json').then((r) => r.json()),
  ])

  return { sipri, vdem, freedomhouse: null, alliances }
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

/**
 * Downloads historical time-series data from Our World in Data and saves it
 * as static JSON files in public/data/historical/.
 *
 * Each output file has the shape:
 *   { "<year>": { "<ISO2>": <value>, ... }, ... }
 *
 * Run with:  node scripts/fetch-historical.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs'

const OWID_BASE   = 'https://ourworldindata.org/grapher'
const COUNTRIES_URL = 'https://cdn.jsdelivr.net/npm/world-countries/countries.json'
const OUT_DIR     = 'public/data/historical'

// Datasets to fetch: { slug, label }
const DATASETS = [
  { slug: 'gdp-per-capita-maddison',  label: 'GDP per Capita (Maddison)' },
  { slug: 'life-expectancy',           label: 'Life Expectancy' },
  { slug: 'population',                label: 'Population' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function splitCsvLine(line) {
  const result = []
  let inQuotes = false
  let current = ''
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { result.push(current); current = '' }
    else { current += ch }
  }
  result.push(current)
  return result
}

function parseCsv(text, iso3ToIso2) {
  const lines   = text.trim().split('\n')
  const headers = splitCsvLine(lines[0])

  const codeIdx  = headers.findIndex(h => h.trim() === 'Code')
  const yearIdx  = headers.findIndex(h => h.trim() === 'Year')
  const valueIdx = headers.length - 1   // last column is always the indicator value

  if (codeIdx === -1 || yearIdx === -1) {
    console.error('  Could not find Code or Year column. Headers:', headers)
    return {}
  }

  const result = {}

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const cols  = splitCsvLine(lines[i])
    const iso3  = cols[codeIdx]?.trim()
    const year  = parseInt(cols[yearIdx])
    const value = parseFloat(cols[valueIdx]?.trim())

    // Skip aggregate regions (OWID uses 3-letter ISO for countries,
    // and OWID_* codes for aggregates)
    if (!iso3 || !/^[A-Z]{3}$/.test(iso3) || isNaN(year) || isNaN(value)) continue

    const iso2 = iso3ToIso2[iso3]
    if (!iso2) continue

    if (!result[year]) result[year] = {}
    result[year][iso2] = value
  }

  return result
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log('Fetching world-countries for ISO3 → ISO2 mapping...')
const worldCountries = await fetch(COUNTRIES_URL).then(r => r.json())

const iso3ToIso2 = {}
for (const c of worldCountries) {
  if (c.cca3 && c.cca2) iso3ToIso2[c.cca3] = c.cca2
}
console.log(`  Mapped ${Object.keys(iso3ToIso2).length} ISO3 codes.`)

mkdirSync(OUT_DIR, { recursive: true })

for (const { slug, label } of DATASETS) {
  const url = `${OWID_BASE}/${slug}.csv?csvType=full&useColumnShortNames=false`
  console.log(`\nFetching ${label}...`)

  let text
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'World Data Explorer / data fetch' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    text = await res.text()
  } catch (err) {
    console.error(`  FAILED: ${err.message}`)
    continue
  }

  console.log(`  Parsing...`)
  const data    = parseCsv(text, iso3ToIso2)
  const years   = Object.keys(data).length
  const outPath = `${OUT_DIR}/${slug}.json`

  writeFileSync(outPath, JSON.stringify(data))
  console.log(`  Saved ${years} years → ${outPath}`)
}

console.log('\nDone.')

/**
 * Downloads historical time-series data from OWID's GitHub datasets repo
 * and saves static JSON files to public/data/historical/.
 *
 * Each output file has the shape:
 *   { "<year>": { "<ISO2>": <value>, ... }, ... }
 *
 * Run with:  node scripts/fetch-historical.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs'

const OWID_RAW = 'https://raw.githubusercontent.com/owid/owid-datasets/master/datasets'
const COUNTRIES_URL = 'https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json'
const OUT_DIR = 'public/data/historical'

const DATASETS = [
  {
    slug: 'gdp-per-capita-maddison',
    label: 'GDP per Capita (Maddison Project 2020)',
    githubDir: 'Maddison Project Database 2020 (Bolt and van Zanden (2020))',
    valueColumn: 'GDP per capita',
  },
  {
    slug: 'life-expectancy',
    label: 'Life Expectancy (Gapminder + UN)',
    githubDir: 'Long run life expectancy - Gapminder, UN',
    valueColumn: 'Life expectancy (Gapminder, UN)',
  },
  {
    slug: 'population',
    label: 'Population (Gapminder + UN)',
    githubDir: 'Total population - Gapminder, UN Population Division',
    valueColumn: 'Total population (Gapminder, UN Population Division)',
  },
]

// OWID uses its own country-name spellings that don't always match ISO standard names
const OVERRIDES = {
  'united states':                     'US',
  'united kingdom':                    'GB',
  'russia':                            'RU',
  'south korea':                       'KR',
  'north korea':                       'KP',
  'iran':                              'IR',
  'syria':                             'SY',
  'vietnam':                           'VN',
  'bolivia':                           'BO',
  'tanzania':                          'TZ',
  'moldova':                           'MD',
  'venezuela':                         'VE',
  "côte d'ivoire":                     'CI',
  "cote d'ivoire":                     'CI',
  'ivory coast':                       'CI',
  'czech republic':                    'CZ',
  'czechia':                           'CZ',
  'democratic republic of congo':      'CD',
  'democratic republic of the congo':  'CD',
  'dr congo':                          'CD',
  'congo':                             'CG',
  'republic of the congo':             'CG',
  'laos':                              'LA',
  'myanmar':                           'MM',
  'burma':                             'MM',
  'timor-leste':                       'TL',
  'east timor':                        'TL',
  'eswatini':                          'SZ',
  'swaziland':                         'SZ',
  'cabo verde':                        'CV',
  'cape verde':                        'CV',
  'turkey':                            'TR',
  'turkiye':                           'TR',
  'united arab emirates':              'AE',
  'taiwan':                            'TW',
  'taiwan*':                           'TW',
  'palestine':                         'PS',
  'west bank and gaza':                'PS',
  'hong kong':                         'HK',
  'macao':                             'MO',
  'macau':                             'MO',
  'micronesia (country)':              'FM',
  'micronesia':                        'FM',
  // Regions / aggregates — skip these
  'world': null,
  'africa': null,
  'europe': null,
  'asia': null,
  'americas': null,
  'oceania': null,
  'north america': null,
  'south america': null,
  'latin america': null,
  'western europe': null,
  'eastern europe': null,
  'sub-saharan africa': null,
  'middle east': null,
  'central asia': null,
  'south asia': null,
  'southeast asia': null,
  'east asia': null,
  'former ussr': null,
  'former yugoslavia': null,
}

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

function parseCsv(text, nameToIso2, valueColumn) {
  const lines   = text.trim().split('\n')
  const headers = splitCsvLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''))

  const entityIdx = headers.findIndex(h => h === 'Entity')
  const yearIdx   = headers.findIndex(h => h === 'Year')
  const valueIdx  = headers.findIndex(h => h === valueColumn)

  if (entityIdx === -1 || yearIdx === -1 || valueIdx === -1) {
    console.error(`  Could not find columns. Headers: ${headers.join(' | ')}`)
    console.error(`  Looking for value column: "${valueColumn}"`)
    return {}
  }

  const result = {}
  const skipped = new Set()

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const cols  = splitCsvLine(lines[i])
    const name  = cols[entityIdx]?.trim().toLowerCase()
    const year  = parseInt(cols[yearIdx])
    const raw   = cols[valueIdx]?.trim()
    const value = parseFloat(raw)

    if (!name || isNaN(year) || !raw || isNaN(value)) continue

    // Check override map first
    if (name in OVERRIDES) {
      const iso2 = OVERRIDES[name]
      if (iso2 === null) continue   // explicitly skipped region
      if (!result[year]) result[year] = {}
      result[year][iso2] = value
      continue
    }

    const iso2 = nameToIso2[name]
    if (!iso2) {
      skipped.add(cols[entityIdx]?.trim())
      continue
    }

    if (!result[year]) result[year] = {}
    result[year][iso2] = value
  }

  if (skipped.size) {
    console.log(`  Unmatched (${skipped.size}): ${[...skipped].slice(0, 8).join(', ')}${skipped.size > 8 ? '...' : ''}`)
  }

  return result
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log('Fetching country name → ISO2 mapping...')
const countries = await fetch(COUNTRIES_URL).then(r => r.json())

const nameToIso2 = {}
for (const c of countries) {
  const iso2 = c.cca2
  if (!iso2) continue
  // Index by common name, official name and all translations
  nameToIso2[c.name.common.toLowerCase()] = iso2
  if (c.name.official) nameToIso2[c.name.official.toLowerCase()] = iso2
  for (const t of Object.values(c.translations ?? {})) {
    if (t.common) nameToIso2[t.common.toLowerCase()] = iso2
  }
  for (const alt of Object.values(c.altSpellings ?? [])) {
    nameToIso2[alt.toLowerCase()] = iso2
  }
}
console.log(`  Mapped ${Object.keys(nameToIso2).length} name variants.`)

mkdirSync(OUT_DIR, { recursive: true })

for (const { slug, label, githubDir, valueColumn } of DATASETS) {
  const encoded = encodeURIComponent(githubDir)
  const url     = `${OWID_RAW}/${encoded}/${encoded}.csv`

  console.log(`\nFetching ${label}...`)
  let text
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    text = await res.text()
  } catch (err) {
    console.error(`  FAILED: ${err.message}`)
    continue
  }

  console.log(`  Parsing (value column: "${valueColumn}")...`)
  const data    = parseCsv(text, nameToIso2, valueColumn)
  const years   = Object.keys(data).length
  const outPath = `${OUT_DIR}/${slug}.json`

  writeFileSync(outPath, JSON.stringify(data))
  console.log(`  Saved ${years} years → ${outPath}`)
}

console.log('\nDone.')

import { writeFileSync } from 'node:fs'

// Pew Research religion projections (via datasets/world-religion-projections on GitHub)
const CSV_URL = 'https://raw.githubusercontent.com/datasets/world-religion-projections/main/rounded_percentage.csv'

// world-countries for name → ISO-2 mapping
const COUNTRIES_URL = 'https://cdn.jsdelivr.net/npm/world-countries/countries.json'

console.log('Fetching religion CSV...')
const csvText = await fetch(CSV_URL).then(r => r.text())

console.log('Fetching country name → ISO-2 map...')
const worldCountries = await fetch(COUNTRIES_URL).then(r => r.json())

// Build lookup: lowercase common name / alt spellings → iso2
const nameToIso2 = {}
for (const c of worldCountries) {
  const iso2 = c.cca2
  nameToIso2[c.name.common.toLowerCase()] = iso2
  nameToIso2[c.name.official.toLowerCase()] = iso2
  for (const alt of Object.values(c.altSpellings ?? [])) {
    nameToIso2[alt.toLowerCase()] = iso2
  }
  // translations
  for (const t of Object.values(c.translations ?? {})) {
    if (t.common) nameToIso2[t.common.toLowerCase()] = iso2
  }
}

// Manual overrides for CIA/Pew naming quirks
const OVERRIDES = {
  'united states': 'US',
  'united states of america': 'US',
  'russia': 'RU',
  'south korea': 'KR',
  'north korea': 'KP',
  'taiwan': 'TW',
  'iran': 'IR',
  'syria': 'SY',
  'vietnam': 'VN',
  'bolivia': 'BO',
  'tanzania': 'TZ',
  'moldova': 'MD',
  'venezuela': 'VE',
  "côte d'ivoire": 'CI',
  "ivory coast": 'CI',
  'czech republic': 'CZ',
  'czechia': 'CZ',
  'dr congo': 'CD',
  'democratic republic of the congo': 'CD',
  'republic of the congo': 'CG',
  'congo, dem. rep.': 'CD',
  'congo, rep.': 'CG',
  'laos': 'LA',
  'myanmar': 'MM',
  'burma': 'MM',
  'timor-leste': 'TL',
  'east timor': 'TL',
  'eswatini': 'SZ',
  'swaziland': 'SZ',
  'cabo verde': 'CV',
  'cape verde': 'CV',
  'são tomé and príncipe': 'ST',
  'brunei': 'BN',
  'palestine': 'PS',
  'occupied palestinian territory': 'PS',
  'turkey': 'TR',
  'turkiye': 'TR',
  'united kingdom': 'GB',
  'hong kong': 'HK',
  'macao': 'MO',
  'macau': 'MO',
  'south africa': 'ZA',
  'north africa': null, // region, skip
  'sub-saharan africa': null, // region, skip
  'middle east-north africa': null, // region
  'asia-pacific': null, // region
  'europe': null, // region
  'latin america-caribbean': null, // region
  'north america': null, // region
  'global': null, // global total
  'world': null,
}

// Parse CSV
const lines = csvText.trim().split('\n')
const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

// CSV columns: Year, Region, Country, Buddhists, Christians, ...
const yearCol    = headers.findIndex(h => h.toLowerCase() === 'year')
const regionCol  = headers.findIndex(h => h.toLowerCase() === 'region')
const countryCol = headers.findIndex(h => h.toLowerCase() === 'country')
const religionCols = headers
  .map((h, i) => ({ h, i }))
  .filter(({ i }) => i !== yearCol && i !== regionCol && i !== countryCol && headers[i] !== '')

const YEAR = '2020'

const out = {}

for (const line of lines.slice(1)) {
  const cols = line.split(',').map(v => v.trim())
  if (!cols.length) continue

  const year = cols[yearCol]?.trim()
  if (year !== YEAR) continue

  const rawName = cols[countryCol]?.trim().toLowerCase()
  if (!rawName || rawName === 'all countries') continue

  // Check overrides first
  let iso2 = OVERRIDES[rawName]
  if (iso2 === null) continue // explicitly skipped region
  if (!iso2) iso2 = nameToIso2[rawName]
  if (!iso2) {
    console.warn(`  No ISO-2 for: "${cols[countryCol]}"`)
    continue
  }

  const religions = []
  for (const { h, i } of religionCols) {
    const pctRaw = parseFloat(cols[i])
    if (!isNaN(pctRaw) && pctRaw > 0) {
      religions.push({ name: h, pct: pctRaw })
    }
  }

  if (religions.length) {
    religions.sort((a, b) => b.pct - a.pct)
    out[iso2] = religions
  }
}

writeFileSync('public/data/religions.json', JSON.stringify(out, null, 2))
console.log(`Written ${Object.keys(out).length} countries to public/data/religions.json`)

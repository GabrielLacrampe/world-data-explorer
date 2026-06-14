import { writeFileSync } from 'node:fs'

// Transparency International CPI (wide format: one row per country, columns = years)
// Scale changed in 2012: pre-2012 is 0-10, 2012+ is 0-100. We use 2015 (0-100 scale).
const CPI_URL = 'https://raw.githubusercontent.com/datasets/corruption-perceptions-index/main/data/cpi.csv'
const COUNTRIES_URL = 'https://cdn.jsdelivr.net/npm/world-countries/countries.json'

console.log('Fetching CPI data...')
const [csvText, worldCountries] = await Promise.all([
  fetch(CPI_URL).then(r => r.text()),
  fetch(COUNTRIES_URL).then(r => r.json()),
])

const nameToIso2 = {}
for (const c of worldCountries) {
  nameToIso2[c.name.common.toLowerCase()] = c.cca2
  nameToIso2[c.name.official.toLowerCase()] = c.cca2
}

const OVERRIDES = {
  'united states': 'US', 'russia': 'RU', 'south korea': 'KR', 'north korea': 'KP',
  'iran': 'IR', 'syria': 'SY', 'vietnam': 'VN', 'bolivia': 'BO', 'tanzania': 'TZ',
  'moldova': 'MD', 'venezuela': 'VE', "cote d'ivoire": 'CI', "côte d'ivoire": 'CI',
  'czech republic': 'CZ', 'czechia': 'CZ', 'congo, dem. rep.': 'CD',
  'congo, republic': 'CG', 'laos': 'LA', 'myanmar': 'MM', 'timor-leste': 'TL',
  'eswatini': 'SZ', 'swaziland': 'SZ', 'cabo verde': 'CV', 'turkey': 'TR',
  'united kingdom': 'GB', 'taiwan': 'TW', 'the gambia': 'GM', 'gambia': 'GM',
  'north macedonia': 'MK', 'brunei': 'BN', 'sao tome and principe': 'ST',
  'st. kitts and nevis': 'KN', 'st. vincent and the grenadines': 'VC',
  'st. lucia': 'LC', 'trinidad and tobago': 'TT', 'micronesia': 'FM',
  'kyrgyzstan': 'KG', 'bosnia and herzegovina': 'BA',
  'congo republic': 'CG', "côte d´ivoire": 'CI', "cote d´ivoire": 'CI',
  'korea (north)': 'KP', 'korea (south)': 'KR',
  'the fyr of macedonia': 'MK', 'the united states of america': 'US',
}

const lines = csvText.trim().split('\n')
const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())

// Use last year on 0-100 scale (2012+). Last column = most recent available.
const yearCols = headers
  .map((h, i) => ({ year: parseInt(h), i }))
  .filter(({ year }) => year >= 2012)
  .sort((a, b) => b.year - a.year)

const { year: LATEST_YEAR, i: SCORE_COL } = yearCols[0]
const NAME_COL = 0

console.log(`Using year ${LATEST_YEAR} (column index ${SCORE_COL})`)

const out = {}
const unmatched = []

for (const line of lines.slice(1)) {
  const cols = line.split(',').map(v => v.replace(/"/g, '').trim())
  const rawName = cols[NAME_COL]?.toLowerCase()
  const scoreRaw = cols[SCORE_COL]
  if (!rawName || scoreRaw === '-' || scoreRaw === '') continue

  const score = parseFloat(scoreRaw)
  if (isNaN(score)) continue

  const iso2 = OVERRIDES[rawName] ?? nameToIso2[rawName]
  if (!iso2) { unmatched.push(cols[NAME_COL]); continue }

  out[iso2] = { score: Math.round(score), year: LATEST_YEAR }
}

if (unmatched.length) console.warn('Unmatched:', unmatched.join(', '))

writeFileSync('public/data/cpi.json', JSON.stringify(out, null, 2))
console.log(`Written ${Object.keys(out).length} countries to public/data/cpi.json (CPI ${LATEST_YEAR})`)

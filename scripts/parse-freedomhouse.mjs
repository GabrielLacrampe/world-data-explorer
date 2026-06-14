import { readFileSync, writeFileSync } from 'node:fs'
import { read, utils } from 'xlsx'

const LATEST_YEAR = 2026

const wb = read(readFileSync('scripts/all_data_fiw_2013-2026.xlsx'))
const ws = wb.Sheets['FIW13-26']

// Row 0 = sheet title, Row 1 = real headers
const rows = utils.sheet_to_json(ws, { header: 1 })
const headers = rows[1]
const data    = rows.slice(2)

const col = (name) => headers.indexOf(name)
const C_COUNTRY = col('Country/Territory')
const C_CT      = col('C/T')       // 'c' = country, 't' = territory
const C_EDITION = col('Edition')
const C_STATUS  = col('Status')
const C_PR      = col('PR rating')
const C_CL      = col('CL rating')

// world-countries for name → ISO-2 mapping
console.log('Fetching country name → ISO-2 map...')
const worldCountries = await fetch('https://cdn.jsdelivr.net/npm/world-countries/countries.json').then(r => r.json())

const nameToIso2 = {}
for (const c of worldCountries) {
  nameToIso2[c.name.common.toLowerCase()] = c.cca2
  nameToIso2[c.name.official.toLowerCase()] = c.cca2
  for (const t of Object.values(c.translations ?? {})) {
    if (t.common) nameToIso2[t.common.toLowerCase()] = c.cca2
  }
}

const OVERRIDES = {
  'united states': 'US',
  'russia': 'RU',
  'south korea': 'KR',
  'north korea': 'KP',
  'iran': 'IR',
  'syria': 'SY',
  'vietnam': 'VN',
  'bolivia': 'BO',
  'tanzania': 'TZ',
  'moldova': 'MD',
  'venezuela': 'VE',
  "côte d'ivoire": 'CI',
  "cote d'ivoire": 'CI',
  'ivory coast': 'CI',
  'czech republic': 'CZ',
  'czechia': 'CZ',
  'dr congo': 'CD',
  'democratic republic of the congo': 'CD',
  'republic of the congo': 'CG',
  'congo (brazzaville)': 'CG',
  'congo (kinshasa)': 'CD',
  'laos': 'LA',
  'myanmar': 'MM',
  'burma': 'MM',
  'timor-leste': 'TL',
  'east timor': 'TL',
  'eswatini': 'SZ',
  'swaziland': 'SZ',
  'cabo verde': 'CV',
  'cape verde': 'CV',
  'turkey': 'TR',
  'turkiye': 'TR',
  'united kingdom': 'GB',
  'palestine': 'PS',
  'taiwan': 'TW',
  'the gambia': 'GM',
  'gambia': 'GM',
  'micronesia': 'FM',
  'north macedonia': 'MK',
  'macedonia': 'MK',
  'brunei': 'BN',
  'st. kitts and nevis': 'KN',
  'st. vincent and the grenadines': 'VC',
  'st. lucia': 'LC',
  'trinidad and tobago': 'TT',
  'são tomé and príncipe': 'ST',
  'sao tome and principe': 'ST',
}

const STATUS_LABEL = { 'F': 'Free', 'PF': 'Partly Free', 'NF': 'Not Free' }

const out = {}
const unmatched = []

for (const row of data) {
  const edition = row[C_EDITION]
  if (edition !== LATEST_YEAR) continue

  const ctType = row[C_CT]  // skip territories, keep countries only
  if (ctType === 't') continue

  const rawName = String(row[C_COUNTRY] ?? '').trim()
  const status  = row[C_STATUS]
  const pr      = row[C_PR]
  const cl      = row[C_CL]

  if (!rawName || !status) continue

  const key = rawName.toLowerCase()
  const iso2 = OVERRIDES[key] ?? nameToIso2[key]

  if (!iso2) {
    unmatched.push(rawName)
    continue
  }

  out[iso2] = {
    status: STATUS_LABEL[status] ?? status,
    pr,  // Political Rights score 1–7 (1=most free)
    cl,  // Civil Liberties score 1–7
  }
}

if (unmatched.length) {
  console.warn(`\nUnmatched countries (${unmatched.length}):`, unmatched.join(', '))
}

writeFileSync('public/data/freedomhouse.json', JSON.stringify(out, null, 2))
console.log(`Written ${Object.keys(out).length} countries to public/data/freedomhouse.json (${LATEST_YEAR} data)`)

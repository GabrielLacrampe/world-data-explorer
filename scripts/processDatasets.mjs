import { readFileSync, writeFileSync, mkdirSync, existsSync, createReadStream } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'
import Papa from 'papaparse'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RAW = join(__dirname, 'raw')
const OUT = join(__dirname, '..', 'public', 'data')

mkdirSync(OUT, { recursive: true })

// ─── SIPRI ────────────────────────────────────────────────────────────────────

const SIPRI_ISO2_MAP = {
  'United States of America': 'US',
  'Russian Federation': 'RU',
  'Russia': 'RU',
  'Korea, South': 'KR',
  'Korea, North': 'KP',
  "China, People's Republic of": 'CN',
  'China': 'CN',
  'Iran, Islamic Republic of': 'IR',
  'Syrian Arab Republic': 'SY',
  'Venezuela, RB': 'VE',
  'Egypt, Arab Rep.': 'EG',
  'United Kingdom': 'GB',
  'Czech Republic': 'CZ',
  'Germany': 'DE',
  'France': 'FR',
  'Japan': 'JP',
  'India': 'IN',
  'Brazil': 'BR',
  'Canada': 'CA',
  'Australia': 'AU',
  'Spain': 'ES',
  'Italy': 'IT',
  'Mexico': 'MX',
  'Indonesia': 'ID',
  'Saudi Arabia': 'SA',
  'Turkey': 'TR',
  'Netherlands': 'NL',
  'Switzerland': 'CH',
  'Argentina': 'AR',
  'Poland': 'PL',
  'Sweden': 'SE',
  'Belgium': 'BE',
  'Norway': 'NO',
  'Austria': 'AT',
  'Denmark': 'DK',
  'South Africa': 'ZA',
  'Nigeria': 'NG',
  'Egypt': 'EG',
  'Israel': 'IL',
  'Thailand': 'TH',
  'Malaysia': 'MY',
  'Viet Nam': 'VN',
  'Philippines': 'PH',
  'Pakistan': 'PK',
  'Bangladesh': 'BD',
  'Ukraine': 'UA',
  'Iraq': 'IQ',
  'Colombia': 'CO',
  'Chile': 'CL',
  'Portugal': 'PT',
  'Greece': 'GR',
  'Romania': 'RO',
  'Hungary': 'HU',
  'Finland': 'FI',
  'Slovakia': 'SK',
  'Croatia': 'HR',
  'Bulgaria': 'BG',
  'Serbia': 'RS',
  'Algeria': 'DZ',
  'Morocco': 'MA',
  'Libya': 'LY',
  'Sudan': 'SD',
  'Ethiopia': 'ET',
  'Kenya': 'KE',
  'Tanzania': 'TZ',
  'Ghana': 'GH',
  'Angola': 'AO',
  'Mozambique': 'MZ',
  'Zimbabwe': 'ZW',
  'Qatar': 'QA',
  'United Arab Emirates': 'AE',
  'Kuwait': 'KW',
  'Oman': 'OM',
  'Jordan': 'JO',
  'Lebanon': 'LB',
  'Afghanistan': 'AF',
  'Myanmar': 'MM',
  'Sri Lanka': 'LK',
  'Cambodia': 'KH',
  'Singapore': 'SG',
  'New Zealand': 'NZ',
  'Ireland': 'IE',
  'Luxembourg': 'LU',
  'Estonia': 'EE',
  'Latvia': 'LV',
  'Lithuania': 'LT',
  'Belarus': 'BY',
  'Georgia': 'GE',
  'Armenia': 'AM',
  'Azerbaijan': 'AZ',
  'Kazakhstan': 'KZ',
  'Uzbekistan': 'UZ',
  'Taiwan': 'TW',
}

function processSIPRI() {
  const filePath = join(RAW, 'sipri-milex.xlsx')
  if (!existsSync(filePath)) {
    console.log('SIPRI: file not found, skipping')
    return
  }

  console.log('Processing SIPRI...')
  const wb = XLSX.readFile(filePath)

  const sheetName = wb.SheetNames.find(
    (n) => n.toLowerCase().includes('current') && n.toLowerCase().includes('us')
  )

  if (!sheetName) {
    console.error('SIPRI: Could not find Current USD sheet. Available:', wb.SheetNames)
    return
  }

  const sheet = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

  const headerRow = rows.find((r) => r.some((cell) => typeof cell === 'number' && cell > 1900))
  if (!headerRow) {
    console.error('SIPRI: Could not find year header row')
    return
  }

  const headerIdx = rows.indexOf(headerRow)
  const years = headerRow.map((cell) => cell)

  const result = {}

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    const countryName = row[0]
    if (!countryName || typeof countryName !== 'string') continue

    const iso2 = SIPRI_ISO2_MAP[countryName]
    if (!iso2) continue

    for (let j = years.length - 1; j >= 0; j--) {
      const val = row[j]
      if (val !== null && val !== 'xxx' && typeof val === 'number') {
        result[iso2] = Math.round(val)
        break
      }
    }
  }

  writeFileSync(join(OUT, 'sipri.json'), JSON.stringify(result, null, 2))
  console.log(`SIPRI: wrote ${Object.keys(result).length} countries`)
}

// ─── V-DEM ────────────────────────────────────────────────────────────────────

const ISO3_TO_ISO2 = {
  USA: 'US', CHN: 'CN', DEU: 'DE', FRA: 'FR', GBR: 'GB', RUS: 'RU',
  JPN: 'JP', IND: 'IN', BRA: 'BR', CAN: 'CA', AUS: 'AU', ESP: 'ES',
  ITA: 'IT', MEX: 'MX', KOR: 'KR', IDN: 'ID', SAU: 'SA', TUR: 'TR',
  NLD: 'NL', CHE: 'CH', ARG: 'AR', POL: 'PL', SWE: 'SE', BEL: 'BE',
  NOR: 'NO', AUT: 'AT', DNK: 'DK', ZAF: 'ZA', NGA: 'NG', EGY: 'EG',
  IRN: 'IR', ISR: 'IL', THA: 'TH', MYS: 'MY', VNM: 'VN', PHL: 'PH',
  PAK: 'PK', BGD: 'BD', UKR: 'UA', IRQ: 'IQ', SYR: 'SY', VEN: 'VE',
  COL: 'CO', CHL: 'CL', PRT: 'PT', GRC: 'GR', ROU: 'RO', HUN: 'HU',
  CZE: 'CZ', FIN: 'FI', SVK: 'SK', HRV: 'HR', BGR: 'BG', SRB: 'RS',
  DZA: 'DZ', MAR: 'MA', LBY: 'LY', SDN: 'SD', ETH: 'ET', KEN: 'KE',
  TZA: 'TZ', GHA: 'GH', AGO: 'AO', MOZ: 'MZ', ZWE: 'ZW', QAT: 'QA',
  ARE: 'AE', KWT: 'KW', OMN: 'OM', JOR: 'JO', LBN: 'LB', AFG: 'AF',
  MMR: 'MM', LKA: 'LK', KHM: 'KH', SGP: 'SG', NZL: 'NZ', IRL: 'IE',
  LUX: 'LU', EST: 'EE', LVA: 'LV', LTU: 'LT', BLR: 'BY', GEO: 'GE',
  ARM: 'AM', AZE: 'AZ', KAZ: 'KZ', UZB: 'UZ', TWN: 'TW', PRK: 'KP',
  MKD: 'MK', ALB: 'AL', BIH: 'BA', MNE: 'ME', MLT: 'MT', CYP: 'CY',
  ISL: 'IS', MDA: 'MD', XKX: 'XK', URY: 'UY', PRY: 'PY', BOL: 'BO',
  ECU: 'EC', PER: 'PE', GTM: 'GT', HND: 'HN', SLV: 'SV', NIC: 'NI',
  CRI: 'CR', PAN: 'PA', CUB: 'CU', DOM: 'DO', JAM: 'JM', HTI: 'HT',
  TTO: 'TT', TUN: 'TN', SEN: 'SN', CMR: 'CM', CIV: 'CI', MDG: 'MG',
  ZMB: 'ZM', BWA: 'BW', NAM: 'NA', RWA: 'RW', UGA: 'UG', MLI: 'ML',
  BFA: 'BF', NER: 'NE', TCD: 'TD', CAF: 'CF', COD: 'CD', COG: 'CG',
  GAB: 'GA', GNQ: 'GQ', SOM: 'SO', ERI: 'ER', DJI: 'DJ', YEM: 'YE',
  BHR: 'BH', PSE: 'PS', NPL: 'NP', MDV: 'MV', BTN: 'BT', PNG: 'PG',
  FJI: 'FJ', MNG: 'MN', KGZ: 'KG', TJK: 'TJ', TKM: 'TM',
}

function processVDem() {
  const filePath = join(RAW, 'vdem-core.csv')
  if (!existsSync(filePath)) {
    console.log('V-Dem: file not found, skipping')
    return Promise.resolve()
  }

  console.log('Processing V-Dem...')
  const latest = {}

  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, { encoding: 'utf-8' })
    let header = null
    let buffer = ''
    let isoIdx = -1, yearIdx = -1, scoreIdx = -1

    stream.on('data', (chunk) => {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop() // keep incomplete last line

      for (const line of lines) {
        if (!line.trim()) continue

        if (!header) {
          header = line.split(',').map(h => h.trim().replace(/^"|"$/g, ''))
          isoIdx = header.indexOf('country_text_id')
          yearIdx = header.indexOf('year')
          scoreIdx = header.indexOf('v2x_libdem')
          if (isoIdx === -1 || yearIdx === -1 || scoreIdx === -1) {
            reject(new Error(`V-Dem: missing columns. Found: ${header.slice(0, 10).join(', ')}`))
            stream.destroy()
          }
          continue
        }

        const cols = line.split(',')
        const iso3 = cols[isoIdx]?.replace(/^"|"$/g, '').trim()
        const year = parseInt(cols[yearIdx], 10)
        const score = parseFloat(cols[scoreIdx])

        if (!iso3 || isNaN(year) || isNaN(score)) continue
        if (!latest[iso3] || year > latest[iso3].year) {
          latest[iso3] = { year, score }
        }
      }
    })

    stream.on('end', () => {
      const result = {}
      for (const [iso3, { score }] of Object.entries(latest)) {
        const iso2 = ISO3_TO_ISO2[iso3]
        if (iso2) result[iso2] = Math.round(score * 1000) / 1000
      }
      writeFileSync(join(OUT, 'vdem.json'), JSON.stringify(result, null, 2))
      console.log(`V-Dem: wrote ${Object.keys(result).length} countries`)
      resolve()
    })

    stream.on('error', reject)
  })
}

// ─── FREEDOM HOUSE ────────────────────────────────────────────────────────────
// Skipped until data arrives — will be added when freedomhouse-2025.xlsx is in scripts/raw/

function processFreedomHouse() {
  const filePath = join(RAW, 'freedomhouse-2025.xlsx')
  if (!existsSync(filePath)) {
    console.log('Freedom House: file not found, skipping (pending data request)')
    return
  }

  console.log('Processing Freedom House...')
  const wb = XLSX.readFile(filePath)

  const sheetName = wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null })

  const result = {}

  for (const row of rows) {
    const iso2 = row['ISO2'] || row['Country/Territory ISO2'] || row['iso2'] || row['Code']
    const status = row['Status'] || row['status'] || row['Freedom Status']
    const year = row['Edition'] || row['Year'] || row['edition']

    if (!iso2 || !status) continue
    if (typeof iso2 !== 'string' || iso2.length !== 2) continue

    if (!result[iso2] || (year && year > (result[iso2].year ?? 0))) {
      result[iso2] = { status: status.trim(), year }
    }
  }

  const cleaned = {}
  for (const [iso2, { status }] of Object.entries(result)) {
    cleaned[iso2] = status
  }

  writeFileSync(join(OUT, 'freedomhouse.json'), JSON.stringify(cleaned, null, 2))
  console.log(`Freedom House: wrote ${Object.keys(cleaned).length} countries`)
}

// ─── COW ALLIANCES ────────────────────────────────────────────────────────────

const COW_TO_ISO2 = {
  2: 'US', 20: 'CA', 70: 'MX', 140: 'BR', 160: 'AR', 200: 'GB',
  205: 'IE', 210: 'NL', 211: 'BE', 212: 'LU', 220: 'FR', 225: 'CH',
  230: 'ES', 235: 'PT', 255: 'DE', 267: 'AT', 290: 'PL', 300: 'HU',
  305: 'CZ', 310: 'SK', 315: 'SK', 325: 'IT', 338: 'AL', 339: 'ME',
  340: 'RS', 344: 'HR', 349: 'SI', 350: 'GR', 352: 'CY', 355: 'BG',
  360: 'RO', 365: 'RU', 366: 'EE', 367: 'LV', 368: 'LT', 369: 'UA',
  370: 'BY', 375: 'FI', 380: 'SE', 385: 'NO', 390: 'DK', 395: 'IS',
  411: 'LR', 432: 'ML', 433: 'SN', 452: 'GH', 475: 'NG', 483: 'CF',
  484: 'CG', 490: 'CD', 500: 'UG', 501: 'KE', 510: 'TZ', 516: 'BI',
  517: 'RW', 520: 'SO', 522: 'DJ', 530: 'ET', 540: 'MZ', 552: 'ZW',
  560: 'ZA', 600: 'MA', 615: 'DZ', 616: 'TN', 620: 'LY', 625: 'SD',
  630: 'IR', 640: 'TR', 645: 'IQ', 651: 'EG', 660: 'LB', 663: 'JO',
  666: 'IL', 670: 'SA', 678: 'YE', 690: 'KW', 694: 'QA', 696: 'AE',
  700: 'AF', 710: 'CN', 713: 'TW', 731: 'KP', 732: 'KR', 740: 'JP',
  750: 'IN', 760: 'BT', 770: 'PK', 771: 'BD', 775: 'MM', 780: 'LK',
  800: 'TH', 811: 'KH', 812: 'LA', 816: 'VN', 820: 'MY', 830: 'SG',
  840: 'PH', 850: 'ID', 900: 'AU', 920: 'NZ',
}

const ALLIANCE_TYPES = {
  1: 'Defense Pact',
  2: 'Neutrality Pact',
  3: 'Non-Aggression Treaty',
  4: 'Entente',
}

function processCOW() {
  const filePath = join(RAW, 'cow-alliances.csv')
  if (!existsSync(filePath)) {
    console.log('COW: file not found, skipping')
    return
  }

  console.log('Processing COW Alliances...')
  const raw = readFileSync(filePath, 'utf-8')
  const { data } = Papa.parse(raw, { header: true, skipEmptyLines: true })

  const result = {}

  for (const row of data) {
    const cowCode = parseInt(row.ccode, 10)
    // right_censor=1 means the alliance was still active at end of data collection
    if (parseInt(row.right_censor, 10) !== 1) continue

    const iso2 = COW_TO_ISO2[cowCode]
    if (!iso2) continue

    if (!result[iso2]) result[iso2] = []

    // Each row has boolean columns for alliance types
    if (parseInt(row.defense, 10) === 1 && !result[iso2].includes('Defense Pact'))
      result[iso2].push('Defense Pact')
    if (parseInt(row.neutrality, 10) === 1 && !result[iso2].includes('Neutrality Pact'))
      result[iso2].push('Neutrality Pact')
    if (parseInt(row.nonaggression, 10) === 1 && !result[iso2].includes('Non-Aggression Treaty'))
      result[iso2].push('Non-Aggression Treaty')
    if (parseInt(row.entente, 10) === 1 && !result[iso2].includes('Entente'))
      result[iso2].push('Entente')
  }

  writeFileSync(join(OUT, 'alliances.json'), JSON.stringify(result, null, 2))
  console.log(`COW: wrote ${Object.keys(result).length} countries`)
}

// ─── Run all ──────────────────────────────────────────────────────────────────
processSIPRI()
processFreedomHouse()
processCOW()
await processVDem()

console.log('\nDone. Output in public/data/')

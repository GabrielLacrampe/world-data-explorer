import { writeFileSync } from 'node:fs'

// CIA World Factbook via factbook/factbook.json on GitHub
// Regions subdirectories with 2-letter CIA codes (different from ISO-2 in some cases)
const BASE = 'https://raw.githubusercontent.com/factbook/factbook.json/master'

// Fetch the repo's top-level to discover region directories
const REGIONS = [
  'africa', 'australia-oceania', 'central-america-n-caribbean',
  'central-asia', 'east-n-southeast-asia', 'europe',
  'middle-east', 'north-america', 'oceans', 'polar', 'south-america',
  'south-asia', 'world',
]

// CIA factbook 2-letter code → ISO-2 mapping (where they differ)
// CIA uses FIPS 10-4 codes, which diverge from ISO-3166 for many countries
const CIA_TO_ISO2 = {
  'af': 'AF', 'al': 'AL', 'ag': 'DZ', 'an': 'AD', 'ao': 'AO', 'ac': 'AG',
  'ar': 'AR', 'am': 'AM', 'as': 'AU', 'au': 'AT', 'aj': 'AZ', 'bf': 'BS',
  'ba': 'BH', 'bg': 'BD', 'bb': 'BB', 'bo': 'BY', 'be': 'BE', 'bh': 'BZ',
  'bn': 'BJ', 'bt': 'BT', 'bl': 'BO', 'bk': 'BA', 'bc': 'BW', 'br': 'BR',
  'bx': 'BN', 'bu': 'BG', 'uv': 'BF', 'bm': 'MM', 'by': 'BI', 'cb': 'KH',
  'cm': 'CM', 'ca': 'CA', 'cv': 'CV', 'ct': 'CF', 'cd': 'TD', 'ci': 'CL',
  'ch': 'CN', 'co': 'CO', 'cn': 'KM', 'cg': 'CD', 'cf': 'CG', 'cs': 'CR',
  'iv': 'CI', 'hr': 'HR', 'cu': 'CU', 'cy': 'CY', 'ez': 'CZ', 'da': 'DK',
  'dj': 'DJ', 'do': 'DM', 'dr': 'DO', 'ec': 'EC', 'eg': 'EG', 'es': 'SV',
  'ek': 'GQ', 'er': 'ER', 'en': 'EE', 'et': 'ET', 'fj': 'FJ', 'fi': 'FI',
  'fr': 'FR', 'gb': 'GA', 'gg': 'GE', 'gm': 'DE', 'gh': 'GH', 'gr': 'GR',
  'gj': 'GD', 'gt': 'GT', 'gv': 'GN', 'pu': 'GW', 'gy': 'GY', 'ha': 'HT',
  'ho': 'HN', 'hk': 'HK', 'hu': 'HU', 'ic': 'IS', 'in': 'IN', 'id': 'ID',
  'ir': 'IR', 'iz': 'IQ', 'ei': 'IE', 'is': 'IL', 'it': 'IT', 'jm': 'JM',
  'ja': 'JP', 'jo': 'JO', 'kz': 'KZ', 'ke': 'KE', 'kr': 'KI', 'kn': 'KP',
  'ks': 'KR', 'ku': 'KW', 'kg': 'KG', 'la': 'LA', 'lg': 'LV', 'le': 'LB',
  'lt': 'LS', 'li': 'LR', 'ly': 'LY', 'ls': 'LI', 'lh': 'LT', 'lu': 'LU',
  'mc': 'MK', 'mg': 'MG', 'mi': 'MW', 'my': 'MY', 'mv': 'MV', 'ml': 'ML',
  'mt': 'MT', 'rm': 'MH', 'mr': 'MR', 'mp': 'MU', 'mx': 'MX', 'fm': 'FM',
  'md': 'MD', 'mn': 'MC', 'mg': 'MN', 'mo': 'ME', 'ma': 'MA', 'mz': 'MZ',
  'wa': 'NA', 'nr': 'NR', 'np': 'NP', 'nl': 'NL', 'nz': 'NZ', 'nu': 'NI',
  'ng': 'NE', 'ni': 'NG', 'no': 'NO', 'mu': 'OM', 'pk': 'PK', 'ps': 'PW',
  'pm': 'PA', 'pp': 'PG', 'pa': 'PY', 'pe': 'PE', 'rp': 'PH', 'pl': 'PL',
  'po': 'PT', 'qa': 'QA', 'ro': 'RO', 'rs': 'RU', 'rw': 'RW', 'sc': 'KN',
  'st': 'LC', 'vc': 'VC', 'ws': 'WS', 'sm': 'SM', 'tp': 'ST', 'sa': 'SA',
  'sg': 'SN', 'ri': 'RS', 'se': 'SC', 'sl': 'SL', 'sn': 'SG', 'lo': 'SK',
  'si': 'SI', 'bp': 'SB', 'so': 'SO', 'sf': 'ZA', 'sp': 'ES', 'ce': 'LK',
  'su': 'SD', 'ns': 'SS', 'wz': 'SZ', 'sw': 'SE', 'sz': 'CH', 'sy': 'SY',
  'tw': 'TW', 'ti': 'TJ', 'tz': 'TZ', 'th': 'TH', 'tt': 'TL', 'to': 'TG',
  'tn': 'TO', 'td': 'TT', 'ts': 'TN', 'tu': 'TR', 'tx': 'TM', 'tv': 'TV',
  'ug': 'UG', 'up': 'UA', 'ae': 'AE', 'uk': 'GB', 'us': 'US', 'uy': 'UY',
  'uz': 'UZ', 'nh': 'VU', 've': 'VE', 'vm': 'VN', 'ym': 'YE', 'za': 'ZM',
  'zi': 'ZW', 'mj': 'ME', 'kv': 'XK', 'pu': 'GW',
}

async function fetchJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'WorldDataExplorer/1.0' } })
  if (!r.ok) return null
  try { return await r.json() } catch { return null }
}

// Known CIA code → region mapping (avoids GitHub API entirely)
const COUNTRY_FILES = {
  'africa': ['ag','ao','bc','bn','by','cd','cf','cg','cm','cn','ct','cv','dj','eg','ek','en','er','et',
             'ga','gb','gg','gh','gv','iv','ke','lb','lg','li','ln','lo','lt','ly','ma','mg','mi','ml',
             'mo','mp','mr','mz','ng','ni','od','pu','rw','se','sf','sg','sl','so','su','tg','tn','to',
             'tp','ts','tz','uv','wa','wi','wz','za','zi'],
  'australia-oceania': ['as','bp','ck','cq','cr','fj','fm','fp','gq','kr','nc','nf','nh','nr','nz',
                        'pc','pf','pg','ps','rm','tb','tl','tv','um','wf','ws'],
  'central-america-n-caribbean': ['aa','ac','av','ax','bb','bh','bf','bf','cj','co','cs','cu','do',
                                   'dr','es','gj','gt','ha','ho','jm','mh','nn','nu','pm','rn','rq',
                                   'sc','st','td','uc','vc','vi','vq'],
  'central-asia': ['kz','kg','ti','tx','uz'],
  'east-n-southeast-asia': ['bm','bn','cb','ch','hk','id','ja','km','kn','ks','la','mc','mg','my',
                              'pp','rp','sn','th','tt','tw','vm'],
  'europe': ['al','an','au','be','bk','bo','bu','cy','da','ee','ei','en','ez','fi','fr','gm','gr',
              'hr','hu','ic','it','kv','lg','lh','lo','ls','lu','mc','md','mj','mk','mn','mt','nl',
              'no','pl','po','ri','ro','rs','si','sm','sp','sw','sz','ti','uk','up','ur','vt'],
  'middle-east': ['ae','ba','eg','ir','is','iz','jo','ku','le','ly','mu','qa','sa','sy','tu','we','ym'],
  'north-america': ['bd','bf','ca','gl','mx','sb','us'],
  'oceans': [],
  'polar': [],
  'south-america': ['ar','bl','br','ci','co','ec','fk','gy','pa','pe','sr','uy','ve'],
  'south-asia': ['af','bg','bt','ce','in','mv','np','pk'],
  'world': [],
}

function parseEthnicText(text) {
  if (!text) return []
  // Strip HTML tags
  const clean = text.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ')
  // Match "Name XX.X%" patterns
  const matches = [...clean.matchAll(/([A-ZÀ-ÿa-z][A-Za-zÀ-ÿ\s\-'\.]{1,35}?)\s+([\d]+(?:\.[\d]+)?)\s*%/g)]

  const groups = []
  const seen = new Set()

  for (const m of matches) {
    const name = m[1].trim().replace(/\s+/g, ' ')
    const pct  = parseFloat(m[2])
    if (!name || isNaN(pct) || pct <= 0 || pct > 100) continue
    if (seen.has(name.toLowerCase())) continue
    if (/note|includes|data|estimate|census|percent|approximately/i.test(name)) continue
    if (name.length > 40) continue
    seen.add(name.toLowerCase())
    groups.push({ name, pct })
  }

  return groups.sort((a, b) => b.pct - a.pct)
}

const BASE_RAW = 'https://raw.githubusercontent.com/factbook/factbook.json/master'

const out = {}
let fetched = 0
let skipped = 0

for (const [region, codes] of Object.entries(COUNTRY_FILES)) {
  if (!codes.length) continue
  for (const code of codes) {
    const iso2 = CIA_TO_ISO2[code] ?? code.toUpperCase()
    const url  = `${BASE_RAW}/${region}/${code}.json`
    const data = await fetchJson(url)
    if (!data) { skipped++; continue }

    const ethnicText = data['People and Society']?.['Ethnic groups']?.text
                    ?? data['People']?.['Ethnic groups']?.text
    if (!ethnicText) { skipped++; continue }

    const groups = parseEthnicText(ethnicText)
    if (groups.length > 0) {
      out[iso2] = groups
      fetched++
    } else {
      skipped++
    }
  }
  console.log(`  ${region}: done (${fetched} so far)`)
}

writeFileSync('public/data/ethnicGroups.json', JSON.stringify(out, null, 2))
console.log(`\nWritten ${Object.keys(out).length} countries (fetched: ${fetched}, skipped/no-data: ${skipped})`)

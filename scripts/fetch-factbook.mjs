import { writeFileSync } from 'node:fs'

const BASE_RAW = 'https://raw.githubusercontent.com/factbook/factbook.json/master'

const COUNTRY_FILES = {
  'africa': ['ag','ao','bc','bn','by','cd','cf','cg','cm','cn','ct','cv','dj','eg','ek','en','er','et',
             'ga','gb','gg','gh','gv','iv','ke','lb','lg','li','ln','lo','lt','ly','ma','mg','mi','ml',
             'mo','mp','mr','mz','ng','ni','od','pu','rw','se','sf','sg','sl','so','su','tg','tn','to',
             'tp','ts','tz','uv','wa','wi','wz','za','zi'],
  'australia-oceania': ['as','bp','ck','cq','cr','fj','fm','fp','gq','kr','nc','nf','nh','nr','nz',
                        'pc','pf','pg','ps','rm','tb','tl','tv','um','wf','ws'],
  'central-america-n-caribbean': ['aa','ac','av','ax','bb','bh','bf','cj','co','cs','cu','do',
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
  'south-america': ['ar','bl','br','ci','co','ec','fk','gy','pa','pe','sr','uy','ve'],
  'south-asia': ['af','bg','bt','ce','in','mv','np','pk'],
}

const CIA_TO_ISO2 = {
  'af':'AF','al':'AL','ag':'DZ','an':'AD','ao':'AO','ac':'AG','ar':'AR','am':'AM','as':'AU','au':'AT',
  'aj':'AZ','bf':'BS','ba':'BH','bg':'BD','bb':'BB','bo':'BY','be':'BE','bh':'BZ','bn':'BJ','bt':'BT',
  'bl':'BO','bk':'BA','bc':'BW','br':'BR','bx':'BN','bu':'BG','uv':'BF','bm':'MM','by':'BI','cb':'KH',
  'cm':'CM','ca':'CA','cv':'CV','ct':'CF','cd':'TD','ci':'CL','ch':'CN','co':'CO','cn':'KM','cg':'CD',
  'cf':'CG','cs':'CR','iv':'CI','hr':'HR','cu':'CU','cy':'CY','ez':'CZ','da':'DK','dj':'DJ','do':'DM',
  'dr':'DO','ec':'EC','eg':'EG','es':'SV','ek':'GQ','er':'ER','en':'EE','et':'ET','fj':'FJ','fi':'FI',
  'fr':'FR','gb':'GA','gg':'GE','gm':'DE','gh':'GH','gr':'GR','gj':'GD','gt':'GT','gv':'GN','pu':'GW',
  'gy':'GY','ha':'HT','ho':'HN','hk':'HK','hu':'HU','ic':'IS','in':'IN','id':'ID','ir':'IR','iz':'IQ',
  'ei':'IE','is':'IL','it':'IT','jm':'JM','ja':'JP','jo':'JO','kz':'KZ','ke':'KE','kr':'KI','kn':'KP',
  'ks':'KR','ku':'KW','kg':'KG','la':'LA','lg':'LV','le':'LB','lt':'LS','li':'LR','ly':'LY','ls':'LI',
  'lh':'LT','lu':'LU','mk':'MK','mg':'MG','mi':'MW','my':'MY','mv':'MV','ml':'ML','mt':'MT','rm':'MH',
  'mr':'MR','mp':'MU','mx':'MX','fm':'FM','md':'MD','mn':'MC','mo':'ME','ma':'MA','mz':'MZ','wa':'NA',
  'nr':'NR','np':'NP','nl':'NL','nz':'NZ','nu':'NI','ng':'NG','ni':'NE','no':'NO','mu':'OM','pk':'PK',
  'ps':'PW','pm':'PA','pp':'PG','pa':'PY','pe':'PE','rp':'PH','pl':'PL','po':'PT','qa':'QA','ro':'RO',
  'rs':'RU','rw':'RW','sc':'KN','st':'LC','vc':'VC','ws':'WS','sm':'SM','tp':'ST','sa':'SA','sg':'SN',
  'ri':'RS','se':'SC','sl':'SL','sn':'SG','lo':'SK','si':'SI','bp':'SB','so':'SO','sf':'ZA','sp':'ES',
  'ce':'LK','su':'SD','ns':'SS','wz':'SZ','sw':'SE','sz':'CH','sy':'SY','tw':'TW','ti':'TJ','tz':'TZ',
  'th':'TH','tt':'TL','to':'TG','tn':'TO','td':'TT','ts':'TN','tu':'TR','tx':'TM','tv':'TV','ug':'UG',
  'up':'UA','ae':'AE','uk':'GB','us':'US','uy':'UY','uz':'UZ','nh':'VU','ve':'VE','vm':'VN','ym':'YE',
  'za':'ZM','zi':'ZW','kv':'XK','od':'MG','ln':'LR','wi':'ZW','fk':'FK','bd':'BB','sb':'PM','gq':'GU',
  'mj':'ME','wb':'PS','we':'PS','rn':'RS','nn':'CW','ax':'BS','uc':'CW','vq':'VI','rq':'PR','cq':'MP',
  'tb':'PF','nc':'NC','pc':'PN','wf':'WF','fp':'PF','cr':'CC','nf':'NF','um':'UM',
}

async function fetchJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'WorldDataExplorer/1.0' } })
  if (!r.ok) return null
  try { return await r.json() } catch { return null }
}

function parsePercentText(text) {
  if (!text) return []
  const clean = text.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ')
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

function parsePartners(text) {
  if (!text) return []
  const clean = text.replace(/<[^>]+>/g, ' ')
  // Match "Country X%" patterns
  const matches = [...clean.matchAll(/([A-Z][A-Za-z\s]{2,25}?)\s+([\d]+(?:\.[\d]+)?)\s*%/g)]
  return matches
    .map(m => ({ name: m[1].trim(), pct: parseFloat(m[2]) }))
    .filter(p => p.name.length > 1 && !isNaN(p.pct))
    .slice(0, 8)
}

function parseResourcesList(text) {
  if (!text) return []
  const clean = text.replace(/<[^>]+>/g, '').replace(/\(.*?\)/g, '').replace(/note:.*/i, '')
  return clean.split(/[,;]/)
    .map(s => s.trim().replace(/\s+/g, ' '))
    .filter(s => s.length > 1 && s.length < 50)
    .slice(0, 10)
}

function parseGdpSectors(obj) {
  if (!obj) return null
  const get = (key) => {
    const text = obj[key]?.['data']?.['text'] ?? obj[key]?.['text'] ?? ''
    const m = text.match(/([\d.]+)\s*%/)
    return m ? parseFloat(m[1]) : null
  }
  const agriculture = get('agriculture') ?? get('Agriculture')
  const industry    = get('industry')    ?? get('Industry')
  const services    = get('services')    ?? get('Services')
  if (agriculture == null && industry == null && services == null) return null
  return { agriculture, industry, services }
}

function cleanText(text) {
  if (!text) return null
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200) || null
}

const ethnicGroups    = {}
const factbook        = {}
let processed = 0

for (const [region, codes] of Object.entries(COUNTRY_FILES)) {
  for (const code of codes) {
    const iso2 = CIA_TO_ISO2[code] ?? code.toUpperCase()
    const data = await fetchJson(`${BASE_RAW}/${region}/${code}.json`)
    if (!data) continue

    const people  = data['People and Society'] ?? data['People'] ?? {}
    const govt    = data['Government'] ?? {}
    const economy = data['Economy'] ?? {}
    const entry   = {}

    // Ethnic groups
    const ethnicText = people['Ethnic groups']?.text
    if (ethnicText) {
      const groups = parsePercentText(ethnicText)
      if (groups.length) ethnicGroups[iso2] = groups
    }

    // Languages
    const langText = people['Languages']?.['Languages']?.text ?? people['Languages']?.text
    if (langText) {
      const langs = parsePercentText(langText)
      if (langs.length) entry.languages = langs
    }

    // Government type
    const govType = cleanText(govt['Government type']?.text)
    if (govType) entry.govType = govType

    // Independence
    const independence = cleanText(govt['Independence']?.text)
    if (independence) entry.independence = independence

    // Natural resources
    const resourcesText = data['Geography']?.['Natural resources']?.text
                       ?? economy['Natural resources']?.text
    if (resourcesText) {
      const resources = parseResourcesList(resourcesText)
      if (resources.length) entry.naturalResources = resources
    }

    // GDP by sector
    const gdpSectorObj = economy['GDP - composition, by sector of origin']
                      ?? economy['GDP - composition by sector']
    if (gdpSectorObj) {
      const sectors = parseGdpSectors(gdpSectorObj)
      if (sectors) entry.gdpSectors = sectors
    }

    // Export partners
    const exportPartnersText = economy['Exports - partners']?.text
    if (exportPartnersText) {
      const partners = parsePartners(exportPartnersText)
      if (partners.length) entry.exportPartners = partners
    }

    // Import partners
    const importPartnersText = economy['Imports - partners']?.text
    if (importPartnersText) {
      const partners = parsePartners(importPartnersText)
      if (partners.length) entry.importPartners = partners
    }

    // Export commodities
    const exportCommoditiesText = economy['Exports - commodities']?.text
    if (exportCommoditiesText) {
      const items = parseResourcesList(exportCommoditiesText)
      if (items.length) entry.exportCommodities = items
    }

    if (Object.keys(entry).length) factbook[iso2] = entry
    processed++
  }
  console.log(`  ${region}: done`)
}

writeFileSync('public/data/ethnicGroups.json', JSON.stringify(ethnicGroups, null, 2))
writeFileSync('public/data/factbook.json',     JSON.stringify(factbook,     null, 2))
console.log(`\nProcessed ${processed} countries`)
console.log(`ethnicGroups: ${Object.keys(ethnicGroups).length} countries`)
console.log(`factbook:     ${Object.keys(factbook).length} countries`)

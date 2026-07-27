import { writeFileSync } from 'node:fs'
import { COUNTRY_FILES, CIA_TO_ISO2, fetchFactbookJson } from './factbook-countries.mjs'

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
    const iso2 = CIA_TO_ISO2[code]
    if (!iso2) continue // territory with no ISO country of its own
    const data = await fetchFactbookJson(region, code)
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

    // Literacy rate (total population)
    const literacyText = people['Literacy']?.['total population']?.text
                      ?? people['Literacy']?.text
    if (literacyText) {
      const m = literacyText.match(/([\d.]+)\s*%/)
      if (m) entry.literacyRate = parseFloat(m[1])
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

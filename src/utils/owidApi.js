const OWID_BASE = 'https://ourworldindata.org/grapher'

/**
 * Fetches an OWID chart CSV and returns data indexed as:
 * { year: { iso2: value, ... }, ... }
 *
 * allCountriesData (from store) is used to resolve OWID's ISO3 codes → ISO2.
 */
export async function fetchOwidHistorical(chartSlug, allCountriesData) {
  const url = `${OWID_BASE}/${chartSlug}.csv?csvType=full&useColumnShortNames=false`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`OWID fetch failed for "${chartSlug}": ${res.status}`)

  const text = await res.text()
  const iso3ToIso2 = buildIso3Map(allCountriesData)
  return parseCsv(text, iso3ToIso2)
}

function buildIso3Map(allCountriesData) {
  if (!allCountriesData) return {}
  const map = {}
  Object.entries(allCountriesData).forEach(([iso2, c]) => {
    if (c.cca3) map[c.cca3] = iso2
  })
  return map
}

function parseCsv(text, iso3ToIso2) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return {}

  const headers = splitCsvLine(lines[0])
  const codeIdx  = headers.findIndex(h => h === 'Code')
  const yearIdx  = headers.findIndex(h => h === 'Year')
  // Value column: last column (not Entity/Code/Year)
  const valueIdx = headers.length - 1

  if (codeIdx === -1 || yearIdx === -1) return {}

  const result = {}

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const cols = splitCsvLine(lines[i])

    const iso3  = cols[codeIdx]?.trim()
    const year  = parseInt(cols[yearIdx])
    const value = parseFloat(cols[valueIdx]?.trim())

    // Skip aggregate regions (e.g. OWID_WRL) and bad rows
    if (!iso3 || !/^[A-Z]{3}$/.test(iso3) || isNaN(year) || isNaN(value)) continue

    const iso2 = iso3ToIso2[iso3]
    if (!iso2) continue

    if (!result[year]) result[year] = {}
    result[year][iso2] = value
  }

  return result
}

// Minimal CSV line splitter that handles double-quoted fields
function splitCsvLine(line) {
  const result = []
  let inQuotes = false
  let current = ''

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

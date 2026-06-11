import { writeFileSync } from 'node:fs'

const ENDPOINT = 'https://query.wikidata.org/sparql'

const ETHNIC_QUERY = `
SELECT ?iso2 ?groupLabel ?pct WHERE {
  ?country wdt:P297 ?iso2 ;
           p:P172 ?stmt .
  ?stmt ps:P172 ?group .
  OPTIONAL { ?stmt pq:P1107 ?pct }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}
`

const RELIGION_QUERY = `
SELECT ?iso2 ?religionLabel ?pct WHERE {
  ?country wdt:P297 ?iso2 ;
           p:P140 ?stmt .
  ?stmt ps:P140 ?religion .
  OPTIONAL { ?stmt pq:P1107 ?pct }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}
`

async function sparql(query, label) {
  console.log(`Querying Wikidata for ${label}...`)
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/sparql-results+json',
      'User-Agent': 'WorldDataExplorer/1.0 (educational project)',
    },
    body: new URLSearchParams({ query }),
  })
  if (!res.ok) throw new Error(`SPARQL error ${res.status}: ${await res.text()}`)
  const { results } = await res.json()
  console.log(`  → ${results.bindings.length} rows`)
  return results.bindings
}

function groupByCountry(rows, nameKey, pctKey) {
  const out = {}
  for (const row of rows) {
    const iso2 = row.iso2?.value
    if (!iso2 || iso2.length !== 2) continue
    const name = row[nameKey]?.value
    if (!name) continue
    const pctRaw = row[pctKey]?.value
    const pct = pctRaw != null ? Math.round(parseFloat(pctRaw) * 1000) / 10 : null // 0.848 → 84.8

    if (!out[iso2]) out[iso2] = []
    // avoid duplicates
    if (!out[iso2].find(e => e.name === name)) {
      out[iso2].push({ name, pct })
    }
  }
  // sort each country: entries with % descending first, then no-% entries
  for (const iso2 of Object.keys(out)) {
    out[iso2].sort((a, b) => {
      if (a.pct != null && b.pct != null) return b.pct - a.pct
      if (a.pct != null) return -1
      if (b.pct != null) return 1
      return 0
    })
  }
  return out
}

const [ethnicRows, religionRows] = await Promise.all([
  sparql(ETHNIC_QUERY, 'ethnic groups'),
  sparql(RELIGION_QUERY, 'religions'),
])

const ethnicGroups = groupByCountry(ethnicRows, 'groupLabel', 'pct')
const religions    = groupByCountry(religionRows, 'religionLabel', 'pct')

writeFileSync('public/data/ethnicGroups.json', JSON.stringify(ethnicGroups, null, 2))
writeFileSync('public/data/religions.json',    JSON.stringify(religions,    null, 2))

console.log(`Written ethnicGroups: ${Object.keys(ethnicGroups).length} countries`)
console.log(`Written religions:    ${Object.keys(religions).length} countries`)

import { writeFileSync } from 'node:fs'

const ENDPOINT = 'https://query.wikidata.org/sparql'

const ACTIVE_QUERY = `
SELECT ?iso2 ?entityLabel ?active WHERE {
  ?entity wdt:P2229 ?active .
  ?entity wdt:P17 ?country .
  ?country wdt:P297 ?iso2 .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}
ORDER BY ?iso2
`

const RESERVE_QUERY = `
SELECT ?iso2 ?entityLabel ?reserve WHERE {
  ?entity wdt:P2230 ?reserve .
  ?entity wdt:P17 ?country .
  ?country wdt:P297 ?iso2 .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}
ORDER BY ?iso2
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

const [activeRows, reserveRows] = await Promise.all([
  sparql(ACTIVE_QUERY, 'active personnel'),
  sparql(RESERVE_QUERY, 'reserve personnel'),
])

// Print sample for debugging
console.log('\nSample active rows:')
activeRows.slice(0, 8).forEach(r => console.log(`  ${r.iso2?.value} | ${r.entityLabel?.value} | ${r.active?.value}`))
console.log('\nSample reserve rows:')
reserveRows.slice(0, 8).forEach(r => console.log(`  ${r.iso2?.value} | ${r.entityLabel?.value} | ${r.reserve?.value}`))

const out = {}

for (const row of activeRows) {
  const iso2 = row.iso2?.value
  if (!iso2 || iso2.length !== 2) continue
  const val = parseInt(row.active?.value)
  if (!isNaN(val)) {
    if (!out[iso2]) out[iso2] = {}
    // keep the largest value (national-level, not branch-level)
    if (out[iso2].active == null || val > out[iso2].active) out[iso2].active = val
  }
}

for (const row of reserveRows) {
  const iso2 = row.iso2?.value
  if (!iso2 || iso2.length !== 2) continue
  const val = parseInt(row.reserve?.value)
  if (!isNaN(val)) {
    if (!out[iso2]) out[iso2] = {}
    if (out[iso2].reserve == null || val > out[iso2].reserve) out[iso2].reserve = val
  }
}

writeFileSync('public/data/militaryPersonnel.json', JSON.stringify(out, null, 2))
console.log(`\nWritten ${Object.keys(out).length} countries to public/data/militaryPersonnel.json`)

import { writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const ENDPOINT = 'https://query.wikidata.org/sparql'

const QUERY = `
SELECT DISTINCT ?iso2
  ?hosLabel ?hosPartyLabel ?hosDob ?hosPhoto
  ?hogLabel ?hogPartyLabel ?hogDob ?hogPhoto
WHERE {
  ?country wdt:P297 ?iso2 .

  OPTIONAL {
    ?country wdt:P35 ?hos .
    OPTIONAL { ?hos wdt:P102 ?hosParty }
    OPTIONAL { ?hos wdt:P569 ?hosDob }
    OPTIONAL { ?hos wdt:P18 ?hosPhoto }
  }
  OPTIONAL {
    ?country wdt:P6 ?hog .
    OPTIONAL { ?hog wdt:P102 ?hogParty }
    OPTIONAL { ?hog wdt:P569 ?hogDob }
    OPTIONAL { ?hog wdt:P18 ?hogPhoto }
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}
`

function thumbUrl(wikimediaUrl, width = 160) {
  if (!wikimediaUrl) return null
  try {
    const decoded = decodeURIComponent(wikimediaUrl)
    const match = decoded.match(/Special:FilePath\/(.+)$/)
    if (!match) return null
    const filename = match[1].replace(/ /g, '_')
    const md5 = createHash('md5').update(filename).digest('hex')
    const ext = filename.split('.').pop().toLowerCase()
    const suffix = ['svg', 'tif', 'tiff'].includes(ext) ? '.png' : ''
    const encoded = filename.split('/').map(encodeURIComponent).join('/')
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${md5[0]}/${md5.slice(0, 2)}/${encoded}/${width}px-${encoded}${suffix}`
  } catch {
    return null
  }
}

function ageFromDob(dobStr) {
  if (!dobStr) return null
  try {
    const dob = new Date(dobStr)
    const now = new Date()
    const age = Math.floor((now - dob) / (365.25 * 24 * 3600 * 1000))
    return age > 0 && age < 120 ? age : null
  } catch {
    return null
  }
}

function val(binding, key) {
  return binding[key]?.value ?? null
}

console.log('Querying Wikidata for government data...')

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/sparql-results+json',
    'User-Agent': 'WorldDataExplorer/1.0 (educational project)',
  },
  body: new URLSearchParams({ query: QUERY }),
})

if (!res.ok) throw new Error(`SPARQL error: ${res.status} ${await res.text()}`)

const { results } = await res.json()
console.log(`Got ${results.bindings.length} rows`)

const out = {}

for (const row of results.bindings) {
  const iso2 = val(row, 'iso2')
  if (!iso2 || iso2.length !== 2) continue
  if (out[iso2]) continue // keep first occurrence

  const hosName  = val(row, 'hosLabel')
  const hosParty = val(row, 'hosPartyLabel')
  const hosDob   = val(row, 'hosDob')
  const hosPhoto = val(row, 'hosPhoto')
  const hogName  = val(row, 'hogLabel')
  const hogParty = val(row, 'hogPartyLabel')
  const hogDob   = val(row, 'hogDob')
  const hogPhoto = val(row, 'hogPhoto')

  const entry = {}

  if (hosName) {
    entry.headOfState = {
      name:  hosName,
      party: hosParty ?? null,
      age:   ageFromDob(hosDob),
      photo: thumbUrl(hosPhoto),
    }
  }

  if (hogName && hogName !== hosName) {
    entry.headOfGov = {
      name:  hogName,
      party: hogParty ?? null,
      age:   ageFromDob(hogDob),
      photo: thumbUrl(hogPhoto),
    }
  }

  if (Object.keys(entry).length) out[iso2] = entry
}

const outPath = 'public/data/governments.json'
writeFileSync(outPath, JSON.stringify(out, null, 2))
console.log(`Written ${Object.keys(out).length} countries to ${outPath}`)

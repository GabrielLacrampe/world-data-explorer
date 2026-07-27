/**
 * Builds public/data/militaryPersonnel.json — { ISO2: { active, reserve } }.
 *
 * Source: the CIA World Factbook "Military and security service personnel
 * strengths" field, which is free text like
 *   "approximately 200,000 active duty Armed Forces; approximately 150,000
 *    National Gendarmerie; ... (2025)"
 * so the figures have to be parsed out. Only the headline active-duty number
 * (and a reserve number when one is stated) is kept; countries whose text
 * cannot be parsed are simply left out — the sidebar renders "No data".
 *
 * Run: node scripts/fetch-military.mjs
 */

import { writeFileSync } from 'node:fs'
import { COUNTRY_FILES, CIA_TO_ISO2, fetchFactbookJson } from './factbook-countries.mjs'

const FIELD = 'Military and security service personnel strengths'

/** "1.28 million" → 1280000, "450,000" → 450000. */
function toNumber(digits, scale) {
  const n = parseFloat(digits.replace(/,/g, ''))
  if (isNaN(n)) return null
  return scale ? Math.round(n * 1e6) : Math.round(n)
}

/**
 * Parses a figure that may be a range with an implied magnitude on the low
 * end: "65-70,000" means 65,000–70,000 and "350-400,000" means 350,000–400,000.
 * Ranges collapse to their midpoint.
 */
function parseFigure(raw, scale) {
  const [lowRaw, highRaw] = raw.split(/\s*[-–]\s*/)
  const high = toNumber(highRaw ?? lowRaw, scale)
  if (high == null || high <= 0) return null
  if (highRaw == null) return high

  let low = toNumber(lowRaw, scale)
  if (low == null || low <= 0) return high
  // "65-70,000": scale the low end up until it is the same magnitude as the high end.
  while (low * 10 <= high) low *= 10
  return Math.round((low + high) / 2)
}

/** Matches "<figure> [million] [total] active|Regular Forces|reserve". */
function extract(text, kindPattern) {
  const re = new RegExp(
    String.raw`([\d][\d,.]*(?:\s*[-–]\s*[\d][\d,.]*)?)\s*(million)?\s+(?:total\s+)?(?:${kindPattern})`,
    'i'
  )
  const m = text.match(re)
  return m ? parseFigure(m[1].trim(), Boolean(m[2])) : null
}

const out = {}
let processed = 0
let missingField = 0
let unparsed = 0

for (const [region, codes] of Object.entries(COUNTRY_FILES)) {
  for (const code of codes) {
    const iso2 = CIA_TO_ISO2[code]
    if (!iso2) continue // territory with no ISO country of its own
    const data = await fetchFactbookJson(region, code)
    if (!data) continue
    processed++

    const text = data['Military and Security']?.[FIELD]?.text
    if (!text) { missingField++; continue }

    const clean = text.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, ' ')
    const active  = extract(clean, 'active|regular forces')
    const reserve = extract(clean, 'reserv')

    if (active == null && reserve == null) { unparsed++; continue }

    const entry = {}
    if (active  != null) entry.active  = active
    if (reserve != null) entry.reserve = reserve
    out[iso2] = entry
  }
  console.log(`  ${region}: done`)
}

writeFileSync('public/data/militaryPersonnel.json', JSON.stringify(out, null, 2))
console.log(`\nProcessed ${processed} countries (${missingField} without the field, ${unparsed} unparsed)`)
console.log(`militaryPersonnel: ${Object.keys(out).length} countries`)

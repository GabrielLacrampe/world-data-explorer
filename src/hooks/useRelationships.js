import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useRelationships(iso2) {
  const [data, setData] = useState(null)
  const [iso3, setIso3] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Reset for the new country during render, not inside the effect —
  // avoids a cascading re-render (react.dev: "adjusting state when a prop
  // changes"). The effect below only sets state from async callbacks.
  const [lastIso2, setLastIso2] = useState(null)
  if (iso2 !== lastIso2) {
    setLastIso2(iso2)
    setData(null)
    setError(null)
    setLoading(!!iso2 && iso2 !== '-99')
  }

  useEffect(() => {
    if (!iso2 || iso2 === '-99') return

    let cancelled = false

    async function fetch() {
      const { data: cc } = await supabase
        .from('country_codes')
        .select('iso3')
        .eq('iso2', iso2)
        .single()

      if (cancelled) return

      if (!cc?.iso3) {
        setData([])
        setLoading(false)
        return
      }

      const iso3 = cc.iso3
      setIso3(iso3)
      const [resA, resB] = await Promise.all([
        supabase.from('relationships').select('*').contains('side_a', [iso3]).eq('status', 'active'),
        supabase.from('relationships').select('*').contains('side_b', [iso3]).eq('status', 'active'),
      ])

      if (cancelled) return

      const err = resA.error || resB.error
      if (err) {
        setError(err.message)
      } else {
        const seen = new Set()
        const merged = [...(resA.data ?? []), ...(resB.data ?? [])].filter((r) => {
          if (seen.has(r.id)) return false
          seen.add(r.id)
          return true
        })
        setData(merged)
      }
      setLoading(false)
    }

    fetch()
    return () => { cancelled = true }
  }, [iso2])

  return { data, iso3, loading, error }
}

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useGovernmentData(iso2) {
  const [data, setData] = useState(null)
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

      const iso3 = cc?.iso3
      if (!iso3) {
        setData({ government: null, ministers: [] })
        setLoading(false)
        return
      }

      const [govResult, minResult] = await Promise.all([
        supabase.from('governments').select('*').eq('iso3', iso3).single(),
        supabase.from('ministers').select('role, name, party').eq('iso3', iso3),
      ])

      if (cancelled) return

      if (govResult.error && govResult.error.code !== 'PGRST116') {
        setError(govResult.error.message)
        setLoading(false)
        return
      }

      setData({
        government: govResult.data ?? null,
        ministers: minResult.data ?? [],
      })
      setLoading(false)
    }

    fetch()
    return () => { cancelled = true }
  }, [iso2])

  return { data, loading, error }
}

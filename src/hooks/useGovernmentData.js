import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useGovernmentData(iso2) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!iso2 || iso2 === '-99') return

    let cancelled = false
    setLoading(true)
    setData(null)
    setError(null)

    async function fetch() {
      const govResult = await supabase
        .from('governments')
        .select('*')
        .eq('iso2', iso2)
        .single()

      if (cancelled) return

      if (govResult.error && govResult.error.code !== 'PGRST116') {
        setError(govResult.error.message)
        setLoading(false)
        return
      }

      const iso3 = govResult.data?.iso3
      const minResult = iso3
        ? await supabase.from('ministers').select('role, name, party').eq('iso3', iso3)
        : { data: [] }

      if (cancelled) return

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

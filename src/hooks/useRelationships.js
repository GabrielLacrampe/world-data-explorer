import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useRelationships(iso2) {
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
      // Resolve ISO2 → ISO3 first
      const { data: gov } = await supabase
        .from('governments')
        .select('iso3')
        .eq('iso2', iso2)
        .single()

      if (cancelled) return

      if (!gov?.iso3) {
        setData([])
        setLoading(false)
        return
      }

      const iso3 = gov.iso3
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

  return { data, loading, error }
}

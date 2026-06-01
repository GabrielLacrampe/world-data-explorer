import { useEffect } from 'react'
import useStore from '../store/useStore'
import { fetchConflictEvents } from '../utils/acled'

/**
 * Manages overlay data fetching.
 * Each overlay fetches its data once on first activation and caches it.
 * Add new overlay fetch logic here as new overlays are added.
 */
export function useOverlays() {
  const { overlays, setOverlayData, setOverlayLoading } = useStore()

  // Conflicts overlay
  useEffect(() => {
    const conflict = overlays.conflicts
    if (!conflict.active || conflict.data !== null) return

    setOverlayLoading('conflicts', true)

    fetchConflictEvents(1000)
      .then((geojson) => setOverlayData('conflicts', geojson))
      .catch((err) => {
        console.error('ACLED fetch failed:', err)
        setOverlayLoading('conflicts', false)
      })
  }, [overlays.conflicts.active])
}
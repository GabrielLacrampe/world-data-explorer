export const EVENT_COLORS = {
  Battles: '#ef4444',
  'Violence against civilians': '#f97316',
  'Explosions/Remote violence': '#eab308',
  Protests: '#3b82f6',
  Riots: '#8b5cf6',
  'Strategic developments': '#6b7280',
}

export const DEFAULT_EVENT_COLOR = '#6b7280'

export function eventsToGeoJSON(events) {
  const features = events
    .filter((e) => e.latitude && e.longitude)
    .map((e) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(e.longitude), parseFloat(e.latitude)],
      },
      properties: {
        id: e.event_id_cnty,
        date: e.event_date,
        eventType: e.event_type,
        subEventType: e.sub_event_type,
        actor1: e.actor1,
        actor2: e.actor2,
        country: e.country,
        fatalities: parseInt(e.fatalities, 10) || 0,
        notes: e.notes,
        color: EVENT_COLORS[e.event_type] ?? DEFAULT_EVENT_COLOR,
      },
    }))

  return { type: 'FeatureCollection', features }
}

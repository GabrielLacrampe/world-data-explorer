import { Popup } from 'react-map-gl/maplibre'
import useStore from '../store/useStore'
import { EVENT_COLORS } from '../utils/acled'

function ConflictPopup() {
  const { activePopup, closePopup } = useStore()

  if (!activePopup) return null

  const { longitude, latitude, properties: p } = activePopup

  const eventColor = EVENT_COLORS[p.eventType] ?? '#6b7280'

  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      onClose={closePopup}
      closeOnClick={false}
      maxWidth="320px"
      className="conflict-popup"
    >
      <div className="bg-gray-900 text-white rounded p-0 min-w-64 max-w-xs">

        {/* Header */}
        <div
          className="px-3 py-2 rounded-t flex items-center justify-between gap-2"
          style={{ backgroundColor: eventColor + '22', borderBottom: `2px solid ${eventColor}` }}
        >
          <div>
            <p className="text-xs font-semibold" style={{ color: eventColor }}>
              {p.eventType}
            </p>
            <p className="text-gray-400 text-xs">{p.subEventType}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-300 text-xs">{p.date}</p>
            <p className="text-gray-400 text-xs">{p.country}</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-3 py-3 flex flex-col gap-2">

          {/* Actors */}
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
              Actors
            </p>
            <p className="text-white text-xs">{p.actor1}</p>
            {p.actor2 && p.actor2 !== 'Civilians' && (
              <>
                <p className="text-gray-500 text-xs my-0.5">vs</p>
                <p className="text-white text-xs">{p.actor2}</p>
              </>
            )}
          </div>

          {/* Fatalities */}
          {p.fatalities > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <p className="text-red-400 text-xs font-medium">
                {p.fatalities} {p.fatalities === 1 ? 'fatality' : 'fatalities'} reported
              </p>
            </div>
          )}

          {/* Notes */}
          {p.notes && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                Notes
              </p>
              <p className="text-gray-300 text-xs leading-relaxed line-clamp-4">
                {p.notes}
              </p>
            </div>
          )}

          {/* Source */}
          <p className="text-gray-600 text-xs mt-1 pt-2 border-t border-gray-800">
            Source: ACLED · acleddata.com
          </p>
        </div>
      </div>
    </Popup>
  )
}

export default ConflictPopup
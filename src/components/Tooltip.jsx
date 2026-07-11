// Shared dark-panel visual shell for hover tooltips, matching the rest of
// the app's floating panels (Legend, TimeSlider, ErrorBanner).
export const TOOLTIP_PANEL_CLASS =
  'bg-[#0d1117]/95 backdrop-blur-md border border-[#1e2736] rounded-md shadow-lg shadow-black/40 px-3 py-2'

/**
 * CSS-anchored tooltip for small, static trigger elements (a TopBar stat, a
 * Legend layer pill). The parent must be `position: relative` and manage
 * its own hover boolean via onMouseEnter/onMouseLeave — this component just
 * renders the floating panel when asked to.
 */
export default function Tooltip({ children, side = 'bottom', align = 'start' }) {
  const sideClass = side === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
  const alignClass = align === 'end' ? 'right-0' : 'left-0'

  return (
    <div
      className={`absolute ${sideClass} ${alignClass} z-50 pointer-events-none w-max max-w-[240px] ${TOOLTIP_PANEL_CLASS}`}
    >
      {children}
    </div>
  )
}

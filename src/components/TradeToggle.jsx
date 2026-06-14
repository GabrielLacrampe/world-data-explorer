import useStore from '../store/useStore'

export default function TradeToggle() {
  const { tradeMode, setTradeMode } = useStore()

  return (
    <div className="absolute bottom-8 right-4 z-20">
      <button
        onClick={() => setTradeMode(!tradeMode)}
        title={tradeMode ? 'Exit trade routes mode' : 'Show trade routes'}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
          border transition-all duration-200
          ${tradeMode
            ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
            : 'bg-[#0d1117]/80 border-[#1e2736] text-[#6b7280] hover:border-[#334155] hover:text-[#9ca3af]'}
        `}
      >
        {/* Simple ship/route icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 17l4-8 5 5 5-8 4 8" />
          <line x1="3" y1="21" x2="21" y2="21" />
        </svg>
        Trade Routes
        {tradeMode && (
          <span className="ml-0.5 opacity-60">
            <span className="text-cyan-400">━</span>
            <span className="text-orange-400">━</span>
          </span>
        )}
      </button>

      {tradeMode && (
        <div className="mt-2 bg-[#0d1117]/90 backdrop-blur border border-[#1e2736] rounded-lg px-3 py-2 text-[10px] leading-relaxed">
          <div className="flex items-center gap-1.5 text-cyan-300">
            <span className="inline-block w-6 h-0.5 bg-cyan-400 rounded" />
            Exports
          </div>
          <div className="flex items-center gap-1.5 text-orange-300 mt-1">
            <span className="inline-block w-6 h-0.5 bg-orange-400 rounded" />
            Imports
          </div>
        </div>
      )}
    </div>
  )
}

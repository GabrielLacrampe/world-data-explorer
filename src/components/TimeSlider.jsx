import { useRef, useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { LAYERS } from '../layers'

const PLAY_SPEEDS = { slow: 800, normal: 400, fast: 150 }

export default function TimeSlider() {
  const {
    activeLayer,
    activeYear,
    setActiveYear,
    isPlaying,
    setIsPlaying,
    historicalData,
    historicalLoading,
  } = useStore()

  const layer      = LAYERS[activeLayer]
  const historical = layer?.historical

  const [displayYear, setDisplayYear] = useState(activeYear)
  const [speed, setSpeed]             = useState('normal')
  const intervalRef                   = useRef(null)

  // Keep display in sync when activeYear changes externally (layer switch, autoplay)
  useEffect(() => {
    setDisplayYear(activeYear)
  }, [activeYear])

  const [minYear, maxYear] = historical?.yearRange ?? [0, 9999]
  const availableYears = historical
    ? Object.keys(historicalData[historical.owidChart] ?? {})
        .map(Number)
        .filter(y => y >= minYear && y <= maxYear)
        .sort((a, b) => a - b)
    : []

  // Auto-play: advance one year per tick using getState() to avoid stale closures
  useEffect(() => {
    clearInterval(intervalRef.current)
    if (!isPlaying || availableYears.length === 0) return

    intervalRef.current = setInterval(() => {
      const { activeYear: current } = useStore.getState()
      const idx = availableYears.indexOf(current)

      if (idx === -1 || idx >= availableYears.length - 1) {
        useStore.getState().setIsPlaying(false)
        return
      }

      const next = availableYears[idx + 1]
      setDisplayYear(next)
      useStore.getState().setActiveYear(next)
    }, PLAY_SPEEDS[speed])

    return () => clearInterval(intervalRef.current)
  // availableYears reference changes when data loads; stringify to detect it
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, speed, availableYears.length])

  if (!historical) return null

  const isLoading  = historicalLoading && availableYears.length === 0
  const isDisabled = isLoading || availableYears.length === 0
  const sliderIdx  = Math.max(0, availableYears.indexOf(displayYear))
  const maxIdx     = Math.max(0, availableYears.length - 1)

  const handleInput = (e) => {
    setDisplayYear(availableYears[Number(e.target.value)])
  }

  const handleCommit = (e) => {
    const year = availableYears[Number(e.target.value)]
    setDisplayYear(year)
    setActiveYear(year)
  }

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
      return
    }
    // Restart from beginning if playback reached the end
    if (activeYear >= availableYears[availableYears.length - 1]) {
      const first = availableYears[0]
      setActiveYear(first)
      setDisplayYear(first)
    }
    setIsPlaying(true)
  }

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20
                 bg-[#0d1117]/90 backdrop-blur-md border border-[#1e2736]
                 rounded-xl px-5 py-3 flex items-center gap-4
                 w-[min(560px,calc(100vw-2rem))]"
    >
      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        disabled={isDisabled}
        className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors
                   flex items-center justify-center shrink-0 text-white
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <PauseIcon />
        ) : (
          <PlayIcon />
        )}
      </button>

      {/* Current year */}
      <span className="font-mono text-base font-semibold text-white w-12 text-center tabular-nums shrink-0">
        {displayYear ?? '—'}
      </span>

      {/* Slider — index-based so sparse year gaps don't distort thumb position */}
      <input
        type="range"
        min={0}
        max={maxIdx}
        value={sliderIdx}
        onInput={handleInput}
        onChange={handleInput}
        onMouseUp={handleCommit}
        onTouchEnd={handleCommit}
        disabled={isDisabled}
        className="flex-1 accent-blue-500 cursor-pointer disabled:opacity-40"
      />

      {/* Speed selector */}
      <div className="flex gap-1 shrink-0">
        {[['slow', '½×'], ['normal', '1×'], ['fast', '2×']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSpeed(key)}
            className={`text-[10px] px-2 py-1 rounded transition-colors font-mono
                        ${speed === key
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 hover:text-gray-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Data source */}
      <span className="text-gray-600 text-[10px] shrink-0 hidden lg:block whitespace-nowrap">
        {historical.attribution}
      </span>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  )
}

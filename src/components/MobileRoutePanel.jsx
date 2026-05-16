import { useRef, useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import SearchBar from './SearchBar'
import RouteCard from './RouteCard'
import AILoadingState from './AILoadingState'
import { formatDuration, formatDistance } from '../services/routingService'

/**
 * snap states (Google Maps–inspired):
 *  'peek'    – ~80px  – search hint / route summary strip
 *  'routes'  – ~230px – route cards + Start when routes ready
 *  'plan'    – ~380px – From/To form + Generate Route
 *  'full'    – 90dvh  – full planner
 */

function calcHeights() {
  if (typeof window === 'undefined') return { peek: 80, routes: 230, plan: 380, full: 640 }
  const h = window.innerHeight
  return {
    peek:   80,
    routes: Math.min(240, h * 0.32),
    plan:   Math.min(400, h * 0.52),
    full:   Math.min(h * 0.9, 760),
  }
}

function snapH(snap, hs) {
  return hs[snap] ?? hs.peek
}

export default function MobileRoutePanel({
  snap,
  onSnapChange,
  userLocation,
  origin,
  destination,
  routes,
  safetyScores,
  selectedRouteIndex,
  isLoadingRoutes,
  routeError,
  onOriginSelect,
  onOriginClear,
  onDestinationSelect,
  onDestinationClear,
  onSwap,
  onGenerateRoutes,
  onRouteSelect,
  onUnsafeDetail,
  onStartJourney,
  onViewUnsafeDetail,
}) {
  const dragControls = useDragControls()
  const scrollRef = useRef(null)
  const routeScrollRef = useRef(null)
  const [heights, setHeights] = useState(calcHeights)

  // update heights on resize / orientation change
  useEffect(() => {
    const update = () => setHeights(calcHeights())
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  // drive CSS token so map controls stay above sheet
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--mobile-sheet-h',
      `${snapH(snap, heights)}px`,
    )
    return () => document.documentElement.style.removeProperty('--mobile-sheet-h')
  }, [snap, heights])

  const selectedSafety = safetyScores[selectedRouteIndex]
  const selectedRoute  = routes[selectedRouteIndex]
  const hasRoutes = routes.length > 0
  const isSafe = selectedSafety?.isRecommended
  const routeColor = isSafe ? '#22C55E' : '#EF4444'
  const canGenerate = Boolean(destination) && Boolean(origin ?? userLocation) && !isLoadingRoutes

  const height = snapH(snap, heights)
  const isPeek   = snap === 'peek'
  const isRoutes = snap === 'routes'
  const isPlan   = snap === 'plan'
  const isFull   = snap === 'full'
  const isForm   = isPlan || isFull

  // auto-advance snap on relevant state changes
  useEffect(() => {
    if (hasRoutes && !isForm) onSnapChange('routes')
  }, [hasRoutes]) // eslint-disable-line
  useEffect(() => {
    if (isLoadingRoutes && !isForm) onSnapChange('plan')
  }, [isLoadingRoutes]) // eslint-disable-line

  const peekLabel = useMemo(() => {
    if (!destination) return 'Search destination…'
    const from = origin?.name ?? 'My location'
    return `${from} → ${destination.name}`
  }, [origin, destination])

  /* ── drag to snap ── */
  const handleDragEnd = (_, info) => {
    const vy = info.velocity.y
    const oy = info.offset.y

    const order = ['peek', 'routes', 'plan', 'full']
    const idx   = order.indexOf(snap)

    if (oy > 60 || vy > 350) {
      // drag down
      const next = order[idx - 1]
      if (next) onSnapChange(next)
      else onSnapChange('peek')
    } else if (oy < -60 || vy < -350) {
      // drag up
      const next = order[idx + 1]
      if (next) onSnapChange(next)
      else onSnapChange('full')
    }
    // else stay
  }

  return (
    <>
      {/* Backdrop (only for plan / full) */}
      <AnimatePresence>
        {isForm && (
          <motion.div
            key="mbs-backdrop"
            className="fixed inset-0 z-[1050] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onSnapChange(hasRoutes ? 'routes' : 'peek')}
          />
        )}
      </AnimatePresence>

      {/* ── Sheet ── */}
      <motion.div
        className="fixed left-0 right-0 bottom-0 z-[1100] flex flex-col pointer-events-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        initial={false}
        animate={{ height }}
        transition={{ type: 'spring', stiffness: 400, damping: 38 }}
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.08}
        onDragEnd={handleDragEnd}
      >
        <div
          className="flex flex-col h-full overflow-hidden"
          style={{
            borderRadius: '20px 20px 0 0',
            background: 'rgba(13,17,28,0.97)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Drag handle */}
          <div
            className="flex-shrink-0 flex justify-center pt-2.5 pb-1 touch-manipulation cursor-grab active:cursor-grabbing"
            onPointerDown={e => dragControls.start(e)}
          >
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* ── PEEK: search hint or route summary ── */}
          {isPeek && (
            <div className="flex-shrink-0 px-3 pb-3 pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSnapChange('plan')}
                className="flex-1 flex items-center gap-3 min-h-[52px] px-4 py-3 rounded-2xl touch-manipulation"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <span className="text-gray-400 text-lg flex-shrink-0">🔍</span>
                {destination ? (
                  <span className="text-white text-sm font-medium truncate">{peekLabel}</span>
                ) : (
                  <span className="text-gray-400 text-sm">Search destination…</span>
                )}
              </button>
              {hasRoutes && selectedRoute && (
                <button
                  type="button"
                  onClick={onStartJourney}
                  className="flex-shrink-0 min-h-[52px] px-5 rounded-2xl font-black text-white text-sm touch-manipulation active:scale-95"
                  style={{
                    background: isSafe
                      ? 'linear-gradient(135deg,#22C55E,#16A34A)'
                      : 'linear-gradient(135deg,#EF4444,#DC2626)',
                    boxShadow: isSafe
                      ? '0 4px 20px rgba(34,197,94,0.45)'
                      : '0 4px 20px rgba(239,68,68,0.45)',
                  }}
                >
                  Start
                </button>
              )}
              {!hasRoutes && destination && (
                <button
                  type="button"
                  onClick={() => onSnapChange('plan')}
                  className="flex-shrink-0 min-h-[52px] px-4 rounded-2xl font-bold text-white text-sm touch-manipulation active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg,#6366F1,#4F46E5)',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                  }}
                >
                  Routes
                </button>
              )}
            </div>
          )}

          {/* ── ROUTES: horizontal route cards + Start ── */}
          {isRoutes && (
            <div className="flex-1 flex flex-col min-h-0 pb-3">
              {/* Destination header */}
              <div className="flex-shrink-0 px-4 pt-1 pb-2 flex items-center gap-2 border-b border-white/5">
                <button
                  type="button"
                  onClick={() => onSnapChange('plan')}
                  className="w-9 h-9 rounded-full flex items-center justify-center touch-manipulation"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  aria-label="Edit route"
                >
                  ‹
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">To</p>
                  <p className="text-white text-sm font-bold truncate">{destination?.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onSnapChange('plan')}
                  className="text-primary text-xs font-bold px-3 py-1.5 rounded-full touch-manipulation"
                  style={{ background: 'rgba(99,102,241,0.15)' }}
                >
                  Edit
                </button>
              </div>

              {isLoadingRoutes ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                    style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-primary text-xs font-semibold">Finding safest routes…</span>
                  </div>
                </div>
              ) : routeError ? (
                <div className="flex-1 flex items-center justify-center px-4">
                  <p className="text-danger text-xs text-center leading-relaxed">{routeError}</p>
                </div>
              ) : (
                <>
                  {/* Horizontal scrollable route chips */}
                  <div
                    ref={routeScrollRef}
                    className="flex-shrink-0 flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar"
                  >
                    {routes.map((r, i) => {
                      const s = safetyScores[i]
                      const color = s?.isRecommended ? '#22C55E' : '#EF4444'
                      const sel = i === selectedRouteIndex
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => onRouteSelect(i)}
                          className="flex-shrink-0 flex flex-col items-start px-4 py-3 rounded-2xl touch-manipulation min-w-[130px] transition-all"
                          style={{
                            background: sel ? color + '1A' : 'rgba(255,255,255,0.05)',
                            border: sel ? `1.5px solid ${color}` : '1.5px solid rgba(255,255,255,0.08)',
                            boxShadow: sel ? `0 4px 16px ${color}33` : 'none',
                          }}
                        >
                          <span className="text-[10px] font-bold mb-1" style={{ color: sel ? color : '#6B7280' }}>
                            {s?.isRecommended ? '✦ Safest' : '⚠ Alert route'}
                          </span>
                          <span className="text-white font-black text-lg leading-none">
                            {formatDuration(r.duration)}
                          </span>
                          <span className="text-gray-500 text-[11px] mt-0.5">
                            {formatDistance(r.distance)} · {s?.score ?? '—'}/100
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Safety badge */}
                  {selectedSafety && (
                    <div className="flex-shrink-0 mx-4 mb-2 px-3 py-2 rounded-xl flex items-center gap-2"
                      style={{
                        background: routeColor + '12',
                        border: `1px solid ${routeColor}30`,
                      }}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: routeColor }} />
                      <p className="text-xs font-semibold flex-1 leading-snug" style={{ color: routeColor }}>
                        {selectedSafety.label} · {selectedSafety.explanation}
                      </p>
                    </div>
                  )}

                  {/* Start Journey */}
                  <div className="flex-shrink-0 px-4 pt-1 flex gap-2">
                    {selectedSafety?.safetyClass === 'unsafe' && !selectedSafety?.isRecommended && (
                      <button
                        type="button"
                        onClick={onViewUnsafeDetail}
                        className="flex-shrink-0 min-h-[52px] px-3 rounded-2xl border border-danger/40 text-danger text-xs font-bold touch-manipulation"
                      >
                        Why?
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onStartJourney}
                      className="flex-1 min-h-[52px] rounded-2xl font-black text-lg text-white touch-manipulation active:scale-[0.98]"
                      style={{
                        background: isSafe
                          ? 'linear-gradient(135deg,#22C55E,#16A34A)'
                          : 'linear-gradient(135deg,#EF4444,#DC2626)',
                        boxShadow: isSafe
                          ? '0 6px 24px rgba(34,197,94,0.4)'
                          : '0 6px 24px rgba(239,68,68,0.4)',
                      }}
                    >
                      Start Journey
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── PLAN / FULL: full route form ── */}
          {isForm && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Header */}
              <div className="flex-shrink-0 px-4 pb-3 flex items-center justify-between gap-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                    style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>✦</span>
                  <div>
                    <p className="text-white font-black text-sm leading-tight">Plan your route</p>
                    <p className="text-gray-500 text-[10px]">Oxford · safety-first navigation</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSnapChange(hasRoutes ? 'routes' : 'peek')}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 text-lg touch-manipulation"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                  aria-label="Collapse"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable body */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overscroll-contain min-h-0 px-4 py-3 space-y-3"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {/* From/To inputs */}
                <div className="flex gap-2 items-stretch">
                  <div className="flex-shrink-0 flex flex-col items-center py-4 gap-1">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-primary" />
                    <div className="w-0.5 flex-1 bg-white/10 rounded-full" />
                    <div className="w-3 h-3 rounded-sm border-2 border-safe" />
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div>
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">From</p>
                      <SearchBar
                        userLocation={userLocation}
                        destination={origin}
                        onDestinationSelect={onOriginSelect}
                        onClear={onOriginClear}
                        isLoadingRoutes={false}
                        placeholder="My location in Oxford…"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">To</p>
                      <SearchBar
                        userLocation={userLocation}
                        destination={destination}
                        onDestinationSelect={onDestinationSelect}
                        onClear={onDestinationClear}
                        isLoadingRoutes={isLoadingRoutes}
                        placeholder="Search destination in Oxford…"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onSwap}
                    disabled={!destination}
                    title="Swap"
                    className="self-center w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 disabled:opacity-30 touch-manipulation flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                </div>

                {/* Generate Route button */}
                <button
                  type="button"
                  onClick={onGenerateRoutes}
                  disabled={!canGenerate}
                  className="w-full min-h-[52px] rounded-2xl font-black text-white text-base touch-manipulation disabled:opacity-40 active:scale-[0.98]"
                  style={{
                    background: canGenerate
                      ? 'linear-gradient(135deg,#6366F1,#4F46E5)'
                      : 'rgba(55,65,81,0.8)',
                    boxShadow: canGenerate ? '0 6px 24px rgba(99,102,241,0.4)' : 'none',
                  }}
                >
                  {isLoadingRoutes ? 'Generating…' : 'Generate Route'}
                </button>

                {routeError && (
                  <div className="rounded-xl px-3 py-2.5"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)' }}>
                    <p className="text-danger text-xs font-medium leading-snug">{routeError}</p>
                  </div>
                )}

                {isLoadingRoutes && <AILoadingState />}

                {/* Safety summary */}
                {hasRoutes && selectedSafety && !isLoadingRoutes && (
                  <div className="rounded-xl px-3 py-3 flex items-start gap-2.5"
                    style={{ background: routeColor + '12', border: `1px solid ${routeColor}40` }}>
                    <span className="w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0 mt-1" style={{ background: routeColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold flex flex-wrap items-center gap-1.5" style={{ color: routeColor }}>
                        <span>AI · {selectedSafety.score}/100 · {selectedSafety.label}</span>
                        {selectedSafety.isRecommended && (
                          <span className="text-[9px] font-black text-white bg-safe px-2 py-0.5 rounded-full">
                            ✦ Recommended
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{selectedSafety.explanation}</p>
                    </div>
                  </div>
                )}

                {/* Route cards */}
                {hasRoutes && !isLoadingRoutes && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Compare routes</p>
                    {routes.map((r, i) => (
                      <RouteCard
                        key={i}
                        route={r}
                        index={i}
                        safety={safetyScores[i]}
                        isSelected={selectedRouteIndex === i}
                        onSelect={onRouteSelect}
                        onUnsafeDetail={onUnsafeDetail}
                      />
                    ))}
                  </div>
                )}

                {!hasRoutes && !isLoadingRoutes && !routeError && destination && (
                  <p className="text-center text-gray-500 text-xs py-2 leading-relaxed">
                    Tap <strong className="text-white">Generate Route</strong> to compare safe &amp; unsafe paths.
                  </p>
                )}
                {!destination && !isLoadingRoutes && (
                  <p className="text-center text-gray-500 text-xs py-4 leading-relaxed">
                    Enter a destination above — HerWay will score both routes for safety.
                  </p>
                )}
              </div>

              {/* Sticky Start Journey footer */}
              {hasRoutes && selectedRoute && !isLoadingRoutes && (
                <div
                  className="flex-shrink-0 px-4 pt-2 pb-3 border-t border-white/5"
                  style={{ paddingBottom: 'max(env(safe-area-inset-bottom),12px)' }}
                >
                  {selectedSafety?.safetyClass === 'unsafe' && !selectedSafety?.isRecommended && (
                    <button
                      type="button"
                      onClick={onViewUnsafeDetail}
                      className="w-full mb-2 min-h-[44px] rounded-xl font-bold text-xs touch-manipulation"
                      style={{ border: '1px solid rgba(239,68,68,0.4)', color: '#EF4444' }}
                    >
                      Why is this route unsafe? ›
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onStartJourney}
                    className="w-full min-h-[56px] rounded-2xl font-black text-lg text-white touch-manipulation active:scale-[0.98]"
                    style={{
                      background: isSafe
                        ? 'linear-gradient(135deg,#22C55E,#16A34A)'
                        : 'linear-gradient(135deg,#EF4444,#DC2626)',
                      boxShadow: isSafe
                        ? '0 8px 28px rgba(34,197,94,0.45)'
                        : '0 8px 28px rgba(239,68,68,0.45)',
                    }}
                  >
                    Start Journey
                  </button>
                  <p className="text-center text-gray-600 text-[10px] mt-2">
                    {formatDuration(selectedRoute.duration)} · {formatDistance(selectedRoute.distance)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}

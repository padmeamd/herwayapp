import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import SearchBar from './SearchBar'
import RouteCard from './RouteCard'
import { formatDuration, formatDistance } from '../services/routingService'

/** @typedef {'hidden' | 'half' | 'full'} PanelSnap */

function getSnapHeights() {
  if (typeof window === 'undefined') {
    return { half: 420, full: 640 }
  }
  return {
    half: Math.min(window.innerHeight * 0.52, 520),
    full: Math.min(window.innerHeight * 0.88, 720),
  }
}

function panelHeight(snap, heights) {
  if (snap === 'hidden') return 0
  if (snap === 'half') return heights.half
  return heights.full
}

/**
 * Mobile route builder: hidden by default (full map). Opens via FAB button.
 */
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
  onRouteSelect,
  onUnsafeDetail,
  onStartJourney,
  onViewUnsafeDetail,
}) {
  const dragControls = useDragControls()
  const scrollRef = useRef(null)
  const [snapHeights, setSnapHeights] = useState(getSnapHeights)

  useEffect(() => {
    const update = () => setSnapHeights(getSnapHeights())
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  useEffect(() => {
    const h = panelHeight(snap, snapHeights)
    document.documentElement.style.setProperty(
      '--herway-journey-height',
      snap === 'hidden' ? '0px' : `${h + 8}px`,
    )
    return () => {
      document.documentElement.style.removeProperty('--herway-journey-height')
    }
  }, [snap, snapHeights])

  const selectedSafety = safetyScores[selectedRouteIndex]
  const selectedRoute = routes[selectedRouteIndex]
  const isExpanded = snap === 'half' || snap === 'full'
  const isHidden = snap === 'hidden'
  const isSafe = selectedSafety?.isRecommended
  const routeColor = isSafe ? '#22C55E' : '#EF4444'
  const hasRoutes = routes.length > 0
  const height = panelHeight(snap, snapHeights)

  const handleDragEnd = (_, info) => {
    const vy = info.velocity.y
    const oy = info.offset.y
    if (oy > 70 || vy > 400) {
      onSnapChange('hidden')
      return
    }
    if (oy < -60 || vy < -400) {
      onSnapChange('full')
      return
    }
    if (snap === 'full' && oy > 30) {
      onSnapChange('half')
      return
    }
    onSnapChange(snap)
  }

  const openPanel = () => onSnapChange(hasRoutes ? 'half' : 'full')
  const closePanel = () => onSnapChange('hidden')

  return (
    <>
      <AnimatePresence>
        {isHidden && (
          <motion.button
            type="button"
            key="route-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={openPanel}
            className="mobile-route-fab fixed z-[33] right-4 flex items-center gap-2 touch-manipulation border border-safe/40 shadow-2xl"
            style={{
              bottom: 'calc(1rem + env(safe-area-inset-bottom))',
              background: 'linear-gradient(135deg, #22C55E, #16A34A)',
              boxShadow: '0 8px 28px rgba(34,197,94,0.45)',
              padding: hasRoutes ? '0.625rem 1rem' : undefined,
              width: hasRoutes ? 'auto' : '3.5rem',
              height: '3.5rem',
              borderRadius: '1rem',
              justifyContent: 'center',
            }}
            aria-label="Open route planner"
          >
            <span className="text-xl leading-none">🛣️</span>
            {hasRoutes && (
              <span className="text-white text-sm font-bold">Routes</span>
            )}
            {hasRoutes && selectedRoute && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/25"
                style={{ color: routeColor }}
              >
                {formatDuration(selectedRoute.duration)}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[41] bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePanel}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isHidden && (
          <motion.div
            key="sheet"
            className="mobile-route-panel fixed left-0 right-0 z-[42] flex flex-col pointer-events-auto"
            style={{
              bottom: 0,
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
            initial={{ height: 0 }}
            animate={{ height }}
            exit={{ height: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.12}
            onDragEnd={handleDragEnd}
          >
            <motion.div
              className="flex flex-col h-full rounded-t-3xl border-t border-white/10 overflow-hidden shadow-[0_-12px_48px_rgba(0,0,0,0.55)]"
              style={{
                background: 'linear-gradient(180deg, rgba(17,24,39,0.98) 0%, rgba(8,12,20,0.99) 100%)',
                backdropFilter: 'blur(24px)',
              }}
            >
              <div
                className="flex-shrink-0 flex justify-center py-3 cursor-grab active:cursor-grabbing touch-manipulation"
                onPointerDown={e => dragControls.start(e)}
                onClick={closePanel}
              >
                <motion.div className="w-11 h-1.5 bg-gray-500 rounded-full" />
              </div>

              <motion.div className="flex flex-col flex-1 min-h-0">
                <div className="flex-shrink-0 px-4 pb-3 flex items-center justify-between gap-2 border-b border-white/5">
                  <motion.div className="flex items-center gap-2 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-safe/20 border border-safe/40 flex items-center justify-center text-sm">✦</span>
                    <div className="min-w-0">
                      <h2 className="text-white font-black text-base leading-tight">Plan route</h2>
                      <p className="text-gray-500 text-[10px]">Oxford · safety-first walking</p>
                    </div>
                  </motion.div>
                  <button
                    type="button"
                    onClick={closePanel}
                    className="w-10 h-10 rounded-full bg-white/10 text-gray-400 flex items-center justify-center touch-manipulation flex-shrink-0"
                    aria-label="Close and show map"
                  >
                    ✕
                  </button>
                </div>

                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto overscroll-contain min-h-0 px-4 py-3 space-y-4"
                >
                  <div className="flex gap-2 items-stretch">
                    <div className="flex-1 space-y-3 min-w-0">
                      <div>
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">From</p>
                        <SearchBar
                          userLocation={userLocation}
                          destination={origin}
                          onDestinationSelect={onOriginSelect}
                          onClear={onOriginClear}
                          isLoadingRoutes={false}
                          placeholder="My location in Oxford..."
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">To</p>
                        <SearchBar
                          userLocation={userLocation}
                          destination={destination}
                          onDestinationSelect={onDestinationSelect}
                          onClear={onDestinationClear}
                          isLoadingRoutes={isLoadingRoutes}
                          placeholder="Search destination in Oxford..."
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onSwap}
                      disabled={!destination}
                      title="Swap"
                      className="w-12 min-h-[48px] self-center rounded-xl bg-card border border-white/10 flex items-center justify-center text-gray-400 disabled:opacity-30 touch-manipulation flex-shrink-0 mt-6"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </button>
                  </div>

                  {routeError && (
                    <div className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2.5">
                      <p className="text-danger text-xs font-medium leading-snug">{routeError}</p>
                    </div>
                  )}

                  {isLoadingRoutes && (
                    <div className="flex flex-col items-center gap-2 py-6">
                      <div className="w-8 h-8 border-2 border-safe/30 border-t-safe rounded-full animate-spin" />
                      <p className="text-gray-400 text-xs font-medium">Finding safest routes…</p>
                    </div>
                  )}

                  {hasRoutes && selectedSafety && (
                    <motion.div
                      className="rounded-xl px-3 py-2.5 flex items-center gap-2.5 border"
                      style={{
                        backgroundColor: routeColor + '12',
                        borderColor: routeColor + '44',
                      }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0"
                        style={{ background: routeColor }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold" style={{ color: routeColor }}>
                          {selectedSafety.score}/100 · {selectedSafety.label}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">{selectedSafety.explanation}</p>
                      </div>
                      {selectedSafety.isRecommended && (
                        <span className="text-[9px] font-black text-white bg-safe px-2 py-0.5 rounded-full flex-shrink-0">
                          ✦ Safest
                        </span>
                      )}
                    </motion.div>
                  )}

                  {hasRoutes && !isLoadingRoutes && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        Compare routes
                      </p>
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
                    <p className="text-center text-gray-500 text-xs py-4">
                      Select a destination above to generate safe & unsafe routes.
                    </p>
                  )}

                  {!destination && !isLoadingRoutes && (
                    <p className="text-center text-gray-600 text-xs py-6 leading-relaxed">
                      Enter where you&apos;re going to see HerWay&apos;s green safe route and red alert route.
                    </p>
                  )}
                </div>

                {hasRoutes && selectedRoute && (
                  <div
                    className="flex-shrink-0 px-4 pt-2 pb-3 border-t border-white/5"
                    style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
                  >
                    {selectedSafety?.safetyClass === 'unsafe' && !selectedSafety?.isRecommended && (
                      <button
                        type="button"
                        onClick={onViewUnsafeDetail}
                        className="w-full mb-2 min-h-[40px] py-2 rounded-xl border border-danger/40 text-danger text-xs font-bold touch-manipulation"
                      >
                        Why is this route unsafe? ›
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onStartJourney}
                      className="w-full min-h-[54px] rounded-2xl font-black text-lg text-white touch-manipulation active:scale-[0.98]"
                      style={{
                        background: isSafe
                          ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                          : 'linear-gradient(135deg, #EF4444, #DC2626)',
                        boxShadow: isSafe
                          ? '0 8px 28px rgba(34,197,94,0.4)'
                          : '0 8px 28px rgba(239,68,68,0.4)',
                      }}
                    >
                      Start Journey
                    </button>
                    <p className="text-center text-gray-600 text-[10px] mt-2">
                      {formatDuration(selectedRoute.duration)} · {formatDistance(selectedRoute.distance)}
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

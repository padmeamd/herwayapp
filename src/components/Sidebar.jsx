import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SearchBar from './SearchBar'
import RouteCard from './RouteCard'
import IncidentFeed from './IncidentFeed'
import SafeSpaceList from './SafeSpaceList'

const TABS = [
  { id: 'routes',    label: 'Routes',      icon: '🛣️' },
  { id: 'incidents', label: 'Reports',     icon: '⚠️' },
  { id: 'spaces',    label: 'Safe Spaces', icon: '🏠' },
]

export default function Sidebar({
  userLocation,
  origin,
  destination,
  routes,
  safetyScores,
  selectedRouteIndex,
  isLoadingRoutes,
  routeError,
  incidents,
  safeSpaces,
  showSafeSpaces,
  onOriginSelect,
  onOriginClear,
  onDestinationSelect,
  onDestinationClear,
  onSwap,
  onRouteSelect,
  onUnsafeDetail,
  onStartJourney,
  onReport,
  onToggleSafeSpaces,
}) {
  const [tab, setTab] = useState('routes')

  const selectedSafety = safetyScores[selectedRouteIndex]
  const safeScore = selectedSafety?.score
  const scoreColor = selectedSafety?.isRecommended
    ? '#22C55E'
    : safeScore ? '#EF4444' : null

  return (
    <div className="flex flex-col h-full">
      {/* ── Brand header ──────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-safe/20 border border-safe/40 flex items-center justify-center text-base flex-shrink-0">
            ✦
          </div>
          <div>
            <h1 className="text-white font-black text-lg leading-none tracking-tight">HerWay</h1>
            <p className="text-gray-500 text-[11px] mt-0.5">Safety-first navigation for women</p>
          </div>
        </div>

        {/* From / To search */}
        <div className="flex flex-col gap-1.5">
          {/* Row labels + swap */}
          <div className="flex items-center">
            <div className="flex-1 flex flex-col gap-1.5">

              {/* FROM */}
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">From</p>
                <SearchBar
                  userLocation={userLocation}
                  destination={origin}
                  onDestinationSelect={onOriginSelect}
                  onClear={onOriginClear}
                  isLoadingRoutes={false}
                  placeholder="My location in Oxford..."
                />
              </div>

              {/* TO */}
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">To</p>
                <SearchBar
                  userLocation={userLocation}
                  destination={destination}
                  onDestinationSelect={onDestinationSelect}
                  onClear={onDestinationClear}
                  isLoadingRoutes={isLoadingRoutes}
                  placeholder="College, museum, street in Oxford..."
                />
              </div>
            </div>

            {/* Swap button */}
            <button
              onClick={onSwap}
              disabled={!destination}
              title="Swap origin and destination"
              className="ml-2 flex-shrink-0 w-8 h-8 rounded-xl bg-card border border-white/8 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all self-center mt-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── AI safety strip (shows when routes exist) ──────────────────── */}
      <AnimatePresence>
        {safeScore && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-5 mt-3 px-4 py-2.5 rounded-xl flex items-center gap-2.5 border"
            style={{ backgroundColor: scoreColor + '15', borderColor: scoreColor + '40' }}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: scoreColor }} />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold" style={{ color: scoreColor }}>
                {safeScore}/100 — {selectedSafety?.label}
              </span>
              {selectedSafety?.isRecommended && (
                <span className="ml-2 text-[9px] font-black text-white/60 bg-white/10 px-1.5 py-0.5 rounded-full">
                  ✦ AI Pick
                </span>
              )}
            </div>
            <span className="text-[9px] text-gray-600 flex-shrink-0">LIVE</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div className="flex px-5 mt-3 gap-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
              tab === t.id
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <span className="text-sm">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
            {t.id === 'incidents' && incidents.length > 0 && (
              <span className="bg-danger text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {incidents.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Scrollable content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

        {/* Routes tab */}
        {tab === 'routes' && (
          <>
            {isLoadingRoutes && <AILoadingState />}

            {!isLoadingRoutes && routes.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-gray-600 text-[10px] font-bold tracking-widest uppercase">HerWay Route Comparison</p>
                  <span className="text-[9px] text-primary/60 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse inline-block" />
                    Live
                  </span>
                </div>
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

                {/* Start Journey button */}
                <button
                  onClick={onStartJourney}
                  className="w-full py-4 rounded-2xl font-black text-base text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] shadow-lg mt-2"
                  style={{
                    background: selectedSafety?.isRecommended
                      ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                      : 'linear-gradient(135deg, #EF4444, #B91C1C)',
                    boxShadow: selectedSafety?.isRecommended
                      ? '0 8px 24px rgba(34,197,94,0.35)'
                      : '0 8px 24px rgba(239,68,68,0.35)',
                  }}
                >
                  Start Journey
                </button>
              </>
            )}

            {!isLoadingRoutes && routeError && (
              <RouteErrorState error={routeError} />
            )}

            {!isLoadingRoutes && !routeError && routes.length === 0 && (
              <EmptyRoutesState />
            )}
          </>
        )}

        {/* Incidents tab */}
        {tab === 'incidents' && (
          <>
            <p className="text-gray-600 text-[10px] font-bold tracking-widest uppercase">Live Area Reports</p>
            <IncidentFeed incidents={incidents} onReport={onReport} />
          </>
        )}

        {/* Safe Spaces tab */}
        {tab === 'spaces' && (
          <>
            <p className="text-gray-600 text-[10px] font-bold tracking-widest uppercase">Trusted Safe Spaces</p>
            <SafeSpaceList
              safeSpaces={safeSpaces}
              showSafeSpaces={showSafeSpaces}
              onToggle={onToggleSafeSpaces}
            />
          </>
        )}
      </div>

      {/* ── Bottom attribution ─────────────────────────────────────────── */}
      <div className="px-5 py-3 border-t border-white/5">
        <p className="text-gray-700 text-[10px] text-center">
          ✦ HerWay — your safety is our priority · Reports are anonymous
        </p>
      </div>
    </div>
  )
}

const AI_STEPS = [
  { icon: '🕐', label: 'Checking time of day...' },
  { icon: '👁️', label: 'Scanning community reports...' },
  { icon: '💡', label: 'Analysing street lighting...' },
  { icon: '🏠', label: 'Locating safe spaces...' },
  { icon: '✦',  label: 'Scoring route safety...' },
]

function AILoadingState() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, AI_STEPS.length - 1)), 420)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="space-y-3">
      {/* Skeleton cards */}
                {[0, 1].map(i => (
        <div key={i} className="rounded-2xl border border-white/5 bg-card overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-6 w-28 bg-white/5 rounded-full animate-pulse" />
              <div className="w-14 h-14 rounded-full bg-white/5 animate-pulse" />
            </div>
            <div className="h-1.5 bg-white/5 rounded-full animate-pulse" />
            <div className="h-10 bg-white/5 rounded-xl animate-pulse" />
            <div className="h-8 bg-white/5 rounded-xl animate-pulse" style={{ animationDelay: '150ms' }} />
          </div>
        </div>
      ))}

      {/* AI step indicator */}
      <div className="flex flex-col items-center gap-2 py-3">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-primary/10 border border-primary/20 w-full">
          <span className="text-base w-5 text-center flex-shrink-0">{AI_STEPS[step].icon}</span>
          <span className="text-primary text-xs font-semibold flex-1">{AI_STEPS[step].label}</span>
          <div className="flex gap-1">
            {[0, 1, 2].map(d => (
              <div
                key={d}
                className="w-1 h-1 bg-primary/60 rounded-full animate-bounce"
                style={{ animationDelay: `${d * 120}ms` }}
              />
            ))}
          </div>
        </div>
        <p className="text-gray-600 text-[10px] text-center">✦ HerWay AI · Powered by real-time community data</p>
      </div>
    </div>
  )
}

function RouteErrorState({ error }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center py-6 px-4 gap-3 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-danger/15 border border-danger/30 flex items-center justify-center text-2xl">
        📍
      </div>
      <div>
        <h3 className="text-white font-bold text-sm mb-1">Location out of range</h3>
        <p className="text-gray-400 text-xs leading-relaxed">{error}</p>
      </div>
      <div className="w-full bg-surface border border-white/5 rounded-xl p-3 text-left space-y-1.5">
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">Try searching for</p>
        {[
          'Bodleian Library',
          'New College',
          'Covered Market',
          'Westgate Centre',
          'Magdalen Bridge',
          'Oxford Train Station',
        ].map(suggestion => (
          <p key={suggestion} className="text-gray-400 text-xs flex items-center gap-2">
            <span className="text-primary">›</span> {suggestion}
          </p>
        ))}
      </div>
      <p className="text-gray-600 text-[10px]">
        HerWay is optimised for Oxford, UK
      </p>
    </motion.div>
  )
}

function EmptyRoutesState() {
  return (
    <div className="flex flex-col items-center py-8 px-4 gap-3 text-center animate-fade-in">
      <div className="text-5xl">🛡️</div>
      <h3 className="text-white font-bold text-lg">Ready to Navigate with HerWay</h3>
      <p className="text-gray-500 text-sm leading-relaxed">
        Search any Oxford college, museum, café or street to see AI safety-scored routes.
      </p>
      <div className="w-full bg-surface border border-white/5 rounded-xl p-3 text-left space-y-1.5">
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">Popular destinations</p>
        {['Bodleian Library', 'New College', 'Covered Market', 'Ashmolean Museum'].map(s => (
          <p key={s} className="text-gray-400 text-xs flex items-center gap-2">
            <span className="text-primary">›</span> {s}
          </p>
        ))}
      </div>
      <div className="mt-1 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
        <p className="text-primary text-xs font-semibold">
          💡 Triple-click the ✦ button to activate emergency mode
        </p>
      </div>
    </div>
  )
}

import { motion } from 'framer-motion'
import { formatDuration, formatDistance } from '../services/routingService'

/**
 * Google Maps–style mobile navigation UI:
 *   – Top bar: current turn instruction (big arrow + street name)
 *   – Bottom strip: ETA · distance remaining · End button  
 *   – Floating recenter button (bottom-right, above strip)
 */
export default function NavigationHUD({
  isUnsafeRoute,
  progress,
  etaSeconds,
  distanceRemaining,
  destination,
  currentStep,
  showOverview,
  onToggleOverview,
  onRecenter,
  onEnd,
}) {
  const routeColor = isUnsafeRoute ? '#EF4444' : '#22C55E'
  const progressPct = Math.round(progress * 100)

  // derive turn arrow from step maneuver
  const maneuver = currentStep?.maneuver?.type ?? ''
  const modifier = currentStep?.maneuver?.modifier ?? ''
  const turnArrow = getTurnArrow(maneuver, modifier)
  const instruction = currentStep?.instruction ?? `Head to ${destination?.name ?? 'destination'}`
  const stepDist = currentStep?.distance
    ? formatDistance(currentStep.distance)
    : ''

  return (
    <>
      {/* ── Top instruction banner ── */}
      <motion.div
        className="nav-hud-top fixed left-0 right-0 z-[1200] flex items-center gap-3 pointer-events-auto"
        style={{
          top: 0,
          paddingTop: 'max(env(safe-area-inset-top),16px)',
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 14,
          background: isUnsafeRoute
            ? 'linear-gradient(180deg,rgba(100,0,0,0.97) 0%,rgba(30,10,10,0.93) 100%)'
            : 'linear-gradient(180deg,rgba(0,70,30,0.97) 0%,rgba(10,20,15,0.93) 100%)',
          backdropFilter: 'blur(16px)',
          boxShadow: `0 4px 24px ${routeColor}30`,
        }}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      >
        {/* Arrow icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: routeColor + '22', border: `1.5px solid ${routeColor}55` }}
        >
          {turnArrow}
        </div>

        {/* Instruction text */}
        <div className="flex-1 min-w-0">
          {stepDist && (
            <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5"
              style={{ color: routeColor }}>
              In {stepDist}
            </p>
          )}
          <p className="text-white font-black text-base leading-snug line-clamp-2">
            {instruction}
          </p>
        </div>

        {/* End button */}
        <button
          type="button"
          onClick={onEnd}
          className="flex-shrink-0 px-4 min-h-[44px] rounded-xl font-black text-white text-xs touch-manipulation active:scale-95"
          style={{ background: 'rgba(239,68,68,0.9)', boxShadow: '0 4px 16px rgba(239,68,68,0.4)' }}
        >
          End
        </button>
      </motion.div>

      {/* ── Recenter + overview buttons ── */}
      <motion.div
        className="nav-hud-fab fixed right-3 z-[1180] flex flex-col gap-2"
        style={{ bottom: 'calc(var(--nav-bottom-h, 88px) + env(safe-area-inset-bottom) + 12px)' }}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <button
          type="button"
          onClick={onRecenter}
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg touch-manipulation active:scale-95"
          style={{
            background: 'rgba(13,17,28,0.92)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
          }}
          title="Recenter"
        >
          ⊕
        </button>
        <button
          type="button"
          onClick={onToggleOverview}
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-bold shadow-lg touch-manipulation active:scale-95"
          style={{
            background: showOverview ? routeColor + '25' : 'rgba(13,17,28,0.92)',
            border: showOverview ? `1.5px solid ${routeColor}` : '1px solid rgba(255,255,255,0.15)',
            color: showOverview ? routeColor : '#9CA3AF',
            backdropFilter: 'blur(12px)',
          }}
          title="Route overview"
        >
          Map
        </button>
      </motion.div>

      {/* ── Bottom ETA strip ── */}
      <motion.div
        className="nav-hud-bottom fixed left-0 right-0 z-[1190] flex items-center gap-4 px-5 pointer-events-auto"
        style={{
          bottom: 0,
          paddingBottom: 'max(env(safe-area-inset-bottom),16px)',
          paddingTop: 16,
          background: 'rgba(13,17,28,0.97)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      >
        {/* ETA */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-2xl leading-none tabular-nums">
            {formatDuration(etaSeconds)}
          </p>
          <p className="text-gray-400 text-xs mt-0.5">
            {formatDistance(distanceRemaining)} · {destination?.name ?? 'destination'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex-1">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%`, background: routeColor, boxShadow: `0 0 8px ${routeColor}` }}
            />
          </div>
          <p className="text-gray-600 text-[10px] mt-1 text-right">{progressPct}% done</p>
        </div>

        {/* Safety dot */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: routeColor }} />
          <p className="text-[9px] font-bold" style={{ color: routeColor }}>
            {isUnsafeRoute ? 'ALERT' : 'SAFE'}
          </p>
        </div>
      </motion.div>
    </>
  )
}

function getTurnArrow(maneuver, modifier) {
  if (!maneuver) return '↑'
  if (maneuver === 'arrive') return '📍'
  if (maneuver === 'depart') return '🏁'
  if (maneuver === 'roundabout' || maneuver === 'rotary') return '🔄'
  if (modifier === 'left' || modifier === 'sharp left') return '←'
  if (modifier === 'right' || modifier === 'sharp right') return '→'
  if (modifier === 'slight left') return '↖'
  if (modifier === 'slight right') return '↗'
  if (modifier === 'uturn') return '↩'
  if (maneuver === 'turn') return modifier?.includes('left') ? '←' : '→'
  return '↑'
}

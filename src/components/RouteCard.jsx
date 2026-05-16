import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ROUTE_CONFIG } from '../data/mockData'
import { formatDuration, formatDistance, estimatedArrival } from '../services/routingService'

// ── Animated score ring ───────────────────────────────────────────────────────

function ScoreRing({ score, color }) {
  const [displayed, setDisplayed] = useState(0)
  const radius       = 22
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    setDisplayed(0)
    let frame
    let start = null
    const duration = 900
    const animate = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)  // ease-out cubic
      setDisplayed(Math.round(eased * score))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [score])

  const offset = circumference - (displayed / 100) * circumference

  return (
    <div className="relative flex-shrink-0">
      {/* Glow behind ring */}
      <div
        className="absolute inset-0 rounded-full blur-sm opacity-40"
        style={{ background: color }}
      />
      <svg width="56" height="56" viewBox="0 0 56 56" className="relative">
        {/* Track */}
        <circle cx="28" cy="28" r={radius} fill="none" stroke="#1C2436" strokeWidth="4.5" />
        {/* Progress */}
        <circle
          cx="28" cy="28" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          style={{ transition: 'stroke-dashoffset 0.05s linear', filter: `drop-shadow(0 0 4px ${color}88)` }}
        />
        <text x="28" y="24" textAnchor="middle" fill={color} fontSize="12" fontWeight="800">{displayed}</text>
        <text x="28" y="34" textAnchor="middle" fill="#4B5563" fontSize="8" fontWeight="600">/100</text>
      </svg>
    </div>
  )
}

// ── Factor row in breakdown ───────────────────────────────────────────────────

const FACTOR_ICONS = {
  'Time of Day':      '🕐',
  'Community Safety': '👁️',
  'Street Lighting':  '💡',
  'Safe Spaces':      '🏠',
  'Route Directness': '🛣️',
}

function FactorBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-4 flex-shrink-0">{FACTOR_ICONS[label] ?? '•'}</span>
      <span className="text-gray-500 text-[10px] w-24 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[10px] font-bold w-6 text-right tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RouteCard({ route, index, safety, isSelected, onSelect, onUnsafeDetail }) {
  const [expanded, setExpanded] = useState(false)
  const scoreColor = safety?.color ?? '#6B7280'
  const routeLabel = safety?.routeLabel ?? (ROUTE_CONFIG[index] ?? ROUTE_CONFIG[2]).label
  const routeIcon  = safety?.routeIcon ?? (ROUTE_CONFIG[index] ?? ROUTE_CONFIG[2]).icon
  const isUnsafe   = safety?.safetyClass === 'unsafe' && !safety?.isRecommended

  const borderColor = isSelected ? scoreColor + 'aa' : scoreColor + '33'
  const bgGlow      = isSelected ? scoreColor + '0d' : 'transparent'

  const handleClick = () => {
    onSelect(index)
    if (isUnsafe) onUnsafeDetail?.(index)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className={`rounded-2xl border transition-colors duration-300 cursor-pointer overflow-hidden relative touch-manipulation ${
        isUnsafe ? 'route-card-unsafe' : isSelected && safety?.isRecommended ? 'route-card-safe' : ''
      }`}
      style={{ borderColor, backgroundColor: bgGlow }}
      onClick={handleClick}
    >
      {/* Left safety-color accent strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: scoreColor, boxShadow: `0 0 8px ${scoreColor}88` }}
      />

      <div className="pl-5 pr-4 pt-4 pb-4">

        {/* ── Header row ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {/* Route type label */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold flex-shrink-0"
              style={{ borderColor: scoreColor + '55', backgroundColor: scoreColor + '15', color: scoreColor }}
            >
              <span>{routeIcon}</span>
              <span>{routeLabel}</span>
            </div>

            {/* AI Recommended badge */}
            {safety?.isRecommended && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black flex-shrink-0"
                style={{
                  background:  'linear-gradient(135deg, #22C55E, #16A34A)',
                  color:       'white',
                  boxShadow:   '0 0 12px rgba(34,197,94,0.5)',
                }}
              >
                ✦ Safest Route
              </motion.div>
            )}

            {safety?.hasActiveAlerts && !safety?.isRecommended && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black flex-shrink-0 warning-blink"
                style={{
                  background: 'rgba(239,68,68,0.2)',
                  color: '#FCA5A5',
                  border: '1px solid #EF4444',
                  boxShadow: '0 0 12px rgba(239,68,68,0.4)',
                }}
              >
                ⚠ Active Alerts
              </motion.div>
            )}

            {/* Selected badge */}
            {isSelected && !safety?.isRecommended && (
              <div className="border border-white/20 px-2 py-1 rounded-full">
                <span className="text-gray-400 text-[10px] font-bold">✓ Selected</span>
              </div>
            )}
          </div>

          {/* Score ring */}
          {safety && <ScoreRing score={safety.score} color={scoreColor} />}
        </div>

        {/* ── Safety label + bar ─────────────────────────────────────────────── */}
        {safety && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: scoreColor }}>
                {safety.statusLabel ?? safety.label}
              </span>
              <span className="text-[10px] text-gray-600">Safety score</span>
            </div>
            <div className="h-1.5 bg-bg rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${scoreColor}bb, ${scoreColor})`,
                  boxShadow:  `0 0 8px ${scoreColor}66`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${safety.score}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: index * 0.08 }}
              />
            </div>
          </div>
        )}

        {/* ── AI Explanation ────────────────────────────────────────────────── */}
        {isUnsafe && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onUnsafeDetail?.(index) }}
            className="w-full mb-3 min-h-[40px] py-2 rounded-xl border border-danger/40 text-danger text-xs font-bold warning-blink touch-manipulation"
            style={{ background: 'rgba(239,68,68,0.08)' }}
          >
            View why this route is unsafe ›
          </button>
        )}

        {safety?.explanation && (
          <div
            className="rounded-xl px-3 py-2.5 mb-3 border"
            style={{
              backgroundColor: scoreColor + '0c',
              borderColor:     scoreColor + '33',
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: scoreColor }}>
                ✦ HerWay Analysis
              </span>
            </div>
            <p className="text-gray-300 text-[11px] leading-relaxed">{safety.explanation}</p>
          </div>
        )}

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div className="flex items-stretch bg-bg rounded-xl overflow-hidden mb-3">
          {[
            { val: formatDuration(route.duration), lbl: 'Walk',    accent: true },
            { val: formatDistance(route.distance), lbl: 'Distance'              },
            { val: estimatedArrival(route.duration), lbl: 'Arrives'             },
          ].map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center py-2.5 relative">
              {i > 0 && <div className="absolute left-0 top-2 bottom-2 w-px bg-card" />}
              <span className="text-sm font-bold" style={{ color: item.accent ? scoreColor : '#F8FAFC' }}>
                {item.val}
              </span>
              <span className="text-[10px] text-gray-600 mt-0.5">{item.lbl}</span>
            </div>
          ))}
        </div>

        {/* ── Feature pills ─────────────────────────────────────────────────── */}
        {safety?.features?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {safety.features.map((f, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                style={{ borderColor: scoreColor + '44', color: scoreColor, backgroundColor: scoreColor + '0c' }}
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {/* ── Expandable breakdown ──────────────────────────────────────────── */}
        {safety?.breakdown && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-[11px] font-semibold transition-colors w-full"
            >
              <motion.span
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="inline-block"
              >
                ▾
              </motion.span>
              <span>{expanded ? 'Hide factor breakdown' : 'View AI factor breakdown'}</span>
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{   height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-3 bg-bg rounded-xl space-y-2.5">
                    {Object.entries(safety.breakdown).map(([label, value]) => (
                      <FactorBar key={label} label={label} value={value} color={scoreColor} />
                    ))}
                    <p className="text-gray-600 text-[10px] mt-1 pt-1 border-t border-white/5 flex items-center gap-1">
                      <span>✦</span>
                      <span>Scores update live as community reports come in</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  )
}

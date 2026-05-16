import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const REACTIONS = [
  { key: 'safe',  emoji: '✅', label: 'Safe now'   },
  { key: 'there', emoji: '⚠️', label: 'Still there' },
  { key: 'care',  emoji: '❤️', label: 'Stay safe'  },
]

export default function IncidentFeed({ incidents, onReport }) {
  const [reactions, setReactions] = useState({})
  const [myReactions, setMyReactions] = useState({})

  const severityColor = (s) =>
    s === 'high' ? '#F87171' : s === 'medium' ? '#FBBF24' : '#60A5FA'
  const severityEmoji = (s) =>
    s === 'high' ? '🚨' : s === 'medium' ? '⚠️' : 'ℹ️'

  const addReaction = (incId, type) => {
    const alreadyReacted = myReactions[incId] === type
    if (alreadyReacted) return
    setReactions(prev => ({
      ...prev,
      [incId]: { ...prev[incId], [type]: ((prev[incId]?.[type] ?? 0) + 1) },
    }))
    setMyReactions(prev => ({ ...prev, [incId]: type }))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-xs">
          {incidents.length} active reports in your area
        </p>
        <button
          onClick={onReport}
          className="text-accent text-xs font-semibold hover:text-accent/80 transition-colors flex items-center gap-1"
        >
          <span>+</span> Report
        </button>
      </div>

      {incidents.length === 0 && (
        <div className="flex flex-col items-center py-8 gap-3">
          <div className="text-3xl">✅</div>
          <p className="text-gray-500 text-sm text-center">No incidents reported nearby. Stay safe!</p>
        </div>
      )}

      {incidents.map((inc) => {
        const color = severityColor(inc.severity)
        const myReaction = myReactions[inc.id]
        const isNew = inc.time === 'Just now'
        const totalReactions = Object.values(reactions[inc.id] ?? {}).reduce((a, b) => a + b, 0)

        return (
          <motion.div
            key={inc.id}
            initial={isNew ? { opacity: 0, x: -12 } : false}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card rounded-xl overflow-hidden"
          >
            {/* Top accent line for high severity */}
            {inc.severity === 'high' && (
              <div className="h-0.5 w-full" style={{ background: color + '80' }} />
            )}

            <div className="p-3.5">
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: color + '22', border: `1.5px solid ${color}55` }}
                >
                  {severityEmoji(inc.severity)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color }}>{inc.type}</span>
                    {isNew && (
                      <span
                        className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                        style={{ background: color + '30', color }}
                      >
                        LIVE
                      </span>
                    )}
                    <span className="text-gray-600 text-[10px] ml-auto flex-shrink-0">{inc.time}</span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">{inc.description}</p>

                  {/* Report count + verified */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                      <span className="text-gray-600 text-[10px]">
                        {inc.reportCount} report{inc.reportCount === 1 ? '' : 's'}
                      </span>
                    </div>
                    {totalReactions > 0 && (
                      <span className="text-gray-600 text-[10px]">
                        · {totalReactions} reaction{totalReactions === 1 ? '' : 's'}
                      </span>
                    )}
                    {(reactions[inc.id]?.safe ?? 0) >= 2 && (
                      <span className="text-[10px] font-semibold text-safe bg-safe/10 px-1.5 py-0.5 rounded-full">
                        ✓ Community verified safe
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reaction buttons */}
              <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-white/5">
                {REACTIONS.map(r => {
                  const count = reactions[inc.id]?.[r.key] ?? 0
                  const isMine = myReaction === r.key
                  return (
                    <button
                      key={r.key}
                      onClick={() => addReaction(inc.id, r.key)}
                      disabled={!!myReaction}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                        isMine
                          ? 'bg-white/10 text-white'
                          : 'bg-white/4 text-gray-500 hover:bg-white/8 hover:text-gray-300 disabled:cursor-default'
                      }`}
                    >
                      <span>{r.emoji}</span>
                      <span>{r.label}</span>
                      {count > 0 && (
                        <span className={`font-bold ${isMine ? 'text-primary' : 'text-gray-500'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

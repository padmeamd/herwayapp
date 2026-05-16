import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { INCIDENT_TYPES } from '../data/mockData'

function formatCoords(loc) {
  if (!loc) return null
  return `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`
}

export default function ReportModal({ visible, onClose, onSubmit, reportLocation, onPickLocation }) {
  const [selected, setSelected] = useState(null)
  const [description, setDescription] = useState('')
  const [notifyNearby, setNotifyNearby] = useState(true)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!selected) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    setLoading(false)
    setDone(true)
    const type = INCIDENT_TYPES.find(t => t.id === selected)
    onSubmit?.({
      ...type,
      id: `user-${Date.now()}`,
      time: 'Just now',
      reportCount: 1,
      description: description.trim() || type.label,
      notifyNearby,
      reportLocation,
    })
    setTimeout(() => {
      setSelected(null)
      setDescription('')
      setNotifyNearby(true)
      setDone(false)
      onClose()
    }, 2200)
  }

  const handleClose = () => {
    setSelected(null)
    setDescription('')
    setNotifyNearby(true)
    setDone(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="report-modal"
          className="fixed inset-0 z-[1400] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            className="report-modal-sheet relative w-full sm:max-w-md flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            style={{
              background: 'linear-gradient(180deg, rgba(22,28,42,0.99) 0%, rgba(13,17,28,1) 100%)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px 24px 0 0',
              maxHeight: '92dvh',
            }}
          >
            {/* Drag handle */}
            <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            <AnimatePresence mode="wait">
              {done ? (
                /* ── Success state ── */
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center px-6 py-8 gap-4"
                  style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                    style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)' }}
                  >
                    ✓
                  </motion.div>
                  <div className="text-center">
                    <h3 className="text-white font-black text-2xl">Report Submitted</h3>
                    <p className="text-gray-400 text-sm mt-1">Thank you for keeping the community safe.</p>
                  </div>
                  {notifyNearby && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                      style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}
                    >
                      <span className="text-xl">🔔</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm">2 nearby users notified</p>
                        <p className="text-gray-500 text-xs">Anonymous alert sent to women in this area</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                /* ── Form ── */
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col min-h-0">
                  {/* Header */}
                  <div className="flex-shrink-0 flex items-start justify-between px-5 pt-2 pb-4">
                    <div>
                      <h2 className="text-white font-black text-xl leading-tight">Report an Incident</h2>
                      <p className="text-gray-500 text-sm mt-0.5">Reports are anonymous — help keep others safe.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 flex-shrink-0 ml-3 touch-manipulation active:scale-90"
                      style={{ background: 'rgba(255,255,255,0.07)' }}
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Scrollable content */}
                  <div
                    className="flex-1 overflow-y-auto overscroll-contain px-5 pb-3 space-y-4"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    {/* Location row */}
                    <div
                      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <span className="text-xl flex-shrink-0">📍</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Location</p>
                        {reportLocation ? (
                          <p className="text-white text-sm font-semibold truncate">
                            {formatCoords(reportLocation)}
                          </p>
                        ) : (
                          <p className="text-gray-500 text-sm">No location set</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={onPickLocation}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold touch-manipulation active:scale-95"
                        style={{
                          background: 'rgba(244,114,182,0.15)',
                          border: '1px solid rgba(244,114,182,0.35)',
                          color: '#F472B6',
                        }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {reportLocation ? 'Change' : 'Pick on map'}
                      </button>
                    </div>

                    {/* Incident type grid */}
                    <div>
                      <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-3">What happened?</p>
                      <div className="grid grid-cols-2 gap-2.5">
                        {INCIDENT_TYPES.map((item) => {
                          const isSelected = selected === item.id
                          const severityColor =
                            item.severity === 'high'   ? '#F87171' :
                            item.severity === 'medium' ? '#FBBF24' : '#60A5FA'
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setSelected(item.id)}
                              className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border transition-all duration-150 touch-manipulation active:scale-[0.97] min-h-[90px]"
                              style={{
                                borderColor: isSelected ? severityColor + '99' : 'rgba(255,255,255,0.07)',
                                background:  isSelected ? severityColor + '1A' : 'rgba(28,36,54,0.8)',
                                boxShadow:   isSelected ? `0 0 20px ${severityColor}22` : 'none',
                              }}
                            >
                              <span className="text-3xl leading-none">{item.icon}</span>
                              <span
                                className="text-xs font-semibold text-center leading-tight"
                                style={{ color: isSelected ? severityColor : '#9CA3AF' }}
                              >
                                {item.label}
                              </span>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-4 h-4 rounded-full flex items-center justify-center"
                                  style={{ background: severityColor }}
                                >
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </motion.div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">Details <span className="font-normal normal-case text-gray-700">(optional)</span></p>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Add any details that might help others…"
                        className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none transition-colors"
                        rows={3}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>

                    {/* Notify nearby toggle */}
                    <button
                      type="button"
                      onClick={() => setNotifyNearby(v => !v)}
                      className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl border transition-all duration-200 touch-manipulation"
                      style={{
                        background:   notifyNearby ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                        borderColor:  notifyNearby ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background:   notifyNearby ? '#6366F1' : 'transparent',
                          borderColor:  notifyNearby ? '#6366F1' : '#4B5563',
                        }}
                      >
                        {notifyNearby && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${notifyNearby ? 'text-white' : 'text-gray-400'}`}>
                          Notify nearby HerWay users
                        </p>
                        <p className="text-xs text-gray-600">Anonymous alert to women in this area</p>
                      </div>
                      {notifyNearby && (
                        <span className="flex items-center gap-1 text-[10px] text-primary font-black flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          LIVE
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Sticky action buttons */}
                  <div
                    className="flex-shrink-0 px-5 pt-3 pb-3 border-t border-white/5 flex gap-3"
                    style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
                  >
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 min-h-[54px] rounded-2xl font-semibold text-gray-400 touch-manipulation active:scale-[0.97]"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!selected || loading}
                      className="flex-[2] min-h-[54px] rounded-2xl font-black text-white touch-manipulation active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: selected
                          ? 'linear-gradient(135deg, #F472B6, #A78BFA)'
                          : 'rgba(55,65,81,0.8)',
                        boxShadow: selected ? '0 6px 24px rgba(244,114,182,0.4)' : 'none',
                      }}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting…
                        </span>
                      ) : 'Submit Report'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

import { useState, useEffect } from 'react'

const AI_STEPS = [
  { icon: '🕐', label: 'Checking time of day...' },
  { icon: '👁️', label: 'Scanning community reports...' },
  { icon: '💡', label: 'Analysing street lighting...' },
  { icon: '🏠', label: 'Locating safe spaces...' },
  { icon: '✦', label: 'Scoring route safety...' },
]

export default function AILoadingState() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, AI_STEPS.length - 1)), 420)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="space-y-3">
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

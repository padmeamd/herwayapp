import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signInWithEmail, signUpWithEmail, isSupabaseEnabled } from '../lib/supabase'

export default function AuthModal({ visible, onClose, onAuth }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      const fn = isLogin ? signInWithEmail : signUpWithEmail
      const { data, error: authError } = await fn(email, password)
      if (authError) throw authError
      onAuth(data.user)
      onClose()
    } catch (err) {
      setError(err.message ?? 'Authentication failed')
    }
    setLoading(false)
  }

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          className="relative w-full max-w-sm bg-surface border border-white/10 rounded-3xl p-8"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-2xl mb-3">
              ✦
            </div>
            <h2 className="text-white font-black text-xl">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {isLogin ? 'Sign in to HerWay' : 'Join HerWay today'}
            </p>
          </div>

          {!isSupabaseEnabled && (
            <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-xl">
              <p className="text-warning text-xs text-center font-medium">
                Supabase not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-card border border-white/5 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-card border border-white/5 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                required
              />
            </div>

            {error && (
              <p className="text-danger text-xs text-center bg-danger/10 border border-danger/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !isSupabaseEnabled}
              className="w-full py-4 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg, #A78BFA, #F472B6)', boxShadow: '0 6px 20px rgba(167,139,250,0.3)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <button
            onClick={() => { setIsLogin(!isLogin); setError('') }}
            className="w-full mt-4 text-center text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <span className="text-primary font-semibold">{isLogin ? 'Sign Up' : 'Sign In'}</span>
          </button>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-card flex items-center justify-center text-gray-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

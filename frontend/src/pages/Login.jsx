import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register, decodeToken } from '../services/auth'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function switchMode(next) {
    setMode(next)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (mode === 'register') {
      if (!email) return setError('Email is required.')
      if (password.length < 8) return setError('Password must be at least 8 characters.')
      if (password !== confirmPassword) return setError('Passwords do not match.')
    }
    setLoading(true)
    try {
      const data = mode === 'login'
        ? await login(email, password)
        : await register(email, password)
      const payload = decodeToken(data.access_token)
      navigate(payload?.role === 'admin' ? '/admin' : '/learner', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail ?? (mode === 'login' ? 'Login failed. Please try again.' : 'Registration failed.'))
    } finally {
      setLoading(false)
    }
  }

  const isRegister = mode === 'register'

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26A7 7 0 0012 2z" />
            </svg>
          </div>
          <span className="text-white font-semibold">Onboarding AI</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight">
            Your AI-powered<br />onboarding journey<br />starts here.
          </h2>
          <p className="text-indigo-200 mt-4 text-sm leading-relaxed">
            Personalized learning paths, adaptive quizzes, and an AI tutor — all in one place.
          </p>
        </div>
        <p className="text-indigo-300 text-xs">© 2025 Onboarding AI Platform</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26A7 7 0 0012 2z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-800">Onboarding AI</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {isRegister ? 'Create account' : 'Sign in'}
          </h1>
          <p className="text-sm text-slate-500 mb-7">
            {isRegister ? 'Join as a learner to start your onboarding.' : 'Enter your credentials to continue.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors mt-2"
            >
              {loading
                ? (isRegister ? 'Creating account…' : 'Signing in…')
                : (isRegister ? 'Create account' : 'Sign in')}
            </button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-6">
            {isRegister ? (
              <>Already have an account?{' '}
                <button onClick={() => switchMode('login')} className="text-indigo-600 font-medium hover:underline">Sign in</button>
              </>
            ) : (
              <>Don't have an account?{' '}
                <button onClick={() => switchMode('register')} className="text-indigo-600 font-medium hover:underline">Sign up</button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

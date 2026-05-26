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
      setError(err.response?.data?.detail ?? (mode === 'login' ? 'Login failed. Please try again.' : 'Registration failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const isRegister = mode === 'register'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Onboarding AI Platform</h1>
        <p className="text-sm text-gray-500 mb-6">{isRegister ? 'Create your learner account' : 'Sign in to your account'}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (isRegister ? 'Creating account…' : 'Signing in…') : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>
        <p className="text-sm text-gray-500 text-center mt-4">
          {isRegister ? (
            <>Already have an account?{' '}
              <button onClick={() => switchMode('login')} className="text-blue-600 hover:underline">Sign in</button>
            </>
          ) : (
            <>Don't have an account?{' '}
              <button onClick={() => switchMode('register')} className="text-blue-600 hover:underline">Sign up</button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

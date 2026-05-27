import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, getRole } from '../../services/auth'
import Icon from '../../icons'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      const role = getRole()
      navigate(role === 'admin' ? '/v2/admin' : '/v2/learner')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app no-shell" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 'min(420px, 92vw)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #0B1220 0%, #2563EB 100%)',
            display: 'grid', placeItems: 'center',
            color: 'white', fontWeight: 700, fontSize: 20,
            margin: '0 auto 16px',
          }}>A</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Sign in to Atlas</h1>
          <p className="muted" style={{ marginTop: 6, fontSize: 13.5 }}>Your onboarding platform</p>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field">
                <label>Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="field">
                <label>Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)', fontSize: 13 }}>
                  <Icon name="alert" size={14} /> {error}
                </div>
              )}
              <button className="btn primary" type="submit" disabled={loading} style={{ justifyContent: 'center', marginTop: 4 }}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>

        <p className="muted" style={{ textAlign: 'center', fontSize: 12, marginTop: 16 }}>
          Atlas · Onboarding AI Platform
        </p>
      </div>
    </div>
  )
}

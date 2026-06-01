import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, getRole } from '../../services/auth'
import Icon from '../../icons'

const FEATURES = [
  { icon: '✦', label: 'AI-powered onboarding paths' },
  { icon: '◈', label: 'Smart quiz generation & validation' },
  { icon: '⬡', label: 'Real-time learner analytics' },
]

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'atlas-login-css'
    style.textContent = `
      @keyframes atl-fade-up {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0);    }
      }
      @keyframes atl-fade-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes atl-orb-a {
        0%,100% { transform: translate(0,0)     scale(1);    }
        40%     { transform: translate(28px,-22px) scale(1.06); }
        70%     { transform: translate(-14px,16px) scale(0.96); }
      }
      @keyframes atl-orb-b {
        0%,100% { transform: translate(0,0)      scale(1);    }
        35%     { transform: translate(-22px,18px) scale(1.04); }
        65%     { transform: translate(18px,-12px) scale(0.97); }
      }
      @keyframes atl-spin-cw  { to { transform: rotate( 360deg); } }
      @keyframes atl-spin-ccw { to { transform: rotate(-360deg); } }
      @keyframes atl-spin-btn { to { transform: rotate( 360deg); } }
    `
    document.head.appendChild(style)
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => {
      document.getElementById('atlas-login-css')?.remove()
      cancelAnimationFrame(raf)
    }
  }, [])

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

  const anim = (name, delay = 0, dur = '0.55s') =>
    mounted ? { animation: `${name} ${dur} ${delay}s cubic-bezier(.22,.68,0,1.2) both` } : { opacity: 0 }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>

      {/* ── LEFT: dark hero ── */}
      <div style={{
        background: '#06090F',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '64px 52px',
      }}>

        {/* Ambient orbs */}
        <div style={{
          position: 'absolute', width: 520, height: 520, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(109,74,255,0.22) 0%, transparent 68%)',
          top: -120, left: -100,
          animation: 'atl-orb-a 14s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 68%)',
          bottom: -80, right: -80,
          animation: 'atl-orb-b 17s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 36 }}>

          {/* Logo + orbital rings */}
          <div style={{ position: 'relative', width: 100, height: 100, ...anim('atl-fade-up', 0) }}>
            {/* Outer orbit */}
            <div style={{
              position: 'absolute', inset: -20, borderRadius: '50%',
              border: '1px solid rgba(109,74,255,0.22)',
              animation: 'atl-spin-cw 22s linear infinite',
            }}>
              <div style={{
                position: 'absolute', top: -4, left: '50%',
                width: 8, height: 8, borderRadius: '50%',
                background: '#6D4AFF',
                transform: 'translateX(-50%)',
                boxShadow: '0 0 8px rgba(109,74,255,0.9)',
              }} />
            </div>
            {/* Inner orbit */}
            <div style={{
              position: 'absolute', inset: -8, borderRadius: '50%',
              border: '1px solid rgba(37,99,235,0.28)',
              animation: 'atl-spin-ccw 13s linear infinite',
            }}>
              <div style={{
                position: 'absolute', bottom: -3, left: '50%',
                width: 6, height: 6, borderRadius: '50%',
                background: '#2563EB',
                transform: 'translateX(-50%)',
                boxShadow: '0 0 8px rgba(37,99,235,0.9)',
              }} />
            </div>
            {/* Core mark */}
            <div style={{
              width: 100, height: 100, borderRadius: 26,
              background: 'linear-gradient(140deg, #141A2E 0%, #1D3A8A 45%, #6D4AFF 100%)',
              display: 'grid', placeItems: 'center',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08) inset, 0 0 48px rgba(109,74,255,0.4), 0 0 96px rgba(37,99,235,0.15)',
            }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 44, letterSpacing: '-0.05em', lineHeight: 1 }}>A</span>
            </div>
          </div>

          {/* Wordmark */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...anim('atl-fade-up', 0.07) }}>
            <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1 }}>
              Atlas
            </h1>
            <p style={{ margin: 0, fontSize: 14.5, color: 'rgba(255,255,255,0.4)', letterSpacing: '-0.01em' }}>
              Onboarding Intelligence Platform
            </p>
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 290 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 11,
                backdropFilter: 'blur(6px)',
                ...anim('atl-fade-up', 0.15 + i * 0.07),
              }}>
                <span style={{ fontSize: 15, color: '#8B6BFF', flexShrink: 0 }}>{f.icon}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 450, letterSpacing: '-0.005em' }}>{f.label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── RIGHT: form panel ── */}
      <div style={{
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '64px 52px',
        ...anim('atl-fade-in', 0.1, '0.4s'),
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* Header */}
          <div style={{ marginBottom: 38, ...anim('atl-fade-up', 0.18) }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)' }}>
              Welcome back
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-3)' }}>
              Sign in to your Atlas workspace
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18, ...anim('atl-fade-up', 0.22) }}>
            <div className="field">
              <label>Email address</label>
              <input
                className="input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                required
                style={{ fontSize: 14, padding: '10px 13px' }}
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
                style={{ fontSize: 14, padding: '10px 13px' }}
              />
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                color: 'var(--danger)', fontSize: 13,
                padding: '10px 12px',
                background: 'var(--danger-soft)',
                borderRadius: 'var(--r)',
                border: '1px solid rgba(185,28,28,0.12)',
              }}>
                <Icon name="alert" size={14} /> {error}
              </div>
            )}

            <button
              className="btn primary"
              type="submit"
              disabled={loading}
              style={{
                justifyContent: 'center',
                marginTop: 6,
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 'var(--r-md)',
                letterSpacing: '-0.01em',
                boxShadow: '0 1px 2px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" style={{ animation: 'atl-spin-btn 0.7s linear infinite', flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3" fill="none" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in →'}
            </button>
          </form>

          <p style={{ margin: '32px 0 0', textAlign: 'center', fontSize: 11.5, color: 'var(--text-3)', letterSpacing: '0.01em', ...anim('atl-fade-in', 0.35) }}>
            Atlas · Onboarding AI Platform
          </p>

        </div>
      </div>

    </div>
  )
}

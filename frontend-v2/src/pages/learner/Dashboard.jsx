import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../../components/shell/Topbar'
import { Gauge, Badge, Progress } from '../../components/ui'
import Icon from '../../icons'
import { getUserEmail } from '../../services/auth'
import { listLearnerProjects } from '../../services/projects'

export default function LearnerDashboard() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const email = getUserEmail() ?? ''
  const name = email.split('@')[0]

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  useEffect(() => {
    listLearnerProjects()
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const active = projects.filter(p => p.status !== 'Completed' && p.status !== 'Locked')
  const firstActive = active[0]

  const ACTIVITY = [
    { i: 'check', t: 'Check your progress', s: 'Track completion across modules' },
    { i: 'sparkle', t: 'Ask Atlas AI Tutor', s: 'Get help with any topic' },
    { i: 'doc', t: 'Continue reading', s: firstActive?.name ?? 'Start a learning path' },
  ]

  return (
    <>
      <Topbar crumbs={['Home']} actions={
        <>
          <button className="btn ghost"><Icon name="bookmark" size={14} /> Bookmarks</button>
          <button className="btn ai" onClick={() => navigate('/v2/learner/ai-tutor')}><Icon name="sparkle" size={14} /> Ask Atlas</button>
        </>
      } />
      <div className="viewport">
        <div style={{ padding: '28px 28px 8px' }}>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div>
              <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{today}</div>
              <h1 style={{ fontSize: 26, fontWeight: 600, margin: '4px 0 0', letterSpacing: '-0.02em' }}>Welcome back, {name}</h1>
            </div>
            {active.length > 0 && (
              <div className="row" style={{ marginLeft: 'auto', gap: 8 }}>
                <Badge tone="success" dot>On track</Badge>
              </div>
            )}
          </div>
        </div>

        <div className="page-body" style={{ paddingTop: 16 }}>
          {/* Hero: Continue learning */}
          {loading ? (
            <div className="card"><div className="card-body"><div className="skeleton" style={{ height: 160 }} /></div></div>
          ) : firstActive ? (
            <div className="card" style={{ background: 'linear-gradient(135deg, #0B1220 0%, #1E293B 100%)', color: 'white', border: 0, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', right: -40, top: -40, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,74,255,0.3), transparent 70%)' }} />
              <div style={{ padding: 28, position: 'relative', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Continue learning</div>
                  <h2 style={{ fontSize: 22, fontWeight: 600, margin: '6px 0 4px', letterSpacing: '-0.015em' }}>{firstActive.name}</h2>
                  <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>{firstActive.description ?? 'Keep going!'}</div>
                  <div className="row" style={{ marginTop: 16, gap: 8 }}>
                    <button className="btn primary lg" onClick={() => navigate(`/v2/learner/paths/${firstActive.id}`)}>
                      <Icon name="play" size={14} /> Continue
                    </button>
                    <button className="btn lg" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', color: 'white' }} onClick={() => navigate('/v2/learner/paths')}>
                      View all paths
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', placeItems: 'center' }}>
                  <Gauge value={firstActive.completion_rate ?? 0} label="Progress" color="#A78BFA" size={150} />
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
              <h3>No active learning paths</h3>
              <p className="muted">Your manager hasn't assigned any learning paths yet. Check back soon.</p>
            </div>
          )}

          {/* Three columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16, marginTop: 16 }}>
            <div className="card">
              <div className="card-h">
                <h3>My learning paths</h3>
                <span className="sub">{active.length} active</span>
                <div className="actions">
                  <button className="btn ghost sm" onClick={() => navigate('/v2/learner/paths')}>View all <Icon name="chevronRight" size={12} /></button>
                </div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {projects.length === 0 ? (
                  <div className="muted" style={{ fontSize: 13, textAlign: 'center', padding: 12 }}>No paths assigned yet.</div>
                ) : projects.slice(0, 3).map(p => (
                  <div key={p.id} className="row" style={{ gap: 14, padding: 12, background: 'var(--surface-2)', borderRadius: 10, cursor: 'pointer' }} onClick={() => navigate(`/v2/learner/paths/${p.id}`)}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'white', border: '1px solid var(--border)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon name="book" size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{p.description ?? ''}</div>
                      <div style={{ marginTop: 6 }}><Progress value={p.completion_rate ?? 0} /></div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="num" style={{ fontSize: 15, fontWeight: 600 }}>{p.completion_rate ?? 0}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card ai-grad-bg" style={{ borderColor: 'var(--border-ai)' }}>
              <div className="card-h" style={{ borderBottomColor: 'var(--border-ai)' }}>
                <Icon name="sparkle" size={14} style={{ color: 'var(--ai)' }} />
                <h3>Atlas suggests</h3>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13 }}>Stay consistent — even 20 minutes a day keeps your readiness score climbing.</div>
                <button className="btn ai sm" style={{ alignSelf: 'flex-start' }} onClick={() => navigate('/v2/learner/ai-tutor')}>
                  <Icon name="bulb" size={12} /> Ask Atlas
                </button>
                <div className="sep" />
                <div style={{ fontSize: 13 }}>Bookmark chapters you want to revisit before quizzes.</div>
                <button className="btn sm" style={{ alignSelf: 'flex-start' }}><Icon name="bookmark" size={12} /> My bookmarks</button>
              </div>
            </div>

            <div className="card">
              <div className="card-h"><h3>Your readiness</h3></div>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Gauge value={0} label="Readiness" size={110} />
                <div style={{ flex: 1 }}>
                  <div className="muted" style={{ fontSize: 12 }}>Complete quizzes to update your readiness score</div>
                  <button className="btn sm" style={{ marginTop: 8 }} onClick={() => navigate('/v2/learner/readiness')}>View details</button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <div className="card">
              <div className="card-h"><h3>Up next</h3></div>
              <div className="card-body flush">
                {projects.length === 0 ? (
                  <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No upcoming tasks</div>
                ) : projects.slice(0, 3).map((p, i) => (
                  <div key={p.id} className="row" style={{ padding: '12px 18px', borderTop: i === 0 ? 0 : '1px solid var(--border)', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
                      <Icon name="book" size={14} />
                    </div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div><div className="muted" style={{ fontSize: 12 }}>{p.completion_rate ?? 0}% complete</div></div>
                    <button className="btn sm" onClick={() => navigate(`/v2/learner/paths/${p.id}`)}>Continue</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-h"><h3>Recent activity</h3></div>
              <div className="card-body flush">
                {ACTIVITY.map((it, i) => (
                  <div key={i} className="row" style={{ padding: '10px 18px', borderTop: i === 0 ? 0 : '1px solid var(--border)', gap: 10 }}>
                    <Icon name={it.i} size={14} style={{ color: 'var(--text-3)' }} />
                    <div style={{ flex: 1, fontSize: 13 }}>{it.t}</div>
                    <span className="muted" style={{ fontSize: 11 }}>{it.s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../../components/shell/Topbar'
import { KpiCard, LineChart, Sparkline, Badge, Avatar, Progress, StatusBadge, Toast } from '../../components/ui'
import Icon from '../../icons'
import { listAdminProjects } from '../../services/projects'
import { getUserEmail } from '../../services/auth'

const ACTIVITY = [
  { who: 'Atlas AI', act: 'generated', what: 'learning path · 4 weeks', when: '1h', icon: 'sparkle', ai: true },
  { who: 'Admin', act: 'uploaded', what: 'Observability Guide v2', when: '2h', icon: 'upload' },
  { who: 'Learner', act: 'passed quiz', what: 'Week 1 · 92%', when: '3h', icon: 'check' },
  { who: 'Atlas AI', act: 'generated', what: '12 quiz questions', when: '5h', icon: 'sparkle', ai: true },
  { who: 'Learner', act: 'asked AI', what: 'How does SSO work?', when: 'Yesterday', icon: 'chat' },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const email = getUserEmail() ?? ''
  const name = email.split('@')[0]

  useEffect(() => {
    listAdminProjects().then(setProjects).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const activeProjects = projects.filter(p => p.status === 'Active' || !p.status)
  const totalLearners = activeProjects.reduce((s, p) => s + (p.learner_count ?? 0), 0)

  return (
    <>
      <Topbar crumbs={['Workspace', 'Dashboard']} actions={
        <button className="btn primary" onClick={() => navigate('/v2/admin/projects/new')}>
          <Icon name="plus" size={14} /> New project
        </button>
      } />
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>Good morning, {name}</h1>
            <div className="sub">Here's how onboarding is moving across your workspace this week.</div>
          </div>
          <div className="actions">
            <div className="row" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 2 }}>
              {['7d', '30d', 'QTD'].map(p => (
                <button key={p} className={'btn ghost sm' + (p === '30d' ? ' primary' : '')}>{p}</button>
              ))}
            </div>
            <button className="btn"><Icon name="download" size={14} /> Export</button>
          </div>
        </div>

        <div className="page-body" style={{ paddingTop: 4 }}>
          <div className="kpi-grid" style={{ marginBottom: 18 }}>
            <KpiCard label="Active projects" value={activeProjects.length || '—'} trend="+1" sub="this workspace" />
            <KpiCard label="Active learners" value={totalLearners || '—'} sub="across projects" />
            <KpiCard label="Avg. completion" value="—" sub="in progress" />
            <KpiCard label="Avg. readiness score" value="—" sub="of 100" />
            <KpiCard label="Pending quizzes" value="—" tone="warning" sub="awaiting review" />
            <KpiCard label="AI tutor usage" sub="messages this week" ai value="—" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div className="col" style={{ gap: 16 }}>
              <div className="card">
                <div className="card-h">
                  <h3>Onboarding velocity</h3>
                  <span className="sub">Module completions / week</span>
                  <div className="actions">
                    <Badge tone="accent" dot>Completions</Badge>
                    <Badge tone="ai" dot>AI sessions</Badge>
                  </div>
                </div>
                <div className="card-body">
                  <LineChart data={[42, 48, 51, 49, 57, 64, 68, 72, 70, 78, 84, 91]} height={180} />
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-3)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
                    {['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'].map(w => <span key={w}>{w}</span>)}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="card"><div className="card-body"><div className="skeleton" style={{ height: 120 }} /></div></div>
              ) : (
                <div className="card">
                  <div className="card-h">
                    <h3>Projects</h3>
                    <span className="sub">{activeProjects.length} active</span>
                    <div className="actions">
                      <button className="btn ghost sm" onClick={() => navigate('/v2/admin/projects')}>
                        View all <Icon name="chevronRight" size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="card-body flush">
                    <table className="table">
                      <thead><tr><th>Project</th><th>Learners</th><th>Completion</th><th>Status</th></tr></thead>
                      <tbody>
                        {activeProjects.slice(0, 5).map(p => (
                          <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/v2/admin/projects/${p.id}`)}>
                            <td><div className="cell-strong">{p.name}</div><div className="cell-meta">{p.description}</div></td>
                            <td className="num">{p.learner_count ?? '—'}</td>
                            <td style={{ minWidth: 120 }}>
                              <Progress value={p.completion_rate ?? 0} />
                              <div className="cell-meta num" style={{ marginTop: 4 }}>{p.completion_rate ?? 0}%</div>
                            </td>
                            <td><StatusBadge status={p.status ?? 'Active'} /></td>
                          </tr>
                        ))}
                        {activeProjects.length === 0 && (
                          <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 24 }}>No projects yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="col" style={{ gap: 16 }}>
              <div className="card ai-grad-bg" style={{ borderColor: 'var(--border-ai)' }}>
                <div className="card-h" style={{ borderBottomColor: 'var(--border-ai)' }}>
                  <Icon name="sparkle" size={14} style={{ color: 'var(--ai)' }} />
                  <h3>Weekly insight</h3>
                  <span className="sub">AI-generated</span>
                </div>
                <div className="card-body">
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>
                    Your learners are progressing well. Review any flagged quiz questions and ensure all documents are indexed for optimal AI tutor accuracy.
                  </p>
                  <div className="row" style={{ gap: 6, marginTop: 14 }}>
                    <button className="btn ai sm" onClick={() => navigate('/v2/admin/quizzes')}>
                      <Icon name="sparkle" size={12} /> Review quizzes
                    </button>
                    <button className="btn sm">Dismiss</button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-h"><h3>Recent activity</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                  {ACTIVITY.map((it, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderTop: i === 0 ? 0 : '1px solid var(--border)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: it.ai ? 'var(--ai-soft)' : 'var(--surface-2)', color: it.ai ? 'var(--ai)' : 'var(--text-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Icon name={it.icon} size={14} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                        <strong>{it.who}</strong> <span className="muted">{it.act}</span> <span style={{ fontWeight: 500 }}>{it.what}</span>
                      </div>
                      <span className="muted" style={{ fontSize: 11 }}>{it.when}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-h"><h3>Alerts</h3></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <AlertRow tone="warning" icon="alert" title="Quiz questions pending review" sub="Visit the Quizzes page to publish" />
                  <AlertRow tone="info" icon="info" title="Documents processing" sub="Some documents may still be indexing" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function AlertRow({ tone, icon, title, sub }) {
  return (
    <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
      <div style={{ width: 26, height: 26, borderRadius: 6, background: `var(--${tone}-soft)`, color: `var(--${tone})`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={14} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
        <div className="muted" style={{ fontSize: 12 }}>{sub}</div>
      </div>
    </div>
  )
}

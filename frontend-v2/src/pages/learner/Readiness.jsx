import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../../components/shell/Topbar'
import { Gauge, Progress, Badge } from '../../components/ui'
import Icon from '../../icons'
import { getProgress } from '../../services/progress'
import { listLearnerProjects } from '../../services/projects'

const SUGGESTED = [
  { t: 'Start your first module', e: 'Begin the learning path', b: '+10 readiness', i: 'book', nav: '/v2/learner/paths' },
  { t: 'Complete a quiz', e: 'Quizzes update your readiness score', b: '+15 readiness', i: 'check', nav: '/v2/learner/paths' },
  { t: 'Ask Atlas a question', e: 'AI tutoring helps fill knowledge gaps', b: '+3 readiness', i: 'sparkle', nav: '/v2/learner/ai-tutor' },
]

function readinessLabel(score) {
  if (score >= 85) return 'Production-ready'
  if (score >= 70) return 'Approaching production-ready'
  if (score >= 50) return 'Building foundations'
  if (score > 0) return 'Getting started'
  return 'Not yet started'
}

export default function LearnerReadiness() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listLearnerProjects()
      .then(res => {
        const list = Array.isArray(res) ? res : (res.projects ?? [])
        setProjects(list)
        if (list.length > 0) setProjectId(list[0].id)
        else setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    getProgress(projectId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [projectId])

  const readiness = data ? Math.round(data.readiness_score) : 0
  const quizAvg = data ? Math.round(data.quiz_avg * 100) : 0
  const history = data?.quiz_history ?? []
  const lastScore = history.length > 0 ? Math.round(history[0].score * 100) : null

  return (
    <>
      <Topbar crumbs={['Evaluation']} actions={
        <>
          {projects.length > 1 && (
            <select className="select" value={projectId ?? ''} onChange={e => setProjectId(e.target.value)} style={{ fontSize: 13, height: 32 }}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <button className="btn ai" onClick={() => navigate('/v2/learner/ai-tutor')}>
            <Icon name="sparkle" size={14} /> Ask Atlas where to focus
          </button>
        </>
      } />
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>Readiness evaluation</h1>
            <div className="sub">A live signal of how production-ready you are. Updates after every quiz and AI session.</div>
          </div>
        </div>
        <div className="page-body">
          {loading ? (
            <div className="card"><div className="card-body"><div className="skeleton" style={{ height: 200 }} /></div></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
              <div className="card" style={{ padding: 22, textAlign: 'center' }}>
                <Gauge value={readiness} label="Overall" size={180} />
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{readinessLabel(readiness)}</div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                    {readiness === 0 ? 'Complete quizzes to update your score' : `Target: 85 to be production-ready`}
                  </div>
                </div>
                <div className="sep" />
                <div className="row" style={{ justifyContent: 'space-around', fontSize: 12 }}>
                  <div>
                    <div className="num" style={{ fontSize: 16, fontWeight: 600 }}>{history.length > 0 ? Math.max(...history.map(h => Math.round(h.score * 100))) : '—'}</div>
                    <div className="muted">Best score</div>
                  </div>
                  <div>
                    <div className="num" style={{ fontSize: 16, fontWeight: 600 }}>{quizAvg > 0 ? `${quizAvg}%` : '—'}</div>
                    <div className="muted">Quiz avg</div>
                  </div>
                  <div>
                    <div className="num" style={{ fontSize: 16, fontWeight: 600 }}>{lastScore != null ? `${lastScore > quizAvg ? '+' : ''}${lastScore - quizAvg}%` : '—'}</div>
                    <div className="muted">vs avg</div>
                  </div>
                </div>
              </div>

              <div className="col" style={{ gap: 16 }}>
                <div className="card">
                  <div className="card-h"><h3>Quiz performance</h3><span className="sub">By attempt</span></div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {history.length === 0 ? (
                      <div className="muted" style={{ fontSize: 13 }}>No quiz attempts yet. Complete a module to take its quiz.</div>
                    ) : history.slice(0, 5).map((h, i) => {
                      const pct = Math.round(h.score * 100)
                      const passed = pct >= 75
                      return (
                        <div key={i}>
                          <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                            <span>Attempt #{history.length - i}</span>
                            <span style={{ color: passed ? 'var(--success)' : 'var(--danger)', fontWeight: 500 }}>{pct}% {passed ? '✓' : '✗'}</span>
                          </div>
                          <Progress value={pct} tone={pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger'} />
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="card">
                  <div className="card-h"><h3>Suggested next steps</h3><span className="sub">Most impactful for your readiness</span></div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {SUGGESTED.map(s => (
                      <div key={s.t} className="row" style={{ gap: 12, padding: 12, background: 'var(--surface-2)', borderRadius: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'white', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
                          <Icon name={s.i} size={16} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{s.t}</div>
                          <div className="muted" style={{ fontSize: 12 }}>{s.e}</div>
                        </div>
                        <Badge tone="success">{s.b}</Badge>
                        <button className="btn sm" onClick={() => navigate(s.nav)}>Start</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

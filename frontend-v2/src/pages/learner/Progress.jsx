import { useState, useEffect } from 'react'
import Topbar from '../../components/shell/Topbar'
import { KpiCard, LineChart, BarChart, Progress } from '../../components/ui'
import Icon from '../../icons'
import { getProgress } from '../../services/progress'
import { listLearnerProjects } from '../../services/projects'

const ACHIEVEMENTS = [
  { i: 'flame', t: 'First steps', s: 'Started your first path', unlocked: false },
  { i: 'trophy', t: 'First quiz', s: 'Complete a quiz to unlock', unlocked: false },
  { i: 'bolt', t: 'Quick learner', s: 'Finish ahead of schedule', unlocked: false },
  { i: 'star', t: 'Curious', s: 'Ask 10 Atlas questions', unlocked: false },
]

export default function LearnerProgress() {
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

  const history = data?.quiz_history ?? []
  const readinessTrend = history.length > 0
    ? history.slice().reverse().map(h => Math.round(h.score * 100))
    : Array(12).fill(0)

  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString() : '—'

  return (
    <>
      <Topbar crumbs={['Progress']} actions={
        projects.length > 1 && (
          <select className="select" value={projectId ?? ''} onChange={e => setProjectId(e.target.value)} style={{ fontSize: 13, height: 32 }}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )
      } />
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>Your progress</h1>
            <div className="sub">Track your learning across all assigned paths.</div>
          </div>
        </div>
        <div className="page-body">
          {loading ? (
            <div className="card"><div className="card-body"><div className="skeleton" style={{ height: 120 }} /></div></div>
          ) : (
            <>
              <div className="kpi-grid" style={{ marginBottom: 16 }}>
                <KpiCard label="Modules completed" value={data ? `${data.modules_completed}/${data.modules_total}` : '—'} sub="of total" />
                <KpiCard label="Quiz history" value={data ? String(history.length) : '—'} sub="quizzes taken" />
                <KpiCard label="Quiz average" value={data ? `${Math.round(data.quiz_avg * 100)}%` : '—'} sub="across attempts" />
                <KpiCard label="Readiness" value={data ? Math.round(data.readiness_score) : '—'} sub="of 100" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <div className="card">
                  <div className="card-h"><h3>Quiz score trend</h3><span className="sub">{history.length} attempts</span></div>
                  <div className="card-body">
                    <LineChart data={readinessTrend} height={180} color="var(--success)" />
                    {history.length === 0 && (
                      <div className="muted" style={{ fontSize: 12, textAlign: 'center', marginTop: 8 }}>Complete quizzes to see your score trend</div>
                    )}
                  </div>
                </div>
                <div className="card">
                  <div className="card-h"><h3>Module progress</h3></div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data ? (
                      <>
                        <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}>
                          <span>Completed</span>
                          <strong className="num">{data.modules_completed} / {data.modules_total}</strong>
                        </div>
                        <Progress value={data.modules_total > 0 ? Math.round((data.modules_completed / data.modules_total) * 100) : 0} tone="success" />
                        <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, marginTop: 8 }}>
                          <span>Readiness score</span>
                          <strong className="num">{Math.round(data.readiness_score)} / 100</strong>
                        </div>
                        <Progress value={Math.round(data.readiness_score)} />
                      </>
                    ) : (
                      <div className="muted" style={{ fontSize: 13 }}>No project data yet.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginTop: 16 }}>
                <div className="card-h"><h3>Quiz history</h3></div>
                <div className="card-body flush">
                  <table className="table">
                    <thead><tr><th>Attempt</th><th>Score</th><th>Questions</th><th>Result</th><th>When</th></tr></thead>
                    <tbody>
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 32, fontSize: 13 }}>
                            No quizzes taken yet. Complete a module to unlock its quiz.
                          </td>
                        </tr>
                      ) : history.map((h, i) => {
                        const pct = Math.round(h.score * 100)
                        const passed = pct >= 75
                        return (
                          <tr key={i}>
                            <td className="muted" style={{ fontSize: 13 }}>#{history.length - i}</td>
                            <td><strong className="num">{pct}%</strong></td>
                            <td className="muted">{Math.round(h.score * h.total)} / {h.total} correct</td>
                            <td>
                              <span style={{ fontSize: 12, fontWeight: 500, color: passed ? 'var(--success)' : 'var(--danger)' }}>
                                {passed ? 'Passed' : 'Failed'}
                              </span>
                            </td>
                            <td className="muted" style={{ fontSize: 12 }}>{formatDate(h.attempted_at)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid-2" style={{ marginTop: 16 }}>
                <div className="card">
                  <div className="card-h"><h3>Activity heatmap</h3><span className="sub">Quiz attempts</span></div>
                  <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
                      {Array.from({ length: 84 }).map((_, i) => {
                        const hasActivity = history.some((h, hi) => hi % 84 === i)
                        return (
                          <div key={i} style={{ aspectRatio: 1, borderRadius: 3, background: hasActivity ? 'var(--accent)' : 'var(--surface-2)' }} />
                        )
                      })}
                    </div>
                    <div className="row" style={{ marginTop: 10, justifyContent: 'flex-end', gap: 6, fontSize: 11, color: 'var(--text-3)' }}>
                      <span>Less</span>
                      {[0.1, 0.3, 0.5, 0.8, 1].map(v => (
                        <div key={v} style={{ width: 10, height: 10, background: `color-mix(in srgb, var(--accent) ${Math.round(v * 70 + 10)}%, white)`, borderRadius: 2 }} />
                      ))}
                      <span>More</span>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-h"><h3>Achievements</h3></div>
                  <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {ACHIEVEMENTS.map((a, i) => {
                      const unlocked =
                        (i === 0 && data && data.modules_completed > 0) ||
                        (i === 1 && history.length > 0)
                      return (
                        <div key={a.t} className="row" style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 10, gap: 10, opacity: unlocked ? 1 : 0.5 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: unlocked ? 'var(--accent-soft)' : 'white', color: unlocked ? 'var(--accent)' : 'var(--text-3)', display: 'grid', placeItems: 'center' }}>
                            <Icon name={a.i} size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{a.t}</div>
                            <div className="muted" style={{ fontSize: 11 }}>{unlocked ? 'Unlocked!' : a.s}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

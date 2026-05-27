import { useState, useEffect } from 'react'
import Topbar from '../../components/shell/Topbar'
import { KpiCard, LineChart, BarChart, Heatmap, AIChip, Progress, Avatar } from '../../components/ui'
import Icon from '../../icons'
import { listAdminProjects } from '../../services/projects'

export default function AdminAnalytics() {
  const [projects, setProjects] = useState([])
  const [period, setPeriod] = useState('30d')
  const [projectFilter, setProjectFilter] = useState('all')

  useEffect(() => {
    listAdminProjects().then(setProjects).catch(() => {})
  }, [])

  return (
    <>
      <Topbar crumbs={['Workspace', 'Analytics']} actions={
        <button className="btn"><Icon name="download" size={14} /> Export CSV</button>
      } />
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>Analytics</h1>
            <div className="sub">Adoption, learning effectiveness and AI usage across all projects.</div>
          </div>
          <div className="actions">
            <select className="select" style={{ width: 200 }} value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
              <option value="all">All projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="row" style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 2 }}>
              {['7d', '30d', '90d', 'YTD'].map(p => (
                <button key={p} className="btn ghost sm" style={p === period ? { background: 'var(--surface-2)' } : {}} onClick={() => setPeriod(p)}>{p}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="page-body">
          <div className="kpi-grid" style={{ marginBottom: 16 }}>
            <KpiCard label="Completion rate" value="—" sub="of assigned learners" />
            <KpiCard label="Quiz pass rate" value="—" sub="first attempt" />
            <KpiCard label="Avg. readiness" value="—" sub="of 100" />
            <KpiCard label="Drop-off rate" value="—" sub="at Week 2" />
            <KpiCard label="Avg. learning time" value="—" sub="per week" />
            <KpiCard label="AI tutor usage" value="—" sub="messages this week" ai />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div className="card">
              <div className="card-h">
                <h3>Completion trend</h3>
                <span className="sub">12 weeks</span>
              </div>
              <div className="card-body">
                <LineChart data={[18, 22, 28, 33, 40, 46, 52, 58, 64, 68, 72, 78]} height={180} />
              </div>
            </div>
            <div className="card">
              <div className="card-h"><h3>Quiz scores by week</h3></div>
              <div className="card-body">
                <BarChart data={[{ l: 'W1', v: 84 }, { l: 'W2', v: 67, dim: true }, { l: 'W3', v: 78 }, { l: 'W4', v: 82 }]} height={180} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginTop: 16 }}>
            <div className="card">
              <div className="card-h">
                <h3>Topic mastery heatmap</h3>
                <span className="sub">% correct on first attempt</span>
              </div>
              <div className="card-body">
                <Heatmap
                  rows={['Architecture', 'Auth', 'Deploy', 'Observability', 'On-call', 'Incidents']}
                  cols={['W1', 'W2', 'W3', 'W4', 'Final']}
                  data={[
                    [82, 67, 72, 78, 84],
                    [76, 52, 68, 71, 72],
                    [88, 80, 74, 82, 86],
                    [70, 72, 68, 79, 77],
                    [85, 82, 80, 88, 90],
                    [72, 68, 76, 80, 82],
                  ]}
                />
              </div>
            </div>
            <div className="card">
              <div className="card-h"><h3>Top learners</h3></div>
              <div className="card-body flush">
                <table className="table">
                  <tbody>
                    {projects.length === 0 ? (
                      <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 24 }}>No data yet</td></tr>
                    ) : projects.slice(0, 6).map((p, i) => (
                      <tr key={p.id}>
                        <td style={{ width: 24 }} className="muted mono">{i + 1}</td>
                        <td><div className="row" style={{ gap: 8 }}><Avatar initials={p.name.slice(0, 2).toUpperCase()} sz="sm" /><span className="cell-strong">{p.name}</span></div></td>
                        <td className="num">{p.completion_rate ?? 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-h">
              <h3>Weakest topics</h3>
              <span className="sub">Sorted by first-attempt failures</span>
            </div>
            <div className="card-body flush">
              <table className="table">
                <thead><tr><th>Topic</th><th>Cohort</th><th>First-attempt pass</th><th>AI questions / wk</th><th>Suggested action</th></tr></thead>
                <tbody>
                  {[
                    ['Service-to-service auth', 'Platform Eng', 52, 128, 'Add focused chapter'],
                    ['Circuit breakers', 'Platform Eng', 61, 72, 'Re-explain in plain language'],
                    ['SLA escalation', 'CS Tier 1', 58, 94, 'Add 5 review questions'],
                  ].map(r => (
                    <tr key={r[0]}>
                      <td className="cell-strong">{r[0]}</td>
                      <td className="cell-meta">{r[1]}</td>
                      <td>
                        <div className="row">
                          <div style={{ flex: 1 }}><Progress value={r[2]} tone={r[2] > 70 ? '' : 'warning'} /></div>
                          <span className="num cell-meta" style={{ width: 36, textAlign: 'right' }}>{r[2]}%</span>
                        </div>
                      </td>
                      <td className="num">{r[3]}</td>
                      <td><AIChip>{r[4]}</AIChip></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../../components/shell/Topbar'
import { StatusBadge, Progress } from '../../components/ui'
import Icon from '../../icons'
import { listAdminProjects } from '../../services/projects'

export default function AdminProjects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('grid')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    listAdminProjects().then(setProjects).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = projects.filter(p =>
    (filter === 'All' || (p.status ?? 'Active') === filter) &&
    (q === '' || p.name.toLowerCase().includes(q.toLowerCase()))
  )

  return (
    <>
      <Topbar crumbs={['Workspace', 'Projects']} actions={
        <button className="btn primary" onClick={() => navigate('/v2/admin/projects/new')}>
          <Icon name="plus" size={14} /> New project
        </button>
      } />
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>Projects</h1>
            <div className="sub">Each project is a body of onboarding content with its own learners, paths and analytics.</div>
          </div>
        </div>

        <div style={{ padding: '0 28px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="topbar-search" style={{ width: 320 }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects…" />
          </div>
          <div className="row" style={{ gap: 6 }}>
            {['All', 'Active', 'Draft', 'Archived'].map(f => (
              <button key={f} className={'chip ' + (filter === f ? 'active' : '')} onClick={() => setFilter(f)}>
                {f}{f === 'All' && <span className="mono" style={{ marginLeft: 4 }}>{projects.length}</span>}
              </button>
            ))}
          </div>
          <div className="row" style={{ marginLeft: 'auto', gap: 6 }}>
            <div className="row" style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 2 }}>
              <button className="btn ghost sm" style={view === 'grid' ? { background: 'var(--surface-2)' } : {}} onClick={() => setView('grid')}><Icon name="grid" size={14} /></button>
              <button className="btn ghost sm" style={view === 'list' ? { background: 'var(--surface-2)' } : {}} onClick={() => setView('list')}><Icon name="list" size={14} /></button>
            </div>
          </div>
        </div>

        <div className="page-body" style={{ paddingTop: 0 }}>
          {loading ? (
            <div className="grid-3">{[1,2,3].map(i => <div key={i} className="card"><div className="card-body"><div className="skeleton" style={{ height: 120 }} /></div></div>)}</div>
          ) : filtered.length === 0 ? (
            <div className="empty card">
              <div className="illu"><Icon name="folder" /></div>
              <h3>No projects match</h3>
              <p>Try clearing filters or create a new project to get started.</p>
              <button className="btn primary" onClick={() => navigate('/v2/admin/projects/new')}><Icon name="plus" size={14} /> Create project</button>
            </div>
          ) : view === 'grid' ? (
            <div className="grid-3">
              {filtered.map(p => (
                <div key={p.id} className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => navigate(`/v2/admin/projects/${p.id}`)}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
                      <Icon name="folder" size={18} />
                    </div>
                    <StatusBadge status={p.status ?? 'Active'} />
                  </div>
                  <h3 style={{ margin: '12px 0 4px', fontSize: 15, fontWeight: 600 }}>{p.name}</h3>
                  <div className="muted" style={{ fontSize: 12.5, minHeight: 36 }}>{p.description}</div>
                  <div className="sep" />
                  <div className="row" style={{ justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)' }}>
                    <span><strong className="num">{p.doc_count ?? 0}</strong> docs</span>
                    <span><strong className="num">{p.learner_count ?? 0}</strong> learners</span>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div className="row" style={{ justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: 'var(--text-3)' }}>
                      <span>Completion</span><span className="num">{p.completion_rate ?? 0}%</span>
                    </div>
                    <Progress value={p.completion_rate ?? 0} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card flush">
              <table className="table">
                <thead><tr><th>Project</th><th>Docs</th><th>Learners</th><th>Completion</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} onClick={() => navigate(`/v2/admin/projects/${p.id}`)} style={{ cursor: 'pointer' }}>
                      <td><div className="cell-strong">{p.name}</div><div className="cell-meta">{p.description}</div></td>
                      <td className="num">{p.doc_count ?? 0}</td>
                      <td className="num">{p.learner_count ?? 0}</td>
                      <td style={{ minWidth: 150 }}><Progress value={p.completion_rate ?? 0} /><div className="cell-meta num" style={{ marginTop: 4 }}>{p.completion_rate ?? 0}%</div></td>
                      <td><StatusBadge status={p.status ?? 'Active'} /></td>
                      <td className="row-actions"><button className="icon-btn"><Icon name="more" size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

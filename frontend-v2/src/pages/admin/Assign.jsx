import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '../../components/shell/Topbar'
import { Avatar, Badge, StatusBadge } from '../../components/ui'
import Icon from '../../icons'
import { getProject, getAvailableLearners, bulkAssignLearners } from '../../services/projects'
import { listAdminLearningPaths } from '../../services/learningPath'

export default function AdminAssign() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [paths, setPaths] = useState([])
  const [selectedPath, setSelectedPath] = useState('')
  const [learners, setLearners] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [loadingLearners, setLoadingLearners] = useState(false)

  useEffect(() => {
    if (!projectId) return
    getProject(projectId).then(setProject).catch(() => {})
    listAdminLearningPaths(projectId).then(data => {
      setPaths(data ?? [])
      const published = data?.find(p => p.is_published)
      if (published) setSelectedPath(published.id)
    }).catch(() => {})
  }, [projectId])

  useEffect(() => {
    setSelected(new Set())
    setLoadingLearners(true)
    getAvailableLearners(projectId, selectedPath || null)
      .then(setLearners)
      .catch(() => setLearners([]))
      .finally(() => setLoadingLearners(false))
  }, [projectId, selectedPath])

  const filtered = learners.filter(l =>
    !search || (l.name ?? l.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id) => {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }

  const handleAssign = async () => {
    setAssigning(true)
    try {
      await bulkAssignLearners(projectId, [...selected], selectedPath || null)
      navigate(`/v2/admin/projects/${projectId}`)
    } catch {
      setAssigning(false)
    }
  }

  const initials = (u) => {
    const name = u.name ?? u.email ?? '?'
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  }

  const selectedPathName = paths.find(p => p.id === selectedPath)?.path_name ?? 'No path selected'

  return (
    <>
      <Topbar crumbs={['Projects', project?.name ?? '…', 'Assign users']} actions={
        <>
          <button className="btn primary" disabled={selected.size === 0 || !selectedPath} onClick={() => setShowModal(true)}>
            <Icon name="users" size={14} /> Assign {selected.size > 0 ? selected.size : ''}
          </button>
        </>
      } />
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>Assign learners</h1>
            <div className="sub">Select a learning path, then pick the learners to assign.</div>
          </div>
        </div>

        {/* Path selector */}
        <div style={{ padding: '0 28px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Learning path</div>
          {paths.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>No published paths — publish a path first.</div>
          ) : (
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {paths.map(p => (
                <button
                  key={p.id}
                  className={'chip ' + (selectedPath === p.id ? 'active' : '')}
                  onClick={() => setSelectedPath(p.id)}
                >
                  {p.is_published && <span style={{ color: 'var(--success)', marginRight: 4 }}>●</span>}
                  {p.path_name || 'Unnamed path'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{ padding: '0 28px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="topbar-search" style={{ width: 320 }}>
            <Icon name="search" size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" />
          </div>
          <div className="row" style={{ marginLeft: 'auto', gap: 8 }}>
            {selected.size > 0 && (
              <span style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500 }}>
                {selected.size} selected
              </span>
            )}
          </div>
        </div>

        <div className="page-body" style={{ paddingTop: 4 }}>
          {loadingLearners ? (
            <div className="card"><div className="card-body"><div className="skeleton" style={{ height: 200 }} /></div></div>
          ) : (
            <div className="card flush">
              <table className="table">
                <thead><tr>
                  <th style={{ width: 32 }}>
                    <input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(l => l.id)) : new Set())} />
                  </th>
                  <th>Person</th><th>Role</th><th>Status</th><th></th>
                </tr></thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5}>
                      <div className="empty">
                        <div className="illu"><Icon name="users" /></div>
                        <h3>No available learners</h3>
                        <p>{selectedPath ? 'All learners are already assigned to this path.' : 'Select a path above to see available learners.'}</p>
                      </div>
                    </td></tr>
                  ) : filtered.map(l => (
                    <tr key={l.id} onClick={() => toggle(l.id)} style={{ cursor: 'pointer', background: selected.has(l.id) ? 'var(--accent-soft)' : '' }}>
                      <td onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} />
                      </td>
                      <td>
                        <div className="row" style={{ gap: 10 }}>
                          <Avatar initials={initials(l)} sz="sm" />
                          <div>
                            <div className="cell-strong">{l.name ?? l.email}</div>
                            <div className="cell-meta">{l.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><Badge tone="outline">Learner</Badge></td>
                      <td><StatusBadge status="Active" /></td>
                      <td className="row-actions"><button className="icon-btn"><Icon name="more" size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <AssignModal
          count={selected.size}
          projectName={project?.name}
          pathName={selectedPathName}
          assigning={assigning}
          onClose={() => setShowModal(false)}
          onConfirm={handleAssign}
        />
      )}
    </>
  )
}

function AssignModal({ count, projectName, pathName, assigning, onClose, onConfirm }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <h2>Assign to learning path</h2>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="muted" style={{ fontSize: 13 }}>
            Assigning <strong>{count}</strong> learner{count > 1 ? 's' : ''} to <strong>{pathName}</strong> in <strong>{projectName}</strong>.
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Start date</label>
              <input className="input" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="field">
              <label>Deadline</label>
              <input className="input" type="date" />
            </div>
          </div>
          <label className="row" style={{ gap: 8 }}><input type="checkbox" defaultChecked /> Notify via email</label>
          <label className="row" style={{ gap: 8 }}><input type="checkbox" /> Send weekly reminder until completion</label>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose} disabled={assigning}>Cancel</button>
          <button className="btn primary" onClick={onConfirm} disabled={assigning}>
            {assigning ? 'Assigning…' : `Assign ${count}`}
          </button>
        </div>
      </div>
    </div>
  )
}

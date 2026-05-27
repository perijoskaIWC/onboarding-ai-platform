import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '../../components/shell/Topbar'
import { Avatar, Badge, StatusBadge } from '../../components/ui'
import Icon from '../../icons'
import { getProject, getAvailableLearners, bulkAssignLearners } from '../../services/projects'

export default function AdminAssign() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [learners, setLearners] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All roles')
  const [showModal, setShowModal] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    getProject(projectId).then(setProject).catch(() => {})
    getAvailableLearners(projectId)
      .then(setLearners)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  const roles = ['All roles', ...new Set(learners.map(l => l.role).filter(Boolean))]

  const filtered = learners.filter(l => {
    if (roleFilter !== 'All roles' && l.role !== roleFilter) return false
    if (search && !(l.name ?? l.email ?? '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const toggle = (id) => {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }

  const handleAssign = async () => {
    setAssigning(true)
    try {
      await bulkAssignLearners(projectId, [...selected])
      navigate(`/v2/admin/projects/${projectId}`)
    } catch {
      setAssigning(false)
    }
  }

  const initials = (u) => {
    const name = u.name ?? u.email ?? '?'
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <>
      <Topbar crumbs={['Projects', project?.name ?? '…', 'Assign users']} actions={
        <>
          <button className="btn" disabled={selected.size === 0}>Bulk action</button>
          <button className="btn primary" disabled={selected.size === 0} onClick={() => setShowModal(true)}>
            <Icon name="users" size={14} /> Assign {selected.size}
          </button>
        </>
      } />
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>Assign learners</h1>
            <div className="sub">Select people, then assign them to the learning path with a deadline.</div>
          </div>
        </div>
        <div style={{ padding: '0 28px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="topbar-search" style={{ width: 320 }}>
            <Icon name="search" size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" />
          </div>
          {roles.map(r => (
            <button key={r} className={'chip ' + (roleFilter === r ? 'active' : '')} onClick={() => setRoleFilter(r)}>{r}</button>
          ))}
          <div className="row" style={{ marginLeft: 'auto', gap: 8 }}>
            {selected.size > 0 && (
              <span style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500 }}>
                {selected.size} selected
              </span>
            )}
          </div>
        </div>

        <div className="page-body" style={{ paddingTop: 4 }}>
          {loading ? (
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
                    <tr><td colSpan={5}><div className="empty"><div className="illu"><Icon name="users" /></div><h3>No available learners</h3><p>All users may already be assigned to this project.</p></div></td></tr>
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
                      <td><Badge tone="outline">{l.role ?? 'Learner'}</Badge></td>
                      <td><StatusBadge status={l.status ?? 'Active'} /></td>
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
          assigning={assigning}
          onClose={() => setShowModal(false)}
          onConfirm={handleAssign}
        />
      )}
    </>
  )
}

function AssignModal({ count, projectName, assigning, onClose, onConfirm }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <h2>Assign to learning path</h2>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="muted" style={{ fontSize: 13 }}>Assigning <strong>{count}</strong> learner{count > 1 ? 's' : ''} to <strong>{projectName}</strong>.</div>
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

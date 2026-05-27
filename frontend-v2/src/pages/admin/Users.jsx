import { useState, useEffect } from 'react'
import Topbar from '../../components/shell/Topbar'
import { Avatar, Badge, StatusBadge, Progress } from '../../components/ui'
import Icon from '../../icons'
import api from '../../services/api'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')

  useEffect(() => {
    api.get('/admin/users')
      .then(r => setUsers(r.data?.users ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const roles = ['All', ...new Set(users.map(u => u.role ?? 'Learner').filter(Boolean))]

  const filtered = users.filter(u => {
    if (roleFilter !== 'All' && (u.role ?? 'Learner') !== roleFilter) return false
    const q = search.toLowerCase()
    if (q && !(u.name ?? '').toLowerCase().includes(q) && !(u.email ?? '').toLowerCase().includes(q)) return false
    return true
  })

  const initials = (u) => {
    const name = u.name ?? u.email ?? '?'
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <>
      <Topbar crumbs={['Workspace', 'Users']} actions={
        <>
          <button className="btn"><Icon name="download" size={14} /> Export</button>
          <button className="btn primary"><Icon name="plus" size={14} /> Invite</button>
        </>
      } />
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>Users</h1>
            <div className="sub">{users.length} active across your workspace.</div>
          </div>
        </div>
        <div style={{ padding: '0 28px 12px', display: 'flex', gap: 10 }}>
          <div className="topbar-search" style={{ width: 320 }}>
            <Icon name="search" size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, role…" />
          </div>
          {roles.map(r => (
            <button key={r} className={'chip ' + (roleFilter === r ? 'active' : '')} onClick={() => setRoleFilter(r)}>{r}</button>
          ))}
        </div>
        <div className="page-body" style={{ paddingTop: 4 }}>
          {loading ? (
            <div className="card"><div className="card-body"><div className="skeleton" style={{ height: 200 }} /></div></div>
          ) : (
            <div className="card flush">
              <table className="table">
                <thead><tr>
                  <th style={{ width: 32 }}><input type="checkbox" /></th>
                  <th>Name</th><th>Role</th><th>Progress</th><th>Status</th><th>Last active</th><th></th>
                </tr></thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7}><div className="empty"><div className="illu"><Icon name="users" /></div><h3>No users found</h3><p>Try a different search or filter.</p></div></td></tr>
                  ) : filtered.map(u => (
                    <tr key={u.id}>
                      <td><input type="checkbox" /></td>
                      <td>
                        <div className="row" style={{ gap: 10 }}>
                          <Avatar initials={initials(u)} sz="sm" />
                          <div>
                            <div className="cell-strong">{u.name ?? u.email}</div>
                            <div className="cell-meta">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><Badge tone="outline">{u.role ?? 'Learner'}</Badge></td>
                      <td style={{ minWidth: 130 }}>
                        <Progress value={u.progress ?? 0} />
                        <div className="cell-meta num" style={{ marginTop: 4 }}>{u.progress ?? 0}%</div>
                      </td>
                      <td><StatusBadge status={u.status ?? 'Active'} /></td>
                      <td className="cell-meta">{u.last_active ? new Date(u.last_active).toLocaleDateString() : '—'}</td>
                      <td className="row-actions"><button className="icon-btn"><Icon name="more" size={14} /></button></td>
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

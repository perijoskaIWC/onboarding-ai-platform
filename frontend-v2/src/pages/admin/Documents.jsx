import { useState, useEffect, useRef } from 'react'
import Topbar from '../../components/shell/Topbar'
import { FileIcon, StatusBadge, Badge, Progress } from '../../components/ui'
import Icon from '../../icons'
import { listAdminProjects } from '../../services/projects'

export default function AdminDocuments() {
  const [projects, setProjects] = useState([])
  const [docs, setDocs] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [view, setView] = useState('list')
  const [projectFilter, setProjectFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [assignModal, setAssignModal] = useState(false)
  const [uploading, setUploading] = useState([])
  const fileRef = useRef()

  useEffect(() => {
    listAdminProjects().then(setProjects).catch(() => {})
  }, [])

  const getDocExt = (name) => {
    const ext = name.split('.').pop().toLowerCase()
    if (ext === 'pdf') return 'pdf'
    if (ext === 'md') return 'md'
    if (ext === 'txt') return 'txt'
    return 'doc'
  }

  const filtered = docs.filter(d => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter !== 'all' && getDocExt(d.name) !== typeFilter) return false
    if (projectFilter === 'unassigned') return !d.project_id
    if (projectFilter !== 'all' && d.project_id !== projectFilter) return false
    return true
  })

  const toggle = (id) => {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }

  const unassignedCount = docs.filter(d => !d.project_id).length

  const handleFiles = (files) => {
    if (!files || files.length === 0) return
    const newUploading = Array.from(files).map(f => ({ name: f.name, pct: 0, stage: 'Uploading' }))
    setUploading(prev => [...prev, ...newUploading])
    newUploading.forEach((u, i) => {
      let pct = 0
      const iv = setInterval(() => {
        pct += Math.random() * 20
        if (pct >= 100) {
          clearInterval(iv)
          setUploading(prev => prev.filter(x => x.name !== u.name))
        } else {
          setUploading(prev => prev.map(x => x.name === u.name ? { ...x, pct: Math.min(99, pct), stage: pct > 60 ? 'Embedding chunks' : pct > 30 ? 'Extracting' : 'Uploading' } : x))
        }
      }, 400)
    })
  }

  return (
    <>
      <Topbar crumbs={['Workspace', 'Documents']} actions={
        <>
          {selected.size > 0 && (
            <button className="btn primary" onClick={() => setAssignModal(true)}>
              <Icon name="folder" size={14} /> Assign {selected.size} to project…
            </button>
          )}
          {selected.size === 0 && (
            <button className="btn primary" onClick={() => fileRef.current?.click()}>
              <Icon name="upload" size={14} /> Upload
            </button>
          )}
          <input ref={fileRef} type="file" multiple accept=".pdf,.md,.txt,.docx" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
        </>
      } />
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>Documents</h1>
            <div className="sub">{docs.length} indexed sources. Each document can be assigned to one or more projects — Atlas only cites a document in projects it belongs to.</div>
          </div>
          <div className="actions">
            <div className="row" style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 2 }}>
              <button className="btn ghost sm" style={view === 'list' ? { background: 'var(--surface-2)' } : {}} onClick={() => setView('list')}><Icon name="list" size={14} /></button>
              <button className="btn ghost sm" style={view === 'grid' ? { background: 'var(--surface-2)' } : {}} onClick={() => setView('grid')}><Icon name="grid" size={14} /></button>
            </div>
          </div>
        </div>

        <div className="page-body">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--border-strong)'}`,
              background: dragOver ? 'var(--accent-soft)' : 'var(--surface-2)',
              borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', gap: 16,
              transition: 'all 0.1s', cursor: 'pointer',
            }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'white', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--accent)' }}>
              <Icon name="upload" size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <strong>Drop documents here, or click to upload</strong>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>PDF, Markdown, TXT, DOCX · max 25 MB each · You'll be asked which project(s) to assign them to</div>
            </div>
            <button className="btn primary" onClick={e => { e.stopPropagation(); fileRef.current?.click() }}>Choose files</button>
          </div>

          {/* Uploading rows */}
          {uploading.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-h"><h3>Uploading</h3><span className="sub">{uploading.length} file{uploading.length > 1 ? 's' : ''}</span></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {uploading.map((u, i) => (
                  <div key={i} className="row" style={{ gap: 12 }}>
                    <FileIcon type={getDocExt(u.name)} />
                    <div style={{ flex: 1 }}>
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: 13 }}>{u.name}</strong>
                        <span className="muted num" style={{ fontSize: 12 }}>{Math.round(u.pct)}%</span>
                      </div>
                      <Progress value={u.pct} />
                      <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{u.stage}…</div>
                    </div>
                    <button className="icon-btn" onClick={() => setUploading(prev => prev.filter((_, j) => j !== i))}><Icon name="x" size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project filter pills */}
          <div className="row" style={{ margin: '20px 0 8px', gap: 6, flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginRight: 4 }}>Project</span>
            <button className={'chip ' + (projectFilter === 'all' ? 'active' : '')} onClick={() => setProjectFilter('all')}>All <span className="mono" style={{ marginLeft: 4 }}>{docs.length}</span></button>
            {projects.filter(p => p.status !== 'Archived').map(p => (
              <button key={p.id} className={'chip ' + (projectFilter === p.id ? 'active' : '')} onClick={() => setProjectFilter(p.id)}>
                <Icon name="folder" size={11} /> {p.name} <span className="mono" style={{ marginLeft: 4 }}>{docs.filter(d => d.project_id === p.id).length}</span>
              </button>
            ))}
            <button className={'chip ' + (projectFilter === 'unassigned' ? 'active' : '')} onClick={() => setProjectFilter('unassigned')} style={unassignedCount > 0 ? { borderColor: 'var(--warning)', color: 'var(--warning)' } : {}}>
              <Icon name="alert" size={11} /> Unassigned <span className="mono" style={{ marginLeft: 4 }}>{unassignedCount}</span>
            </button>
          </div>

          {/* Type filter + search */}
          <div className="row" style={{ margin: '8px 0 12px', gap: 8 }}>
            <div className="topbar-search" style={{ width: 280 }}><Icon name="search" size={14} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…" /></div>
            {[['all', 'All types'], ['pdf', 'PDF'], ['md', 'Markdown'], ['txt', 'Text']].map(([v, l]) => (
              <button key={v} className={'chip ' + (typeFilter === v ? 'active' : '')} onClick={() => setTypeFilter(v)}>{l}</button>
            ))}
            <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>
              {filtered.length === docs.length ? `${docs.length} files` : `${filtered.length} of ${docs.length} files`}
              {selected.size > 0 && <> · <strong style={{ color: 'var(--accent)' }}>{selected.size} selected</strong></>}
            </span>
          </div>

          {/* Unassigned banner */}
          {unassignedCount > 0 && projectFilter === 'all' && (
            <div className="row" style={{ padding: '10px 14px', background: 'var(--warning-soft)', border: '1px solid #FCD34D', borderRadius: 8, marginBottom: 12, gap: 10 }}>
              <Icon name="alert" size={16} style={{ color: 'var(--warning)' }} />
              <div style={{ flex: 1, fontSize: 13 }}>
                <strong>{unassignedCount} document{unassignedCount > 1 ? 's are' : ' is'} not assigned to any project.</strong>
                <span className="muted" style={{ marginLeft: 6 }}>Assign them so they show up in learning paths and AI tutor results.</span>
              </div>
              <button className="btn sm" onClick={() => setProjectFilter('unassigned')}>Show unassigned</button>
            </div>
          )}

          {docs.length === 0 ? (
            <div className="empty card">
              <div className="illu"><Icon name="docs" /></div>
              <h3>No documents yet</h3>
              <p>Upload documents to build your knowledge base. They can be assigned to projects for AI-powered learning paths.</p>
              <button className="btn primary" onClick={() => fileRef.current?.click()}><Icon name="upload" size={14} /> Upload documents</button>
            </div>
          ) : view === 'list' ? (
            <div className="card flush">
              <table className="table">
                <thead><tr>
                  <th style={{ width: 32 }}><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={e => setSelected(e.target.checked ? new Set(filtered.map(d => d.id)) : new Set())} /></th>
                  <th>Document</th><th>Project</th><th>Size</th><th>Uploaded by</th><th>Updated</th><th>Status</th><th></th>
                </tr></thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8}><div className="empty"><div className="illu"><Icon name="docs" /></div><h3>No documents match</h3><p>Try changing project or type filter.</p></div></td></tr>
                  ) : filtered.map(d => (
                    <tr key={d.id} style={{ background: selected.has(d.id) ? 'var(--accent-soft)' : '' }}>
                      <td><input type="checkbox" checked={selected.has(d.id)} onChange={() => toggle(d.id)} /></td>
                      <td><div className="row" style={{ gap: 10 }}>
                        <FileIcon type={getDocExt(d.name)} />
                        <div><div className="cell-strong">{d.name}</div><div className="cell-meta">{!d.project_id ? '— not assigned —' : 'Indexed'}</div></div>
                      </div></td>
                      <td>{d.project_id ? <span className="chip" style={{ padding: '2px 8px', fontSize: 11.5 }}><Icon name="folder" size={10} /> {projects.find(p => p.id === d.project_id)?.name ?? d.project_id}</span> : <span className="muted" style={{ fontSize: 12, fontStyle: 'italic' }}>—</span>}</td>
                      <td className="cell-meta">{d.file_size ? `${Math.round(d.file_size / 1024)} KB` : '—'}</td>
                      <td className="cell-meta">{d.uploaded_by ?? '—'}</td>
                      <td className="cell-meta">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</td>
                      <td><StatusBadge status={d.status ?? 'Active'} /></td>
                      <td className="row-actions"><div className="row" style={{ gap: 4 }}>
                        <button className="icon-btn" title="Assign to project" onClick={() => { setSelected(new Set([d.id])); setAssignModal(true) }}><Icon name="folder" size={14} /></button>
                        <button className="icon-btn"><Icon name="more" size={14} /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid-4">
              {filtered.map(d => (
                <div key={d.id} className="card" style={{ padding: 14, border: selected.has(d.id) ? '1.5px solid var(--accent)' : '1px solid var(--border)', cursor: 'pointer' }} onClick={() => toggle(d.id)}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <FileIcon type={getDocExt(d.name)} />
                    {!d.project_id && <Badge tone="warning">Unassigned</Badge>}
                  </div>
                  <div style={{ marginTop: 10, fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{d.file_size ? `${Math.round(d.file_size / 1024)} KB` : '—'}</div>
                  <div className="row" style={{ marginTop: 10, justifyContent: 'space-between' }}><StatusBadge status={d.status ?? 'Active'} /><span className="cell-meta">{d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {assignModal && (
        <AssignToProjectsModal
          selectedIds={[...selected]}
          projects={projects}
          onClose={() => setAssignModal(false)}
          onSave={() => { setAssignModal(false); setSelected(new Set()) }}
        />
      )}
    </>
  )
}

function AssignToProjectsModal({ selectedIds, projects, onClose, onSave }) {
  const [picked, setPicked] = useState(new Set())
  const togglePick = (pid) => { const s = new Set(picked); s.has(pid) ? s.delete(pid) : s.add(pid); setPicked(s) }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <h2>Assign documents to projects</h2>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="muted" style={{ fontSize: 12 }}>{selectedIds.length} document{selectedIds.length > 1 ? 's' : ''} selected</div>
          <div className="field">
            <label>Projects · pick one or more</label>
            <div className="col" style={{ gap: 6, maxHeight: 320, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 6 }}>
              {projects.filter(p => p.status !== 'Archived').map(p => (
                <label key={p.id} className="row" style={{ gap: 10, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: picked.has(p.id) ? 'var(--accent-soft)' : 'transparent' }}>
                  <input type="checkbox" checked={picked.has(p.id)} onChange={() => togglePick(p.id)} />
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}><Icon name="folder" size={14} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{p.learner_count ?? 0} learners</div>
                  </div>
                  <StatusBadge status={p.status ?? 'Active'} />
                </label>
              ))}
            </div>
          </div>
          <label className="row" style={{ gap: 8 }}><input type="checkbox" defaultChecked /> Re-index now so AI tutor sees the new linkage immediately</label>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={picked.size === 0} onClick={onSave}>
            Assign to {picked.size} project{picked.size === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  )
}

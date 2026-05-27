import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../../components/shell/Topbar'
import Icon from '../../icons'
import { createProject } from '../../services/projects'

export default function AdminProjectCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', description: '' })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.name.trim()) { setError('Project name is required.'); return }
    setSaving(true)
    try {
      const proj = await createProject(form)
      navigate(`/v2/admin/projects/${proj.id}`)
    } catch {
      setError('Failed to create project. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Topbar crumbs={['Workspace', 'Projects', 'New']} search={false} actions={
        <button className="btn" onClick={() => navigate('/v2/admin/projects')}>Cancel</button>
      } />
      <div className="viewport">
        <div style={{ padding: '32px 28px 60px', maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Create new project</h1>
          <p className="muted" style={{ marginTop: 6 }}>A project groups documents, learners and learning paths for a cohort.</p>

          <div className="card" style={{ marginTop: 22 }}>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field">
                <label>Project name</label>
                <input
                  className="input"
                  placeholder="e.g. Platform Engineering Onboarding"
                  value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); setError(null) }}
                  autoFocus
                  style={error ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(185,28,28,0.12)' } : {}}
                />
                {error && <div style={{ color: 'var(--danger)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="alert" size={12} /> {error}</div>}
              </div>
              <div className="field">
                <label>Description</label>
                <textarea
                  className="textarea"
                  placeholder="What will learners gain by completing this onboarding?"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
            <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="muted" style={{ fontSize: 12 }}><Icon name="info" size={12} /> Next: upload documents and generate an AI learning path.</span>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn" onClick={() => navigate('/v2/admin/projects')}>Cancel</button>
                <button className="btn primary" onClick={submit} disabled={saving}>
                  {saving ? 'Creating…' : 'Create project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { marked } from 'marked'
import Topbar from '../../components/shell/Topbar'
import { Badge } from '../../components/ui'
import Icon from '../../icons'
import { getProject } from '../../services/projects'
import {
  getAdminLearningPath,
  publishLearningPath,
  updateModule,
  draftModuleContent,
} from '../../services/learningPath'

marked.setOptions({ breaks: true, gfm: true })

// Click-to-edit text field. Auto-saves on blur (Enter for single-line,
// Cmd/Ctrl+Enter for multiline). `renderDisplay` customizes the read view.
function EditableText({
  value, onSave, multiline = false, placeholder = 'Empty',
  textStyle, inputStyle, renderDisplay, stopProp = false,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [status, setStatus] = useState('idle') // idle | saving | saved | error
  const ref = useRef(null)

  useEffect(() => { if (!editing) setDraft(value ?? '') }, [value, editing])
  useEffect(() => {
    if (editing && ref.current) {
      const el = ref.current
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
      if (multiline) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }
    }
  }, [editing, multiline])

  const commit = async () => {
    setEditing(false)
    if ((draft ?? '') === (value ?? '')) return
    setStatus('saving')
    try {
      await onSave(draft)
      setStatus('saved'); setTimeout(() => setStatus('idle'), 1400)
    } catch {
      setStatus('error'); setDraft(value ?? ''); setTimeout(() => setStatus('idle'), 2800)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { setDraft(value ?? ''); setEditing(false) }
    else if (e.key === 'Enter' && (!multiline || e.metaKey || e.ctrlKey)) {
      e.preventDefault(); e.currentTarget.blur()
    }
  }

  const StatusTag = () => {
    if (status === 'saving') return <span style={statusStyle('var(--text-3)')}>saving…</span>
    if (status === 'saved') return <span style={statusStyle('#16a34a')}>✓ saved</span>
    if (status === 'error') return <span style={statusStyle('#dc2626')}>save failed — retry</span>
    return null
  }

  if (editing) {
    const common = {
      ref, value: draft,
      onChange: (e) => {
        setDraft(e.target.value)
        if (multiline) { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }
      },
      onBlur: commit, onKeyDown,
      onClick: stopProp ? (e => e.stopPropagation()) : undefined,
      style: {
        width: '100%', font: 'inherit', color: 'inherit', lineHeight: 'inherit',
        background: 'var(--surface)', border: '1px solid var(--accent)',
        borderRadius: 6, padding: multiline ? '8px 10px' : '3px 7px',
        outline: 'none', resize: 'none', boxSizing: 'border-box', ...inputStyle,
      },
    }
    return multiline ? <textarea {...common} rows={3} /> : <input {...common} />
  }

  const hasValue = (value ?? '').toString().trim().length > 0
  const display = renderDisplay ? renderDisplay(value) : (hasValue ? value : null)

  return (
    <span
      className="editable-hover" title="Click to edit"
      onClick={(e) => { if (stopProp) e.stopPropagation(); setEditing(true) }}
      style={{ cursor: 'text', borderRadius: 5, ...textStyle }}
    >
      {display ?? <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>{placeholder}</span>}
      <StatusTag />
    </span>
  )
}

const statusStyle = (color) => ({
  marginLeft: 8, fontSize: 11, fontWeight: 600, color, fontStyle: 'normal',
  whiteSpace: 'nowrap', verticalAlign: 'middle',
})

const conceptChip = {
  padding: '2px 9px', borderRadius: 99, fontSize: 11.5,
  background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)',
}

// The curated Markdown body: rendered preview <-> raw Markdown editor, plus AI draft.
function ContentEditor({ value, sourceCount, onSave, onDraft }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [status, setStatus] = useState('idle')
  const [drafting, setDrafting] = useState(false)
  const ref = useRef(null)
  const hasContent = (value ?? '').trim().length > 0

  useEffect(() => { if (!editing) setDraft(value ?? '') }, [value, editing])
  useEffect(() => {
    if (editing && ref.current) {
      const el = ref.current
      el.focus(); el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 600) + 'px'
    }
  }, [editing])

  const commit = async () => {
    setEditing(false)
    if ((draft ?? '') === (value ?? '')) return
    setStatus('saving')
    try { await onSave(draft); setStatus('saved'); setTimeout(() => setStatus('idle'), 1400) }
    catch { setStatus('error'); setDraft(value ?? ''); setTimeout(() => setStatus('idle'), 2800) }
  }

  const handleDraft = async () => {
    setDrafting(true)
    try { await onDraft() } finally { setDrafting(false) }
  }

  const Toolbar = () => (
    <div className="row" style={{ gap: 8, marginBottom: 10, alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
        Module content
      </span>
      {status === 'saving' && <span style={statusStyle('var(--text-3)')}>saving…</span>}
      {status === 'saved' && <span style={statusStyle('#16a34a')}>✓ saved</span>}
      {status === 'error' && <span style={statusStyle('#dc2626')}>save failed — retry</span>}
      <span style={{ flex: 1 }} />
      {!editing && hasContent && (
        <button className="btn ghost sm" onClick={() => setEditing(true)}>
          <Icon name="edit" size={13} /> Edit
        </button>
      )}
      {editing && (
        <button className="btn primary sm" onMouseDown={(e) => { e.preventDefault(); ref.current?.blur() }}>
          Done
        </button>
      )}
      {sourceCount > 0 && (
        <button className="btn ai sm" onClick={handleDraft} disabled={drafting} title="Rewrite from the source sections with AI">
          <Icon name="sparkle" size={13} /> {drafting ? 'Drafting…' : hasContent ? 'Redraft with AI' : 'Draft with AI'}
        </button>
      )}
    </div>
  )

  return (
    <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
      <Toolbar />
      {editing ? (
        <textarea
          ref={ref}
          value={draft}
          onChange={(e) => { setDraft(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 600) + 'px' }}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Escape') { setDraft(value ?? ''); setEditing(false) } }}
          placeholder="Write the module content in Markdown…"
          style={{
            width: '100%', minHeight: 160, fontFamily: 'var(--font-mono)', fontSize: 12.5,
            lineHeight: 1.6, color: 'var(--text-1)', background: 'var(--bg)',
            border: '1px solid var(--accent)', borderRadius: 8, padding: '12px 14px',
            outline: 'none', resize: 'vertical', boxSizing: 'border-box',
          }}
        />
      ) : hasContent ? (
        <div
          className="md-body editable-hover"
          title="Click to edit"
          onClick={() => setEditing(true)}
          style={{ cursor: 'text', borderRadius: 8, padding: '4px 6px' }}
          dangerouslySetInnerHTML={{ __html: marked.parse(value) }}
        />
      ) : (
        <div className="ai-surface" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <Icon name="sparkle" size={18} style={{ color: 'var(--ai)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 13 }}>No curated content yet</strong>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>
              {sourceCount > 0
                ? 'Draft a clean lesson from this module’s source sections, then edit it.'
                : 'Write content below, or attach source sections first.'}
            </div>
          </div>
          {sourceCount > 0
            ? <button className="btn ai sm" onClick={handleDraft} disabled={drafting}><Icon name="sparkle" size={13} /> {drafting ? 'Drafting…' : 'Draft with AI'}</button>
            : <button className="btn sm" onClick={() => setEditing(true)}>Write manually</button>}
        </div>
      )}
    </div>
  )
}

function SourceSections({ chunks }) {
  const [open, setOpen] = useState(false)
  if (!chunks.length) return null
  return (
    <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
      <button className="btn ghost sm" onClick={() => setOpen(o => !o)} style={{ paddingLeft: 0 }}>
        <Icon name={open ? 'chevronLeft' : 'chevronRight'} size={13} style={{ transform: open ? 'rotate(90deg)' : 'rotate(-90deg)' }} />
        Source sections ({chunks.length}) — read-only
      </button>
      {open && (
        <div className="col" style={{ gap: 8, marginTop: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            Original document excerpts. Kept intact for AI search, quizzes &amp; citations — edit the content above instead.
          </div>
          {chunks.map((c, ci) => (
            <div key={c.id ?? ci} style={{
              padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 8, fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-2)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 200, overflow: 'auto',
            }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>Section {ci + 1}</span>
              <div style={{ marginTop: 4 }}>{(c.content ?? '').trim()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ModuleCard({ m, week, onSaveModule, onDraft }) {
  const [expanded, setExpanded] = useState(false)
  const chunks = m.chunks ?? []

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header row — always visible */}
      <div style={{ padding: '18px 20px', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 12,
              background: 'var(--accent-soft)', color: 'var(--accent)',
              display: 'grid', placeItems: 'center',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, opacity: 0.7, fontWeight: 700, letterSpacing: '0.07em' }}>WK</div>
                <div style={{ fontSize: 20, lineHeight: 1, fontWeight: 700 }}>{week}</div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 15, letterSpacing: '-0.01em', flex: 1, minWidth: 0 }}>
                <EditableText value={m.title} onSave={v => onSaveModule(m.id, { title: v })} placeholder="Untitled module" stopProp />
              </h3>
              {chunks.length > 0 && (
                <Badge tone="outline"><Icon name="docs" size={11} /> {chunks.length} sources</Badge>
              )}
              {(m.content ?? '').trim() && <Badge tone="success" dot>Content ready</Badge>}
            </div>

            <div className="muted" style={{ marginTop: 5, fontSize: 13, lineHeight: 1.5, maxWidth: 680 }}>
              <EditableText value={m.summary} onSave={v => onSaveModule(m.id, { summary: v })} placeholder="Add a summary" multiline stopProp />
            </div>

            <div style={{ marginTop: 10 }}>
              <EditableText
                value={m.key_concepts}
                onSave={v => onSaveModule(m.id, { key_concepts: v })}
                placeholder="Add key concepts (comma-separated)" stopProp
                renderDisplay={(val) => {
                  const cs = (val || '').split(',').map(s => s.trim()).filter(Boolean)
                  if (!cs.length) return null
                  return (
                    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 5 }}>
                      {cs.map(c => <span key={c} style={conceptChip}>{c}</span>)}
                    </span>
                  )
                }}
              />
            </div>
          </div>

          <div style={{ flexShrink: 0, color: 'var(--text-3)', marginTop: 2 }}>
            <Icon name={expanded ? 'chevronLeft' : 'chevronRight'} size={14} style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
          </div>
        </div>
      </div>

      {/* Expanded: curated content editor + read-only sources */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)', padding: '0 20px 18px 88px' }}>
          <ContentEditor
            value={m.content}
            sourceCount={chunks.length}
            onSave={(v) => onSaveModule(m.id, { content: v })}
            onDraft={() => onDraft(m.id)}
          />
          <SourceSections chunks={chunks} />
        </div>
      )}
    </div>
  )
}

export default function AdminPathPreview() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [path, setPath] = useState(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)

  useEffect(() => {
    if (!projectId) return
    getProject(projectId).then(setProject).catch(() => {})
    getAdminLearningPath(projectId)
      .then(p => { setPath(p); setPublished(p.is_published) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  const patchModuleLocal = (moduleId, fields) =>
    setPath(p => ({ ...p, modules: p.modules.map(m => m.id === moduleId ? { ...m, ...fields } : m) }))

  const handleSaveModule = async (moduleId, fields) => {
    const updated = await updateModule(projectId, moduleId, fields)
    patchModuleLocal(moduleId, { title: updated.title, summary: updated.summary, key_concepts: updated.key_concepts, content: updated.content })
  }

  const handleDraft = async (moduleId) => {
    const res = await draftModuleContent(projectId, moduleId)
    patchModuleLocal(moduleId, { content: res.content })
  }

  const handlePublish = async () => {
    if (!path) return
    setPublishing(true)
    try { await publishLearningPath(projectId, path.id); setPublished(true) }
    finally { setPublishing(false) }
  }

  if (loading) {
    return (
      <>
        <Topbar crumbs={['Projects', '…', 'Path preview']} search={false} />
        <div className="viewport"><div className="page-body"><div className="skeleton" style={{ height: 200 }} /></div></div>
      </>
    )
  }

  const modules = path?.modules ?? []
  const allSameWeek = modules.length > 0 && modules.every(m => m.week_number === modules[0].week_number)
  const totalWeeks = modules.length > 0 ? Math.max(...modules.map((m, i) => allSameWeek ? i + 1 : (m.week_number ?? i + 1))) : 0
  const totalSections = modules.reduce((sum, m) => sum + (m.chunks?.length ?? 0), 0)

  return (
    <>
      <style>{`
        .editable-hover:hover { background: var(--surface-2); box-shadow: 0 0 0 4px var(--surface-2); }
        .md-body h2 { font-size: 16px; font-weight: 600; margin: 18px 0 8px; letter-spacing: -0.01em; }
        .md-body h3 { font-size: 14px; font-weight: 600; margin: 14px 0 6px; }
        .md-body p { font-size: 13.5px; line-height: 1.7; color: var(--text-1); margin: 8px 0; }
        .md-body ul, .md-body ol { font-size: 13.5px; line-height: 1.7; color: var(--text-1); padding-left: 20px; margin: 8px 0; }
        .md-body li { margin: 3px 0; }
        .md-body table { border-collapse: collapse; font-size: 12.5px; margin: 10px 0; width: 100%; }
        .md-body th, .md-body td { border: 1px solid var(--border); padding: 6px 10px; text-align: left; }
        .md-body th { background: var(--surface-2); font-weight: 600; }
        .md-body code { font-family: var(--font-mono); font-size: 12px; background: var(--surface-2); padding: 1px 5px; border-radius: 4px; }
        .md-body strong { font-weight: 600; }
      `}</style>
      <Topbar crumbs={['Projects', project?.name ?? '…', 'Path preview']} search={false} actions={
        <>
          <button className="btn" onClick={() => navigate(`/v2/admin/projects/${projectId}/paths`)}>
            <Icon name="chat" size={14} /> Edit via chat
          </button>
          {!published ? (
            <button className="btn primary" onClick={handlePublish} disabled={publishing || modules.length === 0}>
              <Icon name="check" size={14} /> {publishing ? 'Publishing…' : 'Accept & publish'}
            </button>
          ) : (
            <button className="btn" onClick={() => navigate(`/v2/admin/projects/${projectId}`)}>
              <Icon name="check" size={14} /> Published — go to project
            </button>
          )}
        </>
      } />
      <div className="viewport">
        <div className="page-header">
          <div>
            <div className="row" style={{ gap: 8 }}>
              <h1>{project?.name ?? '…'} · {totalWeeks}-week onboarding</h1>
              <Badge tone={published ? 'success' : 'warning'} dot>{published ? 'Published' : 'Draft'}</Badge>
              <Badge tone="ai" dot>AI generated</Badge>
            </div>
            <div className="sub">{modules.length} modules · {totalSections} sources · Generated by Atlas · Expand a module to edit its content</div>
          </div>
        </div>

        <div className="page-body">
          <div className="col" style={{ gap: 12 }}>
            {modules.length === 0 ? (
              <div className="empty card">
                <div className="illu"><Icon name="layers" /></div>
                <h3>No path generated yet</h3>
                <p>Go back and use the chat to generate a learning path first.</p>
                <button className="btn primary" onClick={() => navigate(`/v2/admin/projects/${projectId}/paths`)}>
                  Open path designer
                </button>
              </div>
            ) : modules.map((m, i) => {
              const week = allSameWeek ? i + 1 : (m.week_number ?? i + 1)
              return (
                <ModuleCard key={m.id ?? i} m={m} week={week} onSaveModule={handleSaveModule} onDraft={handleDraft} />
              )
            })}

            {modules.length > 0 && (
              <div className="ai-surface" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'white', color: 'var(--ai)', display: 'grid', placeItems: 'center' }}>
                  <Icon name="target" size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <strong>Final readiness evaluation</strong>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                    Mixed-format questions across all weeks. Pass at 75% to be marked production-ready.
                  </div>
                </div>
                <Badge tone="ai">Required</Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '../../components/shell/Topbar'
import { Badge } from '../../components/ui'
import Icon from '../../icons'
import { getProject } from '../../services/projects'
import { getAdminLearningPath, publishLearningPath } from '../../services/learningPath'

function ModuleCard({ m, index, week }) {
  const [expanded, setExpanded] = useState(false)
  const concepts = m.key_concepts
    ? m.key_concepts.split(',').map(s => s.trim()).filter(Boolean)
    : []
  const chunks = m.chunks ?? []

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header row — always visible */}
      <div
        style={{ padding: '18px 20px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
          {/* Week badge */}
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

          {/* Title + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 15, letterSpacing: '-0.01em' }}>{m.title}</h3>
              {chunks.length > 0 && (
                <Badge tone="outline"><Icon name="docs" size={11} /> {chunks.length} sections</Badge>
              )}
            </div>
            {m.summary && (
              <div className="muted" style={{ marginTop: 5, fontSize: 13, lineHeight: 1.5, maxWidth: 680 }}>
                {m.summary}
              </div>
            )}
            {concepts.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                {concepts.map(c => (
                  <span key={c} style={{
                    padding: '2px 9px', borderRadius: 99, fontSize: 11.5,
                    background: 'var(--surface-2)', color: 'var(--text-2)',
                    border: '1px solid var(--border)',
                  }}>{c}</span>
                ))}
              </div>
            )}
          </div>

          {/* Expand toggle */}
          <div style={{ flexShrink: 0, color: 'var(--text-3)', marginTop: 2 }}>
            <Icon name={expanded ? 'chevronLeft' : 'chevronRight'} size={14} style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && chunks.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          {chunks.map((c, ci) => (
            <div key={c.id ?? ci} style={{
              padding: '16px 20px 16px 88px',
              borderBottom: ci < chunks.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <span style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: 99,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  display: 'grid', placeItems: 'center',
                  fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)',
                }}>{ci + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, lineHeight: 1.65, color: 'var(--text-1)',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    maxHeight: 260, overflow: 'auto',
                  }}>
                    {(c.content ?? '').trim()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {expanded && chunks.length === 0 && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', color: 'var(--text-3)', fontSize: 13 }}>
          No content sections attached to this module.
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

  const handlePublish = async () => {
    if (!path) return
    setPublishing(true)
    try {
      await publishLearningPath(projectId, path.id)
      setPublished(true)
    } finally {
      setPublishing(false)
    }
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
            <div className="sub">{modules.length} modules · {totalSections} sections · Generated by Atlas · Click any module to expand content</div>
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
              return <ModuleCard key={m.id ?? i} m={m} index={i} week={week} />
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

import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Topbar from '../../components/shell/Topbar'
import { Badge } from '../../components/ui'
import Icon from '../../icons'
import { getLearnerPath, getLearnerLearningPath, completePathModule, completeModule } from '../../services/learningPath'

export default function LearnerChapter() {
  const { pathId, chapterId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { projectId, projectName } = location.state ?? {}
  const [focus, setFocus] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [modules, setModules] = useState(location.state?.modules ?? [])
  const [loading, setLoading] = useState(modules.length === 0)

  useEffect(() => {
    if (modules.length > 0) return
    const fetch = projectId
      ? getLearnerPath(projectId, pathId)
      : getLearnerLearningPath(pathId)
    fetch
      .then(data => setModules(data?.modules ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [pathId, projectId])

  const module = location.state?.module ?? modules.find(m => m.id === chapterId)
  const currentIdx = modules.findIndex(m => m.id === chapterId)
  const allSameWeek = modules.length > 1 && modules.every(m => m.week_number === modules[0]?.week_number)
  const displayWeek = (m, i) => allSameWeek ? i + 1 : (m.week_number ?? i + 1)
  const prevModule = modules[currentIdx - 1]
  const nextModule = modules[currentIdx + 1]

  const handleComplete = async () => {
    setCompleting(true)
    const stateBase = { modules, pathId, projectId, projectName }
    try {
      if (projectId) {
        await completePathModule(projectId, pathId, chapterId)
      } else {
        await completeModule(pathId, chapterId)
      }
      if (nextModule) {
        navigate(`/v2/learner/paths/${pathId}/chapters/${nextModule.id}`, {
          state: { module: nextModule, ...stateBase }
        })
      } else {
        navigate(`/v2/learner/paths/${pathId}`, { state: { projectId, projectName } })
      }
    } catch {
      navigate(`/v2/learner/paths/${pathId}`, { state: { projectId, projectName } })
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Topbar crumbs={['Learning paths', '…', 'Loading…']} />
        <div className="viewport"><div className="page-body"><div className="skeleton" style={{ height: 400 }} /></div></div>
      </>
    )
  }

  if (!module) {
    return (
      <>
        <Topbar crumbs={['Learning paths']} />
        <div className="viewport" style={{ display: 'grid', placeItems: 'center', height: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <h3>Module not found</h3>
            <button className="btn primary" onClick={() => navigate(`/v2/learner/paths/${pathId}`, { state: { projectId, projectName } })}>Back to path</button>
          </div>
        </div>
      </>
    )
  }

  const chunks = module.chunks ?? []
  const readMinutes = Math.max(5, Math.round(chunks.reduce((acc, c) => acc + (c.content?.length ?? 0), 0) / 1000))

  return (
    <>
      {!focus && (
        <Topbar crumbs={['Learning paths', module.title]} actions={
          <>
            <button className="btn ghost" onClick={() => setBookmarked(b => !b)}>
              <Icon name="bookmark" size={14} style={{ color: bookmarked ? 'var(--accent)' : '' }} />
              {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
            <button className="btn" onClick={() => setFocus(true)}><Icon name="expand" size={14} /> Focus mode</button>
            <button className="btn ai" onClick={() => navigate('/v2/learner/ai-tutor')}><Icon name="sparkle" size={14} /> Ask Atlas</button>
          </>
        } />
      )}

      <div className="viewport" style={{ background: 'var(--surface)' }}>
        <div style={{ position: 'sticky', top: 0, height: 3, background: 'var(--surface-2)', zIndex: 5 }}>
          <div style={{ width: module.completed ? '100%' : '0%', height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: focus ? '1fr' : '240px 1fr 260px', gap: 0, minHeight: 'calc(100vh - var(--topbar-h) - 3px)' }}>

          {/* Left: module nav */}
          {!focus && (
            <div style={{ borderRight: '1px solid var(--border)', padding: '24px 16px', background: 'var(--bg)', overflowY: 'auto' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 12 }}>All modules</div>
              <div className="col" style={{ gap: 2 }}>
                {modules.map((m, i) => (
                  <button key={m.id}
                    className={'nav-item ' + (m.id === chapterId ? 'active' : '')}
                    style={{ padding: '7px 10px' }}
                    onClick={() => navigate(`/v2/learner/paths/${pathId}/chapters/${m.id}`, { state: { module: m, modules, pathId, projectId, projectName } })}>
                    <span className="ico">
                      <Icon name={m.completed ? 'check' : m.id === chapterId ? 'play' : 'doc'} size={14} />
                    </span>
                    <span className="label" style={{ fontSize: 12.5 }}>Week {m.week_number ?? i + 1}: {m.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Center: content */}
          <div style={{ padding: '48px 56px', maxWidth: 760, margin: '0 auto', width: '100%', overflowY: 'auto' }}>
            <div className="row" style={{ gap: 8, marginBottom: 14 }}>
              <Badge tone="accent">Week {displayWeek(module, currentIdx)}</Badge>
              <span className="muted" style={{ fontSize: 12 }}>·</span>
              <span className="muted" style={{ fontSize: 12 }}><Icon name="clock" size={11} /> ~{readMinutes} min read</span>
              {module.completed && <Badge tone="success">Completed</Badge>}
            </div>

            <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.15, margin: 0 }}>{module.title}</h1>

            {module.summary && (
              <p style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.6, marginTop: 16 }}>{module.summary}</p>
            )}

            {module.key_concepts && (
              <>
                <h2 style={{ marginTop: 32, fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em' }}>Key concepts</h2>
                <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.65 }}>{module.key_concepts}</p>
              </>
            )}

            {chunks.length > 0 && (
              <>
                <h2 style={{ marginTop: 36, fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em' }}>Reading material</h2>
                {chunks.map((chunk, i) => (
                  <div key={chunk.id ?? i} style={{ marginTop: 24, padding: '20px 24px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
                    <div className="row" style={{ gap: 8, marginBottom: 12 }}>
                      <span className="muted mono" style={{ fontSize: 11 }}>Section {i + 1}</span>
                    </div>
                    <p style={{ fontSize: 14.5, color: 'var(--text-2)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>{chunk.content}</p>
                  </div>
                ))}
              </>
            )}

            {chunks.length === 0 && !module.summary && (
              <div className="ai-surface" style={{ padding: 16, marginTop: 28, display: 'flex', gap: 12 }}>
                <Icon name="bulb" size={18} style={{ color: 'var(--ai)', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong style={{ fontSize: 13 }}>Content being prepared</strong>
                  <div style={{ fontSize: 13, marginTop: 4, color: 'var(--text-2)' }}>
                    Document chunks for this module haven't been linked yet. Ask Atlas for help in the meantime.
                  </div>
                </div>
              </div>
            )}

            {/* Sticky action bar */}
            <div className="row" style={{ position: 'sticky', bottom: 16, marginTop: 48, gap: 8, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', borderRadius: 12 }}>
              <button className="btn ghost" onClick={() => navigate(`/v2/learner/paths/${pathId}`, { state: { projectId, projectName } })}>
                <Icon name="chevronLeft" size={14} /> All modules
              </button>
              {prevModule && (
                <button className="btn" onClick={() => navigate(`/v2/learner/paths/${pathId}/chapters/${prevModule.id}`, { state: { module: prevModule, modules, pathId, projectId, projectName } })}>
                  <Icon name="arrowLeft" size={14} /> Previous
                </button>
              )}
              <button className="btn primary" style={{ marginLeft: 'auto' }} onClick={handleComplete} disabled={completing}>
                <Icon name="check" size={14} /> {completing ? 'Saving…' : module.completed ? 'Next module' : 'Mark complete'}
              </button>
            </div>
          </div>

          {/* Right: references */}
          {!focus && (
            <div style={{ borderLeft: '1px solid var(--border)', padding: 20, background: 'var(--bg)', overflowY: 'auto' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 10 }}>About this module</div>
              <div className="col" style={{ gap: 10 }}>
                <div className="row" style={{ gap: 8, fontSize: 13 }}>
                  <Icon name="layers" size={14} style={{ color: 'var(--text-3)' }} />
                  <span className="muted">{chunks.length} sections</span>
                </div>
                <div className="row" style={{ gap: 8, fontSize: 13 }}>
                  <Icon name="clock" size={14} style={{ color: 'var(--text-3)' }} />
                  <span className="muted">~{readMinutes} min read</span>
                </div>
                <div className="row" style={{ gap: 8, fontSize: 13 }}>
                  <Icon name={module.completed ? 'check' : 'play'} size={14} style={{ color: module.completed ? 'var(--success)' : 'var(--text-3)' }} />
                  <span className="muted">{module.completed ? 'Completed' : 'In progress'}</span>
                </div>
              </div>
              <div className="sep" style={{ margin: '16px 0' }} />
              <button className="btn ghost sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/v2/learner/ai-tutor')}>
                <Icon name="sparkle" size={14} /> Ask Atlas about this
              </button>
            </div>
          )}
        </div>

        {focus && (
          <button className="btn" style={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }} onClick={() => setFocus(false)}>
            <Icon name="collapse" size={14} /> Exit focus
          </button>
        )}
      </div>
    </>
  )
}

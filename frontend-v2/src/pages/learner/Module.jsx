import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '../../components/shell/Topbar'
import { StatusBadge, Badge, Progress } from '../../components/ui'
import Icon from '../../icons'
import { getLearnerLearningPath } from '../../services/learningPath'

export default function LearnerModule() {
  const { pathId } = useParams()
  const navigate = useNavigate()
  const [path, setPath] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!pathId) return
    getLearnerLearningPath(pathId)
      .then(setPath)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [pathId])

  if (loading) {
    return (
      <>
        <Topbar crumbs={['Learning paths', '…']} />
        <div className="viewport"><div className="page-body"><div className="skeleton" style={{ height: 200 }} /></div></div>
      </>
    )
  }

  const modules = path?.modules ?? []
  const completed = modules.filter(m => m.completed).length
  const completionRate = modules.length > 0 ? Math.round((completed / modules.length) * 100) : 0
  // If the AI returned all week_number=1, fall back to order_index for display
  const allSameWeek = modules.length > 1 && modules.every(m => m.week_number === modules[0].week_number)
  const displayWeek = (m, mi) => allSameWeek ? mi + 1 : (m.week_number ?? mi + 1)

  return (
    <>
      <Topbar crumbs={['Learning paths', path?.path_name ?? '…']} />
      <div className="viewport">
        <div className="page-header">
          <button className="icon-btn" onClick={() => navigate('/v2/learner/paths')}><Icon name="arrowLeft" size={16} /></button>
          <div>
            <h1>{path?.path_name ?? 'Learning path'}</h1>
            <div className="sub">{modules.length} modules · {completionRate}% complete</div>
          </div>
          <div className="actions">
            <button className="btn ai" onClick={() => navigate('/v2/learner/ai-tutor')}>
              <Icon name="sparkle" size={14} /> Ask Atlas about this path
            </button>
          </div>
        </div>
        <div className="page-body">
          {modules.length === 0 ? (
            <div className="empty card">
              <div className="illu"><Icon name="layers" /></div>
              <h3>No modules yet</h3>
              <p>The learning path is being set up. Check back soon.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
              <div className="col" style={{ gap: 8 }}>
                {modules.map((m, mi) => (
                  <div key={m.id} className="card" style={{ overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => navigate(`/v2/learner/paths/${pathId}/chapters/${m.id}`, { state: { module: m, modules, pathId } })}>
                    <div className="row" style={{ padding: '14px 16px', gap: 14 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center',
                        background: m.completed ? 'var(--success-soft)' : 'var(--accent-soft)',
                        color: m.completed ? 'var(--success)' : 'var(--accent)',
                      }}>
                        <Icon name={m.completed ? 'check' : 'book'} size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                          <Badge tone="accent">Week {displayWeek(m, mi)}</Badge>
                          <span style={{ fontWeight: 500, fontSize: 14 }}>{m.title}</span>
                        </div>
                        <div className="muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.summary ? m.summary.slice(0, 100) + (m.summary.length > 100 ? '…' : '') : 'No summary'}
                        </div>
                        {m.chunks?.length > 0 && (
                          <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{m.chunks.length} sections</div>
                        )}
                      </div>
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StatusBadge status={m.completed ? 'Completed' : 'In progress'} />
                        <Icon name="chevronRight" size={14} style={{ color: 'var(--text-3)' }} />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Quiz row at the end */}
                <div className="card" style={{ overflow: 'hidden', cursor: 'pointer', opacity: completed < modules.length ? 0.5 : 1 }}
                  onClick={() => completed >= modules.length && navigate(`/v2/learner/paths/${pathId}/quiz`)}>
                  <div className="row" style={{ padding: '14px 16px', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'var(--surface-2)', color: 'var(--text-3)' }}>
                      <Icon name="check" size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>Final quiz</div>
                      <div className="muted" style={{ fontSize: 12 }}>{completed < modules.length ? `Complete all modules to unlock` : 'Ready to take'}</div>
                    </div>
                    <StatusBadge status={completed < modules.length ? 'Locked' : 'Available'} />
                  </div>
                </div>
              </div>

              <div className="col" style={{ gap: 16 }}>
                <div className="card">
                  <div className="card-h"><h3>Overall progress</h3></div>
                  <div className="card-body">
                    <Progress value={completionRate} />
                    <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{completed} of {modules.length} modules complete</div>
                  </div>
                </div>
                {path?.key_concepts && (
                  <div className="card">
                    <div className="card-h"><h3>Key concepts</h3></div>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {String(path.key_concepts).split(',').slice(0, 6).map((c, i) => (
                        <div key={i} className="row" style={{ gap: 8 }}>
                          <Icon name="check" size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                          <span style={{ fontSize: 13 }}>{c.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

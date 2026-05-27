import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../../components/shell/Topbar'
import { StatusBadge, Badge, Progress } from '../../components/ui'
import Icon from '../../icons'
import { listLearnerProjects } from '../../services/projects'

export default function LearnerPaths() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listLearnerProjects()
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statusOf = (p) => {
    if (!p.has_published_path) return 'Locked'
    if ((p.completion_rate ?? 0) >= 100) return 'Completed'
    return 'In progress'
  }

  const active = projects.filter(p => statusOf(p) === 'In progress')
  const completed = projects.filter(p => statusOf(p) === 'Completed')
  const locked = projects.filter(p => statusOf(p) === 'Locked')

  const gradientOf = (s) => {
    if (s === 'Completed') return 'linear-gradient(135deg, #15803D, #65A30D)'
    if (s === 'Locked') return 'var(--surface-3)'
    return 'linear-gradient(135deg, #2563EB, #6D4AFF)'
  }

  return (
    <>
      <Topbar crumbs={['My Learning Paths']} />
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>My learning paths</h1>
            <div className="sub">{active.length} active · {completed.length} completed · {locked.length} locked.</div>
          </div>
        </div>
        <div className="page-body">
          {loading ? (
            <div className="grid-2">{[1, 2].map(i => <div key={i} className="card"><div className="card-body"><div className="skeleton" style={{ height: 160 }} /></div></div>)}</div>
          ) : projects.length === 0 ? (
            <div className="empty card">
              <div className="illu"><Icon name="book" /></div>
              <h3>No learning paths assigned</h3>
              <p>Your manager hasn't assigned any learning paths yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid-2">
              {projects.map(p => {
                const status = statusOf(p)
                const isLocked = status === 'Locked'
                const isCompleted = status === 'Completed'
                return (
                  <div key={p.id} className={'card ' + (isLocked ? 'locked' : '')} style={{ overflow: 'hidden', cursor: isLocked ? 'not-allowed' : 'pointer' }} onClick={() => !isLocked && navigate(`/v2/learner/paths/${p.id}`)}>
                    <div style={{ height: 76, background: gradientOf(status), position: 'relative' }}>
                      <div style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.3), transparent 60%)' }} />
                      <div style={{ position: 'absolute', left: 16, bottom: 12, color: 'white', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{p.description?.slice(0, 30) ?? ''}</div>
                      <div style={{ position: 'absolute', right: 16, top: 14 }}>
                        <StatusBadge status={status} />
                      </div>
                    </div>
                    <div style={{ padding: 18 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{p.name}</h3>
                      <div className="row" style={{ marginTop: 6, gap: 12, color: 'var(--text-3)', fontSize: 12 }}>
                        <span><Icon name="layers" size={12} /> {p.module_count > 0 ? `${p.module_count} modules` : 'Path not published yet'}</span>
                        {p.deadline && <span><Icon name="calendar" size={12} /> Due {new Date(p.deadline).toLocaleDateString()}</span>}
                      </div>
                      {isLocked ? (
                        <div className="row" style={{ marginTop: 16, gap: 8, color: 'var(--text-3)', fontSize: 12.5 }}><Icon name="lock" size={13} /> Waiting for admin to publish path</div>
                      ) : (
                        <div style={{ marginTop: 16 }}>
                          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                            <span className="muted" style={{ fontSize: 12 }}>Progress</span>
                            <span className="num" style={{ fontSize: 12, fontWeight: 500 }}>{p.completion_rate ?? 0}%</span>
                          </div>
                          <Progress value={p.completion_rate ?? 0} tone={isCompleted ? 'success' : ''} />
                        </div>
                      )}
                      <div className="row" style={{ marginTop: 16, justifyContent: 'space-between' }}>
                        {isCompleted ? (
                          <Badge tone="success" dot>Completed</Badge>
                        ) : isLocked ? (
                          <Badge>Locked</Badge>
                        ) : (
                          <span className="muted" style={{ fontSize: 12 }}>{p.completion_rate ?? 0}% complete</span>
                        )}
                        {!isLocked && (
                          <button className={'btn sm ' + (isCompleted ? '' : 'primary')} onClick={e => { e.stopPropagation(); navigate(`/v2/learner/paths/${p.id}`) }}>
                            {isCompleted ? 'Review' : 'Continue'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

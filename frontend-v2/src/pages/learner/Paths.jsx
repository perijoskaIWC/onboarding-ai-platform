import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../../components/shell/Topbar'
import { StatusBadge, Badge, Progress } from '../../components/ui'
import Icon from '../../icons'
import { listLearnerProjects } from '../../services/projects'
import { listLearnerPaths } from '../../services/learningPath'

export default function LearnerPaths() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])   // [{ project, paths }]
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listLearnerProjects()
      .then(async (projects) => {
        const result = await Promise.all(
          projects.map(async (project) => {
            const paths = await listLearnerPaths(project.id).catch(() => [])
            return { project, paths }
          })
        )
        setGroups(result)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const allPaths = groups.flatMap(g => g.paths)
  const active = allPaths.filter(p => (p.completed_modules ?? 0) < (p.total_modules ?? 1) && p.total_modules > 0)
  const completed = allPaths.filter(p => p.total_modules > 0 && (p.completed_modules ?? 0) >= p.total_modules)

  const goToPath = (projectId, projectName, pathId) =>
    navigate(`/v2/learner/paths/${pathId}`, { state: { projectId, projectName } })

  const gradientOf = (completedMods, totalMods) => {
    if (totalMods === 0) return 'var(--surface-3)'
    if (completedMods >= totalMods) return 'linear-gradient(135deg, #15803D, #65A30D)'
    return 'linear-gradient(135deg, #2563EB, #6D4AFF)'
  }

  return (
    <>
      <Topbar crumbs={['My Learning Paths']} />
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>My learning paths</h1>
            <div className="sub">{active.length} active · {completed.length} completed</div>
          </div>
        </div>
        <div className="page-body">
          {loading ? (
            <div className="grid-2">{[1, 2].map(i => (
              <div key={i} className="card"><div className="card-body"><div className="skeleton" style={{ height: 160 }} /></div></div>
            ))}</div>
          ) : allPaths.length === 0 ? (
            <div className="empty card">
              <div className="illu"><Icon name="book" /></div>
              <h3>No learning paths assigned</h3>
              <p>Your manager hasn't assigned any learning paths yet. Check back soon.</p>
            </div>
          ) : (
            <div className="col" style={{ gap: 28 }}>
              {groups.filter(g => g.paths.length > 0).map(({ project, paths }) => (
                <div key={project.id}>
                  <div className="row" style={{ marginBottom: 12, gap: 8 }}>
                    <strong style={{ fontSize: 14 }}>{project.name}</strong>
                    <span className="muted" style={{ fontSize: 12 }}>{paths.length} path{paths.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid-2">
                    {paths.map(p => {
                      const isCompleted = p.total_modules > 0 && (p.completed_modules ?? 0) >= p.total_modules
                      const pct = p.total_modules > 0 ? Math.round(((p.completed_modules ?? 0) / p.total_modules) * 100) : 0
                      const statusLabel = isCompleted ? 'Completed' : 'In progress'
                      return (
                        <div key={p.id} className="card" style={{ overflow: 'hidden', cursor: 'pointer' }}
                          onClick={() => goToPath(project.id, project.name, p.id)}>
                          <div style={{ height: 76, background: gradientOf(p.completed_modules ?? 0, p.total_modules ?? 0), position: 'relative' }}>
                            <div style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.3), transparent 60%)' }} />
                            <div style={{ position: 'absolute', left: 16, bottom: 12, color: 'white', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {p.path_name}
                            </div>
                            <div style={{ position: 'absolute', right: 16, top: 14 }}>
                              <StatusBadge status={statusLabel} />
                            </div>
                          </div>
                          <div style={{ padding: 18 }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{p.path_name}</h3>
                            <div className="row" style={{ marginTop: 6, gap: 12, color: 'var(--text-3)', fontSize: 12 }}>
                              <span><Icon name="layers" size={12} /> {p.total_modules} modules</span>
                            </div>
                            <div style={{ marginTop: 16 }}>
                              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                                <span className="muted" style={{ fontSize: 12 }}>Progress</span>
                                <span className="num" style={{ fontSize: 12, fontWeight: 500 }}>{pct}%</span>
                              </div>
                              <Progress value={pct} tone={isCompleted ? 'success' : ''} />
                            </div>
                            <div className="row" style={{ marginTop: 16, justifyContent: 'space-between' }}>
                              {isCompleted
                                ? <Badge tone="success" dot>Completed</Badge>
                                : <span className="muted" style={{ fontSize: 12 }}>{pct}% complete</span>
                              }
                              <button
                                className={'btn sm ' + (isCompleted ? '' : 'primary')}
                                onClick={e => { e.stopPropagation(); goToPath(project.id, project.name, p.id) }}
                              >
                                {isCompleted ? 'Review' : 'Continue'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              {groups.filter(g => g.paths.length === 0).map(({ project }) => (
                <div key={project.id}>
                  <div className="row" style={{ marginBottom: 8, gap: 8 }}>
                    <strong style={{ fontSize: 14 }}>{project.name}</strong>
                  </div>
                  <div className="card" style={{ padding: 16 }}>
                    <div className="row" style={{ gap: 8, color: 'var(--text-3)', fontSize: 13 }}>
                      <Icon name="lock" size={14} />
                      <span>Waiting for admin to publish a learning path</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

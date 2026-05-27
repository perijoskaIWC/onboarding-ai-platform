import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '../../components/shell/Topbar'
import { Badge, StatusBadge, Progress, KpiCard, LineChart, FileIcon, AIChip, Avatar } from '../../components/ui'
import Icon from '../../icons'
import { getProject, getAvailableLearners, bulkAssignLearners, removeLearner } from '../../services/projects'
import { listProjectDocuments, uploadDocument, deleteDocument, reprocessDocument } from '../../services/documents'
import { getAdminLearningPath, generateLearningPath, publishLearningPath } from '../../services/learningPath'
import { listQuestions, generateQuestions, publishAllQuestions, publishQuestion, deleteQuestion, updateQuestion } from '../../services/quiz'
import { getAnalytics } from '../../services/progress'

export default function AdminProjectDetail() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  useEffect(() => {
    getProject(projectId).then(setProject).catch(() => {}).finally(() => setLoading(false))
  }, [projectId])

  if (loading) return <div className="viewport"><div style={{ padding: 40 }}><div className="skeleton" style={{ height: 32, width: 300, marginBottom: 16 }} /><div className="skeleton" style={{ height: 16, width: 200 }} /></div></div>
  if (!project) return <div className="viewport"><div className="empty"><h3>Project not found</h3></div></div>

  return (
    <>
      <Topbar crumbs={['Projects', project.name]} actions={
        <>
          <button className="btn" onClick={() => navigate(`/v2/admin/projects/${projectId}/assign`)}>
            <Icon name="users" size={14} /> Assign
          </button>
          <button className="btn ai" onClick={() => navigate(`/v2/admin/projects/${projectId}/paths`)}>
            <Icon name="sparkle" size={14} /> Generate path
          </button>
        </>
      } />
      <div className="viewport">
        <div className="page-header">
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
            <Icon name="folder" size={22} />
          </div>
          <div>
            <div className="row" style={{ gap: 8 }}>
              <h1>{project.name}</h1>
              <StatusBadge status={project.status ?? 'Active'} />
            </div>
            <div className="sub">{project.description}</div>
          </div>
          <div className="actions">
            <button className="btn"><Icon name="edit" size={14} /> Edit</button>
          </div>
        </div>

        <div className="page-tabs">
          {['overview', 'documents', 'paths', 'users', 'quizzes', 'analytics'].map(t => (
            <button key={t} className={'page-tab ' + (tab === t ? 'active' : '')} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="page-body">
          {tab === 'overview' && <OverviewTab project={project} />}
          {tab === 'documents' && <DocumentsTab projectId={projectId} showToast={showToast} />}
          {tab === 'paths' && <PathsTab projectId={projectId} navigate={navigate} showToast={showToast} />}
          {tab === 'users' && <UsersTab projectId={projectId} showToast={showToast} />}
          {tab === 'quizzes' && <QuizzesTab projectId={projectId} showToast={showToast} />}
          {tab === 'analytics' && <AnalyticsTab projectId={projectId} />}
        </div>
      </div>
      {toast && <div className="toast success">{toast}</div>}
    </>
  )
}

function OverviewTab({ project }) {
  const [analytics, setAnalytics] = useState(null)
  useEffect(() => {
    getAnalytics(project.id).then(setAnalytics).catch(() => {})
  }, [project.id])

  const learnerCount = project.learners?.length ?? analytics?.total_learners ?? 0
  const docCount = analytics?.doc_count ?? 0
  const avgReadiness = analytics ? Math.round(analytics.avg_readiness) : null
  const completionPct = analytics?.learners?.length > 0
    ? Math.round(analytics.learners.reduce((s, l) => s + (l.modules_total > 0 ? l.modules_completed / l.modules_total : 0), 0) / analytics.learners.length * 100)
    : 0
  const readinessTrend = analytics?.learners?.map(l => Math.round(l.readiness_score)) ?? []

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="grid-4">
        <KpiCard label="Documents" value={docCount} sub="Assigned & indexed" />
        <KpiCard label="Learners" value={learnerCount} sub="Assigned" />
        <KpiCard label="Completion" value={completionPct + '%'} sub="Avg. across learners" />
        <KpiCard label="Avg. readiness" value={avgReadiness ?? '—'} sub="of 100" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-h"><h3>Cohort progress</h3><span className="sub">Last 30 days</span></div>
          <div className="card-body">
            <LineChart data={readinessTrend.length > 1 ? readinessTrend : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]} height={180} />
            {readinessTrend.length === 0 && <div className="muted" style={{ fontSize: 12, textAlign: 'center', marginTop: 8 }}>No learner data yet</div>}
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h3>AI activity</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Tutor sessions</span><strong className="num">—</strong></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Quiz Qs generated</span><strong className="num">—</strong></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Doc citations</span><strong className="num">—</strong></div>
            <div className="sep" />
            <AIChip>Suggest improvements</AIChip>
          </div>
        </div>
      </div>
    </div>
  )
}

function DocumentsTab({ projectId, showToast }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const load = () => listProjectDocuments(projectId).then(setDocs).catch(() => setDocs([])).finally(() => setLoading(false))
  useEffect(() => { load() }, [projectId])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      await uploadDocument(projectId, fd)
      showToast('Document uploaded and indexing')
      load()
    } catch { showToast('Upload failed') } finally { setUploading(false) }
  }

  const handleDelete = async (docId) => {
    if (!confirm('Delete this document?')) return
    await deleteDocument(projectId, docId)
    showToast('Document deleted')
    load()
  }

  const handleReprocess = async (docId) => {
    await reprocessDocument(projectId, docId)
    showToast('Reprocessing started')
    load()
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 12, gap: 8 }}>
        <div className="topbar-search" style={{ width: 280 }}><Icon name="search" size={14} /><input placeholder="Search documents…" /></div>
        <span className="muted" style={{ fontSize: 12 }}>{docs.length} document{docs.length !== 1 ? 's' : ''}</span>
        <div className="row" style={{ marginLeft: 'auto', gap: 8 }}>
          <label className="btn primary" style={{ cursor: 'pointer' }}>
            <Icon name="upload" size={14} /> {uploading ? 'Uploading…' : 'Upload'}
            <input type="file" style={{ display: 'none' }} onChange={handleUpload} accept=".txt,.md,.pdf,.docx" />
          </label>
        </div>
      </div>
      {loading ? <div className="skeleton" style={{ height: 200 }} /> : docs.length === 0 ? (
        <div className="card empty">
          <div className="illu"><Icon name="docs" /></div>
          <h3>No documents yet</h3>
          <p>Upload onboarding material to generate AI learning paths and enable the tutor.</p>
          <label className="btn primary" style={{ cursor: 'pointer' }}>
            <Icon name="upload" size={14} /> Upload document
            <input type="file" style={{ display: 'none' }} onChange={handleUpload} accept=".txt,.md,.pdf,.docx" />
          </label>
        </div>
      ) : (
        <div className="card flush">
          <table className="table">
            <thead><tr><th>Name</th><th>Size</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id}>
                  <td><div className="row" style={{ gap: 10 }}>
                    <FileIcon type={(d.filename ?? d.file_name)?.split('.').pop() ?? 'txt'} />
                    <div><div className="cell-strong">{d.filename ?? d.file_name}</div></div>
                  </div></td>
                  <td className="cell-meta">{d.file_size ? `${(d.file_size / 1024).toFixed(0)} KB` : '—'}</td>
                  <td><StatusBadge status={d.ingestion_status === 'ready' || d.ingestion_status === 'processed' ? 'Indexed' : d.ingestion_status === 'failed' ? 'Failed' : 'Processing'} /></td>
                  <td className="row-actions">
                    <div className="row" style={{ gap: 4 }}>
                      <button className="icon-btn" title="Reprocess" onClick={() => handleReprocess(d.id)}><Icon name="refresh" size={14} /></button>
                      <button className="icon-btn" title="Delete" onClick={() => handleDelete(d.id)} style={{ color: 'var(--danger)' }}><Icon name="trash" size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function PathsTab({ projectId, navigate, showToast }) {
  const [path, setPath] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    getAdminLearningPath(projectId).then(setPath).catch(() => setPath(null)).finally(() => setLoading(false))
  }, [projectId])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const p = await generateLearningPath(projectId)
      setPath(p)
      showToast('Learning path generated')
    } catch { showToast('Generation failed — make sure documents are indexed') }
    finally { setGenerating(false) }
  }

  const handlePublish = async () => {
    if (!path) return
    await publishLearningPath(projectId, path.id)
    showToast('Path published')
    setPath({ ...path, is_published: true })
  }

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="ai-surface" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon name="sparkle" size={18} style={{ color: 'var(--ai)' }} />
        <div style={{ flex: 1 }}>
          {path
            ? <><strong>{path.modules?.length ?? 0}-module onboarding path generated</strong><div className="muted" style={{ fontSize: 12 }}>From indexed documents · {path.is_published ? 'Published' : 'Draft'}</div></>
            : <><strong>No learning path yet</strong><div className="muted" style={{ fontSize: 12 }}>Generate one from your indexed documents</div></>
          }
        </div>
        <button className="btn" onClick={handleGenerate} disabled={generating}>
          <Icon name="refresh" size={14} /> {generating ? 'Generating…' : (path ? 'Regenerate' : 'Generate')}
        </button>
        {path && !path.is_published && (
          <button className="btn primary" onClick={handlePublish}>Publish path</button>
        )}
        {path && (
          <button className="btn ai" onClick={() => navigate(`/v2/admin/projects/${projectId}/paths/preview`)}>
            Open preview
          </button>
        )}
      </div>
      {path && path.modules && (
        <div className="grid-2">
          {path.modules.map((m, i) => (
            <div key={m.id} className="card">
              <div className="card-body">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="badge accent">Module {i + 1}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{m.estimated_duration ?? '—'}</span>
                </div>
                <h3 style={{ margin: '8px 0 4px', fontSize: 15 }}>{m.title}</h3>
                <div className="muted" style={{ fontSize: 12.5 }}>{m.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !path && (
        <div className="empty card">
          <div className="illu"><Icon name="layers" /></div>
          <h3>No learning path yet</h3>
          <p>Upload documents first, then generate an AI-powered learning path.</p>
          <button className="btn ai" onClick={handleGenerate} disabled={generating}>
            <Icon name="sparkle" size={14} /> {generating ? 'Generating…' : 'Generate path'}
          </button>
        </div>
      )}
    </div>
  )
}

function UsersTab({ projectId, showToast }) {
  const [learners, setLearners] = useState([])
  const [available, setAvailable] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(new Set())

  useEffect(() => {
    Promise.all([
      getProject(projectId),
      getAvailableLearners(projectId).catch(() => []),
    ]).then(([proj, avail]) => {
      setLearners(proj.learners ?? [])
      setAvailable(avail)
    }).finally(() => setLoading(false))
  }, [projectId])

  const toggle = (id) => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s) }

  const handleAssign = async () => {
    await bulkAssignLearners(projectId, [...selected])
    showToast(`Assigned ${selected.size} learner${selected.size > 1 ? 's' : ''}`)
    setShowModal(false)
    setSelected(new Set())
    const proj = await getProject(projectId)
    setLearners(proj.learners ?? [])
  }

  const handleRemove = async (learnerId) => {
    if (!confirm('Remove this learner from the project?')) return
    await removeLearner(projectId, learnerId)
    showToast('Learner removed')
    setLearners(learners.filter(l => l.id !== learnerId))
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 12 }}>
        <div className="topbar-search" style={{ width: 280 }}><Icon name="search" size={14} /><input placeholder="Find people…" /></div>
        <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>{learners.length} learners</span>
        <button className="btn primary" onClick={() => setShowModal(true)}><Icon name="plus" size={14} /> Assign learners</button>
      </div>
      {loading ? <div className="skeleton" style={{ height: 200 }} /> : learners.length === 0 ? (
        <div className="card empty">
          <div className="illu"><Icon name="users" /></div>
          <h3>No learners assigned</h3>
          <p>Assign learners to give them access to this project's learning path.</p>
          <button className="btn primary" onClick={() => setShowModal(true)}><Icon name="plus" size={14} /> Assign learners</button>
        </div>
      ) : (
        <div className="card flush">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Progress</th><th></th></tr></thead>
            <tbody>
              {learners.map(l => (
                <tr key={l.id}>
                  <td><div className="row" style={{ gap: 10 }}><Avatar initials={(l.email ?? '?').slice(0, 2).toUpperCase()} sz="sm" /><div className="cell-strong">{l.email}</div></div></td>
                  <td className="cell-meta">{l.email}</td>
                  <td style={{ minWidth: 140 }}><Progress value={l.completion_rate ?? 0} /></td>
                  <td className="row-actions"><button className="icon-btn" onClick={() => handleRemove(l.id)} style={{ color: 'var(--danger)' }}><Icon name="x" size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-h">
              <h2>Assign learners</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><Icon name="x" size={16} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: 400, overflow: 'auto' }}>
              {available.length === 0
                ? <p className="muted" style={{ textAlign: 'center' }}>No available learners to assign.</p>
                : available.map(l => (
                  <label key={l.id} className="row" style={{ padding: '10px 0', cursor: 'pointer', borderBottom: '1px solid var(--border)', gap: 10 }}>
                    <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} />
                    <Avatar initials={(l.email ?? '?').slice(0, 2).toUpperCase()} sz="sm" />
                    <span style={{ flex: 1, fontSize: 13 }}>{l.email}</span>
                  </label>
                ))
              }
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn primary" disabled={selected.size === 0} onClick={handleAssign}>
                Assign {selected.size > 0 ? selected.size : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function QuizzesTab({ projectId, showToast }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  const load = () => listQuestions(projectId).then(setQuestions).catch(() => setQuestions([])).finally(() => setLoading(false))
  useEffect(() => { load() }, [projectId])

  const publishedCount = questions.filter(q => q.is_published).length

  const handleGenerate = async () => {
    if (publishedCount > 0 && !confirm('Regenerating will replace all existing questions including published ones. Continue?')) return
    setGenerating(true)
    try {
      await generateQuestions(projectId)
      showToast('Questions generated')
      load()
    } catch { showToast('Generation failed') } finally { setGenerating(false) }
  }

  const handlePublishAll = async () => {
    await publishAllQuestions(projectId)
    showToast('All questions published')
    load()
  }

  const handleTogglePublish = async (q) => {
    await publishQuestion(projectId, q.id, !q.is_published)
    load()
  }

  const handleDelete = async (qId) => {
    if (!confirm('Delete this question?')) return
    await deleteQuestion(projectId, qId)
    showToast('Question deleted')
    load()
  }

  const qOptions = (q) => [q.option_a, q.option_b, q.option_c, q.option_d]
  const qCorrectText = (q) => qOptions(q)[{ A: 0, B: 1, C: 2, D: 3 }[q.correct_answer?.toUpperCase()] ?? 0]

  const startEdit = (q) => {
    setEditingId(q.id)
    setEditForm({
      question_text: q.question_text,
      options: qOptions(q),
      correct_answer_letter: q.correct_answer?.toUpperCase() ?? 'A',
      explanation: q.explanation ?? '',
    })
  }

  const saveEdit = async () => {
    await updateQuestion(projectId, editingId, {
      question_text: editForm.question_text,
      option_a: editForm.options[0] ?? '',
      option_b: editForm.options[1] ?? '',
      option_c: editForm.options[2] ?? '',
      option_d: editForm.options[3] ?? '',
      correct_answer: editForm.correct_answer_letter ?? 'A',
      explanation: editForm.explanation,
    })
    showToast('Question saved')
    setEditingId(null)
    load()
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <div>
          <strong>{publishedCount} of {questions.length}</strong>
          <span className="muted" style={{ fontSize: 12, marginLeft: 6 }}>published</span>
        </div>
        <div className="row" style={{ marginLeft: 'auto', gap: 8 }}>
          {questions.length > 0 && publishedCount < questions.length && (
            <button className="btn" onClick={handlePublishAll}>Publish all</button>
          )}
          <button className="btn ai" onClick={handleGenerate} disabled={generating}>
            <Icon name="sparkle" size={14} /> {generating ? 'Generating…' : 'Generate questions'}
          </button>
        </div>
      </div>
      {loading ? <div className="skeleton" style={{ height: 200 }} /> : questions.length === 0 ? (
        <div className="empty card">
          <div className="illu"><Icon name="check" /></div>
          <h3>No questions yet</h3>
          <p>Generate AI quiz questions from your indexed documents.</p>
          <button className="btn ai" onClick={handleGenerate} disabled={generating}>
            <Icon name="sparkle" size={14} /> Generate questions
          </button>
        </div>
      ) : (
        <div className="col" style={{ gap: 8 }}>
          {questions.map((q, i) => (
            <div key={q.id} className="card">
              {editingId === q.id ? (
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="field"><label>Question</label><textarea className="textarea" value={editForm.question_text} onChange={e => setEditForm({ ...editForm, question_text: e.target.value })} /></div>
                  <div className="field">
                    <label>Options · select correct answer</label>
                    {(editForm.options ?? []).map((o, oi) => {
                      const letter = ['A', 'B', 'C', 'D'][oi]
                      const isCorrect = editForm.correct_answer_letter === letter
                      return (
                        <div key={oi} className="row" style={{ gap: 8, marginTop: 6, padding: 8, background: isCorrect ? 'var(--success-soft)' : 'var(--surface-2)', borderRadius: 6, border: isCorrect ? '1px solid #86EFAC' : '1px solid transparent' }}>
                          <input type="radio" name={'ans-' + q.id} checked={isCorrect} onChange={() => setEditForm(f => ({ ...f, correct_answer_letter: letter }))} />
                          <input className="input" value={o} onChange={e => { const opts = [...editForm.options]; opts[oi] = e.target.value; setEditForm({ ...editForm, options: opts }) }} style={{ border: 0, background: 'transparent', flex: 1, padding: 0 }} />
                        </div>
                      )
                    })}
                  </div>
                  <div className="field"><label>Explanation</label><textarea className="textarea" value={editForm.explanation} onChange={e => setEditForm({ ...editForm, explanation: e.target.value })} /></div>
                  <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
                    <button className="btn" onClick={() => setEditingId(null)}>Cancel</button>
                    <button className="btn primary" onClick={saveEdit}>Save</button>
                  </div>
                </div>
              ) : (
                <div className="card-body">
                  <div className="row" style={{ marginBottom: 8, gap: 8 }}>
                    <span className="muted mono" style={{ fontSize: 11 }}>Q{i + 1}</span>
                    <span className={'badge ' + (q.is_published ? 'success' : 'warning')} style={{ marginLeft: 'auto' }}>{q.is_published ? 'Published' : 'Unpublished'}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>{q.question_text}</div>
                  <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                    {qOptions(q).map((o, oi) => {
                      const letter = ['A', 'B', 'C', 'D'][oi]
                      const isCorrect = q.correct_answer?.toUpperCase() === letter
                      return (
                        <span key={oi} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12.5, background: isCorrect ? 'var(--success-soft)' : 'var(--surface-2)', color: isCorrect ? 'var(--success)' : 'var(--text-2)', border: isCorrect ? '1px solid #86EFAC' : '1px solid var(--border)' }}>{o}</span>
                      )
                    })}
                  </div>
                  <div className="row" style={{ marginTop: 12, gap: 8 }}>
                    <button className="btn ghost sm" onClick={() => handleTogglePublish(q)}>
                      {q.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button className="btn ghost sm" onClick={() => startEdit(q)}><Icon name="edit" size={13} /> Edit</button>
                    <button className="btn ghost sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(q.id)}><Icon name="trash" size={13} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function AnalyticsTab({ projectId }) {
  const [data, setData] = useState(null)
  useEffect(() => { getAnalytics(projectId).then(setData).catch(() => {}) }, [projectId])

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="grid-4">
        <KpiCard label="Completion rate" value={data?.completion_rate != null ? data.completion_rate + '%' : '—'} sub="of assigned learners" />
        <KpiCard label="Quiz pass rate" value={data?.quiz_pass_rate != null ? data.quiz_pass_rate + '%' : '—'} sub="first attempt" />
        <KpiCard label="Avg. score" value={data?.avg_score != null ? data.avg_score + '%' : '—'} sub="quiz average" />
        <KpiCard label="Total attempts" value={data?.total_attempts ?? '—'} sub="quiz attempts" />
      </div>
      <div className="card">
        <div className="card-h"><h3>Completion trend</h3><span className="sub">Last 30 days</span></div>
        <div className="card-body">
          <LineChart data={data?.completion_trend ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]} height={180} />
        </div>
      </div>
    </div>
  )
}

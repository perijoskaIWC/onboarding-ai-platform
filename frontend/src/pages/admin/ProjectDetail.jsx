import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProject, updateProject, assignLearner, removeLearner, getAvailableLearners, bulkAssignLearners } from '../../services/projects'
import { uploadDocument, listDocuments, deleteDocument, reprocessDocument } from '../../services/documents'
import { adminGetLearningPath, adminTriggerLearningPath, adminListPathNames, adminPublishLearningPath } from '../../services/learningPath'
import { adminGenerateQuestions, adminListQuestions, adminPublishQuestion, adminPublishAll, adminUpdateQuestion, adminDeleteQuestion } from '../../services/quiz'
import ReadingMaterial from '../../components/ReadingMaterial'

const STATUS_COLORS = {
  pending:    'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  ready:      'bg-emerald-100 text-emerald-700',
  failed:     'bg-red-100 text-red-600',
}

const LP_EXAMPLES = [
  'Focus on practical skills, skip theory',
  'Beginner-friendly, step by step',
  'Senior staff, fast 2-week ramp-up',
  'Include real-world scenarios',
]

const TABS = [
  { key: 'documents',     label: 'Documents' },
  { key: 'learning-path', label: 'Learning Path' },
  { key: 'quiz',          label: 'Quiz' },
  { key: 'schedule',      label: 'Schedule' },
  { key: 'learners',      label: 'Learners' },
]

function GeneratingCard({ title, steps, activeStep }) {
  return (
    <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-900">{title}</p>
          <p className="text-xs text-indigo-400 mt-0.5">This usually takes 15–30 seconds</p>
        </div>
      </div>
      <div className="space-y-2">
        {steps.map((step, i) => {
          const done = i < activeStep
          const active = i === activeStep
          return (
            <div key={i} className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${done ? 'text-indigo-400 line-through' : active ? 'text-indigo-700 font-medium' : 'text-slate-300'}`}>
              <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${done ? 'bg-indigo-200 border-indigo-200' : active ? 'border-indigo-400 bg-white' : 'border-slate-200'}`}>
                {done
                  ? <svg className="w-2.5 h-2.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  : active
                  ? <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse block" />
                  : null}
              </span>
              {step}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

function SummaryCard({ documents, questions, learners }) {
  const docCount = documents.length
  const readyDocs = documents.filter((d) => d.ingestion_status === 'ready').length
  const publishedQ = questions.filter((q) => q.is_published).length
  const learnerCount = learners?.length ?? 0

  const stats = [
    { label: 'Documents', value: `${readyDocs}/${docCount}`, sub: 'ready', color: 'indigo' },
    { label: 'Questions', value: publishedQ, sub: 'published', color: 'violet' },
    { label: 'Learners',  value: learnerCount, sub: 'assigned', color: 'emerald' },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {stats.map((s) => {
        const colors = {
          indigo:  'border-indigo-100 bg-indigo-50/60 text-indigo-700',
          violet:  'border-violet-100 bg-violet-50/60 text-violet-700',
          emerald: 'border-emerald-100 bg-emerald-50/60 text-emerald-700',
        }
        return (
          <div key={s.label} className={`rounded-xl border px-4 py-3 ${colors[s.color]}`}>
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
            <p className="text-xs font-medium opacity-70 mt-0.5">{s.label} <span className="opacity-60">· {s.sub}</span></p>
          </div>
        )
      })}
    </div>
  )
}

export default function ProjectDetail() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [learnerEmail, setLearnerEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('documents')
  const tabsRef = useRef(null)
  const [indicatorStyle, setIndicatorStyle] = useState({})

  const [documents, setDocuments] = useState([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const pollRef = useRef(null)

  const [learningPath, setLearningPath] = useState(null)
  const [lpLoading, setLpLoading] = useState(false)
  const [lpError, setLpError] = useState('')
  const [lpPathName, setLpPathName] = useState('Standard')
  const [lpAvailableNames, setLpAvailableNames] = useState([])
  const [lpPublishing, setLpPublishing] = useState(false)
  const [durationWeeks, setDurationWeeks] = useState(4)
  const [lpInstruction, setLpInstruction] = useState('')
  const [lpGenerating, setLpGenerating] = useState(false)
  const [lpGenStep, setLpGenStep] = useState(0)
  const lpPollRef = useRef(null)
  const lpStepRef = useRef(null)

  const [questions, setQuestions] = useState([])
  const [qLoading, setQLoading] = useState(false)
  const [qGenerating, setQGenerating] = useState(false)
  const [qGenStep, setQGenStep] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const qPollRef = useRef(null)
  const qStepRef = useRef(null)

  const [availableLearners, setAvailableLearners] = useState([])
  const [selectedLearnerIds, setSelectedLearnerIds] = useState(new Set())
  const [availableLoading, setAvailableLoading] = useState(false)
  const [bulkAssigning, setBulkAssigning] = useState(false)

  // Sliding tab indicator
  useEffect(() => {
    const container = tabsRef.current
    if (!container) return
    const activeBtn = container.querySelector('[data-active="true"]')
    if (activeBtn) {
      setIndicatorStyle({ left: activeBtn.offsetLeft, width: activeBtn.offsetWidth })
    }
  }, [tab])

  async function load() {
    try {
      const p = await getProject(projectId)
      setProject(p)
      setDurationWeeks(p.duration_weeks ?? 4)
    }
    catch { setError('Failed to load project.') }
    finally { setLoading(false) }
  }

  async function loadDocs() {
    setDocsLoading(true)
    try { const res = await listDocuments(projectId); setDocuments(res.data) }
    catch { /* non-fatal */ }
    finally { setDocsLoading(false) }
  }

  async function loadLp(name) {
    setLpLoading(true)
    try {
      const res = await adminGetLearningPath(projectId, name)
      setLearningPath(res.data)
    } catch (err) {
      if (err.response?.status !== 404) setLpError('Failed to load learning path.')
      else setLearningPath(null)
    } finally { setLpLoading(false) }
  }

  async function loadLpNames() {
    try {
      const res = await adminListPathNames(projectId)
      setLpAvailableNames(res.data.map((p) => p.path_name))
    } catch { /* non-fatal */ }
  }

  async function loadQuestions() {
    setQLoading(true)
    try { const res = await adminListQuestions(projectId); setQuestions(res.data) }
    catch { /* non-fatal */ }
    finally { setQLoading(false) }
  }

  async function loadAvailableLearners() {
    setAvailableLoading(true)
    try { const data = await getAvailableLearners(projectId); setAvailableLearners(data) }
    catch { /* non-fatal */ }
    finally { setAvailableLoading(false) }
  }

  async function handleBulkAssign(ids) {
    setBulkAssigning(true)
    try {
      await bulkAssignLearners(projectId, [...ids])
      setSelectedLearnerIds(new Set())
      await load()
      await loadAvailableLearners()
    } catch (err) { setError(err.response?.data?.detail ?? 'Failed to assign learners.') }
    finally { setBulkAssigning(false) }
  }

  useEffect(() => {
    load(); loadDocs(); loadLp('Standard'); loadLpNames(); loadQuestions(); loadAvailableLearners()
    return () => {
      clearInterval(pollRef.current)
      clearInterval(lpPollRef.current)
      clearInterval(qPollRef.current)
    }
  }, [projectId])

  useEffect(() => {
    const hasPending = documents.some((d) => d.ingestion_status === 'pending' || d.ingestion_status === 'processing')
    if (hasPending && !pollRef.current) { pollRef.current = setInterval(loadDocs, 3000) }
    else if (!hasPending && pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [documents])

  async function handleAssign(e) {
    e.preventDefault(); setError('')
    try { await assignLearner(projectId, learnerEmail); setLearnerEmail(''); await load() }
    catch (err) { setError(err.response?.data?.detail ?? 'Failed to assign learner.') }
  }

  async function handleUpload(e) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploadError(''); setUploading(true)
    try { await uploadDocument(projectId, file); if (fileRef.current) fileRef.current.value = ''; await loadDocs() }
    catch (err) { setUploadError(err.response?.data?.detail ?? 'Upload failed.') }
    finally { setUploading(false) }
  }

  async function handleGenerateLp() {
    setLpError(''); setLearningPath(null); setLpGenerating(true); setLpGenStep(0)
    await updateProject(projectId, { duration_weeks: durationWeeks })
    await adminTriggerLearningPath(projectId, lpInstruction)
    // Advance steps visually while polling
    clearInterval(lpStepRef.current)
    lpStepRef.current = setInterval(() => setLpGenStep((s) => Math.min(s + 1, 2)), 6000)
    clearInterval(lpPollRef.current)
    let attempts = 0
    lpPollRef.current = setInterval(async () => {
      attempts++
      try {
        const res = await adminGetLearningPath(projectId)
        if (res.data) {
          setLearningPath(res.data); await loadLpNames()
          clearInterval(lpPollRef.current); lpPollRef.current = null
          clearInterval(lpStepRef.current); lpStepRef.current = null
          setLpGenerating(false); setLpGenStep(0)
          return
        }
      } catch (err) { if (err.response?.status !== 404) setLpError('Failed to load.') }
      if (attempts >= 20) {
        clearInterval(lpPollRef.current); lpPollRef.current = null
        clearInterval(lpStepRef.current); lpStepRef.current = null
        setLpGenerating(false)
        setLpError('Generation timed out. Please try again.')
      }
    }, 3000)
  }

  async function handleGenerateQuestions() {
    const hasPublished = questions.some((q) => q.is_published)
    if (hasPublished && !window.confirm('This will replace all questions, including published ones. Continue?')) return
    setQuestions([]); setQGenerating(true); setQGenStep(0)
    await adminGenerateQuestions(projectId)
    clearInterval(qStepRef.current)
    qStepRef.current = setInterval(() => setQGenStep((s) => Math.min(s + 1, 2)), 5000)
    clearInterval(qPollRef.current)
    let attempts = 0
    qPollRef.current = setInterval(async () => {
      attempts++
      try {
        const res = await adminListQuestions(projectId)
        if (res.data?.length > 0) {
          setQuestions(res.data)
          clearInterval(qPollRef.current); qPollRef.current = null
          clearInterval(qStepRef.current); qStepRef.current = null
          setQGenerating(false); setQGenStep(0)
          return
        }
      } catch { /* non-fatal */ }
      if (attempts >= 15) {
        clearInterval(qPollRef.current); qPollRef.current = null
        clearInterval(qStepRef.current); qStepRef.current = null
        setQGenerating(false)
      }
    }, 3000)
  }

  if (loading) return (
    <div className="p-8 max-w-4xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 bg-slate-100 rounded-lg w-1/3" />
      <div className="h-40 bg-white rounded-xl border border-slate-100" />
    </div>
  )
  if (!project) return <div className="p-8 text-red-500 text-sm">{error || 'Project not found.'}</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Project header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
        {project.description && <p className="text-slate-500 text-sm mt-1">{project.description}</p>}
      </div>

      {/* Summary cards */}
      <SummaryCard documents={documents} questions={questions} learners={project.learners} />

      {/* Sliding tab bar */}
      <div className="relative mb-6 border-b border-slate-200">
        <div ref={tabsRef} className="flex gap-0 relative">
          {TABS.map((t) => (
            <button
              key={t.key}
              data-active={tab === t.key ? 'true' : 'false'}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative z-10 whitespace-nowrap ${
                tab === t.key ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
          {/* Sliding indicator */}
          <div
            className="absolute bottom-0 h-0.5 bg-indigo-600 rounded-full transition-all duration-200"
            style={indicatorStyle}
          />
        </div>
      </div>

      {/* ── DOCUMENTS ───────────────────────────────────────── */}
      {tab === 'documents' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Documents</h2>

          <form onSubmit={handleUpload} className="flex gap-2 mb-4">
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md"
              required
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-indigo-50 file:text-indigo-700 file:px-3 file:py-1 file:rounded-md file:text-xs file:font-medium focus:outline-none"
            />
            <button
              type="submit"
              disabled={uploading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 shrink-0"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </form>
          {uploadError && <p className="text-red-500 text-sm mb-3">{uploadError}</p>}

          {docsLoading && documents.length === 0 ? (
            <div className="space-y-2 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg" />)}
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon={<svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              title="No documents yet"
              description="Upload .txt or .md files. They'll be processed and used to generate learning paths and quiz questions."
            />
          ) : (
            <ul className="divide-y divide-slate-50">
              {documents.map((doc) => (
                <li key={doc.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium text-slate-700 truncate">{doc.filename}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${STATUS_COLORS[doc.ingestion_status] ?? 'bg-slate-100 text-slate-500'}`}>
                      {doc.ingestion_status}
                    </span>
                    {doc.ingestion_status === 'ready' && (
                      <span className="text-slate-400 text-xs shrink-0">{doc.chunk_count} chunks</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(doc.ingestion_status === 'failed' || doc.ingestion_status === 'pending') && (
                      <button
                        onClick={() => reprocessDocument(projectId, doc.id).then(loadDocs)}
                        className="text-indigo-500 hover:text-indigo-700 text-xs font-medium"
                      >
                        Retry
                      </button>
                    )}
                    <button onClick={() => deleteDocument(projectId, doc.id).then(loadDocs)} className="text-red-400 hover:text-red-600 text-xs font-medium">
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── LEARNING PATH ────────────────────────────────────── */}
      {tab === 'learning-path' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Learning Path</h2>
              {learningPath?.is_published && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full mt-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Published — learners can see this
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-slate-500 whitespace-nowrap">Weeks</label>
                <input
                  type="number" min="1" max="52"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(Number(e.target.value))}
                  className="w-14 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <button
                onClick={handleGenerateLp}
                disabled={lpGenerating}
                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
              >
                {lpGenerating ? 'Generating…' : 'Generate'}
              </button>
              {learningPath && !learningPath.is_published && (
                <button
                  onClick={async () => {
                    setLpPublishing(true)
                    try {
                      await adminPublishLearningPath(projectId, learningPath.id)
                      setLearningPath((lp) => ({ ...lp, is_published: true }))
                    } catch { setLpError('Failed to publish.') }
                    finally { setLpPublishing(false) }
                  }}
                  disabled={lpPublishing}
                  className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-semibold disabled:opacity-50 shadow-sm"
                >
                  {lpPublishing ? 'Publishing…' : '✓ Publish to Learners'}
                </button>
              )}
            </div>
          </div>
          {/* Instruction input */}
          <div className="mb-4">
            <div className="relative">
              <textarea
                rows={2}
                placeholder="Describe the learning style… e.g. &quot;Focus on practical skills, no theory&quot;"
                value={lpInstruction}
                onChange={(e) => setLpInstruction(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none transition"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {LP_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setLpInstruction(ex)}
                  className="text-xs px-2.5 py-1 rounded-full border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {lpError && <p className="text-red-500 text-sm mb-3">{lpError}</p>}
          {lpGenerating ? (
            <GeneratingCard
              title="AI is building your learning path…"
              steps={['Reading your documents', 'Structuring modules by week', 'Assigning reading material']}
              activeStep={lpGenStep}
            />
          ) : lpLoading ? (
            <div className="space-y-2 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-lg" />)}</div>
          ) : !learningPath ? (
            <EmptyState
              icon={<svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
              title="No learning path yet"
              description="Set the number of weeks, then generate a structured learning path from your uploaded documents."
              action={
                <button onClick={handleGenerateLp} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm">
                  Generate {lpPathName}
                </button>
              }
            />
          ) : (
            <div>
              {learningPath.overview && (
                <p className="text-sm text-slate-500 mb-5 leading-relaxed">{learningPath.overview}</p>
              )}
              {(() => {
                const byWeek = {}
                for (const m of (learningPath.modules ?? [])) {
                  const w = m.week_number ?? 1
                  if (!byWeek[w]) byWeek[w] = []
                  byWeek[w].push(m)
                }
                return Object.keys(byWeek).sort((a, b) => Number(a) - Number(b)).map((week) => (
                  <div key={week} className="mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{week}</span>
                      <span className="text-sm font-semibold text-slate-700">Week {week}</span>
                    </div>
                    <div className="ml-9 space-y-2">
                      {byWeek[week].map((m) => (
                        <div key={m.id} className="border border-slate-100 rounded-lg p-3.5">
                          <p className="font-medium text-sm text-slate-800">{m.title}</p>
                          {m.summary && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{m.summary}</p>}
                          {m.key_concepts && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {m.key_concepts.split(',').slice(0, 4).map((c) => (
                                <span key={c} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{c.trim()}</span>
                              ))}
                            </div>
                          )}
                          <ReadingMaterial chunks={m.chunks ?? []} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── QUIZ ─────────────────────────────────────────────── */}
      {tab === 'quiz' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Quiz Questions</h2>
              {questions.length > 0 && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {questions.filter((q) => q.is_published).length} of {questions.length} published
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {questions.length > 0 && (
                <button
                  onClick={async () => { await adminPublishAll(projectId); const res = await adminListQuestions(projectId); setQuestions(res.data) }}
                  className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 font-medium"
                >
                  Publish All
                </button>
              )}
              <button
                onClick={handleGenerateQuestions}
                disabled={qGenerating}
                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
              >
                {qGenerating ? 'Generating…' : 'Regenerate'}
              </button>
            </div>
          </div>

          {qGenerating ? (
            <GeneratingCard
              title="AI is writing quiz questions…"
              steps={['Analysing document content', 'Drafting multiple-choice questions', 'Validating answers and explanations']}
              activeStep={qGenStep}
            />
          ) : qLoading ? (
            <div className="space-y-2 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-lg" />)}</div>
          ) : questions.length === 0 ? (
            <EmptyState
              icon={<svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              title="No quiz questions yet"
              description="Generate questions from your documents and learning path. Publish them to make them visible to learners."
              action={
                <button onClick={handleGenerateQuestions} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm">
                  Generate Questions
                </button>
              }
            />
          ) : (
            <ol className="space-y-2">
              {questions.map((q, i) => (
                <li key={q.id} className="border border-slate-100 rounded-lg p-4 text-sm">
                  {editingId === q.id ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        rows={2}
                        value={editForm.question_text}
                        onChange={(e) => setEditForm((f) => ({ ...f, question_text: e.target.value }))}
                      />
                      {['a', 'b', 'c', 'd'].map((letter) => (
                        <div key={letter} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={editForm.correct_answer === letter.toUpperCase()}
                            onChange={() => setEditForm((f) => ({ ...f, correct_answer: letter.toUpperCase() }))}
                            className="accent-indigo-600"
                          />
                          <input
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={editForm[`option_${letter}`]}
                            onChange={(e) => setEditForm((f) => ({ ...f, [`option_${letter}`]: e.target.value }))}
                            placeholder={`Option ${letter.toUpperCase()}`}
                          />
                        </div>
                      ))}
                      <textarea
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm resize-none focus:outline-none"
                        rows={1}
                        placeholder="Explanation (optional)"
                        value={editForm.explanation || ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, explanation: e.target.value }))}
                      />
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={async () => {
                            if (!editForm.question_text?.trim() || !editForm.correct_answer) return
                            const res = await adminUpdateQuestion(projectId, q.id, editForm)
                            setQuestions((qs) => qs.map((x) => x.id === q.id ? res.data : x))
                            setEditingId(null)
                          }}
                          disabled={!editForm.question_text?.trim() || !editForm.correct_answer}
                          className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-slate-500 px-3 py-1.5 rounded-lg text-xs hover:bg-slate-100">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-slate-800 flex-1 leading-snug">{i + 1}. {q.question_text}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${q.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {q.is_published ? 'Published' : 'Draft'}
                          </span>
                          <button
                            onClick={async () => {
                              await adminPublishQuestion(projectId, q.id, !q.is_published)
                              setQuestions((qs) => qs.map((x) => x.id === q.id ? { ...x, is_published: !x.is_published } : x))
                            }}
                            className="text-xs text-indigo-600 hover:underline font-medium"
                          >
                            {q.is_published ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => { setEditingId(q.id); setEditForm({ question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, correct_answer: q.correct_answer, explanation: q.explanation || '' }) }}
                            className="text-xs text-slate-400 hover:text-slate-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm('Delete this question?')) return
                              await adminDeleteQuestion(projectId, q.id)
                              setQuestions((qs) => qs.filter((x) => x.id !== q.id))
                            }}
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Correct: <span className="font-semibold text-slate-600">{q.correct_answer}</span></p>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* ── SCHEDULE ─────────────────────────────────────────── */}
      {tab === 'schedule' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-slate-900">Schedule Preview</h2>
            {learningPath?.is_published && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Published
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mb-5">Learners see this in their Schedule tab once published.</p>

          {!learningPath ? (
            <EmptyState
              icon={<svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              title="No learning path yet"
              description="Generate a learning path from the Learning Path tab, then publish it."
              action={
                <button onClick={() => setTab('learning-path')} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm">
                  Go to Learning Path
                </button>
              }
            />
          ) : (
            <div>
              {!learningPath.is_published && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5 flex items-center justify-between gap-3">
                  <p className="text-xs text-amber-700 leading-relaxed">
                    This path is <strong>not published</strong> yet. Learners won't see it until you publish it.
                  </p>
                  <button
                    onClick={async () => {
                      setLpPublishing(true)
                      try {
                        await adminPublishLearningPath(projectId, learningPath.id)
                        setLearningPath((lp) => ({ ...lp, is_published: true }))
                      } catch { setLpError('Failed to publish.') }
                      finally { setLpPublishing(false) }
                    }}
                    disabled={lpPublishing}
                    className="shrink-0 text-xs bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50"
                  >
                    {lpPublishing ? 'Publishing…' : 'Publish Now'}
                  </button>
                </div>
              )}
              {learningPath.overview && (
                <p className="text-sm text-slate-500 mb-5 leading-relaxed">{learningPath.overview}</p>
              )}
              {(() => {
                const byWeek = {}
                for (const m of (learningPath.modules ?? [])) {
                  const w = m.week_number ?? 1
                  if (!byWeek[w]) byWeek[w] = []
                  byWeek[w].push(m)
                }
                return Object.keys(byWeek).sort((a, b) => Number(a) - Number(b)).map((week) => (
                  <div key={week} className="mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{week}</span>
                      <span className="text-sm font-semibold text-slate-700">Week {week}</span>
                    </div>
                    <div className="ml-9 space-y-2">
                      {byWeek[week].map((m) => (
                        <div key={m.id} className="border border-slate-100 rounded-lg p-3.5 bg-slate-50/50">
                          <p className="font-medium text-sm text-slate-800">{m.title}</p>
                          {m.summary && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{m.summary}</p>}
                          <ReadingMaterial chunks={m.chunks ?? []} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── LEARNERS ─────────────────────────────────────────── */}
      {tab === 'learners' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">

          {/* Assigned learners */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">
              Assigned Learners
              {project.learners?.length > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-400">{project.learners.length}</span>
              )}
            </h2>
            {project.learners?.length === 0 ? (
              <p className="text-sm text-slate-400 py-3">No learners assigned yet.</p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {project.learners?.map((l) => (
                  <li key={l.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                        {l.email?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="text-sm text-slate-700">{l.email}</span>
                    </div>
                    <button
                      onClick={() => removeLearner(projectId, l.id).then(() => { load(); loadAvailableLearners() })}
                      className="text-xs text-red-400 hover:text-red-600 font-medium"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Available learners */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-700">
                Add Learners
                {availableLearners.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-slate-400">{availableLearners.length} available</span>
                )}
              </h3>
              {availableLearners.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedLearnerIds(
                      selectedLearnerIds.size === availableLearners.length
                        ? new Set()
                        : new Set(availableLearners.map((l) => l.id))
                    )}
                    className="text-xs text-indigo-600 hover:underline font-medium"
                  >
                    {selectedLearnerIds.size === availableLearners.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedLearnerIds.size > 0 && (
                    <button
                      onClick={() => handleBulkAssign(selectedLearnerIds)}
                      disabled={bulkAssigning}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                    >
                      {bulkAssigning ? 'Assigning…' : `Assign Selected (${selectedLearnerIds.size})`}
                    </button>
                  )}
                </div>
              )}
            </div>

            {availableLoading ? (
              <div className="space-y-2 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg" />)}</div>
            ) : availableLearners.length === 0 ? (
              <p className="text-sm text-slate-400 py-3">
                {project.learners?.length > 0
                  ? 'All registered learners are already assigned.'
                  : 'No learner accounts registered yet.'}
              </p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {availableLearners.map((l) => (
                  <li key={l.id} className="py-2.5 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedLearnerIds.has(l.id)}
                      onChange={(e) => {
                        const next = new Set(selectedLearnerIds)
                        e.target.checked ? next.add(l.id) : next.delete(l.id)
                        setSelectedLearnerIds(next)
                      }}
                      className="accent-indigo-600 w-4 h-4 rounded"
                    />
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                      {l.email?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-sm text-slate-700 flex-1">{l.email}</span>
                    <button
                      onClick={() => handleBulkAssign(new Set([l.id]))}
                      disabled={bulkAssigning}
                      className="text-xs text-indigo-600 hover:underline font-medium disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="pt-4 border-t border-slate-100">
            <Link
              to={`/admin/projects/${projectId}/analytics`}
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View analytics dashboard
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

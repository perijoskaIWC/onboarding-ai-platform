import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProject, assignLearner, removeLearner } from '../../services/projects'
import { uploadDocument, listDocuments, deleteDocument } from '../../services/documents'
import { adminGetLearningPath, adminTriggerLearningPath, adminListPathNames } from '../../services/learningPath'
import { adminGenerateQuestions, adminListQuestions, adminPublishQuestion, adminPublishAll, adminUpdateQuestion, adminDeleteQuestion } from '../../services/quiz'
import { adminListWeeklyPlans, adminCreateWeeklyPlan, adminUpdateWeeklyPlan, adminDeleteWeeklyPlan } from '../../services/weeklyPlan'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

export default function ProjectDetail() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [learnerEmail, setLearnerEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('documents')

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
  const LP_PATH_OPTIONS = ['Standard', 'Fast Track', 'In-Depth']

  const [questions, setQuestions] = useState([])
  const [qLoading, setQLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const lpPollRef = useRef(null)
  const qPollRef = useRef(null)

  const [weeklyPlans, setWeeklyPlans] = useState([])
  const [wpLoading, setWpLoading] = useState(false)
  const [wpEditingId, setWpEditingId] = useState(null)
  const [wpForm, setWpForm] = useState({ week_number: '', title: '', description: '' })
  const [wpError, setWpError] = useState('')
  const [showWpForm, setShowWpForm] = useState(false)

  async function load() {
    try {
      setProject(await getProject(projectId))
    } catch {
      setError('Failed to load project.')
    } finally {
      setLoading(false)
    }
  }

  async function loadDocs() {
    setDocsLoading(true)
    try {
      const res = await listDocuments(projectId)
      setDocuments(res.data)
    } catch {
      // non-fatal
    } finally {
      setDocsLoading(false)
    }
  }

  async function loadLp(name) {
    setLpLoading(true)
    try {
      const res = await adminGetLearningPath(projectId, name)
      setLearningPath(res.data)
    } catch (err) {
      if (err.response?.status !== 404) setLpError('Failed to load learning path.')
      else setLearningPath(null)
    } finally {
      setLpLoading(false)
    }
  }

  async function loadLpNames() {
    try {
      const res = await adminListPathNames(projectId)
      setLpAvailableNames(res.data.map((p) => p.path_name))
    } catch { /* non-fatal */ }
  }

  async function loadQuestions() {
    setQLoading(true)
    try {
      const res = await adminListQuestions(projectId)
      setQuestions(res.data)
    } catch {
      // non-fatal
    } finally {
      setQLoading(false)
    }
  }

  async function loadWeeklyPlans() {
    setWpLoading(true)
    try {
      const res = await adminListWeeklyPlans(projectId)
      setWeeklyPlans(res.data)
    } catch {
      // non-fatal
    } finally {
      setWpLoading(false)
    }
  }

  useEffect(() => {
    load()
    loadDocs()
    loadLp('Standard')
    loadLpNames()
    loadQuestions()
    loadWeeklyPlans()
    return () => {
      clearInterval(pollRef.current)
      clearInterval(lpPollRef.current)
      clearInterval(qPollRef.current)
    }
  }, [projectId])

  // Poll while any doc is pending/processing
  useEffect(() => {
    const hasPending = documents.some(
      (d) => d.ingestion_status === 'pending' || d.ingestion_status === 'processing'
    )
    if (hasPending && !pollRef.current) {
      pollRef.current = setInterval(loadDocs, 3000)
    } else if (!hasPending && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [documents])

  async function handleAssign(e) {
    e.preventDefault()
    setError('')
    try {
      await assignLearner(projectId, learnerEmail)
      setLearnerEmail('')
      await load()
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to assign learner.')
    }
  }

  async function handleRemove(learnerId) {
    await removeLearner(projectId, learnerId)
    await load()
  }

  async function handleUpload(e) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      await uploadDocument(projectId, file)
      if (fileRef.current) fileRef.current.value = ''
      await loadDocs()
    } catch (err) {
      setUploadError(err.response?.data?.detail ?? 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(docId) {
    await deleteDocument(projectId, docId)
    await loadDocs()
    await loadLp()
    await loadQuestions()
  }

  if (loading) return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
      <div className="space-y-4">
        <div className="h-40 bg-white rounded-lg shadow p-4 animate-pulse" />
        <div className="h-40 bg-white rounded-lg shadow p-4 animate-pulse" />
      </div>
    </div>
  )
  if (!project) return <div className="p-6 text-red-500">{error || 'Project not found.'}</div>

  const tabClass = (t) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      tab === t
        ? 'border-brand-600 text-brand-600'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6">
        <button className={tabClass('documents')} onClick={() => setTab('documents')}>Documents</button>
        <button className={tabClass('learning-path')} onClick={() => setTab('learning-path')}>Learning Path</button>
        <button className={tabClass('quiz')} onClick={() => setTab('quiz')}>Quiz</button>
        <button className={tabClass('schedule')} onClick={() => setTab('schedule')}>Schedule</button>
        <button className={tabClass('learners')} onClick={() => setTab('learners')}>Learners</button>
      </div>

      {/* Documents tab */}
      {tab === 'documents' && (
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Documents</h2>

          <form onSubmit={handleUpload} className="flex gap-2 mb-4">
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md"
              required
              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm file:mr-2 file:border-0 file:bg-brand-50 file:text-brand-700 file:px-2 file:py-1 file:rounded"
            />
            <button
              type="submit"
              disabled={uploading}
              className="bg-brand-600 text-white px-3 py-1.5 rounded text-sm hover:bg-brand-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </form>
          {uploadError && <p className="text-red-600 text-sm mb-3">{uploadError}</p>}

          {docsLoading && documents.length === 0 ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-10">
              <svg className="mx-auto h-10 w-10 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No documents yet</h3>
              <p className="mt-1 text-sm text-gray-500">Upload a .txt or .md file to get started.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <li key={doc.id} className="py-2 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-medium text-gray-800 truncate">{doc.filename}</span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[doc.ingestion_status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {doc.ingestion_status}
                    </span>
                    {doc.ingestion_status === 'ready' && (
                      <span className="text-gray-400 text-xs">{doc.chunk_count} chunks</span>
                    )}
                    {doc.ingestion_status === 'failed' && doc.ingestion_error && (
                      <span className="text-red-500 text-xs truncate max-w-xs" title={doc.ingestion_error}>
                        {doc.ingestion_error}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-500 hover:underline text-xs ml-4 shrink-0"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Learning Path tab */}
      {tab === 'learning-path' && (
        <section className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-lg font-semibold">Learning Path</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1">
                {LP_PATH_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setLpPathName(opt); setLearningPath(null); loadLp(opt) }}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      lpPathName === opt
                        ? 'bg-brand-600 text-white border-brand-600'
                        : lpAvailableNames.includes(opt)
                        ? 'bg-white text-brand-600 border-brand-300 hover:bg-brand-50'
                        : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <button
                onClick={async () => {
                  setLpError('')
                  setLearningPath(null)
                  await adminTriggerLearningPath(projectId, lpPathName)
                  clearInterval(lpPollRef.current)
                  let attempts = 0
                  lpPollRef.current = setInterval(async () => {
                    attempts++
                    try {
                      const res = await adminGetLearningPath(projectId, lpPathName)
                      if (res.data) {
                        setLearningPath(res.data)
                        await loadLpNames()
                        clearInterval(lpPollRef.current)
                        lpPollRef.current = null
                        return
                      }
                    } catch (err) {
                      if (err.response?.status !== 404) setLpError('Failed to load learning path.')
                    }
                    if (attempts >= 10) {
                      clearInterval(lpPollRef.current)
                      lpPollRef.current = null
                    }
                  }, 3000)
                }}
                className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded hover:bg-brand-700"
              >
                Generate {lpPathName}
              </button>
            </div>
          </div>
          {lpError && <p className="text-red-600 text-sm mb-2">{lpError}</p>}
          {lpLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ) : !learningPath ? (
            <div className="text-center py-10">
              <svg className="mx-auto h-10 w-10 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No learning path yet</h3>
              <p className="mt-1 text-sm text-gray-500">Generate a learning path from your uploaded documents.</p>
              <button
                onClick={async () => { setLpError(''); setLearningPath(null); await adminTriggerLearningPath(projectId, lpPathName) }}
                className="mt-4 bg-brand-600 text-white px-4 py-2 rounded-md text-sm hover:bg-brand-700"
              >
                Generate {lpPathName}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {learningPath.overview && (
                <p className="text-sm text-gray-600 mb-3">{learningPath.overview}</p>
              )}
              <ol className="space-y-2">
                {learningPath.modules?.map((m, i) => (
                  <li key={m.id} className="border border-gray-100 rounded p-3">
                    <p className="font-medium text-sm text-gray-800">{i + 1}. {m.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{m.summary}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}

      {/* Quiz tab */}
      {tab === 'quiz' && (
        <section className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">Quiz Questions</h2>
              {questions.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {questions.filter(q => q.is_published).length} of {questions.length} published
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {questions.length > 0 && (
                <button
                  onClick={async () => {
                    await adminPublishAll(projectId)
                    const res = await adminListQuestions(projectId)
                    setQuestions(res.data)
                  }}
                  className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700"
                >
                  Publish All
                </button>
              )}
              <button
                onClick={async () => {
                  const hasPublished = questions.some(q => q.is_published)
                  if (hasPublished && !window.confirm('This will replace all questions, including published ones. Continue?')) return
                  setQuestions([])
                  await adminGenerateQuestions(projectId)
                  clearInterval(qPollRef.current)
                  let attempts = 0
                  qPollRef.current = setInterval(async () => {
                    attempts++
                    try {
                      const res = await adminListQuestions(projectId)
                      if (res.data?.length > 0) {
                        setQuestions(res.data)
                        clearInterval(qPollRef.current)
                        qPollRef.current = null
                        return
                      }
                    } catch { /* non-fatal */ }
                    if (attempts >= 10) {
                      clearInterval(qPollRef.current)
                      qPollRef.current = null
                    }
                  }, 3000)
                }}
                className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded hover:bg-brand-700"
              >
                Regenerate
              </button>
            </div>
          </div>
          {qLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-10">
              <svg className="mx-auto h-10 w-10 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No quiz questions yet</h3>
              <p className="mt-1 text-sm text-gray-500">Generate quiz questions from your documents and learning path.</p>
              <button
                onClick={async () => { setQuestions([]); await adminGenerateQuestions(projectId) }}
                className="mt-4 bg-brand-600 text-white px-4 py-2 rounded-md text-sm hover:bg-brand-700"
              >
                Generate
              </button>
            </div>
          ) : (
            <ol className="space-y-3">
              {questions.map((q, i) => (
                <li key={q.id} className="border border-gray-100 rounded p-3 text-sm">
                  {editingId === q.id ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm resize-none"
                        rows={2}
                        value={editForm.question_text}
                        onChange={e => setEditForm(f => ({ ...f, question_text: e.target.value }))}
                      />
                      {['a', 'b', 'c', 'd'].map(letter => (
                        <div key={letter} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={editForm.correct_answer === letter.toUpperCase()}
                            onChange={() => setEditForm(f => ({ ...f, correct_answer: letter.toUpperCase() }))}
                            className="accent-brand-600"
                          />
                          <input
                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                            value={editForm[`option_${letter}`]}
                            onChange={e => setEditForm(f => ({ ...f, [`option_${letter}`]: e.target.value }))}
                            placeholder={`Option ${letter.toUpperCase()}`}
                          />
                        </div>
                      ))}
                      <textarea
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm resize-none"
                        rows={1}
                        placeholder="Explanation (optional)"
                        value={editForm.explanation || ''}
                        onChange={e => setEditForm(f => ({ ...f, explanation: e.target.value }))}
                      />
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={async () => {
                            if (!editForm.question_text?.trim()) return
                            if (!editForm.correct_answer) return
                            const res = await adminUpdateQuestion(projectId, q.id, editForm)
                            setQuestions(qs => qs.map(x => x.id === q.id ? res.data : x))
                            setEditingId(null)
                          }}
                          disabled={!editForm.question_text?.trim() || !editForm.correct_answer}
                          className="bg-brand-600 text-white px-3 py-1 rounded text-xs hover:bg-brand-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-500 px-3 py-1 rounded text-xs hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-gray-800 flex-1">{i + 1}. {q.question_text}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${q.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {q.is_published ? 'Published' : 'Unpublished'}
                          </span>
                          <button
                            onClick={async () => {
                              await adminPublishQuestion(projectId, q.id, !q.is_published)
                              setQuestions(qs => qs.map(x => x.id === q.id ? { ...x, is_published: !x.is_published } : x))
                            }}
                            className="text-xs text-brand-600 hover:underline"
                          >
                            {q.is_published ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(q.id)
                              setEditForm({ question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, correct_answer: q.correct_answer, explanation: q.explanation || '' })
                            }}
                            className="text-xs text-gray-500 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm('Delete this question? This cannot be undone.')) return
                              await adminDeleteQuestion(projectId, q.id)
                              setQuestions(qs => qs.filter(x => x.id !== q.id))
                            }}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Answer: {q.correct_answer}</p>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* Schedule tab */}
      {tab === 'schedule' && (
        <section className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Weekly Schedule</h2>
            <button
              onClick={() => { setShowWpForm(true); setWpEditingId(null); setWpForm({ week_number: weeklyPlans.length + 1, title: '', description: '' }); setWpError('') }}
              className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded hover:bg-brand-700"
            >
              + Add Week
            </button>
          </div>

          {wpError && <p className="text-red-600 text-sm mb-3">{wpError}</p>}

          {(showWpForm || wpEditingId) && (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setWpError('')
                if (!wpForm.title.trim()) { setWpError('Title is required.'); return }
                if (!wpForm.week_number || wpForm.week_number < 1) { setWpError('Week number must be >= 1.'); return }
                try {
                  if (wpEditingId) {
                    await adminUpdateWeeklyPlan(projectId, wpEditingId, { week_number: Number(wpForm.week_number), title: wpForm.title, description: wpForm.description })
                  } else {
                    await adminCreateWeeklyPlan(projectId, { week_number: Number(wpForm.week_number), title: wpForm.title, description: wpForm.description })
                  }
                  await loadWeeklyPlans()
                  setShowWpForm(false)
                  setWpEditingId(null)
                } catch (err) {
                  setWpError(err.response?.data?.detail ?? 'Failed to save.')
                }
              }}
              className="border border-gray-200 rounded-lg p-3 mb-4 space-y-2 bg-gray-50"
            >
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Week #"
                  value={wpForm.week_number}
                  onChange={e => setWpForm(f => ({ ...f, week_number: e.target.value }))}
                  className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="Title (e.g. Foundations)"
                  value={wpForm.title}
                  onChange={e => setWpForm(f => ({ ...f, title: e.target.value }))}
                  className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
                  required
                />
              </div>
              <textarea
                placeholder="Description (optional)"
                value={wpForm.description}
                onChange={e => setWpForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button type="submit" className="bg-brand-600 text-white px-3 py-1 rounded text-xs hover:bg-brand-700">
                  {wpEditingId ? 'Save' : 'Add'}
                </button>
                <button type="button" onClick={() => { setShowWpForm(false); setWpEditingId(null) }} className="text-gray-500 px-3 py-1 rounded text-xs hover:bg-gray-100">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {wpLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-12 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-200 rounded" />
            </div>
          ) : weeklyPlans.length === 0 && !showWpForm ? (
            <div className="text-center py-10">
              <svg className="mx-auto h-10 w-10 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No schedule yet</h3>
              <p className="mt-1 text-sm text-gray-500">Add weekly topics to guide learners through the material.</p>
            </div>
          ) : (
            <ol className="space-y-2">
              {weeklyPlans.map((plan) => (
                <li key={plan.id} className="border border-gray-100 rounded p-3 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800">Week {plan.week_number}: {plan.title}</p>
                    {plan.description && <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>}
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <button
                      onClick={() => { setWpEditingId(plan.id); setShowWpForm(false); setWpForm({ week_number: plan.week_number, title: plan.title, description: plan.description }); setWpError('') }}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm('Delete this week? This cannot be undone.')) return
                        await adminDeleteWeeklyPlan(projectId, plan.id)
                        await loadWeeklyPlans()
                      }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* Learners tab */}
      {tab === 'learners' && (
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Assigned Learners</h2>
          {project.learners?.length === 0 ? (
            <p className="text-gray-400 text-sm mb-4">No learners assigned yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 mb-4">
              {project.learners?.map((l) => (
                <li key={l.id} className="py-2 flex items-center justify-between text-sm">
                  <span className="text-gray-700">{l.email}</span>
                  <button onClick={() => handleRemove(l.id)} className="text-red-500 hover:underline text-xs">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleAssign} className="flex gap-2 mt-2">
            <input
              placeholder="Learner user ID"
              value={learnerEmail}
              onChange={(e) => setLearnerEmail(e.target.value)}
              required
              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
            />
            <button type="submit" className="bg-brand-600 text-white px-3 py-1.5 rounded text-sm hover:bg-brand-700">
              Assign
            </button>
          </form>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link
              to={`/admin/projects/${projectId}/analytics`}
              className="text-sm text-brand-600 hover:underline"
            >
              View full analytics dashboard →
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}

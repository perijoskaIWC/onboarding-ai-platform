import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProject, assignLearner, removeLearner } from '../../services/projects'
import { uploadDocument, listDocuments, deleteDocument } from '../../services/documents'
import { adminGetLearningPath, adminTriggerLearningPath } from '../../services/learningPath'
import { adminGenerateQuestions, adminListQuestions } from '../../services/quiz'

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

  const [documents, setDocuments] = useState([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const pollRef = useRef(null)

  const [learningPath, setLearningPath] = useState(null)
  const [lpLoading, setLpLoading] = useState(false)
  const [lpError, setLpError] = useState('')

  const [questions, setQuestions] = useState([])
  const [qLoading, setQLoading] = useState(false)

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

  async function loadLp() {
    setLpLoading(true)
    try {
      const res = await adminGetLearningPath(projectId)
      setLearningPath(res.data)
    } catch (err) {
      if (err.response?.status !== 404) setLpError('Failed to load learning path.')
    } finally {
      setLpLoading(false)
    }
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

  useEffect(() => {
    load()
    loadDocs()
    loadLp()
    loadQuestions()
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
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
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
    setDocuments((prev) => prev.filter((d) => d.id !== docId))
  }

  if (loading) return <div className="p-6 text-gray-500">Loading…</div>
  if (!project) return <div className="p-6 text-red-500">{error || 'Project not found.'}</div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}
      </div>

      {/* Learners */}
      <section className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Assigned Learners</h2>
        {project.learners?.length === 0 ? (
          <p className="text-gray-400 text-sm">No learners assigned yet.</p>
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
          <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">
            Assign
          </button>
        </form>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </section>

      {/* Documents */}
      <section className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Documents</h2>

        <form onSubmit={handleUpload} className="flex gap-2 mb-4">
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md"
            required
            className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm file:mr-2 file:border-0 file:bg-blue-50 file:text-blue-700 file:px-2 file:py-1 file:rounded"
          />
          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </form>
        {uploadError && <p className="text-red-600 text-sm mb-3">{uploadError}</p>}

        {docsLoading && documents.length === 0 ? (
          <p className="text-gray-400 text-sm">Loading documents…</p>
        ) : documents.length === 0 ? (
          <p className="text-gray-400 text-sm">No documents uploaded yet.</p>
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

      {/* Learning Path */}
      <section className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Learning Path</h2>
          <button
            onClick={async () => {
              setLpError('')
              setLearningPath(null)
              await adminTriggerLearningPath(projectId)
              // Poll every 3s for up to 30s
              let attempts = 0
              const poll = setInterval(async () => {
                attempts++
                await loadLp()
                if (attempts >= 10) clearInterval(poll)
              }, 3000)
            }}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
          >
            Regenerate
          </button>
        </div>
        {lpError && <p className="text-red-600 text-sm mb-2">{lpError}</p>}
        {lpLoading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : !learningPath ? (
          <p className="text-gray-400 text-sm">No learning path yet. Click Regenerate to create one.</p>
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

      {/* Questions */}
      <section className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Quiz Questions</h2>
          <button
            onClick={async () => {
              setQuestions([])
              await adminGenerateQuestions(projectId)
              let attempts = 0
              const poll = setInterval(async () => {
                attempts++
                await loadQuestions()
                if (attempts >= 10) clearInterval(poll)
              }, 3000)
            }}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
          >
            Regenerate
          </button>
        </div>
        {qLoading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : questions.length === 0 ? (
          <p className="text-gray-400 text-sm">No questions yet. Click Regenerate to create them.</p>
        ) : (
          <ol className="space-y-2">
            {questions.map((q, i) => (
              <li key={q.id} className="border border-gray-100 rounded p-3 text-sm">
                <p className="font-medium text-gray-800">{i + 1}. {q.question_text}</p>
                <p className="text-xs text-gray-400 mt-1">Answer: {q.correct_answer}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Analytics */}
      <section className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Analytics</h2>
        <Link
          to={`/admin/projects/${projectId}/analytics`}
          className="text-sm text-blue-600 hover:underline"
        >
          View full analytics dashboard →
        </Link>
      </section>
    </div>
  )
}

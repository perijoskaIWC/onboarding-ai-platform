import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getLearningPath, completeModule } from '../../services/learningPath'

export default function LearningPath() {
  const { projectId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    try {
      const res = await getLearningPath(projectId)
      setData(res.data)
    } catch {
      setError('Failed to load learning path.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [projectId])

  async function handleComplete(moduleId) {
    await completeModule(projectId, moduleId)
    await load()
  }

  if (loading) return <div className="p-6 text-gray-500">Loading…</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>

  if (data?.status === 'generating') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-700 font-medium">Your personalised learning path is being generated…</p>
          <p className="text-blue-500 text-sm mt-1">Refresh the page in a few seconds.</p>
        </div>
      </div>
    )
  }

  const modules = data?.modules ?? []
  const completed = modules.filter((m) => m.completed).length

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Learning Path</h1>
        <Link to={`/learner/projects/${projectId}/chat`} className="text-sm text-blue-600 hover:underline">
          Ask AI Tutor →
        </Link>
      </div>

      {data?.overview && (
        <div className="bg-white rounded-lg shadow p-4 text-gray-700 text-sm">
          {data.overview}
        </div>
      )}

      <div className="text-sm text-gray-500">
        {completed} / {modules.length} modules completed
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: modules.length ? `${(completed / modules.length) * 100}%` : '0%' }}
        />
      </div>

      <div className="space-y-4">
        {modules.map((mod, i) => (
          <div
            key={mod.id}
            className={`bg-white rounded-lg shadow p-4 border-l-4 ${mod.completed ? 'border-green-400' : 'border-blue-300'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">
                  {i + 1}. {mod.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{mod.summary}</p>
                {mod.key_concepts && (
                  <p className="text-xs text-gray-400 mt-2">
                    Key concepts: {mod.key_concepts}
                  </p>
                )}
              </div>
              {mod.completed ? (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full shrink-0">
                  Done
                </span>
              ) : (
                <button
                  onClick={() => handleComplete(mod.id)}
                  className="shrink-0 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Mark done
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

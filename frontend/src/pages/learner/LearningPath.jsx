import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getLearningPath, listMyPathNames, completeModule } from '../../services/learningPath'

const PATH_OPTIONS = ['Standard', 'Fast Track', 'In-Depth']

export default function LearningPath() {
  const { projectId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pathName, setPathName] = useState('Standard')
  const [availablePaths, setAvailablePaths] = useState([])

  async function load(name) {
    setLoading(true)
    setError('')
    try {
      const res = await getLearningPath(projectId, name)
      setData(res.data)
    } catch {
      setError('Failed to load learning path.')
    } finally {
      setLoading(false)
    }
  }

  async function loadPathNames() {
    try {
      const res = await listMyPathNames(projectId)
      setAvailablePaths(res.data.map((p) => p.path_name))
    } catch {
      // non-fatal
    }
  }

  useEffect(() => {
    loadPathNames()
    load(pathName)
  }, [projectId])

  async function switchPath(name) {
    setPathName(name)
    await load(name)
    await loadPathNames()
  }

  async function handleComplete(moduleId) {
    await completeModule(projectId, moduleId)
    await load(pathName)
  }

  if (loading) return (
    <div className="p-6 max-w-3xl mx-auto space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-200 rounded w-full" />
        </div>
      ))}
    </div>
  )
  if (error) return <div className="p-6 text-red-500">{error}</div>

  if (data?.status === 'generating') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-6 text-center">
          <p className="text-brand-700 font-medium">Your {pathName} learning path is being generated…</p>
          <p className="text-brand-500 text-sm mt-1">Refresh the page in a few seconds.</p>
        </div>
      </div>
    )
  }

  const modules = data?.modules ?? []
  const completed = modules.filter((m) => m.completed).length

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Learning Path</h1>
        <div className="flex gap-1">
          {PATH_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => switchPath(opt)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                pathName === opt
                  ? 'bg-brand-600 text-white border-brand-600'
                  : availablePaths.includes(opt)
                  ? 'bg-white text-brand-600 border-brand-300 hover:bg-brand-50'
                  : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
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
          className="bg-brand-500 h-2 rounded-full transition-all"
          style={{ width: modules.length ? `${(completed / modules.length) * 100}%` : '0%' }}
        />
      </div>

      <div className="space-y-4">
        {modules.map((mod, i) => (
          <div
            key={mod.id}
            className={`bg-white rounded-lg shadow p-4 border-l-4 ${mod.completed ? 'border-green-400' : 'border-brand-300'}`}
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
                  className="shrink-0 text-xs bg-brand-600 text-white px-3 py-1 rounded hover:bg-brand-700"
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

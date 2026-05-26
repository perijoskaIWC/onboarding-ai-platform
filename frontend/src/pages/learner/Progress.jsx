import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProgress } from '../../services/progress'

function ScoreGauge({ value }) {
  const pct = Math.round(value * 100)
  const color = pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-500'
  return (
    <div className="flex flex-col items-center">
      <span className={`text-5xl font-bold ${color}`}>{pct}%</span>
      <span className="text-xs text-gray-400 mt-1">Readiness Score</span>
    </div>
  )
}

export default function Progress() {
  const { projectId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await getProgress(projectId)
        setData(res.data)
      } catch {
        setError('Failed to load progress.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  if (loading) return <div className="p-6 text-gray-500">Loading…</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>
  if (!data) return null

  const modulePct = data.modules_total
    ? Math.round((data.modules_completed / data.modules_total) * 100)
    : 0

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/learner/projects/${projectId}/learning-path`} className="text-blue-600 text-sm hover:underline">
          ← Learning Path
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
      </div>

      {/* Readiness score */}
      <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
        <ScoreGauge value={data.readiness_score} />
        <p className="text-xs text-gray-400 mt-3">
          Score = Quiz average × 70% + Module completion × 30%
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{Math.round(data.quiz_avg * 100)}%</p>
          <p className="text-xs text-gray-400 mt-1">Quiz Average</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{modulePct}%</p>
          <p className="text-xs text-gray-400 mt-1">
            Modules ({data.modules_completed}/{data.modules_total})
          </p>
        </div>
      </div>

      {/* Quiz history */}
      {data.quiz_history?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-base font-semibold mb-3">Recent Quiz Attempts</h2>
          <ul className="divide-y divide-gray-100">
            {data.quiz_history.map((a, i) => (
              <li key={i} className="py-2 flex items-center justify-between text-sm">
                <span className="text-gray-500 text-xs">
                  {new Date(a.attempted_at).toLocaleDateString()}
                </span>
                <span className="font-medium text-gray-800">
                  {Math.round(a.score * 100)}% ({a.total} questions)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <Link
          to={`/learner/projects/${projectId}/quiz`}
          className="flex-1 text-center bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Take Quiz
        </Link>
        <Link
          to={`/learner/projects/${projectId}/chat`}
          className="flex-1 text-center border border-blue-600 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-50"
        >
          Ask AI Tutor
        </Link>
      </div>
    </div>
  )
}

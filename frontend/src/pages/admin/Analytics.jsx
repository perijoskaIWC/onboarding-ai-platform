import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { getAnalytics } from '../../services/analytics'

export default function Analytics() {
  const { projectId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await getAnalytics(projectId)
        setData(res.data)
      } catch {
        setError('Failed to load analytics.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  if (loading) return <div className="p-6 text-gray-500">Loading…</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>
  if (!data) return null

  const chartData = data.learners.map((l, i) => ({
    name: `Learner ${i + 1}`,
    readiness: Math.round(l.readiness_score * 100),
    quizAvg: Math.round(l.quiz_avg * 100),
  }))

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/admin/projects/${projectId}`} className="text-blue-600 text-sm hover:underline">
          ← Project
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Learners', value: data.total_learners },
          { label: 'Documents', value: data.doc_count },
          { label: 'Avg Readiness', value: `${Math.round(data.avg_readiness * 100)}%` },
          { label: 'Ready (≥80%)', value: data.ready_count },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Per-learner chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-base font-semibold mb-3">Learner Readiness vs Quiz Average</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="readiness" name="Readiness" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="quizAvg" name="Quiz Avg" fill="#93c5fd" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-learner table */}
      {data.learners.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
          <h2 className="text-base font-semibold mb-3">Learner Details</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="pb-2 pr-4">Learner ID</th>
                <th className="pb-2 pr-4">Readiness</th>
                <th className="pb-2 pr-4">Quiz Avg</th>
                <th className="pb-2">Modules</th>
              </tr>
            </thead>
            <tbody>
              {data.learners.map((l) => (
                <tr key={l.learner_id} className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-mono text-xs text-gray-500">{l.learner_id.slice(0, 8)}…</td>
                  <td className="py-2 pr-4 font-medium">{Math.round(l.readiness_score * 100)}%</td>
                  <td className="py-2 pr-4">{Math.round(l.quiz_avg * 100)}%</td>
                  <td className="py-2">{l.modules_completed}/{l.modules_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

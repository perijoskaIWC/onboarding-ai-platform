import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getWeeklyPlans } from '../../services/weeklyPlan'

export default function Schedule() {
  const { projectId } = useParams()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await getWeeklyPlans(projectId)
        setPlans(res.data)
      } catch (err) {
        setError(err.response?.data?.detail ?? 'Failed to load schedule.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  if (loading) return (
    <div className="p-6 max-w-2xl mx-auto space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  )

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Weekly Schedule</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {plans.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-sm">
          No schedule has been set up for this project yet.
        </div>
      ) : (
        <ol className="space-y-3">
          {plans.map((plan) => (
            <li key={plan.id} className="bg-white rounded-lg shadow p-4 border-l-4 border-brand-600">
              <p className="font-semibold text-gray-900 text-sm">Week {plan.week_number}: {plan.title}</p>
              {plan.description && (
                <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

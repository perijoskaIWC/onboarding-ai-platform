import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getLearningPath, completeModule } from '../../services/learningPath'
import ReadingMaterial from '../../components/ReadingMaterial'

export default function Schedule() {
  const { projectId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completing, setCompleting] = useState(null)

  async function load() {
    try {
      const res = await getLearningPath(projectId)
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to load schedule.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [projectId])

  async function handleComplete(moduleId) {
    setCompleting(moduleId)
    try {
      await completeModule(projectId, moduleId)
      await load()
    } finally {
      setCompleting(null)
    }
  }

  if (loading) return (
    <div className="p-6 max-w-2xl mx-auto space-y-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 space-y-2">
          <div className="h-4 bg-slate-100 rounded w-1/4" />
          <div className="h-3 bg-slate-100 rounded w-2/3" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  )

  if (error) return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600">{error}</div>
    </div>
  )

  if (!data || data.status === 'not_published') return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 text-amber-700 text-sm text-center">
        No learning path has been published yet. Check back soon.
      </div>
    </div>
  )

  const modules = data.modules ?? []
  const completed = modules.filter((m) => m.completed).length
  const pct = modules.length ? Math.round((completed / modules.length) * 100) : 0

  // Group modules by week
  const byWeek = {}
  for (const m of modules) {
    const w = m.week_number ?? 1
    if (!byWeek[w]) byWeek[w] = []
    byWeek[w].push(m)
  }
  const weeks = Object.keys(byWeek).sort((a, b) => Number(a) - Number(b))

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Weekly Schedule</h1>
        {data.overview && <p className="text-sm text-slate-500 mt-1 leading-relaxed">{data.overview}</p>}
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">Overall progress</span>
          <span className="text-sm font-bold text-slate-900">{completed} / {modules.length} modules</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          {pct === 100 ? 'All done!' : pct === 0 ? 'Not started' : `${pct}% complete`}
        </p>
      </div>

      {/* Weeks */}
      <div className="space-y-5">
        {weeks.map((week) => {
          const weekModules = byWeek[week]
          const weekDone = weekModules.every((m) => m.completed)
          return (
            <div key={week} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Week header */}
              <div className={`flex items-center gap-3 px-5 py-3 border-b ${weekDone ? 'border-emerald-100 bg-emerald-50/60' : 'border-slate-100 bg-slate-50/60'}`}>
                <span className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center shrink-0 ${weekDone ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'}`}>
                  {weekDone
                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    : week
                  }
                </span>
                <span className={`text-sm font-semibold ${weekDone ? 'text-emerald-800' : 'text-slate-800'}`}>
                  Week {week}
                </span>
                <span className="ml-auto text-xs text-slate-400">
                  {weekModules.filter((m) => m.completed).length}/{weekModules.length} done
                </span>
              </div>

              {/* Modules */}
              <ul className="divide-y divide-slate-50">
                {weekModules.map((m) => (
                  <li key={m.id} className={`flex items-start justify-between gap-4 px-5 py-4 ${m.completed ? 'bg-emerald-50/30' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-snug ${m.completed ? 'text-emerald-800 line-through decoration-emerald-300' : 'text-slate-800'}`}>
                        {m.title}
                      </p>
                      {m.summary && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{m.summary}</p>
                      )}
                      {m.key_concepts && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {m.key_concepts.split(',').slice(0, 4).map((c) => (
                            <span key={c} className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{c.trim()}</span>
                          ))}
                        </div>
                      )}
                      <ReadingMaterial chunks={m.chunks ?? []} />
                    </div>
                    {m.completed ? (
                      <span className="shrink-0 text-xs font-medium text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">Done</span>
                    ) : (
                      <button
                        onClick={() => handleComplete(m.id)}
                        disabled={completing === m.id}
                        className="shrink-0 text-xs font-medium bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        {completing === m.id ? 'Saving…' : 'Mark done'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

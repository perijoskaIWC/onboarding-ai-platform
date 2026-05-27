import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listAdminProjects, createProject, deleteProject } from '../../services/projects'

const DURATION_PRESETS = [
  { label: '2 weeks', value: 2, hint: 'Quick onboarding' },
  { label: '4 weeks', value: 4, hint: 'Standard' },
  { label: '8 weeks', value: 8, hint: 'In-depth' },
]

function CreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', duration_weeks: 4, quiz_length: 10 })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError('')
    try {
      await createProject(form)
      onCreated()
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to create project.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">New Project</h2>
                <p className="text-xs text-slate-400">Set up your onboarding program</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Project name <span className="text-red-400">*</span></label>
            <input
              placeholder="e.g. Dispatcher Onboarding 2025"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description <span className="text-slate-300 font-normal">optional</span></label>
            <textarea
              placeholder="What will learners be onboarded to?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none transition"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {DURATION_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm({ ...form, duration_weeks: p.value })}
                  className={`flex flex-col items-center py-2.5 px-2 rounded-xl border text-center transition-all ${
                    form.duration_weeks === p.value
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50'
                  }`}
                >
                  <span className="text-sm font-semibold">{p.label}</span>
                  <span className={`text-xs mt-0.5 ${form.duration_weeks === p.value ? 'text-indigo-200' : 'text-slate-400'}`}>{p.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quiz length */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">Quiz length</label>
              <span className="text-xs font-bold text-indigo-600 tabular-nums">{form.quiz_length} questions</span>
            </div>
            <input
              type="range" min={5} max={20} step={5}
              value={form.quiz_length}
              onChange={(e) => setForm({ ...form, quiz_length: Number(e.target.value) })}
              className="w-full accent-indigo-600 h-1.5"
            />
            <div className="flex justify-between mt-1">
              {[5, 10, 15, 20].map((n) => (
                <span key={n} className={`text-xs ${form.quiz_length === n ? 'text-indigo-600 font-semibold' : 'text-slate-300'}`}>{n}</span>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {saving ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProjectCard({ project, onDelete }) {
  return (
    <div className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200 overflow-hidden">
      {/* Color bar */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link
              to={`/admin/projects/${project.id}`}
              className="text-base font-semibold text-slate-900 hover:text-indigo-600 transition-colors leading-tight block truncate"
            >
              {project.name}
            </Link>
            {project.description && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{project.description}</p>
            )}
          </div>
          <Link
            to={`/admin/projects/${project.id}`}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span><strong className="text-slate-700">{project.learner_count ?? 0}</strong> learners</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span><strong className="text-slate-700">{project.duration_weeks ?? 4}</strong> weeks</span>
          </div>
        </div>
      </div>

      {/* Delete — only visible on hover */}
      <button
        onClick={() => onDelete(project.id)}
        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 font-medium transition-opacity"
      >
        Delete
      </button>
    </div>
  )
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      setProjects(await listAdminProjects())
    } catch {
      setError('Failed to load projects.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id) {
    if (!confirm('Delete this project and all its data?')) return
    await deleteProject(id)
    await load()
  }

  if (loading) return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="h-7 bg-slate-100 rounded-lg w-32 animate-pulse" />
        <div className="h-9 bg-slate-100 rounded-xl w-32 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {showModal && (
        <CreateModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); load() }}
        />
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          {projects.length > 0 && (
            <p className="text-sm text-slate-400 mt-0.5">{projects.length} onboarding {projects.length === 1 ? 'program' : 'programs'}</p>
          )}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center mb-5 shadow-sm">
            <svg className="w-7 h-7 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-800 text-base">No projects yet</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">Create your first onboarding program and start adding learners.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-6 inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

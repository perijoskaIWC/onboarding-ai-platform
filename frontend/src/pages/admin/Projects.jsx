import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listAdminProjects, createProject, deleteProject } from '../../services/projects'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', chunk_size: 500, quiz_length: 10 })
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

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await createProject(form)
      setShowForm(false)
      setForm({ name: '', description: '', chunk_size: 500, quiz_length: 10 })
      await load()
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to create project.')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this project and all its data?')) return
    await deleteProject(id)
    await load()
  }

  if (loading) return <div className="p-6 text-gray-500">Loading…</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          + New Project
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-4 mb-6 space-y-3">
          <input
            placeholder="Project name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Chunk size"
              value={form.chunk_size}
              onChange={(e) => setForm({ ...form, chunk_size: Number(e.target.value) })}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Quiz length"
              value={form.quiz_length}
              onChange={(e) => setForm({ ...form, quiz_length: Number(e.target.value) })}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
              Create
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 text-sm px-4 py-2">
              Cancel
            </button>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No projects yet. Create your first one.</p>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <Link to={`/admin/projects/${p.id}`} className="text-blue-600 font-medium hover:underline">
                  {p.name}
                </Link>
                <p className="text-sm text-gray-500">
                  {p.learner_count ?? 0} learners
                </p>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-red-500 text-sm hover:underline"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

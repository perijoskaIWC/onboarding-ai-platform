import { Link } from 'react-router-dom'
import { decodeToken, getStoredToken } from '../../services/auth'

export default function AdminDashboard() {
  const token = getStoredToken()
  const email = decodeToken(token)?.sub ?? ''
  const name = email.split('@')[0]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="mb-8">
        <p className="text-sm text-slate-500 mb-1">Welcome back</p>
        <h1 className="text-3xl font-bold text-slate-900 capitalize">{name} 👋</h1>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/admin/projects"
          className="group bg-white rounded-xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </div>
          <h2 className="font-semibold text-slate-800">Projects</h2>
          <p className="text-sm text-slate-500 mt-1">Manage onboarding projects and assign learners</p>
          <p className="text-xs text-indigo-600 mt-3 font-medium group-hover:underline">Open →</p>
        </Link>
      </div>
    </div>
  )
}

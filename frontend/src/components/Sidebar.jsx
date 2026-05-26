import { NavLink, useNavigate } from 'react-router-dom'
import { getStoredToken, decodeToken, logout } from '../services/auth'

const ICONS = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  projects: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h18M3 12h18M3 17h18" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-9 9 9v8a2 2 0 01-2 2h-4v-5H9v5H5a2 2 0 01-2-2v-8z" />
    </svg>
  ),
}

function NavItem({ to, icon, children, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative
        ${isActive
          ? 'bg-indigo-500/15 text-white'
          : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-full" />
          )}
          <span className="w-[18px] h-[18px] shrink-0 transition-colors">
            {icon}
          </span>
          <span>{children}</span>
        </>
      )}
    </NavLink>
  )
}

function UserAvatar({ email }) {
  const initials = email
    ? email.split('@')[0].slice(0, 2).toUpperCase()
    : '?'
  return (
    <div className="w-8 h-8 rounded-full bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-xs font-semibold text-indigo-200 shrink-0">
      {initials}
    </div>
  )
}

export default function Sidebar({ role = 'learner' }) {
  const navigate = useNavigate()
  const token = getStoredToken()
  const email = decodeToken(token)?.sub ?? ''

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const adminLinks = [
    { to: '/admin', label: 'Overview', icon: ICONS.overview, end: true },
    { to: '/admin/projects', label: 'Projects', icon: ICONS.projects },
  ]

  const learnerLinks = [
    { to: '/learner', label: 'Home', icon: ICONS.home, end: true },
  ]

  const links = role === 'admin' ? adminLinks : learnerLinks

  return (
    <aside className="w-60 bg-slate-900 flex flex-col hidden md:flex shrink-0">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26A7 7 0 0012 2z" />
              <path d="M9 21h6v1H9z" opacity=".5" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-white leading-tight">Onboarding AI</div>
            <div className="text-xs text-slate-500 leading-tight mt-0.5">{role === 'admin' ? 'Admin Portal' : 'Learner Portal'}</div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-slate-800 mb-4" />

      {/* Nav */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {links.map((l) => (
          <NavItem key={l.to} to={l.to} icon={l.icon} end={l.end}>
            {l.label}
          </NavItem>
        ))}
      </nav>

      {/* Bottom — user + logout */}
      <div className="mx-4 border-t border-slate-800 mt-4" />
      <div className="px-4 py-4 flex items-center gap-3">
        <UserAvatar email={email} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-300 truncate leading-tight">{email || 'User'}</p>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors mt-0.5"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}

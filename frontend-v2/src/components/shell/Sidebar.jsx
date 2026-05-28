import { useNavigate, useLocation } from 'react-router-dom'
import Icon from '../../icons'
import { Avatar } from '../ui'
import { decodeToken, getStoredToken, logout } from '../../services/auth'

const NAV_ADMIN = [
  { group: 'Workspace', items: [
    { id: 'admin-dashboard', label: 'Dashboard', icon: 'grid', path: '/v2/admin' },
    { id: 'admin-projects', label: 'Projects', icon: 'folder', path: '/v2/admin/projects' },
  ]},
  { group: 'Learning', items: [
    { id: 'admin-paths', label: 'Learning Paths', icon: 'layers', path: '/v2/admin/projects' },
    { id: 'admin-assign', label: 'Assignments', icon: 'users', path: '/v2/admin/projects' },
    { id: 'admin-ai-config', label: 'AI Tutor Config', icon: 'sparkle', path: '/v2/admin/ai-config' },
  ]},
  { group: 'Insights', items: [
    { id: 'admin-analytics', label: 'Analytics', icon: 'chart', path: '/v2/admin/analytics' },
    { id: 'admin-users', label: 'Users', icon: 'user', path: '/v2/admin/users' },
    { id: 'admin-settings', label: 'Settings', icon: 'cog', path: '/v2/admin/settings' },
  ]},
]

const NAV_LEARNER = [
  { group: 'Learn', items: [
    { id: 'learner-dashboard', label: 'Home', icon: 'grid', path: '/v2/learner' },
    { id: 'learner-paths', label: 'My Learning Paths', icon: 'book', path: '/v2/learner/paths' },
    { id: 'learner-ai-tutor', label: 'AI Tutor', icon: 'sparkle', path: '/v2/learner/ai-tutor' },
  ]},
  { group: 'Track', items: [
    { id: 'learner-progress', label: 'Progress', icon: 'trend', path: '/v2/learner/progress' },
    { id: 'learner-readiness', label: 'Evaluation', icon: 'target', path: '/v2/learner/readiness' },
  ]},
  { group: 'Account', items: [
    { id: 'learner-profile', label: 'Profile & Settings', icon: 'cog', path: '/v2/learner/profile' },
  ]},
]

export default function Sidebar({ role, collapsed, onToggleCollapse }) {
  const navigate = useNavigate()
  const location = useLocation()
  const nav = role === 'admin' ? NAV_ADMIN : NAV_LEARNER

  const token = getStoredToken()
  const payload = decodeToken(token)
  const email = payload?.sub ?? ''
  const initials = email.slice(0, 2).toUpperCase()
  const roleLabel = role === 'admin' ? 'Workspace Admin' : 'Learner'

  const isActive = (item) => {
    if (item.path === '/v2/admin' || item.path === '/v2/learner') {
      return location.pathname === item.path
    }
    return location.pathname.startsWith(item.path)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/v2/login')
  }

  return (
    <aside className={'sidebar' + (collapsed ? ' collapsed' : '')}>
      <div className="sidebar-brand">
        <div className="brand-mark">A</div>
        <div className="brand-text">
          <strong>Atlas</strong>
          <span>Onboarding</span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 8 }}>
        {nav.map((sec, si) => (
          <div className="sidebar-section" key={si}>
            <div className="sidebar-section-label">{sec.group}</div>
            <div className="nav">
              {sec.items.map(item => (
                <button
                  key={item.id}
                  className={'nav-item ' + (isActive(item) ? 'active' : '')}
                  onClick={() => navigate(item.path)}
                  title={item.label}
                >
                  <span className="ico"><Icon name={item.icon} size={16} /></span>
                  <span className="label">{item.label}</span>
                  {item.badge && <span className="badge">{item.badge}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-user" onClick={handleLogout} title="Sign out">
        <Avatar initials={initials} />
        <div className="user-meta">
          <strong>{email.split('@')[0]}</strong>
          <span>{roleLabel}</span>
        </div>
        <Icon name="external" size={14} style={{ color: 'var(--text-3)', marginLeft: 'auto', flexShrink: 0 }} />
      </div>
    </aside>
  )
}

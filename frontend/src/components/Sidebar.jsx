import { NavLink } from 'react-router-dom'

function NavItem({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-brand-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
    >
      <span className="w-5 h-5 text-current" aria-hidden dangerouslySetInnerHTML={{ __html: icon }} />
      <span>{children}</span>
    </NavLink>
  )
}

export default function Sidebar({ role = 'learner' }) {
  const adminLinks = [
    { to: '/admin', label: 'Overview', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18"/></svg>' },
    { to: '/admin/projects', label: 'Projects', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2H3V4z"/><path fillRule="evenodd" d="M3 8h14v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm5 2a1 1 0 100 2h4a1 1 0 100-2H8z" clipRule="evenodd"/></svg>' },
    { to: '/admin/projects/1/analytics', label: 'Analytics', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3v18M4 12h14"/></svg>' },
  ]

  const learnerLinks = [
    { to: '/learner', label: 'Home', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l9-9 9 9v8a2 2 0 01-2 2h-4v-6H9v6H5a2 2 0 01-2-2v-8z"/></svg>' },
    { to: '/learner/projects/1/learning-path', label: 'Learning Path', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a1 1 0 000 2h12a1 1 0 100-2H4zM4 8a1 1 0 000 2h8a1 1 0 100-2H4zM4 13a1 1 0 000 2h6a1 1 0 100-2H4z"/></svg>' },
    { to: '/learner/projects/1/chat', label: 'AI Tutor', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.366 0-2.67-.257-3.846-.72L3 20l1.109-4.11C3.4 14.373 3 13.21 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>' },
    { to: '/learner/projects/1/quiz', label: 'Quiz', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l.58 1.789a1 1 0 00.95.69h1.882c.969 0 1.371 1.24.588 1.81l-1.522 1.106a1 1 0 00-.364 1.118l.58 1.789c.3.921-.755 1.688-1.54 1.118L10 12.347l-1.702 1.2c-.785.57-1.84-.197-1.54-1.118l.58-1.789a1 1 0 00-.364-1.118L5.452 6.216C4.669 5.646 5.07 4.406 6.039 4.406h1.882a1 1 0 00.95-.69l.58-1.789z"/></svg>' },
  ]

  const links = role === 'admin' ? adminLinks : learnerLinks

  return (
    <aside className="w-64 bg-white border-r border-gray-100 p-4 hidden md:block">
      <div className="mb-6">
        <div className="text-xl font-bold text-gray-900">Onboarding AI</div>
        <div className="text-xs text-gray-400">{role === 'admin' ? 'Admin' : 'Learner'}</div>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map((l) => (
          <NavItem key={l.to} to={l.to} icon={l.icon}>{l.label}</NavItem>
        ))}
      </nav>
    </aside>
  )
}

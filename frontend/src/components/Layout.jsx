import Sidebar from './Sidebar'

export default function Layout({ role = 'learner', children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar role={role} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

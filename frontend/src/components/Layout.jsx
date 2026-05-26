import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { getStoredToken, decodeToken, logout } from '../services/auth'

export default function Layout({ role = 'learner', children }) {
  const navigate = useNavigate()
  const token = getStoredToken()
  const email = decodeToken(token)?.sub ?? ''

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-surface-50 text-gray-800 flex">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-brand-600 text-white flex items-center justify-center font-bold">AI</div>
            <div className="text-sm font-semibold">Onboarding AI Platform</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">{email}</div>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">Logout</button>
          </div>
        </header>

        <main className="p-6 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}

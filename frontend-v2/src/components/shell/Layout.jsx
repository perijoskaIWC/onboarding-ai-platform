import { useState } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ role, children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={'app' + (collapsed ? ' collapsed' : '')}>
      <Sidebar role={role} collapsed={collapsed} onToggleCollapse={() => setCollapsed(c => !c)} />
      <main className="main">
        {children}
      </main>
    </div>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import Projects from './pages/admin/Projects'
import ProjectDetail from './pages/admin/ProjectDetail'
import Analytics from './pages/admin/Analytics'
import LearnerDashboard from './pages/learner/Dashboard'
import LearningPath from './pages/learner/LearningPath'
import Chat from './pages/learner/Chat'
import Quiz from './pages/learner/Quiz'
import Progress from './pages/learner/Progress'

import Layout from './components/Layout'

function AdminLayout({ children }) {
  return (
    <PrivateRoute role="admin">
      <Layout role="admin">{children}</Layout>
    </PrivateRoute>
  )
}

function LearnerLayout({ children }) {
  return (
    <PrivateRoute role="learner">
      <Layout role="learner">{children}</Layout>
    </PrivateRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/projects" element={<AdminLayout><Projects /></AdminLayout>} />
        <Route path="/admin/projects/:projectId" element={<AdminLayout><ProjectDetail /></AdminLayout>} />
        <Route path="/admin/projects/:projectId/analytics" element={<AdminLayout><Analytics /></AdminLayout>} />

        {/* Learner */}
        <Route path="/learner" element={<LearnerLayout><LearnerDashboard /></LearnerLayout>} />
        <Route path="/learner/projects/:projectId/learning-path" element={<LearnerLayout><LearningPath /></LearnerLayout>} />
        <Route path="/learner/projects/:projectId/chat" element={<LearnerLayout><Chat /></LearnerLayout>} />
        <Route path="/learner/projects/:projectId/quiz" element={<LearnerLayout><Quiz /></LearnerLayout>} />
        <Route path="/learner/projects/:projectId/progress" element={<LearnerLayout><Progress /></LearnerLayout>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './components/guards/PrivateRoute'
import Layout from './components/shell/Layout'

import Login from './pages/auth/Login'

import AdminDashboard from './pages/admin/Dashboard'
import AdminProjects from './pages/admin/Projects'
import AdminProjectCreate from './pages/admin/ProjectCreate'
import AdminProjectDetail from './pages/admin/ProjectDetail'
import AdminDocuments from './pages/admin/Documents'
import AdminPathChat from './pages/admin/PathChat'
import AdminPathPreview from './pages/admin/PathPreview'
import AdminAssign from './pages/admin/Assign'
import AdminQuizzes from './pages/admin/Quizzes'
import AdminAnalytics from './pages/admin/Analytics'
import AdminUsers from './pages/admin/Users'
import AdminAIConfig from './pages/admin/AIConfig'
import AdminSettings from './pages/admin/Settings'

import LearnerDashboard from './pages/learner/Dashboard'
import LearnerPaths from './pages/learner/Paths'
import LearnerModule from './pages/learner/Module'
import LearnerChapter from './pages/learner/Chapter'
import LearnerQuiz from './pages/learner/Quiz'
import LearnerQuizResult from './pages/learner/QuizResult'
import LearnerAITutor from './pages/learner/AITutor'
import LearnerDocuments from './pages/learner/Documents'
import LearnerReadiness from './pages/learner/Readiness'
import LearnerProgress from './pages/learner/Progress'
import LearnerProfile from './pages/learner/Profile'

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
        <Route path="/v2/login" element={<Login />} />

        {/* Admin */}
        <Route path="/v2/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/v2/admin/projects" element={<AdminLayout><AdminProjects /></AdminLayout>} />
        <Route path="/v2/admin/projects/new" element={<AdminLayout><AdminProjectCreate /></AdminLayout>} />
        <Route path="/v2/admin/projects/:projectId" element={<AdminLayout><AdminProjectDetail /></AdminLayout>} />
        <Route path="/v2/admin/projects/:projectId/paths" element={<AdminLayout><AdminPathChat /></AdminLayout>} />
        <Route path="/v2/admin/projects/:projectId/paths/preview" element={<AdminLayout><AdminPathPreview /></AdminLayout>} />
        <Route path="/v2/admin/projects/:projectId/assign" element={<AdminLayout><AdminAssign /></AdminLayout>} />
        <Route path="/v2/admin/documents" element={<AdminLayout><AdminDocuments /></AdminLayout>} />
        <Route path="/v2/admin/quizzes" element={<AdminLayout><AdminQuizzes /></AdminLayout>} />
        <Route path="/v2/admin/analytics" element={<AdminLayout><AdminAnalytics /></AdminLayout>} />
        <Route path="/v2/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
        <Route path="/v2/admin/ai-config" element={<AdminLayout><AdminAIConfig /></AdminLayout>} />
        <Route path="/v2/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />

        {/* Learner */}
        <Route path="/v2/learner" element={<LearnerLayout><LearnerDashboard /></LearnerLayout>} />
        <Route path="/v2/learner/paths" element={<LearnerLayout><LearnerPaths /></LearnerLayout>} />
        <Route path="/v2/learner/paths/:pathId" element={<LearnerLayout><LearnerModule /></LearnerLayout>} />
        <Route path="/v2/learner/paths/:pathId/chapters/:chapterId" element={<LearnerLayout><LearnerChapter /></LearnerLayout>} />
        <Route path="/v2/learner/paths/:pathId/quiz" element={<LearnerLayout><LearnerQuiz /></LearnerLayout>} />
        <Route path="/v2/learner/paths/:pathId/quiz/result" element={<LearnerLayout><LearnerQuizResult /></LearnerLayout>} />
        <Route path="/v2/learner/ai-tutor" element={<LearnerLayout><LearnerAITutor /></LearnerLayout>} />
        <Route path="/v2/learner/documents" element={<LearnerLayout><LearnerDocuments /></LearnerLayout>} />
        <Route path="/v2/learner/readiness" element={<LearnerLayout><LearnerReadiness /></LearnerLayout>} />
        <Route path="/v2/learner/progress" element={<LearnerLayout><LearnerProgress /></LearnerLayout>} />
        <Route path="/v2/learner/profile" element={<LearnerLayout><LearnerProfile /></LearnerLayout>} />

        <Route path="/v2" element={<Navigate to="/v2/login" replace />} />
        <Route path="*" element={<Navigate to="/v2/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

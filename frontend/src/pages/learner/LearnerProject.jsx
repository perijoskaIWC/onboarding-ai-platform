import { useState } from 'react'
import { useParams } from 'react-router-dom'
import LearningPath from './LearningPath'
import Chat from './Chat'
import Quiz from './Quiz'
import Progress from './Progress'
import Schedule from './Schedule'

export default function LearnerProject() {
  const { projectId } = useParams()
  const [tab, setTab] = useState('learning-path')

  const tabClass = (t) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      tab === t
        ? 'border-brand-600 text-brand-600'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-200 bg-white px-4">
        <button className={tabClass('learning-path')} onClick={() => setTab('learning-path')}>Learning Path</button>
        <button className={tabClass('schedule')} onClick={() => setTab('schedule')}>Schedule</button>
        <button className={tabClass('ai-tutor')} onClick={() => setTab('ai-tutor')}>AI Tutor</button>
        <button className={tabClass('quiz')} onClick={() => setTab('quiz')}>Quiz</button>
        <button className={tabClass('progress')} onClick={() => setTab('progress')}>Progress</button>
      </div>

      <div className="flex-1 overflow-auto">
        {tab === 'learning-path' && <LearningPath key={projectId} />}
        {tab === 'schedule' && <Schedule key={projectId} />}
        {tab === 'ai-tutor' && <Chat key={projectId} />}
        {tab === 'quiz' && <Quiz key={projectId} />}
        {tab === 'progress' && <Progress key={projectId} />}
      </div>
    </div>
  )
}

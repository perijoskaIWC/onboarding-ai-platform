import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Badge } from '../../components/ui'
import Icon from '../../icons'
import { getQuiz, submitQuiz, getPathQuiz, submitPathQuiz } from '../../services/quiz'

export default function LearnerQuiz() {
  const { pathId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { projectId } = location.state ?? {}
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState({})
  const [secondsLeft, setSecondsLeft] = useState(600)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = projectId
      ? getPathQuiz(projectId, pathId)
      : getQuiz(pathId)   // backward compat
    fetch
      .then(data => {
        const qs = Array.isArray(data) ? data : (data.questions ?? [])
        setQuiz({ id: null })
        setQuestions(qs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [pathId, projectId])

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  const handleSubmit = async () => {
    setSubmitting(true)
    // convert {questionIndex: optionIndex} → {questionId: "A"|"B"|"C"|"D"}
    const letters = ['A', 'B', 'C', 'D']
    const formatted = {}
    Object.entries(answers).forEach(([qi, oi]) => {
      const q = questions[Number(qi)]
      if (q) formatted[q.id] = letters[oi] ?? 'A'
    })
    try {
      const result = projectId
        ? await submitPathQuiz(projectId, pathId, formatted)
        : await submitQuiz(pathId, formatted)   // backward compat
      navigate(`/v2/learner/paths/${pathId}/quiz/result`, { state: { ...result, projectId } })
    } catch {
      navigate(`/v2/learner/paths/${pathId}/quiz/result`, { state: { projectId } })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}><div className="skeleton" style={{ width: 400, height: 40 }} /></div>

  if (questions.length === 0) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', textAlign: 'center' }}>
        <div>
          <Icon name="check" size={32} style={{ color: 'var(--text-3)' }} />
          <h2 style={{ marginTop: 16 }}>No quiz available</h2>
          <p className="muted">Quiz questions haven't been generated yet for this path.</p>
          <button className="btn primary" onClick={() => navigate(`/v2/learner/paths/${pathId}`)}>Back to module</button>
        </div>
      </div>
    )
  }

  const q = questions[i]
  const total = questions.length
  const answered = Object.keys(answers).length
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const opts = q.options ?? []

  return (
    <>
      <div className="topbar">
        <div className="crumbs">
          <span>Quiz</span>
          <Icon name="chevronRight" size={12} className="sep" />
          <strong>Question {i + 1} of {total}</strong>
        </div>
        <div className="actions">
          <Badge tone="warning"><Icon name="clock" size={11} /> {mm}:{ss}</Badge>
          <button className="btn" onClick={() => navigate(`/v2/learner/paths/${pathId}`)}>Save & exit</button>
        </div>
      </div>
      <div className="viewport" style={{ background: 'var(--bg)' }}>
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '12px 28px' }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="muted" style={{ fontSize: 12 }}>{answered} of {total} answered</span>
            <span className="muted num" style={{ fontSize: 12 }}>{Math.round((answered / total) * 100)}%</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {questions.map((_, idx) => (
              <button key={idx} onClick={() => setI(idx)} style={{
                flex: 1, height: 4, borderRadius: 99, border: 0, cursor: 'pointer', padding: 0,
                background: idx === i ? 'var(--accent)' : answers[idx] != null ? '#86EFAC' : 'var(--surface-3)',
              }} />
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 28px' }}>
          <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Question {i + 1}</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.3, margin: '8px 0 24px' }}>{q.question_text}</h1>

          <div className="col" style={{ gap: 10 }}>
            {opts.map((o, oi) => (
              <button key={oi} onClick={() => setAnswers({ ...answers, [i]: oi })}
                style={{
                  textAlign: 'left', padding: '14px 16px', borderRadius: 12,
                  background: answers[i] === oi ? 'var(--accent-soft)' : 'var(--surface)',
                  border: answers[i] === oi ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 12, fontSize: 14,
                  boxShadow: answers[i] === oi ? '0 0 0 4px rgba(37,99,235,0.10)' : 'var(--shadow-xs)',
                  transition: 'all 0.08s', cursor: 'pointer',
                }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: answers[i] === oi ? '1.5px solid var(--accent)' : '1.5px solid var(--border-strong)', display: 'grid', placeItems: 'center', flexShrink: 0, background: answers[i] === oi ? 'var(--accent)' : 'transparent' }}>
                  {answers[i] === oi && <Icon name="check" size={12} style={{ color: 'white' }} />}
                </div>
                <span style={{ fontWeight: answers[i] === oi ? 500 : 400, flex: 1 }}>{o}</span>
                <span className="mono muted" style={{ fontSize: 11 }}>{String.fromCharCode(65 + oi)}</span>
              </button>
            ))}
          </div>

          <div className="row" style={{ marginTop: 32, justifyContent: 'space-between' }}>
            <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}><Icon name="chevronLeft" size={14} /> Previous</button>
            <button className="btn ghost"><Icon name="flag" size={14} /> Flag for review</button>
            {i < total - 1
              ? <button className="btn primary" onClick={() => setI(i + 1)}>Next <Icon name="chevronRight" size={14} /></button>
              : <button className="btn primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit quiz'} <Icon name="check" size={14} /></button>}
          </div>
        </div>
      </div>
    </>
  )
}

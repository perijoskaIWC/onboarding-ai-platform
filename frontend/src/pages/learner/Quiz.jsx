import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { getQuiz, submitQuiz, getAdaptiveQuestions } from '../../services/quiz'

const QUICK_OPTIONS = [5, 10, 20]
const LABELS = ['A', 'B', 'C', 'D']
const DIFF_LABEL = { harder: 'Challenge', easier: 'Reinforcement', standard: 'Practice' }

function useCountUp(target, duration = 1000, active = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [active, target, duration])
  return count
}

function OptionButton({ letter, text, selected, onChange }) {
  return (
    <label className={`flex items-center gap-3 border rounded-xl p-3.5 cursor-pointer transition-all duration-150 select-none
      ${selected
        ? 'border-indigo-500 bg-indigo-50 scale-[1.01] shadow-sm shadow-indigo-100'
        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
      }`}
    >
      <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-colors
        ${selected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 text-slate-400'}`}>
        {letter}
      </span>
      <input type="radio" name={letter} value={letter} checked={selected} onChange={onChange} className="sr-only" />
      <span className="text-sm text-slate-700 leading-snug">{text}</span>
    </label>
  )
}

function ResultCard({ r, index }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 60)
    return () => clearTimeout(t)
  }, [index])

  return (
    <div className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      ${r.is_correct ? 'border-emerald-200' : 'border-red-200'}`}
    >
      <div className={`h-1 ${r.is_correct ? 'bg-emerald-400' : 'bg-red-400'}`} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${r.is_correct ? 'bg-emerald-100' : 'bg-red-100'}`}>
            {r.is_correct
              ? <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              : <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 leading-snug">{r.question_text}</p>
            <p className="text-xs text-slate-500 mt-1.5">
              Your answer: <span className={`font-semibold ${r.is_correct ? 'text-emerald-600' : 'text-red-500'}`}>{r.given_answer || '—'}</span>
              {!r.is_correct && (
                <> · Correct: <span className="font-semibold text-emerald-600">{r.correct_answer}</span></>
              )}
            </p>
            {r.explanation && (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{r.explanation}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Quiz() {
  const { projectId } = useParams()
  const [totalAvailable, setTotalAvailable] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [phase, setPhase] = useState('setup')
  const [adaptiveQuestions, setAdaptiveQuestions] = useState([])
  const [adaptiveAnswers, setAdaptiveAnswers] = useState({})
  const [adaptiveResult, setAdaptiveResult] = useState(null)
  const [adaptiveLoading, setAdaptiveLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const scoreTarget = result ? Math.round(result.score * 100) : 0
  const animatedScore = useCountUp(scoreTarget, 900, phase === 'result')
  const adaptiveScoreTarget = adaptiveResult ? Math.round((adaptiveResult.correct / adaptiveResult.total) * 100) : 0
  const animatedAdaptiveScore = useCountUp(adaptiveScoreTarget, 900, !!adaptiveResult)

  useEffect(() => {
    async function probe() {
      try {
        const res = await getQuiz(projectId)
        setTotalAvailable(res.data.length)
      } catch (err) {
        setError(err.response?.data?.detail ?? 'Failed to load quiz.')
        setTotalAvailable(0)
      } finally {
        setLoading(false)
      }
    }
    probe()
  }, [projectId])

  async function startQuiz(count) {
    setError('')
    setLoading(true)
    try {
      const res = await getQuiz(projectId, count < totalAvailable ? count : null)
      setQuestions(res.data)
      setAnswers({})
      setPhase('quiz')
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to load quiz.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (Object.keys(answers).length < questions.length) {
      setError('Please answer all questions before submitting.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await submitQuiz(projectId, answers)
      setResult(res.data)
      setPhase('result')
    } catch {
      setError('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleRetake() {
    setPhase('setup')
    setResult(null)
    setAnswers({})
    setQuestions([])
    setAdaptiveResult(null)
  }

  async function handlePractice() {
    setAdaptiveLoading(true)
    setAdaptiveAnswers({})
    setAdaptiveResult(null)
    try {
      const res = await getAdaptiveQuestions(projectId)
      if (res.data.length === 0) {
        await new Promise((r) => setTimeout(r, 3000))
        const res2 = await getAdaptiveQuestions(projectId)
        setAdaptiveQuestions(res2.data)
      } else {
        setAdaptiveQuestions(res.data)
      }
      setPhase('adaptive')
    } catch {
      // stay on result
    } finally {
      setAdaptiveLoading(false)
    }
  }

  function handleAdaptiveSubmit(e) {
    e.preventDefault()
    const scored = adaptiveQuestions.map((q) => {
      const given = adaptiveAnswers[q.id] || ''
      return { ...q, given, is_correct: given.toUpperCase() === q.correct_answer.toUpperCase() }
    })
    setAdaptiveResult({ scored, correct: scored.filter((q) => q.is_correct).length, total: adaptiveQuestions.length })
  }

  if (loading) return (
    <div className="p-8 max-w-2xl mx-auto space-y-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 space-y-3">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-10 bg-slate-100 rounded-lg" />
          <div className="h-10 bg-slate-100 rounded-lg" />
        </div>
      ))}
    </div>
  )

  /* ── SETUP ─────────────────────────────────────────────────── */
  if (phase === 'setup') {
    const options = QUICK_OPTIONS.filter((n) => n < totalAvailable)
    return (
      <div className="p-8 max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Quiz</h1>
        {totalAvailable === 0 ? (
          <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-6 text-sm text-amber-700">
            No questions available yet. Ask your admin to generate the quiz.
          </div>
        ) : (
          <>
            <p className="text-slate-500 text-sm mb-6">
              {totalAvailable} question{totalAvailable !== 1 ? 's' : ''} available. How many would you like to attempt?
            </p>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="space-y-2">
              {options.map((n) => (
                <button
                  key={n}
                  onClick={() => startQuiz(n)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-left text-sm font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                >
                  <span className="font-bold text-indigo-600">{n}</span> random questions
                </button>
              ))}
              <button
                onClick={() => startQuiz(totalAvailable)}
                className="w-full bg-indigo-600 text-white rounded-xl px-5 py-3.5 text-left text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                All <span className="font-bold">{totalAvailable}</span> questions
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  /* ── RESULT ────────────────────────────────────────────────── */
  if (phase === 'result') {
    const pct = scoreTarget
    const grade = pct >= 80 ? { label: 'Excellent', color: 'emerald' } : pct >= 60 ? { label: 'Good', color: 'indigo' } : { label: 'Keep going', color: 'amber' }
    const ringColor = { emerald: '#10b981', indigo: '#6366f1', amber: '#f59e0b' }[grade.color]
    const circum = 2 * Math.PI * 44
    const offset = circum - (animatedScore / 100) * circum

    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        {/* Score card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Quiz Complete</h2>

          {/* Circular progress */}
          <div className="relative w-28 h-28 mx-auto mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#f1f5f9" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="44" fill="none"
                stroke={ringColor} strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circum}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.05s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-900">{animatedScore}</span>
              <span className="text-xs text-slate-400">%</span>
            </div>
          </div>

          <p className={`text-sm font-semibold text-${grade.color}-600 mb-1`}>{grade.label}</p>
          <p className="text-slate-500 text-sm">{result.correct} / {result.total} correct</p>

          <div className="flex gap-3 justify-center mt-6">
            <button onClick={handleRetake} className="text-sm bg-slate-100 text-slate-700 px-5 py-2 rounded-lg hover:bg-slate-200 font-medium">
              Retake
            </button>
            <button
              onClick={handlePractice}
              disabled={adaptiveLoading}
              className="text-sm bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium shadow-sm"
            >
              {adaptiveLoading ? 'Loading…' : 'Adaptive Practice'}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Questions tailored to your performance</p>
        </div>

        {/* Result breakdown */}
        <div className="space-y-3">
          {result.results.map((r, i) => <ResultCard key={r.question_id} r={r} index={i} />)}
        </div>
      </div>
    )
  }

  /* ── ADAPTIVE ──────────────────────────────────────────────── */
  if (phase === 'adaptive') {
    if (adaptiveResult) {
      const pct = adaptiveScoreTarget
      return (
        <div className="p-8 max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Practice Complete</h2>
            <p className="text-5xl font-bold text-indigo-600">{animatedAdaptiveScore}%</p>
            <p className="text-slate-500 text-sm mt-1">{adaptiveResult.correct} / {adaptiveResult.total} correct</p>
            <button onClick={handleRetake} className="mt-5 text-sm bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 font-medium shadow-sm">
              New Quiz
            </button>
          </div>
          <div className="space-y-3">
            {adaptiveResult.scored.map((q, i) => <ResultCard key={q.id} r={{ ...q, question_text: q.question_text, given_answer: q.given }} index={i} />)}
          </div>
        </div>
      )
    }

    if (adaptiveQuestions.length === 0) {
      return (
        <div className="p-8 max-w-2xl mx-auto">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 text-amber-700 text-sm text-center">
            Adaptive questions are still being generated. Try again in a moment.
          </div>
          <button onClick={() => setPhase('result')} className="mt-4 text-sm text-indigo-600 hover:underline">
            Back to results
          </button>
        </div>
      )
    }

    const difficulty = adaptiveQuestions[0]?.difficulty ?? 'standard'
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Adaptive Practice</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {DIFF_LABEL[difficulty]} · {adaptiveQuestions.length} questions
            </p>
          </div>
          <button onClick={() => setPhase('result')} className="text-xs text-slate-400 hover:text-slate-600">Back</button>
        </div>
        <form onSubmit={handleAdaptiveSubmit} className="space-y-5">
          {adaptiveQuestions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <p className="text-sm font-semibold text-slate-800 mb-3 leading-snug">{i + 1}. {q.question_text}</p>
              <div className="space-y-2">
                {q.options.map((opt, j) => (
                  <OptionButton
                    key={LABELS[j]}
                    letter={LABELS[j]}
                    text={opt}
                    selected={adaptiveAnswers[q.id] === LABELS[j]}
                    onChange={() => setAdaptiveAnswers((prev) => ({ ...prev, [q.id]: LABELS[j] }))}
                  />
                ))}
              </div>
            </div>
          ))}
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm">
            Submit Practice
          </button>
        </form>
      </div>
    )
  }

  /* ── QUIZ ──────────────────────────────────────────────────── */
  const answered = Object.keys(answers).length
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quiz</h1>
          <p className="text-sm text-slate-500 mt-0.5">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Answered</span>
          <p className="text-sm font-bold text-slate-700">{answered} / {questions.length}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
          style={{ width: `${questions.length ? (answered / questions.length) * 100 : 0}%` }}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {questions.map((q, i) => (
          <div key={q.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-slate-800 mb-3 leading-snug">{i + 1}. {q.question_text}</p>
            <div className="space-y-2">
              {q.options.map((opt, j) => (
                <OptionButton
                  key={LABELS[j]}
                  letter={LABELS[j]}
                  text={opt}
                  selected={answers[q.id] === LABELS[j]}
                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: LABELS[j] }))}
                />
              ))}
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting || answered < questions.length}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 shadow-sm transition-all"
        >
          {submitting ? 'Submitting…' : answered < questions.length ? `Answer all questions (${answered}/${questions.length})` : 'Submit Quiz'}
        </button>
      </form>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getQuiz, submitQuiz, getAdaptiveQuestions } from '../../services/quiz'

const QUICK_OPTIONS = [5, 10, 20]

export default function Quiz() {
  const { projectId } = useParams()
  const [totalAvailable, setTotalAvailable] = useState(null)
  const [selectedCount, setSelectedCount] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [phase, setPhase] = useState('setup') // 'setup' | 'quiz' | 'result' | 'adaptive'
  const [adaptiveQuestions, setAdaptiveQuestions] = useState([])
  const [adaptiveAnswers, setAdaptiveAnswers] = useState({})
  const [adaptiveResult, setAdaptiveResult] = useState(null)
  const [adaptiveLoading, setAdaptiveLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Load total count on mount
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

  function handleAnswer(questionId, letter) {
    setAnswers((prev) => ({ ...prev, [questionId]: letter }))
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
  }

  async function handlePractice() {
    setAdaptiveLoading(true)
    setAdaptiveAnswers({})
    setAdaptiveResult(null)
    try {
      const res = await getAdaptiveQuestions(projectId)
      if (res.data.length === 0) {
        // Not ready yet, poll once more after delay
        await new Promise(r => setTimeout(r, 3000))
        const res2 = await getAdaptiveQuestions(projectId)
        setAdaptiveQuestions(res2.data)
      } else {
        setAdaptiveQuestions(res.data)
      }
      setPhase('adaptive')
    } catch {
      // non-fatal, stay on result page
    } finally {
      setAdaptiveLoading(false)
    }
  }

  function handleAdaptiveAnswer(qId, letter) {
    setAdaptiveAnswers(prev => ({ ...prev, [qId]: letter }))
  }

  function handleAdaptiveSubmit(e) {
    e.preventDefault()
    const scored = adaptiveQuestions.map(q => {
      const given = adaptiveAnswers[q.id] || ''
      return { ...q, given, is_correct: given.toUpperCase() === q.correct_answer.toUpperCase() }
    })
    const correct = scored.filter(q => q.is_correct).length
    setAdaptiveResult({ scored, correct, total: adaptiveQuestions.length })
  }

  if (loading) return (
    <div className="p-6 max-w-2xl mx-auto space-y-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-10 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  )

  if (phase === 'setup') {
    const options = QUICK_OPTIONS.filter((n) => n < totalAvailable)
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Quiz</h1>
          {totalAvailable === 0 ? (
            <p className="text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3 text-sm mt-4">
              No questions available yet. Ask your admin to generate the quiz.
            </p>
          ) : (
            <>
              <p className="text-gray-500 text-sm mb-6">
                {totalAvailable} question{totalAvailable !== 1 ? 's' : ''} available. How many would you like to attempt?
              </p>
              {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
              <div className="space-y-2">
                {options.map((n) => (
                  <button
                    key={n}
                    onClick={() => startQuiz(n)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-700 hover:border-brand-500 hover:bg-brand-50 transition-colors"
                  >
                    {n} random questions
                  </button>
                ))}
                <button
                  onClick={() => startQuiz(totalAvailable)}
                  className="w-full bg-brand-600 text-white rounded-lg px-4 py-3 text-left text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  All {totalAvailable} questions
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'result') {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Quiz Complete</h2>
          <p className="text-4xl font-bold text-brand-600 mt-3">
            {Math.round(result.score * 100)}%
          </p>
          <p className="text-gray-500 mt-1">{result.correct} / {result.total} correct</p>
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={handleRetake} className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200">
              Retake
            </button>
            <button
              onClick={handlePractice}
              disabled={adaptiveLoading}
              className="text-sm bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700 disabled:opacity-50"
            >
              {adaptiveLoading ? 'Loading…' : 'Adaptive Practice'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Practice questions tailored to your performance</p>
        </div>

        <div className="space-y-4">
          {result.results.map((r, i) => (
            <div key={r.question_id} className={`bg-white rounded-lg shadow p-4 border-l-4 ${r.is_correct ? 'border-green-400' : 'border-red-400'}`}>
              <p className="font-medium text-sm text-gray-800">{i + 1}. {r.question_text}</p>
              <p className="text-sm mt-1">
                Your answer: <span className={r.is_correct ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{r.given_answer || '—'}</span>
                {!r.is_correct && (
                  <span className="text-gray-500"> (correct: <span className="text-green-600 font-medium">{r.correct_answer}</span>)</span>
                )}
              </p>
              {r.explanation && (
                <p className="text-xs text-gray-400 mt-1">{r.explanation}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (phase === 'adaptive') {
    const labels = ['A', 'B', 'C', 'D']
    const diffLabel = { harder: 'Challenge', easier: 'Reinforcement', standard: 'Practice' }

    if (adaptiveResult) {
      return (
        <div className="p-6 max-w-2xl mx-auto space-y-4">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-bold text-gray-900">Practice Complete</h2>
            <p className="text-3xl font-bold text-brand-600 mt-2">{adaptiveResult.correct} / {adaptiveResult.total}</p>
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={handleRetake} className="text-sm bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700">
                New Quiz
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {adaptiveResult.scored.map((q, i) => (
              <div key={q.id} className={`bg-white rounded-lg shadow p-4 border-l-4 ${q.is_correct ? 'border-green-400' : 'border-red-400'}`}>
                <p className="font-medium text-sm text-gray-800">{i + 1}. {q.question_text}</p>
                <p className="text-sm mt-1">
                  Your answer: <span className={q.is_correct ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{q.given || '—'}</span>
                  {!q.is_correct && <span className="text-gray-500"> (correct: <span className="text-green-600 font-medium">{q.correct_answer}</span>)</span>}
                </p>
                {q.explanation && <p className="text-xs text-gray-400 mt-1">{q.explanation}</p>}
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (adaptiveQuestions.length === 0) {
      return (
        <div className="p-6 max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-sm text-center">
            Adaptive questions are still being generated. Try again in a moment.
          </div>
          <button onClick={() => setPhase('result')} className="mt-4 text-sm text-brand-600 hover:underline">
            Back to results
          </button>
        </div>
      )
    }

    const difficulty = adaptiveQuestions[0]?.difficulty ?? 'standard'
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Adaptive Practice</h1>
            <p className="text-sm text-gray-500 mt-0.5">{diffLabel[difficulty] || 'Practice'} — {adaptiveQuestions.length} questions tailored to your score</p>
          </div>
          <button onClick={() => setPhase('result')} className="text-xs text-gray-400 hover:underline">Back</button>
        </div>
        <form onSubmit={handleAdaptiveSubmit} className="space-y-6">
          {adaptiveQuestions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-lg shadow p-4">
              <p className="font-medium text-sm text-gray-800 mb-3">{i + 1}. {q.question_text}</p>
              <div className="space-y-2">
                {q.options.map((opt, j) => {
                  const letter = labels[j]
                  const selected = adaptiveAnswers[q.id] === letter
                  return (
                    <label key={letter} className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${selected ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-500 hover:bg-brand-50'}`}>
                      <input type="radio" name={`ap-${q.id}`} value={letter} checked={selected} onChange={() => handleAdaptiveAnswer(q.id, letter)} className="accent-brand-600" />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
          <button type="submit" className="w-full bg-brand-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700">
            Submit Practice
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quiz</h1>
        <span className="text-sm text-gray-500">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, i) => {
          const labels = ['A', 'B', 'C', 'D']
          return (
            <div key={q.id} className="bg-white rounded-lg shadow p-4">
              <p className="font-medium text-sm text-gray-800 mb-3">{i + 1}. {q.question_text}</p>
              <div className="space-y-2">
                {q.options.map((opt, j) => {
                  const letter = labels[j]
                  const selected = answers[q.id] === letter
                  return (
                    <label
                      key={letter}
                      className={`flex items-center gap-3 border rounded-lg p-3 text-left cursor-pointer transition-colors ${
                        selected
                          ? 'border-brand-600 bg-brand-50'
                          : 'border-gray-200 hover:border-brand-500 hover:bg-brand-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={letter}
                        checked={selected}
                        onChange={() => handleAnswer(q.id, letter)}
                        className="accent-brand-600"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Quiz'}
        </button>
      </form>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getQuiz, submitQuiz } from '../../services/quiz'

export default function Quiz() {
  const { projectId } = useParams()
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await getQuiz(projectId)
        setQuestions(res.data)
      } catch (err) {
        setError(err.response?.data?.detail ?? 'Failed to load quiz.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

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
    } catch {
      setError('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleRetake() {
    setResult(null)
    setAnswers({})
  }

  if (loading) return <div className="p-6 text-gray-500">Loading quiz…</div>

  if (result) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Quiz Complete</h2>
          <p className="text-4xl font-bold text-blue-600 mt-3">
            {Math.round(result.score * 100)}%
          </p>
          <p className="text-gray-500 mt-1">{result.correct} / {result.total} correct</p>
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={handleRetake} className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200">
              Retake
            </button>
            <Link to={`/learner/projects/${projectId}/learning-path`} className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Back to Learning Path
            </Link>
          </div>
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

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/learner/projects/${projectId}/learning-path`} className="text-blue-600 text-sm hover:underline">
          ← Learning Path
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Quiz</h1>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {questions.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-sm">
          No questions available yet. Ask your admin to generate the quiz.
        </div>
      ) : (
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
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer border transition-colors ${
                          selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={letter}
                          checked={selected}
                          onChange={() => handleAnswer(q.id, letter)}
                          className="accent-blue-600"
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
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Quiz'}
          </button>
        </form>
      )}
    </div>
  )
}

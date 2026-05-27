import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Topbar from '../../components/shell/Topbar'
import { Progress } from '../../components/ui'
import Icon from '../../icons'

export default function LearnerQuizResult() {
  const { pathId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const result = location.state  // {score, correct, total, results}

  const pct = result ? Math.round(result.score * 100) : null
  const score = pct ?? 0
  const passed = score >= 75

  const correct = result?.results?.filter(r => r.is_correct) ?? []
  const wrong = result?.results?.filter(r => !r.is_correct) ?? []

  return (
    <>
      <Topbar crumbs={['Quiz', 'Results']} />
      <div className="viewport" style={{ background: 'var(--bg)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 28px 64px' }}>
          <div className="card" style={{ padding: 32, textAlign: 'center', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: passed ? 'radial-gradient(circle at 50% 0%, rgba(34,197,94,0.10), transparent 60%)' : 'radial-gradient(circle at 50% 0%, rgba(220,38,38,0.10), transparent 60%)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ width: 64, height: 64, borderRadius: 99, background: passed ? 'var(--success-soft)' : 'var(--danger-soft)', color: passed ? 'var(--success)' : 'var(--danger)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                <Icon name={passed ? 'check' : 'x'} size={32} />
              </div>
              <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{passed ? 'Passed' : 'Not yet'}</div>
              <h1 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.025em', margin: '8px 0 4px', fontVariantNumeric: 'tabular-nums' }}>{score}%</h1>
              {result && (
                <div className="muted" style={{ fontSize: 13 }}>{result.correct} of {result.total} correct</div>
              )}
              <div className="muted" style={{ fontSize: 14, marginTop: 6 }}>{passed ? 'Next module unlocked — great work!' : '75% needed to pass. You can retry up to 3 times.'}</div>
              <div className="row" style={{ marginTop: 24, justifyContent: 'center', gap: 8 }}>
                <button className="btn" onClick={() => navigate(`/v2/learner/paths/${pathId}/quiz`)}>Review answers</button>
                {passed
                  ? <button className="btn primary" onClick={() => navigate(`/v2/learner/paths/${pathId}`)}>Continue <Icon name="arrow" size={14} /></button>
                  : <button className="btn primary" onClick={() => navigate(`/v2/learner/paths/${pathId}/quiz`)}>Retry quiz</button>}
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <div className="card-h"><h3>Correct answers</h3><span className="sub">{correct.length} questions</span></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {correct.length === 0 ? (
                  <div className="muted" style={{ fontSize: 13 }}>No correct answers yet.</div>
                ) : correct.slice(0, 3).map((r, i) => (
                  <div key={i}>
                    <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.question_text}</span>
                      <strong className="num" style={{ marginLeft: 8, flexShrink: 0 }}>✓ {r.correct_answer}</strong>
                    </div>
                    <Progress value={100} tone="success" />
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-h"><h3>Needs review</h3><span className="sub">Atlas suggests revisiting</span></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {wrong.length === 0 ? (
                  <div className="muted" style={{ fontSize: 13 }}>Perfect score — nothing to review!</div>
                ) : wrong.slice(0, 2).map((r, i) => (
                  <div key={i}>
                    <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.question_text}</span>
                      <strong className="num" style={{ marginLeft: 8, flexShrink: 0, color: 'var(--danger)' }}>✗ {r.given_answer || '—'}</strong>
                    </div>
                    <Progress value={0} tone="warning" />
                  </div>
                ))}
                {wrong.length > 0 && (
                  <button className="btn ai sm" style={{ marginTop: 6 }} onClick={() => navigate('/v2/learner/ai-tutor')}>
                    <Icon name="bulb" size={12} /> Ask Atlas for a refresher
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="card ai-grad-bg" style={{ marginTop: 16, borderColor: 'var(--border-ai)' }}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Icon name="sparkle" size={20} style={{ color: 'var(--ai)' }} />
              <div style={{ flex: 1 }}>
                <strong>Atlas explanation</strong>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  {passed
                    ? 'Great job! You demonstrated solid understanding of the material. Keep the momentum going in the next module.'
                    : `You got ${wrong.length} question${wrong.length !== 1 ? 's' : ''} wrong. Review the relevant chapters and try again — Atlas can help clarify any concepts you found difficult.`}
                </div>
              </div>
              <button className="btn ai" onClick={() => navigate('/v2/learner/ai-tutor')}>Ask Atlas</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

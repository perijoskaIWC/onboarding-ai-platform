import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../../components/shell/Topbar'
import { Badge } from '../../components/ui'
import Icon from '../../icons'
import { askTutor } from '../../services/chat'
import { listLearnerDocuments } from '../../services/documents'

const INITIAL_MSGS = [
  {
    from: 'ai',
    text: "Hi! I'm Atlas. I can answer questions about anything across all your onboarding materials. What are you stuck on?",
    suggestions: [
      'Summarize the key things I need to know',
      'Explain a concept in simple terms',
      'What should I study before my quiz?',
      'Give me a real-world example',
    ],
  },
]

export default function LearnerAITutor() {
  const navigate = useNavigate()
  const [msgs, setMsgs] = useState(INITIAL_MSGS)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [docs, setDocs] = useState([])
  const bottomRef = useRef()

  // --- Per-learning-path scoping shelved for now: the tutor is global. ---
  // const [projectId, setProjectId] = useState(null)
  // const [projects, setProjects] = useState([])
  // useEffect(() => { listLearnerProjects().then(...).catch(()=>{}) }, [])

  useEffect(() => {
    listLearnerDocuments().then(d => setDocs(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const send = async (text) => {
    const t = text ?? input
    if (!t.trim() || sending) return
    setMsgs(prev => [...prev, { from: 'user', text: t }])
    setInput('')
    setSending(true)
    try {
      const data = await askTutor(t)
      setMsgs(prev => [...prev, {
        from: 'ai',
        text: data.answer ?? data.response ?? data.message ?? 'I received your question. Let me help you with that.',
        cites: data.sources ?? [],
      }])
    } catch {
      setMsgs(prev => [...prev, {
        from: 'ai',
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        cites: [],
      }])
    } finally {
      setSending(false)
    }
  }

  const handleNewChat = () => { setMsgs(INITIAL_MSGS); setInput('') }

  return (
    <>
      <Topbar crumbs={['AI Tutor']} actions={
        <button className="btn" onClick={handleNewChat}><Icon name="refresh" size={14} /> New chat</button>
      } />
      <div className="viewport ai-tint" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', overflow: 'hidden', height: 'calc(100vh - var(--topbar-h))' }}>

        {/* Chat pane */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white' }}>
          <div className="row" style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--ai), #4F46E5)', color: 'white', display: 'grid', placeItems: 'center' }}>
              <Icon name="sparkle" size={16} />
            </div>
            <div>
              <strong style={{ fontSize: 14 }}>Atlas</strong>
              <div className="muted" style={{ fontSize: 11 }}>Tutoring across all your onboarding materials</div>
            </div>
            <Badge tone="success" dot style={{ marginLeft: 'auto' }}>Sourced from your materials</Badge>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
            <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {msgs.map((m, i) => (
                <div key={i}>
                  <div className={'bubble ' + m.from}>
                    {m.from === 'ai' && <div className="ai-meta"><Icon name="sparkle" size={11} /> Atlas</div>}
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                    {m.cites && m.cites.length > 0 && (
                      <div className="citations">
                        {m.cites.map((c, ci) => {
                          const label = typeof c === 'string' ? c : (c.filename ?? c.title ?? c.name ?? 'Source')
                          const docId = typeof c === 'object' ? c.document_id : null
                          return (
                            <span
                              key={ci}
                              className="citation"
                              style={docId ? { cursor: 'pointer' } : undefined}
                              title={typeof c === 'object' && c.project_name ? c.project_name : undefined}
                              onClick={() => docId && navigate(`/v2/learner/documents?doc=${docId}`)}
                            >
                              <Icon name="doc" size={10} /> {label}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  {m.suggestions && (
                    <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {m.suggestions.map(s => (
                        <button key={s} className="card" style={{ padding: 12, textAlign: 'left', cursor: 'pointer', border: '1px solid var(--border-ai)' }} onClick={() => send(s)}>
                          <div className="row" style={{ gap: 8, color: 'var(--ai)' }}>
                            <Icon name="sparkle" size={13} />
                            <span style={{ fontSize: 12.5, fontWeight: 500 }}>{s}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div className="bubble ai">
                  <div className="ai-meta"><Icon name="sparkle" size={11} /> Atlas</div>
                  <div className="muted">Thinking…</div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <div style={{ padding: '16px 24px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ maxWidth: 720, margin: '0 auto', border: '1.5px solid var(--border-strong)', borderRadius: 14, padding: 12, background: 'var(--surface)' }}>
              <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Ask Atlas about any of your onboarding materials…"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                style={{ width: '100%', border: 0, outline: 0, resize: 'none', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: 14, minHeight: 50, padding: 0 }} />
              <div className="row" style={{ marginTop: 6 }}>
                <span className="muted" style={{ fontSize: 11 }}>Atlas only answers from your indexed materials</span>
                <button className="btn ai sm" style={{ marginLeft: 'auto' }} onClick={() => send()} disabled={sending}>
                  <Icon name="send" size={12} /> {sending ? 'Sending…' : 'Ask'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ borderLeft: '1px solid var(--border)', padding: 20, overflow: 'auto' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 10 }}>Suggested questions</div>
          <div className="col" style={{ gap: 6 }}>
            {['Explain this concept in simple terms', 'Give me a real-world example', 'What should I know before the quiz?'].map(t => (
              <button key={t} style={{ textAlign: 'left', padding: 10, background: 'var(--surface)', border: '1px solid var(--border-ai)', borderRadius: 8, fontSize: 12.5, cursor: 'pointer' }} onClick={() => send(t)}>
                <Icon name="sparkle" size={11} style={{ color: 'var(--ai)', marginRight: 6 }} />{t}
              </button>
            ))}
          </div>

          <div className="sep" style={{ margin: '16px 0' }} />

          <div className="row" style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Your documents</span>
            {docs.length > 0 && (
              <button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={() => navigate('/v2/learner/documents')}>
                View all
              </button>
            )}
          </div>
          <div className="col" style={{ gap: 6 }}>
            {docs.length === 0 ? (
              <div className="muted" style={{ fontSize: 12.5 }}>No documents available yet.</div>
            ) : docs.slice(0, 8).map(d => (
              <button key={d.id} title={d.project_name}
                style={{ textAlign: 'left', padding: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12.5, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}
                onClick={() => navigate(`/v2/learner/documents?doc=${d.id}`)}>
                <Icon name="doc" size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.filename}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

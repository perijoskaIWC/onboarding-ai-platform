import { useState, useRef, useEffect } from 'react'
import Topbar from '../../components/shell/Topbar'
import { Badge, FileIcon } from '../../components/ui'
import Icon from '../../icons'
import { sendMessage } from '../../services/chat'
import { listLearnerProjects } from '../../services/projects'

const INITIAL_MSGS = [
  {
    from: 'ai',
    text: "Hi! I'm Atlas. I can answer questions about anything in your onboarding materials. What are you stuck on?",
    suggestions: [
      'Explain the platform architecture',
      'Summarize the key concepts',
      'How does authentication work?',
      'Quiz me on what I learned',
    ],
  },
]

const PREV_CHATS = [
  'How does SSO work?',
  'What are the main service patterns?',
  'Explain deployment pipelines',
]

export default function LearnerAITutor() {
  const [msgs, setMsgs] = useState(INITIAL_MSGS)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [projectId, setProjectId] = useState(null)
  const [projects, setProjects] = useState([])
  const bottomRef = useRef()

  useEffect(() => {
    listLearnerProjects()
      .then(data => {
        const list = Array.isArray(data) ? data : (data.projects ?? [])
        setProjects(list)
        if (list.length > 0) setProjectId(list[0].id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const send = async (text) => {
    const t = text ?? input
    if (!t.trim() || sending) return
    const userMsg = { from: 'user', text: t }
    setMsgs(prev => [...prev, userMsg])
    setInput('')
    setSending(true)
    try {
      const data = await sendMessage(projectId, t)
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

  const handleNewChat = () => {
    setMsgs(INITIAL_MSGS)
    setInput('')
  }

  return (
    <>
      <Topbar crumbs={['AI Tutor']} actions={
        <>
          {projects.length > 1 && (
            <select className="select" value={projectId ?? ''} onChange={e => setProjectId(e.target.value)} style={{ fontSize: 13, height: 32 }}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <button className="btn" onClick={handleNewChat}><Icon name="refresh" size={14} /> New chat</button>
        </>
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
              <div className="muted" style={{ fontSize: 11 }}>Tutoring based on your onboarding materials</div>
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
                        {m.cites.map((c, ci) => (
                          <span key={ci} className="citation">{typeof c === 'string' ? c : c.title ?? c.name ?? 'Source'}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {m.followups && (
                    <div className="row" style={{ gap: 6, flexWrap: 'wrap', paddingLeft: 8, marginTop: 8 }}>
                      {m.followups.map(f => (
                        <button key={f} className="chip" onClick={() => send(f)}>
                          <Icon name="arrow" size={10} /> {f}
                        </button>
                      ))}
                    </div>
                  )}
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
              <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Ask Atlas about your onboarding materials…"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                style={{ width: '100%', border: 0, outline: 0, resize: 'none', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: 14, minHeight: 50, padding: 0 }} />
              <div className="row" style={{ marginTop: 6 }}>
                <span className="muted" style={{ fontSize: 11 }}>Atlas only answers from indexed materials</span>
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
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 10 }}>Previous chats</div>
          <div className="col" style={{ gap: 6 }}>
            {PREV_CHATS.map(t => (
              <button key={t} style={{ textAlign: 'left', padding: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12.5, cursor: 'pointer' }}>{t}</button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

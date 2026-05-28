import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { marked } from 'marked'
import Topbar from '../../components/shell/Topbar'
import { Badge, FileIcon } from '../../components/ui'
import Icon from '../../icons'
import { getProject } from '../../services/projects'
import { listProjectDocuments } from '../../services/documents'
import { getAdminLearningPath, generateLearningPath, pathDesignerChat } from '../../services/learningPath'
import { updateProject } from '../../services/projects'

marked.setOptions({ breaks: true, gfm: true })

const SUGGESTIONS = [
  'What topics does the current path cover?',
  'Cut the path to 3 weeks',
  'Add more security and compliance topics',
  'Make it more beginner-friendly',
]

function ConfigRow({ label, value }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', fontSize: 12 }}>
      <span className="muted">{label}</span>
      <strong style={{ fontSize: 12 }}>{value}</strong>
    </div>
  )
}

export default function AdminPathChat() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const managePathName = searchParams.get('path_name') // set when coming from "Manage" — absent for "New path"
  const [project, setProject] = useState(null)
  const [docs, setDocs] = useState([])
  const [selectedDocIds, setSelectedDocIds] = useState(new Set())
  const [path, setPath] = useState(null)
  const [pathName, setPathName] = useState('')
  const [quizPool, setQuizPool] = useState('')
  const [quizAttempt, setQuizAttempt] = useState('')
  const [savingQuiz, setSavingQuiz] = useState(false)
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)   // waiting for AI reply
  const [generating, setGenerating] = useState(false)     // background path generation
  const bottomRef = useRef()
  const pollRef = useRef(null)
  // history kept in parallel with msgs for the API (role/content format)
  const historyRef = useRef([])

  useEffect(() => {
    if (!projectId) return
    getProject(projectId).then(p => {
      setProject(p)
      setQuizPool(p.quiz_length ?? 10)
      setQuizAttempt(p.quiz_attempt_size ?? '')
    }).catch(() => {})
    listProjectDocuments(projectId).then(data => {
      setDocs(data)
      setSelectedDocIds(new Set(data.map(d => d.id)))
    }).catch(() => {})
    if (managePathName) {
      // "Manage" flow — load the specific named path
      getAdminLearningPath(projectId, null, managePathName)
        .then(p => {
          setPath(p)
          setPathName(p.path_name ?? managePathName)
          const greeting = `I've loaded "${p.path_name}" — ${p.modules?.length ?? 0} modules. Ask me anything about it, or tell me how to change it.`
          setMsgs([{ from: 'ai', text: greeting }])
        })
        .catch(() => {
          setMsgs([{ from: 'ai', text: `Couldn't load path "${managePathName}". It may have been deleted.` }])
        })
    } else {
      // "New path" flow — start blank
      setMsgs([{ from: 'ai', text: 'No learning path yet. Give it a name, then tell me what to generate — or just click Generate.' }])
    }
  }, [projectId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  useEffect(() => () => clearInterval(pollRef.current), [])

  const appendMsg = (msg) => setMsgs(prev => [...prev, msg])
  const replaceLoading = (msg) =>
    setMsgs(prev => [...prev.filter(m => !m._loading), msg])

  const pollForNewPath = (prevGeneratedAt) => {
    let attempts = 0
    const MAX = 40
    pollRef.current = setInterval(async () => {
      attempts++
      try {
        const newPath = await getAdminLearningPath(projectId)
        const changed = newPath.generated_at !== prevGeneratedAt
        if (changed || attempts >= MAX) {
          clearInterval(pollRef.current)
          setGenerating(false)
          if (changed) {
            setPath(newPath)
            replaceLoading({
              from: 'ai',
              text: `Done! The path has been rebuilt — ${newPath.modules?.length ?? 0} modules. Review the preview on the right and accept when ready.`,
            })
          } else {
            replaceLoading({ from: 'ai', text: 'Generation is taking longer than expected. Try refreshing the page.' })
          }
        }
      } catch {
        // keep polling
      }
    }, 3000)
  }

  const triggerGeneration = async (instruction, durationWeeks, prevGeneratedAt, docIds) => {
    setGenerating(true)
    try {
      await generateLearningPath(projectId, instruction, durationWeeks, docIds, pathName.trim() || 'Standard')
      pollForNewPath(prevGeneratedAt)
    } catch {
      setGenerating(false)
      replaceLoading({ from: 'ai', text: 'Generation failed. Make sure documents are uploaded and indexed, then try again.' })
    }
  }

  const send = async (text) => {
    const t = (text ?? input).trim()
    if (!t || chatLoading || generating) return
    if (selectedDocIds.size === 0) {
      appendMsg({ from: 'ai', text: 'No documents are selected. Please select at least one source document from the left panel before generating a path.' })
      return
    }
    setInput('')

    // Add user message
    appendMsg({ from: 'user', text: t })
    // Add AI typing indicator
    appendMsg({ from: 'ai', text: '', _loading: true })
    setChatLoading(true)

    // Build history for the API (exclude the loading bubble)
    const history = historyRef.current

    try {
      const result = await pathDesignerChat(projectId, t, history, [...selectedDocIds], pathName.trim() || null)

      // Update history with this exchange
      historyRef.current = [
        ...history,
        { role: 'user', content: t },
        { role: 'assistant', content: result.reply },
      ]

      if (result.action === 'regenerate') {
        // Show AI reply first, then start generation
        const prevGeneratedAt = path?.generated_at ?? null
        replaceLoading({
          from: 'ai',
          text: result.reply,
        })
        setChatLoading(false)
        // Show "working" bubble
        appendMsg({ from: 'ai', text: 'Rebuilding the path now — this takes about 30–60 seconds…', _loading: true })
        await triggerGeneration(result.instruction || t, result.duration_weeks, prevGeneratedAt, [...selectedDocIds])
      } else {
        replaceLoading({ from: 'ai', text: result.reply })
        setChatLoading(false)
      }
    } catch {
      replaceLoading({ from: 'ai', text: 'Something went wrong. Please try again.' })
      setChatLoading(false)
    }
  }

  const handleGenerate = () => {
    const docIds = [...selectedDocIds]
    const t = docIds.length > 0
      ? `Generate a structured learning path using only the selected ${docIds.length} document(s).`
      : 'Generate a structured learning path from the assigned documents.'
    send(t)
  }

  const saveQuizConfig = async () => {
    setSavingQuiz(true)
    try {
      const payload = { quiz_length: Number(quizPool) || 10 }
      payload.quiz_attempt_size = quizAttempt !== '' ? Number(quizAttempt) : null
      const updated = await updateProject(projectId, payload)
      setProject(p => ({ ...p, ...updated }))
    } finally {
      setSavingQuiz(false)
    }
  }

  const busy = chatLoading || generating

  return (
    <>
      <Topbar crumbs={['Projects', project?.name ?? '…', 'Path designer']} search={false} actions={
        <>
          {!path && (
            <button className="btn primary" onClick={handleGenerate} disabled={busy}>
              {generating ? <><Icon name="refresh" size={14} /> Generating…</> : <><Icon name="sparkle" size={14} /> Generate path</>}
            </button>
          )}
          {path && (
            <button className="btn primary" onClick={() => navigate(`/v2/admin/projects/${projectId}/paths/preview`)}>
              Preview path <Icon name="arrow" size={14} />
            </button>
          )}
        </>
      } />
      <div className="viewport" style={{ display: 'grid', gridTemplateColumns: '260px 1fr 360px', overflow: 'hidden', height: 'calc(100vh - var(--topbar-h))' }}>

        {/* Left: docs + config */}
        <div style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 14px 8px' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 13 }}>Source documents</strong>
              <span className="badge accent num">{docs.length}</span>
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>Assigned to {project?.name ?? '…'}</div>
          </div>
          <div style={{ padding: '0 14px 8px' }}>
            <div className="topbar-search"><Icon name="search" size={14} /><input placeholder="Filter…" /></div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 8px' }}>
            {docs.length === 0 ? (
              <div className="muted" style={{ fontSize: 12, padding: '8px 8px', textAlign: 'center' }}>No documents assigned yet.</div>
            ) : (
              <>
                <div className="row" style={{ padding: '0 8px 6px', gap: 6 }}>
                  <button className="chip" style={{ fontSize: 11 }} onClick={() => { setSelectedDocIds(new Set(docs.map(d => d.id))); historyRef.current = []; setMsgs([{ from: 'ai', text: 'Document selection updated. Ask me anything.' }]) }}>All</button>
                  <button className="chip" style={{ fontSize: 11 }} onClick={() => { setSelectedDocIds(new Set()); historyRef.current = [] }}>None</button>
                  <span className="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{selectedDocIds.size}/{docs.length} selected</span>
                </div>
                {docs.map(d => {
                  const checked = selectedDocIds.has(d.id)
                  const toggle = () => {
                    const s = new Set(selectedDocIds)
                    checked ? s.delete(d.id) : s.add(d.id)
                    setSelectedDocIds(s)
                    historyRef.current = []
                  }
                  return (
                    <label key={d.id} className="row" style={{ padding: '6px 8px', borderRadius: 6, cursor: 'pointer', gap: 8, opacity: checked ? 1 : 0.45 }}>
                      <input type="checkbox" checked={checked} onChange={toggle} />
                      <FileIcon type={(d.filename ?? d.file_name)?.split('.').pop() ?? 'doc'} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.filename ?? d.file_name ?? d.name}</div>
                        <div className="muted" style={{ fontSize: 10.5 }}>{d.file_size ? `${Math.round(d.file_size / 1024)} KB` : ''}</div>
                      </div>
                    </label>
                  )
                })}
              </>
            )}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 600 }}>New path</div>
            <div className="col" style={{ gap: 8 }}>
              <div>
                <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Path name</div>
                <input
                  className="input"
                  style={{ fontSize: 12, padding: '5px 8px', width: '100%' }}
                  placeholder="e.g. Junior Track"
                  value={pathName}
                  onChange={e => setPathName(e.target.value)}
                />
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '12px 0 10px', fontWeight: 600 }}>Quiz settings</div>
            <div className="col" style={{ gap: 8 }}>
              <div>
                <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Questions to generate</div>
                <input
                  className="input"
                  type="number"
                  min="1"
                  style={{ fontSize: 12, padding: '5px 8px', width: '100%' }}
                  placeholder="e.g. 20"
                  value={quizPool}
                  onChange={e => setQuizPool(e.target.value)}
                />
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>
                  Learner gets (random per attempt)
                </div>
                <input
                  className="input"
                  type="number"
                  min="1"
                  style={{ fontSize: 12, padding: '5px 8px', width: '100%' }}
                  placeholder={`max ${quizPool || '?'} (leave blank = all)`}
                  value={quizAttempt}
                  onChange={e => setQuizAttempt(e.target.value)}
                />
                {quizAttempt && Number(quizAttempt) < Number(quizPool) && (
                  <div style={{ fontSize: 10.5, color: 'var(--ai)', marginTop: 3 }}>
                    Learner gets {quizAttempt} random of {quizPool} — different every attempt
                  </div>
                )}
              </div>
              <button
                className="btn primary sm"
                style={{ width: '100%', marginTop: 2 }}
                onClick={saveQuizConfig}
                disabled={savingQuiz}
              >
                {savingQuiz ? 'Saving…' : 'Save quiz settings'}
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '12px 0 10px', fontWeight: 600 }}>Path settings</div>
            <div className="col" style={{ gap: 10 }}>
              <ConfigRow label="Duration" value={`${project?.duration_weeks ?? 4} weeks`} />
              <ConfigRow label="Chunk size" value={project?.chunk_size ?? 500} />
            </div>
          </div>
        </div>

        {/* Center: chat */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
          <div className="row" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', gap: 8 }}>
            <Icon name="sparkle" size={16} style={{ color: 'var(--ai)' }} />
            <strong style={{ fontSize: 14 }}>Atlas path designer</strong>
            <Badge tone="ai">Beta</Badge>
            {chatLoading && !generating && <Badge tone="ai" dot>Thinking…</Badge>}
            {generating && <Badge tone="warning" dot>Generating path…</Badge>}
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '18px 18px 8px' }}>
            <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {msgs.map((m, i) => (
                <div key={i} className={'bubble ' + m.from}>
                  {m.from === 'ai' && (
                    <div className="ai-meta">
                      <Icon name="sparkle" size={11} /> Atlas
                    </div>
                  )}
                  {m._loading && !m.text
                    ? <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
                        {[0, 1, 2].map(d => (
                          <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-3)', display: 'inline-block', animation: `bounce 1.2s ${d * 0.2}s infinite` }} />
                        ))}
                      </div>
                    : m.from === 'ai'
                      ? <div className="md-body" dangerouslySetInnerHTML={{ __html: marked.parse(m.text || '') }} />
                      : <div>{m.text}</div>
                  }
                </div>
              ))}
              {!busy && msgs.length > 0 && (
                <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} className="chip" onClick={() => send(s)}>
                      <Icon name="sparkle" size={11} /> {s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
          <div style={{ padding: 18, borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ maxWidth: 720, margin: '0 auto', border: '1px solid var(--border-strong)', borderRadius: 12, background: 'var(--surface)', padding: 10 }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={generating ? 'Generating path in background…' : chatLoading ? 'Atlas is thinking…' : 'Ask anything or describe a change…'}
                disabled={busy}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                style={{ width: '100%', border: 0, outline: 0, resize: 'none', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: 13.5, minHeight: 60, padding: 0, opacity: busy ? 0.5 : 1 }}
              />
              <div className="row" style={{ marginTop: 6 }}>
                <Badge tone="outline">claude-sonnet-4.6</Badge>
                <button className="btn primary sm" style={{ marginLeft: 'auto' }} onClick={() => send()} disabled={busy}>
                  <Icon name="send" size={12} /> {chatLoading ? 'Thinking…' : generating ? 'Generating…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: preview */}
        <div style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="row" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <strong style={{ fontSize: 13 }}>Path preview</strong>
            <Badge tone={path?.is_published ? 'success' : 'warning'} style={{ marginLeft: 8 }}>
              {path?.is_published ? 'Published' : 'Draft'}
            </Badge>
            <button className="icon-btn" style={{ marginLeft: 'auto' }} title="Expand"
              onClick={() => navigate(`/v2/admin/projects/${projectId}/paths/preview`)}>
              <Icon name="expand" size={14} />
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {generating && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10 }} />
                ))}
              </div>
            )}
            {!generating && !path && (
              <div className="muted" style={{ fontSize: 13, textAlign: 'center', padding: 24 }}>
                Generate a path to see the preview here.
              </div>
            )}
            {path && (path.modules ?? []).map((m, i) => {
              const allSameWeek = path.modules.every(x => x.week_number === path.modules[0].week_number)
              const week = allSameWeek ? i + 1 : (m.week_number ?? i + 1)
              const concepts = m.key_concepts ? m.key_concepts.split(',').map(s => s.trim()).filter(Boolean) : []
              return (
                <div key={m.id ?? i} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, opacity: generating ? 0.5 : 1, transition: 'opacity 0.3s' }}>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="badge accent">Week {week}</span>
                    <span className="muted" style={{ fontSize: 11 }}>{m.chunks?.length ?? 0} sections</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{m.title}</div>
                  {m.summary && (
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>
                      {m.summary.slice(0, 90)}{m.summary.length > 90 ? '…' : ''}
                    </div>
                  )}
                  {concepts.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      {concepts.slice(0, 3).map(c => (
                        <span key={c} style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 99, background: 'var(--accent-soft)', color: 'var(--accent)' }}>{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        .md-body { font-size: 13.5px; line-height: 1.6; }
        .md-body h1, .md-body h2, .md-body h3 { font-size: 13.5px; font-weight: 600; margin: 10px 0 4px; }
        .md-body ul, .md-body ol { padding-left: 18px; margin: 4px 0; }
        .md-body li { margin: 2px 0; }
        .md-body p { margin: 4px 0; }
        .md-body strong { font-weight: 600; }
        .md-body code { background: var(--surface-2); padding: 1px 5px; border-radius: 4px; font-size: 12px; }
      `}</style>
    </>
  )
}

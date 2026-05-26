import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { sendMessage, orchestrateMessage } from '../../services/chat'

const AGENTS = {
  tutor:        { label: 'AI Tutor',      color: 'text-indigo-600', bg: 'bg-indigo-100', dot: 'bg-indigo-500' },
  quiz_advisor: { label: 'Quiz Advisor',  color: 'text-violet-600', bg: 'bg-violet-100', dot: 'bg-violet-500' },
  path_advisor: { label: 'Path Advisor',  color: 'text-emerald-600', bg: 'bg-emerald-100', dot: 'bg-emerald-500' },
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-slate-300 inline-block"
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function AgentAvatar({ agent }) {
  const meta = AGENTS[agent] ?? AGENTS.tutor
  return (
    <div className={`w-7 h-7 rounded-full ${meta.bg} flex items-center justify-center shrink-0`}>
      <div className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  const agent = AGENTS[msg.agent]

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed whitespace-pre-wrap shadow-sm">
          {msg.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2.5">
      <AgentAvatar agent={msg.agent} />
      <div className="max-w-[75%]">
        {msg.agent_label && (
          <p className={`text-xs font-semibold mb-1 ml-1 ${agent?.color ?? 'text-slate-500'}`}>
            {msg.agent_label}
          </p>
        )}
        <div className="bg-white border border-slate-100 text-slate-800 px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed whitespace-pre-wrap shadow-sm">
          {msg.content}
          {msg.sources && msg.sources.length > 0 && (
            <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">
              {msg.sources.length} source chunk{msg.sources.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Chat() {
  const { projectId } = useParams()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [orchestrated, setOrchestrated] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(e) {
    e.preventDefault()
    const question = input.trim()
    if (!question || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setLoading(true)

    try {
      const res = orchestrated
        ? await orchestrateMessage(projectId, question)
        : await sendMessage(projectId, question)

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.answer,
          sources: res.data.sources,
          agent: res.data.agent ?? 'tutor',
          agent_label: res.data.agent_label,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', sources: [], agent: 'tutor' },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function toggleMode() {
    setOrchestrated((v) => !v)
    setMessages([])
  }

  return (
    <div className="flex flex-col h-full max-h-screen bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900">{orchestrated ? 'Smart Mode' : 'AI Tutor'}</h1>
            <p className="text-xs text-slate-400">
              {orchestrated ? 'Routes to the best specialist' : 'Ask about your onboarding material'}
            </p>
          </div>
        </div>

        <button
          onClick={toggleMode}
          title="Smart Mode routes your message to the best specialist agent"
          className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full border font-medium transition-all ${
            orchestrated
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
          }`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Smart Mode
        </button>
      </div>

      {/* Agent legend (smart mode only) */}
      {orchestrated && (
        <div className="flex items-center gap-4 px-6 py-2 bg-indigo-50 border-b border-indigo-100 shrink-0">
          <span className="text-xs text-slate-400">Specialists:</span>
          {Object.entries(AGENTS).map(([key, a]) => (
            <span key={key} className={`flex items-center gap-1.5 text-xs font-medium ${a.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
              {a.label}
            </span>
          ))}
        </div>
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-16 select-none">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">
              {orchestrated ? 'Ask anything — Smart Mode picks the right expert.' : 'Ask anything about your onboarding material.'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Your questions are answered using your project documents.</p>
          </div>
        )}

        {messages.map((msg, i) => <Message key={i} msg={msg} />)}

        {loading && (
          <div className="flex items-end gap-2.5">
            <AgentAvatar agent="tutor" />
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm shadow-sm">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-6 pb-6 pt-3 bg-slate-50">
        <form onSubmit={handleSend} className="flex items-end gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm focus-within:border-indigo-300 focus-within:shadow-indigo-50 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) }
            }}
            placeholder={orchestrated ? 'Ask anything — tutor, quiz, or path…' : 'Ask a question…'}
            disabled={loading}
            rows={1}
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 bg-transparent resize-none focus:outline-none leading-relaxed"
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
        <p className="text-xs text-slate-400 text-center mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}

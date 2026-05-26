import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { sendMessage, orchestrateMessage } from '../../services/chat'

const AGENT_COLORS = {
  tutor: 'text-brand-600',
  quiz_advisor: 'text-purple-600',
  path_advisor: 'text-green-600',
}

export default function Chat() {
  const { projectId } = useParams()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [orchestrated, setOrchestrated] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
          agent: res.data.agent,
          agent_label: res.data.agent_label,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', sources: [] },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">AI Tutor</h1>
        <button
          onClick={() => { setOrchestrated((v) => !v); setMessages([]) }}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
            orchestrated
              ? 'bg-brand-600 text-white border-brand-600'
              : 'bg-white text-gray-500 border-gray-300 hover:border-brand-400 hover:text-brand-600'
          }`}
          title="Smart mode routes your message to the best specialist agent"
        >
          <span>{orchestrated ? '✦' : '○'}</span>
          Smart Mode
        </button>
      </div>

      {orchestrated && (
        <div className="px-4 py-2 bg-brand-50 border-b border-brand-100 text-xs text-brand-700 flex gap-3">
          <span>Routes to: <span className="text-brand-600 font-medium">AI Tutor</span></span>
          <span>·</span>
          <span className="text-purple-600 font-medium">Quiz Advisor</span>
          <span>·</span>
          <span className="text-green-600 font-medium">Path Advisor</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-12 text-sm">
            {orchestrated
              ? 'Ask anything — Smart Mode routes your question to the right specialist.'
              : 'Ask anything about your onboarding material.'}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xl px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 shadow rounded-bl-none'
              }`}
            >
              {msg.agent_label && (
                <p className={`text-xs font-medium mb-1 ${AGENT_COLORS[msg.agent] ?? 'text-gray-500'}`}>
                  {msg.agent_label}
                </p>
              )}
              {msg.content}
              {msg.sources && msg.sources.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Sources: {msg.sources.length} chunk{msg.sources.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white shadow rounded-2xl rounded-bl-none px-4 py-2.5 text-sm text-gray-400">
              {orchestrated ? 'Routing to best agent…' : 'Thinking…'}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 py-3 bg-white border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={orchestrated ? 'Ask anything — tutor, quiz, or path…' : 'Ask a question…'}
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-brand-600 text-white px-4 py-2 rounded-full text-sm hover:bg-brand-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}

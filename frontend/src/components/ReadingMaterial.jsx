import { useState } from 'react'

function FormattedText({ text }) {
  const paragraphs = text.split(/\n{2,}/)
  return (
    <div className="space-y-3">
      {paragraphs.map((para, pi) => {
        const lines = para.split('\n').filter((l) => l.trim())
        const allBullets = lines.every((l) => /^\s*[-*]\s/.test(l))
        if (allBullets) {
          return (
            <ul key={pi} className="list-disc list-inside space-y-1">
              {lines.map((l, li) => (
                <li key={li} className="text-slate-700">{l.replace(/^\s*[-*]\s*/, '')}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={pi} className="text-slate-700 leading-relaxed">
            {lines.join(' ')}
          </p>
        )
      })}
    </div>
  )
}

export default function ReadingMaterial({ chunks = [] }) {
  const [open, setOpen] = useState(false)

  if (!chunks.length) return null

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {open ? 'Hide' : 'Read'} material · {chunks.length} {chunks.length === 1 ? 'section' : 'sections'}
      </button>

      {open && (
        <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/40 divide-y divide-indigo-100 max-h-96 overflow-y-auto">
          {chunks.map((chunk) => (
            <div key={chunk.id} className="px-4 py-3 text-sm">
              <FormattedText text={chunk.content} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

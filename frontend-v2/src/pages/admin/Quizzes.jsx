import { useState, useEffect } from 'react'
import Topbar from '../../components/shell/Topbar'
import { Badge } from '../../components/ui'
import Icon from '../../icons'
import { listQuestions, publishQuestion, updateQuestion, deleteQuestion } from '../../services/quiz'
import { listAdminProjects } from '../../services/projects'

export default function AdminQuizzes() {
  const [tab, setTab] = useState('pending')
  const [questions, setQuestions] = useState([])
  const [open, setOpen] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState(null)

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const projects = await listAdminProjects()
      const results = await Promise.all(
        projects.map(p =>
          listQuestions(p.id)
            .then(qs => qs.map(q => ({ ...q, project_id: p.id, project_name: p.name })))
            .catch(() => [])
        )
      )
      setQuestions(results.flat())
    } finally {
      setLoading(false)
    }
  }

  const pending = questions.filter(q => !q.is_published)
  const approved = questions.filter(q => q.is_published)

  const filtered = tab === 'pending' ? pending : approved
  const current = filtered[open]

  useEffect(() => {
    if (current) {
      const opts = [
        current.option_a ?? '',
        current.option_b ?? '',
        current.option_c ?? '',
        current.option_d ?? '',
      ]
      const letterMap = { A: 0, B: 1, C: 2, D: 3 }
      const correctIdx = letterMap[current.correct_answer?.toUpperCase()] ?? 0
      setEditForm({
        question_text: current.question_text,
        options: opts,
        correct_answer: opts[correctIdx],
        correct_answer_letter: current.correct_answer?.toUpperCase() ?? 'A',
        explanation: current.explanation ?? '',
        difficulty: current.difficulty ?? 'Core',
      })
    }
  }, [open, tab, questions])

  const handlePublish = async (q) => {
    setSaving(true)
    try {
      await publishQuestion(q.project_id, q.id, !q.is_published)
      setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, is_published: !x.is_published } : x))
      setOpen(0)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!current || !editForm) return
    setSaving(true)
    try {
      const payload = {
        question_text: editForm.question_text,
        option_a: editForm.options[0] ?? '',
        option_b: editForm.options[1] ?? '',
        option_c: editForm.options[2] ?? '',
        option_d: editForm.options[3] ?? '',
        correct_answer: editForm.correct_answer_letter ?? 'A',
        explanation: editForm.explanation,
      }
      const updated = await updateQuestion(current.project_id, current.id, payload)
      setQuestions(prev => prev.map(x => x.id === current.id ? { ...x, ...updated } : x))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (q) => {
    if (!confirm('Delete this question?')) return
    await deleteQuestion(q.project_id, q.id)
    setQuestions(prev => prev.filter(x => x.id !== q.id))
    setOpen(0)
  }

  return (
    <>
      <Topbar crumbs={['Workspace', 'Quizzes']} actions={
        <>
          <button className="btn"><Icon name="cog" size={14} /> Quiz policy</button>
        </>
      } />
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>Quiz management</h1>
            <div className="sub">Review AI-generated questions, tune difficulty, and publish for use across paths.</div>
          </div>
        </div>
        <div className="page-tabs">
          <button className={'page-tab ' + (tab === 'pending' ? 'active' : '')} onClick={() => { setTab('pending'); setOpen(0) }}>
            Pending review <span className="badge" style={{ marginLeft: 4 }}>{pending.length}</span>
          </button>
          <button className={'page-tab ' + (tab === 'approved' ? 'active' : '')} onClick={() => { setTab('approved'); setOpen(0) }}>
            Published <span className="badge" style={{ marginLeft: 4 }}>{approved.length}</span>
          </button>
        </div>

        <div className="page-body">
          {loading ? (
            <div className="card"><div className="card-body"><div className="skeleton" style={{ height: 200 }} /></div></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 16, alignItems: 'flex-start' }}>
              <div className="card flush">
                {filtered.length === 0 ? (
                  <div className="empty">
                    <div className="illu"><Icon name="check" /></div>
                    <h3>All caught up</h3>
                    <p>No questions waiting in this bucket.</p>
                  </div>
                ) : filtered.map((q, i) => (
                  <div key={q.id} onClick={() => setOpen(i)} style={{ padding: 16, borderBottom: '1px solid var(--border)', cursor: 'pointer', background: open === i ? 'var(--accent-soft)' : '' }}>
                    <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                      <Badge tone="outline">{q.difficulty ?? 'Core'}</Badge>
                      <span className="muted mono" style={{ fontSize: 11, marginLeft: 'auto' }}>Q{i + 1}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{q.question_text}</div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{q.options?.length ?? 4} options · explanation {q.explanation ? 'included' : 'missing'}</div>
                  </div>
                ))}
              </div>

              {current && editForm && (
                <div className="card" style={{ position: 'sticky', top: 0 }}>
                  <div className="card-h">
                    <h3>Question editor</h3>
                    <span className="sub">#{open + 1} of {filtered.length}</span>
                    <div className="actions">
                      <button className="icon-btn" disabled={open === 0} onClick={() => setOpen(o => o - 1)}><Icon name="chevronLeft" size={14} /></button>
                      <button className="icon-btn" disabled={open === filtered.length - 1} onClick={() => setOpen(o => o + 1)}><Icon name="chevronRight" size={14} /></button>
                    </div>
                  </div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="field">
                      <label>Question</label>
                      <textarea className="textarea" value={editForm.question_text} onChange={e => setEditForm(f => ({ ...f, question_text: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label>Options · pick correct answer</label>
                      {(editForm.options ?? []).map((o, oi) => {
                        const letter = ['A', 'B', 'C', 'D'][oi]
                        const isCorrect = editForm.correct_answer_letter === letter
                        return (
                          <div key={oi} className="row" style={{ gap: 8, marginTop: 6, padding: 8, background: isCorrect ? 'var(--success-soft)' : 'var(--surface-2)', borderRadius: 6, border: isCorrect ? '1px solid #86EFAC' : '1px solid transparent' }}>
                            <input type="radio" name="ans" checked={isCorrect} onChange={() => setEditForm(f => ({ ...f, correct_answer_letter: letter, correct_answer: o }))} />
                            <input
                              style={{ flex: 1, border: 0, background: 'transparent', fontSize: 13, outline: 0 }}
                              value={o}
                              onChange={e => setEditForm(f => {
                                const opts = [...f.options]
                                opts[oi] = e.target.value
                                return { ...f, options: opts }
                              })}
                            />
                            {isCorrect && <Badge tone="success">Correct</Badge>}
                          </div>
                        )
                      })}
                    </div>
                    <div className="field">
                      <label>Explanation</label>
                      <textarea className="textarea" value={editForm.explanation} onChange={e => setEditForm(f => ({ ...f, explanation: e.target.value }))} />
                    </div>
                    <div className="grid-2">
                      <div className="field">
                        <label>Difficulty</label>
                        <select className="select" value={editForm.difficulty} onChange={e => setEditForm(f => ({ ...f, difficulty: e.target.value }))}>
                          <option>Intro</option><option>Core</option><option>Applied</option>
                        </select>
                      </div>
                    </div>
                    <div className="row" style={{ gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                      <button className="btn danger" onClick={() => handleDelete(current)} disabled={saving}>
                        <Icon name="x" size={14} /> Delete
                      </button>
                      <button className="btn" onClick={handleSave} disabled={saving}>Save</button>
                      <button className="btn primary" onClick={() => handlePublish(current)} disabled={saving}>
                        <Icon name="check" size={14} /> {current.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

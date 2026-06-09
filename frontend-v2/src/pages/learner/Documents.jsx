import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { marked } from 'marked'
import Topbar from '../../components/shell/Topbar'
import { Badge } from '../../components/ui'
import Icon from '../../icons'
import { listLearnerDocuments, getLearnerDocument } from '../../services/documents'

marked.setOptions({ breaks: true, gfm: true })

export default function LearnerDocuments() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null)      // full document (with content)
  const [loadingDoc, setLoadingDoc] = useState(false)

  const selectedId = searchParams.get('doc')

  useEffect(() => {
    listLearnerDocuments()
      .then(d => setDocs(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Open the document named in the URL (?doc=), or the first one once loaded.
  useEffect(() => {
    if (loading) return
    const id = selectedId || (docs[0] && docs[0].id)
    if (!id) return
    if (active?.id === id) return
    setLoadingDoc(true)
    getLearnerDocument(id)
      .then(setActive)
      .catch(() => setActive(null))
      .finally(() => setLoadingDoc(false))
  }, [selectedId, loading, docs]) // eslint-disable-line react-hooks/exhaustive-deps

  const open = (id) => setSearchParams({ doc: id })

  // Group documents by project for the list.
  const groups = docs.reduce((acc, d) => {
    const key = d.project_name || 'Other'
    ;(acc[key] = acc[key] || []).push(d)
    return acc
  }, {})

  const renderContent = (doc) => {
    const text = doc.content ?? ''
    if ((doc.file_type || '').toLowerCase() === 'md') {
      return <div className="chapter-md" dangerouslySetInnerHTML={{ __html: marked.parse(text) }} />
    }
    return <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.7, color: 'var(--text-1)', margin: 0 }}>{text}</pre>
  }

  return (
    <>
      <style>{`
        .chapter-md h1, .chapter-md h2 { font-size: 20px; font-weight: 600; letter-spacing: -0.015em; margin: 24px 0 10px; }
        .chapter-md h3 { font-size: 16px; font-weight: 600; margin: 18px 0 6px; }
        .chapter-md p { font-size: 14.5px; line-height: 1.75; color: var(--text-2); margin: 12px 0; }
        .chapter-md ul, .chapter-md ol { font-size: 14.5px; line-height: 1.75; color: var(--text-2); padding-left: 22px; margin: 12px 0; }
        .chapter-md table { border-collapse: collapse; width: 100%; font-size: 13.5px; margin: 16px 0; }
        .chapter-md th, .chapter-md td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; }
        .chapter-md th { background: var(--surface-2); font-weight: 600; }
        .chapter-md code { font-family: var(--font-mono); font-size: 13px; background: var(--surface-2); padding: 2px 6px; border-radius: 5px; }
      `}</style>
      <Topbar crumbs={['Documents']} actions={
        <button className="btn ai" onClick={() => navigate('/v2/learner/ai-tutor')}>
          <Icon name="sparkle" size={14} /> Ask Atlas
        </button>
      } />
      <div className="viewport" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', overflow: 'hidden', height: 'calc(100vh - var(--topbar-h))' }}>

        {/* Left: document list grouped by project */}
        <div style={{ borderRight: '1px solid var(--border)', overflow: 'auto', padding: 16, background: 'var(--bg)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 12 }}>
            Onboarding materials
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 120 }} />
          ) : docs.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>No documents available yet. Your manager hasn't shared any materials.</div>
          ) : Object.entries(groups).map(([proj, items]) => (
            <div key={proj} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>{proj}</div>
              <div className="col" style={{ gap: 3 }}>
                {items.map(d => {
                  const isActive = active?.id === d.id || selectedId === d.id
                  return (
                    <button key={d.id}
                      className={'nav-item' + (isActive ? ' active' : '')}
                      style={{ padding: '8px 10px' }}
                      onClick={() => open(d.id)}>
                      <span className="ico"><Icon name="doc" size={14} /></span>
                      <span className="label" style={{ fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.filename}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: reader */}
        <div style={{ overflow: 'auto', padding: '40px 56px', background: 'white' }}>
          {loadingDoc ? (
            <div className="skeleton" style={{ height: 400, maxWidth: 760, margin: '0 auto' }} />
          ) : !active ? (
            <div style={{ display: 'grid', placeItems: 'center', height: '60vh', color: 'var(--text-3)' }}>
              <div style={{ textAlign: 'center' }}>
                <Icon name="doc" size={28} />
                <div style={{ marginTop: 8, fontSize: 14 }}>{docs.length ? 'Select a document to read' : 'No documents yet'}</div>
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <div className="row" style={{ gap: 8, marginBottom: 8 }}>
                <Badge tone="accent">{active.project_name}</Badge>
                <span className="muted" style={{ fontSize: 12 }}>{(active.file_type || '').toUpperCase()}</span>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 20px' }}>{active.filename}</h1>
              {renderContent(active)}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

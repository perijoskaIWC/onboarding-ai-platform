import { useState } from 'react'
import Topbar from '../../components/shell/Topbar'
import { Badge, Switch, ConfigCard } from '../../components/ui'
import Icon from '../../icons'

const SECTIONS = [
  { label: 'Knowledge sources', icon: 'docs' },
  { label: 'Tone & style', icon: 'chat' },
  { label: 'Guardrails', icon: 'shield' },
  { label: 'Model & limits', icon: 'cog' },
  { label: 'Escalation', icon: 'alert' },
  { label: 'Feedback logs', icon: 'list' },
]

export default function AdminAIConfig() {
  const [section, setSection] = useState(0)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      <Topbar crumbs={['Workspace', 'AI Tutor Config']} actions={
        <button className="btn primary" onClick={handleSave}>
          <Icon name="check" size={14} /> {saved ? 'Saved!' : 'Save changes'}
        </button>
      } />
      <div className="viewport">
        <div className="page-header">
          <div className="row" style={{ gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--ai-soft)', color: 'var(--ai)', display: 'grid', placeItems: 'center' }}>
              <Icon name="sparkle" size={22} />
            </div>
            <div>
              <h1>AI Tutor configuration</h1>
              <div className="sub">Control how the Atlas tutor answers, what it cites and when it escalates to a human.</div>
            </div>
          </div>
        </div>
        <div className="page-body">
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
            <nav className="col" style={{ gap: 2 }}>
              {SECTIONS.map((s, i) => (
                <button key={s.label} className={'nav-item ' + (i === section ? 'active' : '')} style={{ padding: '8px 12px' }} onClick={() => setSection(i)}>
                  <span className="ico"><Icon name={s.icon} size={14} /></span>
                  <span className="label">{s.label}</span>
                </button>
              ))}
            </nav>
            <div className="col" style={{ gap: 16 }}>
              {section === 0 && (
                <>
                  <ConfigCard title="Allowed documents" sub="The tutor will only cite from these indexed sources.">
                    <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                      <button className="chip active">All indexed docs</button>
                      <button className="chip">Pick by tag</button>
                      <button className="chip">Pick by folder</button>
                    </div>
                    <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>Atlas will never answer from outside this set, except for general greetings.</div>
                  </ConfigCard>
                  <ConfigCard title="Strict source mode" sub="Refuse to answer if no source supports the question.">
                    <Switch on label="Enabled · recommended for compliance content" />
                  </ConfigCard>
                </>
              )}
              {section === 1 && (
                <>
                  <ConfigCard title="Tone" sub="How should answers sound?">
                    <div className="row" style={{ gap: 6 }}>
                      {['Concise', 'Friendly', 'Formal', 'Coaching'].map(t => (
                        <button key={t} className={'chip ' + (t === 'Coaching' ? 'active' : '')}>{t}</button>
                      ))}
                    </div>
                  </ConfigCard>
                  <ConfigCard title="Response style" sub="Structure of answers.">
                    <div className="row" style={{ gap: 6 }}>
                      {['Bullets', 'Prose', 'Step-by-step', 'Q&A'].map(t => (
                        <button key={t} className={'chip ' + (t === 'Step-by-step' ? 'active' : '')}>{t}</button>
                      ))}
                    </div>
                  </ConfigCard>
                </>
              )}
              {section === 2 && (
                <ConfigCard title="Guardrails" sub="Topics Atlas will not engage with.">
                  <div className="col" style={{ gap: 10 }}>
                    <Switch on label="Block off-topic questions (outside onboarding scope)" />
                    <Switch on label="Block questions about competitors" />
                    <Switch label="Block salary / compensation questions" />
                  </div>
                </ConfigCard>
              )}
              {section === 3 && (
                <ConfigCard title="Model & limits" sub="Choose the foundation model and per-learner budget.">
                  <div className="grid-2">
                    <div className="field">
                      <label>Model</label>
                      <select className="select">
                        <option>claude-sonnet-4.6 (recommended)</option>
                        <option>claude-haiku-4.5</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Daily message cap / learner</label>
                      <input className="input" defaultValue="80" />
                    </div>
                  </div>
                </ConfigCard>
              )}
              {section === 4 && (
                <ConfigCard title="Escalation rule" sub="When the tutor can't help, it routes to a human.">
                  <div className="field"><label>Slack channel</label><input className="input" defaultValue="#onboarding-help" /></div>
                  <div className="row" style={{ marginTop: 10, gap: 12 }}>
                    <Switch on label="Auto-escalate after 3 failed turns" />
                  </div>
                </ConfigCard>
              )}
              {section === 5 && (
                <ConfigCard title="Feedback logs" sub="Learner thumbs-up / down on Atlas answers.">
                  <div className="muted" style={{ fontSize: 13, padding: '12px 0' }}>No feedback logged yet. Feedback data will appear here once learners start using the AI tutor.</div>
                </ConfigCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

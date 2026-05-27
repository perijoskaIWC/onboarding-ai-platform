import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../../components/shell/Topbar'
import { Avatar, Badge, Switch, ConfigCard } from '../../components/ui'
import Icon from '../../icons'
import { getUserEmail } from '../../services/auth'
import { logout } from '../../services/auth'

const SECTIONS = [
  { label: 'Account', icon: 'user' },
  { label: 'Notifications', icon: 'bell' },
  { label: 'Appearance', icon: 'star' },
  { label: 'Language', icon: 'globe' },
  { label: 'Security', icon: 'shield' },
]

export default function LearnerProfile() {
  const navigate = useNavigate()
  const [section, setSection] = useState(0)
  const email = getUserEmail() ?? ''
  const name = email.split('@')[0]
  const initials = name.slice(0, 2).toUpperCase()

  const handleSignOut = () => {
    logout()
    navigate('/v2/login')
  }

  return (
    <>
      <Topbar crumbs={['Profile & Settings']} />
      <div className="viewport">
        <div className="page-header">
          <div className="row" style={{ gap: 16 }}>
            <Avatar initials={initials} sz="xl" />
            <div>
              <h1>{name}</h1>
              <div className="sub">{email}</div>
              <div className="row" style={{ marginTop: 8, gap: 6 }}>
                <Badge tone="accent" dot>Learner</Badge>
              </div>
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
              <button className="nav-item" style={{ padding: '8px 12px', color: 'var(--danger)', marginTop: 8 }} onClick={handleSignOut}>
                <span className="ico"><Icon name="external" size={14} /></span>
                <span className="label">Sign out</span>
              </button>
            </nav>
            <div className="col" style={{ gap: 16 }}>
              {section === 0 && (
                <ConfigCard title="Account" sub="Your profile information.">
                  <div className="grid-2">
                    <div className="field">
                      <label>Display name</label>
                      <input className="input" defaultValue={name} />
                    </div>
                    <div className="field">
                      <label>Email</label>
                      <input className="input" defaultValue={email} disabled />
                    </div>
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>Email is managed by your IT administrator and cannot be changed here.</div>
                  <div style={{ marginTop: 14, textAlign: 'right' }}>
                    <button className="btn primary">Save changes</button>
                  </div>
                </ConfigCard>
              )}
              {section === 1 && (
                <ConfigCard title="Notifications" sub="Control what Atlas notifies you about.">
                  <div className="col" style={{ gap: 10 }}>
                    <Switch on label="Daily learning reminder · 9:00 AM" />
                    <Switch on label="New chapter or quiz available" />
                    <Switch label="Weekly progress summary email" />
                    <Switch on label="AI tutor activity digest" />
                  </div>
                </ConfigCard>
              )}
              {section === 2 && (
                <ConfigCard title="Appearance" sub="Choose how Atlas looks.">
                  <div className="row" style={{ gap: 10 }}>
                    {[
                      { id: 'light', label: 'Light' },
                      { id: 'dim', label: 'Dim' },
                      { id: 'dark', label: 'Dark' },
                      { id: 'system', label: 'System' },
                    ].map(t => (
                      <label key={t.id} style={{ flex: 1, padding: 12, border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ height: 50, borderRadius: 6, background: t.id === 'light' ? 'white' : t.id === 'dim' ? '#1E293B' : t.id === 'dark' ? '#0B1220' : 'linear-gradient(90deg, white 50%, #0B1220 50%)', border: '1px solid var(--border)', marginBottom: 8 }} />
                        <input type="radio" name="th" defaultChecked={t.id === 'light'} /> <span style={{ fontSize: 13 }}>{t.label}</span>
                      </label>
                    ))}
                  </div>
                </ConfigCard>
              )}
              {section === 3 && (
                <ConfigCard title="Language" sub="Language used in Atlas UI.">
                  <select className="select">
                    <option>English (US)</option>
                    <option>Deutsch</option>
                    <option>日本語</option>
                    <option>Português (BR)</option>
                  </select>
                </ConfigCard>
              )}
              {section === 4 && (
                <ConfigCard title="Security" sub="Sign-in security settings.">
                  <div className="row" style={{ gap: 10 }}>
                    <Icon name="shield" size={20} style={{ color: 'var(--success)' }} />
                    <div style={{ flex: 1 }}>
                      <strong>Signed in securely</strong>
                      <div className="muted" style={{ fontSize: 12 }}>Last sign-in: Today</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <button className="btn danger" onClick={handleSignOut}>Sign out everywhere</button>
                  </div>
                </ConfigCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

import { useState } from 'react'
import Topbar from '../../components/shell/Topbar'
import { Badge, ConfigCard, Switch } from '../../components/ui'
import Icon from '../../icons'

const SECTIONS = [
  { label: 'General', icon: 'cog' },
  { label: 'Members', icon: 'users' },
  { label: 'Authentication', icon: 'shield' },
  { label: 'Branding', icon: 'star' },
  { label: 'Integrations', icon: 'link' },
  { label: 'Billing', icon: 'trophy' },
]

export default function AdminSettings() {
  const [section, setSection] = useState(0)

  return (
    <>
      <Topbar crumbs={['Workspace', 'Settings']} />
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>Workspace settings</h1>
            <div className="sub">Configure your Atlas workspace.</div>
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
                  <ConfigCard title="Workspace name" sub="Shown to learners and in emails.">
                    <input className="input" defaultValue="My Workspace" />
                    <div style={{ marginTop: 10, textAlign: 'right' }}>
                      <button className="btn primary">Save</button>
                    </div>
                  </ConfigCard>
                  <ConfigCard title="Default language" sub="Used for AI tutor and UI defaults.">
                    <select className="select" defaultValue="en">
                      <option value="en">English (US)</option>
                      <option value="de">Deutsch</option>
                      <option value="ja">日本語</option>
                    </select>
                  </ConfigCard>
                  <ConfigCard title="Danger zone" sub="Irreversible actions.">
                    <button className="btn danger">Delete workspace</button>
                  </ConfigCard>
                </>
              )}
              {section === 1 && (
                <ConfigCard title="Members" sub="Manage who has access to this workspace.">
                  <div className="muted" style={{ fontSize: 13, padding: '12px 0' }}>Member management is handled via your identity provider. Changes sync automatically.</div>
                  <button className="btn"><Icon name="plus" size={14} /> Invite member</button>
                </ConfigCard>
              )}
              {section === 2 && (
                <ConfigCard title="Authentication" sub="Single sign-on configuration.">
                  <div className="row" style={{ gap: 10 }}>
                    <div style={{ width: 36, height: 36, background: 'var(--surface-2)', borderRadius: 8, display: 'grid', placeItems: 'center', color: '#0078D4' }}>
                      <Icon name="microsoft" size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong>Microsoft Entra ID</strong>
                      <div className="muted" style={{ fontSize: 12 }}>SSO via OIDC</div>
                    </div>
                    <Badge tone="success" dot>Connected</Badge>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <Switch on label="Enforce MFA for all users" />
                  </div>
                </ConfigCard>
              )}
              {section === 3 && (
                <ConfigCard title="Branding" sub="Customize how Atlas looks for your learners.">
                  <div className="field">
                    <label>Workspace logo URL</label>
                    <input className="input" placeholder="https://…" />
                  </div>
                  <div className="field" style={{ marginTop: 12 }}>
                    <label>Brand color</label>
                    <div className="row" style={{ gap: 8 }}>
                      <input className="input" defaultValue="#2563EB" style={{ flex: 1 }} />
                      <div style={{ width: 36, height: 36, background: '#2563EB', borderRadius: 6, border: '1px solid var(--border)', flexShrink: 0 }} />
                    </div>
                  </div>
                </ConfigCard>
              )}
              {section === 4 && (
                <ConfigCard title="Integrations" sub="Connect Atlas to your existing tools.">
                  <div className="col" style={{ gap: 12 }}>
                    {[
                      { name: 'Slack', desc: 'Notifications and escalation', connected: true },
                      { name: 'GitHub', desc: 'Link repo documentation', connected: false },
                      { name: 'Confluence', desc: 'Import pages as documents', connected: false },
                    ].map(it => (
                      <div key={it.name} className="row" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
                        <div style={{ width: 36, height: 36, background: 'var(--surface-2)', borderRadius: 8, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <Icon name="link" size={16} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: 13 }}>{it.name}</strong>
                          <div className="muted" style={{ fontSize: 12 }}>{it.desc}</div>
                        </div>
                        {it.connected ? <Badge tone="success" dot>Connected</Badge> : <button className="btn sm">Connect</button>}
                      </div>
                    ))}
                  </div>
                </ConfigCard>
              )}
              {section === 5 && (
                <ConfigCard title="Billing" sub="Plan and usage.">
                  <div className="row" style={{ gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>Growth plan</div>
                      <div className="muted" style={{ fontSize: 12 }}>Up to 200 learners · Unlimited projects · AI tutor included</div>
                    </div>
                    <Badge tone="accent">Active</Badge>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <button className="btn">Manage billing</button>
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

import { useState } from 'react'
import Icon from '../../icons'

export function Badge({ tone = 'default', dot, children, style }) {
  const cls = tone === 'default' ? 'badge' : `badge ${tone}`
  return <span className={dot ? cls + ' dot' : cls} style={style}>{children}</span>
}

export function StatusBadge({ status }) {
  const map = {
    'Active': 'success', 'Draft': 'warning', 'Archived': 'default',
    'On track': 'success', 'At risk': 'warning', 'Behind': 'danger', 'Complete': 'info',
    'Indexed': 'success', 'Processing': 'info', 'Failed': 'danger',
    'Locked': 'default', 'In progress': 'accent', 'Completed': 'success', 'Available': 'info',
    'Pending': 'warning', 'Approved': 'success', 'Rejected': 'danger',
  }
  return <Badge tone={map[status] || 'default'} dot>{status}</Badge>
}

const AVATAR_COLORS = {
  A: '#DBE7FF', B: '#FCE7F3', C: '#FEE2E2', D: '#E7F5EC',
  E: '#FEF3C7', F: '#F1ECFF', G: '#E0F2FE', H: '#FFE4E6',
}

export function Avatar({ initials = '?', sz = '' }) {
  const bg = AVATAR_COLORS[initials?.[0]] || '#EDF0F3'
  const dark = ['MT', 'AR'].includes(initials)
  return (
    <div
      className={'avatar ' + sz}
      style={{ background: bg, color: dark ? 'white' : 'var(--text)' }}
    >
      {initials}
    </div>
  )
}

export function Progress({ value, tone, sz }) {
  return (
    <div className={'progress ' + (sz || '') + ' ' + (tone || '')}>
      <span style={{ width: Math.max(0, Math.min(100, value)) + '%' }} />
    </div>
  )
}

export function FileIcon({ type }) {
  const colors = {
    pdf: ['#FEE2E2', '#B91C1C'],
    md: ['#DBE7FF', '#1D4ED8'],
    txt: ['#E7F5EC', '#166534'],
    docx: ['#DBEAFE', '#1E40AF'],
  }
  const [bg, fg] = colors[type] || ['#F4F6F8', '#475569']
  return (
    <div style={{
      width: 32, height: 32, background: bg, color: fg,
      borderRadius: 6, display: 'grid', placeItems: 'center',
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
      textTransform: 'uppercase', flexShrink: 0,
    }}>
      {type}
    </div>
  )
}

export function AIChip({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 99,
      background: 'var(--ai-soft)', border: '1px solid var(--border-ai)',
      color: 'var(--ai)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
    }}>
      <Icon name="sparkle" size={13} /> {children}
    </button>
  )
}

export function KpiCard({ label, value, trend, sub, tone, ai }) {
  return (
    <div className={'kpi ' + (ai ? 'ai' : '')}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="label">{label}</div>
        {ai && <Icon name="sparkle" size={14} style={{ color: 'var(--ai)' }} />}
      </div>
      <div className="value">{value}</div>
      <div className="meta">
        {trend && (
          <span className={'trend ' + (String(trend).startsWith('-') ? 'down' : 'up')}>
            <Icon name={String(trend).startsWith('-') ? 'chevronDown' : 'chevronUp'} size={12} />
            {trend}
          </span>
        )}
        <span>{sub}</span>
      </div>
    </div>
  )
}

export function Switch({ on, label }) {
  const [v, setV] = useState(!!on)
  return (
    <div className="row" style={{ gap: 10, cursor: 'pointer' }} onClick={() => setV(!v)}>
      <div className={'toggle ' + (v ? 'on' : '')} />
      <span style={{ fontSize: 13 }}>{label}</span>
    </div>
  )
}

export function ConfigCard({ title, sub, children }) {
  return (
    <div className="card">
      <div className="card-h"><h3>{title}</h3>{sub && <span className="sub">{sub}</span>}</div>
      <div className="card-body">{children}</div>
    </div>
  )
}

export function Gauge({ value, label, size = 140, color = 'var(--accent)' }) {
  const r = size / 2 - 10
  const c = 2 * Math.PI * r
  const off = c * (1 - value / 100)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-3)" strokeWidth="8" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="8" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>
            {value}<span style={{ color: 'var(--text-3)', fontSize: 14, fontWeight: 500 }}>%</span>
          </div>
          {label && <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>{label}</div>}
        </div>
      </div>
    </div>
  )
}

export function LineChart({ data, height = 140, color = 'var(--accent)' }) {
  const max = Math.max(...data) * 1.1
  const step = 100 / (data.length - 1)
  const pts = data.map((v, i) => `${(i * step).toFixed(2)},${(height - (v / max) * (height - 10) - 4).toFixed(2)}`).join(' ')
  const area = `0,${height} ${pts} 100,${height}`
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#lg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      {data.map((v, i) => (
        <circle key={i} cx={i * step} cy={height - (v / max) * (height - 10) - 4} r="1.3" fill={color} />
      ))}
    </svg>
  )
}

export function BarChart({ data, height = 140, color = 'var(--accent)' }) {
  const max = Math.max(...data.map(d => d.v))
  const w = 100 / data.length
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const h = (d.v / max) * (height - 20)
        return (
          <g key={i}>
            <rect x={i * w + w * 0.18} y={height - h - 14} width={w * 0.64} height={h} rx="1.2" fill={color} opacity={d.dim ? 0.35 : 0.9} />
            <text x={i * w + w / 2} y={height - 2} fontSize="3.4" textAnchor="middle" fill="var(--text-3)" fontFamily="var(--font-mono)">{d.l}</text>
          </g>
        )
      })}
    </svg>
  )
}

export function Sparkline({ data, color = 'var(--accent)' }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const step = 100 / (data.length - 1)
  const pts = data.map((v, i) => `${(i * step).toFixed(2)},${(30 - ((v - min) / (max - min || 1)) * 26 - 2).toFixed(2)}`).join(' ')
  return (
    <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function Heatmap({ rows, cols, data, accent = 'var(--accent)' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${cols.length}, 1fr)`, gap: 4, fontSize: 11 }}>
      <div />
      {cols.map((c, i) => <div key={i} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '2px 0' }}>{c}</div>)}
      {rows.map((r, ri) => (
        <React.Fragment key={ri}>
          <div style={{ color: 'var(--text-2)', padding: '4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r}</div>
          {cols.map((_, ci) => {
            const v = data[ri][ci]
            return (
              <div key={ci} style={{
                height: 28, borderRadius: 4,
                background: `color-mix(in srgb, ${accent} ${v}%, var(--surface-2))`,
                display: 'grid', placeItems: 'center',
                color: v > 50 ? 'white' : 'var(--text-2)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: 11, fontWeight: 500,
              }}>{v}</div>
            )
          })}
        </React.Fragment>
      ))}
    </div>
  )
}

export function Toast({ msg }) {
  if (!msg) return null
  return <div className="toast success">{msg}</div>
}

import React from 'react'

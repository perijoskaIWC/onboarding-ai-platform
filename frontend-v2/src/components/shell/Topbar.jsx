import Icon from '../../icons'

export default function Topbar({ crumbs = [], actions, search = true }) {
  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <Icon name="chevronRight" size={12} className="sep" />}
            {i === crumbs.length - 1 ? <strong>{c}</strong> : <span>{c}</span>}
          </span>
        ))}
      </div>
      <div className="actions">
        {search && (
          <div className="topbar-search">
            <Icon name="search" size={14} />
            <input placeholder="Search projects, docs, people…" />
            <kbd>⌘K</kbd>
          </div>
        )}
        <button className="icon-btn" title="Notifications">
          <Icon name="bell" size={16} />
          <span className="dot" />
        </button>
        {actions}
      </div>
    </div>
  )
}

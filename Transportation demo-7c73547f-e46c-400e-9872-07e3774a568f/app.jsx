// Atlas — main app: router, shell, screen registry

const { useState, useEffect, useRef, useMemo, createContext, useContext } = React;

// ============ ROUTING ============
function useHashRoute(defaultRoute) {
  const [route, setRoute] = useState(() => window.location.hash.replace(/^#\/?/, "") || defaultRoute);
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace(/^#\/?/, "") || defaultRoute);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [defaultRoute]);
  const nav = (r) => { window.location.hash = "/" + r; };
  return [route, nav];
}

const AppCtx = createContext({});
window.useApp = () => useContext(AppCtx);

// ============ SCREEN REGISTRY ============
// Each screen registers itself onto window.SCREENS
window.SCREENS = window.SCREENS || {};

// ============ SHELL ============
function Sidebar({ role, current, collapsed, onNav }) {
  const nav = role === "admin" ? NAV_ADMIN : NAV_LEARNER;
  const user = role === "admin" ? ADMIN_USER : LEARNER_USER;
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">A</div>
        <div className="brand-text">
          <strong>Atlas</strong>
          <span>{ORG}</span>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 8 }}>
        {nav.map((sec, si) => (
          <div className="sidebar-section" key={si}>
            <div className="sidebar-section-label">{sec.group}</div>
            <div className="nav">
              {sec.items.map(it => (
                <button key={it.id} className={"nav-item " + (current === it.id ? "active" : "")} onClick={() => onNav(it.id)} title={it.label}>
                  <span className="ico"><Icon name={it.icon} size={16}/></span>
                  <span className="label">{it.label}</span>
                  {it.badge && <span className="badge">{it.badge}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="sidebar-user" title={user.email}>
        <Avatar initials={user.initials}/>
        <div className="user-meta">
          <strong>{user.name}</strong>
          <span>{user.role}</span>
        </div>
        {!collapsed && <Icon name="chevronUp" size={14} style={{ color: "var(--text-3)", marginLeft: "auto" }}/>}
      </div>
    </aside>
  );
}

function Topbar({ crumbs = [], actions, search = true }) {
  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icon name="chevronRight" size={12} className="sep"/>}
            {i === crumbs.length - 1 ? <strong>{c}</strong> : <span>{c}</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="actions">
        {search && (
          <div className="topbar-search">
            <Icon name="search" size={14}/>
            <input placeholder="Search projects, docs, people…" />
            <kbd>⌘K</kbd>
          </div>
        )}
        <button className="icon-btn" title="Help"><Icon name="help" size={16}/></button>
        <button className="icon-btn" title="Notifications"><Icon name="bell" size={16}/><span className="dot"/></button>
        {actions}
      </div>
    </div>
  );
}

// ============ APP ROOT ============
function App() {
  // tweakables — persisted via host
  const defaults = /*EDITMODE-BEGIN*/{
    "role": "admin",
    "sidebarCollapsed": false,
    "dashboardVariant": "overview"
  }/*EDITMODE-END*/;
  const [tweaks, setTweak] = useTweaks(defaults);

  const [route, nav] = useHashRoute(tweaks.role === "admin" ? "admin-dashboard" : "learner-dashboard");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  // Auth screens (no shell)
  const AUTH = ["login", "login-loading", "login-error", "role-select"];
  const isAuth = AUTH.includes(route);

  // Switch role automatically when route changes
  useEffect(() => {
    if (route.startsWith("admin-") && tweaks.role !== "admin") setTweak("role", "admin");
    if (route.startsWith("learner-") && tweaks.role !== "learner") setTweak("role", "learner");
  }, [route]);

  // Switch route when role tweak changes via panel
  useEffect(() => {
    if (tweaks.role === "admin" && route.startsWith("learner-")) nav("admin-dashboard");
    if (tweaks.role === "learner" && route.startsWith("admin-")) nav("learner-dashboard");
  }, [tweaks.role]);

  const ctx = { route, nav, modal, setModal, showToast, tweaks, setTweak };
  const Screen = window.SCREENS[route] || window.SCREENS["404"];

  return (
    <AppCtx.Provider value={ctx}>
      <div className={"app " + (tweaks.sidebarCollapsed ? "collapsed " : "") + (isAuth ? "no-shell " : "")}>
        {!isAuth && <Sidebar role={tweaks.role} current={route} collapsed={tweaks.sidebarCollapsed} onNav={nav}/>}
        <main className="main">
          {Screen ? <Screen ctx={ctx}/> : <NotFound nav={nav}/>}
          {toast && <div className="toast success">{toast}</div>}
        </main>
      </div>

      <TweaksPanel title="Tweaks" defaultPosition={{ right: 20, bottom: 20 }}>
        <TweakSection title="Workspace">
          <TweakRadio
            label="Role"
            value={tweaks.role}
            onChange={(v) => setTweak("role", v)}
            options={[{value:"admin",label:"Admin"},{value:"learner",label:"Learner"}]}
          />
          <TweakToggle label="Collapse sidebar" value={tweaks.sidebarCollapsed} onChange={(v) => setTweak("sidebarCollapsed", v)}/>
        </TweakSection>
        <TweakSection title="Admin dashboard">
          <TweakRadio
            label="Variant"
            value={tweaks.dashboardVariant}
            onChange={(v) => setTweak("dashboardVariant", v)}
            options={[{value:"overview",label:"Overview"},{value:"command",label:"Command"}]}
          />
        </TweakSection>
        <TweakSection title="Quick jump">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <TweakButton onClick={() => nav("login")}>Login</TweakButton>
            <TweakButton onClick={() => nav("role-select")}>Role select</TweakButton>
            <TweakButton onClick={() => nav("index")}>All screens</TweakButton>
            <TweakButton onClick={() => nav(tweaks.role === "admin" ? "admin-dashboard" : "learner-dashboard")}>Home</TweakButton>
          </div>
        </TweakSection>
      </TweaksPanel>
    </AppCtx.Provider>
  );
}

function NotFound({ nav }) {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
      <div className="empty">
        <div className="illu"><Icon name="alert"/></div>
        <h3>Screen not found</h3>
        <p className="muted">The screen "{window.location.hash}" doesn't exist.</p>
        <button className="btn primary" onClick={() => nav("index")}>Open screen index</button>
      </div>
    </div>
  );
}
window.SCREENS["404"] = NotFound;

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);

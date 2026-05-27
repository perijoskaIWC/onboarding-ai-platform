// Auth screens + screen index

// ============ LOGIN ============
function Login({ ctx }) {
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(ctx.route);
  const isErr = ctx.route === "login-error";
  const isLoad = ctx.route === "login-loading";

  return (
    <div style={{ height: "100vh", display: "grid", gridTemplateColumns: "minmax(420px, 460px) 1fr", background: "var(--bg)" }}>
      {/* Left: form */}
      <div style={{ padding: "48px 56px", display: "flex", flexDirection: "column", background: "var(--surface)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 64 }}>
          <div className="brand-mark" style={{ width: 34, height: 34 }}>A</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, letterSpacing: "-0.01em" }}>Atlas</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>AI Onboarding Assistant</div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 360 }}>
          <h1 style={{ fontSize: 28, margin: 0, letterSpacing: "-0.02em", fontWeight: 600 }}>Welcome back</h1>
          <p style={{ color: "var(--text-2)", marginTop: 8, marginBottom: 28 }}>
            Sign in with your work account to access onboarding paths, AI tutoring and progress for <strong style={{ color: "var(--text)" }}>{ORG}</strong>.
          </p>

          {isErr && (
            <div style={{ background: "var(--danger-soft)", border: "1px solid #FCA5A5", color: "var(--danger)", padding: "10px 12px", borderRadius: 8, marginBottom: 14, fontSize: 13, display: "flex", gap: 8 }}>
              <Icon name="alert" size={16}/>
              <div>
                <strong>Sign-in failed.</strong> Your account isn't provisioned for Atlas. Contact your workspace admin.
              </div>
            </div>
          )}

          <button className="btn lg block" disabled={loading} onClick={() => { setLoading(true); setTimeout(() => ctx.nav("role-select"), 900); }}
            style={{ borderColor: "var(--border-strong)", padding: "12px 16px", justifyContent: "center", gap: 10, fontSize: 14, background: "white" }}>
            <Icon name="microsoft" size={16} style={{ color: "#0078D4" }}/>
            {loading ? "Redirecting to Microsoft…" : "Continue with Microsoft"}
          </button>

          <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "flex-start", color: "var(--text-3)", fontSize: 12 }}>
            <Icon name="shield" size={14}/>
            <div>Atlas uses Microsoft Entra (MSAL) SSO. We never see your password. Sessions follow your IT policy.</div>
          </div>

          <div className="sep" style={{ margin: "28px 0" }}/>
          <div style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--text-3)" }}>
            <span style={{ cursor: "pointer" }} onClick={() => ctx.nav("login-error")}>Show error state</span>
            <span>·</span>
            <span style={{ cursor: "pointer" }} onClick={() => ctx.nav("login")}>Reset</span>
          </div>
        </div>

        <div style={{ fontSize: 11, color: "var(--text-3)", display: "flex", gap: 16 }}>
          <span>© Atlas {new Date().getFullYear()}</span>
          <span>Privacy</span>
          <span>Terms</span>
          <span>Status</span>
        </div>
      </div>

      {/* Right: hero */}
      <div style={{ position: "relative", overflow: "hidden",
        background: "radial-gradient(circle at 20% 20%, rgba(109,74,255,0.18), transparent 50%), radial-gradient(circle at 80% 80%, rgba(37,99,235,0.18), transparent 55%), #0B1220" }}>
        <div style={{ position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px" }}/>
        <div style={{ position: "absolute", inset: 0, padding: 56, color: "white", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontSize: 12, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            <Icon name="sparkle" size={14}/> AI ONBOARDING
          </div>
          <h2 style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.08, margin: 0, maxWidth: 460 }}>
            From document <span style={{ color: "#A78BFA" }}>to expertise</span> — in days, not months.
          </h2>
          <p style={{ marginTop: 16, color: "rgba(255,255,255,0.65)", fontSize: 15, maxWidth: 440, lineHeight: 1.55 }}>
            Atlas turns your wikis, runbooks and PDFs into adaptive learning paths with built-in AI tutoring and quiz-gated progression.
          </p>

          {/* Floating mock cards */}
          <div style={{ marginTop: 48, display: "grid", gap: 12, maxWidth: 380 }}>
            <FloatCard icon="docs" title="Service Catalog.md" sub="Indexed · 11 versions" tone="default"/>
            <FloatCard icon="sparkle" title="Generating learning path…" sub="4 weeks · Platform Engineering" tone="ai"/>
            <FloatCard icon="check" title="Quiz · Week 2 passed" sub="Score 88% — next module unlocked" tone="success"/>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatCard({ icon, title, sub, tone }) {
  const bg = tone === "ai" ? "rgba(109,74,255,0.18)" : tone === "success" ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.06)";
  const border = tone === "ai" ? "rgba(167,139,250,0.4)" : tone === "success" ? "rgba(110,231,183,0.4)" : "rgba(255,255,255,0.1)";
  const iconColor = tone === "ai" ? "#C4B5FD" : tone === "success" ? "#6EE7B7" : "rgba(255,255,255,0.7)";
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, backdropFilter: "blur(10px)", borderRadius: 12, padding: 12, display: "flex", alignItems: "center", gap: 12, color: "white" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.08)", display: "grid", placeItems: "center", color: iconColor }}>
        <Icon name={icon} size={16}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{sub}</div>
      </div>
    </div>
  );
}

window.SCREENS["login"] = Login;
window.SCREENS["login-loading"] = Login;
window.SCREENS["login-error"] = Login;

// ============ ROLE SELECT ============
function RoleSelect({ ctx }) {
  const [picked, setPicked] = useState("admin");
  return (
    <div style={{ height: "100vh", display: "grid", placeItems: "center", background: "var(--bg)" }}>
      <div style={{ width: "min(720px, 92vw)", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <div className="brand-mark" style={{ width: 28, height: 28 }}>A</div>
          <span style={{ fontWeight: 600, letterSpacing: "-0.01em" }}>Atlas</span>
        </div>
        <h1 style={{ fontSize: 26, margin: 0, letterSpacing: "-0.02em", fontWeight: 600 }}>Choose your workspace role</h1>
        <p className="muted" style={{ marginTop: 6 }}>You have access to both. Pick one to enter — you can switch any time.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 28 }}>
          {[
            { id: "admin", icon: "briefcase", title: "Admin", sub: "Manage projects, documents and learners", bullets: ["Upload onboarding docs", "Generate AI learning paths", "Track readiness & analytics"] },
            { id: "learner", icon: "graduation", title: "Learner", sub: "Follow paths, take quizzes, ask the AI", bullets: ["Personal learning paths", "AI tutor with sourced answers", "Track your readiness score"] },
          ].map(r => (
            <button key={r.id}
              onClick={() => setPicked(r.id)}
              style={{
                textAlign: "left", padding: 22, borderRadius: 14,
                background: "var(--surface)",
                border: picked === r.id ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                boxShadow: picked === r.id ? "0 0 0 4px rgba(37,99,235,0.12)" : "var(--shadow-xs)",
                transition: "all 0.1s",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: picked === r.id ? "var(--accent-soft)" : "var(--surface-2)", color: picked === r.id ? "var(--accent)" : "var(--text-2)", display: "grid", placeItems: "center" }}>
                  <Icon name={r.icon} size={20}/>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, letterSpacing: "-0.01em" }}>{r.title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{r.sub}</div>
                </div>
                {picked === r.id && <div style={{ marginLeft: "auto", color: "var(--accent)" }}><Icon name="check" size={20}/></div>}
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                {r.bullets.map(b => <li key={b} style={{ display: "flex", gap: 8, fontSize: 12.5, color: "var(--text-2)" }}><Icon name="check" size={14} style={{ color: "var(--accent)" }}/>{b}</li>)}
              </ul>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 22, display: "flex", justifyContent: "center", gap: 10 }}>
          <button className="btn" onClick={() => ctx.nav("login")}>Sign out</button>
          <button className="btn primary lg" onClick={() => { ctx.setTweak("role", picked); ctx.nav(picked === "admin" ? "admin-dashboard" : "learner-dashboard"); }}>
            Continue as {picked === "admin" ? "Admin" : "Learner"} <Icon name="arrow" size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
}
window.SCREENS["role-select"] = RoleSelect;

// ============ SCREEN INDEX ============
const SCREEN_INDEX = [
  { group: "Authentication", items: [
    { id: "login", label: "Login", tag: "Auth" },
    { id: "login-error", label: "Login — Failed", tag: "State" },
    { id: "role-select", label: "Role selection", tag: "Auth" },
  ]},
  { group: "Admin", items: [
    { id: "admin-dashboard", label: "Dashboard", tag: "Hero · 2 variants" },
    { id: "admin-projects", label: "Projects", tag: "List" },
    { id: "admin-project-create", label: "Create Project", tag: "Modal" },
    { id: "admin-project-details", label: "Project Details", tag: "Tabbed" },
    { id: "admin-documents", label: "Documents", tag: "Upload" },
    { id: "admin-paths", label: "AI Learning Path Chat", tag: "AI" },
    { id: "admin-path-preview", label: "Learning Path Preview", tag: "Cards" },
    { id: "admin-assign", label: "Assign Users", tag: "Multi-select" },
    { id: "admin-quizzes", label: "Quiz Management", tag: "Review" },
    { id: "admin-analytics", label: "Analytics", tag: "Dashboards" },
    { id: "admin-users", label: "Users", tag: "Table" },
    { id: "admin-ai-config", label: "AI Tutor Config", tag: "Settings" },
    { id: "admin-settings", label: "Settings", tag: "Settings" },
  ]},
  { group: "Learner", items: [
    { id: "learner-dashboard", label: "Home", tag: "Hero" },
    { id: "learner-paths", label: "Learning Paths", tag: "Cards" },
    { id: "learner-module", label: "Module Detail", tag: "Chapters" },
    { id: "learner-chapter", label: "Chapter / Reader", tag: "Reader" },
    { id: "learner-quizzes", label: "Quiz Experience", tag: "Interactive" },
    { id: "learner-quiz-result", label: "Quiz Result", tag: "State" },
    { id: "learner-ai-tutor", label: "AI Tutor (Atlas)", tag: "AI" },
    { id: "learner-readiness", label: "Readiness Evaluation", tag: "Gauges" },
    { id: "learner-progress", label: "Progress", tag: "Charts" },
    { id: "learner-profile", label: "Profile & Settings", tag: "Settings" },
  ]},
];

function ScreenIndex({ ctx }) {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Screen Index</h1>
          <div className="sub">All 23 screens in the Atlas prototype. Use the sidebar, the Tweaks panel (bottom-right), or these links.</div>
        </div>
      </div>
      <div className="page-body">
        <div className="col" style={{ gap: 20 }}>
          {SCREEN_INDEX.map(sec => (
            <div key={sec.group}>
              <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 10 }}>{sec.group}</div>
              <div className="grid-3">
                {sec.items.map(it => (
                  <button key={it.id} onClick={() => ctx.nav(it.id)} className="card" style={{ textAlign: "left", padding: 16, cursor: "pointer", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <strong style={{ fontSize: 14 }}>{it.label}</strong>
                      <Icon name="external" size={14} style={{ color: "var(--text-3)" }}/>
                    </div>
                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <Badge tone="outline">{it.tag}</Badge>
                      <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>#/{it.id}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
window.SCREENS["index"] = ScreenIndex;

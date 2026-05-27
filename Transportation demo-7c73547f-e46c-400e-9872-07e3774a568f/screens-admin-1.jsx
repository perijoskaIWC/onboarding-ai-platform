// Admin: Dashboard (+variant), Projects, Create, Project Details, Documents

// ============ ADMIN DASHBOARD — Overview variant ============
function AdminDashboardOverview({ ctx }) {
  return (
    <>
      <Topbar crumbs={["Workspace", "Dashboard"]} actions={
        <button className="btn primary" onClick={() => ctx.nav("admin-project-create")}><Icon name="plus" size={14}/> New project</button>
      }/>
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>Good afternoon, Maya</h1>
            <div className="sub">Here's how onboarding is moving across {ORG} this week.</div>
          </div>
          <div className="actions">
            <div className="row" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 2 }}>
              {["7d", "30d", "QTD"].map(p => <button key={p} className={"btn " + (p === "30d" ? "primary" : "ghost") + " sm"}>{p}</button>)}
            </div>
            <button className="btn"><Icon name="download" size={14}/> Export</button>
          </div>
        </div>
        <div className="page-body" style={{ paddingTop: 4 }}>
          {/* KPIs */}
          <div className="kpi-grid" style={{ marginBottom: 18 }}>
            <KpiCard label="Active projects" value="6" trend="+1" sub="2 launching this month"/>
            <KpiCard label="Active learners" value="184" trend="+12" sub="across 6 projects"/>
            <KpiCard label="Avg. completion" value="64%" trend="+8" sub="vs. last 30 days"/>
            <KpiCard label="Avg. readiness score" value="78" trend="+3" sub="of 100"/>
            <KpiCard label="Pending quizzes" value="12" trend="-4" tone="warning" sub="awaiting your review"/>
            <KpiCard label="AI tutor usage" value="2.4k" sub="messages this week" ai/>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <div className="col" style={{ gap: 16 }}>
              {/* Progress overview */}
              <div className="card">
                <div className="card-h">
                  <h3>Onboarding velocity</h3>
                  <span className="sub">Module completions / week</span>
                  <div className="actions">
                    <Badge tone="accent" dot>Completions</Badge>
                    <Badge tone="ai" dot>AI sessions</Badge>
                  </div>
                </div>
                <div className="card-body">
                  <LineChart data={[42, 48, 51, 49, 57, 64, 68, 72, 70, 78, 84, 91]} height={180} color="var(--accent)"/>
                  <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-3)", display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)" }}>
                    {["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12"].map(w => <span key={w}>{w}</span>)}
                  </div>
                </div>
              </div>

              {/* At-risk learners */}
              <div className="card">
                <div className="card-h">
                  <h3>Learners needing attention</h3>
                  <span className="sub">7 flagged this week</span>
                  <div className="actions"><button className="btn ghost sm" onClick={() => ctx.nav("admin-users")}>View all <Icon name="chevronRight" size={12}/></button></div>
                </div>
                <div className="card-body flush">
                  <table className="table">
                    <thead><tr><th>Learner</th><th>Project</th><th>Progress</th><th>Readiness</th><th>Status</th></tr></thead>
                    <tbody>
                      {LEARNERS.filter(l => l.status !== "On track" && l.status !== "Complete").slice(0, 4).map(l => (
                        <tr key={l.name}>
                          <td><div className="row" style={{ gap: 10 }}><Avatar initials={l.initials} sz="sm"/><div><div className="cell-strong">{l.name}</div><div className="cell-meta">{l.role}</div></div></div></td>
                          <td>{l.proj}</td>
                          <td><div style={{ width: 120 }}><Progress value={l.progress} tone={l.progress > 70 ? "" : l.progress > 40 ? "warning" : "warning"}/><div className="cell-meta num" style={{ marginTop: 4 }}>{l.progress}%</div></div></td>
                          <td className="num">{l.readiness}</td>
                          <td><StatusBadge status={l.status}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col" style={{ gap: 16 }}>
              {/* AI summary card */}
              <div className="card ai-grad-bg" style={{ borderColor: "var(--border-ai)" }}>
                <div className="card-h" style={{ borderBottomColor: "var(--border-ai)" }}>
                  <Icon name="sparkle" size={14} style={{ color: "var(--ai)" }}/>
                  <h3>Weekly insight</h3>
                  <span className="sub">AI-generated</span>
                </div>
                <div className="card-body">
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>
                    Quiz scores on <strong>Week 2 — Architecture</strong> dropped 14% across Platform Engineering. The most-missed topic is <strong>service-to-service auth</strong>. Atlas suggests adding a focused chapter and 5 review questions.
                  </p>
                  <div className="row" style={{ gap: 6, marginTop: 14 }}>
                    <button className="btn ai sm"><Icon name="sparkle" size={12}/> Add chapter</button>
                    <button className="btn sm">Dismiss</button>
                  </div>
                </div>
              </div>

              {/* Activity */}
              <div className="card">
                <div className="card-h"><h3>Recent activity</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                  <ActivityList/>
                </div>
              </div>

              {/* Alerts */}
              <div className="card">
                <div className="card-h"><h3>Alerts</h3></div>
                <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <AlertRow tone="warning" icon="alert" title="12 quizzes pending review" sub="Mostly Customer Success Tier 1"/>
                  <AlertRow tone="info" icon="info" title="3 documents reindexing" sub="Updated versions detected"/>
                  <AlertRow tone="danger" icon="alert" title="Henrik Östberg — 1w inactive" sub="Customer Success path"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function KpiCard({ label, value, trend, sub, tone, ai }) {
  return (
    <div className={"kpi " + (ai ? "ai" : "")}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="label">{label}</div>
        {ai && <Icon name="sparkle" size={14} style={{ color: "var(--ai)" }}/>}
      </div>
      <div className="value">{value}</div>
      <div className="meta">
        {trend && <span className={"trend " + (String(trend).startsWith("-") ? "down" : "up")}>
          <Icon name={String(trend).startsWith("-") ? "chevronDown" : "chevronUp"} size={12}/>{trend}
        </span>}
        <span>{sub}</span>
      </div>
    </div>
  );
}

function ActivityList() {
  const items = [
    { who: "Maya T.", act: "uploaded", what: "Observability Guide v2", when: "2m", icon: "upload" },
    { who: "Atlas AI", act: "generated", what: "Sales Q2 path · 5 weeks", when: "1h", icon: "sparkle", ai: true },
    { who: "Daniel O.", act: "passed quiz", what: "Week 1 · 92%", when: "3h", icon: "check" },
    { who: "Priya K.", act: "approved", what: "12 quiz questions", when: "5h", icon: "check" },
    { who: "Marina V.", act: "asked AI", what: "How does SSO work?", when: "Yesterday", icon: "chat" },
  ];
  return (
    <div>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderTop: i === 0 ? 0 : "1px solid var(--border)" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: it.ai ? "var(--ai-soft)" : "var(--surface-2)", color: it.ai ? "var(--ai)" : "var(--text-2)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name={it.icon} size={14}/>
          </div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
            <strong>{it.who}</strong> <span className="muted">{it.act}</span> <span style={{ fontWeight: 500 }}>{it.what}</span>
          </div>
          <span className="muted" style={{ fontSize: 11 }}>{it.when}</span>
        </div>
      ))}
    </div>
  );
}

function AlertRow({ tone, icon, title, sub }) {
  return (
    <div className="row" style={{ alignItems: "flex-start", gap: 10 }}>
      <div style={{ width: 26, height: 26, borderRadius: 6, background: `var(--${tone}-soft)`, color: `var(--${tone})`, display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name={icon} size={14}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
        <div className="muted" style={{ fontSize: 12 }}>{sub}</div>
      </div>
    </div>
  );
}

// ============ ADMIN DASHBOARD — Command variant ============
function AdminDashboardCommand({ ctx }) {
  return (
    <>
      <Topbar crumbs={["Workspace", "Dashboard"]} actions={
        <button className="btn primary" onClick={() => ctx.nav("admin-project-create")}><Icon name="plus" size={14}/> New project</button>
      }/>
      <div className="viewport" style={{ background: "#0B1220", color: "#E2E8F0" }}>
        <div style={{ padding: "20px 28px" }}>
          {/* Header strip */}
          <div className="row" style={{ alignItems: "flex-end", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748B", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>Onboarding Operations</div>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: "white", margin: "2px 0 0", letterSpacing: "-0.02em" }}>{ORG} · live</h1>
            </div>
            <div className="row" style={{ marginLeft: "auto", gap: 8 }}>
              <Badge tone="success" dot>All systems nominal</Badge>
              <span style={{ color: "#64748B", fontSize: 12, fontFamily: "var(--font-mono)" }}>Updated 12s ago</span>
            </div>
          </div>

          {/* Big metric strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { l: "ACTIVE LEARNERS", v: "184", d: "+12", s: [40,42,55,52,58,62,68,75] },
              { l: "AVG. COMPLETION", v: "64%", d: "+8", s: [30,32,35,40,45,52,58,64] },
              { l: "READINESS", v: "78", d: "+3", s: [70,72,71,74,73,76,77,78] },
              { l: "AI MESSAGES / DAY", v: "412", d: "+22", s: [220,260,280,340,360,380,400,412] },
            ].map((m, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#64748B", letterSpacing: "0.08em", fontWeight: 600 }}>{m.l}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
                  <div style={{ fontSize: 28, fontWeight: 600, color: "white", letterSpacing: "-0.02em" }}>{m.v}</div>
                  <div style={{ fontSize: 12, color: "#6EE7B7" }}>▲ {m.d}</div>
                </div>
                <div style={{ marginTop: 8, height: 32 }}>
                  <Sparkline data={m.s} color="#60A5FA"/>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            {/* Project status grid */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 16 }}>
              <div className="row" style={{ marginBottom: 12 }}>
                <strong style={{ color: "white", fontSize: 14 }}>Projects · health</strong>
                <span style={{ color: "#64748B", fontSize: 12, marginLeft: 8 }}>6 active</span>
                <span style={{ marginLeft: "auto", color: "#94A3B8", fontSize: 11, fontFamily: "var(--font-mono)" }}>updated 12s ago</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {PROJECTS.filter(p => p.status === "Active").map(p => (
                  <div key={p.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: 12, cursor: "pointer" }} onClick={() => ctx.nav("admin-project-details")}>
                    <div className="row" style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "white" }}>{p.name}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: p.completion > 70 ? "#6EE7B7" : p.completion > 40 ? "#FCD34D" : "#FCA5A5", fontFamily: "var(--font-mono)" }}>{p.completion}%</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 99 }}>
                      <div style={{ width: p.completion + "%", height: "100%", background: p.completion > 70 ? "#22C55E" : p.completion > 40 ? "#F59E0B" : "#EF4444", borderRadius: 99 }}/>
                    </div>
                    <div className="row" style={{ marginTop: 8, fontSize: 11, color: "#94A3B8", gap: 12 }}>
                      <span>{p.users} learners</span><span>·</span><span>{p.docs} docs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Event stream */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 16, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>
              <div className="row" style={{ marginBottom: 12 }}>
                <strong style={{ color: "white", fontSize: 14, fontFamily: "var(--font-sans)" }}>Event stream</strong>
                <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, color: "#6EE7B7", fontSize: 11 }}>
                  <span style={{ width: 6, height: 6, background: "#22C55E", borderRadius: 99 }}/> LIVE
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, color: "#CBD5E1", lineHeight: 1.6 }}>
                {[
                  ["00:12", "info", "Daniel.O passed Week 2 quiz · 92%"],
                  ["00:34", "ai", "Atlas regenerated path: sales-q2"],
                  ["01:02", "info", "Henrik.O 7d inactive — flagged"],
                  ["01:18", "warn", "12 quiz Qs pending review"],
                  ["02:05", "info", "Maya.T uploaded observability-v2.pdf"],
                  ["02:41", "ai", "Tutor session: marina.v · 8 turns"],
                  ["03:12", "info", "Sofia.L completed module · 4/5"],
                  ["04:02", "info", "Aisha.B assigned to sales-q2"],
                  ["04:55", "warn", "Doc indexing slow: deploy-pipeline.pdf"],
                ].map(([t, k, m], i) => (
                  <div key={i} style={{ display: "flex", gap: 10 }}>
                    <span style={{ color: "#64748B" }}>{t}</span>
                    <span style={{ color: k === "warn" ? "#FCD34D" : k === "ai" ? "#C4B5FD" : "#60A5FA", width: 36 }}>{k.toUpperCase()}</span>
                    <span style={{ flex: 1 }}>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team status row */}
          <div style={{ marginTop: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 16 }}>
            <div className="row" style={{ marginBottom: 12 }}>
              <strong style={{ color: "white", fontSize: 14 }}>Team readiness — Platform Engineering</strong>
              <span style={{ marginLeft: "auto", color: "#64748B", fontSize: 12 }}>cohort of 18</span>
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80 }}>
              {[42,55,61,28,72,80,90,38,65,70,88,52,48,77,82,71,60,95].map((v, i) => (
                <div key={i} style={{ flex: 1, height: v + "%", background: v > 75 ? "#22C55E" : v > 50 ? "#60A5FA" : v > 30 ? "#F59E0B" : "#EF4444", borderRadius: "3px 3px 0 0", opacity: 0.9 }}/>
              ))}
            </div>
            <div className="row" style={{ marginTop: 10, fontSize: 11, color: "#64748B", justifyContent: "space-between" }}>
              <span>← Lowest readiness</span><span>Highest readiness →</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AdminDashboard({ ctx }) {
  return ctx.tweaks.dashboardVariant === "command" ? <AdminDashboardCommand ctx={ctx}/> : <AdminDashboardOverview ctx={ctx}/>;
}
window.SCREENS["admin-dashboard"] = AdminDashboard;

// ============ PROJECTS LIST ============
function AdminProjects({ ctx }) {
  const [view, setView] = useState("grid");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const projects = PROJECTS.filter(p =>
    (filter === "All" || p.status === filter) &&
    (q === "" || p.name.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <>
      <Topbar crumbs={["Workspace", "Projects"]} actions={
        <button className="btn primary" onClick={() => ctx.nav("admin-project-create")}><Icon name="plus" size={14}/> New project</button>
      }/>
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>Projects</h1>
            <div className="sub">Each project is a body of onboarding content with its own learners, paths and analytics.</div>
          </div>
        </div>
        <div style={{ padding: "0 28px 14px", display: "flex", gap: 10, alignItems: "center" }}>
          <div className="topbar-search" style={{ width: 320 }}>
            <Icon name="search" size={14}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects…"/>
          </div>
          <div className="row" style={{ gap: 6 }}>
            {["All", "Active", "Draft", "Archived"].map(f => (
              <button key={f} className={"chip " + (filter === f ? "active" : "")} onClick={() => setFilter(f)}>{f}{f === "All" && <span className="mono" style={{ marginLeft: 4 }}>{PROJECTS.length}</span>}</button>
            ))}
          </div>
          <div className="row" style={{ marginLeft: "auto", gap: 6 }}>
            <button className="btn ghost sm"><Icon name="sort" size={14}/> Sort: Updated</button>
            <div className="row" style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 2 }}>
              <button className={"btn ghost sm " + (view === "grid" ? "" : "")} style={view === "grid" ? { background: "var(--surface-2)" } : {}} onClick={() => setView("grid")}><Icon name="grid" size={14}/></button>
              <button className={"btn ghost sm"} style={view === "list" ? { background: "var(--surface-2)" } : {}} onClick={() => setView("list")}><Icon name="list" size={14}/></button>
            </div>
          </div>
        </div>

        <div className="page-body" style={{ paddingTop: 0 }}>
          {projects.length === 0 ? (
            <div className="empty card">
              <div className="illu"><Icon name="folder"/></div>
              <h3>No projects match</h3>
              <p>Try clearing filters or create a new project to get started.</p>
              <button className="btn primary"><Icon name="plus" size={14}/> Create project</button>
            </div>
          ) : view === "grid" ? (
            <div className="grid-3">
              {projects.map(p => (
                <div key={p.id} className="card" style={{ padding: 16, cursor: "pointer" }} onClick={() => ctx.nav("admin-project-details")}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center" }}><Icon name="folder" size={18}/></div>
                    <StatusBadge status={p.status}/>
                  </div>
                  <h3 style={{ margin: "12px 0 4px", fontSize: 15, fontWeight: 600 }}>{p.name}</h3>
                  <div className="muted" style={{ fontSize: 12.5, minHeight: 36 }}>{p.desc}</div>
                  <div className="sep"/>
                  <div className="row" style={{ justifyContent: "space-between", fontSize: 12, color: "var(--text-2)" }}>
                    <span><strong className="num">{p.docs}</strong> docs</span>
                    <span><strong className="num">{p.users}</strong> learners</span>
                    <span><strong className="num">{p.paths}</strong> paths</span>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div className="row" style={{ justifyContent: "space-between", fontSize: 11, marginBottom: 4, color: "var(--text-3)" }}>
                      <span>Completion</span><span className="num">{p.completion}%</span>
                    </div>
                    <Progress value={p.completion}/>
                  </div>
                  <div className="row" style={{ marginTop: 10, justifyContent: "space-between", fontSize: 11, color: "var(--text-3)" }}>
                    <span>{p.dept}</span>
                    <span>Updated {p.updated}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card flush"><table className="table"><thead><tr><th>Project</th><th>Department</th><th>Docs</th><th>Learners</th><th>Completion</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>
              {projects.map(p => (
                <tr key={p.id} onClick={() => ctx.nav("admin-project-details")} style={{ cursor: "pointer" }}>
                  <td><div className="cell-strong">{p.name}</div><div className="cell-meta">{p.desc}</div></td>
                  <td>{p.dept}</td>
                  <td className="num">{p.docs}</td>
                  <td className="num">{p.users}</td>
                  <td style={{ minWidth: 150 }}><Progress value={p.completion}/><div className="cell-meta num" style={{ marginTop: 4 }}>{p.completion}%</div></td>
                  <td><StatusBadge status={p.status}/></td>
                  <td className="cell-meta">{p.updated}</td>
                  <td className="row-actions"><button className="icon-btn"><Icon name="more" size={16}/></button></td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </div>
      </div>
    </>
  );
}
window.SCREENS["admin-projects"] = AdminProjects;

// ============ CREATE PROJECT (modal-as-page) ============
function AdminProjectCreate({ ctx }) {
  const [form, setForm] = useState({ name: "", desc: "", dept: "Engineering", owner: "Maya Tanaka", tags: ["onboarding"], status: "Draft" });
  const [error, setError] = useState(null);
  const submit = () => {
    if (!form.name) { setError("Project name is required."); return; }
    ctx.showToast("Project created");
    ctx.nav("admin-projects");
  };
  return (
    <>
      <Topbar crumbs={["Workspace", "Projects", "New"]} search={false} actions={<button className="btn" onClick={() => ctx.nav("admin-projects")}>Cancel</button>}/>
      <div className="viewport">
        <div style={{ padding: "32px 28px 60px", maxWidth: 720, margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>Create new project</h1>
          <p className="muted" style={{ marginTop: 6 }}>A project groups documents, learners and learning paths for a cohort.</p>

          <div className="card" style={{ marginTop: 22 }}>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="field">
                <label>Project name</label>
                <input className={"input " + (error ? "" : "")} placeholder="e.g. Platform Engineering Onboarding" value={form.name} onChange={e => { setForm({...form, name: e.target.value}); setError(null); }} autoFocus
                  style={error ? { borderColor: "var(--danger)", boxShadow: "0 0 0 3px rgba(185,28,28,0.12)" } : {}}/>
                {error && <div style={{ color: "var(--danger)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><Icon name="alert" size={12}/> {error}</div>}
              </div>
              <div className="field">
                <label>Description</label>
                <textarea className="textarea" placeholder="What will learners gain by completing this onboarding?" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})}/>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Department</label>
                  <select className="select" value={form.dept} onChange={e => setForm({...form, dept: e.target.value})}>
                    {["Engineering", "Customer Success", "Sales", "Security", "Design", "Operations"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Project owner</label>
                  <select className="select" value={form.owner} onChange={e => setForm({...form, owner: e.target.value})}>
                    {["Maya Tanaka", "Priya Krishnan", "Sam Vasquez", "Alex Rivera"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Tags</label>
                <div className="row" style={{ gap: 6, flexWrap: "wrap", padding: "4px 0" }}>
                  {form.tags.map(t => <span key={t} className="chip active">#{t} <Icon name="x" size={11}/></span>)}
                  <button className="chip"><Icon name="plus" size={11}/> Add tag</button>
                </div>
              </div>
              <div className="field">
                <label>Initial status</label>
                <div className="row" style={{ gap: 6 }}>
                  {["Draft", "Active"].map(s => (
                    <button key={s} className={"chip " + (form.status === s ? "active" : "")} onClick={() => setForm({...form, status: s})}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: "14px 18px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="muted" style={{ fontSize: 12 }}><Icon name="info" size={12}/> Next: upload documents and generate an AI learning path.</span>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn" onClick={() => ctx.showToast("Saved as draft")}>Save draft</button>
                <button className="btn primary" onClick={submit}>Create project</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
window.SCREENS["admin-project-create"] = AdminProjectCreate;

// ============ PROJECT DETAILS ============
function AdminProjectDetails({ ctx }) {
  const [tab, setTab] = useState("overview");
  const p = PROJECTS[0];
  return (
    <>
      <Topbar crumbs={["Projects", p.name]} actions={
        <>
          <button className="btn"><Icon name="users" size={14}/> Assign</button>
          <button className="btn ai" onClick={() => ctx.nav("admin-paths")}><Icon name="sparkle" size={14}/> Generate path</button>
        </>
      }/>
      <div className="viewport">
        <div className="page-header">
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center" }}><Icon name="folder" size={22}/></div>
          <div>
            <div className="row" style={{ gap: 8 }}>
              <h1>{p.name}</h1>
              <StatusBadge status={p.status}/>
            </div>
            <div className="sub">{p.desc} · Owner: Maya Tanaka · Updated {p.updated}</div>
          </div>
          <div className="actions">
            <button className="btn"><Icon name="edit" size={14}/> Edit</button>
            <button className="btn"><Icon name="more" size={14}/></button>
          </div>
        </div>

        <div className="page-tabs">
          {["overview","documents","paths","users","quizzes","analytics"].map(t => (
            <button key={t} className={"page-tab " + (tab === t ? "active" : "")} onClick={() => setTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>
          ))}
        </div>

        <div className="page-body">
          {tab === "overview" && (
            <div className="col" style={{ gap: 16 }}>
              <div className="grid-4">
                <KpiCard label="Documents" value={DOCUMENTS.filter(d => d.projects.includes(p.id)).length} sub="Assigned & indexed"/>
                <KpiCard label="Learners" value={p.users} sub="18 active"/>
                <KpiCard label="Paths" value={p.paths} sub="1 draft"/>
                <KpiCard label="Avg. readiness" value="82" trend="+5" sub="of 100"/>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                <div className="card">
                  <div className="card-h"><h3>Cohort progress</h3><span className="sub">Last 30 days</span></div>
                  <div className="card-body"><LineChart data={[20,28,32,35,42,48,55,60,64,68,72,78]} height={180}/></div>
                </div>
                <div className="card">
                  <div className="card-h"><h3>AI activity</h3></div>
                  <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div className="row" style={{ justifyContent: "space-between" }}><span className="muted">Tutor sessions</span><strong className="num">312</strong></div>
                    <div className="row" style={{ justifyContent: "space-between" }}><span className="muted">Quiz Qs generated</span><strong className="num">186</strong></div>
                    <div className="row" style={{ justifyContent: "space-between" }}><span className="muted">Doc citations</span><strong className="num">1,204</strong></div>
                    <div className="sep"/>
                    <AIChip>Suggest improvements</AIChip>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-h"><h3>Top assigned learners</h3></div>
                <div className="card-body flush">
                  <table className="table">
                    <thead><tr><th>Name</th><th>Progress</th><th>Readiness</th><th>Status</th><th>Last active</th></tr></thead>
                    <tbody>{LEARNERS.slice(0,5).map(l => (
                      <tr key={l.name}>
                        <td><div className="row" style={{gap:10}}><Avatar initials={l.initials} sz="sm"/><div><div className="cell-strong">{l.name}</div><div className="cell-meta">{l.role}</div></div></div></td>
                        <td><div style={{ width: 120 }}><Progress value={l.progress}/></div></td>
                        <td className="num">{l.readiness}</td>
                        <td><StatusBadge status={l.status}/></td>
                        <td className="cell-meta">{l.active}</td>
                      </tr>))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {tab === "documents" && <DocList projectId={p.id}/>}
          {tab === "paths" && <PathPreviewInline ctx={ctx}/>}
          {tab === "users" && <UserAssignInline/>}
          {tab === "quizzes" && <QuizMgmtInline/>}
          {tab === "analytics" && <AnalyticsInline/>}
        </div>
      </div>
    </>
  );
}
window.SCREENS["admin-project-details"] = AdminProjectDetails;

// Inline stubs for tab content — full versions exist elsewhere
function DocList({ compact, projectId }) {
  const docs = projectId
    ? DOCUMENTS.filter(d => d.projects.includes(projectId))
    : DOCUMENTS;
  return (
    <>
      {projectId && (
        <div className="row" style={{ marginBottom: 12, gap: 8 }}>
          <div className="topbar-search" style={{ width: 280 }}><Icon name="search" size={14}/><input placeholder="Search documents in this project…"/></div>
          <span className="muted" style={{ fontSize: 12 }}>{docs.length} document{docs.length === 1 ? "" : "s"} assigned</span>
          <div className="row" style={{ marginLeft: "auto", gap: 8 }}>
            <button className="btn"><Icon name="link" size={14}/> Attach existing</button>
            <button className="btn primary"><Icon name="upload" size={14}/> Upload here</button>
          </div>
        </div>
      )}
      {docs.length === 0 ? (
        <div className="card empty">
          <div className="illu"><Icon name="docs"/></div>
          <h3>No documents in this project yet</h3>
          <p>Upload onboarding material, or attach a document already in your workspace.</p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn"><Icon name="link" size={14}/> Attach existing</button>
            <button className="btn primary"><Icon name="upload" size={14}/> Upload</button>
          </div>
        </div>
      ) : (
        <div className="card flush">
          <table className="table">
            <thead><tr><th>Name</th><th>Version</th><th>Size</th><th>Uploader</th><th>Updated</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {docs.slice(0, compact ? 6 : docs.length).map(d => (
                <tr key={d.name}>
                  <td><div className="row" style={{ gap: 10 }}><FileIcon type={d.type}/>
                    <div><div className="cell-strong">{d.name}</div>{d.projects.length > 1 && <div className="cell-meta">Also in {d.projects.length - 1} other project{d.projects.length > 2 ? "s" : ""}</div>}</div>
                  </div></td>
                  <td className="cell-meta num">v{d.v}</td>
                  <td className="cell-meta">{d.size}</td>
                  <td className="cell-meta">{d.by}</td>
                  <td className="cell-meta">{d.at}</td>
                  <td><StatusBadge status={d.status}/></td>
                  <td className="row-actions"><button className="icon-btn" title="Detach from project"><Icon name="x" size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function PathPreviewInline({ ctx }) {
  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="ai-surface" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <Icon name="sparkle" size={18} style={{ color: "var(--ai)" }}/>
        <div style={{ flex: 1 }}><strong>4-week onboarding path generated</strong><div className="muted" style={{ fontSize: 12 }}>From 24 documents · Difficulty: Core · Threshold: 75%</div></div>
        <button className="btn"><Icon name="refresh" size={14}/> Regenerate</button>
        <button className="btn ai" onClick={() => ctx.nav("admin-path-preview")}>Open preview</button>
      </div>
      <div className="grid-2">
        {LEARNING_PATH.map(w => (
          <div key={w.week} className="card">
            <div className="card-body">
              <div className="row" style={{ justifyContent: "space-between" }}><span className="badge accent">Week {w.week}</span><span className="muted" style={{ fontSize: 12 }}>{w.duration} · {w.difficulty}</span></div>
              <h3 style={{ margin: "8px 0 4px", fontSize: 15 }}>{w.title}</h3>
              <div className="muted" style={{ fontSize: 12.5 }}>{w.topics.join(" · ")}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserAssignInline() {
  return (
    <div className="card flush">
      <div className="card-body" style={{ display: "flex", gap: 10, alignItems: "center", borderBottom: "1px solid var(--border)" }}>
        <div className="topbar-search" style={{ width: 280 }}><Icon name="search" size={14}/><input placeholder="Find people…"/></div>
        <button className="btn ghost sm"><Icon name="filter" size={14}/> Role</button>
        <span className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>{LEARNERS.length} learners</span>
      </div>
      <table className="table"><thead><tr><th><input type="checkbox"/></th><th>Name</th><th>Role</th><th>Progress</th><th>Status</th></tr></thead><tbody>
        {LEARNERS.map(l => (
          <tr key={l.name}>
            <td><input type="checkbox" defaultChecked={l.progress > 50}/></td>
            <td><div className="row" style={{ gap: 10 }}><Avatar initials={l.initials} sz="sm"/><div><div className="cell-strong">{l.name}</div><div className="cell-meta">{l.email}northwind.cloud</div></div></div></td>
            <td>{l.role}</td>
            <td style={{ minWidth: 140 }}><Progress value={l.progress}/></td>
            <td><StatusBadge status={l.status}/></td>
          </tr>
        ))}
      </tbody></table>
    </div>
  );
}

function QuizMgmtInline() {
  return (
    <div className="grid-2">
      <div className="card"><div className="card-h"><h3>Approved</h3><span className="sub">42 questions</span></div><div className="card-body muted">All questions are live in this project.</div></div>
      <div className="card"><div className="card-h"><h3>Pending review</h3><span className="sub">12 questions</span></div><div className="card-body muted">Generated from latest doc uploads. Review and approve.</div></div>
    </div>
  );
}

function AnalyticsInline() {
  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="card"><div className="card-h"><h3>Completion trend</h3></div><div className="card-body"><LineChart data={[18,22,28,33,40,46,52,58,64,68,72,78]} height={160}/></div></div>
    </div>
  );
}

// ============ DOCUMENTS ============
function AdminDocuments({ ctx }) {
  const [dragOver, setDragOver] = useState(false);
  const [view, setView] = useState("list");
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [assignModal, setAssignModal] = useState(false);

  const filtered = DOCUMENTS.filter(d => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && d.type !== typeFilter) return false;
    if (projectFilter === "unassigned") return d.projects.length === 0;
    if (projectFilter !== "all" && !d.projects.includes(projectFilter)) return false;
    return true;
  });

  const toggle = (n) => {
    const s = new Set(selected);
    s.has(n) ? s.delete(n) : s.add(n);
    setSelected(s);
  };

  // counts per project
  const countFor = (pid) => DOCUMENTS.filter(d => d.projects.includes(pid)).length;
  const unassignedCount = DOCUMENTS.filter(d => d.projects.length === 0).length;

  return (
    <>
      <Topbar crumbs={["Workspace", "Documents"]} actions={
        <>
          {selected.size > 0 && (
            <button className="btn primary" onClick={() => setAssignModal(true)}>
              <Icon name="folder" size={14}/> Assign {selected.size} to project…
            </button>
          )}
          {selected.size === 0 && <button className="btn primary"><Icon name="upload" size={14}/> Upload</button>}
        </>
      }/>
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>Documents</h1>
            <div className="sub">{DOCUMENTS.length} indexed sources. Each document can be assigned to one or more projects — Atlas only cites a document in projects it belongs to.</div>
          </div>
          <div className="actions">
            <div className="row" style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 2 }}>
              <button className="btn ghost sm" style={view === "list" ? { background: "var(--surface-2)" } : {}} onClick={() => setView("list")}><Icon name="list" size={14}/></button>
              <button className="btn ghost sm" style={view === "grid" ? { background: "var(--surface-2)" } : {}} onClick={() => setView("grid")}><Icon name="grid" size={14}/></button>
            </div>
          </div>
        </div>

        <div className="page-body">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); ctx.showToast("3 files uploaded — assign them to a project"); }}
            style={{
              border: `1.5px dashed ${dragOver ? "var(--accent)" : "var(--border-strong)"}`,
              background: dragOver ? "var(--accent-soft)" : "var(--surface-2)",
              borderRadius: 12, padding: 24, display: "flex", alignItems: "center", gap: 16,
              transition: "all 0.1s",
            }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "white", border: "1px solid var(--border)", display: "grid", placeItems: "center", color: "var(--accent)" }}><Icon name="upload" size={22}/></div>
            <div style={{ flex: 1 }}>
              <strong>Drop documents here, or click to upload</strong>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>PDF, Markdown, TXT, DOCX · max 25 MB each · You'll be asked which project(s) to assign them to</div>
            </div>
            <button className="btn primary">Choose files</button>
          </div>

          {/* Uploading row */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-h"><h3>Uploading</h3><span className="sub">3 files · assigned to Platform Engineering</span></div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <UploadingRow name="Sprint Retro Template.pdf" pct={84} stage="Uploading"/>
              <UploadingRow name="Service Catalog v12.md" pct={62} stage="Extracting"/>
              <UploadingRow name="Auth Flow Diagrams.pdf" pct={32} stage="Embedding chunks"/>
            </div>
          </div>

          {/* Project filter pills */}
          <div className="row" style={{ margin: "20px 0 8px", gap: 6, flexWrap: "wrap" }}>
            <span className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginRight: 4 }}>Project</span>
            <button className={"chip " + (projectFilter === "all" ? "active" : "")} onClick={() => setProjectFilter("all")}>All <span className="mono" style={{ marginLeft: 4 }}>{DOCUMENTS.length}</span></button>
            {PROJECTS.filter(p => p.status !== "Archived").map(p => (
              <button key={p.id} className={"chip " + (projectFilter === p.id ? "active" : "")} onClick={() => setProjectFilter(p.id)}>
                <Icon name="folder" size={11}/> {p.name} <span className="mono" style={{ marginLeft: 4 }}>{countFor(p.id)}</span>
              </button>
            ))}
            <button className={"chip " + (projectFilter === "unassigned" ? "active" : "")} onClick={() => setProjectFilter("unassigned")} style={unassignedCount > 0 ? { borderColor: "var(--warning)", color: "var(--warning)" } : {}}>
              <Icon name="alert" size={11}/> Unassigned <span className="mono" style={{ marginLeft: 4 }}>{unassignedCount}</span>
            </button>
          </div>

          {/* Type filter + search */}
          <div className="row" style={{ margin: "8px 0 12px", gap: 8 }}>
            <div className="topbar-search" style={{ width: 280 }}><Icon name="search" size={14}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…"/></div>
            {[["all","All types"],["pdf","PDF"],["md","Markdown"],["txt","Text"]].map(([v, l]) => (
              <button key={v} className={"chip " + (typeFilter === v ? "active" : "")} onClick={() => setTypeFilter(v)}>{l}</button>
            ))}
            <span className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>
              {filtered.length === DOCUMENTS.length ? `${DOCUMENTS.length} files` : `${filtered.length} of ${DOCUMENTS.length} files`}
              {selected.size > 0 && <> · <strong style={{ color: "var(--accent)" }}>{selected.size} selected</strong></>}
            </span>
          </div>

          {/* Unassigned banner */}
          {unassignedCount > 0 && projectFilter === "all" && (
            <div className="row" style={{ padding: "10px 14px", background: "var(--warning-soft)", border: "1px solid #FCD34D", borderRadius: 8, marginBottom: 12, gap: 10 }}>
              <Icon name="alert" size={16} style={{ color: "var(--warning)" }}/>
              <div style={{ flex: 1, fontSize: 13 }}>
                <strong>{unassignedCount} document{unassignedCount > 1 ? "s are" : " is"} not assigned to any project.</strong>
                <span className="muted" style={{ marginLeft: 6 }}>Assign them so they show up in learning paths and AI tutor results.</span>
              </div>
              <button className="btn sm" onClick={() => setProjectFilter("unassigned")}>Show unassigned</button>
            </div>
          )}

          {view === "list" ? (
            <div className="card flush">
              <table className="table">
                <thead><tr>
                  <th style={{ width: 32 }}><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={e => setSelected(e.target.checked ? new Set(filtered.map(d => d.name)) : new Set())}/></th>
                  <th>Document</th><th>Projects</th><th>Version</th><th>Size</th><th>Uploaded by</th><th>Updated</th><th>Status</th><th></th>
                </tr></thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={9}><div className="empty"><div className="illu"><Icon name="docs"/></div><h3>No documents match</h3><p>Try changing project or type filter.</p></div></td></tr>
                  ) : filtered.map(d => (
                    <tr key={d.name} style={{ background: selected.has(d.name) ? "var(--accent-soft)" : "" }}>
                      <td><input type="checkbox" checked={selected.has(d.name)} onChange={() => toggle(d.name)}/></td>
                      <td><div className="row" style={{ gap: 10 }}>
                        <FileIcon type={d.type}/>
                        <div><div className="cell-strong">{d.name}</div><div className="cell-meta">{d.projects.length === 0 ? "— not assigned —" : `Indexed for ${d.projects.length} project${d.projects.length > 1 ? "s" : ""}`}</div></div>
                      </div></td>
                      <td><ProjectChips projects={d.projects} ctx={ctx}/></td>
                      <td className="cell-meta num">v{d.v}</td>
                      <td className="cell-meta">{d.size}</td>
                      <td className="cell-meta">{d.by}</td>
                      <td className="cell-meta">{d.at}</td>
                      <td><StatusBadge status={d.status}/></td>
                      <td className="row-actions"><div className="row" style={{ gap: 4 }}>
                        <button className="icon-btn" title="Assign to project" onClick={() => { setSelected(new Set([d.name])); setAssignModal(true); }}><Icon name="folder" size={14}/></button>
                        <button className="icon-btn" title="Preview"><Icon name="eye" size={14}/></button>
                        <button className="icon-btn"><Icon name="more" size={14}/></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid-4">
              {filtered.map(d => (
                <div key={d.name} className="card" style={{ padding: 14, border: selected.has(d.name) ? "1.5px solid var(--accent)" : "1px solid var(--border)" }} onClick={() => toggle(d.name)}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <FileIcon type={d.type}/>
                    {d.projects.length === 0 && <Badge tone="warning">Unassigned</Badge>}
                  </div>
                  <div style={{ marginTop: 10, fontWeight: 500, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>v{d.v} · {d.size}</div>
                  <div style={{ marginTop: 10 }}><ProjectChips projects={d.projects} ctx={ctx} compact/></div>
                  <div className="row" style={{ marginTop: 10, justifyContent: "space-between" }}><StatusBadge status={d.status}/><span className="cell-meta">{d.at}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {assignModal && (
        <AssignToProjectsModal
          docNames={[...selected]}
          onClose={() => setAssignModal(false)}
          onSave={(pids) => { setAssignModal(false); ctx.showToast(`Assigned ${selected.size} document${selected.size > 1 ? "s" : ""} to ${pids.length} project${pids.length > 1 ? "s" : ""}`); setSelected(new Set()); }}
        />
      )}
    </>
  );
}

// Inline project chips for a document
function ProjectChips({ projects, ctx, compact }) {
  if (!projects || projects.length === 0) {
    return <span className="muted" style={{ fontSize: 12, fontStyle: "italic" }}>—</span>;
  }
  const shown = compact ? projects.slice(0, 1) : projects.slice(0, 3);
  const extra = projects.length - shown.length;
  return (
    <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
      {shown.map(pid => {
        const p = projectById(pid);
        if (!p) return null;
        return (
          <button key={pid} className="chip" onClick={e => { e.stopPropagation(); ctx && ctx.nav("admin-project-details"); }} style={{ padding: "2px 8px", fontSize: 11.5 }}>
            <Icon name="folder" size={10}/> {p.name.length > 22 ? p.name.slice(0, 22) + "…" : p.name}
          </button>
        );
      })}
      {extra > 0 && <span className="chip" style={{ padding: "2px 8px", fontSize: 11.5 }}>+{extra}</span>}
    </div>
  );
}

// Modal to assign docs to one or more projects
function AssignToProjectsModal({ docNames, onClose, onSave }) {
  const docs = DOCUMENTS.filter(d => docNames.includes(d.name));
  // Pre-select projects every selected doc already shares
  const sharedProjects = docs.length > 0
    ? docs.map(d => new Set(d.projects)).reduce((acc, s) => new Set([...acc].filter(x => s.has(x))))
    : new Set();
  const [picked, setPicked] = useState(new Set(sharedProjects));
  const togglePick = (pid) => { const s = new Set(picked); s.has(pid) ? s.delete(pid) : s.add(pid); setPicked(s); };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <h2>Assign documents to projects</h2>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>{docNames.length} document{docNames.length > 1 ? "s" : ""} selected</div>
            <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
              {docs.slice(0, 5).map(d => (
                <span key={d.name} className="chip" style={{ background: "var(--surface-2)" }}><FileIcon type={d.type}/> <span style={{ marginLeft: 4 }}>{d.name.length > 30 ? d.name.slice(0, 30) + "…" : d.name}</span></span>
              ))}
              {docs.length > 5 && <span className="chip">+{docs.length - 5} more</span>}
            </div>
          </div>
          <div className="field">
            <label>Projects · pick one or more</label>
            <div className="col" style={{ gap: 6, maxHeight: 320, overflow: "auto", border: "1px solid var(--border)", borderRadius: 8, padding: 6 }}>
              {PROJECTS.filter(p => p.status !== "Archived").map(p => (
                <label key={p.id} className="row" style={{ gap: 10, padding: "8px 10px", borderRadius: 6, cursor: "pointer", background: picked.has(p.id) ? "var(--accent-soft)" : "transparent" }}>
                  <input type="checkbox" checked={picked.has(p.id)} onChange={() => togglePick(p.id)}/>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center" }}><Icon name="folder" size={14}/></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{p.dept} · {p.users} learners</div>
                  </div>
                  <StatusBadge status={p.status}/>
                </label>
              ))}
            </div>
          </div>
          <label className="row" style={{ gap: 8 }}><input type="checkbox" defaultChecked/> Re-index now so AI tutor sees the new linkage immediately</label>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={picked.size === 0} onClick={() => onSave([...picked])}>
            Assign to {picked.size} project{picked.size === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}

window.SCREENS["admin-documents"] = AdminDocuments;

function UploadingRow({ name, pct, stage }) {
  return (
    <div className="row" style={{ gap: 12 }}>
      <FileIcon type="pdf"/>
      <div style={{ flex: 1 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong style={{ fontSize: 13 }}>{name}</strong>
          <span className="muted num" style={{ fontSize: 12 }}>{pct}%</span>
        </div>
        <Progress value={pct}/>
        <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{stage}…</div>
      </div>
      <button className="icon-btn"><Icon name="x" size={14}/></button>
    </div>
  );
}

// Learner: Dashboard (+variant), Paths, Module, Chapter, Quiz, AI Tutor, Readiness, Progress, Profile

// ============ LEARNER DASHBOARD ============
function LearnerDashboard({ ctx }) {
  const variant = ctx.tweaks.dashboardVariant;
  return variant === "command" ? <LearnerDashboardFocus ctx={ctx}/> : <LearnerDashboardHome ctx={ctx}/>;
}

function LearnerDashboardHome({ ctx }) {
  return (
    <>
      <Topbar crumbs={["Home"]} actions={
        <>
          <button className="btn ghost"><Icon name="bookmark" size={14}/> Bookmarks</button>
          <button className="btn ai" onClick={() => ctx.nav("learner-ai-tutor")}><Icon name="sparkle" size={14}/> Ask Atlas</button>
        </>
      }/>
      <div className="viewport">
        <div style={{ padding: "28px 28px 8px" }}>
          <div className="row" style={{ alignItems: "flex-end" }}>
            <div>
              <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Tuesday, June 3</div>
              <h1 style={{ fontSize: 26, fontWeight: 600, margin: "4px 0 0", letterSpacing: "-0.02em" }}>Welcome back, Daniel</h1>
            </div>
            <div className="row" style={{ marginLeft: "auto", gap: 8 }}>
              <Badge tone="success" dot>On track for June 28</Badge>
            </div>
          </div>
        </div>

        <div className="page-body" style={{ paddingTop: 16 }}>
          {/* Hero: Continue learning */}
          <div className="card" style={{ background: "linear-gradient(135deg, #0B1220 0%, #1E293B 100%)", color: "white", border: 0, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", right: -40, top: -40, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(109,74,255,0.3), transparent 70%)" }}/>
            <div style={{ padding: 28, position: "relative", display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>Continue learning</div>
                <h2 style={{ fontSize: 24, fontWeight: 600, margin: "6px 0 4px", letterSpacing: "-0.015em" }}>Week 2 · Services & Architecture</h2>
                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>Chapter 3 of 5 — Inter-service communication</div>
                <div className="row" style={{ marginTop: 16, gap: 8 }}>
                  <button className="btn primary lg" onClick={() => ctx.nav("learner-chapter")}><Icon name="play" size={14}/> Resume chapter</button>
                  <button className="btn lg" style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.15)", color: "white" }} onClick={() => ctx.nav("learner-module")}>View module</button>
                </div>
                <div className="row" style={{ marginTop: 18, gap: 16, color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                  <span><Icon name="clock" size={12}/> ~22 min remaining</span>
                  <span><Icon name="check" size={12}/> 2 quiz attempts allowed</span>
                  <span><Icon name="flame" size={12}/> 5-day streak</span>
                </div>
              </div>
              <div style={{ display: "grid", placeItems: "center" }}>
                <Gauge value={84} label="Progress" color="#A78BFA" size={150}/>
              </div>
            </div>
          </div>

          {/* Three columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 16, marginTop: 16 }}>
            <div className="card">
              <div className="card-h"><h3>My learning paths</h3><span className="sub">2 active</span><div className="actions"><button className="btn ghost sm" onClick={() => ctx.nav("learner-paths")}>View all <Icon name="chevronRight" size={12}/></button></div></div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <PathRow name="Platform Engineering Onboarding" project="Platform Engineering" week={2} totalWeeks={4} progress={42} status="In progress" deadline="Jun 28"/>
                <PathRow name="Security & Compliance 101" project="Security" week={1} totalWeeks={2} progress={12} status="In progress" deadline="Jul 12"/>
              </div>
            </div>

            <div className="card ai-grad-bg" style={{ borderColor: "var(--border-ai)" }}>
              <div className="card-h" style={{ borderBottomColor: "var(--border-ai)" }}>
                <Icon name="sparkle" size={14} style={{ color: "var(--ai)" }}/>
                <h3>Atlas suggests</h3>
              </div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 13 }}>Your Week 2 quiz attempts are spending most time on <strong>service-to-service auth</strong>.</div>
                <button className="btn ai sm" style={{ alignSelf: "flex-start" }}><Icon name="bulb" size={12}/> Review the auth chapter</button>
                <div className="sep"/>
                <div style={{ fontSize: 13 }}>You haven't bookmarked anything yet. Bookmark chapters to revisit before quizzes.</div>
                <button className="btn sm" style={{ alignSelf: "flex-start" }}><Icon name="bookmark" size={12}/> Show me how</button>
              </div>
            </div>

            <div className="card">
              <div className="card-h"><h3>Your readiness</h3></div>
              <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Gauge value={78} label="Readiness" size={110}/>
                <div style={{ flex: 1 }}>
                  <div className="muted" style={{ fontSize: 12 }}>Cohort average</div>
                  <div className="num" style={{ fontSize: 18, fontWeight: 600 }}>72</div>
                  <div className="trend up" style={{ marginTop: 4, fontSize: 12 }}><Icon name="chevronUp" size={12}/> +6 this week</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <div className="card">
              <div className="card-h"><h3>Up next</h3></div>
              <div className="card-body flush">
                {[
                  { i: "doc", t: "Service Mesh Patterns", s: "Chapter · Week 2 · 12 min" },
                  { i: "check", t: "Week 2 quiz", s: "10 questions · 75% to pass" },
                  { i: "doc", t: "Deployment & Observability", s: "Module · Week 3 · ~5h", locked: true },
                ].map((it, i) => (
                  <div key={i} className="row" style={{ padding: "12px 18px", borderTop: i === 0 ? 0 : "1px solid var(--border)", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: it.locked ? "var(--surface-2)" : "var(--accent-soft)", color: it.locked ? "var(--text-3)" : "var(--accent)", display: "grid", placeItems: "center" }}>
                      <Icon name={it.locked ? "lock" : it.i} size={14}/>
                    </div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{it.t}</div><div className="muted" style={{ fontSize: 12 }}>{it.s}</div></div>
                    {it.locked ? <Badge>Locked</Badge> : <button className="btn sm">Start</button>}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-h"><h3>Recent activity</h3></div>
              <div className="card-body flush"><ActivityListLearner/></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function PathRow({ name, project, week, totalWeeks, progress, status, deadline }) {
  return (
    <div className="row" style={{ gap: 14, padding: 12, background: "var(--surface-2)", borderRadius: 10 }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, background: "white", border: "1px solid var(--border)", color: "var(--accent)", display: "grid", placeItems: "center" }}><Icon name="book" size={18}/></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row" style={{ gap: 8 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{name}</div>
          <Badge tone="accent">W{week}/{totalWeeks}</Badge>
        </div>
        <div className="muted" style={{ fontSize: 11.5 }}>{project} · due {deadline}</div>
        <div style={{ marginTop: 6 }}><Progress value={progress}/></div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div className="num" style={{ fontSize: 16, fontWeight: 600 }}>{progress}%</div>
        <button className="btn sm" style={{ marginTop: 4 }}>Continue</button>
      </div>
    </div>
  );
}

function ActivityListLearner() {
  const items = [
    { i: "check", t: "Passed Week 1 quiz · 92%", s: "Yesterday" },
    { i: "chat", t: "Asked Atlas: How does our auth work?", s: "Yesterday" },
    { i: "doc", t: "Read: Service Catalog (12 min)", s: "Mon" },
    { i: "bookmark", t: "Bookmarked 'Auth Flow §2'", s: "Mon" },
    { i: "doc", t: "Started: Week 2 — Services & Architecture", s: "Last week" },
  ];
  return (
    <div>{items.map((it, i) => (
      <div key={i} className="row" style={{ padding: "10px 18px", borderTop: i === 0 ? 0 : "1px solid var(--border)", gap: 10 }}>
        <Icon name={it.i} size={14} style={{ color: "var(--text-3)" }}/>
        <div style={{ flex: 1, fontSize: 13 }}>{it.t}</div>
        <span className="muted" style={{ fontSize: 11 }}>{it.s}</span>
      </div>
    ))}</div>
  );
}

// ============ LEARNER DASHBOARD — Focus variant ============
function LearnerDashboardFocus({ ctx }) {
  return (
    <>
      <Topbar crumbs={["Home"]} search={false} actions={<button className="btn ai" onClick={() => ctx.nav("learner-ai-tutor")}><Icon name="sparkle" size={14}/> Ask Atlas</button>}/>
      <div className="viewport" style={{ display: "grid", placeItems: "center", padding: 32 }}>
        <div style={{ width: "min(720px, 100%)", textAlign: "center" }}>
          <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Up next</div>
          <h1 style={{ fontSize: 32, fontWeight: 600, margin: "8px 0 6px", letterSpacing: "-0.025em" }}>Inter-service communication</h1>
          <div className="muted" style={{ fontSize: 15 }}>Chapter 3 of 5 · Week 2 · ~22 min</div>

          <div style={{ marginTop: 36, display: "flex", justifyContent: "center", gap: 32, alignItems: "center" }}>
            <Gauge value={84} label="Module" size={130}/>
            <Gauge value={42} label="Path" size={130} color="var(--ai)"/>
            <Gauge value={78} label="Readiness" size={130} color="#15803D"/>
          </div>

          <div className="row" style={{ marginTop: 36, justifyContent: "center", gap: 10 }}>
            <button className="btn primary lg" onClick={() => ctx.nav("learner-chapter")}><Icon name="play" size={14}/> Resume chapter</button>
            <button className="btn lg" onClick={() => ctx.nav("learner-module")}>View module</button>
          </div>

          <div className="row" style={{ marginTop: 28, justifyContent: "center", gap: 24, fontSize: 13, color: "var(--text-2)" }}>
            <span><Icon name="flame" size={13} style={{ color: "var(--warning)" }}/> 5-day streak</span>
            <span>·</span>
            <span>Due in 25 days</span>
            <span>·</span>
            <span>2 quizzes remaining this path</span>
          </div>

          <div className="ai-surface" style={{ marginTop: 36, padding: 18, textAlign: "left" }}>
            <div className="row" style={{ gap: 10, marginBottom: 8 }}>
              <Icon name="sparkle" size={16} style={{ color: "var(--ai)" }}/>
              <strong style={{ fontSize: 14 }}>From Atlas</strong>
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>You've been spending a lot of time on auth flows. The next chapter walks through it step-by-step with diagrams from the platform architecture deck. I'll quiz you on it when you're done.</div>
          </div>
        </div>
      </div>
    </>
  );
}
window.SCREENS["learner-dashboard"] = LearnerDashboard;

// ============ LEARNING PATHS LIST ============
const LEARNER_PATHS = [
  { name: "Platform Engineering Onboarding", project: "Platform Engineering", weeks: 4, progress: 42, status: "In progress", currentWeek: 2, deadline: "Jun 28, 2026" },
  { name: "Security & Compliance 101", project: "Security", weeks: 2, progress: 12, status: "In progress", currentWeek: 1, deadline: "Jul 12, 2026" },
  { name: "Field Ops Playbook", project: "Operations", weeks: 3, progress: 100, status: "Completed", currentWeek: 3, deadline: "Mar 4, 2026" },
  { name: "Customer Success Tier 1", project: "Customer Success", weeks: 4, progress: 0, status: "Locked", currentWeek: 0, deadline: "Aug 1, 2026", reason: "Complete Platform Engineering first" },
];

function LearnerPaths({ ctx }) {
  return (
    <>
      <Topbar crumbs={["My Learning Paths"]}/>
      <div className="viewport">
        <div className="page-header"><div><h1>My learning paths</h1><div className="sub">2 active · 1 completed · 1 locked.</div></div></div>
        <div className="page-body">
          <div className="grid-2">
            {LEARNER_PATHS.map(p => (
              <div key={p.name} className={"card " + (p.status === "Locked" ? "locked" : "")} style={{ overflow: "hidden", cursor: p.status === "Locked" ? "not-allowed" : "pointer" }} onClick={() => p.status !== "Locked" && ctx.nav("learner-module")}>
                <div style={{ height: 76, background: p.status === "Completed" ? "linear-gradient(135deg, #15803D, #65A30D)" : p.status === "Locked" ? "var(--surface-3)" : "linear-gradient(135deg, #2563EB, #6D4AFF)", position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, opacity: 0.2, backgroundImage: "radial-gradient(circle at 80% 50%, rgba(255,255,255,0.3), transparent 60%)" }}/>
                  <div style={{ position: "absolute", left: 16, bottom: 12, color: "white", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>{p.project}</div>
                  <div style={{ position: "absolute", right: 16, top: 14 }}>
                    <StatusBadge status={p.status}/>
                  </div>
                </div>
                <div style={{ padding: 18 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{p.name}</h3>
                  <div className="row" style={{ marginTop: 6, gap: 12, color: "var(--text-3)", fontSize: 12 }}>
                    <span><Icon name="layers" size={12}/> {p.weeks} weeks</span>
                    <span><Icon name="calendar" size={12}/> Due {p.deadline}</span>
                  </div>
                  {p.status === "Locked" ? (
                    <div className="row" style={{ marginTop: 16, gap: 8, color: "var(--text-3)", fontSize: 12.5 }}><Icon name="lock" size={13}/> {p.reason}</div>
                  ) : (
                    <div style={{ marginTop: 16 }}>
                      <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                        <span className="muted" style={{ fontSize: 12 }}>Week {p.currentWeek} of {p.weeks}</span>
                        <span className="num" style={{ fontSize: 12, fontWeight: 500 }}>{p.progress}%</span>
                      </div>
                      <Progress value={p.progress} tone={p.status === "Completed" ? "success" : ""}/>
                    </div>
                  )}
                  <div className="row" style={{ marginTop: 16, justifyContent: "space-between" }}>
                    {p.status === "Completed" ? <Badge tone="success" dot>Completed ·  Readiness 95</Badge> : p.status === "Locked" ? <Badge>Available {p.deadline}</Badge> : <span className="muted" style={{ fontSize: 12 }}>Last activity 2h ago</span>}
                    {p.status === "In progress" && <button className="btn primary sm">Continue</button>}
                    {p.status === "Completed" && <button className="btn sm">Review</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
window.SCREENS["learner-paths"] = LearnerPaths;

// ============ MODULE DETAIL ============
function LearnerModule({ ctx }) {
  const chapters = [
    { n: 1, title: "Service taxonomy", min: 8, status: "Completed" },
    { n: 2, title: "API contracts & versioning", min: 14, status: "Completed" },
    { n: 3, title: "Inter-service communication", min: 22, status: "In progress" },
    { n: 4, title: "Auth between services", min: 18, status: "Available" },
    { n: 5, title: "Failure modes & circuit breakers", min: 16, status: "Available" },
    { n: 6, title: "Week 2 quiz · 10 questions", min: 12, status: "Locked", quiz: true },
  ];
  return (
    <>
      <Topbar crumbs={["Learning paths", "Platform Engineering", "Week 2"]}/>
      <div className="viewport">
        <div className="page-header">
          <button className="icon-btn" onClick={() => ctx.nav("learner-paths")}><Icon name="arrowLeft" size={16}/></button>
          <div>
            <div className="row" style={{ gap: 8 }}>
              <Badge tone="accent">Week 2</Badge>
              <h1>Services & Architecture</h1>
            </div>
            <div className="sub">5 chapters · 1 quiz · ~6 hours total · 60% complete</div>
          </div>
          <div className="actions">
            <button className="btn ai" onClick={() => ctx.nav("learner-ai-tutor")}><Icon name="sparkle" size={14}/> Ask Atlas about this module</button>
          </div>
        </div>
        <div className="page-body">
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
            <div className="col" style={{ gap: 8 }}>
              {chapters.map(c => (
                <div key={c.n} className={"card " + (c.status === "Locked" ? "locked" : "")} style={{ padding: 14, cursor: c.status === "Locked" ? "not-allowed" : "pointer" }} onClick={() => c.status !== "Locked" && !c.quiz && ctx.nav("learner-chapter")}>
                  <div className="row" style={{ gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: c.status === "Completed" ? "var(--success-soft)" : c.quiz ? "var(--surface-2)" : c.status === "In progress" ? "var(--accent-soft)" : "var(--surface-2)", color: c.status === "Completed" ? "var(--success)" : c.quiz ? "var(--text-2)" : "var(--accent)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon name={c.status === "Locked" ? "lock" : c.status === "Completed" ? "check" : c.quiz ? "check" : "doc"} size={16}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="row" style={{ gap: 8 }}>
                        <span className="muted mono" style={{ fontSize: 12 }}>{c.quiz ? "Q" : "0" + c.n}</span>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{c.title}</div>
                      </div>
                      <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{c.min} min</div>
                    </div>
                    <StatusBadge status={c.status}/>
                  </div>
                  {c.status === "In progress" && (
                    <div style={{ marginTop: 10, paddingLeft: 50 }}>
                      <Progress value={48}/>
                      <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>48% — about 12 minutes left</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="col" style={{ gap: 16 }}>
              <div className="card">
                <div className="card-h"><h3>Week 2 objectives</h3></div>
                <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Map the platform's services and their owners",
                    "Explain the request lifecycle across services",
                    "Authenticate calls correctly with x-northwind-svc-token",
                    "Recognize the 3 most common failure modes",
                  ].map((o, i) => (
                    <div key={i} className="row" style={{ gap: 8 }}>
                      <Icon name="check" size={14} style={{ color: i < 2 ? "var(--success)" : "var(--text-3)" }}/>
                      <span style={{ fontSize: 13, color: i < 2 ? "var(--text-2)" : "var(--text)", textDecoration: i < 2 ? "line-through" : "" }}>{o}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-h"><h3>Source documents</h3><span className="sub">8</span></div>
                <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {DOCUMENTS.slice(0, 5).map(d => (
                    <div key={d.name} className="row" style={{ gap: 10 }}>
                      <FileIcon type={d.type}/>
                      <div style={{ flex: 1, fontSize: 13 }}>{d.name}</div>
                      <Icon name="external" size={13} style={{ color: "var(--text-3)" }}/>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
window.SCREENS["learner-module"] = LearnerModule;

// ============ CHAPTER / READER ============
function LearnerChapter({ ctx }) {
  const [focus, setFocus] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  return (
    <>
      {!focus && <Topbar crumbs={["Week 2", "Inter-service communication"]} actions={
        <>
          <button className="btn ghost"><Icon name="bookmark" size={14}/> Bookmark</button>
          <button className="btn" onClick={() => setFocus(true)}><Icon name="expand" size={14}/> Focus mode</button>
          <button className="btn ai" onClick={() => ctx.nav("learner-ai-tutor")}><Icon name="sparkle" size={14}/> Ask Atlas</button>
        </>
      }/>}
      <div className="viewport" style={{ background: "var(--surface)" }}>
        {/* progress bar */}
        <div style={{ position: "sticky", top: 0, height: 3, background: "var(--surface-2)", zIndex: 5 }}>
          <div style={{ width: "48%", height: "100%", background: "var(--accent)" }}/>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: focus ? "1fr" : "240px 1fr 280px", gap: 0, minHeight: "calc(100vh - var(--topbar-h) - 3px)" }}>
          {/* Left: chapter nav */}
          {!focus && (
            <div style={{ borderRight: "1px solid var(--border)", padding: "24px 16px", background: "var(--bg)" }}>
              <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 12 }}>Week 2 · Chapters</div>
              <div className="col" style={{ gap: 2 }}>
                {["Service taxonomy","API contracts","Inter-service comms","Auth between services","Failure modes","Week 2 quiz"].map((t, i) => (
                  <button key={t} className={"nav-item " + (i === 2 ? "active" : "")} style={{ padding: "7px 10px" }}>
                    <span className="ico"><Icon name={i === 2 ? "play" : i < 2 ? "check" : i === 5 ? "check" : "doc"} size={14}/></span>
                    <span className="label" style={{ fontSize: 12.5 }}>{t}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Center: content */}
          <div style={{ padding: "48px 56px", maxWidth: 760, margin: "0 auto", width: "100%" }}>
            <div className="row" style={{ gap: 8, marginBottom: 14 }}>
              <Badge tone="accent">Chapter 3 · Week 2</Badge>
              <span className="muted" style={{ fontSize: 12 }}>·</span>
              <span className="muted" style={{ fontSize: 12 }}><Icon name="clock" size={11}/> 22 min read</span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.15, margin: 0 }}>Inter-service communication</h1>
            <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.6, marginTop: 16 }}>
              At Northwind Cloud, services talk to each other through three primary patterns: <strong style={{ color: "var(--text)" }}>synchronous gRPC</strong> for low-latency reads, <strong style={{ color: "var(--text)" }}>HTTP/JSON</strong> for slower or externally-facing flows, and the <strong style={{ color: "var(--text)" }}>internal event bus</strong> for fan-out writes. Picking the right one is mostly about latency tolerance and consistency requirements.
            </p>

            <h2 style={{ marginTop: 32, fontSize: 20, fontWeight: 600, letterSpacing: "-0.015em" }}>The request lifecycle</h2>
            <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.65 }}>
              Any inbound request, after auth, becomes a <span style={{ background: "#FEF3C7", padding: "1px 4px", borderRadius: 3 }}>RequestContext</span> object that propagates across every call. The context carries the originating user, trace ID, tenant, and feature-flag overrides — all of which observability tools read automatically.
            </p>

            <Placeholder ratio="16/8" label="diagram: request flow across services" style={{ marginTop: 18 }}/>

            <h2 style={{ marginTop: 32, fontSize: 20, fontWeight: 600, letterSpacing: "-0.015em" }}>Choosing a transport</h2>
            <ul style={{ paddingLeft: 18, color: "var(--text-2)", lineHeight: 1.7, fontSize: 15 }}>
              <li><strong style={{ color: "var(--text)" }}>gRPC</strong> — sub-100ms reads from the auth, billing or feature-flag services.</li>
              <li><strong style={{ color: "var(--text)" }}>HTTP/JSON</strong> — anything user-facing, or going outside the cluster.</li>
              <li><strong style={{ color: "var(--text)" }}>Event bus</strong> — write fan-out, durable jobs, audit records.</li>
            </ul>

            <div className="ai-surface" style={{ padding: 16, marginTop: 28, display: "flex", gap: 12 }}>
              <Icon name="bulb" size={18} style={{ color: "var(--ai)", flexShrink: 0, marginTop: 1 }}/>
              <div>
                <strong style={{ fontSize: 13 }}>Atlas note</strong>
                <div style={{ fontSize: 13, marginTop: 4 }}>Most new engineers default to HTTP/JSON. If your call is service-to-service and read-heavy, prefer gRPC — the perf and tooling are better.</div>
              </div>
            </div>

            {/* sticky action bar */}
            <div className="row" style={{ position: "sticky", bottom: 16, marginTop: 48, gap: 8, padding: 12, background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", borderRadius: 12 }}>
              <button className="btn ghost"><Icon name="chevronLeft" size={14}/> Previous</button>
              <button className={"btn ghost"} onClick={() => setBookmarked(!bookmarked)}>
                <Icon name="bookmark" size={14} style={{ color: bookmarked ? "var(--accent)" : "" }}/> {bookmarked ? "Bookmarked" : "Bookmark"}
              </button>
              <button className="btn ghost"><Icon name="highlight" size={14}/> Highlight</button>
              <span className="muted" style={{ marginLeft: "auto", fontSize: 12, marginRight: 8 }}>~12 min remaining</span>
              <button className="btn primary" onClick={() => ctx.showToast("Marked complete")}><Icon name="check" size={14}/> Mark complete</button>
              <button className="btn">Next <Icon name="chevronRight" size={14}/></button>
            </div>
          </div>

          {/* Right: references */}
          {!focus && (
            <div style={{ borderLeft: "1px solid var(--border)", padding: 20, background: "var(--bg)" }}>
              <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 10 }}>References</div>
              <div className="col" style={{ gap: 8 }}>
                {DOCUMENTS.slice(0,3).map(d => (
                  <div key={d.name} className="card" style={{ padding: 10 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <FileIcon type={d.type}/>
                      <div style={{ flex: 1, fontSize: 12.5, fontWeight: 500 }}>{d.name}</div>
                    </div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>cited 3× in this chapter</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginTop: 22, marginBottom: 10 }}>Your highlights</div>
              <div className="card" style={{ padding: 10, fontSize: 12.5, color: "var(--text-2)", borderLeft: "3px solid #FCD34D" }}>
                "Picking the right one is mostly about latency tolerance and consistency requirements."
              </div>
              <button className="btn ghost sm" style={{ marginTop: 14, width: "100%", justifyContent: "center" }} onClick={() => ctx.nav("learner-ai-tutor")}><Icon name="sparkle" size={14}/> Ask about this chapter</button>
            </div>
          )}
        </div>

        {focus && (
          <button className="btn" style={{ position: "fixed", top: 16, right: 16, zIndex: 50 }} onClick={() => setFocus(false)}><Icon name="collapse" size={14}/> Exit focus</button>
        )}
      </div>
    </>
  );
}
window.SCREENS["learner-chapter"] = LearnerChapter;

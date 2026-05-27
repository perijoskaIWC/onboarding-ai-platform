// Admin: AI Path Chat, Path Preview, Assign Users, Quizzes, Analytics, Users, AI Tutor Config, Settings

// ============ AI LEARNING PATH CHAT ============
function AdminPathChat({ ctx }) {
  // This screen is generated for the Platform Engineering project (p1).
  const projectDocs = DOCUMENTS.filter(d => d.projects.includes("p1"));
  const [msgs, setMsgs] = useState([
    { from: "ai", text: `I scanned ${projectDocs.length} documents assigned to Platform Engineering Onboarding. A 4-week path looks right for new engineers — heavy on services and on-call. Want me to draft it?`, cites: ["arch-overview.pdf", "runbook.md", `+${Math.max(0, projectDocs.length - 2)}`] },
    { from: "user", text: "Yes, but give Week 2 more on auth between services. Keep the threshold at 75%." },
    { from: "ai", text: "Done. I rebalanced Week 2 toward inter-service auth (added 3 chapters) and kept thresholds at 75%. Preview is live on the right.", cites: ["auth.md", "service-catalog.md"] },
  ]);
  const [input, setInput] = useState("");
  const send = () => {
    if (!input.trim()) return;
    setMsgs([...msgs, { from: "user", text: input }, { from: "ai", text: "Got it — applying that now. The preview will update in a few seconds.", cites: [] }]);
    setInput("");
  };

  return (
    <>
      <Topbar crumbs={["Projects", "Platform Engineering", "Generate path"]} actions={
        <>
          <button className="btn"><Icon name="archive" size={14}/> Save draft</button>
          <button className="btn primary" onClick={() => ctx.nav("admin-path-preview")}>Accept path <Icon name="arrow" size={14}/></button>
        </>
      }/>
      <div className="viewport" style={{ display: "grid", gridTemplateColumns: "260px 1fr 360px", overflow: "hidden", height: "calc(100vh - var(--topbar-h))" }}>

        {/* Left: docs + config */}
        <div style={{ borderRight: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "14px 14px 8px" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong style={{ fontSize: 13 }}>Source documents</strong>
              <span className="badge accent num">{projectDocs.length}</span>
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>Assigned to Platform Engineering · all indexed</div>
          </div>
          <div style={{ padding: "0 14px 8px" }}>
            <div className="topbar-search"><Icon name="search" size={14}/><input placeholder="Filter…"/></div>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "0 8px 8px" }}>
            {projectDocs.map(d => (
              <label key={d.name} className="row" style={{ padding: "6px 8px", borderRadius: 6, cursor: "pointer", gap: 8 }}>
                <input type="checkbox" defaultChecked/>
                <FileIcon type={d.type}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</div>
                  <div className="muted" style={{ fontSize: 10.5 }}>v{d.v} · {d.size}</div>
                </div>
              </label>
            ))}
            <button className="btn ghost sm" style={{ width: "100%", justifyContent: "center", marginTop: 6 }}><Icon name="plus" size={12}/> Attach more documents</button>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", padding: 12 }}>
            <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, fontWeight: 600 }}>Configuration</div>
            <div className="col" style={{ gap: 10 }}>
              <ConfigRow label="Duration" value="4 weeks"/>
              <ConfigRow label="Difficulty" value="Core"/>
              <ConfigRow label="Pass threshold" value="75%"/>
              <ConfigRow label="Quiz mode" value="Random 10"/>
              <ConfigRow label="Randomization" value="On"/>
              <ConfigRow label="Evaluation" value="Enabled"/>
            </div>
          </div>
        </div>

        {/* Center: chat */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg)" }}>
          <div className="row" style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface)", gap: 8 }}>
            <Icon name="sparkle" size={16} style={{ color: "var(--ai)" }}/>
            <strong style={{ fontSize: 14 }}>Atlas path designer</strong>
            <Badge tone="ai">Beta</Badge>
            <span className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>Conversation auto-saved</span>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "18px 18px 8px" }}>
            <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
              {msgs.map((m, i) => (
                <div key={i} className={"bubble " + m.from}>
                  {m.from === "ai" && <div className="ai-meta"><Icon name="sparkle" size={11}/> Atlas</div>}
                  <div>{m.text}</div>
                  {m.cites && m.cites.length > 0 && (
                    <div className="citations">
                      {m.cites.map(c => <span key={c} className="citation">{c}</span>)}
                    </div>
                  )}
                </div>
              ))}
              <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {["Add architecture review to Week 2", "Increase security topics", "Cut to 3 weeks", "Make beginner-friendly"].map(p => (
                  <button key={p} className="chip" onClick={() => setInput(p)}><Icon name="sparkle" size={11}/> {p}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ padding: 18, borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
            <div style={{ maxWidth: 720, margin: "0 auto", border: "1px solid var(--border-strong)", borderRadius: 12, background: "var(--surface)", padding: 10 }}>
              <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Describe how Atlas should refine the path…"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                style={{ width: "100%", border: 0, outline: 0, resize: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 13.5, minHeight: 60, padding: 0 }}/>
              <div className="row" style={{ marginTop: 6 }}>
                <button className="icon-btn"><Icon name="paperclip" size={14}/></button>
                <button className="icon-btn"><Icon name="docs" size={14}/></button>
                <Badge tone="outline">claude-sonnet-4.5</Badge>
                <button className="btn primary sm" style={{ marginLeft: "auto" }} onClick={send}><Icon name="send" size={12}/> Send</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: preview */}
        <div style={{ borderLeft: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div className="row" style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <strong style={{ fontSize: 13 }}>Path preview</strong>
            <Badge tone="warning" style={{ marginLeft: 8 }}>Draft</Badge>
            <button className="icon-btn" style={{ marginLeft: "auto" }} title="Expand" onClick={() => ctx.nav("admin-path-preview")}><Icon name="expand" size={14}/></button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {LEARNING_PATH.map(w => (
              <div key={w.week} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="badge accent">Week {w.week}</span>
                  <span className="muted" style={{ fontSize: 11 }}>{w.duration}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, marginTop: 6 }}>{w.title}</div>
                <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>{w.topics.slice(0,3).join(" · ")}</div>
              </div>
            ))}
            <div style={{ padding: 12, border: "1px dashed var(--border-strong)", borderRadius: 10, textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>
              + Final readiness evaluation
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
function ConfigRow({ label, value }) {
  return <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}>
    <span className="muted">{label}</span>
    <strong style={{ fontSize: 12 }}>{value}</strong>
  </div>;
}
window.SCREENS["admin-paths"] = AdminPathChat;

// ============ LEARNING PATH PREVIEW ============
function AdminPathPreview({ ctx }) {
  return (
    <>
      <Topbar crumbs={["Projects", "Platform Engineering", "Path preview"]} actions={
        <>
          <button className="btn"><Icon name="chat" size={14}/> Edit via chat</button>
          <button className="btn"><Icon name="refresh" size={14}/> Regenerate</button>
          <button className="btn"><Icon name="archive" size={14}/> Save draft</button>
          <button className="btn primary" onClick={() => { ctx.showToast("Path accepted"); ctx.nav("admin-assign"); }}><Icon name="check" size={14}/> Accept & assign</button>
        </>
      }/>
      <div className="viewport">
        <div className="page-header">
          <div>
            <div className="row" style={{ gap: 8 }}>
              <h1>Platform Engineering · 4-week onboarding</h1>
              <Badge tone="warning" dot>Draft</Badge>
              <Badge tone="ai" dot>AI generated</Badge>
            </div>
            <div className="sub">Sources: 24 docs · Difficulty: Core · Threshold: 75% · Generated by Atlas just now</div>
          </div>
        </div>
        <div className="page-body">
          <div className="col" style={{ gap: 16 }}>
            {LEARNING_PATH.map((w, i) => (
              <div key={w.week} className="card">
                <div className="card-body">
                  <div className="row" style={{ alignItems: "flex-start", gap: 16 }}>
                    <div style={{ width: 64, textAlign: "center" }}>
                      <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" }}>
                        <div>
                          <div style={{ fontSize: 10, opacity: 0.6 }}>WK</div>
                          <div style={{ fontSize: 22, lineHeight: 1, marginTop: 2 }}>{w.week}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <h3 style={{ margin: 0, fontSize: 17, letterSpacing: "-0.01em" }}>{w.title}</h3>
                        <div className="row" style={{ gap: 6 }}>
                          <Badge tone="outline">{w.difficulty}</Badge>
                          <Badge tone="outline"><Icon name="clock" size={11}/> {w.duration}</Badge>
                          <Badge tone="outline">Pass {w.quizThreshold}%</Badge>
                        </div>
                      </div>
                      <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>This module focuses on {w.topics[0].toLowerCase()}, {w.topics[1].toLowerCase()} and related concepts. {w.topics.length} chapters and 1 quiz unlock the next module.</div>
                      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 8 }}>
                        {w.topics.map((t, ti) => (
                          <div key={t} style={{ padding: "10px 12px", background: "var(--surface-2)", borderRadius: 8, fontSize: 12.5, display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 18, height: 18, borderRadius: 99, background: "var(--surface)", border: "1px solid var(--border)", display: "grid", placeItems: "center", fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{ti+1}</span>
                            {t}
                          </div>
                        ))}
                      </div>
                      <div className="row" style={{ marginTop: 14, gap: 6, flexWrap: "wrap" }}>
                        <span className="muted" style={{ fontSize: 12 }}>Skills:</span>
                        {w.skills.map(s => <Badge tone="accent" key={s}>{s}</Badge>)}
                        <button className="btn ghost sm" style={{ marginLeft: "auto" }}><Icon name="edit" size={13}/> Refine</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="ai-surface" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "white", color: "var(--ai)", display: "grid", placeItems: "center" }}><Icon name="target" size={22}/></div>
              <div style={{ flex: 1 }}>
                <strong>Final readiness evaluation</strong>
                <div className="muted" style={{ fontSize: 12.5 }}>20 mixed-format questions across all weeks. Pass at 80% to be marked production-ready.</div>
              </div>
              <Badge tone="ai">Required</Badge>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
window.SCREENS["admin-path-preview"] = AdminPathPreview;

// ============ ASSIGN USERS ============
function AdminAssign({ ctx }) {
  const [selected, setSelected] = useState(new Set(["Daniel Okafor", "Sofia Lehmann", "Yusuf Aydın"]));
  const [showModal, setShowModal] = useState(false);
  const toggle = (n) => {
    const s = new Set(selected);
    s.has(n) ? s.delete(n) : s.add(n);
    setSelected(s);
  };
  return (
    <>
      <Topbar crumbs={["Projects", "Platform Engineering", "Assign users"]} actions={
        <>
          <button className="btn" disabled={selected.size === 0}>Bulk action</button>
          <button className="btn primary" disabled={selected.size === 0} onClick={() => setShowModal(true)}><Icon name="users" size={14}/> Assign {selected.size}</button>
        </>
      }/>
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>Assign learners</h1>
            <div className="sub">Select people, then assign them to the 4-week Platform Engineering path with a deadline.</div>
          </div>
        </div>
        <div style={{ padding: "0 28px 12px", display: "flex", gap: 10, alignItems: "center" }}>
          <div className="topbar-search" style={{ width: 320 }}><Icon name="search" size={14}/><input placeholder="Search by name or email…"/></div>
          <button className="chip active">All roles</button>
          <button className="chip">Engineering</button>
          <button className="chip">Customer Success</button>
          <button className="chip">Sales</button>
          <div className="row" style={{ marginLeft: "auto", gap: 8 }}>
            {selected.size > 0 && <span style={{ background: "var(--accent-soft)", color: "var(--accent)", padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500 }}>{selected.size} selected</span>}
            <button className="btn ghost sm"><Icon name="filter" size={14}/> More filters</button>
          </div>
        </div>

        <div className="page-body" style={{ paddingTop: 4 }}>
          <div className="card flush">
            <table className="table">
              <thead><tr>
                <th style={{ width: 32 }}><input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(LEARNERS.map(l => l.name)) : new Set())}/></th>
                <th>Person</th><th>Role</th><th>Department</th><th>Current path</th><th>Status</th><th></th>
              </tr></thead>
              <tbody>
                {LEARNERS.map(l => (
                  <tr key={l.name} onClick={() => toggle(l.name)} style={{ cursor: "pointer", background: selected.has(l.name) ? "var(--accent-soft)" : "" }}>
                    <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(l.name)} onChange={() => toggle(l.name)}/></td>
                    <td><div className="row" style={{ gap: 10 }}><Avatar initials={l.initials} sz="sm"/><div><div className="cell-strong">{l.name}</div><div className="cell-meta">{l.email}northwind.cloud</div></div></div></td>
                    <td><Badge tone="outline">{l.role}</Badge></td>
                    <td>{l.proj}</td>
                    <td><span className="muted">— None —</span></td>
                    <td><StatusBadge status={l.status}/></td>
                    <td className="row-actions"><button className="icon-btn"><Icon name="more" size={14}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-h"><h2>Assign to learning path</h2><button className="icon-btn" onClick={() => setShowModal(false)}><Icon name="x" size={16}/></button></div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                {[...selected].slice(0,6).map(n => (
                  <span key={n} className="chip active">{n} <Icon name="x" size={11}/></span>
                ))}
                {selected.size > 6 && <span className="chip">+{selected.size-6}</span>}
              </div>
              <div className="field">
                <label>Learning path</label>
                <select className="select" defaultValue="platform">
                  <option value="platform">Platform Engineering · 4 weeks</option>
                  <option>Security & Compliance 101 · 2 weeks</option>
                </select>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Start date</label>
                  <input className="input" type="date" defaultValue="2026-06-01"/>
                </div>
                <div className="field">
                  <label>Deadline</label>
                  <input className="input" type="date" defaultValue="2026-06-28"/>
                </div>
              </div>
              <label className="row" style={{ gap: 8 }}><input type="checkbox" defaultChecked/> Notify via email</label>
              <label className="row" style={{ gap: 8 }}><input type="checkbox"/> Send weekly reminder until completion</label>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn primary" onClick={() => { setShowModal(false); ctx.showToast(`Assigned ${selected.size} learners`); }}>Assign {selected.size}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
window.SCREENS["admin-assign"] = AdminAssign;

// ============ QUIZ MANAGEMENT ============
const QUIZ_QUESTIONS = [
  { q: "Which header is required for service-to-service auth in our platform?", a: "x-northwind-svc-token", opts: ["Authorization: Bearer", "x-northwind-svc-token", "X-API-Key", "Cookie"], diff: "Core", tags: ["Auth", "Services"], status: "pending", src: "auth.md §2.3" },
  { q: "What is the default circuit-breaker timeout in the service mesh?", a: "5s", opts: ["1s", "5s", "10s", "30s"], diff: "Core", tags: ["Services"], status: "pending", src: "service-catalog.md" },
  { q: "Where is the on-call rotation defined?", a: "PagerDuty schedule 'platform-primary'", opts: ["Confluence wiki", "PagerDuty schedule 'platform-primary'", "Slack #oncall", "GitHub teams"], diff: "Intro", tags: ["On-call"], status: "approved", src: "runbook.md" },
  { q: "After a SEV-2, by when must the postmortem doc be drafted?", a: "Within 5 business days", opts: ["Within 24h", "Within 5 business days", "Within 2 weeks", "No SLA"], diff: "Applied", tags: ["Incidents"], status: "approved", src: "postmortems-q1.pdf" },
  { q: "Which metric is the SLO for the auth service?", a: "p99 < 250ms", opts: ["p50 < 100ms", "p99 < 250ms", "Throughput > 5k/s", "Error rate < 1%"], diff: "Core", tags: ["Auth"], status: "rejected", src: "auth.md §4.1" },
];

function AdminQuizzes({ ctx }) {
  const [tab, setTab] = useState("pending");
  const [open, setOpen] = useState(0);
  const filtered = QUIZ_QUESTIONS.filter(q => q.status === tab);
  return (
    <>
      <Topbar crumbs={["Workspace", "Quizzes"]} actions={
        <>
          <button className="btn"><Icon name="cog" size={14}/> Quiz policy</button>
          <button className="btn ai"><Icon name="sparkle" size={14}/> Generate 20 questions</button>
        </>
      }/>
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>Quiz management</h1>
            <div className="sub">Review AI-generated questions, tune difficulty, and approve for use across paths.</div>
          </div>
        </div>
        <div className="page-tabs">
          {[
            ["pending", "Pending review", 12],
            ["approved", "Approved", 42],
            ["rejected", "Rejected", 6],
          ].map(([t, l, n]) => (
            <button key={t} className={"page-tab " + (tab === t ? "active" : "")} onClick={() => { setTab(t); setOpen(0); }}>
              {l} <span className="badge" style={{ marginLeft: 4 }}>{n}</span>
            </button>
          ))}
        </div>

        <div className="page-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 16, alignItems: "flex-start" }}>
            <div className="card flush">
              {filtered.length === 0 ? (
                <div className="empty"><div className="illu"><Icon name="check"/></div><h3>All caught up</h3><p>No questions waiting in this bucket.</p></div>
              ) : filtered.map((q, i) => (
                <div key={i} onClick={() => setOpen(i)} style={{ padding: 16, borderBottom: "1px solid var(--border)", cursor: "pointer", background: open === i ? "var(--accent-soft)" : "" }}>
                  <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                    <Badge tone="outline">{q.diff}</Badge>
                    {q.tags.map(t => <Badge tone="default" key={t}>#{t}</Badge>)}
                    <span className="muted mono" style={{ fontSize: 11, marginLeft: "auto" }}>{q.src}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{q.q}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>4 options · 1 correct · explanation included</div>
                </div>
              ))}
            </div>

            {/* Editor */}
            {filtered[open] && (
              <div className="card" style={{ position: "sticky", top: 0 }}>
                <div className="card-h">
                  <h3>Question editor</h3>
                  <span className="sub">#{open+1} of {filtered.length}</span>
                  <div className="actions">
                    <button className="icon-btn"><Icon name="chevronLeft" size={14}/></button>
                    <button className="icon-btn"><Icon name="chevronRight" size={14}/></button>
                  </div>
                </div>
                <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="field">
                    <label>Question</label>
                    <textarea className="textarea" defaultValue={filtered[open].q}/>
                  </div>
                  <div className="field">
                    <label>Options · pick correct answer</label>
                    {filtered[open].opts.map((o, i) => (
                      <div key={i} className="row" style={{ gap: 8, marginTop: 6, padding: 8, background: o === filtered[open].a ? "var(--success-soft)" : "var(--surface-2)", borderRadius: 6, border: o === filtered[open].a ? "1px solid #86EFAC" : "1px solid transparent" }}>
                        <input type="radio" name="ans" defaultChecked={o === filtered[open].a}/>
                        <span style={{ flex: 1, fontSize: 13 }}>{o}</span>
                        {o === filtered[open].a && <Badge tone="success">Correct</Badge>}
                      </div>
                    ))}
                  </div>
                  <div className="field">
                    <label>Explanation</label>
                    <textarea className="textarea" defaultValue="The platform uses a custom signed token to authenticate service-to-service calls — Authorization Bearer is reserved for end-user auth."/>
                  </div>
                  <div className="grid-2">
                    <div className="field"><label>Difficulty</label><select className="select" defaultValue={filtered[open].diff}><option>Intro</option><option>Core</option><option>Applied</option></select></div>
                    <div className="field"><label>Tags</label><input className="input" defaultValue={filtered[open].tags.map(t=>"#"+t).join(" ")}/></div>
                  </div>
                  <div className="row" style={{ gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                    <button className="btn danger" onClick={() => ctx.showToast("Question rejected")}><Icon name="x" size={14}/> Reject</button>
                    <button className="btn" onClick={() => ctx.showToast("Saved")}>Save</button>
                    <button className="btn primary" onClick={() => ctx.showToast("Approved")}><Icon name="check" size={14}/> Approve</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
window.SCREENS["admin-quizzes"] = AdminQuizzes;

// ============ ANALYTICS ============
function AdminAnalytics() {
  return (
    <>
      <Topbar crumbs={["Workspace", "Analytics"]} actions={<button className="btn"><Icon name="download" size={14}/> Export CSV</button>}/>
      <div className="viewport">
        <div className="page-header">
          <div>
            <h1>Analytics</h1>
            <div className="sub">Adoption, learning effectiveness and AI usage across all projects.</div>
          </div>
          <div className="actions">
            <select className="select" style={{ width: 180 }}><option>All projects</option><option>Platform Engineering</option></select>
            <div className="row" style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 2 }}>
              {["7d","30d","90d","YTD"].map(p => <button key={p} className={"btn ghost sm " + (p === "30d" ? "" : "")} style={p === "30d" ? { background: "var(--surface-2)" } : {}}>{p}</button>)}
            </div>
          </div>
        </div>
        <div className="page-body">
          <div className="kpi-grid" style={{ marginBottom: 16 }}>
            <KpiCard label="Completion rate" value="64%" trend="+8" sub="of assigned learners"/>
            <KpiCard label="Quiz pass rate" value="78%" trend="+2" sub="first attempt"/>
            <KpiCard label="Avg. readiness" value="78" trend="+3" sub="of 100"/>
            <KpiCard label="Drop-off rate" value="9%" trend="-2" sub="at Week 2"/>
            <KpiCard label="Avg. learning time" value="3.4h" sub="per week"/>
            <KpiCard label="AI tutor usage" value="2.4k" sub="messages this week" ai/>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <div className="card">
              <div className="card-h"><h3>Completion trend</h3><span className="sub">12 weeks</span><div className="actions"><Badge tone="accent" dot>Completion</Badge><Badge tone="ai" dot>AI use</Badge></div></div>
              <div className="card-body"><LineChart data={[18,22,28,33,40,46,52,58,64,68,72,78]} height={180}/></div>
            </div>
            <div className="card">
              <div className="card-h"><h3>Quiz scores by week</h3></div>
              <div className="card-body"><BarChart data={[{l:"W1",v:84},{l:"W2",v:67,dim:true},{l:"W3",v:78},{l:"W4",v:82}]} height={180}/></div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginTop: 16 }}>
            <div className="card">
              <div className="card-h"><h3>Topic mastery heatmap</h3><span className="sub">% correct on first attempt</span></div>
              <div className="card-body">
                <Heatmap
                  rows={["Architecture", "Auth", "Deploy", "Observability", "On-call", "Incidents"]}
                  cols={["W1","W2","W3","W4","Final"]}
                  data={[
                    [82,67,72,78,84],
                    [76,52,68,71,72],
                    [88,80,74,82,86],
                    [70,72,68,79,77],
                    [85,82,80,88,90],
                    [72,68,76,80,82],
                  ]}
                />
              </div>
            </div>
            <div className="card">
              <div className="card-h"><h3>Top learners</h3></div>
              <div className="card-body flush">
                <table className="table">
                  <tbody>{LEARNERS.slice().sort((a,b)=>b.readiness-a.readiness).slice(0,6).map((l, i) => (
                    <tr key={l.name}>
                      <td style={{ width: 24 }} className="muted mono">{i+1}</td>
                      <td><div className="row" style={{ gap: 8 }}><Avatar initials={l.initials} sz="sm"/><span className="cell-strong">{l.name}</span></div></td>
                      <td className="num">{l.readiness}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-h"><h3>Weakest topics</h3><span className="sub">Sorted by first-attempt failures</span></div>
            <div className="card-body flush">
              <table className="table">
                <thead><tr><th>Topic</th><th>Cohort</th><th>First-attempt pass</th><th>AI questions / wk</th><th>Suggested action</th></tr></thead>
                <tbody>
                  {[
                    ["Service-to-service auth","Platform Eng",52,128,"Add focused chapter"],
                    ["Circuit breakers","Platform Eng",61,72,"Re-explain in plain language"],
                    ["SLA escalation","CS Tier 1",58,94,"Add 5 review questions"],
                    ["Pricing objections","Sales Q2",64,55,"Add case study"],
                  ].map(r => (
                    <tr key={r[0]}>
                      <td className="cell-strong">{r[0]}</td>
                      <td className="cell-meta">{r[1]}</td>
                      <td><div className="row"><div style={{ flex: 1 }}><Progress value={r[2]} tone={r[2] > 70 ? "" : "warning"}/></div><span className="num cell-meta" style={{ width: 36, textAlign: "right" }}>{r[2]}%</span></div></td>
                      <td className="num">{r[3]}</td>
                      <td><AIChip>{r[4]}</AIChip></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
window.SCREENS["admin-analytics"] = AdminAnalytics;

// ============ USERS ============
function AdminUsers() {
  return (
    <>
      <Topbar crumbs={["Workspace", "Users"]} actions={
        <>
          <button className="btn"><Icon name="download" size={14}/> Export</button>
          <button className="btn primary"><Icon name="plus" size={14}/> Invite</button>
        </>
      }/>
      <div className="viewport">
        <div className="page-header">
          <div><h1>Users</h1><div className="sub">{LEARNERS.length} active across your workspace. Managed by Microsoft Entra.</div></div>
        </div>
        <div style={{ padding: "0 28px 12px", display: "flex", gap: 10 }}>
          <div className="topbar-search" style={{ width: 320 }}><Icon name="search" size={14}/><input placeholder="Search by name, email, role…"/></div>
          <button className="chip active">All</button>
          <button className="chip">Engineering</button>
          <button className="chip">Customer Success</button>
          <button className="chip">Sales</button>
          <button className="chip">Security</button>
        </div>
        <div className="page-body" style={{ paddingTop: 4 }}>
          <div className="card flush">
            <table className="table">
              <thead><tr>
                <th style={{ width: 32 }}><input type="checkbox"/></th>
                <th>Name</th><th>Role</th><th>Assigned project</th><th>Progress</th><th>Readiness</th><th>Status</th><th>Last active</th><th></th>
              </tr></thead>
              <tbody>
                {LEARNERS.map(l => (
                  <tr key={l.name}>
                    <td><input type="checkbox"/></td>
                    <td><div className="row" style={{ gap: 10 }}><Avatar initials={l.initials} sz="sm"/><div><div className="cell-strong">{l.name}</div><div className="cell-meta">{l.email}northwind.cloud</div></div></div></td>
                    <td><Badge tone="outline">{l.role}</Badge></td>
                    <td>{l.proj}</td>
                    <td style={{ minWidth: 130 }}><Progress value={l.progress}/><div className="cell-meta num" style={{ marginTop: 4 }}>{l.progress}%</div></td>
                    <td className="num">{l.readiness}</td>
                    <td><StatusBadge status={l.status}/></td>
                    <td className="cell-meta">{l.active}</td>
                    <td className="row-actions"><button className="icon-btn"><Icon name="more" size={14}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
window.SCREENS["admin-users"] = AdminUsers;

// ============ AI TUTOR CONFIG ============
function AdminAIConfig() {
  return (
    <>
      <Topbar crumbs={["Workspace", "AI Tutor Config"]} actions={<button className="btn primary"><Icon name="check" size={14}/> Save changes</button>}/>
      <div className="viewport">
        <div className="page-header">
          <div className="row" style={{ gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--ai-soft)", color: "var(--ai)", display: "grid", placeItems: "center" }}><Icon name="sparkle" size={22}/></div>
            <div>
              <h1>AI Tutor configuration</h1>
              <div className="sub">Control how the Atlas tutor answers, what it cites and when it escalates to a human.</div>
            </div>
          </div>
        </div>
        <div className="page-body">
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24 }}>
            <nav className="col" style={{ gap: 2 }}>
              {["Knowledge sources", "Tone & style", "Guardrails", "Model & limits", "Escalation", "Feedback logs"].map((s, i) => (
                <button key={s} className={"nav-item " + (i === 0 ? "active" : "")} style={{ padding: "8px 12px" }}>
                  <span className="ico"><Icon name={["docs","chat","shield","cog","alert","list"][i]} size={14}/></span>
                  <span className="label">{s}</span>
                </button>
              ))}
            </nav>
            <div className="col" style={{ gap: 16 }}>
              <ConfigCard title="Allowed documents" sub="The tutor will only cite from these indexed sources.">
                <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                  <button className="chip active">All indexed docs · 24</button>
                  <button className="chip">Pick by tag</button>
                  <button className="chip">Pick by folder</button>
                </div>
                <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>Atlas will never answer from outside this set, except for general greetings.</div>
              </ConfigCard>

              <ConfigCard title="Strict source mode" sub="Refuse to answer if no source supports the question.">
                <Switch on label="Enabled · recommended for compliance content"/>
              </ConfigCard>

              <ConfigCard title="Tone" sub="How should answers sound?">
                <div className="row" style={{ gap: 6 }}>
                  {["Concise","Friendly","Formal","Coaching"].map(t => <button key={t} className={"chip " + (t === "Coaching" ? "active" : "")}>{t}</button>)}
                </div>
              </ConfigCard>

              <ConfigCard title="Response style" sub="Structure of answers.">
                <div className="row" style={{ gap: 6 }}>
                  {["Bullets","Prose","Step-by-step","Q&A"].map(t => <button key={t} className={"chip " + (t === "Step-by-step" ? "active" : "")}>{t}</button>)}
                </div>
              </ConfigCard>

              <ConfigCard title="Escalation rule" sub="When the tutor can't help, it routes to a human.">
                <div className="field"><label>Slack channel</label><input className="input" defaultValue="#onboarding-help"/></div>
                <div className="row" style={{ marginTop: 10, gap: 12 }}>
                  <Switch on label="Auto-escalate after 3 failed turns"/>
                </div>
              </ConfigCard>

              <ConfigCard title="Model & limits" sub="Choose the foundation model and per-learner budget.">
                <div className="grid-2">
                  <div className="field"><label>Model</label><select className="select"><option>claude-sonnet-4.5 (recommended)</option><option>claude-haiku-4.5</option><option>gpt-5-mini</option></select></div>
                  <div className="field"><label>Daily message cap / learner</label><input className="input" defaultValue="80"/></div>
                </div>
              </ConfigCard>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
function ConfigCard({ title, sub, children }) {
  return (
    <div className="card">
      <div className="card-h"><h3>{title}</h3><span className="sub">{sub}</span></div>
      <div className="card-body">{children}</div>
    </div>
  );
}
function Switch({ on, label }) {
  const [v, setV] = useState(!!on);
  return (
    <div className="row" style={{ gap: 10, cursor: "pointer" }} onClick={() => setV(!v)}>
      <div className={"toggle " + (v ? "on" : "")}/>
      <span style={{ fontSize: 13 }}>{label}</span>
    </div>
  );
}
window.SCREENS["admin-ai-config"] = AdminAIConfig;

// ============ SETTINGS ============
function AdminSettings() {
  return (
    <>
      <Topbar crumbs={["Workspace", "Settings"]}/>
      <div className="viewport">
        <div className="page-header"><div><h1>Workspace settings</h1><div className="sub">Configure your Atlas workspace.</div></div></div>
        <div className="page-body">
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24 }}>
            <nav className="col" style={{ gap: 2 }}>
              {[["General","cog"],["Members","users"],["Authentication","shield"],["Branding","star"],["Integrations","link"],["Billing","trophy"]].map(([s,ic], i) => (
                <button key={s} className={"nav-item " + (i === 0 ? "active" : "")} style={{ padding: "8px 12px" }}>
                  <span className="ico"><Icon name={ic} size={14}/></span><span className="label">{s}</span>
                </button>
              ))}
            </nav>
            <div className="col" style={{ gap: 16 }}>
              <ConfigCard title="Workspace name" sub="Shown to learners and in emails.">
                <input className="input" defaultValue={ORG}/>
              </ConfigCard>
              <ConfigCard title="Default language" sub="Used for AI tutor and UI defaults.">
                <select className="select" defaultValue="en"><option value="en">English (US)</option><option value="de">Deutsch</option><option value="ja">日本語</option></select>
              </ConfigCard>
              <ConfigCard title="Authentication" sub="MS Entra is connected.">
                <div className="row" style={{ gap: 10 }}>
                  <Icon name="microsoft" size={20} style={{ color: "#0078D4" }}/>
                  <div style={{ flex: 1 }}><strong>Microsoft Entra ID</strong><div className="muted" style={{ fontSize: 12 }}>tenant: northwindcloud.onmicrosoft.com</div></div>
                  <Badge tone="success" dot>Connected</Badge>
                </div>
              </ConfigCard>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
window.SCREENS["admin-settings"] = AdminSettings;

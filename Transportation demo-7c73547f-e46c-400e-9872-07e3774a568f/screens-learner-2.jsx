// Learner: Quiz, Quiz Result, AI Tutor, Readiness, Progress, Profile

// ============ QUIZ ============
const QUIZ_LIVE = [
  { q: "Which header is required for service-to-service auth in our platform?", opts: ["Authorization: Bearer <token>", "x-northwind-svc-token", "X-API-Key", "Cookie: session=…"], a: 1, expl: "Northwind uses a custom signed token for service-to-service. Bearer is reserved for end-user auth." },
  { q: "What is the default circuit-breaker timeout in the service mesh?", opts: ["1s", "5s", "10s", "30s"], a: 1, expl: "Default is 5 seconds. Override with `mesh.timeout` if a downstream is known to be slow." },
  { q: "Which transport should you pick for a low-latency service-to-service read?", opts: ["HTTP/JSON", "gRPC", "Event bus", "Webhook"], a: 1, expl: "gRPC has better latency and tooling for internal reads." },
  { q: "Where is the on-call rotation defined?", opts: ["Confluence wiki", "PagerDuty schedule 'platform-primary'", "Slack #oncall", "GitHub teams"], a: 1, expl: "PagerDuty is the source of truth. The wiki and Slack are downstream readers." },
  { q: "After a SEV-2, by when must the postmortem doc be drafted?", opts: ["Within 24h", "Within 5 business days", "Within 2 weeks", "No SLA"], a: 1, expl: "5 business days for SEV-2; SEV-1 is 48 hours." },
];

function LearnerQuiz({ ctx }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(540);
  useEffect(() => {
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const q = QUIZ_LIVE[i];
  const total = QUIZ_LIVE.length;
  const answered = Object.keys(answers).length;

  if (submitted) { ctx.nav("learner-quiz-result"); return null; }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <>
      {/* Custom top bar without sidebar nav distractions */}
      <div className="topbar">
        <div className="crumbs">
          <span>Week 2 quiz</span>
          <Icon name="chevronRight" size={12} className="sep"/>
          <strong>Question {i+1} of {total}</strong>
        </div>
        <div className="actions">
          <Badge tone="warning"><Icon name="clock" size={11}/> {mm}:{ss}</Badge>
          <button className="btn" onClick={() => ctx.nav("learner-module")}>Save & exit</button>
        </div>
      </div>
      <div className="viewport" style={{ background: "var(--bg)" }}>
        {/* progress */}
        <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "12px 28px" }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <span className="muted" style={{ fontSize: 12 }}>{answered} of {total} answered</span>
            <span className="muted num" style={{ fontSize: 12 }}>{Math.round((answered/total)*100)}%</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {QUIZ_LIVE.map((_, idx) => (
              <button key={idx} onClick={() => setI(idx)} style={{
                flex: 1, height: 4, borderRadius: 99, border: 0, cursor: "pointer", padding: 0,
                background: idx === i ? "var(--accent)" : answers[idx] != null ? "#86EFAC" : "var(--surface-3)",
              }}/>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 28px" }}>
          <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Question {i+1}</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.3, margin: "8px 0 24px" }}>{q.q}</h1>

          <div className="col" style={{ gap: 10 }}>
            {q.opts.map((o, oi) => (
              <button key={oi} onClick={() => setAnswers({ ...answers, [i]: oi })}
                style={{
                  textAlign: "left", padding: "14px 16px", borderRadius: 12,
                  background: answers[i] === oi ? "var(--accent-soft)" : "var(--surface)",
                  border: answers[i] === oi ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                  display: "flex", alignItems: "center", gap: 12, fontSize: 14,
                  boxShadow: answers[i] === oi ? "0 0 0 4px rgba(37,99,235,0.10)" : "var(--shadow-xs)",
                  transition: "all 0.08s",
                }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", border: answers[i] === oi ? "1.5px solid var(--accent)" : "1.5px solid var(--border-strong)", display: "grid", placeItems: "center", flexShrink: 0, background: answers[i] === oi ? "var(--accent)" : "transparent" }}>
                  {answers[i] === oi && <Icon name="check" size={12} style={{ color: "white" }}/>}
                </div>
                <span style={{ fontWeight: answers[i] === oi ? 500 : 400, flex: 1 }}>{o}</span>
                <span className="mono muted" style={{ fontSize: 11 }}>{String.fromCharCode(65+oi)}</span>
              </button>
            ))}
          </div>

          <div className="row" style={{ marginTop: 32, justifyContent: "space-between" }}>
            <button className="btn" disabled={i === 0} onClick={() => setI(i-1)}><Icon name="chevronLeft" size={14}/> Previous</button>
            <button className="btn ghost"><Icon name="flag" size={14}/> Flag for review</button>
            {i < total-1
              ? <button className="btn primary" onClick={() => setI(i+1)}>Next <Icon name="chevronRight" size={14}/></button>
              : <button className="btn primary" onClick={() => setSubmitted(true)}>Submit quiz <Icon name="check" size={14}/></button>}
          </div>
        </div>
      </div>
    </>
  );
}
window.SCREENS["learner-quizzes"] = LearnerQuiz;

// ============ QUIZ RESULT ============
function LearnerQuizResult({ ctx }) {
  const score = 88;
  const passed = score >= 75;
  return (
    <>
      <Topbar crumbs={["Week 2 quiz", "Results"]}/>
      <div className="viewport" style={{ background: "var(--bg)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 28px 64px" }}>
          <div className="card" style={{ padding: 32, textAlign: "center", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: passed ? "radial-gradient(circle at 50% 0%, rgba(34,197,94,0.10), transparent 60%)" : "radial-gradient(circle at 50% 0%, rgba(220,38,38,0.10), transparent 60%)" }}/>
            <div style={{ position: "relative" }}>
              <div style={{ width: 64, height: 64, borderRadius: 99, background: passed ? "var(--success-soft)" : "var(--danger-soft)", color: passed ? "var(--success)" : "var(--danger)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
                <Icon name={passed ? "check" : "x"} size={32}/>
              </div>
              <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{passed ? "Passed" : "Not yet"}</div>
              <h1 style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.025em", margin: "8px 0 4px", fontVariantNumeric: "tabular-nums" }}>{score}%</h1>
              <div className="muted" style={{ fontSize: 14 }}>{passed ? "Next module unlocked — great work!" : "75% needed to pass. You can retry up to 3 times."}</div>
              <div className="row" style={{ marginTop: 24, justifyContent: "center", gap: 8 }}>
                <button className="btn">Review answers</button>
                {passed
                  ? <button className="btn primary" onClick={() => ctx.nav("learner-module")}>Continue to Week 3 <Icon name="arrow" size={14}/></button>
                  : <button className="btn primary">Retry quiz</button>}
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <div className="card-h"><h3>Strongest areas</h3></div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[["Service taxonomy",100],["On-call basics",100],["API contracts",80]].map(([n, v]) => (
                  <div key={n}>
                    <div className="row" style={{ justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span>{n}</span><strong className="num">{v}%</strong></div>
                    <Progress value={v} tone="success"/>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-h"><h3>Weak areas</h3><span className="sub">Atlas suggests reviewing</span></div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div className="row" style={{ justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span>Service-to-service auth</span><strong className="num">60%</strong></div>
                  <Progress value={60} tone="warning"/>
                </div>
                <button className="btn ai sm" style={{ marginTop: 6 }}><Icon name="bulb" size={12}/> Review chapter 4 — Auth between services</button>
              </div>
            </div>
          </div>

          <div className="card ai-grad-bg" style={{ marginTop: 16, borderColor: "var(--border-ai)" }}>
            <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Icon name="sparkle" size={20} style={{ color: "var(--ai)" }}/>
              <div style={{ flex: 1 }}>
                <strong>Atlas explanation</strong>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>Your one wrong answer was on the auth header. Bearer tokens are for end-users — services use a signed token in <span className="mono">x-northwind-svc-token</span>. Want a 3-minute refresher?</div>
              </div>
              <button className="btn ai">Start refresher</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
window.SCREENS["learner-quiz-result"] = LearnerQuizResult;

// ============ AI TUTOR (ATLAS CHAT) ============
function LearnerAITutor({ ctx }) {
  const [msgs, setMsgs] = useState([
    { from: "ai", text: "Hi Daniel — I'm Atlas. I can answer questions about anything in your onboarding materials. What are you stuck on?", suggestions: ["Explain the platform architecture", "Summarize Week 2", "How does auth work between services?", "Quiz me on inter-service comms"] },
  ]);
  const [input, setInput] = useState("");
  const send = (msg) => {
    const text = msg || input;
    if (!text.trim()) return;
    const userMsg = { from: "user", text };
    const aiReply = {
      from: "ai",
      text: "Services authenticate to each other with a signed token in the `x-northwind-svc-token` header. The token is minted by the auth service and carries the calling service's identity, scope, and a short TTL (15 min). Bearer tokens, by contrast, are reserved for end-user requests coming through the API gateway.",
      cites: ["auth.md §2.3", "service-catalog.md", "arch-overview.pdf §4"],
      followups: ["What happens if the token expires mid-request?", "How are scopes defined?", "Show me a code example"]
    };
    setMsgs([...msgs, userMsg, aiReply]);
    setInput("");
  };
  return (
    <>
      <Topbar crumbs={["AI Tutor"]} actions={
        <>
          <button className="btn"><Icon name="refresh" size={14}/> New chat</button>
          <button className="btn"><Icon name="archive" size={14}/> History</button>
        </>
      }/>
      <div className="viewport ai-tint" style={{ display: "grid", gridTemplateColumns: "1fr 320px", overflow: "hidden", height: "calc(100vh - var(--topbar-h))" }}>

        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "white" }}>
          <div className="row" style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, var(--ai), #4F46E5)", color: "white", display: "grid", placeItems: "center" }}><Icon name="sparkle" size={16}/></div>
            <div>
              <strong style={{ fontSize: 14 }}>Atlas</strong>
              <div className="muted" style={{ fontSize: 11 }}>Tutoring on Platform Engineering · 24 documents</div>
            </div>
            <Badge tone="success" dot style={{ marginLeft: "auto" }}>Sourced from your materials</Badge>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
            <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
              {msgs.map((m, i) => (
                <React.Fragment key={i}>
                  <div className={"bubble " + m.from}>
                    {m.from === "ai" && <div className="ai-meta"><Icon name="sparkle" size={11}/> Atlas</div>}
                    <div>{m.text}</div>
                    {m.cites && <div className="citations">{m.cites.map(c => <span key={c} className="citation">{c}</span>)}</div>}
                  </div>
                  {m.followups && (
                    <div className="row" style={{ gap: 6, flexWrap: "wrap", paddingLeft: 8 }}>
                      {m.followups.map(f => <button key={f} className="chip" onClick={() => send(f)}><Icon name="arrow" size={10}/> {f}</button>)}
                    </div>
                  )}
                  {m.suggestions && (
                    <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {m.suggestions.map(s => (
                        <button key={s} className="card" style={{ padding: 12, textAlign: "left", cursor: "pointer", border: "1px solid var(--border-ai)" }} onClick={() => send(s)}>
                          <div className="row" style={{ gap: 8, color: "var(--ai)" }}><Icon name="sparkle" size={13}/> <span style={{ fontSize: 12.5, fontWeight: 500 }}>{s}</span></div>
                        </button>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div style={{ padding: "16px 24px 24px", borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
            <div style={{ maxWidth: 720, margin: "0 auto", border: "1.5px solid var(--border-strong)", borderRadius: 14, padding: 12, background: "var(--surface)" }}>
              <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Ask Atlas about your onboarding materials…"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                style={{ width: "100%", border: 0, outline: 0, resize: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 14, minHeight: 50, padding: 0 }}/>
              <div className="row" style={{ marginTop: 6 }}>
                <button className="icon-btn"><Icon name="paperclip" size={14}/></button>
                <button className="icon-btn" title="Quote chapter"><Icon name="docs" size={14}/></button>
                <span className="muted" style={{ fontSize: 11, marginLeft: 4 }}>Atlas only answers from indexed materials</span>
                <button className="btn ai sm" style={{ marginLeft: "auto" }} onClick={() => send()}><Icon name="send" size={12}/> Ask</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: suggested docs */}
        <div style={{ borderLeft: "1px solid var(--border)", padding: 20, overflow: "auto" }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 10 }}>Suggested documents</div>
          <div className="col" style={{ gap: 8 }}>
            {DOCUMENTS.slice(0, 4).map(d => (
              <div key={d.name} className="card" style={{ padding: 12 }}>
                <div className="row" style={{ gap: 10 }}><FileIcon type={d.type}/>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 12.5, fontWeight: 500 }}>{d.name}</div><div className="muted" style={{ fontSize: 11 }}>cited 3× this chat</div></div>
                </div>
              </div>
            ))}
          </div>
          <div className="sep"/>
          <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 10 }}>Previous chats</div>
          <div className="col" style={{ gap: 6 }}>
            {["How does SSO work?", "Difference between gRPC and REST", "What's a postmortem?"].map(t => (
              <button key={t} style={{ textAlign: "left", padding: 10, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12.5, cursor: "pointer" }}>{t}</button>
            ))}
          </div>
          <button className="btn ghost sm" style={{ marginTop: 14, width: "100%", justifyContent: "center" }}>View all 14 →</button>
        </div>
      </div>
    </>
  );
}
window.SCREENS["learner-ai-tutor"] = LearnerAITutor;

// ============ READINESS / EVALUATION ============
function LearnerReadiness({ ctx }) {
  return (
    <>
      <Topbar crumbs={["Evaluation"]} actions={<button className="btn ai" onClick={() => ctx.nav("learner-ai-tutor")}><Icon name="sparkle" size={14}/> Ask Atlas where to focus</button>}/>
      <div className="viewport">
        <div className="page-header">
          <div><h1>Readiness evaluation</h1><div className="sub">A live signal of how production-ready you are. Updates after every quiz and AI session.</div></div>
        </div>
        <div className="page-body">
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
            <div className="card" style={{ padding: 22, textAlign: "center" }}>
              <Gauge value={78} label="Overall" size={180}/>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Approaching production-ready</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>Target: 85 by Jun 28</div>
              </div>
              <div className="sep"/>
              <div className="row" style={{ justifyContent: "space-around", fontSize: 12 }}>
                <div><div className="num" style={{ fontSize: 16, fontWeight: 600 }}>92</div><div className="muted">Top cohort</div></div>
                <div><div className="num" style={{ fontSize: 16, fontWeight: 600 }}>72</div><div className="muted">Cohort avg</div></div>
                <div><div className="num" style={{ fontSize: 16, fontWeight: 600, color: "var(--success)" }}>+6</div><div className="muted">This week</div></div>
              </div>
            </div>

            <div className="col" style={{ gap: 16 }}>
              <div className="card">
                <div className="card-h"><h3>Skill confidence</h3><span className="sub">By topic</span></div>
                <div className="card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    ["Architecture", 88, "Strong"],
                    ["Inter-service comms", 76, "Good"],
                    ["Auth between services", 52, "Weak"],
                    ["Deployment", 80, "Strong"],
                    ["Observability", 72, "Good"],
                    ["On-call", 84, "Strong"],
                    ["Incidents", 70, "Good"],
                    ["Security baselines", 60, "Weak"],
                  ].map(([t, v, l]) => (
                    <div key={t}>
                      <div className="row" style={{ justifyContent: "space-between", fontSize: 13 }}><span>{t}</span><span className="muted">{l}</span></div>
                      <div style={{ marginTop: 4 }}><Progress value={v} tone={v < 65 ? "warning" : v > 80 ? "success" : ""}/></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-h"><h3>Suggested review</h3><span className="sub">Most impactful next steps</span></div>
                <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { t: "Auth between services", e: "Re-read chapter 4 · 18 min", b: "+8 readiness", i: "doc" },
                    { t: "Security baselines refresher", e: "5-question micro-quiz", b: "+4 readiness", i: "check" },
                    { t: "Ask Atlas about token rotation", e: "Conceptual gap detected", b: "+3 readiness", i: "sparkle" },
                  ].map(s => (
                    <div key={s.t} className="row" style={{ gap: 12, padding: 12, background: "var(--surface-2)", borderRadius: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: "white", color: "var(--accent)", display: "grid", placeItems: "center" }}><Icon name={s.i} size={16}/></div>
                      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{s.t}</div><div className="muted" style={{ fontSize: 12 }}>{s.e}</div></div>
                      <Badge tone="success">{s.b}</Badge>
                      <button className="btn sm">Start</button>
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
window.SCREENS["learner-readiness"] = LearnerReadiness;

// ============ PROGRESS ============
function LearnerProgress() {
  return (
    <>
      <Topbar crumbs={["Progress"]}/>
      <div className="viewport">
        <div className="page-header"><div><h1>Your progress</h1><div className="sub">Last 30 days across Platform Engineering and Security paths.</div></div></div>
        <div className="page-body">
          <div className="kpi-grid" style={{ marginBottom: 16 }}>
            <KpiCard label="Topics completed" value="14" trend="+5" sub="of 22 total"/>
            <KpiCard label="Quiz history" value="6" sub="passed · 1 retake"/>
            <KpiCard label="Time spent" value="18.4h" sub="this month"/>
            <KpiCard label="Streak" value="5d" sub="keep it going!"/>
            <KpiCard label="Readiness" value="78" trend="+6" sub="of 100"/>
            <KpiCard label="Learning velocity" value="1.4×" trend="+0.2" sub="vs. cohort" ai/>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <div className="card">
              <div className="card-h"><h3>Readiness trend</h3><span className="sub">12 weeks</span></div>
              <div className="card-body"><LineChart data={[40, 44, 48, 50, 55, 58, 60, 64, 66, 70, 75, 78]} height={180} color="var(--success)"/></div>
            </div>
            <div className="card">
              <div className="card-h"><h3>Time by week</h3></div>
              <div className="card-body"><BarChart data={[{l:"W1",v:4.2},{l:"W2",v:5.1},{l:"W3",v:3.8},{l:"W4",v:5.3}]} height={180}/></div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-h"><h3>Quiz history</h3></div>
            <div className="card-body flush">
              <table className="table">
                <thead><tr><th>Quiz</th><th>Module</th><th>Attempts</th><th>Best score</th><th>Result</th><th>When</th></tr></thead>
                <tbody>
                  {[
                    ["Week 1", "Foundations", 1, 92, "Pass"],
                    ["Week 2", "Services & Architecture", 1, 88, "Pass"],
                    ["Security baselines", "Security 101", 2, 78, "Pass"],
                    ["Week 3", "Deployment", 0, "—", "Pending"],
                  ].map(r => (
                    <tr key={r[0]}>
                      <td className="cell-strong">{r[0]}</td>
                      <td className="cell-meta">{r[1]}</td>
                      <td className="num">{r[2]}</td>
                      <td className="num">{r[3]}{typeof r[3]==="number"?"%":""}</td>
                      <td><StatusBadge status={r[4] === "Pending" ? "Locked" : r[4] === "Pass" ? "Completed" : "Failed"}/></td>
                      <td className="cell-meta">2d ago</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <div className="card-h"><h3>Activity heatmap</h3><span className="sub">Last 12 weeks</span></div>
              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 4 }}>
                  {Array.from({length: 84}).map((_, i) => {
                    const v = [0, 0.2, 0.4, 0.6, 0.8, 1][Math.floor(Math.random()*6)];
                    return <div key={i} style={{ aspectRatio: 1, borderRadius: 3, background: v === 0 ? "var(--surface-2)" : `color-mix(in oklab, var(--accent) ${v*70+10}%, white)` }}/>;
                  })}
                </div>
                <div className="row" style={{ marginTop: 10, justifyContent: "flex-end", gap: 6, fontSize: 11, color: "var(--text-3)" }}>
                  <span>Less</span>
                  {[0.1, 0.3, 0.5, 0.8, 1].map(v => <div key={v} style={{ width: 10, height: 10, background: `color-mix(in oklab, var(--accent) ${v*70+10}%, white)`, borderRadius: 2 }}/>)}
                  <span>More</span>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-h"><h3>Achievements</h3></div>
              <div className="card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { i: "flame", t: "5-day streak", s: "Keep going!" },
                  { i: "trophy", t: "First pass", s: "Week 1 — 92%" },
                  { i: "bolt", t: "Quick learner", s: "1.4× cohort speed" },
                  { i: "star", t: "Curious", s: "12 AI questions" },
                ].map(a => (
                  <div key={a.t} className="row" style={{ padding: 12, background: "var(--surface-2)", borderRadius: 10, gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "white", color: "var(--accent)", display: "grid", placeItems: "center" }}><Icon name={a.i} size={18}/></div>
                    <div><div style={{ fontSize: 13, fontWeight: 500 }}>{a.t}</div><div className="muted" style={{ fontSize: 11 }}>{a.s}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
window.SCREENS["learner-progress"] = LearnerProgress;

// ============ PROFILE & SETTINGS ============
function LearnerProfile({ ctx }) {
  return (
    <>
      <Topbar crumbs={["Profile & Settings"]}/>
      <div className="viewport">
        <div className="page-header">
          <div className="row" style={{ gap: 16 }}>
            <Avatar initials="DO" sz="xl"/>
            <div>
              <h1>Daniel Okafor</h1>
              <div className="sub">Software Engineer · Platform team · joined Feb 2026</div>
              <div className="row" style={{ marginTop: 8, gap: 6 }}>
                <Badge tone="accent" dot>Learner</Badge>
                <Badge tone="outline">{ORG}</Badge>
                <Badge tone="success" dot>Readiness 78</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="page-body">
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24 }}>
            <nav className="col" style={{ gap: 2 }}>
              {[["Account","user"],["Notifications","bell"],["Appearance","star"],["Language","globe"],["Security","shield"],["Sign out","external"]].map(([s, ic], i) => (
                <button key={s} className={"nav-item " + (i === 0 ? "active" : "")} style={{ padding: "8px 12px", color: s === "Sign out" ? "var(--danger)" : "" }}>
                  <span className="ico"><Icon name={ic} size={14}/></span><span className="label">{s}</span>
                </button>
              ))}
            </nav>
            <div className="col" style={{ gap: 16 }}>
              <ConfigCard title="Account" sub="Synced with Microsoft Entra.">
                <div className="grid-2">
                  <div className="field"><label>Full name</label><input className="input" defaultValue="Daniel Okafor" disabled/></div>
                  <div className="field"><label>Email</label><input className="input" defaultValue="daniel.okafor@northwind.cloud" disabled/></div>
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>Managed by your IT administrator.</div>
              </ConfigCard>

              <ConfigCard title="Notifications">
                <div className="col" style={{ gap: 10 }}>
                  <Switch on label="Daily learning reminder · 9:00 AM"/>
                  <Switch on label="New chapter or quiz available"/>
                  <Switch label="Weekly progress summary email"/>
                  <Switch on label="AI tutor activity digest"/>
                </div>
              </ConfigCard>

              <ConfigCard title="Appearance">
                <div className="row" style={{ gap: 10 }}>
                  {[
                    { id: "light", label: "Light" },
                    { id: "dim", label: "Dim" },
                    { id: "dark", label: "Dark" },
                    { id: "system", label: "System" },
                  ].map(t => (
                    <label key={t.id} style={{ flex: 1, padding: 12, border: "1px solid var(--border)", borderRadius: 10, cursor: "pointer", textAlign: "center" }}>
                      <div style={{ height: 50, borderRadius: 6, background: t.id === "light" ? "white" : t.id === "dim" ? "#1E293B" : t.id === "dark" ? "#0B1220" : "linear-gradient(90deg, white 50%, #0B1220 50%)", border: "1px solid var(--border)", marginBottom: 8 }}/>
                      <input type="radio" name="th" defaultChecked={t.id === "light"}/> <span style={{ fontSize: 13 }}>{t.label}</span>
                    </label>
                  ))}
                </div>
              </ConfigCard>

              <ConfigCard title="Language">
                <select className="select"><option>English (US)</option><option>Deutsch</option><option>日本語</option><option>Português (BR)</option></select>
              </ConfigCard>

              <ConfigCard title="Security">
                <div className="row" style={{ gap: 10 }}>
                  <Icon name="shield" size={20} style={{ color: "var(--success)" }}/>
                  <div style={{ flex: 1 }}><strong>Single sign-on enabled</strong><div className="muted" style={{ fontSize: 12 }}>Last sign-in: Today · MFA enforced by IT policy</div></div>
                  <button className="btn">Sign out everywhere</button>
                </div>
              </ConfigCard>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
window.SCREENS["learner-profile"] = LearnerProfile;

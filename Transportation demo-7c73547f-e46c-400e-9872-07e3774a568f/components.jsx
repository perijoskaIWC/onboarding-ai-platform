// Shared utilities, data, and small UI components

// ============ DATA ============
const ORG = "Northwind Cloud";
const ADMIN_USER = { name: "Maya Tanaka", email: "maya.tanaka@northwind.cloud", role: "Workspace Admin", initials: "MT" };
const LEARNER_USER = { name: "Daniel Okafor", email: "daniel.okafor@northwind.cloud", role: "Learner", initials: "DO" };

const PROJECTS = [
  { id: "p1", name: "Platform Engineering Onboarding", desc: "Core services, infra, on-call rotation", docs: 24, users: 18, paths: 3, completion: 72, updated: "2h ago", status: "Active", dept: "Engineering" },
  { id: "p2", name: "Customer Success — Tier 1", desc: "Product modules, escalation paths, SLAs", docs: 41, users: 32, paths: 2, completion: 54, updated: "Yesterday", status: "Active", dept: "Customer Success" },
  { id: "p3", name: "Sales Enablement — Q2 Launch", desc: "Pitch, demos, pricing & objections", docs: 18, users: 12, paths: 4, completion: 88, updated: "3d ago", status: "Active", dept: "Sales" },
  { id: "p4", name: "Security & Compliance 101", desc: "SOC2, GDPR, secure-by-default review", docs: 12, users: 64, paths: 1, completion: 41, updated: "1w ago", status: "Active", dept: "Security" },
  { id: "p5", name: "Field Ops Playbook", desc: "Customer site visits, handover checklists", docs: 9, users: 7, paths: 1, completion: 100, updated: "2w ago", status: "Archived", dept: "Operations" },
  { id: "p6", name: "Product Design System v3", desc: "Components, tokens, contribution guide", docs: 36, users: 11, paths: 2, completion: 33, updated: "Today", status: "Draft", dept: "Design" },
];

// Documents are linked to one or more projects (project ids in PROJECTS above).
const DOCUMENTS = [
  { name: "Platform Architecture Overview.pdf", size: "3.2 MB", type: "pdf", v: 4, by: "Maya T.", at: "Today", status: "Indexed", projects: ["p1", "p6"] },
  { name: "On-Call Runbook.md", size: "84 KB", type: "md", v: 7, by: "Priya K.", at: "Yesterday", status: "Indexed", projects: ["p1"] },
  { name: "Incident Postmortems Q1.pdf", size: "1.1 MB", type: "pdf", v: 2, by: "Maya T.", at: "Mar 4", status: "Indexed", projects: ["p1", "p4"] },
  { name: "Service Catalog.md", size: "42 KB", type: "md", v: 11, by: "Alex R.", at: "Mar 2", status: "Indexed", projects: ["p1"] },
  { name: "Deploy Pipeline Walkthrough.pdf", size: "5.6 MB", type: "pdf", v: 1, by: "Sam V.", at: "Mar 1", status: "Processing", projects: ["p1"] },
  { name: "Security Baselines.txt", size: "18 KB", type: "txt", v: 3, by: "Priya K.", at: "Feb 28", status: "Indexed", projects: ["p4", "p1", "p2"] },
  { name: "Observability Guide.pdf", size: "2.8 MB", type: "pdf", v: 2, by: "Sam V.", at: "Feb 25", status: "Indexed", projects: ["p1"] },
  { name: "Team Org & Charters.md", size: "27 KB", type: "md", v: 5, by: "Maya T.", at: "Feb 22", status: "Indexed", projects: [] },
  { name: "CSM Escalation Playbook.pdf", size: "1.8 MB", type: "pdf", v: 3, by: "Marina V.", at: "Feb 20", status: "Indexed", projects: ["p2"] },
  { name: "Q2 Pricing & Objections.md", size: "62 KB", type: "md", v: 4, by: "Aisha B.", at: "Feb 18", status: "Indexed", projects: ["p3"] },
];

// Helper — look up project name + id
const projectById = (id) => (PROJECTS || []).find(p => p.id === id);

const LEARNERS = [
  { name: "Daniel Okafor", email: "daniel.okafor@", role: "Engineer", proj: "Platform Eng", progress: 84, readiness: 92, status: "On track", active: "5m ago", initials: "DO" },
  { name: "Sofia Lehmann", email: "sofia.lehmann@", role: "Engineer", proj: "Platform Eng", progress: 68, readiness: 71, status: "On track", active: "1h ago", initials: "SL" },
  { name: "Yusuf Aydın", email: "yusuf.aydin@", role: "Engineer", proj: "Platform Eng", progress: 52, readiness: 64, status: "At risk", active: "2d ago", initials: "YA" },
  { name: "Marina Vega", email: "marina.vega@", role: "CSM", proj: "Customer Success", progress: 91, readiness: 95, status: "On track", active: "12m ago", initials: "MV" },
  { name: "Henrik Östberg", email: "henrik.o@", role: "CSM", proj: "Customer Success", progress: 22, readiness: 38, status: "Behind", active: "1w ago", initials: "HÖ" },
  { name: "Aisha Bello", email: "aisha.bello@", role: "AE", proj: "Sales Enablement", progress: 76, readiness: 80, status: "On track", active: "30m ago", initials: "AB" },
  { name: "Lukas Brandt", email: "lukas.brandt@", role: "AE", proj: "Sales Enablement", progress: 100, readiness: 98, status: "Complete", active: "Yesterday", initials: "LB" },
  { name: "Joon Park", email: "joon.park@", role: "Security", proj: "Security 101", progress: 60, readiness: 70, status: "On track", active: "3h ago", initials: "JP" },
];

const LEARNING_PATH = [
  { week: 1, title: "Foundations & Tooling", topics: ["Repo layout", "Local dev setup", "CI basics", "Team rituals"], duration: "4h", difficulty: "Intro", quizThreshold: 70, skills: ["Setup", "Tooling"] },
  { week: 2, title: "Services & Architecture", topics: ["Service catalog", "Inter-service comms", "Data flow", "Auth"], duration: "6h", difficulty: "Core", quizThreshold: 75, skills: ["Architecture", "APIs"] },
  { week: 3, title: "Deployment & Observability", topics: ["Pipeline overview", "Feature flags", "Logs & metrics", "Dashboards"], duration: "5h", difficulty: "Core", quizThreshold: 75, skills: ["Deploy", "Observability"] },
  { week: 4, title: "On-Call & Incident Response", topics: ["Rotation rules", "Runbooks", "Postmortems", "Comms templates"], duration: "5h", difficulty: "Applied", quizThreshold: 80, skills: ["On-call", "Incidents"] },
];

// ============ NAV CONFIG ============
const NAV_ADMIN = [
  { group: "Workspace", items: [
    { id: "admin-dashboard", label: "Dashboard", icon: "grid" },
    { id: "admin-projects", label: "Projects", icon: "folder", badge: 6 },
    { id: "admin-documents", label: "Documents", icon: "docs" },
  ]},
  { group: "Learning", items: [
    { id: "admin-paths", label: "Learning Paths", icon: "layers" },
    { id: "admin-assign", label: "Assignments", icon: "users" },
    { id: "admin-quizzes", label: "Quizzes", icon: "check", badge: 12 },
    { id: "admin-ai-config", label: "AI Tutor Config", icon: "sparkle" },
  ]},
  { group: "Insights", items: [
    { id: "admin-analytics", label: "Analytics", icon: "chart" },
    { id: "admin-users", label: "Users", icon: "user" },
    { id: "admin-settings", label: "Settings", icon: "cog" },
  ]},
];

const NAV_LEARNER = [
  { group: "Learn", items: [
    { id: "learner-dashboard", label: "Home", icon: "grid" },
    { id: "learner-paths", label: "My Learning Paths", icon: "book" },
    { id: "learner-module", label: "Current Module", icon: "layers" },
    { id: "learner-ai-tutor", label: "AI Tutor", icon: "sparkle" },
  ]},
  { group: "Track", items: [
    { id: "learner-quizzes", label: "Quizzes", icon: "check" },
    { id: "learner-progress", label: "Progress", icon: "trend" },
    { id: "learner-readiness", label: "Evaluation", icon: "target" },
  ]},
  { group: "Account", items: [
    { id: "learner-profile", label: "Profile & Settings", icon: "cog" },
  ]},
];

// ============ SMALL COMPONENTS ============

function Badge({ tone = "default", children, dot }) {
  const cls = tone === "default" ? "badge" : `badge ${tone}`;
  return <span className={dot ? cls + " dot" : cls}>{children}</span>;
}

function StatusBadge({ status }) {
  const map = {
    "Active": "success",
    "Draft": "warning",
    "Archived": "default",
    "On track": "success",
    "At risk": "warning",
    "Behind": "danger",
    "Complete": "info",
    "Indexed": "success",
    "Processing": "info",
    "Failed": "danger",
    "Locked": "default",
    "In progress": "accent",
    "Completed": "success",
    "Available": "info",
  };
  return <Badge tone={map[status] || "default"} dot>{status}</Badge>;
}

function Avatar({ initials, sz = "", tone }) {
  const colors = {
    DO: "#DBE7FF", SL: "#FCE7F3", YA: "#FEE2E2", MV: "#E7F5EC",
    HÖ: "#FEF3C7", AB: "#F1ECFF", LB: "#E0F2FE", JP: "#FFE4E6",
    MT: "#1E293B", AR: "#EDE9FE", PK: "#FEE2E2", SV: "#FEF3C7",
  };
  const isDark = initials === "MT";
  return (
    <div className={"avatar " + sz} style={{ background: colors[initials] || "var(--surface-3)", color: isDark ? "white" : "var(--text)" }}>
      {initials}
    </div>
  );
}

function Progress({ value, tone, sz }) {
  return (
    <div className={"progress " + (sz || "") + " " + (tone || "")}>
      <span style={{ width: Math.max(0, Math.min(100, value)) + "%" }} />
    </div>
  );
}

// Bar chart (svg)
function BarChart({ data, height = 140, color = "var(--accent)" }) {
  const max = Math.max(...data.map(d => d.v));
  const w = 100 / data.length;
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ overflow: "visible" }}>
      {data.map((d, i) => {
        const h = (d.v / max) * (height - 20);
        return (
          <g key={i}>
            <rect x={i*w + w*0.18} y={height - h - 14} width={w*0.64} height={h} rx="1.2" fill={color} opacity={d.dim ? 0.35 : 0.9}/>
            <text x={i*w + w/2} y={height - 2} fontSize="3.4" textAnchor="middle" fill="var(--text-3)" fontFamily="var(--font-mono)">{d.l}</text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ data, height = 140, color = "var(--accent)", fill = true }) {
  const max = Math.max(...data) * 1.1;
  const min = 0;
  const step = 100 / (data.length - 1);
  const pts = data.map((v, i) => `${(i*step).toFixed(2)},${(height - (v/max)*(height-10) - 4).toFixed(2)}`).join(" ");
  const area = `0,${height} ${pts} 100,${height}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {fill && <polygon points={area} fill="url(#lg)"/>}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke"/>
      {data.map((v, i) => (
        <circle key={i} cx={i*step} cy={height - (v/max)*(height-10) - 4} r="1.3" fill={color}/>
      ))}
    </svg>
  );
}

function Sparkline({ data, color = "var(--accent)" }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const step = 100 / (data.length - 1);
  const pts = data.map((v, i) => `${(i*step).toFixed(2)},${(30 - ((v-min)/(max-min || 1))*26 - 2).toFixed(2)}`).join(" ");
  return (
    <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke"/>
    </svg>
  );
}

// Gauge for readiness
function Gauge({ value, label, size = 140, color = "var(--accent)" }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--surface-3)" strokeWidth="8" fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="8" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s" }}/>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>{value}<span style={{ color: "var(--text-3)", fontSize: 14, fontWeight: 500 }}>%</span></div>
          {label && <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500 }}>{label}</div>}
        </div>
      </div>
    </div>
  );
}

// Heatmap (weeks x topics)
function Heatmap({ rows, cols, data, accent = "var(--accent)" }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `120px repeat(${cols.length}, 1fr)`, gap: 4, fontSize: 11 }}>
      <div></div>
      {cols.map((c, i) => <div key={i} style={{ textAlign: "center", color: "var(--text-3)", padding: "2px 0" }}>{c}</div>)}
      {rows.map((r, ri) => (
        <React.Fragment key={ri}>
          <div style={{ color: "var(--text-2)", padding: "4px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r}</div>
          {cols.map((_, ci) => {
            const v = data[ri][ci];
            return <div key={ci} style={{
              height: 28, borderRadius: 4,
              background: `color-mix(in oklab, ${accent} ${v}%, var(--surface-2))`,
              display: "grid", placeItems: "center",
              color: v > 50 ? "white" : "var(--text-2)",
              fontVariantNumeric: "tabular-nums",
              fontSize: 11, fontWeight: 500,
            }}>{v}</div>;
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

// File icon
function FileIcon({ type }) {
  const colors = { pdf: ["#FEE2E2", "#B91C1C"], md: ["#DBE7FF", "#1D4ED8"], txt: ["#E7F5EC", "#166534"], docx: ["#DBEAFE", "#1E40AF"] };
  const [bg, fg] = colors[type] || ["#F4F6F8", "#475569"];
  return (
    <div style={{ width: 32, height: 32, background: bg, color: fg, borderRadius: 6, display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>
      {type}
    </div>
  );
}

// AI sparkle button
function AIChip({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 99,
      background: "var(--ai-soft)", border: "1px solid var(--border-ai)",
      color: "var(--ai)", fontSize: 12, fontWeight: 500,
    }}>
      <Icon name="sparkle" size={13}/> {children}
    </button>
  );
}

// Image placeholder
function Placeholder({ ratio = "16/9", label = "image", style = {} }) {
  return (
    <div style={{
      aspectRatio: ratio,
      borderRadius: 8,
      background: `repeating-linear-gradient(135deg, var(--surface-2) 0 6px, var(--surface-3) 6px 12px)`,
      display: "grid", placeItems: "center",
      color: "var(--text-3)",
      fontFamily: "var(--font-mono)", fontSize: 11,
      border: "1px solid var(--border)",
      ...style,
    }}>{label}</div>
  );
}

Object.assign(window, { Badge, StatusBadge, Avatar, Progress, BarChart, LineChart, Sparkline, Gauge, Heatmap, FileIcon, AIChip, Placeholder, PROJECTS, DOCUMENTS, LEARNERS, LEARNING_PATH, NAV_ADMIN, NAV_LEARNER, ORG, ADMIN_USER, LEARNER_USER, projectById });

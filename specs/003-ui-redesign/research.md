# Research: UI Redesign

## Decision 1: Icon Strategy

**Decision**: Inline SVG icons embedded directly in JSX — no npm package required.

**Rationale**: The constitution forbids new UI libraries. Heroicons provides a free set of clean SVGs that can be copied inline as needed. No install, no bundle impact, no dependency to maintain. Used sparingly for empty states and navigation only.

**Alternatives considered**:
- `@heroicons/react` npm package — rejected, adds a dependency that the constitution discourages
- Font Awesome CDN — rejected, adds external network request and larger footprint
- Emoji as icons — rejected, inconsistent rendering across platforms

---

## Decision 2: Brand Colour via Tailwind Config

**Decision**: Extend `tailwind.config.js` with a `brand` colour scale (indigo-based, e.g. `brand-600` = `#4f46e5`) replacing all ad-hoc `blue-600` references.

**Rationale**: A single config change propagates consistently. Using a named `brand` scale instead of hard-coded `blue` means the palette can be swapped in one place later. Indigo reads as professional/trustworthy for an enterprise onboarding tool.

**Alternatives considered**:
- Keep `blue-600` — rejected, doesn't signal intentional design
- Teal/emerald — considered but indigo is more conventional for SaaS admin tooling

---

## Decision 3: Sidebar Layout Pattern

**Decision**: Two layout wrapper components — `AdminLayout` and `LearnerLayout` — each rendering a fixed-width sidebar + main content area using Tailwind flex. Pages are wrapped in the appropriate layout via React Router's nested route `<Outlet />`.

**Rationale**: React Router v6 nested routes allow a single layout component to wrap all child pages without prop drilling or HOC boilerplate. The sidebar is rendered once and persists across navigation.

**Alternatives considered**:
- Render sidebar inside each page component — rejected, duplicates markup and breaks active-state logic
- Context-based layout injection — rejected, unnecessary complexity for two fixed layouts

---

## Decision 4: Tab Component Pattern

**Decision**: Pure Tailwind tab bar — a `<div>` of buttons with `border-b` underline, active tab gets `border-brand-600 text-brand-600`, inactive gets `border-transparent text-gray-500`. Tab state managed with a single `useState` in the host page.

**Rationale**: No JS library needed. The tab pattern (border-bottom highlight) is standard and renders well with just Tailwind classes. State is local to the page — no global state needed.

**Alternatives considered**:
- Headless UI tabs — rejected, adds a dependency
- CSS-only radio-button tabs — rejected, harder to integrate with React state

---

## Decision 5: Skeleton Loader Pattern

**Decision**: Skeleton shapes use `animate-pulse` on `bg-gray-200` `<div>` blocks matching the approximate shape of the real content (text line, card, list row). No library required — Tailwind ships `animate-pulse`.

**Rationale**: `animate-pulse` is already in Tailwind core. Simple `div` skeletons that match the content shape give the best perceived performance without complexity.

**Alternatives considered**:
- `react-loading-skeleton` npm package — rejected, adds a dependency for something Tailwind handles natively
- Spinner only — rejected, doesn't preserve layout and causes content jump

---

## Decision 6: Empty State Pattern

**Decision**: Reusable inline empty-state block: centered container with a large SVG icon (inline), `<h3>` heading, `<p>` helper text, and optionally a CTA `<button>`. No shared component created — pattern is repeated inline in each location (3–4 total).

**Rationale**: There are only ~4 empty state locations. A shared component would require deciding where to put it and how to pass props. Inline repetition is simpler given the small count and the constitution's "no premature abstraction" guidance.

**Alternatives considered**:
- Shared `EmptyState` component — considered but 4 instances don't justify extraction
- Lottie animation — rejected, adds dependency and is too heavy for this use case

---

## Decision 7: Learner Project Page Restructure

**Decision**: Create a new `LearnerProject.jsx` page that renders a tab bar and lazy-loads the content of each tab inline (not via sub-routes). The four existing learner pages (LearningPath, Chat, Quiz, Progress) are refactored to render as tab panel content within this new wrapper.

**Rationale**: The existing learner pages each live at separate routes. Tabs within a single route are simpler UX for the learner (no URL change per tab). The existing route pages remain intact and can also be accessed directly if needed.

**Alternatives considered**:
- Keep separate routes, use tab bar as nav links — considered but causes full page reload between tabs which feels disjointed
- Nested routes with `<Outlet />` for each tab — over-engineered for this use case

---

## No Data Model Changes

This feature is frontend-only. No new database tables, no schema changes, no new API endpoints. All existing API contracts remain unchanged.

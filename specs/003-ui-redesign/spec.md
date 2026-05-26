# Feature Specification: UI Redesign

**Feature Branch**: `003-ui-redesign`

**Created**: 2026-05-26

**Status**: Draft

**Input**: Redesign the Onboarding AI Platform UI from a bare functional prototype to a polished, professional tool with persistent navigation, visual hierarchy, consistent component style, and proper empty/loading states — using Tailwind CSS only, no component libraries.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Consistent Navigation Shell (Priority: P1)

An admin or learner who opens any page in the platform sees a persistent sidebar with clearly labelled sections, an active-state highlight on the current page, and a minimal top bar showing their email and a logout button. They never need to navigate via the browser back button.

**Why this priority**: Navigation is the skeleton of the app. Every other UI story depends on it. Without a consistent shell, all other redesign work looks disconnected.

**Independent Test**: Log in as admin → verify sidebar shows "Dashboard" and "Projects" with the current page highlighted → click each link → verify the active state follows → log out → log in as learner → verify sidebar shows "My Projects" with appropriate links.

**Acceptance Scenarios**:

1. **Given** an admin is logged in, **When** they view any admin page, **Then** a sidebar is visible with links to Dashboard and Projects, the current page is visually highlighted, and the top bar shows their email and a Logout button.
2. **Given** a learner is logged in, **When** they view any learner page, **Then** a sidebar is visible with their project links, and the top bar shows their email and Logout.
3. **Given** any user is on mobile/tablet, **When** they view the sidebar, **Then** it collapses or adapts without breaking the layout.

---

### User Story 2 — Admin Project Detail Tabs (Priority: P2)

An admin viewing a project no longer scrolls through one long page. Instead, four tabs (Documents, Learning Path, Quiz, Learners) divide the content. Each tab shows only its own section, and the active tab is clearly indicated.

**Why this priority**: The project detail page is where admins spend most of their time. Removing the scroll improves usability significantly and is self-contained.

**Independent Test**: Open any project detail page → verify four tabs are visible → click each tab → verify only that tab's content is shown → verify the active tab is visually distinct.

**Acceptance Scenarios**:

1. **Given** an admin opens a project, **When** the page loads, **Then** the Documents tab is active by default and shows the upload form and document list.
2. **Given** an admin clicks the Learning Path tab, **When** the tab activates, **Then** only the learning path section is shown and the Documents section is hidden.
3. **Given** an admin clicks the Quiz tab, **When** the tab activates, **Then** only the quiz questions section is shown.
4. **Given** an admin clicks the Learners tab, **When** the tab activates, **Then** only the learner assignment section is shown.

---

### User Story 3 — Learner Project View Tabs (Priority: P3)

A learner viewing their assigned project sees tabs (Learning Path, AI Tutor, Quiz, Progress) instead of plain text links. Navigating between sections feels like a single-page experience.

**Why this priority**: Mirrors the admin tab pattern. Learners benefit from the same structural clarity.

**Independent Test**: Log in as learner → open an assigned project → verify four tabs are visible → click each tab → verify the correct content loads per tab.

**Acceptance Scenarios**:

1. **Given** a learner opens a project, **When** the page loads, **Then** the Learning Path tab is active by default.
2. **Given** a learner clicks AI Tutor, Quiz, or Progress tabs, **When** each activates, **Then** the correct content is shown.

---

### User Story 4 — Visual Polish: Cards, Badges, Empty States, Skeletons (Priority: P4)

Every list, card, and data section in the app has consistent visual treatment: subtle card borders, status badges with colour coding, skeleton loaders instead of "Loading…" text, and empty state blocks with an icon, heading, helper text, and call-to-action button instead of bare "No X yet" text.

**Why this priority**: Polish is additive — it improves all pages simultaneously but does not block function.

**Independent Test**: Upload a document and observe the "processing" badge → wait for ingestion and observe the "ready" badge → delete all documents and observe the empty state block with CTA → navigate to a learner with no projects and observe the empty state.

**Acceptance Scenarios**:

1. **Given** a document is ingesting, **When** the admin views it, **Then** a colour-coded "Processing" badge is shown (not plain text).
2. **Given** a section has no data yet, **When** any user views it, **Then** an empty state block with icon, heading, and CTA button is shown instead of plain grey text.
3. **Given** data is loading, **When** a user views the page, **Then** skeleton placeholder shapes are shown instead of "Loading…" text.
4. **Given** a button triggers an action, **When** the action is in flight, **Then** the button is disabled with a visible loading indicator.

---

### User Story 5 — Colour Palette & Typography (Priority: P5)

The platform uses a purposeful colour palette throughout: one primary accent colour replacing the default blue-600, a consistent neutral background, and typography scale that clearly separates headings, body text, and metadata.

**Why this priority**: Palette is a global change that can be applied after structure and components are in place.

**Independent Test**: View any page — verify all interactive elements (buttons, active nav, links) use the same accent colour — verify no leftover default Tailwind blue-600 or gray-50 remnants.

**Acceptance Scenarios**:

1. **Given** a user views any page, **When** they look at all buttons and active states, **Then** they all share the same accent colour consistently.
2. **Given** a user reads any page, **When** they scan the content, **Then** headings, body text, and metadata are visually distinct in size and weight.

---

### Edge Cases

- What happens when a learner has no assigned projects? → Empty state on learner dashboard with "No projects assigned yet. Ask your admin." message.
- What happens when sidebar is rendered on a narrow viewport? → Sidebar collapses to icons-only or slides behind a hamburger menu.
- What happens when a tab's content is loading? → Skeleton is shown within the tab panel, not a full-page loader.
- What happens if the user is mid-tab and data reloads (e.g., document ingestion status updates)? → Only the active tab's data refreshes; inactive tabs are not affected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every authenticated page MUST have a persistent sidebar with role-appropriate navigation links and active-state highlighting on the current route.
- **FR-002**: The top bar MUST show only the platform logo/name, the logged-in user's email, and a Logout button.
- **FR-003**: The admin project detail page MUST be divided into four tabs: Documents, Learning Path, Quiz, Learners — with only one tab's content visible at a time.
- **FR-004**: The learner project view MUST be divided into four tabs: Learning Path, AI Tutor, Quiz, Progress.
- **FR-005**: All loading states MUST use skeleton placeholder shapes, not "Loading…" text.
- **FR-006**: All empty states MUST display an icon, a heading, helper text, and a CTA button where an action is available.
- **FR-007**: Document ingestion status MUST be shown as a colour-coded badge (pending = yellow, processing = blue, ready = green, failed = red).
- **FR-008**: All interactive buttons MUST be disabled with a visible spinner while their action is in flight.
- **FR-009**: The redesign MUST NOT change any API calls, routing, or business logic — only visual presentation.
- **FR-010**: The redesign MUST use Tailwind CSS utility classes only — no external component libraries.
- **FR-011**: All pages MUST remain fully functional after the redesign (no regressions).
- **FR-012**: The layout MUST be responsive and usable on desktop (primary) and tablet (secondary).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All authenticated pages display a persistent sidebar — verifiable by visual inspection of every route.
- **SC-002**: Admin project detail page shows four clearly labelled tabs with no content from other tabs visible when one tab is active.
- **SC-003**: Zero "Loading…" text strings appear anywhere in the app — all loading states use skeleton shapes.
- **SC-004**: Zero "No X yet" plain text strings appear — all empty states use the structured empty-state block.
- **SC-005**: All interactive elements (buttons, nav links, active states) use the same accent colour — no mixed colour remnants.
- **SC-006**: Every existing feature (login, registration, project creation, document upload, learning path, quiz, chat, progress) continues to work correctly after the redesign.

## Assumptions

- The redesign is frontend-only — no backend changes, no new API endpoints.
- Existing file structure stays the same; changes are limited to JSX and Tailwind class names.
- The platform is used primarily on desktop browsers; mobile is not a priority but should not be broken.
- Heroicons (already available via CDN or inline SVG) may be used for icons — no icon library installation required.
- The new accent colour will be defined as a Tailwind config extension (e.g., `brand` colour), replacing ad-hoc `blue-600` references.

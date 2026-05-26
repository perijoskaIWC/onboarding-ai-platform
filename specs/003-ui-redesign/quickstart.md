# Quickstart: UI Redesign Manual Test Scenarios

## Prerequisites

- Platform running: `podman-compose up -d`
- At least one admin account and one learner account exist
- At least one project with documents, learning path, and quiz questions exists

---

## Scenario 1: Admin Navigation Shell

1. Log in as admin → verify a sidebar is visible on the left with "Overview" and "Projects" links
2. Verify top bar shows the platform logo/name, admin email, and Logout button
3. Click "Projects" in the sidebar → verify the active state highlights "Projects"
4. Click "Overview" → verify active state moves to "Overview"
5. Resize the browser to tablet width (~768px) → verify layout doesn't break

**Pass**: Sidebar visible, active states work, top bar minimal and correct.

---

## Scenario 2: Admin Project Detail Tabs

1. Navigate to Admin → Projects → open any project
2. Verify four tabs are visible: Documents, Learning Path, Quiz, Learners
3. Verify "Documents" is active by default and the upload form is shown
4. Click "Learning Path" → verify only the learning path section is shown; Documents section is hidden
5. Click "Quiz" → verify only the quiz questions section is shown
6. Click "Learners" → verify only the learner assignment section is shown
7. Upload a document while on the Documents tab → verify it appears in the list
8. Click Regenerate on the Learning Path tab → verify polling works
9. Click Regenerate on the Quiz tab → verify questions appear after generation

**Pass**: All four tabs work, each shows only its content, all existing actions still function.

---

## Scenario 3: Learner Navigation and Project Tabs

1. Log in as learner → verify sidebar shows "Home" link only (no hardcoded project links)
2. Click on an assigned project card → verify navigation goes to `/learner/projects/:id`
3. Verify four tabs: Learning Path, AI Tutor, Quiz, Progress
4. Click each tab → verify the correct content loads
5. Click "AI Tutor" tab → type a question → verify AI response appears
6. Click "Quiz" tab → answer questions → submit → verify score is shown
7. Click "Progress" tab → verify readiness score and progress are shown

**Pass**: Sidebar correct, project tab page loads, all four tabs functional.

---

## Scenario 4: Empty States

1. Create a new project with no documents
2. Open the project → click the Documents tab → verify an empty state with icon, heading, helper text is shown (not bare "No documents yet" text)
3. Click the Learning Path tab → verify empty state with "No learning path yet" block
4. Click the Quiz tab → verify empty state with "No questions yet" block
5. Log in as a learner with no project assignments → verify learner dashboard shows an empty state

**Pass**: All empty states render as structured blocks with icon + CTA.

---

## Scenario 5: Skeletons

1. Open a project detail page (slow network or throttle in DevTools)
2. While data is loading, verify skeleton shapes appear in place of content (no "Loading…" text)

**Pass**: Skeleton blocks visible during load, no plain loading text.

---

## Scenario 6: Colour Consistency

1. Visit every page in the admin section
2. Verify all buttons, active nav states, and links use the brand purple/indigo colour
3. Verify no blue-600 (bright blue) buttons remain

**Pass**: Consistent brand colour throughout.

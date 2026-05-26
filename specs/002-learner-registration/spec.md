# Feature Specification: Learner Self-Registration

**Feature Branch**: `002-learner-registration`

**Created**: 2026-05-26

**Status**: Draft

**Input**: User description: "User self-registration for the onboarding AI platform. Learners should be able to sign up with email and password directly from the login page, without admin involvement. Admins should still be created manually. After registration, learners land on their dashboard and wait to be assigned to a project by an admin."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Learner Signs Up and Accesses Dashboard (Priority: P1)

A new employee visits the platform for the first time and registers themselves using their work email and a chosen password. After successful registration they are immediately logged in and land on their learner dashboard, which shows a friendly message indicating no projects have been assigned yet.

**Why this priority**: This is the core blocker — without self-registration, every new learner requires a manual terminal command from a developer, making the platform unusable for real onboarding at scale.

**Independent Test**: A new user can open the platform, click "Sign up", fill in email and password, and reach the learner dashboard — fully without any admin action. Delivers standalone value even before project assignment exists.

**Acceptance Scenarios**:

1. **Given** a visitor is on the login page, **When** they click "Sign up" and submit a valid email and password, **Then** they are registered, automatically logged in, and redirected to the learner dashboard.
2. **Given** a new learner has just registered, **When** they view their dashboard, **Then** they see a message indicating no projects are assigned yet and no error is shown.
3. **Given** a visitor submits a registration form with an email already in use, **When** the system processes the request, **Then** an error message is displayed stating the email is already registered.
4. **Given** a visitor submits a registration form with a password shorter than 8 characters, **When** the system validates the input, **Then** an error message is shown before submission.

---

### User Story 2 - Registration Input Validation (Priority: P2)

The registration form validates all inputs before submission and gives clear, specific feedback so the user can correct mistakes without guessing what went wrong.

**Why this priority**: Poor validation leads to failed registrations and user frustration. Necessary for a professional experience but the happy path (US1) can be built and tested independently first.

**Independent Test**: Submit the registration form with various invalid inputs (blank fields, invalid email format, short password, mismatched passwords) and verify a specific, helpful error appears for each case.

**Acceptance Scenarios**:

1. **Given** a visitor leaves the email field blank, **When** they submit the form, **Then** the form highlights the email field and shows "Email is required."
2. **Given** a visitor enters a malformed email (e.g. "notanemail"), **When** they submit, **Then** an error shows "Please enter a valid email address."
3. **Given** a visitor enters a password under 8 characters, **When** they submit, **Then** an error shows "Password must be at least 8 characters."
4. **Given** a visitor enters mismatched passwords in the password and confirm-password fields, **When** they submit, **Then** an error shows "Passwords do not match."

---

### User Story 3 - Admin Role Remains Manually Provisioned (Priority: P3)

The self-registration flow only creates learner accounts. Admin accounts cannot be created through the registration form, ensuring the admin role remains controlled.

**Why this priority**: Security boundary — admins have full access to all projects and learner data. This requirement protects against privilege escalation but does not affect the learner registration flow.

**Independent Test**: Complete a self-registration and verify the resulting account has the learner role. Attempt to access admin-only pages and confirm access is denied.

**Acceptance Scenarios**:

1. **Given** a new user completes self-registration, **When** their account is created, **Then** their role is set to "learner" automatically with no option to choose otherwise.
2. **Given** a self-registered learner is logged in, **When** they attempt to access the admin area, **Then** they are redirected away and see an access-denied message.

---

### Edge Cases

- What happens when a learner registers with an email address that belongs to an existing admin account? → Registration is rejected with "Email already in use."
- What happens if the user closes the browser mid-registration? → No partial account is created; the user must start again.
- What happens if a learner registers and no projects exist yet? → Dashboard shows an empty state message; no error occurs.
- What happens if the same person submits the registration form twice in quick succession? → Only one account is created; the second submission returns "Email already in use."

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a "Sign up" entry point accessible from the login page without requiring an existing account.
- **FR-002**: System MUST accept an email address and password (with confirmation) as the only required registration fields.
- **FR-003**: System MUST validate that the email is correctly formatted before accepting the registration.
- **FR-004**: System MUST validate that the password is at least 8 characters long before accepting the registration.
- **FR-005**: System MUST validate that the password and confirm-password fields match before accepting the registration.
- **FR-006**: System MUST reject registration if the submitted email is already associated with an existing account, and display a clear error message.
- **FR-007**: System MUST assign the "learner" role to all self-registered accounts automatically — no role selection is presented to the user.
- **FR-008**: System MUST log the learner in automatically upon successful registration without requiring a separate login step.
- **FR-009**: System MUST redirect the newly registered learner to their dashboard immediately after registration.
- **FR-010**: System MUST display a clear empty-state message on the learner dashboard when no projects have been assigned.
- **FR-011**: System MUST store passwords securely and never expose them in any response or log.

### Key Entities

- **Registration Request**: Email address, password, confirm-password — submitted by the visitor; validated before account creation.
- **Learner Account**: Created upon successful registration; has email, hashed password, and role fixed to "learner"; linked to future project assignments.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete the full registration flow and reach their dashboard in under 60 seconds.
- **SC-002**: 100% of self-registered accounts are created with the "learner" role — no self-registered account ever receives admin privileges.
- **SC-003**: All validation errors (blank fields, invalid email, short password, mismatched passwords) are surfaced to the user before form submission is processed.
- **SC-004**: A duplicate email registration attempt always returns a clear error message and does not create a second account.
- **SC-005**: Eliminating the manual terminal command for learner creation reduces admin onboarding effort to zero steps for adding new learners.

## Assumptions

- Only email and password are required for registration; name and other profile fields are out of scope for this feature.
- Email verification (confirmation link sent to inbox) is out of scope — accounts are active immediately upon registration.
- Password reset / "forgot password" flow is out of scope for this feature.
- The platform is an internal tool; open registration is acceptable without invite codes or domain restrictions.
- Admins continue to be created exclusively via the existing command-line seeding script.
- The existing login page will be extended with a toggle or link to switch to the registration form — a separate `/register` page or an in-page form toggle are both acceptable.

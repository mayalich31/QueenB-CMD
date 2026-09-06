# QUEENS MATCH Phase 1 MVP Plan

## Phase 1 outcome

Deliver one deployable flow from registration through feedback:

1. A user registers or signs in.
2. A user opts in as a mentor and publishes topics, background, capacity, and meeting length.
3. A mentee filters the mentor directory by URL topic parameters and requests a meeting.
4. The mentor proposes simple UTC slots or rejects the request.
5. The mentee selects a slot, producing a scheduled meeting.
6. Attendance is confirmed, the meeting becomes completed after its scheduled time, and each participant can submit a required 1–5 rating with optional text.
7. The same account can switch between mentee and mentor workspaces.

## Scope boundaries

### Include

- A greenfield Next.js App Router application under `web/` using TypeScript, Tailwind CSS, Supabase Auth/PostgreSQL, Prisma, and Zod.
- Retain the existing `client/` CRA app and `server/` Express app without migrating or deleting them.
- Unified users, one-to-one mentor profiles, meetings, meeting slots, and feedback.
- Required registration fields; mentor onboarding and profile editing.
- Protected mentee and mentor workspaces with a role toggle.
- Server-rendered mentor directory with URL-based topic filtering.
- Centralized meeting transitions for requests, slot proposals, selection, rejection or cancellation, attendance confirmation, completion, and feedback.
- The single pre-match retry using `has_requested_more_times`.
- Simple UTC date/time forms and slot lists rather than a click-to-paint calendar.
- Seed data, core domain tests, one end-to-end happy-path test, and deployment/environment documentation.

### Defer

- Realtime bell notifications and global toasts.
- Click-to-paint calendar and meeting slide-over routing polish.
- Post-match rescheduling, `NOT_COMPLETED` verification questions, and `has_rescheduled` behavior.
- Vercel Cron reminders, overdue-feedback soft blocks, and other enforcement automation.
- Admin routes and reports.
- WhatsApp/SMS, profile photos, and optional professional-profile details.

## Architecture and ownership

- Keep the current root legacy workflow intact and add separate root commands for developing, testing, and building `web/`.
- Build routes under `web/app/` and shared UI under `web/components/`.
- Keep request validation in `web/lib/validations/`, business and state rules in `web/lib/services/`, and Prisma access in `web/lib/dal/`.
- Make `web/prisma/schema.prisma` the shared data contract; only the platform owner changes it during Phase 1.
- Use Server Components for reads and validated Server Actions for browser-originated mutations.
- Reserve Route Handlers for external integrations and scheduled-job entry points.
- Store and compare meeting times in UTC, converting only for display and input.

## Execution stages

### Stage 0 — Shared contract gate

All three developers agree on the route map, entity fields, meeting statuses, allowed transitions, action signatures, ownership boundaries, and Definition of Done. Developer 1 lands the scaffold and contracts before feature work diverges.

### Stage 1 — Parallel foundation

#### Developer 1 / Platform and domain core

- Create the isolated `web/` Next.js application and shared layouts while preserving the legacy applications.
- Add explicit root commands for the legacy and Queens Match workflows without changing legacy behavior.
- Configure Supabase environments, Prisma, session middleware, and protected routes.
- Define and migrate User, MentorProfile, Meeting, MeetingSlot, and Feedback models.
- Implement Zod DTOs, DAL interfaces, centralized transition rules, seed data, and domain tests.
- Publish stable action and query contracts consumed by the other tracks.

#### Developer 2 / Mentee journey

- Build registration and login forms against platform contracts.
- Build the mentee dashboard, mentor cards, URL topic filters, and active-request status view.
- Build request, proposed-slot selection, one-time request-more-times, cancellation-state, and mentee feedback experiences.
- Use contract-backed fixtures until platform actions are available; do not add direct Prisma access.

#### Developer 3 / Mentor journey

- Build mentor opt-in/edit settings and mentor-only navigation.
- Build inbound-request management and the simple UTC slot proposal/rejection workflow.
- Build the mentor schedule/list view, attendance confirmation, meeting status controls, and mentor feedback experience.
- Use contract-backed fixtures until platform actions are available; do not add direct Prisma access.

### Stage 2 — Vertical integration

Integrate in thin slices, fixing each before adding the next:

1. Authentication and protected navigation.
2. Mentor activation and directory visibility.
3. Meeting request and mentor response.
4. Slot proposal and mentee selection.
5. Attendance confirmation and time-based completion evaluation.
6. Feedback submission and duplicate prevention.

For MVP completion, evaluate eligible past meetings during relevant server reads and mutations through the domain service. Add a scheduled job in a later phase rather than exposing a manual production endpoint.

### Stage 3 — Stabilization and handoff

- Test authorization, ownership checks, invalid transitions, capacity limits, UTC boundaries, one-retry enforcement, rating validation, and duplicate requests or feedback.
- Add one automated end-to-end test covering the complete demo journey.
- Verify production build, migrations, seed/demo accounts, responsive basics, empty/error/loading states, and deployment configuration.
- Update `README.md` to distinguish the retained legacy stack from Queens Match and document setup, environment, migration, testing, and deployment for `web/`.

## Coordination rules

- Developer 1 owns schema, validation contracts, auth middleware, and state-machine code.
- Developers 2 and 3 own separate route/component trees and consume shared contracts.
- Shared layout changes require one designated integrator.
- Merge order for each vertical slice is platform contract, feature UI, then integration test.
- Each track submits small changes organized by user journey; no Phase 2 features enter Phase 1 branches.
- Daily integration uses the same migration and seed version; contract changes are announced before dependent work continues.

## Definition of Done

- A fresh environment can be configured, migrated, seeded, built, and deployed from documentation.
- The existing CRA and Express applications remain present and runnable through documented legacy commands.
- Authentication and route protection work for both roles under one account.
- Mentor profiles appear immediately in the URL-filtered directory and respect capacity.
- The complete request-to-feedback journey works without manual database edits.
- Every mutation is Zod-validated, authorized, and routed through the domain service and Prisma DAL.
- Invalid status transitions and a second request for more times are rejected server-side.
- Times remain correct across tested time zones.
- Core domain tests, the happy-path end-to-end test, lint, type-check, and production build pass.

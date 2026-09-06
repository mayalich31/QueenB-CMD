# Queens Match Web

The Phase 1 Queens Match MVP is a Next.js App Router application using
TypeScript, Tailwind CSS, Supabase Auth/PostgreSQL, Prisma 7, and Zod 4.

## Prerequisites

- Node.js 24
- npm
- A Supabase project with email authentication enabled

## Environment

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL`: Supabase pooled PostgreSQL URL used by the running app.
- `DIRECT_URL`: Supabase direct PostgreSQL URL used by Prisma CLI commands.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key.
- `CRON_SECRET`: Bearer token Vercel sends to `/api/cron/*`. Use a random
  string of at least 16 characters.

Never commit `.env`. Add local and production callback URLs to Supabase Auth
redirect URLs:

- `http://localhost:3000/auth/callback`
- `https://your-production-domain/auth/callback`

## Setup

From `web/`:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Open `http://localhost:3000`.

## Development checks

```bash
npm test
npm run lint
npm run typecheck
npm run build
npx prisma validate
```

`npm run check` runs the complete sequence.

## MVP demo flow

1. Register two accounts and confirm their emails if confirmation is enabled.
2. Sign in with one account and activate its mentor profile from My Profile.
3. Sign in with the other account, filter the directory homepage, and request
   that mentor.
4. As the mentor, propose one or more local date/time options. They are stored
   in UTC.
5. As the mentee, select a time or request alternatives once.
6. Confirm attendance once as the mentor and once as the mentee. The meeting
   remains scheduled until both confirm.
7. After both confirmations and the scheduled timestamp passes, run the
   completion job (or wait for production cron). Both participants then verify
   whether the meeting happened.
8. If both confirm it happened, each participant submits one rating. If not,
   both can agree to one reschedule; a declined or failed retry becomes
   `NOT_COMPLETED`.
9. Missing feedback is reminded every two days. After seven days the mentee
   cannot send new meeting requests until they submit overdue feedback.

Either participant may cancel any active meeting. Completed, not-completed,
and cancelled meetings are terminal except for the single post-meeting
reschedule.

## Authenticated routes

- `/dashboard`: mentor directory homepage with URL-based topic filtering.
- `/dashboard/profile`: pending requests, upcoming meetings, history, and
  mentor activation/settings.
- `/dashboard/mentor`: mentor request and meeting operations.

## Architecture

- `app/`: routes, Server Components, and authenticated Server Actions.
- `components/`: reusable UI components.
- `lib/validations/`: incoming DTO validation.
- `lib/services/`: authorization and meeting state rules.
- `lib/dal/`: Prisma-only persistence functions.
- `lib/supabase/`: browser/server clients and session refresh.
- `prisma/`: schema and ordered SQL migrations.

All meeting writes pass through service-level authorization and the centralized
state machine. PostgreSQL constraints protect critical invariants if another
writer bypasses the application.

## Scheduled jobs

`vercel.json` registers production-only cron routes. Vercel sends
`Authorization: Bearer $CRON_SECRET`. Hobby deployments may only invoke cron
once per day; the 15-minute completion schedule requires a plan that allows
that frequency.

- `GET /api/cron/complete-meetings` every 15 minutes: complete attendance-
  confirmed meetings whose UTC start has passed, then notify both participants
  to verify the outcome.
- `GET /api/cron/feedback-reminders` daily at 09:00 UTC: create deduplicated
  reminder notifications every two days after verification unlocks feedback.

Locally invoke the same handlers:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/complete-meetings
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/feedback-reminders
```

## Realtime notifications

The dashboard header bell and toast host subscribe to `Notification` inserts
for the signed-in user. After migrate, confirm in Supabase:

1. Database → Replication: `Notification` is in the `supabase_realtime`
   publication.
2. RLS is enabled and the `notification_select_own` policy allows
   `authenticated` users to select only their rows.
3. Two browser sessions can request a meeting and see the counterpart toast
   without refreshing.

## Current MVP boundaries

- Click-to-paint calendars, slide-over meeting routing, admin tools,
  WhatsApp/SMS, profile photos, and optional professional fields remain
  deferred.
- A full automated two-user E2E test requires isolated Supabase test credentials
  and deterministic email confirmation. Until those are provisioned, use the
  documented demo flow alongside the automated domain test suite.

## Dependency audit note

`npm audit` currently reports high-severity advisories through Prisma 7.10's
transitive `deepmerge-ts` and `mysql2` dependencies. The MySQL code path is not
used by this PostgreSQL application, and npm's proposed forced fix downgrades
Prisma to version 6, which is incompatible with this setup. Do not apply the
forced downgrade; upgrade Prisma when its compatible patched release is
available.

## Deployment

Deploy `web/` as the Vercel project root, configure all environment variables
including `CRON_SECRET`, run `npx prisma migrate deploy` against the target
database, enable Realtime on `Notification`, and register the production
callback URL in Supabase before enabling traffic. Cron jobs run in UTC and
only on production deployments.

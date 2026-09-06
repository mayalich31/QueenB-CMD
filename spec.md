QUEENS MATCH: Technical Blueprint & Architecture

1. Project Overview & Architecture
Stack: Next.js (App Router), TypeScript, TailwindCSS, PostgreSQL (Supabase Free Tier), Prisma ORM, Supabase Auth.
Pattern: Strict MVC mapping. Zod schemas act as the DTO validation layer for all incoming API payloads, while Prisma serves as the DAO implementation layer executing database integration queries. Next.js Server Components handle data fetching.
Automation & Real-Time: Vercel Cron executes scheduled jobs (e.g., 48-hour feedback reminders). Supabase Realtime WebSockets handle all strictly in-app notifications. (Note: External WhatsApp/SMS integration for reminders and attendance is currently deferred). 

2. Routing & Navigation Structure
Hybrid User Experience: A single user account handles both roles via boolean flags (is_mentor, is_admin). The main UI features a navigation toggle separating /dashboard/mentee and /dashboard/mentor to prevent cognitive overload.
Directory Search: The mentor directory relies on Next.js URL Search Params for highly performant, server-side filtering without client-side state. Mentors tag their profiles with specific advisory topics (e.g., advising on a specific company, mock interviews, career planning). Mentees can filter the directory by these exact topics using multiple URL parameters (e.g., ?topic=mock_interview&topic=career_planning).
Mentor Calendar: The primary /dashboard/mentor/calendar route acts as a command center. Mentors click-to-paint on an empty calendar grid to propose discrete UTC time slots. Clicking an existing meeting opens a slide-over drawer (/meetings/[id]) to handle isolated state transitions (approving attendance, rescheduling) without leaving the calendar view.

3. Database Schema & State Machine
Core Entities: Unified Users table, 1-to-1 MentorProfile (tracking concurrent meeting capacity and topic tags), Meetings, MeetingSlot, and Feedback tables.  
State Flow: WAITING_FOR_MENTOR_TIMES ➔ WAITING_FOR_MENTEE_SELECTION ➔ SCHEDULED ➔ ATTENDANCE_CONFIRMED ➔ COMPLETED / NOT_COMPLETED / CANCELLED.
Time-Based Completion: There is no manual verification state. If a meeting holds the ATTENDANCE_CONFIRMED status and its scheduled timestamp passes, the system automatically treats the meeting as COMPLETED.
Strict Iteration Limits: The state machine enforces a strict one-iteration limit for scheduling conflicts. 
- Pre-Match: A has_requested_more_times boolean ensures mentees can request new times exactly once if initial slots fail. A second failure rejects the request.
- Post-Match: Enforced by a has_rescheduled boolean. If a meeting hits a snag prior to confirmation, this flag flips, prompting new time proposals. A second cancellation permanently cancels the match.
Feedback Data Structure: The Feedback table requires a mandatory 1-5 quantitative integer rating alongside an optional qualitative text field to support future admin sorting and quality filtering.  

4. Notifications & Enforcement
WebSocket Scope: A global Supabase Realtime listener mounts in the root layout.tsx. It powers a persistent Bell icon in the top navigation and global toasts, ensuring users receive asynchronous alerts regardless of their current page.
Post-Meeting Verification Flow: Once the meeting timestamp has passed and the meeting is COMPLETED, the system sends an automated message to both parties checking if the meeting actually took place. If yes, it triggers feedback submission. If no, it asks if they still wish to meet. If both answer yes, it consumes their single reschedule iteration and routes back to the time proposal stage.
Feedback Reminders & Soft Blocks: Vercel Cron triggers an automated reminder every 2 days for missing feedback. Users failing to submit feedback within 7 days receive a UI-level soft block. Primary action buttons (like "Request Mentor") are disabled alongside an explanatory banner.

5. Admin Dashboard Hierarchy
The /admin route group relies strictly on Next.js Server Components, utilizing a persistent sidebar to navigate distinct views:
Alerts Inbox (/admin): The default landing page prioritizes dynamic, actionable alerts to function as a triage inbox (e.g., meetings marked as "Did not happen", meetings stuck in "Attendance Confirmed" past their scheduled time, overdue feedback > 7 days, flagging mentors hitting the 10-meeting milestone).  
Meetings Report (/admin/meetings): A granular data table tracking all scheduled meetings, filterable by status or participant via URL params.  
Master Calendar (/admin/calendar): A color-coded global visual grid displaying all system-wide scheduled meetings by their current status.  
User Directory (/admin/users): A paginated directory listing user details, emails, and exact mentoring session counts.  
Nested Drill-Downs: Dedicated /admin/meetings/[id] and /admin/users/[id] routes for viewing specific transaction histories, registration data, and submitted feedback.  

The application flow relies on a unified authentication gateway that branches into isolated mentor and mentee workspaces. Similar to architecting a Java-based Kanban application, the front-end components here map directly to specific state transitions while keeping the user experience entirely seamless.

Authentication & Onboarding
The Flow: Users land on a public login screen. New users pass through a multipart registration form that validates payloads via Zod before touching the database.
Showcase Features:
Mandatory Fields: Email, strong password, and username. 
Professional Profile: Optional fields for programming languages, tech stack, current role, years of experience, a profile picture, GitHub, and LinkedIn links.
Role Declaration: A toggle to opt-in as a mentor, which expands the form to capture advisory topics, background, and meeting capacity.

The Mentee Workspace
The Flow: Upon toggling to the mentee view, the user is greeted by the discovery engine. Once a request is sent, the UI shifts from discovery to active state-machine management.
Showcase Features:
Mentor Directory: A dedicated page displaying available mentors alongside their relevant mentoring details. This is heavily filterable via URL search parameters based on specific advisory topics.  
Actionable Cards: Each mentor profile contains a direct button to express interest and request a meeting.  
Booking UI: If the mentor accepts the initial request, the mentee is presented with a visual calendar displaying the mentor's proposed time slots to finalize the match.  
Status Tracker: A persistent active-state component tracks in-flight requests (e.g., prompting the mentee to select a time, or offering a button to request additional times if none of the proposed slots work).  

The Mentor Workspace
The Flow: The mentor view is strictly operational. Instead of searching a directory, the mentor manages inbound requests and their existing schedule.
Showcase Features:
Interactive Calendar: The core component. Scheduled, pending, and completed meetings populate the grid, color-coded by their exact database status.
Time Proposal Modal: When a mentee requests a meeting, the system notifies the mentor. The mentor can use a calendar UI to highlight and propose available time slots, or reject the request.  
Meeting Control Room: Clicking any existing meeting opens a contextual slide-over drawer. This isolates the controls needed to approve attendance, initiate a one-time reschedule, or submit mandatory post-meeting feedback without leaving the main calendar view.

A mentee does not need to create a second account; the application handles this transition internally since all users share a unified account table.

The Mentor Opt-In Flow
Profile Activation: The user navigates to her existing account settings and clicks an opt-in toggle (e.g., "Become a Mentor"), which triggers the mentor onboarding form.
Detailed Setup: The application requires her to input mentor-specific details, including her professional background and the exact topics she can advise on via multi-select checkboxes (e.g., advising on a specific company, mock interviews, career planning).
Capacity Limits: She must define her mentoring boundaries by stating how many sessions she is willing to take on and specifying the length of each meeting. 
Instant Visibility: Upon submission, the system flips her is_mentor boolean flag to true and populates her MentorProfile extension in the database, making her instantly visible in the public directory.
Ongoing Management: The system allows the user to return to this screen and edit her mentor details at any given time.
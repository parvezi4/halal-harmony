---
name: halal-matrimony-mvp
overview: Design an MVP for a halal, web-based Muslim matrimonial platform with simple, responsive UI, global reach, and basic subscription and messaging features.
todos:
  - id: clarify-stack
    content: Confirm preferred tech stack (frontend framework, backend style, database) and hosting approach.
    status: completed
  - id: define-user-stories
    content: Write detailed user stories and acceptance criteria for Phase 1 (auth, onboarding, profile, basic search).
    status: completed
  - id: design-wireframes
    content: Create low-fidelity wireframes for landing, dashboard, profile, search, and messaging views, including onboarding wizard.
    status: in-progress
  - id: plan-payments
    content: Design subscription tiers and map them to Stripe plans for MVP.
    status: pending
  - id: setup-api-tests
    content: Set up Jest with API tests for register route and pre-push quality gate (tests + lint + typecheck).
    status: in-progress
isProject: false
---

### High-level goals

- **Build a responsive web MVP** that works well on mobile and desktop browsers, focused on halal matchmaking flows.
- **Prioritize simplicity and safety** over advanced features: clear profiles, controlled communication, basic subscriptions, and strong privacy/modesty defaults.
- **Take inspiration from `purematrimony.com` and `sunnahmatch.com`** while keeping scope realistic for a first release.

### Core user roles

- **Guest (unauthenticated)**
  - View marketing/landing pages describing the service, values, and pricing.
  - Start registration and verify email.
  - Read high-level FAQs and safety/Islamic guidelines.
- **Registered member (free)**
  - Complete profile with Islamic and personal criteria.
  - Browse a limited number of profiles (read-only or blurred details).
  - Save basic search filters.
  - Upgrade to paid subscription.
- **Subscribed member (paid)**
  - Full access to search and view profiles within halal boundaries.
  - Initiate and receive messages (within messaging rules).
  - See limited activity indicators (e.g. last active, online recently) respecting privacy.
- **Admin/moderator**
  - Manage users, profiles, reports, and content.
  - Approve or reject suspicious profiles.
  - Configure subscription plans and monitor payments.

### MVP feature set

#### 1. Authentication & onboarding

- **Account creation & login**
  - Email + password auth (with email verification).
  - Basic password reset via email.
- **Onboarding wizard** (mandatory, multi-step, async auto-save per step, resume-capable)
  - Single-route, component-based wizard at `/onboarding` with 5 steps + completion flow.
  - **Hard gate**: Profile completion required before accessing `/search`, `/messages`, `/dashboard`; incomplete profiles redirect to `/onboarding`.
  - **Gender-specific validation rules**:
    - **Minimum age**: 14 years (both genders); younger users blocked with "You must be at least 14 years old to join."
    - **Female**: Cannot sign up if marital status = "married"; profile creation rejected with "AlHarmony is for single sisters..." error. Must provide Wali (guardian) contact: name, email, phone (stored privately, never shown publicly).
    - **Male**: Can be married and seek second wife; Wali not required.
  - **Five-step form** with async auto-save and resume on re-login (resume from last uncompleted step):
    - **Step 1 – Basic Info** (mandatory): Full name, gender (immutable after selection), DOB/age (validates 14+), nationality, country, city (optional), ethnicity (optional).
    - **Step 2 – Islamic Details** (mandatory): Practicing level, prayer frequency, height, weight (optional), body shape, hijab/beard style (gender-specific UI), Sunni madhab.
    - **Step 3 – Marital & Family** (mandatory): Marital status (gender-specific dropdown; female married status blocked at submission), children count (0–10), children living with user (conditional), relocation willingness (yes/maybe/no) + optional notes.
    - **Step 4 – Preferences** (mandatory): Spouse status preferences (gender-specific checkboxes; at least 1 required).
      - Female seeking: Virgin, Divorced, Annulled.
      - Male seeking: Virgin, Married (second wife), Separated.
    - **Step 5 – Wali Info** (mandatory for female; summary review for male):
      - **Female**: Wali name, relationship (Father/Brother/Uncle/Grandfather/Imam/Other), email (validated), phone (validated). Privacy notice: "This info is private and never shown publicly."
      - **Male**: Read-only summary review of Steps 1–4; no wali fields required.
  - **UI/UX**:
    - Progress bar showing step number and percentage.
    - Previous/Next buttons with validation blocking progression on invalid data.
    - "Save & Exit" allows users to leave mid-wizard and resume later.
    - Blocking error messages for rejected states (e.g., married female, age < 14).
    - Congratulations page after Step 5 with next-step guidance.
  - **Async save mechanism**: Each step saves independently server-side; users can return to incomplete wizards and resume from last completed step.
  - Upon final Step 5 submission: `onboardingCompletedAt` timestamp recorded in database and profile status set to `PENDING_REVIEW` (admin approval required before appearing in search).
  - Post-wizard: Optional profile photo upload step with blurred display rules.

#### 2. Profiles & halal constraints

- **User profile**
  - Public profile view (as seen by opposite gender) with:
    - Limited personal identifiers (no direct contact info in profile text).
    - About section, Islamic background, family background, education, profession.
    - Marital preferences and expectations.
  - Privacy controls (MVP level):
    - Show/hide photos to non-subscribers.
    - Option to hide exact age (show range) or city (show country/region only).
- **Profile completeness & status**
  - Profile completeness indicator to encourage filling key fields.
  - **Completeness Calculation**: Percentage based on total (mandatory + optional) fields filled.
    - **Mandatory fields** (~12-15 depending on gender):
      - Alias, Gender, Location (city/country), Date of birth
      - Practicing level, Prayer habit, Body shape, Hijab/Beard preference
      - Marital status, Number of children, Spouse status preferences
      - Wali info for females (name, relationship, contact)
    - **Optional fields** (~5):
      - About/Bio, Photos, Education, Profession, Madhab/Religious school
    - **Formula**: `(completed_fields / total_fields) × 100%`
    - Example: If 13 fields completed out of 17 total, percentage = 76%
  - Status: pending review, approved, suspended.

#### 3. Search & discovery

- **Search filters (opposite gender only)**
  - Basic: age range, country, city/region, marital status.
  - Islamic/lifestyle: practicing level, sect/creed (optional), hijab/beard, smoking, etc.
  - Other: education level, profession, willingness to relocate.
- **Search results list**
  - Paginated list with thumbnail, age (or range), location, and key Islamic markers.
  - Ability to save a search as a named filter.
- **Browse & shortlist**
  - View profile details from search results.
  - Add/remove profiles from favourites/shortlist.

#### 4. Messaging (within halal guidelines)

- **Conversation model**
  - 1-to-1 text conversations between compatible, opposite-gender members.
  - Optional field to CC wali/guardian email or add them to the conversation in future versions (MVP: just store wali contact info on profile for offline sharing).
- **Messaging rules for MVP**
  - Only paid subscribers can initiate messages.
  - Limit on number of new conversations per day/week to reduce spam.
  - Simple text messages only (no images/attachments in MVP).
  - Basic blocking and reporting within a conversation.
- **Inbox UI**
  - List of conversations with name/alias, last message, timestamp, unread count.
  - Conversation view optimized for mobile.

#### 5. Subscription & payments

- **Plans & access model**
  - Free tier:
    - Create and complete profile.
    - Limited browsing (e.g. limited profile views per day).
    - Cannot initiate messages.
    - Cannot exchange photos.
  - Paid tier:
    - Full profile views (within privacy settings).
    - Ability to initiate and reply to messages.
    - Priority in search results.
    - Advanced search features.
    - Can send request to potential candidate to exchange photos
- **Payment integration (global, simple)**
  - Stripe integration for card payments (global coverage) as primary.
  - Optional PayPal later; MVP can launch with Stripe only.
  - Simple subscription periods: monthly, quarterly, half-yearly and yearly.
  - Option for entering discount codes.
  - Basic billing history and status (active, expired, cancelled).

#### 6. Dashboard & UX

- **Member dashboard** (`/dashboard`)
  - **Overview cards**: 
    - Profile completeness (with progress bar showing % and field counts: X/Y fields completed)
    - Subscription status (Free/Premium/Expired with conditional upgrade button)
    - Messages (unread conversations count, total active threads)
    - Profiles to explore (available opposite-gender profile count)
  - **Quick action buttons**: Edit profile, Start search, Favourites, Manage subscription
  - **Dynamic content**: All data fetched from database; greeting personalized with user's alias or name; member-since date from account creation
  - **API endpoint**: `GET /api/dashboard` (authenticated, returns dashboard data with completeness breakdown)
- **Notifications (MVP-level)**
  - In-app notification badges for new messages.
  - Email notifications for new messages (with opt-out) and subscription events (renewal, failure, expiry).
- **Global navigation & layout**
  - Mobile-first, responsive design.
  - Simple top nav: Home, Search, Messages, Profile, Account/Settings.

#### 7. Safety, moderation, and Islamic guidelines

- **Content and behaviour guidelines**
  - Dedicated pages for Islamic guidelines, privacy policy, terms of service, safety tips.
  - Enforce no exchange of phone/email/WhatsApp in profile text (basic text checks for obvious contact info patterns).
- **Reporting and blocking**
  - Report profile or conversation with selectable reasons (haram content, harassment, fraud, etc.).
  - Block user: prevents further messaging and hides each other in search.
- **Admin tools (MVP, minimal)**
  - Simple admin panel to:
    - View user list with filters.
    - View and moderate reported users and conversations.
    - Manually change profile status (approve/suspend).
    - View subscription status of user/s.
    - View payment status of user/s.

### Technical recommendations (for MVP)

#### 1. Platform & architecture

- **Frontend**
  - **Framework**: Next.js (latest, App Router) with React and TypeScript, hosted on Vercel.
  - **Styling/UI**: Tailwind CSS plus a light/headless component library (e.g. Headless UI or similar) for dialogs, menus, etc.
- **Backend**
  - Use Next.js as a **full-stack app**:
    - Route Handlers / API routes for JSON APIs (auth, profiles, search, messaging, subscriptions, webhooks).
    - Server components and/or server actions where appropriate for mutations (e.g. profile updates).
  - Authentication and session management via a standard Next.js authentication solution (e.g. Auth.js / NextAuth with credentials provider), using cookie-based sessions backed by the database.
- **Database & storage**
  - **Relational DB**: PostgreSQL, provided by Supabase (managed Postgres).
  - **File storage**: Supabase Storage buckets for profile photos and other user-uploaded media.
  - Aim to keep infrastructure providers minimal: Vercel (app hosting), Supabase (database + storage), Stripe (payments).

#### 2. Key data models (simplified)

The key data models remain as previously defined and map naturally onto PostgreSQL via an ORM like Prisma or Supabase’s SQL APIs:

- **User**: id, email, password hash, role (member/admin), emailVerified, createdAt.
- **Profile**: userId, gender, fullName, dateOfBirth, age-derived fields, country, city, region, nationality, ethnicity; practicing level, prayer habit, height, weight, body shape, hijab/beard, madhab; marital status, number of children, children living with user, willing to relocate with notes; spouse status preferences (JSON), wali contact info (name, relationship, email, phone—private for females); visibility settings, profile status (pending_review/approved/suspended), onboardingCompletedAt (nullable; null = incomplete, set on wizard completion).
- **Photo**: id, profileId, url, isPrimary, isApproved (for blur/unblur logic).
- **SubscriptionPlan**: id, name, price, duration, features.
- **Subscription**: userId, planId, status, startDate, endDate, stripeCustomerId, stripeSubscriptionId.
- **MessageThread**: id, participantAId, participantBId, createdAt, lastMessageAt, isBlocked.
- **Message**: threadId, senderId, content, createdAt, isRead.
- **Report**: id, reporterId, reportedUserId or messageThreadId, reason, status.

#### 4. Environments and Stripe modes

- **Opposite-gender interactions only for marriage intent**
  - Enforce opposite-gender matching in search and messaging logic, configurable for specific jurisprudential views later.
- **Guardians/wali concept (simple in MVP)**
  - Store female wali contact details privately on profile. For male members do not need a wali.
  - Provide template messages encouraging involving wali early; later you can add shared conversation access.
- **Modesty and privacy**
  - Clear content rules for photos and text.
  - Easy account deletion and data export if feasible.
- **Environment separation and payments**
  - Use separate configuration for **development/staging** vs **production**.
  - For payments, integrate **Stripe**:
    - Use **Stripe test mode** (sandbox) and test API keys (`sk_test_...`, `pk_test_...`) for all development and trial flows, with test webhooks configured against staging URLs.
    - Only enable real charges in production once ready, by switching to live keys (`sk_live_...`, `pk_live_...`) and configuring live-mode webhooks for the production URL.
  - Keep all secrets (Stripe keys, Supabase keys, etc.) in environment variables managed by Vercel and/or Supabase.

### Phased rollout within the MVP

- **Phase 1 – Core foundation**
  - Authentication, onboarding/profile creation, basic search, profile viewing.
- **Phase 2 – Subscriptions & messaging**
  - Stripe integration, subscription gating, messaging with basic rules.
- **Phase 3 – Moderation & refinement**
  - Reporting/blocking, admin panel, better email notifications, UX polish.

### Non-goals for the first MVP

- Native iOS/Android apps.
- Complex recommendation/AI matching algorithms (stick to filters + simple match suggestions like “people who match your criteria”).
- Advanced real-time features (typing indicators, web sockets) beyond what is necessary for basic messaging.
- Integrations with many regional payment providers.

### Mermaid diagram: simplified user flow

```mermaid
flowchart TD
  guest[Guest] --> signup[Signup & EmailVerification]
  signup --> member[MemberLoggedIn]
  member --> completeProfile[CompleteProfileWizard]
  member --> dashboard[Dashboard]
  dashboard --> search[SearchOppositeGender]
  dashboard --> messages[Messages]
  dashboard --> subscription[ManageSubscription]

  search --> viewProfile[ViewProfile]
  viewProfile --> shortlist[AddToFavourites]
  viewProfile --> subscribeIfNeeded[UpgradeToPaid]
  subscribeIfNeeded --> subscription
  subscription --> paidMember[PaidMember]
  paidMember --> messages

  messages --> thread[ConversationThread]
  thread --> report[ReportOrBlock]
```

### Phase 1 – API Testing & Quality Gates

To ensure code quality and prevent regressions before pushing to `master`, establish a lightweight automated testing strategy focused on API routes with local pre-push enforcement.

#### Objectives

- Fast, deterministic API route handler tests using Jest with mocked dependencies (Prisma, bcrypt).
- Local pre-push git hook enforcing: tests + lint + typecheck.
- Keep execution time under 5-10 seconds for fast feedback.
- Leverage Vercel's deploy-time build validation; defer GitHub Actions CI to Phase 2.

#### Phase 1 Scope – Register Route Only

**Test coverage for `app/api/auth/register/route.ts`**:

1. **Success case**: Valid email and password → 200 with user object
2. **Validation failure**: Missing or short password → 400 with error
3. **Duplicate user**: Existing email → 400 with error
4. **Unexpected error**: Prisma failure → 500 with error

**Mocking strategy**:

- Mock `@/lib/prisma` client for database isolation
- Mock `bcryptjs` for deterministic, fast password hashing
- Use synthetic `Request` objects (no real HTTP server)

#### Implementation Steps

1. **Install Jest tooling**:
   - Add `jest`, `@types/jest`, `ts-jest`, `husky` to devDependencies
   - Add scripts: `test`, `test:watch`, `test:api`, `typecheck` (`tsc --noEmit`)

2. **Configure Jest**:
   - Create `jest.config.ts` with Node environment, `ts-jest` transform, and `@/*` path alias mapping
   - Create `jest.setup.ts` for shared env setup (`NEXTAUTH_URL`, etc.) and mock reset hooks

3. **Write register route tests**:
   - Create `tests/api/auth/register.route.test.ts` with 4 test cases (success, validation, duplicate, error)
   - Mock Prisma client methods (`findUnique`, `create`) and bcrypt hash function
   - Validate response status codes and JSON payloads

4. **Add pre-push hook**:
   - Install and initialize Husky: `npx husky init`
   - Create `.husky/pre-push` running: `npm run test:api && npm run lint && npm run typecheck`
   - Exclude `build` from pre-push for speed (Vercel validates builds on deploy)

5. **Document testing workflow**:
   - Add testing section to README.md with commands, pre-push behavior, and emergency bypass instructions

#### Verification Checklist

- [ ] `npm run test:api` passes in <5 seconds
- [ ] `npm run lint` and `npm run typecheck` pass
- [ ] Breaking a test blocks `git push` with clear error message
- [ ] Introducing lint or type error blocks `git push`
- [ ] Fixing all issues allows push to succeed
- [ ] `npm run test:watch` provides fast feedback loop for development

#### Phase 2 – Deferred Items

- **Stripe checkout tests**: Add tests for `app/api/stripe/checkout/route.ts` (happy path + error cases, mocked Stripe SDK)
- **GitHub Actions workflow**: Add CI pipeline for PR quality checks if branch protection or team collaboration requires remote enforcement
- **Vercel test integration**: Optionally add `&& npm run test:api` to Vercel build command (via dashboard or `vercel.json`) to block deployments on test failures

#### Design Decisions

- **Test runner**: Jest (mature ecosystem, good TypeScript support)
- **Pre-push gates**: API tests + lint + typecheck only (no build for speed)
- **Coverage depth**: Happy path + key failure modes (not exhaustive edge cases in Phase 1)
- **Mocking approach**: Full isolation via mocked Prisma/bcrypt for speed and determinism
- **Vercel integration**: Optional; Vercel's default build validation catches build failures, tests can be added later if needed

### Next steps

- Finalize and provision the chosen stack: Next.js on Vercel, Supabase for Postgres + storage, and Stripe for subscriptions (with clear test vs live configurations).
- Detail user stories and acceptance criteria for Phase 1 features.
- Sketch low-fidelity wireframes for landing page, dashboard, profile, search, and messaging.
- Set up project repo and initial scaffolding once this plan is approved.

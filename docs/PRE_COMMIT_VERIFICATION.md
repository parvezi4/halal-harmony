# Pre-Commit Verification & Manual QA Guide

**Last Updated**: March 19, 2026  
**Environments**: Local Dev & Vercel Staging (both use same database)  
**Current Test Results**: ✅ 200 tests passing (26 suites)

---

## Automated Test Results (current)

```
Test Suites:  26 passed, 26 total
Tests:       200 passed, 200 total
Time:        ~10 seconds
```

Note: totals increase as new payment suites are added. Re-run `npm run test` for latest counts.

### Test Breakdown

| Suite | Tests |
|-------|-------|
| Register API | 7 |
| Favorites API | 9 |
| Favorites Actions | 5 |
| Messaging Actions | 15 |
| Admin Moderation Actions | 14 |
| Admin Auth (split login, role validation) | 15 |
| Dashboard Actions/API | varies |
| Search API + Profile Routes | varies |
| Photo Constraints | varies |
| Onboarding Validation | varies |
| Profile CRUD | varies |
| Stripe Checkout API | 4 |
| Stripe Webhook API | 5 |
| Billing Actions/APIs | 13 |

---

## Admin Panel Commits (current series)

| # | Commit | Feature |
|---|--------|---------|
| 1 | `41e34ab` | Live stats badges on admin dashboard cards |
| 2 | `7cf291d` | Flagged users inline actions + risk colour coding |
| 3 | `8737b9b` | Reject + Warn moderation persistence (`ModerationWarning` table) |

---

## Database Changes Verification

**If modifying schema or seeds, verify before committing:**

```bash
# 1. Create migration locally
npx prisma migrate dev --name <description>

# 2. Test in dev server
npm run dev
# Manually test the feature that depends on schema change

# 3. Verify seed data works (if also updating seeds)
npm run prisma:seed
npx prisma studio  # Browse and verify data

# 4. Commit migration files
git add prisma/migrations/
git commit -m "Add migration: <description>"

# 5. On push, Vercel auto-applies migration to staging ✅
```

**Verify staging automatically:**
- Vercel build logs should show: `✓ Ready in Xs`
- Check Vercel deployment status for any database migration errors
- For full guidance, see [docs/DATABASE_MANAGEMENT.md](DATABASE_MANAGEMENT.md)

---

## Preparation

```bash
# 1. Sync schema (adds ModerationWarning table if not yet present)
npx prisma db push

# 2. Seed test data (wipes and re-populates)
npm run prisma:seed

# 3. Start dev server
npm run dev
# Open http://localhost:3000
```

---

## Test Accounts Reference

### Regular Members (`/auth/login`)

| Email | Password | Notes |
|-------|----------|-------|
| `ahmed@example.com` | `Password123!` | Male, married, premium subscription |
| `fatima@example.com` | `Password123!` | Female, virgin, premium subscription |
| `ali@example.com` | `Password123!` | Male, separated, free member |
| `aisha@example.com` | `Password123!` | Female — onboarding incomplete |
| `yusuf@example.com` | `Password123!` | Male — onboarding incomplete |
| `zainab@example.com` | `Password123!` | Female, 5 photos (max limit) |
| `sara@example.com` | `Password123!` | Female, age 14 (minimum) |

### Admin Scenario Profiles (visible in `/admin` only)

| Email | Password | Risk | Notes |
|-------|----------|------|-------|
| `musa.flagged@example.com` | `Password123!` | AMBER | 2 active reports, flagged thread |
| `khadija.flagged@example.com` | `Password123!` | RED | Risk-labeled, no reports |
| `ibrahim.suspended@example.com` | `Password123!` | RED | SUSPENDED status |
| `sumayyah.reported@example.com` | `Password123!` | GREEN | 1 open report |

### Admin / Moderator (`/admin/login`)

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `Password123!` | SUPERADMIN (protected — cannot be deleted) |
| `ops.male@example.com` | `Password123!` | ADMIN (male-scoped moderation; deletable by superadmin) |
| `ops.female@example.com` | `Password123!` | ADMIN (female-scoped moderation; deletable by superadmin) |
| `moderator.male@example.com` | `Password123!` | MODERATOR (male-scoped moderation; permissions configurable) |
| `moderator.female@example.com` | `Password123!` | MODERATOR (female-scoped moderation; permissions configurable) |

> ⚠️ Regular members use `/auth/login`. Admins/moderators use `/admin/login`. Using the wrong portal blocks login and shows a corrective message.

---

## Manual Test Checklist

### 0. Gender-Scoped Moderation (new)

- [ ] Login as `admin@example.com` (SUPERADMIN) and confirm message/photo/profile queues can show both male and female targets.
- [ ] Login as `ops.male@example.com` and `ops.female@example.com` (ADMIN) and confirm all three moderation queues only show assigned staff gender targets.
- [ ] Login as `moderator.male@example.com` and `moderator.female@example.com` (MODERATOR) and confirm all three moderation queues only show assigned staff gender targets.
- [ ] In `/admin/moderation/settings`, create a privileged user and confirm gender is required and displayed in the table.
- [ ] In `/admin/moderation/settings`, change an existing ADMIN or MODERATOR gender from the table and confirm only SUPERADMIN can do it.
- [ ] Confirm SUPERADMIN behavior remains unscoped after the above checks.

### 1. Admin Login & Access Control

- [ ] Go to `/admin/login` → login as `admin@example.com` (SUPERADMIN) → lands on `/admin`
- [ ] Go to `/admin/login` → login as `ops.male@example.com` (ADMIN) → lands on `/admin`
- [ ] Go to `/admin/login` → login as `ops.female@example.com` (ADMIN) → lands on `/admin`
- [ ] Go to `/auth/login` → try `admin@example.com` → blocked with "use /admin/login" guidance
- [ ] Go to `/admin/login` → login as `moderator.male@example.com` → lands on `/admin`
- [ ] Go to `/admin/login` → login as `moderator.female@example.com` → lands on `/admin`
- [ ] Go to `/auth/login` → try `moderator.male@example.com` → blocked with "use /admin/login" guidance
- [ ] Logged in as moderator, navigate to `/admin/audit-log` → redirected to `/admin/moderation`
- [ ] Logged in as moderator, navigate to `/admin/moderation/settings` → redirected to `/admin/moderation`
- [ ] Logout from admin shell → redirected to `/admin/login`

---

### 2. Admin Dashboard — Stats Badges (Commit 1)

> URL: `/admin`

Expected counts after a clean seed:

| Badge | Expected count | Links to |
|-------|---------------|----------|
| Message Queue | **1** | `/admin/moderation` |
| Profile Queue | **2** | `/admin/moderation/profiles` |
| Photo Queue | **5** | `/admin/moderation/photos` |
| Reports (open + reviewing) | **3** | `/admin/reports` |

- [ ] All 4 badge numbers are correct
- [ ] Each card is clickable and navigates to the right page
- [ ] Badges are hidden / show 0 when count is 0 (verify after approving all items)

---

### 3. Flagged Users — Inline Actions + Risk Colours (Commit 2)

> URL: `/admin/flagged`

- [ ] **GREEN row** — Sumayyah: green badge colour, Resolve action visible
- [ ] **AMBER row** — Musa: amber badge colour, **both** Resolve and Resolve + Suspend buttons visible
- [ ] **RED row** — Khadija: red badge colour, appropriate actions visible
- [ ] **SUSPENDED + RED row** — Ibrahim: Suspended status badge shown; Suspend action is **absent** (already suspended)
- [ ] Resolve + Suspend on Musa → confirm dialog → verify in Prisma Studio (`npx prisma studio`) that `Profile.status` = `SUSPENDED`

---

### 4. Message Queue — Approve / Reject / Reject + Warn (Commit 3)

> URL: `/admin/moderation`  
> After a fresh seed: 1 pending message (Musa's contact-sharing message in the Fatima–Musa thread)

#### 4a. Approve

- [ ] Click **✓ Approve** → message disappears from queue
- [ ] Dashboard "Message Queue" badge goes to **0**
- [ ] Re-seed before next sub-test

#### 4b. Reject (no warning)

- [ ] Click **✕ Reject** → message disappears from queue
- [ ] Open Prisma Studio → `ModerationWarning` table has **0 rows**
- [ ] Re-seed before 4c

#### 4c. Reject + Warn — valid warning

- [ ] Click **✕ Reject + Warn** → browser prompt appears
- [ ] Enter a message ≥ 5 characters (e.g. "Please keep conversations on-platform")
- [ ] Click OK → message disappears from queue
- [ ] Prisma Studio → `ModerationWarning` has **1 new row** with:
  - `recipientId` = Musa's user ID
  - `issuerId` = admin's user ID
  - `messageId` = the rejected message ID
  - `content` = the text you entered

#### 4d. Reject + Warn — short warning (validation error)

- [ ] Re-seed; click **✕ Reject + Warn**
- [ ] Enter < 5 characters (e.g. "no") → click OK
- [ ] **Error toast/message** appears: "Warning message must be at least 5 characters"
- [ ] Message **remains** in the queue
- [ ] `ModerationWarning` table: **no new rows**

#### 4e. Reject + Warn — prompt cancelled

- [ ] Click **✕ Reject + Warn** → click Cancel on browser prompt
- [ ] Nothing changes; message stays in queue

---

### 5. Profile Queue

> URL: `/admin/moderation/profiles`

- [ ] Page loads with pending profiles (expected: 2 after seed — Yusuf and Aisha as PENDING_REVIEW)
- [ ] Each row shows: alias, gender, country, onboarding completion date, photo count
- [ ] Click **Approve** → row disappears, dashboard profile count decrements
- [ ] Click **Suspend** → reason prompt → row disappears (status set to SUSPENDED)

---

### 6. Photo Queue

> URL: `/admin/moderation/photos`

- [ ] Page loads immediately with first batch (**8 photos per page**) and badge count matches dashboard (**5** after seed)
- [ ] Photos show user alias, risk level, MIME type, file size
- [ ] Photos render unblurred in moderation view so admins can review actual content
- [ ] Search by user name works
- [ ] Filter by risk level (GREEN / AMBER / RED / ALL) works
- [ ] Click **Approve** → photo leaves PENDING view
- [ ] Click **Reject** → photo removed from queue
- [ ] Prev / Next pagination works when enough photos exist
- [ ] Each action creates an entry in the Audit Log

---

### 7. Reports

> URL: `/admin/reports`

After seed, expected 3 active reports:

| # | Reporter | Reported | Status | Reason |
|---|----------|----------|--------|--------|
| 1 | Fatima | Musa | OPEN | Off-platform contact pushing |
| 2 | Fatima | Musa | REVIEWING | Ignored on-platform requests |
| 3 | Ahmed | Sumayyah | OPEN | Suspicious opening messages |

- [ ] All 3 reports visible in OPEN / REVIEWING filter
- [ ] Initial page auto-loads without pressing Apply Filters
- [ ] Prev / Next pagination works when enough rows exist
- [ ] Status filter (All / Open / Reviewing / Resolved / Dismissed) works
- [ ] Changing a report status updates the badge inline
- [ ] A 4th resolved report (Fatima → Ibrahim) visible under RESOLVED filter

---

### 8. Subscriptions

> URL: `/admin/subscriptions`

- [ ] Initial page auto-loads with Ahmed and Fatima's active Premium subscriptions
- [ ] Prev / Next pagination works when enough rows exist
- [ ] Status filter (ACTIVE / EXPIRED / CANCELLED / ALL) works
- [ ] Search by name or email works
- [ ] Sort by start date / end date / created date works
- [ ] Each row shows: alias, email, plan name, status, days remaining

---

### 8b. Payments (Member + Admin)

#### Member Billing

- [ ] Login as member and open `/dashboard/billing`
- [ ] Confirm current plan card and invoice table render
- [ ] Trigger cancel auto-renew and confirm success state refresh

#### Stripe Webhook Sync

- [ ] Run Stripe CLI forwarding to `/api/stripe/webhook`
- [ ] Complete a test checkout and confirm webhook event delivery success
- [ ] Verify subscription table updates (`stripeCustomerId`, `stripeSubscriptionId`, status)

#### Admin Payments

- [ ] Login as admin and open `/admin/payments`
- [ ] Confirm payments operations placeholder cards render
- [ ] Confirm communication placeholder table renders

For full payment QA details and test cards, follow `docs/MANUAL_QA_PAYMENTS.md`.

---

### 9. Members

> URL: `/admin/members`

- [ ] Paginated list auto-loads (16 users total after seed)
- [ ] Prev / Next pagination works (default page size 10)
- [ ] Filter by role (ADMIN / MODERATOR / MEMBER) works
- [ ] Filter by profile status (PENDING_REVIEW / APPROVED / SUSPENDED) works
- [ ] Search by name or email works
- [ ] Risk badge (GREEN / AMBER / RED) shows for flagged users (Musa, Khadija, Ibrahim, Sumayyah)
- [ ] **Suspend** available for APPROVED members; prompt for reason; status changes
- [ ] **Reactivate** available for SUSPENDED members; restores APPROVED

---

### 10. Audit Log (Admin-only)

> URL: `/admin/audit-log`

- [ ] Loads for `admin@example.com`; redirected to `/admin/moderation` for moderator accounts
- [ ] Initial page auto-loads latest 10 entries without pressing Apply Filters
- [ ] After running actions in tests 4–9 above, corresponding entries appear:
  - PHOTO_APPROVED, PHOTO_REJECTED
  - PROFILE_APPROVED, PROFILE_SUSPENDED
  - MEMBER_SUSPENDED, MEMBER_REACTIVATED
  - REPORT_STATUS_UPDATED
  - RISK_LABEL_UPDATED
- [ ] Filter by action type works
- [ ] Filter by actor (admin email) works
- [ ] Each entry shows: timestamp, action type, actor email, target type + ID, notes

---

### 11. Moderation Settings

> URL: `/admin/moderation/settings`

- [ ] Login as `admin@example.com` → Settings page loads
- [ ] Shows current moderation type: Pattern Recognition (active) / AI/NLP (visible but disabled — "Coming Soon")
- [ ] Moderation workflow toggle: Pre-moderation / Post-moderation visible and saveable
- [ ] Settings persist on page refresh

---

### 12. Admin RBAC — Privileged User Management

> URL: `/admin/moderation/settings` → scroll to "Privileged Users" section

#### 12a. SUPERADMIN protection

- [ ] Login as `admin@example.com` (SUPERADMIN) → Settings → Privileged Users table shows 5 rows (superadmin, 2 admins, 2 moderators)
- [ ] SUPERADMIN row (`admin@example.com`) shows "Protected" label — **no Delete button**
- [ ] Verify the four non-superadmin rows show Delete buttons and editable gender controls

#### 12b. Create a new moderator

- [ ] In the Create Privileged User form: enter `newmod@example.com`, password `Password123!`, role = MODERATOR → Create
- [ ] New row appears in the table with role MODERATOR
- [ ] Log out; log in at `/admin/login` as `newmod@example.com` / `Password123!` → lands on `/admin`

#### 12c. Delete a moderator

- [ ] Login as SUPERADMIN or ADMIN → Settings → click Delete on `newmod@example.com` → confirm → row disappears
- [ ] Try to login as `newmod@example.com` → blocked (account no longer exists)

#### 12d. ADMIN cannot delete ADMIN

- [ ] Login as `ops.male@example.com` (ADMIN) → Settings → only moderator rows have Delete button; `admin@example.com` shows Protected; `ops.male@example.com` (self) has no delete button; peer admin still has no delete button

#### 12e. Only SUPERADMIN can create ADMIN accounts

- [ ] Login as `ops.male@example.com` (ADMIN) → Settings → Create form role dropdown shows only MODERATOR (no ADMIN option)
- [ ] Login as `admin@example.com` (SUPERADMIN) → Create form role dropdown shows both ADMIN and MODERATOR

---

### 13. Admin RBAC — Capability Gating

> URL: `/admin/moderation/settings` → Moderator Permissions section

#### 13a. Disable a capability for the moderator

- [ ] Login as `admin@example.com` → Settings → Moderator Permissions → disable "Moderate Messages" (auto-saves)
- [ ] Log out; log in as `moderator.male@example.com`
- [ ] **Message Queue card** absent from dashboard (`/admin`)
- [ ] **Message Queue nav link** absent from sidebar
- [ ] Navigate directly to `/admin/moderation` → **redirected to `/admin`**

#### 13b. Re-enable the capability

- [ ] Login as admin → Settings → re-enable "Moderate Messages" (auto-saves)
- [ ] Log in as moderator → Message Queue card and nav link visible again

#### 13c. Test other capability gates

- [ ] Disable "Verify Profiles" → moderator loses Profile Queue card, nav link, and `/admin/moderation/profiles` access
- [ ] Disable "Verify Photos" → moderator loses Photo Queue card, nav link, and `/admin/moderation/photos` access
- [ ] Disable "Manage Members" → moderator loses Members card, nav link, and `/admin/members` access
- [ ] Disable "Inspect Subscriptions" → moderator loses Subscriptions nav link and `/admin/subscriptions` access
- [ ] Disable "Manage Reports" → moderator loses Reports + Flagged Users nav links and those pages

---

### 14. Regression — Member-Facing Features

- [ ] Login as `ahmed@example.com` at `/auth/login` → dashboard loads normally
- [ ] Navigate to `/search` → only opposite-gender (female) profiles shown
- [ ] Open a profile → "Send Message" button visible (Ahmed has premium)
- [ ] Click Send Message → navigates to `/messages` with thread pre-selected
- [ ] Send a clean message → appears immediately with no "Under Review" indicator
- [ ] Login as `aisha@example.com` → redirected to `/onboarding` (profile incomplete)
- [ ] Try navigating to `/dashboard`, `/search`, `/messages` as Aisha → all redirect to `/onboarding`
- [ ] Login as `fatima@example.com` → `/messages` shows Ahmed thread; unread badge visible if unread

---

### 15. Automated Quality Gates

Run locally before pushing:

```bash
npm run lint        # ESLint — must exit 0
npx tsc --noEmit    # TypeScript — must exit 0
npx jest            # Must show: 200 passed, 26 suites
```

---

## Known Acceptable Behaviour

- Browser `window.prompt` is used for Reject+Warn warning text and Suspend reason. These are not covered by automated tests — the manual steps above are required.
- Prisma Studio (`npx prisma studio`) is needed to confirm `ModerationWarning` row creation in test 4c.
- Photo Queue image rendering depends on files in `public/uploads/` being present after seed.

---

## Sign-Off

Confirm the following before marking the admin panel series as done:

- [ ] All manual test steps above passed
- [ ] No regressions in member-facing features (section 12)
- [ ] `npm run lint && npx tsc --noEmit && npx jest` all green

---

## What's Next

All planned admin panel commits (1–3) are complete. The only remaining `pending` item in PLAN.md is **`plan-payments`** — Stripe subscription management UI (checkout flow, plan selection, subscription lifecycle). All other items are marked `future`.

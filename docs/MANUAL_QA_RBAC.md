# Manual QA — Admin RBAC & Auth Domain Separation

**Feature:** Superadmin RBAC, `AdminAccount`/`MemberAccount` auth split, capability-gated moderator dashboard  
**Implemented:** March 2026  

---

## Setup

```bash
# 1. Apply migrations (if not already done)
npx prisma migrate dev

# 2. Fresh seed
npm run prisma:seed

# 3. Start dev server
npm run dev
# Open http://localhost:3000
```

### Test Accounts

| Email | Password | Role | Portal |
|-------|----------|------|--------|
| `admin@example.com` | `Password123!` | SUPERADMIN | `/admin/login` |
| `ops.male@example.com` | `Password123!` | ADMIN (MALE) | `/admin/login` |
| `ops.female@example.com` | `Password123!` | ADMIN (FEMALE) | `/admin/login` |
| `moderator.male@example.com` | `Password123!` | MODERATOR (MALE) | `/admin/login` |
| `moderator.female@example.com` | `Password123!` | MODERATOR (FEMALE) | `/admin/login` |
| `ahmed@example.com` | `Password123!` | MEMBER | `/auth/login` |

---

## Scenario 1 — Auth Domain Isolation

**Goal**: Verify that admin and member login portals are completely separated.

### 1a. Member credentials rejected at admin portal

1. Go to `http://localhost:3000/admin/login`
2. Enter email `ahmed@example.com`, password `Password123!`
3. Click Sign In
4. **Expected**: Login fails with an error message indicating this account cannot be used here

### 1b. Admin credentials rejected at member portal

1. Go to `http://localhost:3000/auth/login`
2. Enter email `admin@example.com`, password `Password123!`
3. Click Sign In
4. **Expected**: Login fails — the admin account is not in the member domain

### 1c. Moderator credentials rejected at member portal

1. Go to `http://localhost:3000/auth/login`
2. Enter email `moderator.male@example.com`, password `Password123!`
3. **Expected**: Login fails — only MEMBER accounts can use `/auth/login`

### 1d. All admin roles accepted at admin portal

1. Go to `http://localhost:3000/admin/login`
2. Login as `moderator.male@example.com` / `Password123!`
3. **Expected**: Lands on `/admin` dashboard
4. Logout; login as `ops.male@example.com`
5. **Expected**: Lands on `/admin` dashboard
6. Logout; login as `ops.female@example.com`
7. **Expected**: Lands on `/admin` dashboard
8. Logout; login as `moderator.female@example.com`
9. **Expected**: Lands on `/admin` dashboard
10. Logout; login as `admin@example.com`
11. **Expected**: Lands on `/admin` dashboard

---

## Scenario 2 — SUPERADMIN is Protected

**Goal**: Verify the superadmin account cannot be deleted.

1. Login at `/admin/login` as `admin@example.com` (SUPERADMIN)
2. Navigate to `/admin/moderation/settings`
3. Scroll to **Privileged Users** section
4. **Expected**: `admin@example.com` row shows **"Protected"** label — no Delete button
5. **Expected**: `ops.male@example.com`, `ops.female@example.com`, `moderator.male@example.com`, and `moderator.female@example.com` show editable gender controls and Delete buttons

---

## Scenario 3 — SUPERADMIN Can Create and Delete ADMINs

**Goal**: Verify full privileged-user lifecycle as SUPERADMIN.

### 3a. Create a new ADMIN

1. Login as `admin@example.com` (SUPERADMIN)
2. Go to `/admin/moderation/settings` → Privileged Users
3. In the Create form:
   - Email: `newadmin@example.com`
   - Password: `Password123!`
   - Role: **ADMIN**
4. Click **Create User**
5. **Expected**: New row appears in the table with role `ADMIN`
6. Logout; login at `/admin/login` as `newadmin@example.com` / `Password123!`
7. **Expected**: Login succeeds, lands on `/admin`

### 3b. Delete the new ADMIN

1. Login as `admin@example.com` (SUPERADMIN)
2. Settings → Privileged Users → Delete `newadmin@example.com`
3. **Expected**: Row disappears
4. Logout; try logging in as `newadmin@example.com`
5. **Expected**: Login fails (account no longer exists)

---

## Scenario 4 — ADMIN Cannot Delete Other ADMINs

**Goal**: Verify ADMIN role cannot delete peer ADMIN accounts.

1. Login as `ops.male@example.com` (ADMIN)
2. Go to `/admin/moderation/settings` → Privileged Users
3. **Expected**:
   - `admin@example.com` (SUPERADMIN): shows "Protected" — no Delete button
   - `ops.male@example.com` (self): **no Delete button** (cannot delete self)
   - `ops.female@example.com` (peer ADMIN): no Delete button
   - Both moderator rows show a Delete button

---

## Scenario 5 — ADMIN Can Only Create MODERATOR Accounts

**Goal**: Verify ADMIN cannot elevate privilege by creating ADMIN accounts.

1. Login as `ops.male@example.com` (ADMIN)
2. Go to Settings → Privileged Users → Create form
3. Open the **Role** dropdown
4. **Expected**: Only `MODERATOR` option is available (no `ADMIN` option)

---

## Scenario 6 — Moderator Capability Gating

**Goal**: Verify that disabled capabilities hide UI and block direct URL access.

### 6a. Disable "Moderate Messages"

1. Login as `admin@example.com`
2. Go to `/admin/moderation/settings` → Moderator Permissions
3. Turn **off** "Moderate Messages" → Save
4. Logout; login as `moderator.male@example.com`
5. **Expected**:
   - "Message Queue" nav link is **absent** from the sidebar
   - "Message Queue" card is **absent** from `/admin` dashboard
6. Navigate directly to `http://localhost:3000/admin/moderation`
7. **Expected**: Redirected to `/admin`

### 6b. Re-enable and verify restoration

1. Login as `admin@example.com` → Settings → re-enable "Moderate Messages" → Save
2. Login as `moderator.male@example.com`
3. **Expected**: "Message Queue" nav link and dashboard card are visible again

### 6c. Test all 7 capability gates

Repeat the disable/verify/re-enable cycle for each capability:

| Capability | Hidden nav link | Hidden card | Blocked URL |
|------------|----------------|-------------|-------------|
| Moderate Messages | Message Queue | Message Queue | `/admin/moderation` |
| Verify Profiles | Profile Queue | Profile Queue | `/admin/moderation/profiles` |
| Verify Photos | Photo Queue | Photo Queue | `/admin/moderation/photos` |
| Manage Members | Members | Members | `/admin/members` |
| Inspect Subscriptions | Subscriptions | — | `/admin/subscriptions` |
| Manage Reports | Reports, Flagged Users | — | `/admin/reports`, `/admin/flagged` |
| Update Risk Labels | — | — | (affects risk label action on flagged page) |

---

## Scenario 7 — Settings and Audit Log Always Restricted

**Goal**: Moderators cannot access Settings or Audit Log regardless of capabilities.

1. Login as `moderator.male@example.com` (with all capabilities enabled)
2. **Expected**: No "Settings" link visible in sidebar
3. **Expected**: No "Audit Log" link visible in sidebar
4. Navigate directly to `/admin/moderation/settings`
5. **Expected**: Redirected to `/admin/moderation`
6. Navigate directly to `/admin/audit-log`
7. **Expected**: Redirected to `/admin/moderation`

---

## Scenario 8 — Audit Log Captures Privileged User Actions

**Goal**: Creating and deleting privileged users is tracked in the audit log.

1. Login as `admin@example.com`
2. Create a new moderator (`testmod@example.com`) via Settings → Privileged Users
3. Go to `/admin/audit-log`
4. **Expected**: Entry with action `CREATE_PRIVILEGED_USER` and target email `testmod@example.com`
5. Delete `testmod@example.com`
6. Refresh Audit Log
7. **Expected**: Entry with action `DELETE_PRIVILEGED_USER` and target email `testmod@example.com`

---

## Scenario 9 — Member Features Unaffected (Regression)

1. Login as `ahmed@example.com` at `/auth/login`
2. Dashboard loads normally
3. Navigate to `/search` → opposite-gender profiles only
4. Send a message to Fatima → message appears immediately
5. Login as `aisha@example.com` → redirected to `/onboarding` (profile incomplete)

---

## Scenario 10 — Gender-Scoped Moderation Queues

**Goal**: Verify ADMIN and MODERATOR queue visibility is scoped by staff gender, while SUPERADMIN remains global.

### 10a. SUPERADMIN sees both genders

1. Login as `admin@example.com`
2. Open:
   - `/admin/moderation`
   - `/admin/moderation/photos`
   - `/admin/moderation/profiles`
3. **Expected**: Male and female records are visible where present in each queue.

### 10b. Male ADMIN/MODERATOR sees male queue items only

1. Login as `ops.male@example.com` or `moderator.male@example.com`
2. Open the same three moderation queue pages
3. **Expected**: Queue rows are restricted to male profile/message/photo targets.
4. **Expected**: Female targets visible to SUPERADMIN are not shown.

### 10c. Female ADMIN/MODERATOR sees female queue items only

1. Login as `ops.female@example.com` or `moderator.female@example.com`
2. Open the same three moderation queue pages
3. **Expected**: Queue rows are restricted to female profile/message/photo targets.
4. **Expected**: Male targets visible to SUPERADMIN are not shown.

### 10d. Privileged user creation requires staff gender

1. Login as `admin@example.com` and go to `/admin/moderation/settings`
2. In Privileged Users create form, provide email/password/role but do not leave gender ambiguous
3. **Expected**: Gender selector is present and required for creating ADMIN/MODERATOR accounts.
4. Create a new privileged user and verify the Gender column shows the assigned value.

### 10e. Superadmin can reassign staff gender from settings

1. Login as `admin@example.com` and go to `/admin/moderation/settings`
2. In the Privileged Users table, change `moderator.female@example.com` to `MALE`
3. **Expected**: Change saves and persists in the table
4. Change it back to `FEMALE`
5. **Expected**: Value updates again without requiring direct database edits

---

## Pass Criteria

All scenarios above should complete without errors. In addition:

```bash
npm run lint        # must exit 0
npx tsc --noEmit    # must exit 0
npm test            # must show: 200 passed, 26 suites
```

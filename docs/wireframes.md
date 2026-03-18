### Halal Harmony – Low-Fidelity Wireframes

These are textual/ASCII low-fidelity wireframes for key MVP screens, aligned with the `halal-matrimony` plan.

---

### 1. Landing / Marketing Page

- **Goals**
  - Explain value proposition, halal principles, and pricing.
  - Clear CTAs to sign up or log in.

```text
---------------------------------------------------------
| Logo / Brand: Halal Harmony           [Login] [Sign up]|
---------------------------------------------------------
| HERO SECTION                                          |
|  ---------------------------------------------------  |
|  |  Headline:                                        |
|  |  "Serious halal matrimony,                        |
|  |   guided by Islamic values"                       |
|  |                                                   |
|  |  Subheading (1–2 lines)                           |
|  |                                                   |
|  |  [ Get started ]   [ Learn more ]                 |
|  ---------------------------------------------------  |
---------------------------------------------------------
| "How it works" (3 steps in columns or stacked on     |
|  mobile):                                            |
|   [1] Create profile                                 |
|   [2] Search within halal guidelines                 |
|   [3] Communicate with modesty                       |
---------------------------------------------------------
| Trust / Islamic compliance section:                  |
|  - Short bullets about wali involvement, privacy,    |
|    no casual dating, etc.                            |
---------------------------------------------------------
| Pricing overview (teaser):                           |
|  - Free vs Paid summary                              |
|  [ View plans ]                                      |
---------------------------------------------------------
| Footer: links to About • Islamic Guidelines • FAQ •  |
| Terms • Privacy • Contact                            |
---------------------------------------------------------
```

---

### 2. Member Dashboard

- **Goals**
  - Provide quick overview of profile status, subscription, and messages.
  - Fast access to search, edit profile, favorites, and plans.

```text
---------------------------------------------------------
| Logo            | Home | Search | Messages | Profile  |
|                 |                      [Account ▾]    |
---------------------------------------------------------
| DASHBOARD HEADER                                     |
|  Left:                                              |
|   - "Assalamu alaikum, [Name/Alias]"                |
|   - Small text: "Member since [date]"               |
|  Right:                                             |
|   - Subscription pill: [ Free member ] or [ Active ]|
|     with expiry date, [ Upgrade ] button            |
---------------------------------------------------------
| 2–3 SUMMARY CARDS (grid / stacked on mobile)        |
|  [ Profile completeness   80%  (progress bar)   ]   |
|   - Link: [ Complete your profile ]                 |
|                                                     |
|  [ Messages                                         ]|
|   - "2 unread conversations"                        |
|   - Link: [ Go to inbox ]                           |
|                                                     |
|  [ New matches / Suggestions ]                      |
|   - "X profiles match your criteria"                |
|   - Link: [ View matches ]                          |
---------------------------------------------------------
| Quick actions row/buttons:                          |
|  [ Edit profile ]  [ Start a search ]  [ Favorites ] |
|  [ Manage subscription ]                            |
---------------------------------------------------------
| Optional: Simple list of recent activity:           |
|  - New profiles matching saved filters              |
|  - Recent visitors (if added later)                 |
---------------------------------------------------------
```

---

### 3. Profile View (own profile + viewing others)

- **Goals**
  - Show Islamic/lifestyle info, basic personal details, and preferences.
  - Respect privacy (age range, region, photos visibility).

#### 3.1 Own Profile (edit mode)

```text
---------------------------------------------------------
| Logo | Home | Search | Messages | Profile [active]   |
---------------------------------------------------------
| Left column (desktop)                                |
|  [ Primary photo / placeholder ]                     |
|  - Button: [ Upload / Manage photos ]                |
|  - Text: modesty guidelines link                     |
|                                                      |
| Right column                                         |
|  Header: "[Alias or First name], [Age / Age range]"  |
|  Subtext: "[City/Region], [Country]"                 |
|  Status pill: [ Pending review ] / [ Approved ]      |
---------------------------------------------------------
| Sections as collapsible cards or simple blocks:      |
|                                                      |
|  [ About me ]                                        |
|   - Short text textarea                              |
|                                                      |
|  [ Islamic background ]                              |
|   - Practicing level (select)                        |
|   - Prayer, hijab/beard, madhhab/manhaj (optional)   |
|                                                      |
|  [ Personal & family ]                               |
|   - Marital status, children, ethnicity, family      |
|     background, profession, education                |
|                                                      |
|  [ Preferences ]                                     |
|   - Desired age range, location, practicing level,   |
|     marital status, willingness to relocate, etc.    |
|                                                      |
|  [ Wali / guardian ] (for female profiles)           |
|   - Private inputs for wali name, relationship,      |
|     contact details                                  |
---------------------------------------------------------
| Bottom: [ Save changes ] [ Preview as others see ]   |
---------------------------------------------------------
```

#### 3.2 Viewing Another Member’s Profile

```text
---------------------------------------------------------
| Logo | Home | Search [active] | Messages | Profile   |
---------------------------------------------------------
| Top section                                           |
|  Left: thumbnail (blurred or locked if photos hidden)|
|  Right:                                              |
|   - "[Alias], [Age or Age range]"                    |
|   - "[City/Region or Country only]"                  |
|   - Badges: [ Practicing ], [ Non-smoker ], etc.     |
---------------------------------------------------------
| [ About ] (read-only text)                           |
| [ Islamic background ]                               |
| [ Personal & family ]                                |
| [ Preferences ]                                      |
---------------------------------------------------------
| Action bar (respecting subscription rules):          |
|  - If free user: [ Upgrade to contact ] (primary)    |
|  - If paid:  [ Send message ]                        |
|                  [ Add to favorites ★ ]              |
|  - Secondary: [ Report profile ]                     |
---------------------------------------------------------
| Subtle note about wali involvement and guidelines.   |
---------------------------------------------------------
```

---

### 4. Search & Results

- **Goals**
  - Simple filters focused on opposite-gender, halal-compatible discovery.
  - Clear, scannable results list with key info.

```text
---------------------------------------------------------
| Logo | Home | Search [active] | Messages | Profile   |
---------------------------------------------------------
| SEARCH FILTERS (top on mobile, left on desktop)      |
|  Basic:                                              |
|   - Gender (locked to opposite)                      |
|   - Age range slider                                 |
|   - Country (select)                                 |
|   - City/Region (text/select)                        |
|   - Marital status                                   |
|                                                      |
|  Islamic / lifestyle:                                |
|   - Practicing level                                 |
|   - Hijab / beard                                    |
|   - Smoking                                          |
|                                                      |
|  Other:                                              |
|   - Education level                                  |
|   - Profession                                       |
|   - Willing to relocate                              |
|                                                      |
|  Buttons: [ Apply filters ]  [ Clear ]               |
|  Saved search: [ Save this search ] [ My filters ▾ ] |
---------------------------------------------------------
| RESULTS LIST (right / below)                         |
|  Each result card:                                   |
|   -------------------------------------------------  |
  |  [Photo thumb / placeholder]   [★] (favorite)     |
|   |  Alias, Age / Age range                         |
|   |  City/Region, Country                           |
|   |  1–2 Islamic markers (e.g. "Prays 5x", "Hijab") |
|   |  [ View profile ]                               |
|   -------------------------------------------------  |
|                                                      |
|  Pagination:  ◀ Prev   1  2  3  ...   Next ▶         |
---------------------------------------------------------
```

---

### 5. Messaging (Inbox & Conversation)

- **Goals**
  - Simple, mobile-friendly messaging within halal guidelines.
  - Real-time updates without page refresh.
  - Clear restrictions for free vs paid members.
  - Content moderation for Shariah compliance.

#### 5.1 Inbox

```text
---------------------------------------------------------
| Logo | Home | Search | Messages [3] [active] | Profile|
|                                ^unread counter badge  |
---------------------------------------------------------
| Header: "Messages"                [+ New] button      |
|  - Small text: "Subscription required to start new   |
|    conversations" (if free user).                    |
---------------------------------------------------------
| Filter / tabs:                                       |
|  [ All ] [ Unread ] [ Favorited ]                    |
---------------------------------------------------------
| Conversation list (single column / stacked):         |
|  Each row:                                           |
|   [Profile thumbnail] [Alias]           [⋮]          |
|   Last message snippet (single line)                 |
|   Timestamp (e.g. "2h ago")    [Unread badge 2●]     |
|   Status indicator (if under review): "⏳ Pending"   |
---------------------------------------------------------
| Real-time behavior:                                  |
|  - New messages appear instantly (SSE updates)       |
|  - Thread with new message moves to top of list      |
|  - Unread counter increments automatically           |
---------------------------------------------------------
| Empty state (no conversations):                      |
|  "No conversations yet"                              |
|  [Start a New Conversation]                          |
---------------------------------------------------------
```

#### 5.2 Conversation View

```text
---------------------------------------------------------
| < Back | [Alias]                        [⋮ options]   |
---------------------------------------------------------
| Small banner (top):                                   |
|  - "Keep communication halal. Involve your wali      |
|     early where appropriate."                        |
---------------------------------------------------------
| MESSAGE THREAD AREA                                  |
|  - Simple bubble layout, no images:                  |
|                                                      |
|   [Them]  Left-aligned gray bubble                   |
|           "Assalamu alaikum..."                      |
|           10:23 AM                                   |
|                                                      |
|   [You]   Right-aligned blue bubble                  |
|           "Wa alaikum assalam..."                    |
|           10:25 AM    ✓ Sent                         |
|                                                      |
|   [You]   Right-aligned yellow bubble (if flagged)   |
|           "..."                                      |
|           10:26 AM    ⏳ Under Review               |
|                                                      |
|  - Auto-scroll to bottom on new messages             |
|  - Real-time updates (new messages appear instantly) |
|  - Timestamps grouped by day                         |
|  - Message status indicators:                        |
|     ✓ Sent (delivered)                               |
|     ⏳ Under Review (flagged, pending moderation)    |
---------------------------------------------------------
| Bottom input:                                        |
|  [ Type your message...               ] [ Send ]     |
|  - If not allowed (subscription/limit):              |
|    Disabled input with explanation:                  |
|    "Subscription required" + [ Upgrade ] button      |
---------------------------------------------------------
| Options menu (⋮):                                    |
|  [ Report conversation ]                             |
|  [ Block user ] (future)                             |
---------------------------------------------------------
```

#### 5.3 New Conversation Modal

```text
---------------------------------------------------------
| Start New Conversation                           [×]  |
---------------------------------------------------------
| Search for a member:                                 |
|  [ Search by name...                    ] [🔍]       |
---------------------------------------------------------
| Suggested from favorites:                            |
|  [Profile thumb] Alias, Age, Location                |
|  [ Start Conversation ]                              |
|                                                      |
|  [Profile thumb] Alias, Age, Location                |
|  [ Start Conversation ]                              |
---------------------------------------------------------
| Search results:                                      |
|  (Same format as above when user types)              |
---------------------------------------------------------
| Error state (if free user):                          |
|  "⚠️ Subscription required to start conversations"   |
|  [ Upgrade to Premium ] [ Cancel ]                   |
---------------------------------------------------------
```

#### 5.4 Admin Moderation Dashboard

```text
---------------------------------------------------------
| Admin Panel | Moderation [active] | Settings | Users |
---------------------------------------------------------
| Moderation Queue                                     |
|  Filter: [ Pending ] [ Approved ] [ Rejected ]       |
---------------------------------------------------------
| Pending Messages (3)                                 |
|                                                      |
|  Thread: Ahmed ↔ Fatima                              |
|  Flagged message from Ahmed:                         |
|   "..." (content)                                    |
|   Reason: Profanity detected: [word]                 |
|   Time: 2h ago                                       |
|                                                      |
|  Thread context (last 5 messages shown):             |
|   [Previous messages...]                             |
|                                                      |
|  Actions:                                            |
|   [ ✓ Approve ] [ ✗ Reject ] [ ⚠️ Warn & Reject ]   |
---------------------------------------------------------
| Next message...                                      |
---------------------------------------------------------
```

#### 5.5 Admin Moderation Settings

```text
---------------------------------------------------------
| Admin Panel | Moderation | Settings [active] | Users |
---------------------------------------------------------
| Moderation Configuration                             |
---------------------------------------------------------
| Moderation Type:                                     |
|  ○ Pattern Recognition (active)                      |
|  ○ AI/NLP Analysis (coming soon - grayed out)        |
---------------------------------------------------------
| Moderation Workflow:                                 |
|  ○ Pre-moderation (hold flagged messages)            |
|  ○ Post-moderation (deliver, review after)           |
---------------------------------------------------------
| Current Status:                                      |
|  Active: Pattern Recognition + Pre-moderation        |
|  Pending messages in queue: 3                        |
---------------------------------------------------------
| [ Save Settings ]                                    |
---------------------------------------------------------
```

---

### 6. Onboarding Wizard (Single Route: `/onboarding`)

- **Goals**
  - Collect mandatory profile data before member features are unlocked.
  - Save each step asynchronously so users can resume later.
  - Enforce gender-specific rules (female cannot be married; female wali required).

```text
---------------------------------------------------------
| Logo                          Step 3 of 5   [Save&Exit]|
---------------------------------------------------------
| Progress: [██████████░░░░░░]                          |
---------------------------------------------------------
| Step content card                                      |
| - Step 1: Basic info (name, gender, DOB>=14, location)|
| - Step 2: Islamic details                              |
| - Step 3: Marital + family                             |
| - Step 4: Spouse status preferences                    |
| - Step 5: Wali info (female) / summary (male)         |
---------------------------------------------------------
| Validation messages (blocking):                        |
| - Female + married => cannot proceed                   |
| - Age < 14 => cannot proceed                           |
| - Female missing wali => cannot complete               |
---------------------------------------------------------
| [Back]                                  [Save&Continue]|
---------------------------------------------------------
```

---

### 7. Post-Onboarding Photo Upload (`/onboarding/photo`)

- **Goals**
  - Encourage photo upload after onboarding completion.
  - Enforce hard limits and preserve privacy defaults.

```text
---------------------------------------------------------
| Header: Upload Profile Photos                          |
---------------------------------------------------------
| Rules:                                                 |
| - Max photos per profile: 5                            |
| - Max size per photo: 2MB                              |
| - Formats: JPG, PNG, WebP                              |
| - New uploads are blurred by default                   |
---------------------------------------------------------
| [Choose files] (multi-select)                          |
| Selected: fileA.jpg (1.2MB), fileB.webp (0.7MB)       |
| [Upload Photos]                                        |
---------------------------------------------------------
| Current photos (N/5)                                   |
| [thumb] Primary | Blurred in search | 0.8MB            |
| [thumb] Secondary | Blurred in search | 1.1MB          |
---------------------------------------------------------
| [Go to Dashboard]   [Start Searching]                  |
---------------------------------------------------------
```

---

### Notes

- All layouts should be implemented as **mobile-first**, then enhanced for tablet/desktop (e.g. side-by-side columns).
- Components like nav bar, cards, and buttons should be reused across pages for consistency.

---

### 8. Admin Settings — Moderation & Privileged Users (`/admin/moderation/settings`)

- **Goals**
  - SUPERADMIN and ADMIN can configure moderator capability toggles.
  - SUPERADMIN and ADMIN can create/delete privileged accounts (admins and moderators).
  - Moderators are redirected away from this page entirely.

#### 8a. Moderation Settings

```text
---------------------------------------------------------
| Admin Settings                                         |
---------------------------------------------------------
| MODERATION                                             |
|                                                        |
|  Moderation Type                                       |
|  ● Pattern Recognition  ○ AI/NLP (Coming Soon)        |
|                                                        |
|  Moderation Workflow                                   |
|  ● Pre-moderation  ○ Post-moderation                  |
|                                                        |
|  [ Save Settings ]                                     |
---------------------------------------------------------
```

#### 8b. Moderator Permissions (toggle matrix)

```text
---------------------------------------------------------
| MODERATOR PERMISSIONS                                  |
---------------------------------------------------------
| Capability              | Enabled                      |
|-------------------------|------------------------------|
| Moderate Messages       | [✓ toggle]                   |
| Verify Profiles         | [✓ toggle]                   |
| Verify Photos           | [✓ toggle]                   |
| Manage Members          | [✓ toggle]                   |
| Inspect Subscriptions   | [✓ toggle]                   |
| Manage Reports          | [✓ toggle]                   |
| Update Risk Labels      | [✓ toggle]                   |
---------------------------------------------------------
| [ Save Permissions ]                                   |
---------------------------------------------------------
```

**Visibility behavior**: When a toggle is saved as disabled:
- The corresponding nav link is hidden in the left sidebar for moderators.
- The corresponding dashboard card is hidden on `/admin`.
- Direct URL access to the protected page is blocked (redirect to `/admin`).

#### 8c. Privileged Users (SUPERADMIN / ADMIN view)

```text
---------------------------------------------------------
| PRIVILEGED USERS                                       |
---------------------------------------------------------
| Email                      | Role       | Gender | Created    | Act |
|----------------------------|------------|--------|------------|-----|
| admin@example.com          | SUPERADMIN | MALE   | 2026-03-01 | Protected |
| ops.male@example.com       | ADMIN      | MALE   | 2026-03-13 | [Gender Toggle] [Delete] |
| ops.female@example.com     | ADMIN      | FEMALE | 2026-03-13 | [Gender Toggle] [Delete] |
| moderator.male@example.com | MODERATOR  | MALE   | 2026-03-01 | [Gender Toggle] [Delete] |
| moderator.female@example.com | MODERATOR | FEMALE | 2026-03-01 | [Gender Toggle] [Delete] |
---------------------------------------------------------
| Create Privileged User                                 |
|  Email:    [____________________________]              |
|  Password: [____________________________]              |
|  Role:     [ MODERATOR ▾ ]                             |
|            (ADMIN option visible to SUPERADMIN only)   |
|  [ Create User ]                                       |
---------------------------------------------------------
```

**Access rules**:
- SUPERADMIN row shows "Protected" — no delete button.
- ADMIN rows: deletable by SUPERADMIN only.
- MODERATOR rows: deletable by SUPERADMIN and ADMIN.
- Only SUPERADMIN can create new ADMIN accounts.
- Moderators are redirected to `/admin/moderation` if they navigate to this page.


# Test Seed Data Reference

## Overview

Comprehensive test users covering all onboarding scenarios and edge cases.

## Test Users

### 1. Ahmed (`ahmed@example.com`)

**Password:** `Password123!`  
**Test Scenario:** Male with married status

- **Gender:** MALE
- **Age:** ~33 years (1992-05-15)
- **Marital Status:** `married` ✓ (valid for male)
- **Spouse Preferences:** `['virgin', 'separated']` ✓ (valid for male)
- **Wali Info:** None ✓ (not required for male)
- **Photos:** 2 photos (180KB each) ✓
- **Onboarding:** ✓ Complete
- **Status:** APPROVED
- **Subscription:** Active Premium Plus

---

### 2. Fatima (`fatima@example.com`)

**Password:** `Password123!`  
**Test Scenario:** Female with virgin status

- **Gender:** FEMALE
- **Age:** ~30 years (1995-08-22)
- **Marital Status:** `virgin` ✓ (valid for female)
- **Spouse Preferences:** `['virgin', 'divorced']` ✓ (valid for female)
- **Wali Info:** ✓ All fields present (Father: Mohammad Khan)
- **Photos:** 1 photo (180KB) ✓
- **Onboarding:** ✓ Complete
- **Status:** APPROVED
- **Subscription:** Active Premium Plus

---

### 3. Ali (`ali@example.com`)

**Password:** `Password123!`  
**Test Scenario:** Male with separated status

- **Gender:** MALE
- **Age:** ~35 years (1990-03-10)
- **Marital Status:** `separated` ✓ (valid for male)
- **Spouse Preferences:** `['virgin', 'married', 'separated']` ✓ (valid for male)
- **Wali Info:** None ✓ (not required for male)
- **Photos:** 1 photo (180KB) ✓
- **Onboarding:** ✓ Complete
- **Status:** APPROVED
- **Subscription:** None (free member)

---

### 4. Aisha (`aisha@example.com`)

**Password:** `Password123!`  
**Test Scenario:** Female with divorced status

- **Gender:** FEMALE
- **Age:** ~32 years (1993-11-30)
- **Marital Status:** `divorced` ✓ (valid for female)
- **Spouse Preferences:** `['virgin', 'divorced', 'annulled']` ✓ (valid for female)
- **Wali Info:** ✓ All fields present (Father: Abdullah Ahmed)
- **Photos:** 1 photo (180KB) ✓
- **Onboarding:** ✓ Complete
- **Status:** APPROVED
- **Subscription:** None (free member)

---

### 5. Yusuf (`yusuf@example.com`) 🔴 INCOMPLETE

**Password:** `Password123!`  
**Test Scenario:** **Incomplete onboarding for wizard testing**

- **Gender:** MALE
- **Age:** ~31 years (1994-07-10)
- **Onboarding:** ❌ **INCOMPLETE**
  - ✓ Step 1: Basic info complete
  - ✓ Step 2: Islamic details complete
  - ❌ Step 3: Missing `maritalStatus` and `willingToRelocate`
  - ❌ Step 4: Missing `spouseStatusPreferences`
  - ❌ Step 5: Not reached
- **Status:** PENDING_REVIEW
- **Use Case:** Test onboarding wizard flow, save/resume, route gating

---

### 6. Zainab (`zainab@example.com`)

**Password:** `Password123!`  
**Test Scenario:** Female with annulled status + maximum photos

- **Gender:** FEMALE
- **Age:** ~29 years (1996-02-14)
- **Marital Status:** `annulled` ✓ (valid for female)
- **Spouse Preferences:** `['virgin', 'annulled']` ✓ (valid for female)
- **Wali Info:** ✓ All fields present (Brother: Tariq Ali)
- **Photos:** **5 photos** (180KB each) ✓ **MAX LIMIT REACHED**
- **Onboarding:** ✓ Complete
- **Status:** APPROVED
- **Use Case:** Test photo upload rejection when limit reached

---

### 7. Sara (`sara@example.com`)

**Password:** `Password123!`  
**Test Scenario:** Minimum age (14) + no photos

- **Gender:** FEMALE
- **Age:** **14 years** (minimum allowed) ✓
- **Marital Status:** `virgin` ✓ (valid for female)
- **Spouse Preferences:** `['virgin']` ✓
- **Wali Info:** ✓ All fields present (Father: Khalid Ahmed)
- **Photos:** **0 photos** (no photos uploaded yet)
- **Onboarding:** ✓ Complete
- **Status:** APPROVED
- **Use Case:** Test minimum age validation, photo upload from zero

---

## Onboarding Rules Coverage

### ✓ Age Validation

- Minimum age 14: Sara (exactly 14)
- Adult users: All others (30+ years)

### ✓ Gender-Specific Marital Status

**Males (virgin/married/separated):**

- Ahmed: married ✓
- Ali: separated ✓
- Yusuf: incomplete (for testing)

**Females (virgin/divorced/annulled):**

- Fatima: virgin ✓
- Aisha: divorced ✓
- Zainab: annulled ✓
- Sara: virgin ✓

### ✓ Wali Requirements

- All females have complete Wali info ✓
- All males have no Wali info ✓

### ✓ Photo Constraints

- 0 photos: Sara
- 1 photo: Fatima, Ali, Aisha
- 2 photos: Ahmed
- 5 photos (max): Zainab
- All photos under 2MB ✓
- DB enforces MIME type and size constraints ✓

### ✓ Onboarding Completion

- Complete: Ahmed, Fatima, Ali, Aisha, Zainab, Sara
- Incomplete: Yusuf (for wizard testing)

---

## Test Scenarios

### Manual Testing Checklist

1. **Onboarding Wizard Flow**
   - Login as `yusuf@example.com`
   - Should redirect to `/onboarding`
   - Complete remaining steps
   - Verify save/resume works

2. **Route Gating**
   - Try accessing `/dashboard`, `/search`, `/messages` as Yusuf
   - Should redirect to `/onboarding` until complete

3. **Photo Upload Limits**
   - Login as `zainab@example.com` (5 photos already)
   - Try uploading another photo
   - Should reject with "Maximum 5 photos" error
   - Login as `sara@example.com` (0 photos)
   - Should allow upload up to 5

4. **Age Validation**
   - Verify Sara (age 14) can login and access features
   - Try creating user under 14 (should fail in wizard)

5. **Female Marital Status Restriction**
   - In wizard, select female gender
   - Try selecting "married" status
   - Should show error: "AlHarmony is for single sisters"

6. **Completed Profiles**
   - Login as any completed user (Ahmed, Fatima, Ali, Aisha)
   - Should NOT see onboarding wizard
   - Should access dashboard/search/messages normally

---

## Database Constraints Enforced

- Photo MIME type: `image/jpeg`, `image/png`, `image/webp` only
- Photo file size: max 2MB (2,097,152 bytes)
- Photo count per profile: max 5 (enforced via trigger)
- Photo metadata required: `mimeType` and `fileSizeBytes` NOT NULL

---

## Additional Notes

- All users have password: `Password123!`
- Admin test user: `admin@example.com` / `Password123!`
- Moderator test user: `moderator@example.com` / `Password123!`
- If a local database predates moderator-role support, run `npx prisma db push` once so the `MODERATOR` enum value exists before testing moderator login.
- Ahmed and Fatima have active Premium subscriptions
- Ahmed and Fatima have a message thread with 2 messages
- All photos use WebP format (180KB each)
- All completed profiles have `onboardingCompletedAt` timestamp
- Yusuf's profile is intentionally incomplete for testing

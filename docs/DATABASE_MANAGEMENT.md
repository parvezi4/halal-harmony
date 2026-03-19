# Database Management: Local Dev & Staging

**Setup:**
- **Local development** = `.env.local` (your database instance)
- **Vercel staging** = Vercel env vars (same database instance)
- **Production** = Not yet deployed (planned for future)

Both environments use the **same database**, so schema changes sync automatically when you push code.

---

## Making Schema Changes

### 1. Update Schema Locally

Edit `prisma/schema.prisma` on your local machine.

### 2. Create & Apply Migration

```bash
npx prisma migrate dev --name <description>
```

**What this does:**
- Detects schema changes
- Generates a new migration file in `prisma/migrations/`
- Applies it to your local database
- Regenerates Prisma Client types

**Example:**
```bash
npx prisma migrate dev --name add_user_phone_field
```

### 3. Test Locally

Verify the schema change works:
```bash
npm run dev
# Test your feature or use Prisma Studio
npx prisma studio
```

### 4. Commit Changes

```bash
git add prisma/migrations/
git commit -m "Add user phone field migration"
git push origin main
```

### 5. Vercel Auto-Deploys

When you push to main:
- Vercel builds the project
- During build, Vercel runs: `npx prisma migrate deploy`
- This applies all pending migrations to the same database
- ✅ Both local and staging now have the same schema

---

## Managing Seed Data

### Local Seed Changes

Edit test users in `prisma/seed.ts`:

```bash
nano prisma/seed.ts  # Edit as needed
npm run prisma:seed  # Apply changes locally
```

### What to Seed

Keep in `prisma/seed.ts`:
- ✅ Test user accounts (different scenarios: genders, marital statuses, subscription levels)
- ✅ Test admin accounts (for testing moderation features)
- ✅ Sample profile data (for testing search/filtering)

**Important:** Seeding is local-only. Don't commit seed changes unless they're useful for the team. Staging test data should come from real app sign-ups, not automated scripts.

### Conditional Seeds (Optional)

To prevent accidental production seeding (future):

```typescript
// In prisma/seed.ts
if (process.env.NODE_ENV === 'production') {
  console.warn('⚠️ Skipping seed—production environment');
  process.exit(0);
}

// ... rest of seed logic
```

---

## Workflows by Scenario

### Scenario 1: Add a New Field to User Profile

```bash
# 1. Edit schema
# prisma/schema.prisma: model User { ... + phoneNumber String? }

# 2. Create migration
npx prisma migrate dev --name add_user_phone_field

# 3. Test locally
npm run dev

# 4. Commit and push
git add prisma/
git commit -m "Add phone field to user profile"
git push origin main

# 5. Vercel auto-applies migration ✅
```

### Scenario 2: Update Seed Data (Test Accounts)

```bash
# 1. Edit seed script
nano prisma/seed.ts
# Example: Add a new test user with specific age/preferences

# 2. Apply to local database
npm run prisma:seed

# 3. Verify changes
npx prisma studio
# Browse and verify test data

# 4. Optional: Commit if useful for team
git add prisma/seed.ts
git commit -m "Add test account for age validation scenario"
git push origin main
```

### Scenario 3: Reset Local Database to Fresh State

Use only in local development when you need a clean slate:

```bash
npx prisma migrate reset
```

**What this does:**
- Drops all tables
- Re-applies all migrations
- Re-runs seed
- Clears Prisma Client cache

⚠️ **Impact:** This affects your local database only. Use with caution and do NOT run before pushing to main.

### Scenario 4: Debug Data Issues Locally

```bash
# View current data
npx prisma studio
# Opens web UI to browse/edit/delete records

# Or query via Prisma Client in a script
# prisma/debug.ts, etc.
```

### Scenario 5: Deploy Multiple Schema Changes

```bash
# 1. Make changes locally and test
npx prisma migrate dev --name first_change
npm run prisma:seed
npm run dev  # verify

# 2. Make second change
npx prisma migrate dev --name second_change
npm run dev  # verify

# 3. Commit all migrations
git add prisma/migrations/
git commit -m "Multiple schema updates: add phone field, add verification status"
git push origin main

# 4. Vercel applies both migrations in order ✅
# (Prisma ensures idempotent, ordered application)
```

---

## Key Commands Reference

| Command | Purpose | Safe to Run? |
|---------|---------|--------------|
| `npx prisma migrate dev --name <name>` | Create & apply migration | ✅ Local dev only |
| `npx prisma migrate deploy` | Apply pending migrations to current DB | ✅ Auto-runs on Vercel |
| `npx prisma migrate reset` | Drop all, reapply migrations, re-seed | ⚠️ Local only (destructive) |
| `npm run prisma:seed` | Re-run seed script | ✅ Local only |
| `npx prisma db push` | Quick schema sync (no migration files) | ⚠️ Skips migrations; use `migrate dev` instead |
| `npx prisma studio` | Web UI to browse/edit data | ✅ Safe (read-only or manual edits) |
| `npx prisma generate` | Regenerate Prisma Client types | ✅ Safe (no DB changes) |
| `npx prisma migrate status` | Show pending migrations | ✅ Safe (read-only) |

---

## Environment Validation

This repo includes a guard script to prevent config drift:

```bash
node scripts/check-prisma-env.mjs
```

This validates:
- `.env` and `.env.local` point to same database host
- No placeholder URLs (e.g., `your_host`)
- Fails fast before migrations if issues detected

This script runs automatically before:
- `npm run prisma:migrate`
- `npm run prisma:seed`

---

## Troubleshooting

### Issue: "Migration X already applied" on next deploy

**Cause:** Migration was locally applied and committed, but Vercel already has it.

**Solution:** Nothing needed—Vercel/Prisma skips already-applied migrations automatically. ✅

### Issue: Schema mismatch between local and Vercel

**Cause:** Local migration not committed to git, or Vercel branch is outdated.

**Solution:** 
1. Check local migration files exist: `ls prisma/migrations/`
2. Commit and push: `git add prisma/ && git commit && git push origin main`
3. Trigger Vercel re-deploy if needed (commit an empty change, or use Vercel dashboard)

### Issue: Local seed failed but schema changed

**Cause:** New schema constraints not reflected in seed data.

**Solution:**
1. Edit `prisma/seed.ts` to match new schema
2. Run `npm run prisma:seed` again
3. Or `npx prisma migrate reset` to start completely fresh

### Issue: Can't connect to database

**Cause:** Likely `.env` or `.env.local` misconfigured.

**Solution:**
1. Check `DATABASE_URL` is set in `.env.local`
2. Verify Supabase pooled connection URL is correct
3. Run: `node scripts/check-prisma-env.mjs` to validate
4. Test with: `npx prisma migrate status`

---

## Best Practices

✅ **Do:**
- Commit migration files to git (they're version-controlled and ordered)
- Test schema changes locally before pushing
- Use descriptive migration names: `--name add_user_email_verification`
- Edit `prisma/seed.ts` for new test scenarios and commit if useful for team
- Review *.sql files in migrations before committing to understand what will run on deploy

❌ **Don't:**
- Run `prisma migrate reset` before pushing to main (destructive)
- Manually edit migration files after creation
- Use `db push` for team projects (use migrations instead; they're version-controlled)
- Commit seed data that's only relevant to production

---

## Future: Production Setup

When you're ready for production:
- Create a separate Supabase project or use managed PostgreSQL for production
- Add production environment variables to your deployment platform
- Use `prisma migrate deploy` on production (migrations are idempotent and safe)
- Consider backup/snapshot strategies before running migrations
- Never use `migrate reset` on production
- Be cautious with prod seeding (manual creation or dedicated admin tools only)

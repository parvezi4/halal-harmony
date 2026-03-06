# Halal Harmony (MVP)

Halal Harmony is a web-based Muslim matrimonial platform focused on serious, halal marriage, guided by Islamic values.

This project uses:

- **Next.js** (App Router, TypeScript) for full-stack web app
- **React** for UI
- **Tailwind CSS** for styling
- **Prisma + PostgreSQL** for data (planned)
- **Stripe** for subscriptions
- **NextAuth/Auth.js** for authentication (planned)

## Getting started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL (or Supabase) for database

### Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables by copying `.env.example` to `.env.local` and filling in values:
   - `DATABASE_URL` – PostgreSQL/Supabase connection string
   - `NEXTAUTH_SECRET` – Generate with: `openssl rand -base64 32`
   - `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` – From Stripe dashboard

3. Set up the database:

   **First time setup:**

   ```bash
   npx prisma db push       # Create all tables from schema
   npm run prisma:seed      # Populate with mock data
   ```

   **Or if making schema changes:**

   ```bash
   npm run prisma:migrate   # Create and apply migrations
   ```

4. Run the dev server:

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

### Database Management

**View/Edit data in the database:**

```bash
npx prisma studio
```

Opens a web UI where you can browse, create, update, and delete records in all tables.

**Available database commands:**

| Command                    | Purpose                                                          |
| -------------------------- | ---------------------------------------------------------------- |
| `npx prisma db push`       | Sync schema changes to database (for development)                |
| `npm run prisma:migrate`   | Create and apply migrations (recommended for team/production)    |
| `npx prisma migrate reset` | Drop all tables, recreate from migrations, and run seed          |
| `npm run prisma:seed`      | Populate database with mock data                                 |
| `npx prisma generate`      | Regenerate Prisma Client                                         |
| `npx prisma studio`        | Open database management UI in browser                           |
| `npx prisma db seed`       | Run the seed script to populate data (alternative to npm script) |

**Common workflows:**

- **Schema changed?** → `npx prisma db push`
- **Need fresh test data?** → `npx prisma migrate reset`
- **Add new test users?** → Edit `prisma/seed.ts` and run `npm run prisma:seed`
- **Want to explore data?** → `npx prisma studio`

### Development in VS Code

Recommended extensions are configured in `.vscode/extensions.json`. When opening the project, VS Code will prompt you to install them:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin

**Build & development commands:**

```bash
npm run dev       # Start development server (port 3000)
npm run build     # Production build
npm run lint      # Check code quality with ESLint
npx tsc --noEmit  # Type check without emitting files
```

## Testing

This project uses **Jest** for API route testing with a pre-push hook to ensure code quality before pushing to `master`.

### Running tests

```bash
npm run test              # Run all tests
npm run test:watch        # Run tests in watch mode (great for development)
npm run test:api          # Run only API tests
npm run typecheck         # Run TypeScript type checking
```

### Test coverage (Phase 1)

Currently tested:

- ✅ **Register API** (`/api/auth/register`) - 7 test cases covering success, validation, duplicate users, and error handling

### Pre-push quality gate

A git pre-push hook automatically runs before every push to `master`:

1. **API tests** - Ensures all route handlers work correctly
2. **Linting** - Checks code style and catches common errors
3. **Type checking** - Validates TypeScript types across the codebase

If any check fails, the push is blocked. This prevents bugs from reaching `master`.

**Expected runtime:** <10 seconds total

### Emergency bypass (use sparingly!)

If you need to push urgently and the checks are failing:

```bash
git push --no-verify
```

**Note:** Only use this in emergencies. The checks exist to protect code quality.

### Writing new tests

API route tests are located in `tests/api/` and follow this pattern:

1. Mock external dependencies (Prisma, Stripe, bcrypt, etc.)
2. Create synthetic `Request` objects
3. Call the route handler directly
4. Assert on response status and JSON payload

Example test structure:

```typescript
import { POST } from '@/app/api/your-route/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma');

describe('POST /api/your-route', () => {
  it('should handle success case', async () => {
    // Arrange: Set up mocks
    (prisma.model.method as jest.Mock).mockResolvedValue({ ... });

    const request = new Request('http://localhost:3000/api/your-route', {
      method: 'POST',
      body: JSON.stringify({ ... }),
    });

    // Act: Call handler
    const response = await POST(request);
    const data = await response.json();

    // Assert: Validate response
    expect(response.status).toBe(200);
    expect(data).toEqual({ ... });
  });
});
```

For more details, see the [API Testing section in PLAN.md](docs/PLAN.md).

### Test Credentials

After running `npm run prisma:seed`, use these credentials to test the application:

| Email                | Password       | Status        | Notes                                         |
| -------------------- | -------------- | ------------- | --------------------------------------------- |
| `ahmed@example.com`  | `Password123!` | ✅ Complete   | Male, married, 2 photos, premium subscription |
| `fatima@example.com` | `Password123!` | ✅ Complete   | Female, virgin, 1 photo, premium subscription |
| `ali@example.com`    | `Password123!` | ✅ Complete   | Male, separated, 1 photo                      |
| `aisha@example.com`  | `Password123!` | ⚠️ Incomplete | **Female - test Steps 3-5 + Wali info**       |
| `yusuf@example.com`  | `Password123!` | ⚠️ Incomplete | **Male - test Steps 3-4 (no Wali step)**      |
| `zainab@example.com` | `Password123!` | ✅ Complete   | Female, annulled, **5 photos (max limit)**    |
| `sara@example.com`   | `Password123!` | ✅ Complete   | Female, **age 14 (minimum age)**, no photos   |

**Onboarding Testing:**

- Use **Aisha** to test the full female onboarding flow (5 steps including Wali information)
- Use **Yusuf** to test the male onboarding flow (4 steps, no Wali info required)

**Other Features:**

- Ahmed and Fatima have sample message history for testing messaging
- Zainab has the maximum number of photos (5) for testing photo limits
- Sara demonstrates the minimum age requirement (14 years old)

## Project structure (high level)

- `app/` – App Router pages, layouts, and route handlers
- `config/stripe.ts` – Stripe client and price ID helpers
- `prisma/schema.prisma` – Data model (to be added)
- `docs/PLAN.md` / `docs/wireframes.md` – Product plan and wireframes
- `docs/specs/` - User stories to be implemented
- `docs/halal-harmony-wireframes.excalidraw` – Excalidraw file with wireframes

As we build out the MVP, this README can be expanded with more detailed docs for deployment, migrations, and admin tooling.

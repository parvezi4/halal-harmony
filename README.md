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

| Command                    | Purpose                                                       |
| -------------------------- | ------------------------------------------------------------- |
| `npx prisma db push`       | Sync schema changes to database (for development)             |
| `npm run prisma:migrate`   | Create and apply migrations (recommended for team/production) |
| `npx prisma migrate reset` | Drop all tables, recreate from migrations, and run seed       |
| `npm run prisma:seed`      | Populate database with mock data                              |
| `npx prisma generate`      | Regenerate Prisma Client                                      |
| `npx prisma studio`        | Open database management UI in browser                        |

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

### Test Credentials

After running `npm run prisma:seed`, use these credentials to test the application:

| Email                | Password       |
| -------------------- | -------------- |
| `ahmed@example.com`  | `Password123!` |
| `fatima@example.com` | `Password123!` |
| `ali@example.com`    | `Password123!` |
| `aisha@example.com`  | `Password123!` |

All test users have:

- ✓ Approved profiles with photos
- ✓ Active subscriptions
- ✓ Sample message history (Ahmed ↔ Fatima)

## Project structure (high level)

- `app/` – App Router pages, layouts, and route handlers
- `config/stripe.ts` – Stripe client and price ID helpers
- `prisma/schema.prisma` – Data model (to be added)
- `PLAN.md` / `wireframes.md` – Product plan and wireframes
- `specs/` - User stories to be implemented
- `halal-harmony-wireframes.excalidraw` – Excalidraw file with wireframes

As we build out the MVP, this README can be expanded with more detailed docs for deployment, migrations, and admin tooling.

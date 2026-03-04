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

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables by copying `.env.example` to `.env.local` and filling in values.

3. Run the dev server:

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

## Project structure (high level)

- `app/` – App Router pages, layouts, and route handlers
- `config/stripe.ts` – Stripe client and price ID helpers
- `prisma/schema.prisma` – Data model (to be added)
- `PLAN.md` / `wireframes.md` – Product plan and wireframes

As we build out the MVP, this README can be expanded with more detailed docs for deployment, migrations, and admin tooling.


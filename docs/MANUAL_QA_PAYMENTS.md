# Manual QA - Payments (Stripe Sandbox)

Last Updated: March 15, 2026
Scope: Member billing, Stripe checkout, webhook synchronization, and payment communication placeholders.

---

## 1. Setup

1. Configure environment variables in `.env.local`:
   - `NEXTAUTH_URL=http://localhost:3000`
   - `STRIPE_SECRET_KEY=sk_test_...`
   - `STRIPE_PUBLISHABLE_KEY=pk_test_...`
   - `STRIPE_WEBHOOK_SECRET=whsec_...`
   - `STRIPE_ALLOW_LIVE=false`
   - `STRIPE_PRICE_PREMIUM_MONTHLY=price_...`
   - `STRIPE_PRICE_PREMIUM_QUARTERLY=price_...`
   - `STRIPE_PRICE_PREMIUM_SEMIANNUAL=price_...`
   - `STRIPE_PRICE_PREMIUM_ANNUAL=price_...`

2. Start the app:
   - `npm run dev`

3. Start Stripe webhook forwarding:
   - `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   - Copy the forwarding secret from CLI output and set it as `STRIPE_WEBHOOK_SECRET`

4. Seed test data if needed:
   - `npx prisma db push`
   - `npm run prisma:seed`

---

## 2. Test Accounts

- Member login route: `/auth/login`
- Admin login route: `/admin/login`

Member examples:
- `ahmed@example.com` / `Password123!`
- `fatima@example.com` / `Password123!`
- `ali@example.com` / `Password123!`

Admin examples:
- `admin@example.com` / `Password123!`
- `ops.admin@example.com` / `Password123!`

---

## 3. Stripe Test Cards

Use standard Stripe sandbox cards in checkout:

- Success card: `4242 4242 4242 4242`
- Payment failure card: `4000 0000 0000 9995`
- Any future expiry date and any CVC/ZIP accepted in test mode.

---

## 4. Member Billing QA

### 4.1 Billing page loads

- [ ] Login as a member and open `/dashboard/billing`
- [ ] Page renders current subscription block
- [ ] Invoice table loads without crashing
- [ ] No console errors in browser dev tools

### 4.2 Upgrade flow to Stripe checkout

- [ ] From `/dashboard/billing`, click Upgrade or Change plan
- [ ] Confirm redirect to `/pricing`
- [ ] Trigger checkout and complete payment with success card
- [ ] Confirm redirect back to `/dashboard?upgraded=1`

### 4.3 Webhook synchronization

- [ ] Verify Stripe CLI shows `checkout.session.completed` delivery success
- [ ] Verify subscription is created or updated in DB (`Subscription` table)
- [ ] Verify `stripeCustomerId` and `stripeSubscriptionId` are populated

### 4.4 Billing history and invoice links

- [ ] Return to `/dashboard/billing`
- [ ] Confirm invoice appears with amount, status, date
- [ ] Confirm hosted invoice link opens in new tab

### 4.5 Cancel auto-renew

- [ ] Click Cancel auto-renew on active subscription
- [ ] Confirm button handles loading state
- [ ] Confirm API returns success
- [ ] Confirm page refreshes and still shows valid end date

---

## 5. Failure Path QA

### 5.1 Failed payment scenario

- [ ] Attempt checkout with failure test card
- [ ] Verify Stripe sends `invoice.payment_failed`
- [ ] Confirm webhook route returns 200 and does not crash

### 5.2 Communication placeholder verification

- [ ] Confirm payment failure path classifies reason into one of:
  - `BANK_DECLINE`
  - `PROCESSOR_RETRYABLE`
  - `SERVER_INTERNAL`
- [ ] Confirm communication placeholder queue function is called in logs/tests
- [ ] Confirm no real outbound email is sent in this release

---

## 6. Admin QA

### 6.1 Admin payments page

- [ ] Login as admin and open `/admin/payments`
- [ ] Confirm placeholder operations widgets render
- [ ] Confirm communication log placeholder table renders

### 6.2 Admin subscriptions cross-check

- [ ] Open `/admin/subscriptions`
- [ ] Confirm upgraded member appears with expected status
- [ ] Confirm status changes are reflected after webhook events

---

## 7. Vercel Preview QA

1. Set the same Stripe test-mode environment variables in Vercel Preview.
2. Create Stripe test-mode webhook endpoint for preview URL:
   - `https://<preview-domain>/api/stripe/webhook`
3. Run member upgrade flow on preview deployment.
4. Confirm Stripe event deliveries are successful.
5. Confirm billing page and admin subscriptions reflect synchronized data.

---

## 8. Sign-off Checklist

- [ ] Happy path checkout and webhook sync validated
- [ ] Failed payment path validated
- [ ] Member billing page validated
- [ ] Cancel auto-renew validated
- [ ] Admin payments placeholder page validated
- [ ] Preview environment validated

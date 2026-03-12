---
applyTo: "src/**/*.{ts,tsx,js,jsx},tests/**/*.{ts,tsx,js,jsx},prisma/**/*.ts"
description: "Use when implementing features, API routes, or bug fixes in Halal Harmony. Enforces pre-commit testing gates: API basic coverage, feature tests, regression tests, lint, typecheck, and basic manual QA before feature completion. Trigger words: test, testing, pre-commit, regression, feature test, manual QA, API test coverage."
---
# Halal Harmony Testing & Verification Gates

Follow these rules for every feature or bug-fix change.

## 1. API Test Coverage Minimum (Required)
- Every API route touched by the change must have basic tests.
- Basic means at minimum:
  - One success-path test.
  - One failure-path test (validation, auth, or error handling).
- If advanced API tests are out of scope, add explicit TODO items in the relevant plan/spec tracking location.

## 2. Feature Tests Before Commit (Required)
- Run feature-focused tests for the exact area changed before creating a commit.
- Prefer targeted test commands first to validate fast and isolate failures.

## 3. Regression Tests Before Commit (Required)
- Run regression tests for related flows that could be impacted by the change.
- Include neighboring modules and shared behavior, not only the edited file.

## 4. Lint + Typecheck Before Commit (Required)
- Run linting before commit.
- Run TypeScript type-checking before commit.
- Do not create a commit with unresolved lint/type errors unless explicitly approved by the user.

## 5. Basic Manual QA Before Feature Completion (Required)
- Execute basic manual tests for the changed flow before declaring the feature complete.
- Manual checks should cover:
  - Main happy path.
  - One negative/edge path.
  - User-visible confirmation that expected behavior changed correctly.

## Commit Readiness Checklist
- [ ] Basic API tests exist for touched APIs (success + failure path).
- [ ] Feature tests have been run and pass.
- [ ] Regression tests have been run and pass.
- [ ] Lint has been run and passes.
- [ ] Typecheck has been run and passes.
- [ ] Basic manual QA completed (happy path + edge path).
- [ ] Advanced tests (if deferred) captured as TODOs.

## Reporting Format in PR/Task Update
When summarizing work, include:
1. Tests added/updated.
2. Commands executed.
3. Manual QA scenarios performed.
4. Deferred advanced tests as TODO items.

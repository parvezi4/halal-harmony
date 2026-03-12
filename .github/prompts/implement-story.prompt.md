---
mode: ask
description: "Run a repeatable Halal Harmony story/feature workflow: context review, Sunni cross-check, doc updates, implementation, testing, regression verification, and commit readiness. Trigger words: implement story, feature workflow, acceptance criteria, docs update, regression verification, commit checklist."
argument-hint: "Feature/story request, relevant story IDs, constraints, and expected outputs"
---
Use this workflow to execute a Halal Harmony story/feature consistently.

## Inputs
- Feature/story request
- Known story IDs or acceptance criteria (if available)
- Any hard constraints (product, Islamic, technical)

## Workflow
1. **Context sweep first**
   - Read `README.md`, `docs/PLAN.md`, `docs/specs/*.yaml`, `docs/wireframes.md`, and any relevant supporting `docs/*`.
   - Summarize applicable acceptance criteria before proposing changes.
2. **Sunni constraints cross-check**
   - Validate decisions against strict Sunni understanding of gender interactions, halal relationships, and nikah-focused intent.
   - If uncertain, surface assumptions explicitly and ask for user decision before sensitive implementation.
3. **Reference benchmarking (non-binding)**
   - Optionally consult `purematrimony.com`, `sunnahmatch.com`, `nikkahgram.com`, and other matrimony apps for feature ideas and UX patterns.
   - Borrow patterns, not copy; reject anything conflicting with Sunni constraints.
4. **Discuss and lock implementation plan**
   - Confirm scope boundaries, files to edit, tests to update, and risks.
5. **Update docs/spec notes when decisions changed**
   - If behavior changed from existing docs/specs, update docs first or in the same patch set.
6. **Implement code changes**
   - Apply minimal, focused edits aligned to acceptance criteria.
7. **Testing gates (required before commit)**
   - Ensure touched APIs have basic tests (success + failure/auth/validation path).
   - Run feature tests for changed area.
   - Run regression tests for related flows.
   - Run lint and typecheck.
   - If advanced tests are deferred, record TODOs.
8. **Manual QA (required before completion)**
   - Run at least: one happy path and one edge/negative scenario.
9. **Regression verification**
   - Explicitly verify no new bugs/regressions in adjacent flows.
10. **Commit readiness output**
   - Provide concise evidence for each gate before creating commit (or before asking user to approve commit).

## Output Format
1. Requirement mapping: docs/spec criteria used.
2. Sunni cross-check: constraints applied and assumptions.
3. Decision log: what changed and why.
4. Code changes: files + behavior.
5. Verification:
   - Automated tests run
   - Lint/typecheck status
   - Manual QA scenarios
   - Regression checks
6. Deferred items: advanced test TODOs.
7. Commit readiness: pass/fail per gate.

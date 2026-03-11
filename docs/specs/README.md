### Specs directory

- **Purpose**: Central place for product and technical specifications, versioned alongside the codebase.

### Structure

| File | Phase | Status | Description |
|------|-------|--------|-------------|
| `phase1-user-stories.yaml` | 1 | ✅ completed | User stories and acceptance criteria for auth, onboarding/profile creation, basic search, and dashboard |
| `phase2-messaging.yaml` | 2 | ✅ completed | User stories for real-time messaging, subscription gating, Shariah-compliant content moderation, and admin review workflow — includes `ModerationWarning` persistence spec |

For future phases, add files following the same naming pattern (e.g. `phase3-payments.yaml`) or topic-scoped files (e.g. `stripe-subscription-flow.yaml`). For narrative documents, use Markdown (e.g. `product-vision.md`, `domain-model.md`).

### Recommended workflow

- **Authoring**: Write new stories/specs in YAML or Markdown under `docs/specs/`, and review them via pull requests.
- **Linking**: Reference story IDs (e.g. `search-basic-filters`) in your task/issue tracker so implementation work can trace back to the spec.
- **Updating**: When you materially change behavior, update the relevant YAML/Markdown file and bump the `last_updated` field where present.

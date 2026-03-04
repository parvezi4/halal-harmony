### Specs directory

- **Purpose**: Central place for product and technical specifications, versioned alongside the codebase.

### Structure

- **`phase1-user-stories.yaml`**: Detailed user stories and acceptance criteria for Phase 1 (auth, onboarding/profile creation, basic search, and dashboard).
- Future phases:
  - You can add files like `phase2-subscriptions-messaging.yaml`, `phase3-moderation.yaml`, or feature-specific specs.
  - For more narrative documents, add markdown files such as `product-vision.md`, `domain-model.md`, or `api-design.md`.

### Recommended workflow

- **Authoring**: Write new stories/specs in YAML or Markdown under `specs/`, and review them via pull requests.
- **Linking**: Reference story IDs (e.g. `search-basic-filters`) in your task/issue tracker so implementation work can trace back to the spec.
- **Updating**: When you materially change behavior, update the relevant YAML/Markdown file and bump the `last_updated` field where present.


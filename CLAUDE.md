# LocalLoop Mobile — Agent Guide

## Git workflow

Always branch before coding. Never commit without explicit user approval.
Full rules: see `## Git workflow` in the root `CLAUDE.md`.

```
□ On a feature branch? → git checkout -b <type>/<slug>
□ User approved changes? → show diff and wait before committing
```

---

## What this project is

The Expo React Native app for LocalLoop — a proximity-based group chat app.

**Stack:** Expo SDK 55 | React Native 0.83 | Zustand | Supabase (OAuth) | Axios

## Documentation

All docs live in `localloop-shared/docs/` and are loaded automatically via the root `CLAUDE.md`.
If you launched Claude from this repo directly, read them at `../localloop-shared/docs/`.

Key files:
- `../localloop-shared/docs/prd.md` — Business rules (source of truth)
- `../localloop-shared/docs/architecture.md` — Clean Architecture pattern and mobile screen structure
- `../localloop-shared/docs/status.md` — Current project state and pending work

## Repository structure

```
src/
  domain/          ← pure entities (no framework imports)
  application/
    stores/        ← Zustand stores
    hooks/         ← custom hooks (application-layer logic)
  infra/
    api/           ← axios client + endpoint modules
    supabase/      ← Supabase client
  presentation/
    screens/       ← one folder per screen (see screen pattern below)
    navigation/    ← React Navigation stack definitions
  shared/
    theme/         ← colors, spacing, typography tokens
    constants/     ← API_URL, STORAGE_KEYS
```

## Screen pattern

Every screen lives in `presentation/screens/<ScreenName>/`:

```
<ScreenName>/
  index.tsx        ← container: hooks, state, handlers, renders <Layout>
  types.ts         ← screen-level types
  layout/
    index.tsx      ← pure presentational component (no hooks, no store reads)
    styles.ts      ← StyleSheet.create(...)
    types.ts       ← LayoutProps interface
```

## Non-negotiable principles

- **Clean Architecture:** dependencies always point inward
  (presentation → application → domain; never reversed)
- Layout components are always pure — no hooks, no store reads, no side effects
- No business logic in screens — extract to `application/hooks/`
- Zero `any` without a comment explaining why
- No silent catch blocks
- `@localloop/shared-types` — import from this package, never duplicate enums locally

## Environment variables

Copy `.env.example` to `.env` and fill in your values:
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=
```

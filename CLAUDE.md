# LocalLoop Mobile — Agent Guide

## What this project is

The Expo React Native app for LocalLoop — a proximity-based group chat app.

**Stack:** Expo SDK 55 | React Native 0.83 | Zustand (client state) | @tanstack/react-query (server state) | Supabase (OAuth) | Axios

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

- All architecture rules in `localloop-shared/docs/architecture.md` apply — read before implementing
- Layout components are always pure — no hooks, no store reads, no side effects
- No business logic in screens — extract to `application/hooks/`
- Zero `any` without a comment explaining why
- No silent catch blocks
- Import enums from `@localloop/shared-types`, never duplicate locally
- **All server state goes through React Query.** New REST endpoints must be consumed via `useQuery` / `useInfiniteQuery` / `useMutation` — never `useState + useEffect` + manual axios. Mutations that change UI state (creates, deletes, role changes) should be optimistic (`onMutate` with rollback). Zustand is for client-only state (auth session, form drafts) — not cached server data. See [architecture.md § State management](../localloop-shared/docs/architecture.md) for rationale.

## Environment variables

Copy `.env.example` to `.env` and fill in your values:
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=
```

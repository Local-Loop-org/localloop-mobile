# LocalLoop Mobile

Expo / React Native client for [LocalLoop](https://github.com/Local-Loop-org/localloop-shared). Clean architecture across `application` / `domain` / `infra` / `presentation`, all server state through React Query (with optimistic mutations and a temp-id reconciliation flow), and an Android APK that ships to GitHub Releases on every green main build.

[![CI](https://img.shields.io/github/actions/workflow/status/Local-Loop-org/localloop-mobile/ci.yml?branch=main&label=ci)](https://github.com/Local-Loop-org/localloop-mobile/actions/workflows/ci.yml)
[![Expo SDK 55](https://img.shields.io/badge/expo-SDK%2055-000020?logo=expo&logoColor=white)](#)
[![React Native 0.83](https://img.shields.io/badge/react--native-0.83-61DAFB?logo=react&logoColor=white)](#)
[![TypeScript 5.9](https://img.shields.io/badge/typescript-5.9-3178C6?logo=typescript&logoColor=white)](#)

> Part of [LocalLoop](https://github.com/Local-Loop-org/localloop-shared) — start at the shared repo for the full project picture.

---

## What this app does

A pixel-tuned client for browsing groups anchored to your location, joining them, and chatting in real time.

<p align="center">
  <img width="200" alt="Screenshot 2026-05-08 at 16 36 40" src="https://github.com/user-attachments/assets/aa1e8161-fbfc-4037-8cb6-620ea6f06c82" />
  <img width="200" alt="Screenshot 2026-05-08 at 16 38 22" src="https://github.com/user-attachments/assets/afc9fe58-8d57-4e1a-982c-f208412f7b97" />
  <img width="200" alt="Screenshot 2026-05-08 at 16 38 02" src="https://github.com/user-attachments/assets/c7f61321-b978-4b5d-8641-d74c97f0a284" />
  <img width="200" alt="Screenshot 2026-05-08 at 16 37 46" src="https://github.com/user-attachments/assets/6d342628-55ca-4804-92fc-3df98cf54579" />
  <img width="200" alt="Screenshot 2026-05-08 at 16 37 13" src="https://github.com/user-attachments/assets/5d64aee2-9918-49d7-b701-a5e5b2f7cc5a" />  
</p>



## Architecture: Clean layers

```
src/
  application/      hooks (useQuery / useInfiniteQuery / useMutation), Zustand stores
  domain/           entities & types
  infra/            api/ (axios + 401 interceptor) · socket/ (Socket.IO client) · supabase/ · react-query/
  presentation/     navigation/ · screens/<Name>/{ index.tsx (container), layout/, types.ts }
  shared/           icons/ (custom SVG system) · theme/ · format/ · constants/
```

**Screen split rule.** Every screen has a container (`index.tsx`) that owns hooks, store reads, navigation, and handlers — and a `layout/` component that's purely presentational (no hooks, no store reads, no side effects). The container builds props, the layout renders them. This makes layouts trivial to snapshot and lets the container swap between real hooks in production and fakes in tests without touching the UI.

## Server state through React Query

Every REST endpoint is consumed through React Query — never `useState + useEffect + manual axios`. Examples worth pointing at:

- **Infinite history + optimistic send.** [useGroupChat.ts](src/application/hooks/useGroupChat.ts) uses `useInfiniteQuery` for chat history (cursor pagination via `next_cursor`). Sending a message writes a `temp-<id>` row directly into the `['chat','history',groupId]` cache; when the server's `new_message` echo arrives over the socket, the hook finds the matching temp row by `(senderId, content)` and replaces it with the canonical message. If the echo never comes, the temp stays — no duplicates, no flicker.
- **Geo-keyed discovery.** [useNearbyGroups.ts](src/application/hooks/useNearbyGroups.ts) keys on `['groups', 'nearby', "lat,lng"]` so distinct locations share no cache entry, with `staleTime` tuned for typical session length. The hook also calls `userApi.updateLocation` before fetching, so the user's geohash is written exactly once per discovery.
- **Cross-screen pinning.** [useMyGroups.ts](src/application/hooks/useMyGroups.ts) backs the "Meus grupos" home section and the dedicated "all my groups" screen.

Mutations that change UI state (joins, leaves, bans, profile edits) follow the same pattern: `onMutate` writes the optimistic state, `onError` rolls back, `onSettled` invalidates the canonical query.

## Client state — Zustand + SecureStore

The Zustand store at [auth.store.ts](src/application/stores/auth.store.ts) holds **only** the auth session (access token, refresh token, current user, hydration flag, `isNewUser`). It hydrates from `expo-secure-store` on app launch and persists writes back to it. Server data — groups, messages, members — explicitly does **not** go in Zustand; that's React Query's job. This separation means a server change never has to manually invalidate two caches.

## HTTP layer — refresh queue

[api-client.ts](src/infra/api/api-client.ts) is the single axios instance every endpoint uses. Two interceptors:

1. Request — pulls `accessToken` from the store and sets `Authorization: Bearer …`.
2. Response — on 401, runs the refresh-and-retry dance.

The interesting part is concurrency. If five queries fire while the access token is expired, all five will 401 within milliseconds. Naive logic would refresh five times. Instead the client keeps a module-scoped `isRefreshing` flag and a `failedQueue` of `{ resolve, reject }` callbacks. The first 401 starts a refresh; subsequent 401s push their request onto the queue and resolve once `processQueue` is called with the new token. Net result: **exactly one** refresh, all queued requests retry with the rotated token. If the refresh endpoint itself returns 401, the session is unrecoverable — the store logs the user out. Test coverage is in [api-client.test.ts](src/infra/api/api-client.test.ts).

## Real-time

[chat-socket.ts](src/infra/socket/chat-socket.ts) builds a Socket.IO client targeting the `/chat` namespace with the access token in `auth.token`. `useGroupChat` wires events:

- `connect` → `socket.emit('join_group', { groupId })`
- `new_message` → reconcile temp ids in the React Query cache
- `presence_update` → filter to active `groupId`, update `onlineCount`
- `error` → surface as a screen-level banner

The socket disconnects on unmount; the React Query cache stays warm so reopens within `gcTime` render instantly.

## Design system

Custom SVG icon component at [src/shared/icons/](src/shared/icons/) — a single `<Icon name="…" size color strokeWidth />` typed against an `IconName` union and built on `react-native-svg`. Replaces `@expo/vector-icons` (smaller bundle, fully themable, no font loading). Includes an `anchorIconName(AnchorType)` helper that maps each anchor enum to its glyph. Theme tokens (colors with `line` / `dim` / `faint`, accent gradient pair `accent` + `accent2`, spacing, typography) live at [src/shared/theme/](src/shared/theme/) and back the gradient bubbles, day separators, and presence subtitle in chat.

## Navigation

[RootNavigator.tsx](src/presentation/navigation/RootNavigator.tsx) is the auth gate: it reads `useAuthStore` on mount, shows a loader while hydrating, then routes to either the auth stack, onboarding (for `isNewUser`), or the authenticated stack. The authenticated stack wraps a real `@react-navigation/bottom-tabs` navigator (Home / Inbox / Create / Map / Profile) with a custom `BottomTabBar`.

## Testing

Jest + jest-expo + React Native Testing Library + `axios-mock-adapter`. ~20 test modules across hooks, screens, navigation, formatters, and the api-client refresh queue. Coverage includes: the optimistic chat path with socket echoes (`useGroupChat`), the 401 refresh queue under concurrent in-flight requests (`api-client.test.ts`), and the auth-gated routing in `RootNavigator`. Container-level screen tests verify that local-only fields stay local-only — for example, `CreateGroupScreen`'s `radiusKm` / `sendPerm` / `sendMediaPerm` fields render in the UI but are not yet on the wire to the API, and there's a pinned test that fails the moment they leak into the request body.

```bash
npm test          # all tests
npm run test:watch
```

## Local development

```bash
npm install
cp .env.example .env       # fill in the EXPO_PUBLIC_* vars
npm start                  # Expo dev server (or `npm run ios` / `npm run android`)
```

Required environment variables (all `EXPO_PUBLIC_*` so they're embedded at build time):

- `EXPO_PUBLIC_API_URL` — base URL for the LocalLoop API
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL (used for OAuth)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key

## CI/CD — APK delivery

Pipeline at [.github/workflows/ci.yml](.github/workflows/ci.yml):

```
type-check (tsc --noEmit)  →  unit tests (jest)  →  EAS Build (Android, profile production)
                                                                    │
                                                                    ▼
                                       GitHub Release tagged build-<run_number>
                                       with the .apk attached  (main, push only)
```

EAS builds use the `production` profile and emit an APK URL, which the workflow downloads and attaches to a GitHub Release tagged `build-<run_number>` with the commit SHA and branch name in the notes. 

iOS builds are deferred until an Apple Developer account is set up; once that lands, an `ios` job slots in next to `release-apk` and the EAS profile picks up.

## What's interesting in this codebase

- **Clean layers + screen split rule** — pure presentational layouts are trivial to snapshot, and containers can be tested against fake hooks without rendering React Native components.
- **Optimistic chat with temp-id reconciliation** — sending feels instant, the server echo is the source of truth, and there's no race between the optimistic write and the broadcast.
- **A 401 refresh queue that survives concurrent requests** — exactly one rotation, all in-flight requests retry with the new token, full test coverage.
- **Custom SVG icon system** — typed glyph union, smaller bundle, and an `anchorIconName(AnchorType)` mapping that makes anchor type a first-class UI concept.
- **No-mocks server-state strategy** — every endpoint goes through React Query; Zustand is intentionally limited to the auth session, so there is exactly one cache to invalidate when state changes.
- **Sideloadable APK from CI** — every green main build is a clickable download in the Releases tab.

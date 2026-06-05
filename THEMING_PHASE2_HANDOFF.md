# Theming Phase 2 — Handoff

> **Mission:** make the Light/Dark toggle repaint **every** screen instantly by
> converting the app's static `StyleSheet.create` sites to read colors at render
> time. Phase 1 (design system + theming infrastructure) is already merged/open;
> this is the mechanical migration that finishes the feature.
>
> Read this top to bottom, then **re-plan with the user** (there is one real
> decision below) before editing. Full design reference:
> [`localloop-shared/docs/theming.md`](../localloop-shared/docs/theming.md).

---

## 1. Why this phase exists

React Native bakes `StyleSheet.create({...})` color values **once at module
load**. So Phase 1's centralized palette swap can't repaint an already-rendered
screen. Today, switching to Light only repaints **render-time** surfaces
(StatusBar, navigation background, and the one migrated component `Avatar`).
Every screen that still imports the static `colors` renders in **dark**.

Phase 2 = move each `StyleSheet.create` into a render-time factory so it reads
the active palette from `useTheme()`.

## 2. What Phase 1 already gave you (do not rebuild)

- **Palettes + tokens:** [`src/shared/theme/index.ts`](src/shared/theme/index.ts) exports `darkColors`, `lightColors`, `type ThemeColors`, plus `radius`, `spacing`, `fonts`, `createTypography(c)`. It still exports a backward-compat `colors = darkColors` and `typography` (dark-baked) — **these are what you will delete at the very end** to prove completeness.
- **Active palette hook:** [`src/shared/theme/useTheme.ts`](src/shared/theme/useTheme.ts) → `{ colors, mode, isDark, setMode }`.
- **The conversion tool:** [`src/shared/theme/useThemedStyles.ts`](src/shared/theme/useThemedStyles.ts) — `useThemedStyles(factory)`, WeakMap-cached (one StyleSheet per factory+palette for the app lifetime).
- **Theme store:** [`src/application/stores/theme.store.ts`](src/application/stores/theme.store.ts) (Zustand + secure-store, default `dark`), initialized in `RootNavigator`, toggle wired in `ProfileScreen`.
- **Reference conversion (your template):** [`src/shared/ui/Avatar.tsx`](src/shared/ui/Avatar.tsx). Copy this pattern.
- **New semantic tokens** for de-inlining `rgba(...)`: `lineStrong`, `duotoneSoftFrom`, `duotoneSoftTo`, `anchorTileBorder`, `primarySoft`, `primarySoft08`, `primaryBorder`, `dangerSoft`, `dangerBorder`, `scrim`, `quotedReplyBg` (each defined for both modes).

## 3. The transform recipes

### Tier A — `shared/ui/**` and any hookable function component
```ts
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { useTheme } from '@/shared/theme/useTheme';
import type { ThemeColors } from '@/shared/theme';

export default function Thing() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();           // ONLY for non-StyleSheet color props
  // ...use styles.x; use colors.x for gradient arrays / icon color= / placeholderTextColor
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({ box: { backgroundColor: c.surface, color: c.text } });
```

### Tier B — pure screen layouts (`screens/*/layout/...`)
`layout/index.tsx` and its presentational children are **pure** — no hooks, no
store reads (see [`architecture.md`](../localloop-shared/docs/architecture.md) §
screen pattern, lines ~88-96). So the **container** (`screens/*/index.tsx`,
which already uses hooks) resolves the theme and passes `colors` down; the pure
layout calls a plain factory:
```ts
// layout/styles.ts  (still imports ONLY @/shared/theme + react-native — rule-compliant)
export const createStyles = (c: ThemeColors) => StyleSheet.create({ ... });

// screens/Foo/index.tsx  (container)
const { colors } = useTheme();
return <FooLayout colors={colors} ... />;

// layout/index.tsx  (pure — createStyles is a plain call, NOT a hook)
const styles = createStyles(colors);
```
Add `colors: ThemeColors` to the layout's `LayoutProps` (`layout/types.ts`) and
thread it to any pure sub-components that build their own styles.

> **Perf:** `createStyles` is cheap and `darkColors`/`lightColors` are stable
> singletons. If you want to avoid re-calling on every parent re-render, give
> each `styles.ts` a tiny module-level `WeakMap<ThemeColors, ...>` cache (same
> shape as `useThemedStyles`) and return the cached sheet — keeps the pure
> layout a one-liner with no `useMemo`.

## 4. ⚠️ Decision to confirm with the user before starting

Deeply-nested screen layouts (`CreateGroupScreen`, `GroupDetailScreen`) have
many presentational sub-components under `layout/atoms|components|sections`.
Strict reading of the architecture rule says **thread `colors` as a prop**
through all of them (verbose but rule-compliant and keeps them trivially
testable). The lighter alternative is to let those **leaf** presentational
components call `useThemedStyles` directly (fewer props, but they then read a
store — a softening of the "pure layout" rule).

**Recommend:** prop-threading for screen layouts (Tier B), `useThemedStyles` for
`shared/ui` only. Get the user to confirm before converting CreateGroup/GroupDetail,
since it sets the pattern for ~40 files.

## 5. Suggested wave order (independently shippable; ship a PR per wave)

Each wave: `tsc --noEmit` clean + `jest` green. The backward-compat `colors`
export means un-migrated files keep compiling throughout.

**Wave 1 — shared/ui primitives (Tier A, low risk).** Proves the pattern end-to-end with the already-wired Profile toggle.
- `src/shared/ui/FilterChip.tsx`, `SearchInput.tsx`, `ConversationRow.tsx`
- (`Avatar.tsx` already done — reference)

**Wave 2 — ProfileScreen layout fully (Tier B).** The toggle lives here; finishing it gives the first fully-repainting screen.
- `src/presentation/screens/ProfileScreen/index.tsx` (pass `colors`)
- `ProfileScreen/layout/{index.tsx, styles.ts, types.ts}` and children: `Avatar.tsx`, `Row.tsx`, `ToggleRow.tsx`, `SegmentRow.tsx`, `RadiusSlider.tsx`
- De-inline here: `styles.ts` local `surface2 = '#262630'` → `c.surface2`; `ToggleRow.tsx` `'#262630'` → `c.switchTrackOff`* and `rgba(0,209,255,0.1)` → `c.primarySoft`. (*add a `switchTrackOff` token if you want an exact match, or reuse `surface2`.)
- Test to keep green: `ProfileScreen/layout/RadiusSlider.test.tsx`.

**Wave 3 — chat (Tier A, highest risk — biggest surface).**
- `src/shared/ui/chat/styles.ts` (large factory; tokenize its `rgba(...)` and `` `${colors.primary}22` ``) + the ~20 components in `src/shared/ui/chat/` (`OwnBubble`, `PeerBubble`, `QuotedReply`, `ChatComposer`, `ReplyPreviewChip`, the three `*ActionSheet`, `FailedMessageWarning` [hardcoded `fill='#fff'`], etc.).
- Tests to keep green: `src/shared/ui/chat/Bubble.test.tsx`, `MessageActionSheet.test.tsx`.

**Wave 4 — remaining screens (Tier B, mechanical), one screen per PR.**
- `InboxScreen`, `MyGroupsScreen`, `HomeScreen` (styles.ts has rgba + the `BottomTabBar`), `GroupMembersScreen`, `DmChatScreen`, `GroupChatScreen`, `LoginScreen` (gradient + imports `typography`), `OnboardingScreen` (hardcoded hex + imports `typography`), `MapScreen` (imports `typography`).
- Highest-risk: `CreateGroupScreen` and `GroupDetailScreen` (many atoms/sections, SVG `<Defs>/<Stop>` gradients in `HeroCard.tsx`/`Hero.tsx`, lots of inline `rgba`). Do these last using the decision from §4.

**Wave 5 — cleanup / proof of completeness.**
- Switch the 5 `typography` consumers (LoginScreen, OnboardingScreen, MapScreen) onto `createTypography(colors)` via their tier.
- Delete `export const colors` and `export const typography` from `theme/index.ts`. A clean `tsc` then proves **no file reads the static dark palette** anymore.
- Optional: replace the `applyDefaultFont()` render-patch ([`src/shared/theme/applyDefaultFont.ts`](src/shared/theme/applyDefaultFont.ts)) with a themed `Text` primitive + the full per-component type scale (mono-caps for "sensed data" per the design).

## 6. Full file inventory (from grep, this branch)

- **11 screen `layout/styles.ts`** (Tier B): CreateGroup, DmChat, GroupChat, GroupDetail, GroupMembers, Home, Inbox, Login, MyGroups, Onboarding, Profile.
- **62 files** call `StyleSheet.create` total (includes the theme module + tests).
- **22 files** with inline `rgba(...)` → move onto the semantic tokens.
- **7 files** with hardcoded `#hex` outside the theme dir: `GroupDetailScreen/layout/components/Hero.tsx`, `OnboardingScreen/layout/index.tsx`, `ProfileScreen/layout/ToggleRow.tsx`, `ProfileScreen/layout/styles.ts`, `shared/icons/Icon.tsx` (default `'#000'` param — fine, every call passes a themed color), `shared/ui/chat/FailedMessageWarning.tsx` (`fill='#fff'`), and the `RootNavigator.test.tsx` nav-theme mock (leave it).
- **14 files** use `expo-linear-gradient`; SVG gradients (`<Stop stopColor>`) live in `CreateGroupScreen/.../HeroCard.tsx`, `GroupDetailScreen/.../Hero.tsx`, `CreateGroupScreen/.../RadiusMapPreview.tsx`. All are render-time props → read `colors` from the hook (Tier A) or the `colors` prop (Tier B).

## 7. Edge cases / gotchas

- **Gradients & SVG fills are NOT StyleSheet** — they're props. Just source their colors from `useTheme().colors` (Tier A) or the `colors` prop (Tier B). `Icon.tsx` already takes `color` and is fine.
- **`shared/icons/AnchorIconBadge.tsx`** hoists gradient/border as module constants AND exports them — replace with `colors.duotoneSoftFrom/To` + `colors.anchorTileBorder` and fix its importers to read tokens at render.
- **`typography` baked color** — the 5 consumers in §5 Wave 5 currently get dark-baked `typography`. Switch them to `createTypography(colors)`.
- **Do not introduce a third hue** (design rule): `colors.secondary` is now the violet `accent2`; keep gradients cyan→violet.
- **Imports:** absolute `@/...` only (CLAUDE.md), no re-export shims when moving code.
- **Tests render with no provider** — `useTheme()` reads the store (defaults `dark`) and works wrapper-free, so existing render tests stay green. If you convert a component a test renders AND it now needs a `colors` prop (Tier B sub-components), pass it in the test. To assert light output, `useThemeStore.setState({ mode: 'light' })` in the test (mirrors how `useThemedStyles.test.ts` does it).

## 8. Verification (every wave)

```
npx tsc --noEmit            # in localloop-mobile
npx jest                    # 71 suites / 564 tests are green at Phase-1 start
```
Manual: launch the app, open Profile, toggle Light/Dark — each migrated screen
should repaint instantly with no reload. After Wave 5, a clean `tsc` with the
`colors`/`typography` exports removed is the definitive "done" signal.

## 9. Git workflow (CLAUDE.md — mandatory)

- Branch off `main` (do **not** work on `main`): e.g. `feat/theming-phase2-<wave-slug>`, one per wave, same slug if it spans repos.
- Commit format `<type>(<scope>): <desc>`; end with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Run each `cd` / `git add` / `git commit` as a **separate** bash call (no `&&`/`;`).
- After commit: `git push -u origin <branch>` then `gh pr create` against `main`; return the PR URL.
- Update [`localloop-shared/docs/status.md`](../localloop-shared/docs/status.md) at session end (rolling 3 "Last updated" entries; archive the 4th to `history.md`) and tick Phase-2 progress in [`theming.md`](../localloop-shared/docs/theming.md).

## 10. Context pointers

- Phase-1 PRs: mobile `Local-Loop-org/localloop-mobile#37`, shared `Local-Loop-org/localloop-shared#43` (branch `feat/design-system-theming`).
- Design source bundle was extracted to `/tmp/localloop-design/` (ephemeral); the durable token values live in `theme/index.ts` + `theming.md`.

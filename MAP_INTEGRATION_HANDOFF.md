# Handoff — Map provider integration (then data wiring)

> For the next agent session. **Continue on the existing branch `feat/map-screen-m6`** (PR #36) — do **not** create a new branch. This doc is committed on the branch and kept current — read it first, then update it as you make progress.

---

## 1. Where we are

The **M6 "territory" Map screen** layout is built and merged into this branch (HOME-12).

✅ **Step 1 — Map provider integration is DONE** (this session). `react-native-maps` (1.27.2, SDK-pinned) replaces the placeholder backdrop: a real interactive basemap centered on the user, the discovery radius drawn as a geo `<Circle>`, and the native "you are here" dot. The basemap is themed to the LocalLoop palette and follows the Light/Dark toggle (custom JSON style on Android/Google, `userInterfaceStyle` on iOS/Apple). tsc + jest green (75 suites / 598). See §6 for the as-shipped detail and the **native rebuild + API key** steps the user must run.

What remains, in order:

1. ~~Map provider integration~~ ✅ done.
2. **Real markers** (§7) — blocked on a cross-repo API change to add anchor coordinates to `NearbyGroup`. Mock pins currently still render as screen-positioned overlays.
3. **Data wiring** (§8, later) — replace mock pins with live nearby-groups + presence, and wire join/navigate.

Everything shipped so far is documented in PR #36 and the plan at `~/.claude/plans/fetch-this-design-file-scalable-kitten.md`.

---

## 2. Branch / workflow rules (important)

- **Stay on `feat/map-screen-m6`.** Commit + push to update PR #36.
- **Bash**: this repo's root agent guide forbids compound commands — run each command (`cd`, `git add`, `git commit`) as a **separate** Bash call. The shell cwd sometimes resets to the repo root (`/Users/5by5andrey-viktor/side-prj/local-loop`), so `cd` into `localloop-mobile` as its own call before running `npx ...`.
- **No `typecheck`/`lint` npm scripts and no ESLint config exist.** Quality gates are: `npx tsc --noEmit` and `npx jest`. Keep both green.
- **Screen pattern** (mandatory): container `index.tsx` holds state/hooks; `layout/` is pure (no hooks/store reads); components under `layout/components/`.
- Prefer absolute imports (`@/...`); when moving a file, update callers in the same diff (no re-export shims).
- **Theming (Light/Dark) is now live** — `main` was merged in. There is **no static `colors`/`typography` export**. New components must theme styles via `const styles = useThemedStyles(createStyles)` where `createStyles = (c: ThemeColors) => StyleSheet.create({...})`, and read inline colors via `const { colors } = useTheme()` (`@/shared/theme/useTheme`). All Map files already follow this. New tokens live in `darkColors`/`lightColors` in `src/shared/theme/index.ts`.

---

## 3. THE SEAM — DONE ✅

The backdrop in [src/presentation/screens/MapScreen/layout/index.tsx](src/presentation/screens/MapScreen/layout/index.tsx) is now the real map:

```tsx
<MapCanvas userCoords={userCoords} radiusKm={radiusKm} recenterTick={recenterTick} />
```

- `MapCanvas` ([layout/components/MapCanvas.tsx](src/presentation/screens/MapScreen/layout/components/MapCanvas.tsx)) renders `<MapView>` full-bleed with a geo `<Circle>` (radius in metres) + `showsUserLocation`.
- The old placeholders `RadiusMapPreview variant="fill"`, `MapRadiusRing`, and `MapUserLocation` were removed. `MapRadiusRing.tsx` / `MapUserLocation.tsx` are **deleted** (were Map-only).
- `RadiusMapPreview` itself stays — CreateGroup still uses its `variant="preview"` small radius preview.
- The container ([MapScreen/index.tsx](src/presentation/screens/MapScreen/index.tsx)) now calls `useCurrentLocation()` and passes `userCoords`; the compass/recenter button bumps `recenterTick` to re-frame on the user.

---

## 4. Current Map screen structure

```
src/presentation/screens/MapScreen/
  index.tsx                      container: useCurrentLocation (userCoords), recenterTick,
                                 filter/selectedId/radiusKm/search state, useSafeAreaInsets,
                                 MOCK_PINS (NearbyGroup-shaped), rail nav (Create/MyGroups),
                                 onPressGroup = TODO(wire)
  types.ts                       MapPinData = NearbyGroupRowData & { x; y } ; AnchorFilter
  layout/
    index.tsx                    pure MapLayout (composes everything)
    styles.ts                    positioning (topStack/rail/cardWrap), root bg
    types.ts                     MapLayoutProps (incl. userCoords, recenterTick)
    components/
      MapCanvas.tsx              REAL basemap: react-native-maps MapView + geo Circle +
                                 showsUserLocation; themed via useTheme (see §6)
      mapStyle.ts                darkMapStyle / lightMapStyle (palette-tuned Google JSON)
      MapPin.tsx                 marker positioned by x/y FRACTIONS (0..1) — PLACEHOLDER
                                 overlay, floats over the map until real <Marker>s land (§7)
      MapCategoryChips.tsx       reuses shared FilterChip (icon-only categories)
      MapRadiusControl.tsx       inline radius slider (shared useRadiusSlider)
      MapActionRail.tsx          compass(recenter) / plus(create) / users(my groups)
    __tests__/MapLayout.test.tsx render test (pins, chip filter, selected card)
```

(`MapRadiusRing.tsx` + `MapUserLocation.tsx` were deleted — replaced by MapCanvas's
geo Circle + native user dot.)

Static mock data: `MOCK_PINS` in `index.tsx` (9 pins). `x`/`y` are fractions of the viewport, NOT geo coords.

---

## 5. Environment facts

- **Expo SDK ~55**, **React Native 0.83.2**. Dev-client / bare-ish: `ios/` and `android/` native folders are **gitignored** (regenerated by prebuild), plus `eas.json`. **Not Expo Go** — the map lib needs a `prebuild`/dev-client rebuild (see §6 callout).
- **`react-native-maps@1.27.2` is installed** (SDK-pinned via `npx expo install`).
- Config: `app.json` holds `expo.plugins` (`["expo-secure-store","expo-notifications","expo-font"]`); `app.config.js` spreads `app.json`, conditionally adds `android.googleServicesFile` (Firebase), and now injects `android.config.googleMaps.apiKey` from `process.env.GOOGLE_MAPS_API_KEY`. react-native-maps needs **no `plugins` entry** — the Android key goes in the config object (done); iOS uses Apple Maps.
- Other installed/reusable: `expo-location ~55.1.3`, `react-native-svg 15.15.3`, `react-native-gesture-handler ~2.30.0`, `react-native-safe-area-context ~5.6.2`, `expo-linear-gradient`.
- **Jest**: `jest.setup.ts` mocks `react-native-svg`, `expo-linear-gradient`, **and `react-native-maps`** (MapView = forwardRef no-op imperatives; Marker/Circle = View stubs). Extend that mock if you use more of the lib's API.

---

## 6. Step 1 — Map provider integration ✅ DONE

**Decision (user, 2026-06-05):** **`react-native-maps`** (1.27.2, via `npx expo install`). Dark styling: a **custom palette-matched style that follows `useTheme()`** so the basemap matches both Light and Dark.

What shipped:
1. `react-native-maps@1.27.2` installed (SDK-pinned).
2. **Themed basemap** — [layout/components/mapStyle.ts](src/presentation/screens/MapScreen/layout/components/mapStyle.ts) holds `darkMapStyle`/`lightMapStyle` (Google JSON tuned to the palette). `MapCanvas` applies `customMapStyle` (Android/Google) **and** `userInterfaceStyle={mode}` (iOS/Apple), both driven by `useTheme().mode`.
3. **Radius + location** — geo `<Circle radius={radiusKm*1000}>` (stroke `colors.primary`, fill `colors.duotoneSoftFrom`); `showsUserLocation` native dot; camera centers on `useCurrentLocation()` coords (fallback: central Curitiba) and re-frames on the compass button via the `recenterTick` prop.
4. **jest** — `jest.mock('react-native-maps', …)` added in [jest.setup.ts](jest.setup.ts): `MapView` is a `forwardRef` exposing `animateToRegion`/`animateCamera`/`fitToCoordinates` as no-ops; `Marker`/`Circle`/… are plain-View stubs.
5. **Config** — Android Google Maps key injected from `process.env.GOOGLE_MAPS_API_KEY` in [app.config.js](app.config.js) (kept out of source); documented in [.env.example](.env.example). iOS uses Apple Maps (no key).

> ⚠️ **User must run before the map renders on device:**
> 1. Put a **Google Maps (Android) API key** in `.env` as `GOOGLE_MAPS_API_KEY=…` — restrict it to the Maps SDK for Android + `com.localloop.app` + SHA-1.
> 2. **Rebuild the dev client** so the native config is applied: `npx expo prebuild --clean` then `npx expo run:android` / `npx expo run:ios` (`ios/`+`android/` are gitignored/regenerated). iOS renders without a key (Apple Maps).

---

## 7. Step 2 — Real markers (the remaining overlay work)

✅ **Done in Step 1:** the **radius ring** is now a geo `<Circle radius={radiusKm*1000}>` in MapCanvas, and **"you are here"** uses `showsUserLocation`. The only overlay left to reconcile is the pins:

- **Pins** — `MapPin`'s `x`/`y` fraction positioning is obsolete (they currently float over the map as a placeholder). Render groups as `<Marker coordinate={{latitude, longitude}}>` inside MapCanvas, ideally reusing the `MapPin` marker visual as the marker's custom child. Selection/dim/label behavior carries over. **This is blocked ↓.**

### ⚠️ BLOCKER for real markers — group coordinates are not in the API
The API's `NearbyGroup` (in `@localloop/shared-types`) currently exposes **`distanceMeters` + `anchorLabel` only — no `lat`/`lng`**. You cannot place real markers without coordinates. This requires a **cross-repo change** (flag to the user before starting markers):
- `localloop-shared/packages/shared-types`: add e.g. `anchorLat`/`anchorLng` (or `coordinates`) to `NearbyGroup` (bump version).
- `localloop-api`: include the group's anchor coordinates in the `GET /groups/nearby` payload.
- Then `localloop-mobile`: consume them.

Until that lands, markers can only be faked (current x/y placeholder). Decide with the user whether to do the API change now or keep placeholder positions during integration.

---

## 8. Step 3 — Data wiring (later)

Mirror HomeScreen ([src/presentation/screens/HomeScreen/index.tsx](src/presentation/screens/HomeScreen/index.tsx)):
- Replace `MOCK_PINS` with `useNearbyGroups(coords, radiusKm)` (`src/application/hooks/useNearbyGroups/`) + `useGroupListRealtime` for live counts.
- Bind `radiusKm` to `usePreferencesStore.discoveryRadiusKm` (`src/application/stores/preferences.store.ts`) so Home + Map share the radius.
- Wire `onPressGroup` to the join/navigate flow: reuse HomeScreen's `handlePressGroup` / `navigateToChat` / `promptJoinRequest`. **Candidate refactor: extract a shared `useGroupJoinFlow` hook** so Home and Map don't duplicate it.
- Handle the location-permission-denied state (HomeScreen has the pattern).
- The selected-pin card already renders `NearbyGroupRow` (the real Home discovery row) — feeding it live `NearbyGroup`s is the only change there.

---

## 9. Reuse — don't break these

Shared pieces this branch introduced/consolidated; keep them intact:
- `src/shared/ui/radius/` — `useRadiusSlider` (used by **3 screens**: CreateGroup, Profile, Map), `RadiusMapPreview` (CreateGroup preview), `radiusGeometry`.
- `src/shared/ui/nearbyGroup/` — `NearbyGroupRow` + `GroupStatusBadge` (used by Home **and** Map).
- `src/shared/ui/FilterChip.tsx` — `hideLabel` + `iconColor` props (used by Map, Inbox, MyGroups, GroupMembers).

---

## 10. Tests to update

- The `react-native-maps` jest mock is already in `jest.setup.ts` (see §5).
- `MapLayout.test.tsx` asserts `map-pin-*` testIDs + the selected-pin card, and passes `userCoords` + `recenterTick`. When pins become real `<Marker>`s, update those assertions.
- Keep the full suite green: `npx jest` (currently **75 suites / 598 tests** passing; `npx tsc --noEmit` clean).

---

## 11. Open decisions

1. ~~Map provider~~ → **react-native-maps** ✅
2. **Google Maps API key** provisioning → wiring done (env-injected); **user still needs to provision + restrict the Android key** (see §6 callout).
3. ~~Dark map style~~ → **custom palette style following `useTheme()`** ✅
4. **API change** to add group coordinates to `NearbyGroup` (needed for real markers) → **still open** — deferred this session (scope was backdrop + radius only). Do this next to unblock §7 markers.

---

## 12. Quick file index

- Map screen: `src/presentation/screens/MapScreen/**`
- Reuse: `src/shared/ui/radius/**`, `src/shared/ui/nearbyGroup/**`, `src/shared/ui/FilterChip.tsx`
- Location hook: `src/application/hooks/useCurrentLocation/`
- Nearby data + join: `src/application/hooks/useNearbyGroups/`, `useJoinGroup/`, `useGroupListRealtime/`
- Radius preference: `src/application/stores/preferences.store.ts`
- HomeScreen reference (data/join pattern): `src/presentation/screens/HomeScreen/index.tsx`
- Jest mocks: `jest.setup.ts`
- Expo config: `app.json` (plugins), `app.config.js`

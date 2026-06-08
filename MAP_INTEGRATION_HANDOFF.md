# Handoff — Map provider integration (then data wiring)

> For the next agent session. **Continue on the existing branch `feat/map-screen-m6`** (PR #36) — do **not** create a new branch. This doc is committed on the branch and kept current — read it first, then update it as you make progress.

---

## 1. Where we are

The **M6 "territory" Map screen** layout is built and merged into this branch (HOME-12).

✅ **Step 1 — Map provider integration is DONE** (this session). `react-native-maps` (1.27.2, SDK-pinned) replaces the placeholder backdrop: a real interactive basemap centered on the user, the discovery radius drawn as a geo `<Circle>`, and the native "you are here" dot. The basemap is themed to the LocalLoop palette and follows the Light/Dark toggle (custom JSON style on Android/Google, `userInterfaceStyle` on iOS/Apple). tsc + jest green (75 suites / 598). See §6 for the as-shipped detail and the **native rebuild + API key** steps the user must run.

What remains, in order:

1. ~~Map provider integration~~ ✅ done.
2. ~~**Real markers** (§7)~~ ✅ **done** (`feat/nearby-anchor-coords` cross-repo change). `NearbyGroup` now carries `anchorLat`/`anchorLng` (shared-types 2.12.0) and `GET /groups/nearby` returns them; groups render as geo `<Marker>`s inside `MapView`. Mock pins are now geo-anchored (not x/y overlays).
3. ~~**Data wiring** (§8)~~ ✅ **done** (this session). `MOCK_PINS` replaced with `useNearbyGroups` + presence; selected-pin card joins/navigates via the new shared `useGroupJoinFlow` hook; radius bound to the shared `discoveryRadiusKm` preference (commit-on-release). See §8.

**Map data wiring is complete.** The only remaining Map item is M5 Maestro E2E (tracked in `localloop-shared/docs/testing-backlog.md`, not here).

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
                                 showsUserLocation + geo <Marker>s per group; themed (see §6)
      mapStyle.ts                darkMapStyle / lightMapStyle (palette-tuned Google JSON)
      MapPin.tsx                 pure marker visual (badge + icon + live dot + label),
                                 rendered as a <Marker>'s custom child by MapCanvas (§7)
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

## 7. Step 2 — Real markers ✅ DONE

✅ **Done in Step 1:** the **radius ring** is a geo `<Circle radius={radiusKm*1000}>` in MapCanvas, and **"you are here"** uses `showsUserLocation`.

✅ **Done now** (`feat/nearby-anchor-coords`): groups render as real geo `<Marker coordinate={{latitude: anchorLat, longitude: anchorLng}}>` **inside** `MapView` (moved from layout overlays into `MapCanvas`). Each marker's custom child is the `MapPin` visual; `MapPin` is now a pure view (the `TouchableOpacity` + `x`/`y` positioning were removed — `testID`/`onPress`/`zIndex` live on the `<Marker>`). Selection/dim/label behavior carries over (`selectedId` + `filter` are passed into `MapCanvas`). `MapPinData` dropped `x`/`y`; `MOCK_PINS` now hold real Curitiba-area `anchorLat`/`anchorLng`.

### ✅ RESOLVED — group coordinates are now in the API
The cross-repo blocker is closed:
- `localloop-shared/packages/shared-types`: `NearbyGroup` now has required `anchorLat`/`anchorLng` (bumped **2.11.0 → 2.12.0**).
- `localloop-api`: `GET /groups/nearby` (`DiscoverNearbyGroupsUseCase`) includes `anchorLat`/`anchorLng` (already-stored `anchor_lat`/`anchor_lng` columns — no migration). Sanctioned by architecture.md "Location privacy" (public anchor, no user coords).
- `localloop-mobile`: consumed for the `<Marker>`s above.

> Cross-repo ordering: shared-types 2.12.0 must publish before api/mobile lockfiles can be regenerated (`npm install`) and their CI goes green — see each PR.

---

## 8. Step 3 — Data wiring ✅ DONE

Shipped this session (mirrors HomeScreen):

- **Live pins** — `MOCK_PINS` deleted; [MapScreen/index.tsx](src/presentation/screens/MapScreen/index.tsx) now calls `useNearbyGroups(coords, discoveryRadiusKm)` and feeds `effectiveGroups` (merged with presence) into the layout. Query auto-disabled while `coords == null` (permission denied → no pins, map keeps its fallback center; the layout has no error banner, so no extra denied UI was added).
- **Presence** — `useGroupListRealtime({ presenceGroupIds, enabled: isFocused })`; `presenceGroupIds` derived via the shared `canShowPresence` so counts never leak for closed non-member groups. Live counts merged with `withLiveCount`.
- **Join/navigate** — the join logic was **extracted** from HomeScreen into a shared hook `useGroupJoinFlow({ groups, navigation })` ([src/application/hooks/useGroupJoinFlow/](src/application/hooks/useGroupJoinFlow/)), now consumed by **both** Home and Map. Returns `{ effectiveGroups, handlePressGroup }`; `onPressGroup={handlePressGroup}` (TODO removed). Navigation is **passed in** (not `useNavigation()`) to keep the application-layer hook free of a presentation dependency and HomeScreen's existing tests green.
- **Shared presence helpers** — `canShowPresence` / `withLiveCount` moved to [src/shared/groups/presence.ts](src/shared/groups/presence.ts) (was inline in HomeScreen).
- **Radius** — bound to `usePreferencesStore.discoveryRadiusKm` (shared with Home + Profile). `MapRadiusControl` switched from continuous `onChange` to **`onCommit`** (commit-on-release) so dragging doesn't write to SecureStore / refetch on every pan tick (`MapLayoutProps.onChangeRadius` → `onCommitRadius`). Note: the Map now opens at the shared 25 km default instead of the old 0.5 km.

Out of scope (left as-is): search-box pin filtering (still a non-filtering controlled input), a dedicated location-denied banner.

Tests: added `useGroupJoinFlow.test.ts`, `presence.test.ts`, and a `MapScreen/index.test.tsx` container test; updated `MapLayout.test.tsx` (`onChangeRadius` → `onCommitRadius`). Full suite **78 suites / 612 green**, `tsc` clean.

---

## 9. Reuse — don't break these

Shared pieces this branch introduced/consolidated; keep them intact:
- `src/application/hooks/useGroupJoinFlow/` — discovery group tap → join/navigate flow (used by Home **and** Map). Takes `{ groups, navigation }`, returns `{ effectiveGroups, handlePressGroup }`.
- `src/shared/groups/presence.ts` — `canShowPresence` + `withLiveCount` (used by Home **and** Map).
- `src/shared/ui/radius/` — `useRadiusSlider` (used by **3 screens**: CreateGroup, Profile, Map), `RadiusMapPreview` (CreateGroup preview), `radiusGeometry`.
- `src/shared/ui/nearbyGroup/` — `NearbyGroupRow` + `GroupStatusBadge` (used by Home **and** Map).
- `src/shared/ui/FilterChip.tsx` — `hideLabel` + `iconColor` props (used by Map, Inbox, MyGroups, GroupMembers).

---

## 10. Tests to update

- The `react-native-maps` jest mock is already in `jest.setup.ts` (see §5). The `Marker` stub spreads props onto a `View`, so `map-pin-*` `testID` + `onPress` still resolve after the move into `MapView`.
- `MapLayout.test.tsx` asserts `map-pin-*` testIDs + the selected-pin card; fixtures now carry `anchorLat`/`anchorLng` (no more `x`/`y`). Assertions unchanged.
- Keep the full suite green: `npx jest` (**75 suites / 598 tests** passing after this change; `npx tsc --noEmit` clean).

---

## 11. Open decisions

1. ~~Map provider~~ → **react-native-maps** ✅
2. **Google Maps API key** provisioning → wiring done (env-injected); **user still needs to provision + restrict the Android key** (see §6 callout).
3. ~~Dark map style~~ → **custom palette style following `useTheme()`** ✅
4. ~~**API change** to add group coordinates to `NearbyGroup` (needed for real markers)~~ → ✅ **done** on `feat/nearby-anchor-coords` (shared-types 2.12.0 + `GET /groups/nearby` + mobile markers). §7 unblocked.

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

# Handoff — Map provider integration (then data wiring)

> For the next agent session. **Continue on the existing branch `feat/map-screen-m6`** (PR #36) — do **not** create a new branch. This doc lives in the branch working tree; it's currently untracked (not committed) — delete or commit as you prefer.

---

## 1. Where we are

The **M6 "territory" Map screen** layout is built and merged into this branch (HOME-12). It currently renders over a **placeholder** map background with **static mock pins** and **no data wiring**. Two things remain, in order:

1. **Map provider integration** (this next session) — replace the placeholder backdrop with a real, interactive map.
2. **Data wiring** (later) — replace mock pins with live nearby-groups + presence, and wire join/navigate.

Everything shipped so far is documented in PR #36 and the plan at `~/.claude/plans/fetch-this-design-file-scalable-kitten.md`.

---

## 2. Branch / workflow rules (important)

- **Stay on `feat/map-screen-m6`.** Commit + push to update PR #36.
- **Bash**: this repo's root agent guide forbids compound commands — run each command (`cd`, `git add`, `git commit`) as a **separate** Bash call. The shell cwd sometimes resets to the repo root (`/Users/5by5andrey-viktor/side-prj/local-loop`), so `cd` into `localloop-mobile` as its own call before running `npx ...`.
- **No `typecheck`/`lint` npm scripts and no ESLint config exist.** Quality gates are: `npx tsc --noEmit` and `npx jest`. Keep both green.
- **Screen pattern** (mandatory): container `index.tsx` holds state/hooks; `layout/` is pure (no hooks/store reads); components under `layout/components/`.
- Prefer absolute imports (`@/...`); when moving a file, update callers in the same diff (no re-export shims).

---

## 3. THE SEAM — where the real map mounts

In [src/presentation/screens/MapScreen/layout/index.tsx](src/presentation/screens/MapScreen/layout/index.tsx), the backdrop is:

```tsx
<RadiusMapPreview variant="fill" showBadge={false} showOverlay={false} radiusKm={radiusKm} />
<MapRadiusRing radiusKm={radiusKm} />
<MapUserLocation />
```

- **Replace `RadiusMapPreview variant="fill"` with the real map component.** That single element is the placeholder backdrop.
- `RadiusMapPreview` itself stays in the codebase — CreateGroup still uses its `variant="preview"` small radius preview. Only the Map's full-screen usage is replaced.
- `MapRadiusRing` and `MapUserLocation` are **placeholder overlays** (screen-centered SVG ring + animated dot). Once the real map is in, replace them with the map library's geo primitives (see §6).

---

## 4. Current Map screen structure

```
src/presentation/screens/MapScreen/
  index.tsx                      container: filter/selectedId/radiusKm/search state,
                                 useSafeAreaInsets, MOCK_PINS (NearbyGroup-shaped),
                                 rail nav (Create/MyGroups), onPressGroup = TODO(wire)
  types.ts                       MapPinData = NearbyGroupRowData & { x; y } ; AnchorFilter
  layout/
    index.tsx                    pure MapLayout (composes everything)
    styles.ts                    positioning (topStack/rail/cardWrap), root bg
    types.ts                     MapLayoutProps
    components/
      MapPin.tsx                 marker positioned by x/y FRACTIONS (0..1) — PLACEHOLDER
      MapCategoryChips.tsx       reuses shared FilterChip (icon-only categories)
      MapRadiusControl.tsx       inline radius slider (shared useRadiusSlider)
      MapActionRail.tsx          compass(recenter) / plus(create) / users(my groups)
      MapRadiusRing.tsx          PLACEHOLDER screen-centered dashed ring (grows by km)
      MapUserLocation.tsx        PLACEHOLDER animated "you are here" dot
    __tests__/MapLayout.test.tsx render test (pins, chip filter, selected card)
```

Static mock data: `MOCK_PINS` in `index.tsx` (9 pins). `x`/`y` are fractions of the viewport, NOT geo coords.

---

## 5. Environment facts (for picking/installing a provider)

- **Expo SDK ~55**, **React Native 0.83.2**. Dev-client / bare-ish: `ios/` and `android/` native folders exist, plus `eas.json`. **Not Expo Go** — adding a native map lib requires a `prebuild`/dev-client rebuild.
- Config: `app.json` holds `expo.plugins` (`["expo-secure-store","expo-notifications"]`); `app.config.js` spreads `app.json` and conditionally adds `android.googleServicesFile` (Firebase). Add any map config plugin to `app.json` plugins (it flows through `app.config.js`).
- Installed and reusable: `expo-location ~55.1.3`, `react-native-svg 15.15.3`, `react-native-gesture-handler ~2.30.0`, `react-native-safe-area-context ~5.6.2`, `expo-linear-gradient`.
- **No map library installed** (no react-native-maps, expo-maps, mapbox).
- **Jest**: `jest.setup.ts` mocks `react-native-svg` and `expo-linear-gradient` (render plain Views). **You must add a similar mock for whatever map lib you choose**, or the suite won't run in node.

---

## 6. Step 1 — Map provider integration

**Open decision for the user — pick a provider:**
- **`react-native-maps`** — mature; `<MapView>` + `<Marker>`/`<Circle>`/`<Polygon>`; Google on Android (needs a **Google Maps API key**), Apple on iOS. Config plugin + native rebuild.
- **`expo-maps`** — Expo's first-party maps (SDK 52+); `GoogleMaps`/`AppleMaps` views; config-plugin; also needs a dev build. Newer/less battle-tested; API still maturing.

Recommended default: **react-native-maps** (richest overlay primitives — `<Circle>` for the radius, `<Marker>` for pins). Confirm with the user; also confirm **dark map styling** to match the palette (bg `#0A0A0D`-ish, surface `#15151B`, cyan accent `#00D9FF`) and **API key provisioning**.

Tasks:
1. Install the lib; add its config plugin to `app.json` plugins (+ Google Maps API keys for Android/iOS as needed).
2. `npx expo prebuild` (or rebuild the dev client) — this touches `ios/`/`android/`.
3. Add a `jest.mock(...)` for the map lib in `jest.setup.ts` (mirror the svg mock — return plain Views for `MapView`/`Marker`/`Circle`).
4. Replace the backdrop seam (§3) with `<MapView>`, full-bleed. Center the camera on the user's location (`useCurrentLocation()` already exists at `src/application/hooks/useCurrentLocation/`). Apply the dark style.

---

## 7. Step 2 — Reconcile overlays with real map coordinates

Once the map renders, the placeholder overlays should become map-anchored:
- **Pins** — `MapPin`'s `x`/`y` fraction positioning becomes obsolete. Render groups as the map lib's `<Marker coordinate={{latitude, longitude}}>`, ideally reusing the `MapPin` marker visual as the marker's custom child. Selection/dim/label behavior carries over.
- **Radius ring** — replace `MapRadiusRing` (placeholder px scale) with the map's geo circle, e.g. `<Circle center={userCoords} radius={radiusKm * 1000} />` (metres). This is the correct, zoom-accurate behavior the user asked for (ring belongs to the map, not the screen).
- **"You are here"** — use the map's `showsUserLocation` or a marker at `userCoords`; drop/restyle `MapUserLocation`.

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

- `MapLayout.test.tsx` asserts `map-pin-*` testIDs + the selected-pin card. When pins become real `<Marker>`s, update those assertions and add the map-lib jest mock first.
- Keep the full suite green: `npx jest` (currently 70 suites / 560 tests passing).

---

## 11. Open decisions to confirm with the user (before coding)

1. **Map provider**: react-native-maps vs expo-maps.
2. **Google Maps API key** provisioning (+ Android/iOS config).
3. **Dark map style** to match the app palette.
4. **API change** to add group coordinates to `NearbyGroup` (needed for real markers) — do it now, or keep placeholder positions during integration?

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

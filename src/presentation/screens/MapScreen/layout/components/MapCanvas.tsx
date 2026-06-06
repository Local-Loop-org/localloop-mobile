import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, {
  Circle,
  PROVIDER_GOOGLE,
  type Region,
} from 'react-native-maps';
import type { Coords } from '@/application/hooks/useCurrentLocation/useCurrentLocation';
import { useTheme } from '@/shared/theme/useTheme';
import { darkMapStyle, lightMapStyle } from './mapStyle';

interface MapCanvasProps {
  /** Device location; `null` until the permission/fetch resolves. */
  userCoords: Coords | null;
  /** Discovery radius in km — drawn as a geo circle and used to frame the camera. */
  radiusKm: number;
  /** Bumped by the container's recenter (compass) action to re-frame on the user. */
  recenterTick: number;
}

const KM_PER_DEG_LAT = 111;

/**
 * Fallback camera until the user's location resolves — central Curitiba, where
 * the mock discovery data is anchored. Replaced the moment `userCoords` arrives.
 */
const FALLBACK_COORDS: Coords = { lat: -25.4284, lng: -49.2733 };

/** A region centered on `coords` framed to comfortably contain the radius circle. */
function regionFor({ lat, lng }: Coords, radiusKm: number): Region {
  // 2.6× the diameter leaves margin around the ring at any radius.
  const latitudeDelta = Math.max(0.01, (radiusKm * 2.6) / KM_PER_DEG_LAT);
  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta,
    longitudeDelta: latitudeDelta,
  };
}

/**
 * The real interactive basemap (react-native-maps) that replaces the M6
 * placeholder backdrop. Google on Android (styled via `customMapStyle`), Apple
 * on iOS (styled via `userInterfaceStyle`) — both follow the app theme. Draws
 * the discovery radius as a geo `Circle` and shows the native "you are here" dot.
 *
 * Leaf component: reads `useTheme()` directly (no static palette exists).
 * TODO(wire): group markers wait on anchor coords in `NearbyGroup` — see
 * MAP_INTEGRATION_HANDOFF.md §7. Until then the screen's pins stay as overlays.
 */
export function MapCanvas({ userCoords, radiusKm, recenterTick }: MapCanvasProps) {
  const { colors, mode } = useTheme();
  const mapRef = useRef<MapView>(null);
  const initialRegion = useRef(
    regionFor(userCoords ?? FALLBACK_COORDS, radiusKm),
  ).current;

  // Center on the user once their coords resolve (they arrive asynchronously).
  const centeredRef = useRef(false);
  useEffect(() => {
    if (!userCoords || centeredRef.current) return;
    centeredRef.current = true;
    mapRef.current?.animateToRegion(regionFor(userCoords, radiusKm), 600);
  }, [userCoords, radiusKm]);

  // Recenter (compass) — re-frame on the user; ignore the initial mount value.
  const lastTickRef = useRef(recenterTick);
  useEffect(() => {
    if (recenterTick === lastTickRef.current) return;
    lastTickRef.current = recenterTick;
    if (userCoords) {
      mapRef.current?.animateToRegion(regionFor(userCoords, radiusKm), 400);
    }
  }, [recenterTick, userCoords, radiusKm]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={initialRegion}
      customMapStyle={mode === 'dark' ? darkMapStyle : lightMapStyle}
      userInterfaceStyle={mode}
      showsUserLocation={!!userCoords}
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
      showsPointsOfInterests={false}
      rotateEnabled={false}
      pitchEnabled={false}
    >
      {userCoords ? (
        <Circle
          center={{ latitude: userCoords.lat, longitude: userCoords.lng }}
          radius={radiusKm * 1000}
          strokeColor={colors.primary}
          strokeWidth={2}
          fillColor={colors.duotoneSoftFrom}
        />
      ) : null}
    </MapView>
  );
}

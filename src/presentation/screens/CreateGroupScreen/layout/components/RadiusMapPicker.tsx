import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import type { Coords } from '@/application/hooks/useCurrentLocation/useCurrentLocation';
import { Icon } from '@/shared/icons';
import { fonts, type ThemeColors } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import {
  FALLBACK_COORDS,
  KM_PER_DEG_LAT,
  darkMapStyle,
  lightMapStyle,
  regionFor,
} from '@/shared/map';
import { formatRadiusKm } from '@/shared/ui/radius';

const MAP_WIDTH = 327;
const MAP_HEIGHT = 220;

interface RadiusMapPickerProps {
  /** Active radius in km — frames the camera and sizes the ring overlay. */
  radiusKm: number;
  /** Current anchor (group center). `null` until device location resolves. */
  anchor: Coords | null;
  /**
   * When `false` the map is a locked visual: no pan/zoom, no anchor updates,
   * no scroll-lock handshake (used by GroupDetail to show a group's fixed
   * anchor + radius). Defaults to `true` (the CreateGroup picker).
   */
  interactive?: boolean;
  /** Fires with the map center when a pan/zoom settles (interactive only). */
  onAnchorChange?: (coords: Coords) => void;
  /** Touch began on the map — parent should lock its ScrollView. */
  onInteractStart?: () => void;
  /** Touch ended/cancelled — parent should unlock its ScrollView. */
  onInteractEnd?: () => void;
}

/**
 * Embedded interactive basemap acting as the group's anchor picker.
 *
 * Pattern: a *fixed center pin* (screen-space overlay) while the map pans
 * underneath; the anchor is read from the map center on each settle. A
 * screen-space ring overlay (not a geo `Circle`) is glued under the pin and
 * sized from the current zoom, so it never drifts during a pan. The camera
 * reframes when the radius changes so the ring stays comfortably in view.
 *
 * Gesture handling: the wrapping `View` reports touch start/end so the parent
 * CreateGroup `ScrollView` can lock while the user manipulates the map (the
 * core risk we are evaluating at this 327x170 size).
 */
export function RadiusMapPicker({
  radiusKm,
  anchor,
  interactive = true,
  onAnchorChange,
  onInteractStart,
  onInteractEnd,
}: RadiusMapPickerProps) {
  const styles = useThemedStyles(createStyles);
  const { colors, mode } = useTheme();
  const mapRef = useRef<MapView>(null);

  // One-way latch: flips true on the first genuine touch on the map. Region
  // changes are only reported as anchor picks once this is set, so the initial
  // fallback/GPS-centering regions (which fire without any user touch) are never
  // mistaken for an explicit choice.
  const hasInteractedRef = useRef(false);

  const initialRegion = useRef(
    regionFor(anchor ?? FALLBACK_COORDS, radiusKm),
  ).current;
  const [latitudeDelta, setLatitudeDelta] = useState(
    initialRegion.latitudeDelta,
  );
  const [mapHeightPx, setMapHeightPx] = useState(MAP_HEIGHT);

  // Center on the device location once it resolves (arrives asynchronously).
  const centeredRef = useRef(false);
  useEffect(() => {
    if (!anchor || centeredRef.current) return;
    centeredRef.current = true;
    mapRef.current?.animateToRegion(regionFor(anchor, radiusKm), 500);
  }, [anchor, radiusKm]);

  // Reframe to keep the ring in view as the radius changes (slider drag).
  const lastRadiusRef = useRef(radiusKm);
  useEffect(() => {
    if (radiusKm === lastRadiusRef.current || !anchor) return;
    lastRadiusRef.current = radiusKm;
    mapRef.current?.animateToRegion(regionFor(anchor, radiusKm), 220);
  }, [radiusKm, anchor]);

  const onLayout = (e: LayoutChangeEvent) => {
    setMapHeightPx(e.nativeEvent.layout.height);
  };

  const handleTouchStart = () => {
    hasInteractedRef.current = true;
    onInteractStart?.();
  };

  const handleRegionChangeComplete = (region: Region) => {
    setLatitudeDelta(region.latitudeDelta);
    // Only a region change that follows a real user touch counts as a pick —
    // never the initial fallback region or the programmatic GPS recenter.
    if (interactive && hasInteractedRef.current) {
      onAnchorChange?.({ lat: region.latitude, lng: region.longitude });
    }
  };

  // Screen-space ring radius for the current zoom, clamped so it never clips.
  const viewportKm = latitudeDelta * KM_PER_DEG_LAT;
  const pxPerKm = viewportKm > 0 ? mapHeightPx / viewportKm : 0;
  const ringRadiusPx = Math.min(radiusKm * pxPerKm, mapHeightPx / 2 - 6);

  return (
    <View
      testID="radius-map-frame"
      style={styles.frame}
      onTouchStart={interactive ? handleTouchStart : undefined}
      onTouchEnd={interactive ? onInteractEnd : undefined}
      onTouchCancel={interactive ? onInteractEnd : undefined}
    >
      <MapView
        ref={mapRef}
        testID="radius-map"
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        onLayout={onLayout}
        onRegionChangeComplete={handleRegionChangeComplete}
        customMapStyle={mode === 'dark' ? darkMapStyle : lightMapStyle}
        userInterfaceStyle={mode}
        showsUserLocation={interactive}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        showsPointsOfInterests={false}
        rotateEnabled={false}
        pitchEnabled={false}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
      />

      {/* Fixed center pin + ring, glued to the card center, never intercept touches. */}
      <View style={styles.overlay} pointerEvents="none">
        {ringRadiusPx > 0 ? (
          <View
            style={[
              styles.ring,
              {
                width: ringRadiusPx * 2,
                height: ringRadiusPx * 2,
                borderRadius: ringRadiusPx,
              },
            ]}
          />
        ) : null}
        <View style={styles.pinBadge}>
          <Icon name="pin" size={14} color={colors.background} strokeWidth={2.2} />
        </View>
        <View style={styles.pinDot} />
      </View>

      <View style={styles.badge} testID="radius-badge">
        <Icon name="radar" size={11} color={colors.primary} strokeWidth={2.2} />
        <Text style={styles.badgeText}>
          {formatRadiusKm(radiusKm).toUpperCase()}
        </Text>
      </View>

      {interactive ? (
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>ARRASTE O MAPA PARA POSICIONAR</Text>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    frame: {
      width: '100%',
      aspectRatio: MAP_WIDTH / MAP_HEIGHT,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: colors.surface2,
      borderColor: colors.line,
      borderWidth: 1,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ring: {
      position: 'absolute',
      borderWidth: 1.6,
      borderColor: colors.primary,
      backgroundColor: colors.duotoneSoftFrom,
    },
    pinBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.background,
      // Lift the badge so its base sits on the precise center dot.
      marginBottom: 22,
    },
    pinDot: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.secondary,
      borderWidth: 1.5,
      borderColor: colors.background,
    },
    badge: {
      position: 'absolute',
      top: 10,
      left: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: colors.surfaceOverlay,
      borderColor: colors.primary,
      borderWidth: 1,
    },
    badgeText: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 0.6,
    },
    hint: {
      position: 'absolute',
      bottom: 8,
      alignSelf: 'center',
      paddingVertical: 3,
      paddingHorizontal: 9,
      borderRadius: 999,
      backgroundColor: colors.surfaceOverlay,
    },
    hintText: {
      fontFamily: fonts.mono,
      fontSize: 9,
      fontWeight: '700',
      color: colors.faint,
      letterSpacing: 0.6,
    },
  });

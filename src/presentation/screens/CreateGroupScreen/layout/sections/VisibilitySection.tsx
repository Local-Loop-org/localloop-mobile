import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Coords } from '@/application/hooks/useCurrentLocation/useCurrentLocation';
import { Card } from '../atoms/Card';
import { SectionLabel } from '../atoms/SectionLabel';
import { RadiusMapPicker } from '../components/RadiusMapPicker';
import { RadiusSlider } from '../components/RadiusSlider';

interface VisibilitySectionProps {
  radiusKm: number;
  /** Map center: device/picked location on CreateGroup, group anchor on GroupDetail. */
  anchorCoords?: Coords | null;
  onChange?: (value: number) => void;
  /** When true, render a read-only view (no slider; map locked). */
  readOnly?: boolean;
  /**
   * Provided only by the interactive CreateGroup flow. When present (and not
   * read-only) the embedded map becomes a pannable anchor picker; otherwise the
   * map is a locked visual of `anchorCoords` + radius.
   */
  onAnchorCoordsChange?: (coords: Coords) => void;
  onMapInteractStart?: () => void;
  onMapInteractEnd?: () => void;
}

export function VisibilitySection({
  radiusKm,
  anchorCoords = null,
  onChange,
  readOnly,
  onAnchorCoordsChange,
  onMapInteractStart,
  onMapInteractEnd,
}: VisibilitySectionProps) {
  const interactive = !readOnly && !!onAnchorCoordsChange;

  return (
    <View>
      <SectionLabel label="VISIBILIDADE" hint="ONDE O GRUPO APARECE" />
      <Card style={styles.body}>
        <RadiusMapPicker
          radiusKm={radiusKm}
          anchor={anchorCoords}
          interactive={interactive}
          onAnchorChange={onAnchorCoordsChange}
          onInteractStart={onMapInteractStart}
          onInteractEnd={onMapInteractEnd}
        />
        {!readOnly && onChange ? (
          <>
            <View style={styles.gap} />
            <RadiusSlider value={radiusKm} onChange={onChange} />
          </>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: 12,
  },
  gap: {
    height: 14,
  },
});

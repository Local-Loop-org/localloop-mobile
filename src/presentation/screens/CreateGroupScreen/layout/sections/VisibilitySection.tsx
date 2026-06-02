import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '../atoms/Card';
import { SectionLabel } from '../atoms/SectionLabel';
import { RadiusMapPreview } from '@/shared/ui/radius';
import { RadiusSlider } from '../components/RadiusSlider';

interface VisibilitySectionProps {
  radiusKm: number;
  onChange?: (value: number) => void;
  /** When true, render only the map preview (no slider, no ticks). */
  readOnly?: boolean;
}

export function VisibilitySection({
  radiusKm,
  onChange,
  readOnly,
}: VisibilitySectionProps) {
  return (
    <View>
      <SectionLabel label="VISIBILIDADE" hint="ONDE O GRUPO APARECE" />
      <Card style={styles.body}>
        <RadiusMapPreview radiusKm={radiusKm} />
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

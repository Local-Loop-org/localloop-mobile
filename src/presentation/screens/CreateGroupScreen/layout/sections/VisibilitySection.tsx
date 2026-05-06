import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '../atoms/Card';
import { SectionLabel } from '../atoms/SectionLabel';
import { RadiusMapPreview } from '../components/RadiusMapPreview';
import { RadiusSlider } from '../components/RadiusSlider';

interface VisibilitySectionProps {
  radiusKm: number;
  onChange: (value: number) => void;
}

export function VisibilitySection({ radiusKm, onChange }: VisibilitySectionProps) {
  return (
    <View>
      <SectionLabel label="VISIBILIDADE" hint="ONDE O GRUPO APARECE" />
      <Card style={styles.body}>
        <RadiusMapPreview radiusKm={radiusKm} />
        <View style={styles.gap} />
        <RadiusSlider value={radiusKm} onChange={onChange} />
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

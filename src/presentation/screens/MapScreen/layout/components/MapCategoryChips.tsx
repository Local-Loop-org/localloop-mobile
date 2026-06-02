import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { AnchorType } from '@localloop/shared-types';
import { FilterChip, type ChipSpec } from '@/shared/ui/FilterChip';
import { spacing } from '@/shared/theme';
import type { AnchorFilter, MapPinData } from '../../types';

interface MapCategoryChipsProps {
  pins: MapPinData[];
  filter: AnchorFilter;
  onChange: (filter: AnchorFilter) => void;
}

const CATEGORIES: ReadonlyArray<{
  id: AnchorType;
  label: string;
  icon: ChipSpec<AnchorFilter>['icon'];
}> = [
  { id: AnchorType.NEIGHBORHOOD, label: 'Bairros', icon: 'leaf' },
  { id: AnchorType.ESTABLISHMENT, label: 'Lugares', icon: 'coffee' },
  { id: AnchorType.CONDO, label: 'Prédios', icon: 'building' },
  { id: AnchorType.EVENT, label: 'Eventos', icon: 'calendar' },
];

export function MapCategoryChips({ pins, filter, onChange }: MapCategoryChipsProps) {
  const countFor = (id: AnchorType) =>
    pins.filter((p) => p.anchorType === id).length;

  const specs: ChipSpec<AnchorFilter>[] = [
    { id: 'all', label: 'Todos', count: pins.length },
    ...CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      icon: c.icon,
      count: countFor(c.id),
    })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {specs.map((spec) => (
        <FilterChip
          key={spec.id}
          spec={spec}
          active={filter === spec.id}
          onPress={onChange}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
});

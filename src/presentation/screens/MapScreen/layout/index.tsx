import React from 'react';
import { View } from 'react-native';
import { SearchInput } from '@/shared/ui/SearchInput';
import { RadiusMapPreview } from '@/shared/ui/radius';
import { NearbyGroupRow } from '@/shared/ui/nearbyGroup';
import { MapPin } from './components/MapPin';
import { MapRadiusRing } from './components/MapRadiusRing';
import { MapUserLocation } from './components/MapUserLocation';
import { MapCategoryChips } from './components/MapCategoryChips';
import { MapRadiusControl } from './components/MapRadiusControl';
import { MapActionRail } from './components/MapActionRail';
import { CARD_BOTTOM_OFFSET, RAIL_TOP_OFFSET, styles } from './styles';
import type { MapLayoutProps } from './types';

export default function MapLayout({
  pins,
  filter,
  selectedId,
  radiusKm,
  search,
  topInset,
  bottomInset,
  onChangeFilter,
  onSelectPin,
  onChangeRadius,
  onChangeSearch,
  onRecenter,
  onCreate,
  onMyGroups,
  onPressGroup,
}: MapLayoutProps) {
  const selectedPin = pins.find((p) => p.id === selectedId) ?? null;
  const isFiltered = filter !== 'all';

  return (
    <View style={styles.root}>
      {/* Placeholder map backdrop (grid/streets). Replace with a real map
          provider when one is wired in. Its own ring/dot are off — the Map
          renders correctly-sized, animated overlays instead. */}
      <RadiusMapPreview
        variant="fill"
        showBadge={false}
        showOverlay={false}
        radiusKm={radiusKm}
      />
      <MapRadiusRing radiusKm={radiusKm} />
      <MapUserLocation />

      {pins.map((pin) => (
        <MapPin
          key={pin.id}
          pin={pin}
          selected={pin.id === selectedId}
          dimmed={isFiltered && pin.anchorType !== filter}
          withLabel={isFiltered}
          onSelect={onSelectPin}
        />
      ))}

      <View style={[styles.topStack, { top: topInset }]}>
        <SearchInput
          value={search}
          onChange={onChangeSearch}
          placeholder="Buscar grupo, lugar ou bairro…"
        />
        <MapCategoryChips pins={pins} filter={filter} onChange={onChangeFilter} />
        <View style={styles.radiusRow}>
          <MapRadiusControl value={radiusKm} onChange={onChangeRadius} />
        </View>
      </View>

      <View style={[styles.rail, { top: topInset + RAIL_TOP_OFFSET }]}>
        <MapActionRail
          onRecenter={onRecenter}
          onCreate={onCreate}
          onMyGroups={onMyGroups}
        />
      </View>

      {selectedPin ? (
        <View
          style={[styles.cardWrap, { bottom: bottomInset + CARD_BOTTOM_OFFSET }]}
        >
          <NearbyGroupRow
            group={selectedPin}
            onPress={(id) => onPressGroup?.(id)}
          />
        </View>
      ) : null}
    </View>
  );
}

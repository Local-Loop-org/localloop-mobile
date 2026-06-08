import React from 'react';
import { View } from 'react-native';
import { SearchInput } from '@/shared/ui/SearchInput';
import { NearbyGroupRow } from '@/shared/ui/nearbyGroup';
import { MapCanvas } from './components/MapCanvas';
import { MapCategoryChips } from './components/MapCategoryChips';
import { MapRadiusControl } from './components/MapRadiusControl';
import { MapActionRail } from './components/MapActionRail';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { CARD_BOTTOM_OFFSET, RAIL_TOP_OFFSET, createStyles } from './styles';
import type { MapLayoutProps } from './types';

export default function MapLayout({
  pins,
  filter,
  selectedId,
  radiusKm,
  search,
  topInset,
  bottomInset,
  userCoords,
  recenterTick,
  onChangeFilter,
  onSelectPin,
  onChangeRadius,
  onCommitRadius,
  onChangeSearch,
  onRecenter,
  onCreate,
  onMyGroups,
  onPressGroup,
}: MapLayoutProps) {
  const styles = useThemedStyles(createStyles);
  const selectedPin = pins.find((p) => p.id === selectedId) ?? null;

  return (
    <View style={styles.root}>
      {/* Real interactive basemap: themed map + geo radius circle + user dot +
          group markers positioned by their anchor coordinates. */}
      <MapCanvas
        userCoords={userCoords}
        radiusKm={radiusKm}
        recenterTick={recenterTick}
        pins={pins}
        selectedId={selectedId}
        filter={filter}
        onSelectPin={onSelectPin}
      />

      <View style={[styles.topStack, { top: topInset }]}>
        <SearchInput
          value={search}
          onChange={onChangeSearch}
          placeholder="Buscar grupo, lugar ou bairro…"
        />
        <MapCategoryChips pins={pins} filter={filter} onChange={onChangeFilter} />
        <View style={styles.radiusRow}>
          <MapRadiusControl
            value={radiusKm}
            onChange={onChangeRadius}
            onCommit={onCommitRadius}
          />
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

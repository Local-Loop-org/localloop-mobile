import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AnchorIconBadge } from '@/shared/icons';
import { formatDistance } from '@/shared/format/distance';
import type { HomeNearbyGroup } from '../types';
import { styles } from './styles';
import { StatusBadge } from './StatusBadge';

interface Props {
  group: HomeNearbyGroup;
  onPress: (id: string) => void;
}

export function DiscoverRow({ group, onPress }: Props) {
  const live = group.liveCount ?? 0;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress(group.id)}
      accessibilityRole='button'
      accessibilityLabel={`Abrir ${group.name}`}
    >
      <AnchorIconBadge
        anchorType={group.anchorType}
        size={40}
        iconSize={18}
        borderRadius={12}
      />
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {group.name}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {formatDistance(group.distanceMeters)} · {group.memberCount} MEM
          {live > 0 ? (
            <Text style={styles.rowLiveMeta}> · {live} Online</Text>
          ) : null}
        </Text>
      </View>
      <StatusBadge group={group} />
    </TouchableOpacity>
  );
}

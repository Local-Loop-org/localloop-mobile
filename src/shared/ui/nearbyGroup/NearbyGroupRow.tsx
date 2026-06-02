import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { NearbyGroup } from '@localloop/shared-types';
import { AnchorIconBadge } from '@/shared/icons';
import { formatDistance } from '@/shared/format/distance';
import { GroupStatusBadge } from './GroupStatusBadge';
import { styles } from './styles';

export type NearbyGroupRowData = NearbyGroup & { liveCount?: number };

interface Props {
  group: NearbyGroupRowData;
  onPress: (id: string) => void;
}

/** Horizontal nearby-group row: anchor badge + name + meta + status action. */
export function NearbyGroupRow({ group, onPress }: Props) {
  const live = group.liveCount ?? 0;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress(group.id)}
      accessibilityRole="button"
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
      <GroupStatusBadge group={group} />
    </TouchableOpacity>
  );
}

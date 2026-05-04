import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AnchorIconBadge } from '@/shared/icons';
import { formatDistance } from '@/shared/format/distance';
import type { NearbyGroup } from '@/infra/api/groups.api';
import { styles } from './styles';

interface Props {
  group: NearbyGroup;
  onPress: (id: string) => void;
}

export function DiscoverRow({ group, onPress }: Props) {
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
        </Text>
      </View>
      <View style={styles.cardJoinBtn}>
        <Text style={styles.cardJoinText}>Entrar</Text>
      </View>
    </TouchableOpacity>
  );
}

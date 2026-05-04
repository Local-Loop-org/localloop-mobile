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

export function DiscoverCard({ group, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(group.id)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${group.name}`}
    >
      <View style={styles.cardHeader}>
        <AnchorIconBadge
          anchorType={group.anchorType}
          size={36}
          iconSize={17}
          borderRadius={10}
        />
      </View>
      <Text style={styles.cardName} numberOfLines={1}>
        {group.name}
      </Text>
      <Text style={styles.cardAnchor} numberOfLines={1}>
        {group.anchorLabel}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {formatDistance(group.distanceMeters)} · {group.memberCount} MEM
        </Text>
        <View style={styles.cardJoinBtn}>
          <Text style={styles.cardJoinText}>Entrar</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

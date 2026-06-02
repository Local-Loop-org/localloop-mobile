import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AnchorIconBadge } from '@/shared/icons';
import { formatDistance } from '@/shared/format/distance';
import { GroupStatusBadge } from '@/shared/ui/nearbyGroup';
import type { HomeNearbyGroup } from '../types';
import { styles } from './styles';

interface Props {
  group: HomeNearbyGroup;
  onPress: (id: string) => void;
}

export function DiscoverCard({ group, onPress }: Props) {
  const live = group.liveCount ?? 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(group.id)}
      accessibilityRole='button'
      accessibilityLabel={`Abrir ${group.name}`}
    >
      <View style={styles.cardHeader}>
        <AnchorIconBadge
          anchorType={group.anchorType}
          size={36}
          iconSize={17}
          borderRadius={10}
        />
        {live > 0 ? (
          <View style={styles.cardLiveBadge}>
            <View style={styles.cardLiveDot} />
            <Text style={styles.cardLiveText}>{live}</Text>
          </View>
        ) : null}
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
        <GroupStatusBadge group={group} />
      </View>
    </TouchableOpacity>
  );
}

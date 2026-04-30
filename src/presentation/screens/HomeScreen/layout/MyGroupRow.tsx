import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MemberRole } from '@localloop/shared-types';
import { Icon } from '@/shared/icons';
import { anchorIconName } from '@/shared/icons/anchorIcon';
import { colors } from '@/shared/theme';
import type { MyGroup } from '@/infra/api/groups.api';
import { styles } from './styles';

const ROLE_LABELS: Partial<Record<MemberRole, string>> = {
  [MemberRole.OWNER]: 'DONO',
  [MemberRole.MODERATOR]: 'MOD',
};

interface Props {
  group: MyGroup;
  onPress: (id: string) => void;
}

export function MyGroupRow({ group, onPress }: Props) {
  const preview = group.lastMessage
    ? `${group.lastMessage.senderName}: ${group.lastMessage.content ?? '[mídia]'}`
    : `${group.memberCount} membros`;
  const roleLabel = ROLE_LABELS[group.myRole];

  return (
    <TouchableOpacity
      style={styles.myRow}
      onPress={() => onPress(group.id)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${group.name}`}
    >
      <View style={styles.myRowIconBox}>
        <Icon
          name={anchorIconName(group.anchorType)}
          size={18}
          color={colors.primary}
          strokeWidth={1.9}
        />
      </View>
      <View style={styles.myRowBody}>
        <Text style={styles.myRowName} numberOfLines={1}>
          {group.name}
        </Text>
        <Text style={styles.myRowPreview} numberOfLines={1}>
          {preview}
        </Text>
      </View>
      {roleLabel ? (
        <View style={styles.myRowBadge}>
          <Text style={styles.myRowBadgeText}>{roleLabel}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

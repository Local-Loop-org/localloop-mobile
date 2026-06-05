import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ThemeColors } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { Icon } from '@/shared/icons';

export interface BannedMember {
  userId: string;
  displayName: string;
}

interface BannedMemberRowProps {
  member: BannedMember;
  isLast: boolean;
  isUnbanning: boolean;
  onUnban: (userId: string) => void;
}

function initialsFrom(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export function BannedMemberRow({
  member,
  isLast,
  isUnbanning,
  onUnban,
}: BannedMemberRowProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View testID={`banned-row-${member.userId}`}>
      <View style={styles.row}>
        <View style={styles.avatar} testID={`banned-avatar-${member.userId}`}>
          <Text style={styles.avatarText}>{initialsFrom(member.displayName)}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {member.displayName}
          </Text>
        </View>
        <Pressable
          onPress={() => onUnban(member.userId)}
          disabled={isUnbanning}
          accessibilityRole="button"
          accessibilityState={{ disabled: isUnbanning }}
          testID={`banned-row-unban-${member.userId}`}
          style={({ pressed }) => [
            styles.unbanBtn,
            isUnbanning ? styles.unbanBtnDisabled : null,
            pressed && !isUnbanning ? styles.unbanBtnPressed : null,
          ]}
        >
          <Icon name="check" size={11} color={colors.success} strokeWidth={2.4} />
          <Text style={styles.unbanLabel}>Desbanir</Text>
        </Pressable>
      </View>
      {!isLast ? <View style={styles.divider} /> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.faint,
    letterSpacing: -0.4,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.dim,
    textDecorationLine: 'line-through',
    textDecorationColor: colors.faint,
    letterSpacing: -0.2,
  },
  unbanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'transparent',
  },
  unbanBtnDisabled: {
    opacity: 0.5,
  },
  unbanBtnPressed: {
    backgroundColor: colors.surface2,
  },
  unbanLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginLeft: 66,
    marginRight: 14,
  },
});

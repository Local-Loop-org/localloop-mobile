import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MemberRole } from '@localloop/shared-types';
import type { ThemeColors } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { GroupMember } from '@/infra/api/groups.api';
import { Icon } from '@/shared/icons';
import { MemberAvatar } from '../atoms/MemberAvatar';
import { RolePill, type RolePillRole } from '../atoms/RolePill';

export interface MemberRowProps {
  member: GroupMember;
  isLast: boolean;
  canManage: boolean;
  /** Caller's role — controls which actions appear in the drawer. */
  viewerRole?: MemberRole | null;
  onPress?: (member: GroupMember) => void;
  onBan?: (userId: string) => void;
  onPromote?: (userId: string) => void;
  onDemote?: (userId: string) => void;
}

export function MemberRow({
  member,
  isLast,
  canManage,
  viewerRole,
  onPress,
  onBan,
  onPromote,
  onDemote,
}: MemberRowProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const showActions = canManage && member.role !== MemberRole.OWNER;
  // Demote is owner-only (matches API auth) and only applies to moderator rows.
  const canDemoteThisMember =
    viewerRole === MemberRole.OWNER && member.role === MemberRole.MODERATOR;

  const mainContent = (
    <>
      <MemberAvatar
        displayName={member.displayName}
        avatarUrl={member.avatarUrl}
        size={36}
      />
      <View style={styles.rowBody}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {member.displayName}
          </Text>
          {member.role !== MemberRole.MEMBER ? (
            <RolePill role={member.role as RolePillRole} />
          ) : null}
        </View>
      </View>
    </>
  );

  return (
    <View testID={`members-section-row-${member.userId}`}>
      <View style={styles.row}>
        {onPress ? (
          <Pressable
            style={styles.rowMain}
            onPress={() => onPress(member)}
            accessibilityRole="button"
            accessibilityLabel={`Abrir conversa com ${member.displayName}`}
            testID={`members-section-open-${member.userId}`}
            hitSlop={4}
          >
            {mainContent}
          </Pressable>
        ) : (
          <View style={styles.rowMain}>{mainContent}</View>
        )}
        {showActions ? (
          <Pressable
            onPress={() => setExpanded((o) => !o)}
            style={styles.actionBtn}
            accessibilityRole="button"
            hitSlop={8}
            testID={`members-section-action-${member.userId}`}
          >
            <Icon
              name={expanded ? 'x' : 'more'}
              size={15}
              color={colors.dim}
              strokeWidth={2}
            />
          </Pressable>
        ) : null}
      </View>
      {expanded ? (
        <View style={styles.drawer}>
          {member.role === MemberRole.MEMBER ? (
            <Pressable
              style={styles.drawerNeutralBtn}
              onPress={() => {
                onPromote?.(member.userId);
                setExpanded(false);
              }}
              accessibilityRole="button"
              testID={`members-section-promote-${member.userId}`}
            >
              <Icon
                name="shield"
                size={12}
                color={colors.primary}
                strokeWidth={2}
              />
              <Text style={styles.drawerNeutralText}>Promover</Text>
            </Pressable>
          ) : null}
          {canDemoteThisMember ? (
            <Pressable
              style={styles.drawerNeutralBtn}
              onPress={() => {
                onDemote?.(member.userId);
                setExpanded(false);
              }}
              accessibilityRole="button"
              testID={`members-section-demote-${member.userId}`}
            >
              <Icon
                name="check"
                size={12}
                color={colors.dim}
                strokeWidth={2}
              />
              <Text style={styles.drawerNeutralText}>Rebaixar</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={styles.drawerBanBtn}
            onPress={() => {
              onBan?.(member.userId);
              setExpanded(false);
            }}
            accessibilityRole="button"
            testID={`members-section-ban-${member.userId}`}
          >
            <Icon name="x" size={12} color={colors.error} strokeWidth={2.4} />
            <Text style={styles.drawerBanText}>Banir</Text>
          </Pressable>
        </View>
      ) : null}
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
    paddingVertical: 11,
    gap: 8,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawer: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
    flexDirection: 'row',
    gap: 6,
  },
  drawerNeutralBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  drawerNeutralText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  drawerBanBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  drawerBanText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginLeft: 62,
    marginRight: 14,
  },
});

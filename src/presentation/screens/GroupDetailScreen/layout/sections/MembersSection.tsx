import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MemberRole } from '@localloop/shared-types';
import { colors, fonts } from '@/shared/theme';
import type { GroupMember } from '@/infra/api/groups.api';
import { Icon } from '@/shared/icons';
import { Card } from '@/presentation/screens/CreateGroupScreen/layout/atoms/Card';
import { SectionLabel } from '@/presentation/screens/CreateGroupScreen/layout/atoms/SectionLabel';
import { MemberAvatar } from '../atoms/MemberAvatar';
import { RolePill, type RolePillRole } from '../atoms/RolePill';

interface MembersSectionProps {
  memberCount: number;
  members: GroupMember[];
  myRole: MemberRole | null;
  onPressViewAll: () => void;
  onBanMember?: (userId: string) => void;
  onPromoteMember?: (userId: string) => void;
}

interface MemberRowProps {
  member: GroupMember;
  isLast: boolean;
  canManage: boolean;
  onBan?: (userId: string) => void;
  onPromote?: (userId: string) => void;
}

function MemberRow({ member, isLast, canManage, onBan, onPromote }: MemberRowProps) {
  const [expanded, setExpanded] = useState(false);
  const showActions = canManage && member.role !== MemberRole.OWNER;

  return (
    <View testID={`members-section-row-${member.userId}`}>
      <View style={styles.row}>
        <MemberAvatar displayName={member.displayName} avatarUrl={member.avatarUrl} size={36} />
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
        {showActions ? (
          <Pressable
            onPress={() => setExpanded((o) => !o)}
            style={styles.actionBtn}
            accessibilityRole="button"
            hitSlop={8}
            testID={`members-section-action-${member.userId}`}
          >
            <Icon name="more" size={15} color={colors.dim} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>
      {expanded ? (
        <View style={styles.drawer}>
          {member.role === MemberRole.MEMBER ? (
            <Pressable
              style={styles.drawerPromoteBtn}
              onPress={() => {
                onPromote?.(member.userId);
                setExpanded(false);
              }}
              accessibilityRole="button"
            >
              <Icon
                name="shield"
                size={12}
                color={colors.primary}
                strokeWidth={2}
              />
              <Text style={styles.drawerPromoteText}>Promover a admin</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={styles.drawerBanBtn}
            onPress={() => {
              onBan?.(member.userId);
              setExpanded(false);
            }}
            accessibilityRole="button"
          >
            <Icon name="x" size={12} color={colors.error} strokeWidth={2.4} />
            <Text style={styles.drawerBanText}>Banir do grupo</Text>
          </Pressable>
        </View>
      ) : null}
      {!isLast ? <View style={styles.divider} /> : null}
    </View>
  );
}

export function MembersSection({
  memberCount,
  members,
  myRole,
  onPressViewAll,
  onBanMember,
  onPromoteMember,
}: MembersSectionProps) {
  const canManage =
    myRole === MemberRole.OWNER || myRole === MemberRole.MODERATOR;

  return (
    <View>
      <SectionLabel
        label="MEMBROS"
        action={
          <Pressable
            onPress={onPressViewAll}
            accessibilityRole="button"
            testID="members-section-view-all"
          >
            <Text style={styles.viewAll}>VER TODOS ({memberCount})</Text>
          </Pressable>
        }
      />
      <Card>
        {members.length > 0 ? (
          <View testID="members-section-body">
            {members.map((m, i) => (
              <MemberRow
                key={m.userId}
                member={m}
                isLast={i === members.length - 1}
                canManage={canManage}
                onBan={onBanMember}
                onPromote={onPromoteMember}
              />
            ))}
          </View>
        ) : (
          <View style={styles.empty} testID="members-section-empty">
            <Text style={styles.emptyText}>Ainda não há membros</Text>
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  viewAll: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
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
  drawerPromoteBtn: {
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
  drawerPromoteText: {
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
    borderColor: 'rgba(255,75,75,0.33)',
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
  empty: {
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  emptyText: {
    fontSize: 13,
    color: colors.dim,
  },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MemberRole } from '@localloop/shared-types';
import { colors, fonts } from '@/shared/theme';
import type { GroupMember } from '@/infra/api/groups.api';
import { Card } from '@/presentation/screens/CreateGroupScreen/layout/atoms/Card';
import { SectionLabel } from '@/presentation/screens/CreateGroupScreen/layout/atoms/SectionLabel';
import { MemberAvatar } from '../atoms/MemberAvatar';
import { RolePill, type RolePillRole } from '../atoms/RolePill';

interface MembersSectionProps {
  memberCount: number;
  members: GroupMember[];
  onPressViewAll: () => void;
}

export function MembersSection({
  memberCount,
  members,
  onPressViewAll,
}: MembersSectionProps) {
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
              <Pressable
                key={m.userId}
                accessibilityRole="button"
                style={[styles.row, i === 0 && styles.rowFirst]}
                testID={`members-section-row-${m.userId}`}
              >
                <MemberAvatar displayName={m.displayName} size={36} />
                <View style={styles.rowBody}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {m.displayName}
                    </Text>
                    {m.role !== MemberRole.MEMBER ? (
                      <RolePill role={m.role as RolePillRole} />
                    ) : null}
                  </View>
                </View>
              </Pressable>
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
    paddingVertical: 10,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
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

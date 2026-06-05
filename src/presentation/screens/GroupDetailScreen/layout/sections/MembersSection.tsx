import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MemberRole } from '@localloop/shared-types';
import { fonts, type ThemeColors } from '@/shared/theme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { GroupMember } from '@/infra/api/groups.api';
import { Card } from '@/presentation/screens/CreateGroupScreen/layout/atoms/Card';
import { SectionLabel } from '@/presentation/screens/CreateGroupScreen/layout/atoms/SectionLabel';
import { MemberRow } from '../components/MemberRow';

interface MembersSectionProps {
  memberCount: number;
  members: GroupMember[];
  myRole: MemberRole | null;
  onPressViewAll: () => void;
  onBanMember?: (userId: string) => void;
  onPromoteMember?: (userId: string) => void;
  onDemoteMember?: (userId: string) => void;
}

export function MembersSection({
  memberCount,
  members,
  myRole,
  onPressViewAll,
  onBanMember,
  onPromoteMember,
  onDemoteMember,
}: MembersSectionProps) {
  const styles = useThemedStyles(createStyles);
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
                viewerRole={myRole}
                onBan={onBanMember}
                onPromote={onPromoteMember}
                onDemote={onDemoteMember}
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  viewAll: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 0.8,
    fontWeight: '700',
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

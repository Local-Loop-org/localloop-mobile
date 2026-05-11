import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/shared/theme';
import type { GroupMember } from '@/infra/api/groups.api';
import { Card } from '@/presentation/screens/CreateGroupScreen/layout/atoms/Card';
import { SectionLabel } from '@/presentation/screens/CreateGroupScreen/layout/atoms/SectionLabel';
import { MemberStack } from '../atoms/MemberStack';

interface MembersSectionProps {
  memberCount: number;
  members: GroupMember[];
  onPressViewAll: () => void;
}

function initialsFor(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}

export function MembersSection({
  memberCount,
  members,
  onPressViewAll,
}: MembersSectionProps) {
  const stack = members.map((m) => ({
    id: m.userId,
    initials: initialsFor(m.displayName),
  }));

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
        <Pressable
          onPress={onPressViewAll}
          accessibilityRole="button"
          style={styles.body}
          testID="members-section-body"
        >
          {stack.length > 0 ? (
            <MemberStack members={stack} />
          ) : (
            <Text style={styles.bodyText}>Ver lista completa de membros</Text>
          )}
          <Text style={styles.chevron}>›</Text>
        </Pressable>
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
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  bodyText: {
    fontSize: 13,
    color: colors.dim,
  },
  chevron: {
    color: colors.faint,
    fontSize: 18,
    fontWeight: '600',
  },
});

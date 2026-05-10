import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/shared/theme';
import { Card } from '@/presentation/screens/CreateGroupScreen/layout/atoms/Card';
import { SectionLabel } from '@/presentation/screens/CreateGroupScreen/layout/atoms/SectionLabel';

interface MembersSectionProps {
  memberCount: number;
  onPressViewAll: () => void;
}

/**
 * Placeholder for the upcoming short-list of members. The next PR will fetch
 * the top N members and render rows here. For now we surface the count + a
 * primary entry point to the existing members screen.
 */
export function MembersSection({
  memberCount,
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
        <Pressable
          onPress={onPressViewAll}
          accessibilityRole="button"
          style={styles.body}
          testID="members-section-body"
        >
          <Text style={styles.bodyText}>Ver lista completa de membros</Text>
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

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnchorType } from '@localloop/shared-types';
import { colors, fonts } from '@/shared/theme';
import { ANCHOR_TYPE_LABELS } from '@/shared/anchor/labels';
import { GroupAvatar } from '../atoms/GroupAvatar';
import { MemberStack } from '../atoms/MemberStack';
import { RolePill, type RolePillRole } from '../atoms/RolePill';

interface HeroProps {
  name: string;
  description: string | null;
  anchorType: AnchorType;
  anchorLabel: string;
  memberCount: number;
  /** Pass `null` to render no role pill (non-member). */
  role: RolePillRole | null;
  onPressMembers: () => void;
}

export function Hero({
  name,
  description,
  anchorType,
  anchorLabel,
  memberCount,
  role,
  onPressMembers,
}: HeroProps) {
  return (
    <LinearGradient
      colors={['rgba(0,209,255,0.15)', 'rgba(167,139,250,0.15)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.glow} />

      <View style={styles.head}>
        <GroupAvatar anchorType={anchorType} size={64} />
        <View style={styles.headBody}>
          {role ? <RolePill role={role} /> : null}
          <Text style={styles.title} numberOfLines={2}>
            {name}
          </Text>
          {description ? (
            <Text style={styles.description} numberOfLines={3}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      <Pressable
        style={styles.membersRow}
        onPress={onPressMembers}
        accessibilityRole="button"
        accessibilityLabel={`Ver ${memberCount} membros`}
        testID="hero-members-button"
      >
        <View style={styles.membersLeft}>
          <MemberStack members={[]} />
          <View>
            <Text style={styles.membersCount}>{memberCount} membros</Text>
            <Text style={styles.membersMeta} numberOfLines={1}>
              {ANCHOR_TYPE_LABELS[anchorType].toUpperCase()} ·{' '}
              {anchorLabel.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.chevron}>
          <Text style={styles.chevronGlyph}>›</Text>
        </View>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,209,255,0.20)',
  },
  glow: {
    position: 'absolute',
    right: -50,
    top: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(167,139,250,0.18)',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  headBody: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.6,
    lineHeight: 26,
    marginTop: 2,
  },
  description: {
    fontSize: 12.5,
    color: colors.dim,
    lineHeight: 18,
  },
  membersRow: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  membersLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  membersCount: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.text,
  },
  membersMeta: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    color: colors.dim,
    letterSpacing: 0.6,
    marginTop: 1,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,209,255,0.14)',
    borderColor: 'rgba(0,209,255,0.40)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronGlyph: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: -2,
  },
});

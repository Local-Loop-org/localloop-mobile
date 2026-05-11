import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { AnchorType } from '@localloop/shared-types';
import { colors, fonts } from '@/shared/theme';
import { ANCHOR_TYPE_LABELS } from '@/shared/anchor/labels';
import { initialsFor } from '@/shared/format/initials';
import type { GroupMember } from '@/infra/api/groups.api';
import { GroupAvatar } from '../atoms/GroupAvatar';
import { MemberStack } from '../atoms/MemberStack';
import { RolePill, type RolePillRole } from '../atoms/RolePill';

interface HeroProps {
  name: string;
  description: string | null;
  anchorType: AnchorType;
  anchorLabel: string;
  memberCount: number;
  /** Top of the members list — fed into the inline MemberStack. */
  members: GroupMember[];
  /** Pass `null` to render no role pill (non-member). */
  role: RolePillRole | null;
  onPressMembers: () => void;
}

const GLOW_SIZE = 200;

export function Hero({
  name,
  description,
  anchorType,
  anchorLabel,
  memberCount,
  members,
  role,
  onPressMembers,
}: HeroProps) {
  const stack = members.map((m) => ({
    id: m.userId,
    initials: initialsFor(m.displayName),
  }));

  return (
    <LinearGradient
      colors={['rgba(0,217,255,0.15)', 'rgba(176,108,255,0.15)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Svg
        width={GLOW_SIZE}
        height={GLOW_SIZE}
        style={styles.glow}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient
            id="hero-glow"
            cx="50%"
            cy="50%"
            r="50%"
            fx="50%"
            fy="50%"
          >
            <Stop offset="0%" stopColor="#B06CFF" stopOpacity={0.20} />
            <Stop offset="70%" stopColor="#B06CFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle
          cx={GLOW_SIZE / 2}
          cy={GLOW_SIZE / 2}
          r={GLOW_SIZE / 2}
          fill="url(#hero-glow)"
        />
      </Svg>

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
          <MemberStack members={stack} />
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
    borderColor: 'rgba(0,217,255,0.20)',
    marginTop: 4,
  },
  glow: {
    position: 'absolute',
    right: -50,
    top: -50,
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

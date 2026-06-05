import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { AnchorType } from '@localloop/shared-types';
import { fonts, type ThemeColors } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { ANCHOR_TYPE_LABELS } from '@/shared/anchor/labels';
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
  /** When false, name and description become editable TextInputs. Defaults to true. */
  readOnly?: boolean;
  onNameChange?: (v: string) => void;
  onDescriptionChange?: (v: string) => void;
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
  readOnly = true,
  onNameChange,
  onDescriptionChange,
}: HeroProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const stack = members.map((m) => ({
    id: m.userId,
    displayName: m.displayName,
    avatarUrl: m.avatarUrl,
  }));

  return (
    <LinearGradient
      colors={[colors.duotoneSoftFrom, colors.duotoneSoftTo]}
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
            <Stop offset="0%" stopColor={colors.accent2} stopOpacity={0.20} />
            <Stop offset="70%" stopColor={colors.accent2} stopOpacity={0} />
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
          {readOnly ? (
            <Text style={styles.title} numberOfLines={2}>
              {name}
            </Text>
          ) : (
            <TextInput
              style={styles.titleInput}
              value={name}
              onChangeText={onNameChange}
              maxLength={80}
              returnKeyType="next"
              testID="hero-name-input"
              placeholderTextColor={colors.dim}
              placeholder="Nome do grupo"
            />
          )}
          {readOnly ? (
            description ? (
              <Text style={styles.description} numberOfLines={3}>
                {description}
              </Text>
            ) : null
          ) : (
            <TextInput
              style={styles.descriptionInput}
              value={description ?? ''}
              onChangeText={onDescriptionChange}
              maxLength={500}
              multiline
              numberOfLines={3}
              testID="hero-description-input"
              placeholderTextColor={colors.dim}
              placeholder="Descrição (opcional)"
            />
          )}
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.anchorTileBorder,
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
  titleInput: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.6,
    lineHeight: 26,
    marginTop: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 2,
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  description: {
    fontSize: 12.5,
    color: colors.dim,
    lineHeight: 18,
  },
  descriptionInput: {
    fontSize: 12.5,
    color: colors.dim,
    lineHeight: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 2,
    paddingTop: 0,
    paddingHorizontal: 0,
    minHeight: 36,
  },
  membersRow: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
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
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
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

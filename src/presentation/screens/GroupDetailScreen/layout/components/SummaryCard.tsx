import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/icons';

interface SummaryCardProps {
  icon: IconName;
  /** Mono caption shown above the title (e.g. "MENSAGENS · TEXTO · ÁUDIO"). */
  caption: string;
  title: string;
  subtitle?: string;
  testID?: string;
}

export function SummaryCard({
  icon,
  caption,
  title,
  subtitle,
  testID,
}: SummaryCardProps) {
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={15} color={colors.primary} strokeWidth={2} />
      </View>
      <View style={styles.body}>
        <Text style={styles.caption}>{caption}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(0,209,255,0.12)',
    borderColor: 'rgba(0,209,255,0.45)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  caption: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    color: colors.faint,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.dim,
    lineHeight: 17,
  },
});

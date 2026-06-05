import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, type ThemeColors } from '@/shared/theme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { Avatar } from '../atoms/Avatar';

interface RequestRowProps {
  id: string;
  displayName: string;
  /** Mono caption shown under the name (e.g. "HÁ 3M"). Optional. */
  meta?: string;
  isResolving: boolean;
  last: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function RequestRow({
  id,
  displayName,
  meta,
  isResolving,
  last,
  onApprove,
  onReject,
}: RequestRowProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View>
      <View style={styles.head}>
        <Avatar name={displayName} size={38} />
        <View style={styles.headBody}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, styles.deny]}
          onPress={() => onReject(id)}
          disabled={isResolving}
          accessibilityRole="button"
          accessibilityState={{ disabled: isResolving }}
          testID={`request-row-${id}-reject`}
        >
          <Text style={styles.denyLabel}>Recusar</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.approve]}
          onPress={() => onApprove(id)}
          disabled={isResolving}
          accessibilityRole="button"
          accessibilityState={{ disabled: isResolving }}
          testID={`request-row-${id}-approve`}
        >
          <Text style={styles.approveLabel}>Aprovar</Text>
        </Pressable>
      </View>
      {!last ? <View style={styles.divider} /> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  headBody: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.dim,
    letterSpacing: 0.6,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  deny: {
    backgroundColor: 'transparent',
    borderColor: colors.line,
  },
  denyLabel: {
    color: colors.dim,
    fontSize: 12,
    fontWeight: '600',
  },
  approve: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  approveLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginHorizontal: 14,
  },
});

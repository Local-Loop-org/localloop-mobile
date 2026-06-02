import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GroupPrivacy } from '@localloop/shared-types';
import { AnchorIconBadge } from '@/shared/icons/AnchorIconBadge';
import { colors, fonts } from '@/shared/theme';
import type { MapPinData } from '../../types';

interface SelectedPinCardProps {
  pin: MapPinData;
  onPressJoin?: (pin: MapPinData) => void;
}

export function SelectedPinCard({ pin, onPressJoin }: SelectedPinCardProps) {
  const needsApproval = pin.privacy === GroupPrivacy.APPROVAL_REQUIRED;

  return (
    <View style={styles.card} testID="map-selected-card">
      <AnchorIconBadge
        anchorType={pin.anchorType}
        size={48}
        iconSize={20}
        borderRadius={14}
      />

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {pin.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {pin.distanceLabel.toUpperCase()} · {pin.memberCount} MEM
          {pin.liveCount > 0 ? (
            <Text style={styles.live}> · {pin.liveCount} ATIVOS</Text>
          ) : null}
        </Text>
        <Text style={styles.last} numberOfLines={1}>
          {pin.lastMessage}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPressJoin?.(pin)}
        accessibilityRole="button"
        accessibilityLabel={needsApproval ? 'Pedir entrada' : 'Entrar'}
        style={[styles.cta, needsApproval ? styles.ctaOutline : styles.ctaSolid]}
      >
        <Text style={[styles.ctaText, needsApproval ? styles.ctaTextOutline : null]}>
          {needsApproval ? 'Pedir' : 'Entrar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    letterSpacing: 0.4,
    color: colors.faint,
    marginTop: 2,
  },
  live: {
    color: colors.success,
  },
  last: {
    fontSize: 11.5,
    color: colors.dim,
    marginTop: 4,
  },
  cta: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  ctaSolid: {
    backgroundColor: colors.primary,
  },
  ctaOutline: {
    borderWidth: 1,
    borderColor: colors.line,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
    color: colors.background,
  },
  ctaTextOutline: {
    color: colors.text,
  },
});

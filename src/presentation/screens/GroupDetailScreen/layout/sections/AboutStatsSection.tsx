import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AnchorType, GroupPrivacy } from '@localloop/shared-types';
import { ANCHOR_TYPE_LABELS } from '@/shared/anchor/labels';
import { anchorIconName, type IconName } from '@/shared/icons';
import { SectionLabel } from '@/presentation/screens/CreateGroupScreen/layout/atoms/SectionLabel';
import { StatPill } from '../atoms/StatPill';

interface AboutStatsSectionProps {
  memberCount: number;
  anchorType: AnchorType;
  anchorLabel: string;
  privacy: GroupPrivacy;
  distanceLabel?: string | null;
  /** Optional: hide the radius pill if data isn't available yet. */
  radiusKm?: number;
}

function formatRadius(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return Number.isInteger(km) ? `${km} km` : `${km.toFixed(1)} km`;
}

const PRIVACY_VALUE: Record<GroupPrivacy, string> = {
  [GroupPrivacy.OPEN]: 'Aberto',
  [GroupPrivacy.APPROVAL_REQUIRED]: 'Aprovação',
};

const PRIVACY_ICON: Record<GroupPrivacy, IconName> = {
  [GroupPrivacy.OPEN]: 'globe',
  [GroupPrivacy.APPROVAL_REQUIRED]: 'lock',
};

export function AboutStatsSection({
  memberCount,
  anchorType,
  anchorLabel,
  privacy,
  distanceLabel,
  radiusKm,
}: AboutStatsSectionProps) {
  return (
    <View>
      <SectionLabel label='Sobre o Grupo' />
      <View style={styles.row}>
        <StatPill icon='users' label='Membros' value={memberCount} />
        <StatPill
          icon='radar'
          label='Visível até'
          value={radiusKm !== undefined ? formatRadius(radiusKm) : '—'}
        />
        <StatPill
          icon={PRIVACY_ICON[privacy]}
          label='Entrada'
          value={PRIVACY_VALUE[privacy]}
        />
      </View>
      <View style={[styles.row, styles.rowGap]}>
        <StatPill
          icon={anchorIconName(anchorType)}
          label={ANCHOR_TYPE_LABELS[anchorType]}
          value={anchorLabel}
        />
        {distanceLabel ? (
          <StatPill
            icon='compass'
            label='Sua Distância até o grupo'
            value={distanceLabel}
            testID='group-detail-distance-card'
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  rowGap: {
    marginTop: 8,
  },
});

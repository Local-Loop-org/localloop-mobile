import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MemberRole } from '@localloop/shared-types';
import { colors, fonts } from '@/shared/theme';
import { DangerButton } from '../atoms/DangerButton';

interface DangerSectionProps {
  /** Membership role of the current user. `null` = non-member (block hidden). */
  role: MemberRole | null;
  isLeaving: boolean;
  isDeleting: boolean;
  onLeave: () => void;
  onDelete: () => void;
}

/**
 * Role rules (locked in by the plan):
 *   OWNER     → Sair (enabled) + Excluir (filled, enabled)
 *   MODERATOR → Sair (enabled) + Excluir (outlined, disabled) + caption
 *   MEMBER    → Sair (enabled) only — Excluir hidden
 *   non-member → entire block hidden (caller handles the join CTA)
 */
export function DangerSection({
  role,
  isLeaving,
  isDeleting,
  onLeave,
  onDelete,
}: DangerSectionProps) {
  if (role === null) return null;

  const isOwner = role === MemberRole.OWNER;
  const isModerator = role === MemberRole.MODERATOR;
  const showDelete = isOwner || isModerator;

  return (
    <View style={styles.wrap}>
      <DangerButton
        label="Sair do grupo"
        icon="logout"
        onPress={onLeave}
        loading={isLeaving}
        testID="danger-leave"
      />

      {showDelete ? (
        <DangerButton
          label="Excluir grupo permanentemente"
          icon="trash"
          variant="filled"
          disabled={!isOwner}
          loading={isDeleting}
          onPress={onDelete}
          testID="danger-delete"
        />
      ) : null}

      {isModerator ? (
        <Text style={styles.caption} testID="danger-delete-caption">
          APENAS PROPRIETÁRIO PODE EXCLUIR
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 22,
    gap: 8,
  },
  caption: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    color: colors.faint,
    letterSpacing: 0.6,
    textAlign: 'center',
    marginTop: 2,
  },
});

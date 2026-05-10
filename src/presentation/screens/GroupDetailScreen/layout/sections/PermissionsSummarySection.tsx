import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SectionLabel } from '@/presentation/screens/CreateGroupScreen/layout/atoms/SectionLabel';
import {
  SEND_PERM_OPTIONS,
  type SendPermValue,
} from '@/presentation/screens/CreateGroupScreen/layout/components/SendPermPicker';
import { SummaryCard } from '../components/SummaryCard';

interface PermissionsSummarySectionProps {
  /** When undefined, renders "Em breve" placeholder. */
  sendPerm?: SendPermValue;
  sendMediaPerm?: SendPermValue;
}

function labelFor(value: SendPermValue | undefined): string {
  if (!value) return 'Em breve';
  return SEND_PERM_OPTIONS.find((o) => o.value === value)?.label ?? '—';
}

export function PermissionsSummarySection({
  sendPerm,
  sendMediaPerm,
}: PermissionsSummarySectionProps) {
  return (
    <View>
      <SectionLabel label="PERMISSÕES" hint="QUEM PODE ENVIAR" />
      <View style={styles.stack}>
        <SummaryCard
          icon="chat"
          caption="MENSAGENS · TEXTO · ÁUDIO"
          title={labelFor(sendPerm)}
          testID="permissions-summary-send"
        />
        <SummaryCard
          icon="image"
          caption="MÍDIA · FOTOS · VÍDEOS"
          title={labelFor(sendMediaPerm)}
          testID="permissions-summary-media"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 8,
  },
});

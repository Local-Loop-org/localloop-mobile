import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ThemeColors } from '@/shared/theme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { Card } from '@/presentation/screens/CreateGroupScreen/layout/atoms/Card';
import { SectionLabel } from '@/presentation/screens/CreateGroupScreen/layout/atoms/SectionLabel';
import { RequestRow } from '../components/RequestRow';

interface RequestItem {
  id: string;
  displayName: string;
  meta?: string;
}

interface RequestsSectionProps {
  requests: RequestItem[];
  resolvingRequestId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function RequestsSection({
  requests,
  resolvingRequestId,
  onApprove,
  onReject,
}: RequestsSectionProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View>
      <SectionLabel
        label="SOLICITAÇÕES"
        hint={`${requests.length} PENDENTES`}
      />
      <Card>
        {requests.length === 0 ? (
          <Text style={styles.empty}>Nenhuma solicitação no momento.</Text>
        ) : (
          requests.map((req, i) => (
            <RequestRow
              key={req.id}
              id={req.id}
              displayName={req.displayName}
              meta={req.meta}
              isResolving={resolvingRequestId === req.id}
              last={i === requests.length - 1}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))
        )}
      </Card>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  empty: {
    padding: 16,
    fontSize: 12.5,
    color: colors.dim,
    textAlign: 'center',
  },
});

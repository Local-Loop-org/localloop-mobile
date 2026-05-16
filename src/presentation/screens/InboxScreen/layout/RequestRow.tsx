import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Avatar from '@/shared/ui/Avatar';
import { formatLastActivity } from '@/shared/format/lastActivity';
import { styles } from './styles';
import type { DmRequest } from '../types';

interface RequestRowProps {
  request: DmRequest;
  onAccept: (id: string) => void;
  onIgnore: (id: string) => void;
}

export function RequestRow({ request, onAccept, onIgnore }: RequestRowProps) {
  const at = formatLastActivity(request.createdAt);

  return (
    <View style={styles.requestRow} testID={`dm-request-${request.id}`}>
      <Avatar name={request.peer.displayName} uri={request.peer.avatarUrl} size={44} />
      <View style={styles.requestBody}>
        <View style={styles.requestTopLine}>
          <Text style={styles.requestName} numberOfLines={1}>
            {request.peer.displayName}
          </Text>
          <Text style={styles.requestAt}>{at}</Text>
        </View>
        <Text style={styles.requestMessage} numberOfLines={2}>
          “{request.message}”
        </Text>
        <View style={styles.requestActions}>
          <TouchableOpacity
            onPress={() => onAccept(request.id)}
            accessibilityRole="button"
            accessibilityLabel={`Aceitar solicitação de ${request.peer.displayName}`}
            style={styles.requestAcceptBtn}
            testID={`dm-request-accept-${request.id}`}
          >
            <Text style={styles.requestAcceptText}>Aceitar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onIgnore(request.id)}
            accessibilityRole="button"
            accessibilityLabel={`Ignorar solicitação de ${request.peer.displayName}`}
            style={styles.requestIgnoreBtn}
            testID={`dm-request-ignore-${request.id}`}
          >
            <Text style={styles.requestIgnoreText}>Ignorar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

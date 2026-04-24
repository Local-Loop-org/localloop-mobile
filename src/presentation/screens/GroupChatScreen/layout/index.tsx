import React from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/shared/theme';
import type { ChatMessage } from '@/infra/api/messages.api';
import { styles } from './styles';
import type { GroupChatLayoutProps } from './types';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

function MessageBubble({
  message,
  isMine,
}: {
  message: ChatMessage;
  isMine: boolean;
}) {
  return (
    <View
      style={[
        styles.messageRow,
        isMine ? styles.messageRowMine : styles.messageRowTheirs,
      ]}
    >
      {!isMine ? (
        <Text style={styles.senderName}>{message.senderName}</Text>
      ) : null}
      <View
        style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}
      >
        <Text
          style={[
            styles.content,
            isMine ? styles.contentMine : styles.contentTheirs,
          ]}
        >
          {message.content}
        </Text>
      </View>
      <Text style={[styles.timestamp, isMine && styles.timestampMine]}>
        {formatTime(message.createdAt)}
      </Text>
    </View>
  );
}

export default function GroupChatLayout({
  messages,
  currentUserId,
  loading,
  loadingMore,
  hasMore,
  connected,
  errorMessage,
  draft,
  onChangeDraft,
  onSend,
  onLoadOlder,
  onBack,
}: GroupChatLayoutProps) {
  const sendDisabled = draft.trim().length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Text style={styles.backText}>‹ Voltar</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Chat</Text>
          </View>
          <View
            testID="connection-indicator"
            style={[
              styles.connectionDot,
              connected
                ? styles.connectionDotOnline
                : styles.connectionDotOffline,
            ]}
          />
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {loading ? (
          <View style={styles.emptyWrapper}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            inverted
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isMine={item.senderId === currentUserId}
              />
            )}
            onEndReached={hasMore ? onLoadOlder : undefined}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMoreWrapper}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyWrapper}>
                <Text style={styles.emptyText}>
                  Nenhuma mensagem ainda. Envie a primeira!
                </Text>
              </View>
            }
          />
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Escreva uma mensagem"
            placeholderTextColor={colors.textSecondary}
            value={draft}
            onChangeText={onChangeDraft}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, sendDisabled && styles.sendBtnDisabled]}
            disabled={sendDisabled}
            onPress={onSend}
            testID="send-button"
          >
            <Text style={styles.sendBtnText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

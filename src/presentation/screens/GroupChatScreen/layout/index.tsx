import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Icon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import type { ChatMessage } from '@/infra/api/messages.api';
import AnchorIcon from '../components/AnchorIcon';
import Avatar from '../components/Avatar';
import {
  buildChatListItems,
  formatTime,
  type ChatListItem,
} from '../utils';
import { layoutDimensions, styles } from './styles';
import type { GroupChatLayoutProps } from './types';

function OwnMessage({ message }: { message: ChatMessage }) {
  return (
    <View style={styles.ownRow}>
      <View style={styles.ownColumn}>
        <LinearGradient
          colors={[colors.primary, colors.accent2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ownBubble}
        >
          <Text style={styles.ownBubbleText}>{message.content}</Text>
        </LinearGradient>
        <Text style={styles.ownTimestamp}>{formatTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}

function PeerMessage({ message }: { message: ChatMessage }) {
  return (
    <View style={styles.peerRow}>
      <Avatar
        name={message.senderName}
        uri={message.senderAvatar}
        size={layoutDimensions.peerAvatar}
      />
      <View style={styles.peerColumn}>
        <View style={styles.peerNameRow}>
          <Text style={styles.peerName}>{message.senderName}</Text>
        </View>
        <View style={styles.peerBubble}>
          <Text style={styles.peerBubbleText}>{message.content}</Text>
        </View>
        <Text style={styles.peerTimestamp}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

function DaySeparator({ label }: { label: string }) {
  return (
    <View style={styles.separatorWrapper}>
      <Text style={styles.separatorText}>{label}</Text>
    </View>
  );
}

export default function GroupChatLayout({
  groupName,
  anchorType,
  onlineCount,
  messages,
  currentUserId,
  loading,
  loadingMore,
  hasMore,
  errorMessage,
  draft,
  onChangeDraft,
  onSend,
  onLoadOlder,
  onBack,
  onPressHeader,
  onPressMembers,
}: GroupChatLayoutProps) {
  const sendDisabled = draft.trim().length === 0;
  const items = useMemo(() => buildChatListItems(messages), [messages]);

  const renderItem = ({ item }: { item: ChatListItem }) => {
    if (item.kind === 'separator') {
      return <DaySeparator label={item.label} />;
    }
    const isOwn = item.message.senderId === currentUserId;
    return isOwn ? (
      <OwnMessage message={item.message} />
    ) : (
      <PeerMessage message={item.message} />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onBack}
            testID="header-back"
          >
            <Icon name="chevronLeft" size={17} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerCenter}
            onPress={onPressHeader}
            testID="header-title"
          >
            <AnchorIcon
              type={anchorType}
              size={layoutDimensions.headerAnchor}
            />
            <View style={styles.headerCenterText}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {groupName}
                </Text>
                <Icon
                  name="chevronRight"
                  size={13}
                  color={colors.faint}
                  strokeWidth={2}
                />
              </View>
              {onlineCount > 0 ? (
                <Text style={styles.headerSubtitle} testID="header-subtitle">
                  · {onlineCount} ONLINE ·
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onPressMembers}
            testID="header-members"
          >
            <Icon name="users" size={17} color={colors.text} />
          </TouchableOpacity>
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
            data={items}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.listContent}
            renderItem={renderItem}
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
          <TouchableOpacity
            style={styles.composerBtn}
            testID="composer-attach"
            disabled
          >
            <Icon name="plus" size={18} color={colors.dim} />
          </TouchableOpacity>
          <TextInput
            style={styles.inputPill}
            placeholder="Escreva uma mensagem"
            placeholderTextColor={colors.faint}
            value={draft}
            onChangeText={onChangeDraft}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.composerSend,
              sendDisabled && styles.composerSendDisabled,
            ]}
            disabled={sendDisabled}
            onPress={onSend}
            testID="send-button"
          >
            <LinearGradient
              colors={[colors.primary, colors.accent2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Icon
              name="send2"
              size={15}
              color={colors.white}
              strokeWidth={2.2}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Icon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { ChatThread } from '@/shared/ui/chat/ChatThread';
import { ChatComposer } from '@/shared/ui/chat/ChatComposer';
import { GroupActionSheet } from '@/shared/ui/chat/GroupActionSheet';
import { MessageActionSheet } from '@/shared/ui/chat/MessageActionSheet';
import AnchorIcon from '../components/AnchorIcon';
import { layoutDimensions, styles } from './styles';
import type { GroupChatLayoutProps } from './types';

export default function GroupChatLayout({
  groupName,
  anchorType,
  onlineCount,
  memberCount,
  messages,
  messageStatuses,
  currentUserId,
  loading,
  loadingMore,
  hasMore,
  errorMessage,
  draft,
  composingReplyTo,
  actionSheetOpen,
  messageActionSheet,
  onChangeDraft,
  onSend,
  onLoadOlder,
  onPressMessageAvatar,
  onBack,
  onPressHeader,
  onPressMore,
  onCloseActionSheet,
  onSelectAction,
  onLongPressMessage,
  onSwipeReply,
  onSelectMessageAction,
  onCloseMessageActionSheet,
}: GroupChatLayoutProps) {
  const sendDisabled = draft.trim().length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style='light' />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onBack}
            testID='header-back'
          >
            <Icon name='chevronLeft' size={17} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerCenter}
            onPress={onPressHeader}
            testID='header-title'
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
                  name='chevronRight'
                  size={13}
                  color={colors.faint}
                  strokeWidth={2}
                />
              </View>
              {onlineCount > 0 ? (
                <Text style={styles.headerSubtitle} testID='header-subtitle'>
                  · {onlineCount} ONLINE ·
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onPressMore}
            accessibilityRole='button'
            accessibilityLabel='Mais ações do grupo'
            testID='header-more'
          >
            <Icon name='more' size={17} color={colors.text} />
          </TouchableOpacity>
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {loading ? (
          <View style={styles.emptyWrapper}>
            <ActivityIndicator color={colors.primary} size='large' />
          </View>
        ) : (
          <ChatThread
            messages={messages}
            messageStatuses={messageStatuses}
            currentUserId={currentUserId ?? ''}
            showPeerSenderName
            onLongPressMessage={onLongPressMessage}
            onSwipeReply={onSwipeReply}
            onPressPeerAvatar={(senderId) => {
              const m = messages.find((msg) => msg.senderId === senderId);
              if (m) onPressMessageAvatar(m);
            }}
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

        <ChatComposer
          draft={draft}
          composingReplyTo={composingReplyTo}
          onChangeDraft={onChangeDraft}
          onSend={onSend}
          sendDisabled={sendDisabled}
        />

        {actionSheetOpen ? (
          <GroupActionSheet
            groupName={groupName}
            anchorType={anchorType}
            memberCount={memberCount}
            onlineCount={onlineCount}
            onClose={onCloseActionSheet}
            onSelect={onSelectAction}
          />
        ) : null}

        {messageActionSheet ? (
          <MessageActionSheet
            messagePreview={messageActionSheet.messagePreview}
            available={messageActionSheet.available}
            onClose={onCloseMessageActionSheet}
            onSelect={onSelectMessageAction}
          />
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

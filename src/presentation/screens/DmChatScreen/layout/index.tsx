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
import { DmActionSheet } from '@/shared/ui/chat/DmActionSheet';
import { MessageActionSheet } from '@/shared/ui/chat/MessageActionSheet';
import { DmRequestBanner } from '@/shared/ui/chat/DmRequestBanner';
import { DmRequestComposer } from '@/shared/ui/chat/DmRequestComposer';
import { formatTime } from '@/shared/format/chat';
import Avatar from '@/shared/ui/Avatar';
import { layoutDimensions, styles } from './styles';
import type { DmChatLayoutProps, DmPeerStatus } from './types';

function renderPeerStatusSubtitle(status: DmPeerStatus) {
  if (!status) return null;

  let text = '';
  let style: any = styles.headerSubtitle;

  if (status.kind === 'online') {
    text = 'Online';
    style = [styles.headerSubtitle, styles.headerSubtitleOnline];
  } else if (status.kind === 'typing') {
    text = 'Digitando...';
    style = [styles.headerSubtitle, styles.headerSubtitleTyping];
  } else if (status.kind === 'lastSeen') {
    text = `Visto por último em ${formatTime(status.at)}`;
  }

  return (
    <Text style={style} testID='header-subtitle'>
      {text}
    </Text>
  );
}

export default function DmChatLayout({
  peerName,
  peerAvatarUrl,
  peerStatus,
  messages,
  messageStatuses,
  currentUserId,
  loading,
  loadingMore,
  hasMore,
  errorMessage,
  awaitingApproval,
  archived,
  draft,
  composingReplyTo,
  actionSheetOpen,
  messageActionSheet,
  onChangeDraft,
  onSend,
  onLoadOlder,
  onBack,
  onPressHeader,
  onPressMore,
  onCloseActionSheet,
  onSelectAction,
  onCancelRequest,
  moreDisabled,
  onLongPressMessage,
  onSwipeReply,
  onSelectMessageAction,
  onCloseMessageActionSheet,
}: DmChatLayoutProps) {
  const sendDisabled = draft.trim().length === 0 || awaitingApproval;
  const isTyping = peerStatus?.kind === 'typing';

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
            <View style={styles.peerAvatarWrap}>
              <Avatar
                name={peerName}
                uri={peerAvatarUrl}
                size={layoutDimensions.peerAvatar}
              />
              {peerStatus?.kind === 'online' ? (
                <View
                  style={styles.peerOnlineDot}
                  testID='header-peer-online-dot'
                />
              ) : null}
            </View>
            <View style={styles.headerCenterText}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {peerName}
                </Text>
              </View>
              {renderPeerStatusSubtitle(peerStatus)}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, moreDisabled && styles.iconBtnDisabled]}
            onPress={onPressMore}
            disabled={moreDisabled}
            accessibilityRole='button'
            accessibilityLabel='Mais ações da conversa'
            accessibilityState={{ disabled: !!moreDisabled }}
            testID='header-more'
          >
            <Icon name='more' size={17} color={colors.text} />
          </TouchableOpacity>
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {awaitingApproval ? (
          <DmRequestBanner peerFirstName={peerName.split(' ')[0]} />
        ) : null}

        {loading ? (
          <View style={styles.emptyWrapper}>
            <ActivityIndicator color={colors.primary} size='large' />
          </View>
        ) : (
          <ChatThread
            messages={messages}
            currentUserId={currentUserId ?? ''}
            messageStatuses={messageStatuses}
            showPeerSenderName={false}
            showTypingBubble={isTyping}
            onLongPressMessage={onLongPressMessage}
            onSwipeReply={onSwipeReply}
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

        {awaitingApproval ? (
          <DmRequestComposer
            peerFirstName={peerName.split(' ')[0]}
            onCancel={onCancelRequest}
          />
        ) : (
          <ChatComposer
            draft={draft}
            composingReplyTo={composingReplyTo}
            onChangeDraft={onChangeDraft}
            onSend={onSend}
            sendDisabled={sendDisabled}
          />
        )}

        {actionSheetOpen ? (
          <DmActionSheet
            peerName={peerName}
            peerAvatarUrl={peerAvatarUrl}
            archived={archived}
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

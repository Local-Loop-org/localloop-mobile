import React, { useMemo } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import type { ChatMessage } from '@localloop/shared-types';
import { Icon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import Avatar from '@/shared/ui/Avatar';
import { OwnBubble } from '@/shared/ui/chat/OwnBubble';
import { PeerBubble } from '@/shared/ui/chat/PeerBubble';
import { DaySeparatorItem } from '@/shared/ui/chat/DaySeparatorItem';
import { TypingBubble } from '@/shared/ui/chat/TypingBubble';
import { ReplyPreviewChip } from '@/shared/ui/chat/ReplyPreviewChip';
import { DmActionSheet } from '@/shared/ui/chat/DmActionSheet';
import { DmRequestBanner } from '@/shared/ui/chat/DmRequestBanner';
import { DmRequestComposer } from '@/shared/ui/chat/DmRequestComposer';
import {
  buildChatListItems,
  type ChatListItem,
} from '@/shared/format/chat';
import { layoutDimensions, styles } from './styles';
import type { DmChatMockupLayoutProps } from './types';
import { ME, VARIANT_LABELS } from '../mockData';

function PresenceSubtitle({
  presence,
}: {
  presence: DmChatMockupLayoutProps['state']['presence'];
}) {
  if (presence.kind === 'online') {
    return (
      <View style={styles.headerSubtitleRow}>
        <View style={styles.headerOnlineDot} />
        <Text style={[styles.headerSubtitle, styles.headerSubtitleOnline]}>
          ONLINE
        </Text>
      </View>
    );
  }
  if (presence.kind === 'typing') {
    return (
      <Text style={[styles.headerSubtitle, styles.headerSubtitleTyping]}>
        Digitando…
      </Text>
    );
  }
  if (presence.kind === 'pendingApproval') {
    return (
      <Text style={[styles.headerSubtitle, styles.headerSubtitlePending]}>
        AGUARDANDO APROVAÇÃO
      </Text>
    );
  }
  return (
    <Text style={styles.headerSubtitle}>
      Visto por último {presence.label}
    </Text>
  );
}

export default function DmChatMockupLayout({
  state,
  variants,
  onSelectVariant,
  onCloseActionSheet,
  onPressCancelReply,
  onPressRetry,
  onCancelRequest,
}: DmChatMockupLayoutProps) {
  const items = useMemo(
    () => buildChatListItems(state.messages),
    [state.messages],
  );

  // Resolve reply original message for both the inline quote and the chip.
  const messageById = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    state.messages.forEach((m) => map.set(m.id, m));
    return map;
  }, [state.messages]);

  const composingOriginal = state.composingReplyTo
    ? messageById.get(state.composingReplyTo)
    : null;

  const renderItem = ({
    item,
    index,
  }: {
    item: ChatListItem;
    index: number;
  }) => {
    if (item.kind === 'separator') {
      return <DaySeparatorItem label={item.label} />;
    }
    // Items array is newest-first (FlatList is inverted, so items[0] renders at the bottom).
    // Chronological neighbours:
    //   previousMessage (chronologically older, rendered above on screen) = items[index + 1]
    //   nextMessage (chronologically newer, rendered below on screen)     = items[index - 1]
    const olderItem = items[index + 1];
    const newerItem = items[index - 1];
    const previousMessage =
      olderItem && olderItem.kind === 'message' ? olderItem.message : null;
    const nextMessage =
      newerItem && newerItem.kind === 'message' ? newerItem.message : null;

    const isOwn = item.message.senderId === ME.id;
    const replyOriginalId = state.messageReplyTo[item.message.id];
    const replyOriginal = replyOriginalId
      ? messageById.get(replyOriginalId)
      : null;
    const replyTo = replyOriginal
      ? {
          author:
            replyOriginal.senderId === ME.id
              ? ME.name
              : replyOriginal.senderName.split(' ')[0],
          text: replyOriginal.content ?? '',
        }
      : undefined;

    if (isOwn) {
      const status = state.messageStatuses[item.message.id];
      return (
        <OwnBubble
          message={item.message}
          status={status}
          previousMessage={previousMessage}
          nextMessage={nextMessage}
          replyTo={replyTo}
          onRetry={() => onPressRetry(item.message.id)}
        />
      );
    }
    return (
      <PeerBubble
        message={item.message}
        showSenderName={false}
        previousMessage={previousMessage}
        nextMessage={nextMessage}
        replyTo={replyTo}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style='light' />

      <View style={styles.pickerWrap}>
        <Text style={styles.pickerTitle}>· VARIAÇÕES DA TELA DE DM ·</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pickerRow}
        >
          {variants.map((v) => {
            const active = v === state.variant;
            return (
              <Pressable
                key={v}
                onPress={() => onSelectVariant(v)}
                style={[styles.pickerPill, active && styles.pickerPillActive]}
                accessibilityRole='button'
                accessibilityState={{ selected: active }}
                testID={`variant-pill-${v}`}
              >
                <Text
                  style={[
                    styles.pickerPillText,
                    active && styles.pickerPillTextActive,
                  ]}
                >
                  {VARIANT_LABELS[v]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.chatSurface}>
        <View style={styles.header}>
          <Pressable
            style={styles.iconBtn}
            accessibilityRole='button'
            accessibilityLabel='Voltar'
            testID='mock-header-back'
          >
            <Icon name='chevronLeft' size={17} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.peerAvatarWrap}>
              <Avatar
                name={state.peer.name}
                uri={state.peer.avatarUrl}
                size={layoutDimensions.peerAvatar}
              />
              {state.presence.kind === 'online' && (
                <View style={styles.peerOnlineDot} testID='mock-peer-online-dot' />
              )}
            </View>
            <View style={styles.headerCenterText}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {state.peer.name}
              </Text>
              <PresenceSubtitle presence={state.presence} />
            </View>
          </View>
          <Pressable
            style={styles.iconBtn}
            accessibilityRole='button'
            accessibilityLabel='Mais ações da conversa'
            onPress={() => onSelectVariant('menu')}
            testID='mock-header-more'
          >
            <Icon name='more' size={17} color={colors.text} />
          </Pressable>
        </View>

        {state.awaitingApproval && (
          <DmRequestBanner peerFirstName={state.peer.name.split(' ')[0]} />
        )}

        <FlatList
          inverted
          data={items}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ListHeaderComponent={
            state.showTypingBubble ? <TypingBubble /> : null
          }
        />

        {state.composingReplyTo && composingOriginal && (
          <ReplyPreviewChip
            authorLabel={
              composingOriginal.senderId === ME.id
                ? ME.name
                : composingOriginal.senderName.split(' ')[0]
            }
            originalText={composingOriginal.content ?? ''}
            onCancel={onPressCancelReply}
          />
        )}

        {state.awaitingApproval ? (
          <DmRequestComposer
            peerFirstName={state.peer.name.split(' ')[0]}
            onCancel={onCancelRequest}
          />
        ) : (
          <View
            style={[
              styles.composer,
              state.composingReplyTo && styles.composerNoTopBorder,
            ]}
          >
            <Pressable style={styles.composerBtn} testID='mock-composer-attach'>
              <Icon name='plus' size={18} color={colors.dim} />
            </Pressable>
            <View style={styles.inputPill}>
              <Text
                style={[
                  styles.inputPillText,
                  !state.composingDraft && styles.inputPillPlaceholder,
                ]}
                numberOfLines={1}
              >
                {state.composingDraft || 'Escreva uma mensagem'}
              </Text>
              {!state.composingDraft && (
                <Icon name='mic' size={15} color={colors.faint} strokeWidth={1.8} />
              )}
            </View>
            <Pressable style={styles.composerSend} testID='mock-composer-send'>
              <LinearGradient
                colors={[colors.primary, colors.accent2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Icon name='send' size={15} color={colors.white} strokeWidth={2.2} />
            </Pressable>
          </View>
        )}

        {state.actionSheetOpen && (
          <DmActionSheet
            peerName={state.peer.name}
            peerAvatarUrl={state.peer.avatarUrl}
            onClose={onCloseActionSheet}
            onSelect={onCloseActionSheet}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

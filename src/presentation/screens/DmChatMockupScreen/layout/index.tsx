import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Icon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import Avatar from '@/shared/ui/Avatar';
import { ChatThread } from '@/shared/ui/chat/ChatThread';
import { ReplyPreviewChip } from '@/shared/ui/chat/ReplyPreviewChip';
import { DmActionSheet } from '@/shared/ui/chat/DmActionSheet';
import { DmRequestBanner } from '@/shared/ui/chat/DmRequestBanner';
import { DmRequestComposer } from '@/shared/ui/chat/DmRequestComposer';
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
  onSwipeReply,
}: DmChatMockupLayoutProps) {
  const composingOriginal = state.composingReplyTo
    ? state.messages.find((m) => m.id === state.composingReplyTo)
    : null;

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

        <ChatThread
          messages={state.messages}
          currentUserId={ME.id}
          messageStatuses={state.messageStatuses}
          messageReplyTo={state.messageReplyTo}
          showPeerSenderName={false}
          showTypingBubble={state.showTypingBubble}
          onSwipeReply={onSwipeReply}
          onPressRetry={onPressRetry}
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

import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Icon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { ChatThread } from '@/shared/ui/chat/ChatThread';
import { ChatComposer } from '@/shared/ui/chat/ChatComposer';
import { GroupActionSheet } from '@/shared/ui/chat/GroupActionSheet';
import AnchorIcon from '@/presentation/screens/GroupChatScreen/components/AnchorIcon';
import { layoutDimensions, styles } from './styles';
import type { GroupChatMockupLayoutProps } from './types';
import { ME, VARIANT_LABELS } from '../mockData';

function Subtitle({
  presence,
  onlineCount,
}: {
  presence: GroupChatMockupLayoutProps['state']['presence'];
  onlineCount: number;
}) {
  if (presence.kind === 'typing') {
    return (
      <Text style={[styles.headerSubtitle, styles.headerSubtitleTyping]}>
        {presence.senderName} está digitando…
      </Text>
    );
  }
  return (
    <Text style={[styles.headerSubtitle, styles.headerSubtitleOnline]}>
      · {onlineCount} ONLINE ·
    </Text>
  );
}

export default function GroupChatMockupLayout({
  state,
  variants,
  onSelectVariant,
  onCloseActionSheet,
  onPressCancelReply,
  onPressRetry,
  onSwipeReply,
}: GroupChatMockupLayoutProps) {
  const composingOriginal = state.composingReplyTo
    ? state.messages.find((m) => m.id === state.composingReplyTo)
    : null;
  const composerReplyTo =
    state.composingReplyTo && composingOriginal
      ? {
          authorLabel:
            composingOriginal.senderId === ME.id
              ? ME.name
              : composingOriginal.senderName.split(' ')[0],
          originalText: composingOriginal.content ?? '',
          onCancel: onPressCancelReply,
        }
      : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style='light' />

      <View style={styles.pickerWrap}>
        <Text style={styles.pickerTitle}>· VARIAÇÕES DA TELA DE GRUPO ·</Text>
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
            <AnchorIcon
              type={state.group.anchorType}
              size={layoutDimensions.headerAnchor}
            />
            <View style={styles.headerCenterText}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {state.group.name}
              </Text>
              <Subtitle
                presence={state.presence}
                onlineCount={state.group.onlineCount}
              />
            </View>
          </View>
          <Pressable
            style={styles.iconBtn}
            accessibilityRole='button'
            accessibilityLabel='Mais ações do grupo'
            onPress={() => onSelectVariant('menu')}
            testID='mock-header-more'
          >
            <Icon name='more' size={17} color={colors.text} />
          </Pressable>
        </View>

        <ChatThread
          messages={state.messages}
          currentUserId={ME.id}
          messageStatuses={state.messageStatuses}
          messageReplyTo={state.messageReplyTo}
          showPeerSenderName
          showTypingBubble={state.showTypingBubble}
          onSwipeReply={onSwipeReply}
          onPressRetry={onPressRetry}
        />

        <ChatComposer
          draft={state.composingDraft}
          composingReplyTo={composerReplyTo}
        />

        {state.actionSheetOpen && (
          <GroupActionSheet
            groupName={state.group.name}
            anchorType={state.group.anchorType}
            memberCount={state.group.memberCount}
            onlineCount={state.group.onlineCount}
            onClose={onCloseActionSheet}
            onSelect={onCloseActionSheet}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

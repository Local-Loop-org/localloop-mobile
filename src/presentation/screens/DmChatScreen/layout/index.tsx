import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Icon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { OwnBubble } from '@/shared/ui/chat/OwnBubble';
import { PeerBubble } from '@/shared/ui/chat/PeerBubble';
import { DaySeparatorItem } from '@/shared/ui/chat/DaySeparatorItem';
import {
  buildChatListItems,
  formatTime,
  type ChatListItem,
} from '@/shared/format/chat';
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
  currentUserId,
  loading,
  loadingMore,
  hasMore,
  errorMessage,
  awaitingApproval,
  draft,
  onChangeDraft,
  onSend,
  onLoadOlder,
  onBack,
  onPressHeader,
}: DmChatLayoutProps) {
  const sendDisabled = draft.trim().length === 0 || awaitingApproval;
  const items = useMemo(() => buildChatListItems(messages), [messages]);

  const renderItem = ({ item }: { item: ChatListItem }) => {
    if (item.kind === 'separator') {
      return <DaySeparatorItem label={item.label} />;
    }
    const isOwn = item.message.senderId === currentUserId;
    return isOwn ? (
      <OwnBubble message={item.message} />
    ) : (
      <PeerBubble message={item.message} showSenderName={false} />
    );
  };

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
            <Avatar
              name={peerName}
              uri={peerAvatarUrl}
              size={layoutDimensions.peerAvatar}
            />
            <View style={styles.headerCenterText}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {peerName}
                </Text>
              </View>
              {renderPeerStatusSubtitle(peerStatus)}
            </View>
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
            testID='composer-attach'
            disabled
          >
            <Icon name='plus' size={18} color={colors.dim} />
          </TouchableOpacity>
          <TextInput
            style={styles.inputPill}
            placeholder={
              awaitingApproval
                ? `Aguarde aprovação de ${peerName}`
                : 'Escreva uma mensagem'
            }
            placeholderTextColor={colors.faint}
            value={draft}
            onChangeText={onChangeDraft}
            editable={!awaitingApproval}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.composerSend,
              sendDisabled && styles.composerSendDisabled,
            ]}
            disabled={sendDisabled}
            onPress={onSend}
            testID='send-button'
          >
            <LinearGradient
              colors={[colors.primary, colors.accent2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Icon
              name='send'
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

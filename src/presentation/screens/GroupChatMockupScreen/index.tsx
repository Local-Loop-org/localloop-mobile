import React, { useCallback, useState } from 'react';
import GroupChatMockupLayout from './layout';
import {
  buildGroupMockState,
  VARIANT_ORDER,
  type GroupMockVariant,
} from './mockData';

/** A sentinel signalling that the user has explicitly overridden a base
 * value. `null` means "no override — fall through to mock data". */
type Override<T> = { value: T } | null;

export default function GroupChatMockupScreen() {
  const [variant, setVariant] = useState<GroupMockVariant>('standard');
  const [actionSheetOverride, setActionSheetOverride] =
    useState<Override<boolean>>(null);
  const [composingReplyOverride, setComposingReplyOverride] =
    useState<Override<string | null>>(null);

  const baseState = buildGroupMockState(variant);
  const state = {
    ...baseState,
    actionSheetOpen:
      actionSheetOverride === null
        ? baseState.actionSheetOpen
        : actionSheetOverride.value,
    composingReplyTo:
      composingReplyOverride === null
        ? baseState.composingReplyTo
        : composingReplyOverride.value,
  };

  const handleSelectVariant = useCallback((v: GroupMockVariant) => {
    setVariant(v);
    setActionSheetOverride(null);
    setComposingReplyOverride(null);
  }, []);

  const handleCloseActionSheet = useCallback(() => {
    setActionSheetOverride({ value: false });
  }, []);

  const handleCancelReply = useCallback(() => {
    setComposingReplyOverride({ value: null });
  }, []);

  const handleSwipeReply = useCallback((messageId: string) => {
    setComposingReplyOverride({ value: messageId });
  }, []);

  const handleRetry = useCallback((_messageId: string) => {
    setVariant('standard');
    setActionSheetOverride(null);
    setComposingReplyOverride(null);
  }, []);

  return (
    <GroupChatMockupLayout
      state={state}
      variants={VARIANT_ORDER}
      onSelectVariant={handleSelectVariant}
      onCloseActionSheet={handleCloseActionSheet}
      onPressCancelReply={handleCancelReply}
      onPressRetry={handleRetry}
      onSwipeReply={handleSwipeReply}
    />
  );
}

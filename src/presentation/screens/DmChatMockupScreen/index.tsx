import React, { useCallback, useState } from 'react';
import DmChatMockupLayout from './layout';
import {
  buildDmMockState,
  VARIANT_ORDER,
  type DmMockVariant,
} from './mockData';

/** A sentinel signalling that the user has explicitly overridden a base
 * value. `undefined` means "no override — fall through to mock data". */
type Override<T> = { value: T } | null;

export default function DmChatMockupScreen() {
  const [variant, setVariant] = useState<DmMockVariant>('online');
  const [actionSheetOverride, setActionSheetOverride] =
    useState<Override<boolean>>(null);
  const [composingReplyOverride, setComposingReplyOverride] =
    useState<Override<string | null>>(null);

  const baseState = buildDmMockState(variant);
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

  const resetOverrides = () => {
    setActionSheetOverride(null);
    setComposingReplyOverride(null);
  };

  const handleSelectVariant = useCallback((v: DmMockVariant) => {
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
    // Mockup only — flip back to the standard online thread to make the change visible.
    setVariant('online');
    resetOverrides();
  }, []);

  const handleCancelRequest = useCallback(() => {
    setVariant('online');
    resetOverrides();
  }, []);

  return (
    <DmChatMockupLayout
      state={state}
      variants={VARIANT_ORDER}
      onSelectVariant={handleSelectVariant}
      onCloseActionSheet={handleCloseActionSheet}
      onPressCancelReply={handleCancelReply}
      onPressRetry={handleRetry}
      onCancelRequest={handleCancelRequest}
      onSwipeReply={handleSwipeReply}
    />
  );
}

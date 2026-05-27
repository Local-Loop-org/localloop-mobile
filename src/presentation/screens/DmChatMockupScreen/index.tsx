import React, { useCallback, useState } from 'react';
import DmChatMockupLayout from './layout';
import {
  buildDmMockState,
  VARIANT_ORDER,
  type DmMockVariant,
} from './mockData';

export default function DmChatMockupScreen() {
  const [variant, setVariant] = useState<DmMockVariant>('online');
  const [actionSheetOverride, setActionSheetOverride] = useState<
    boolean | null
  >(null);

  const baseState = buildDmMockState(variant);
  const state =
    actionSheetOverride === null
      ? baseState
      : { ...baseState, actionSheetOpen: actionSheetOverride };

  const handleSelectVariant = useCallback((v: DmMockVariant) => {
    setVariant(v);
    setActionSheetOverride(null);
  }, []);

  const handleCloseActionSheet = useCallback(() => {
    setActionSheetOverride(false);
  }, []);

  const handleCancelReply = useCallback(() => {
    // Mockup only — no real reply state to clear. Bounce back to 'online' so the chip disappears.
    setVariant('online');
  }, []);

  const handleRetry = useCallback((_messageId: string) => {
    // Mockup only — flip the failed state back to the standard online thread so the change is visible.
    setVariant('online');
  }, []);

  const handleCancelRequest = useCallback(() => {
    setVariant('online');
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
    />
  );
}

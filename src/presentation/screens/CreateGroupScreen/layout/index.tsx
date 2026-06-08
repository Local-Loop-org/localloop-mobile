import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScrollLock } from '@/shared/ui/useScrollLock';
import { HeaderBar } from './sections/HeaderBar';
import { HeroCard } from './sections/HeroCard';
import { AboutSection } from './sections/AboutSection';
import { LocationSection } from './sections/LocationSection';
import { VisibilitySection } from './sections/VisibilitySection';
import { PrivacySection } from './sections/PrivacySection';
import { SendPermSection } from './sections/SendPermSection';
import { FooterBar } from './sections/FooterBar';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createStyles } from './styles';
import type { CreateGroupLayoutProps } from './types';

export default function CreateGroupLayout({
  name,
  description,
  placeType,
  anchorLabel,
  privacy,
  radiusKm,
  anchorCoords,
  sendPerm,
  sendMediaPerm,
  locationGranted,
  isSubmitting,
  canSubmit,
  onNameChange,
  onDescriptionChange,
  onPlaceTypeChange,
  onAnchorLabelChange,
  onPrivacyChange,
  onRadiusChange,
  onAnchorCoordsChange,
  onSendPermChange,
  onSendMediaPermChange,
  onSubmit,
  onClose,
}: CreateGroupLayoutProps) {
  const styles = useThemedStyles(createStyles);
  // The embedded map and the form ScrollView compete for pan gestures at this
  // small size, so we lock vertical scroll while a finger is on the map.
  const { scrollEnabled, lock, unlock } = useScrollLock();
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <HeaderBar onClose={onClose} />
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
        >
          <HeroCard />
          <AboutSection
            name={name}
            description={description}
            onNameChange={onNameChange}
            onDescriptionChange={onDescriptionChange}
          />
          <LocationSection
            placeType={placeType}
            anchorLabel={anchorLabel}
            locationGranted={locationGranted}
            onPlaceTypeChange={onPlaceTypeChange}
            onAnchorLabelChange={onAnchorLabelChange}
          />
          <VisibilitySection
            radiusKm={radiusKm}
            anchorCoords={anchorCoords}
            onChange={onRadiusChange}
            onAnchorCoordsChange={onAnchorCoordsChange}
            onMapInteractStart={lock}
            onMapInteractEnd={unlock}
          />
          <PrivacySection value={privacy} onChange={onPrivacyChange} />
          <SendPermSection
            sendPerm={sendPerm}
            sendMediaPerm={sendMediaPerm}
            onSendPermChange={onSendPermChange}
            onSendMediaPermChange={onSendMediaPermChange}
          />
          <View style={{ height: 8 }} />
        </ScrollView>
        <FooterBar
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderBar } from './sections/HeaderBar';
import { HeroCard } from './sections/HeroCard';
import { AboutSection } from './sections/AboutSection';
import { LocationSection } from './sections/LocationSection';
import { VisibilitySection } from './sections/VisibilitySection';
import { PrivacySection } from './sections/PrivacySection';
import { SendPermSection } from './sections/SendPermSection';
import { FooterBar } from './sections/FooterBar';
import { styles } from './styles';
import type { CreateGroupLayoutProps } from './types';

export default function CreateGroupLayout({
  name,
  description,
  placeType,
  anchorLabel,
  privacy,
  radiusKm,
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
  onSendPermChange,
  onSendMediaPermChange,
  onSubmit,
  onClose,
}: CreateGroupLayoutProps) {
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
          <VisibilitySection radiusKm={radiusKm} onChange={onRadiusChange} />
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

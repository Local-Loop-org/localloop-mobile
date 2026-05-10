import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GroupPrivacy } from '@localloop/shared-types';
import { SectionLabel } from '../atoms/SectionLabel';
import { PRIVACY_OPTIONS, PrivacyCard } from '../components/PrivacyCard';

interface PrivacySectionProps {
  value: GroupPrivacy;
  onChange?: (value: GroupPrivacy) => void;
  /** When true, render only the selected privacy as a flat info card. */
  readOnly?: boolean;
}

export function PrivacySection({ value, onChange, readOnly }: PrivacySectionProps) {
  if (readOnly) {
    const selected =
      PRIVACY_OPTIONS.find((o) => o.value === value) ?? PRIVACY_OPTIONS[0];
    return (
      <View>
        <SectionLabel label="PRIVACIDADE" />
        <PrivacyCard option={selected} selected readOnly />
      </View>
    );
  }

  return (
    <View>
      <SectionLabel label="PRIVACIDADE" />
      <View style={styles.stack}>
        {PRIVACY_OPTIONS.map((option) => (
          <PrivacyCard
            key={option.value}
            option={option}
            selected={option.value === value}
            onPress={onChange}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 8,
  },
});

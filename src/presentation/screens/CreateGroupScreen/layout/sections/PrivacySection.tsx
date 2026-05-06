import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GroupPrivacy } from '@localloop/shared-types';
import { SectionLabel } from '../atoms/SectionLabel';
import { PRIVACY_OPTIONS, PrivacyCard } from '../components/PrivacyCard';

interface PrivacySectionProps {
  value: GroupPrivacy;
  onChange: (value: GroupPrivacy) => void;
}

export function PrivacySection({ value, onChange }: PrivacySectionProps) {
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

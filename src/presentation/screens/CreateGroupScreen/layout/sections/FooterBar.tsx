import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GradientButton } from '../atoms/GradientButton';

interface FooterBarProps {
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function FooterBar({ canSubmit, isSubmitting, onSubmit }: FooterBarProps) {
  return (
    <View style={styles.bar}>
      <GradientButton
        label="Criar grupo"
        leadingIcon="check"
        disabled={!canSubmit}
        loading={isSubmitting}
        onPress={onSubmit}
        testID="create-group-submit"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createTypography } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createStyles } from './styles';
import { LoginLayoutProps } from './types';

export default function LoginLayout({ loading, onGoogleLogin, onAppleLogin }: LoginLayoutProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const typography = createTypography(colors);
  return (
    <LinearGradient colors={[colors.background, colors.surface]} style={styles.container}>
      <View style={styles.header}>
        <Text style={[typography.h1, styles.title]}>LocalLoop</Text>
        <Text style={typography.body}>Conecte-se com o que está perto.</Text>
      </View>

      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : (
          <>
            <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={onGoogleLogin}>
              <Text style={styles.buttonText}>Continuar com Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.appleButton]} onPress={onAppleLogin}>
              <Text style={[styles.buttonText, { color: colors.white }]}>Continuar com Apple</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </LinearGradient>
  );
}

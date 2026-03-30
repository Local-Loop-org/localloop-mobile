// src/presentation/screens/LoginScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuthStore } from '@/application/stores/auth.store';
import { authApi } from '@/infra/api/auth.api';
import { colors, spacing, typography } from '@/shared/theme';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '@/infra/supabase/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleGoogleLogin = async () => {
  try {
    setLoading(true);

    const redirectUrl = Linking.createURL('auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;

    // Open the browser and wait for the user to return
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type === 'success' && result.url) {
      const fragment = result.url.split('#')[1];
      if (!fragment) {
        console.error('No tokens found in URL fragment');
        return;
      }
      // Create an object from the fragment string (access_token=foo&refresh_token=bar)
      const params = Object.fromEntries(new URLSearchParams(fragment));
      
      const accessToken = params?.access_token as string;
      const refreshToken = params?.refresh_token as string;

      if (accessToken && refreshToken) {
        // 2. Manually set the session in Supabase
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        console.log('sessionError', sessionError);
        if (sessionError) throw sessionError;

        console.log('sessionData', sessionData);

        // 3. Now get the session as usual and talk to your backend
        if (sessionData.session) {
          const res = await authApi.loginWithGoogle(sessionData.session.access_token);
          console.log('res', res);
          await setAuth(res.user, res.accessToken, res.refreshToken, res.isNewUser);
          console.log('setAuth');
        }
      }
    }
  } catch (error) {
    console.error('Detailed login error:', error);
    Alert.alert('Erro', 'Falha ao fazer login com Google');
  } finally {
    setLoading(false);
  }
};
  const handleAppleLogin = async () => {
    try {
      setLoading(true);

      const redirectUrl = Linking.createURL('auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

      if (error) throw error;

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const res = await authApi.loginWithApple(session.access_token, ''); // identityToken not used with Supabase direct session
        await setAuth(res.user, res.accessToken, res.refreshToken, res.isNewUser);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao fazer login com Apple');
    } finally {
      setLoading(false);
    }
  };

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
            <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={handleGoogleLogin}>
              <Text style={styles.buttonText}>Continuar com Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.appleButton]} onPress={handleAppleLogin}>
              <Text style={[styles.buttonText, { color: colors.white }]}>Continuar com Apple</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 100,
    alignItems: 'center',
  },
  title: {
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  footer: {
    marginBottom: spacing.xxl,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  googleButton: {
    backgroundColor: colors.white,
  },
  appleButton: {
    backgroundColor: colors.black,
  },
  buttonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.black,
  },
});

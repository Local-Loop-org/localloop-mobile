import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '@/application/stores/auth.store';
import { authApi } from '@/infra/api/auth.api';
import { supabase } from '@/infra/supabase/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

export function useAuthLogin() {
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

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success' && result.url) {
        const fragment = result.url.split('#')[1];
        if (!fragment) {
          console.error('No tokens found in URL fragment');
          return;
        }
        const params = Object.fromEntries(new URLSearchParams(fragment));

        const accessToken = params?.access_token as string;
        const refreshToken = params?.refresh_token as string;

        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;

          if (sessionData.session) {
            const res = await authApi.loginWithGoogle(sessionData.session.access_token);
            await setAuth(res.user, res.accessToken, res.refreshToken, res.isNewUser);
          }
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
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
        const res = await authApi.loginWithApple(session.access_token);
        await setAuth(res.user, res.accessToken, res.refreshToken, res.isNewUser);
      }
    } catch (error) {
      console.error('Apple login error:', error);
      Alert.alert('Erro', 'Falha ao fazer login com Apple');
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleGoogleLogin, handleAppleLogin };
}

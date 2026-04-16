import React from 'react';
import { useAuthLogin } from '@/application/hooks/useAuthLogin';
import LoginLayout from './layout';

export default function LoginScreen() {
  const { loading, handleGoogleLogin, handleAppleLogin } = useAuthLogin();

  return (
    <LoginLayout
      loading={loading}
      onGoogleLogin={handleGoogleLogin}
      onAppleLogin={handleAppleLogin}
    />
  );
}

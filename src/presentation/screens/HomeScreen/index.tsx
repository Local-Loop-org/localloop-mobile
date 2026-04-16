import React from 'react';
import { useAuthStore } from '@/application/stores/auth.store';
import HomeLayout from './layout';

export default function HomeScreen() {
  const { user, logout } = useAuthStore();

  return (
    <HomeLayout
      displayName={user?.displayName}
      onLogout={logout}
    />
  );
}

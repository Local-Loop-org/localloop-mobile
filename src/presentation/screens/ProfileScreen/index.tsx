import React, { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { DmPermission } from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import { useUserProfile } from '@/application/hooks/useUserProfile';
import { useUpdateUserProfile } from '@/application/hooks/useUpdateUserProfile';
import ProfileLayout from './layout';
import type { DmException, LanguageCode, ThemeMode } from './types';

const SUGGESTED_EXCEPTIONS: DmException[] = [
  { id: 'marina',  name: 'Marina Souza',    hint: 'Café da Esquina' },
  { id: 'lucas',   name: 'Lucas Hideki',    hint: 'Pet Vila Madalena' },
  { id: 'beatriz', name: 'Beatriz Lima',    hint: 'Corrida Ibirapuera' },
  { id: 'rafael',  name: 'Rafael Cordeiro', hint: 'Edifício Aurora' },
  { id: 'julia',   name: 'Júlia Tanaka',    hint: 'Café da Esquina' },
];

const COMING_SOON = 'Em breve';
const COMING_SOON_BODY = 'Esta funcionalidade ainda não está disponível.';

export default function ProfileScreen() {
  const fallbackUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const profileQuery = useUserProfile();
  const updateMutation = useUpdateUserProfile();

  const profile = profileQuery.data;
  const displayName = profile?.displayName ?? fallbackUser?.displayName ?? '';
  const avatarUrl = profile?.avatarUrl ?? fallbackUser?.avatarUrl ?? null;
  const dmPermission = profile?.dmPermission ?? fallbackUser?.dmPermission ?? DmPermission.MEMBERS;
  const createdAt = profile?.createdAt ?? null;

  // Local-only state: backend support deferred (radius preference, push provider,
  // theming/i18n, DM exception list). See plan's "Out of scope".
  const [radiusKm, setRadiusKm] = useState(2);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [language, setLanguage] = useState<LanguageCode>('pt');
  const [exceptionIds, setExceptionIds] = useState<string[]>([]);

  const dmExceptions = useMemo(
    () => SUGGESTED_EXCEPTIONS.filter((e) => exceptionIds.includes(e.id)),
    [exceptionIds],
  );
  const candidateExceptions = useMemo(
    () => SUGGESTED_EXCEPTIONS.filter((e) => !exceptionIds.includes(e.id)),
    [exceptionIds],
  );

  const handleChangeName = (next: string) => {
    if (!next || next === displayName) return;
    updateMutation.mutate({ displayName: next });
  };

  const handleChangeDm = (next: DmPermission) => {
    if (next === dmPermission) return;
    updateMutation.mutate({ dmPermission: next });
  };

  const handleComingSoon = () => Alert.alert(COMING_SOON, COMING_SOON_BODY);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'A exclusão de conta ainda não está disponível.',
    );
  };

  return (
    <ProfileLayout
      displayName={displayName}
      avatarUrl={avatarUrl}
      createdAt={createdAt}
      dmPermission={dmPermission}
      dmExceptions={dmExceptions}
      candidateExceptions={candidateExceptions}
      radiusKm={radiusKm}
      notificationsEnabled={notificationsEnabled}
      theme={theme}
      language={language}
      isSavingName={updateMutation.isPending}
      isSavingDm={updateMutation.isPending}
      onChangeName={handleChangeName}
      onChangeAvatar={handleComingSoon}
      onChangeDmPermission={handleChangeDm}
      onAddDmException={(id) => setExceptionIds((prev) => [...prev, id])}
      onRemoveDmException={(id) =>
        setExceptionIds((prev) => prev.filter((x) => x !== id))
      }
      onChangeRadius={setRadiusKm}
      onToggleNotifications={setNotificationsEnabled}
      onChangeTheme={setTheme}
      onChangeLanguage={setLanguage}
      onPressPrivacy={handleComingSoon}
      onLogout={() => logout()}
      onDeleteAccount={handleDeleteAccount}
    />
  );
}

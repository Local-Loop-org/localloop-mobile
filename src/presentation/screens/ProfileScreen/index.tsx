import React, { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DmPermission, PushPermissionStatus } from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import { usePreferencesStore } from '@/application/stores/preferences.store';
import {
  PushPermissionDeniedError,
  usePushNotifications,
} from '@/application/hooks/usePushNotifications/usePushNotifications';
import { useDmExceptions } from '@/application/hooks/useDmExceptions/useDmExceptions';
import { useRemoveDmException } from '@/application/hooks/useRemoveDmException/useRemoveDmException';
import { useUserProfile } from '@/application/hooks/useUserProfile/useUserProfile';
import { useUpdateUserProfile } from '@/application/hooks/useUpdateUserProfile/useUpdateUserProfile';
import ProfileLayout from './layout';
import type { HomeTabsScreenProps } from '@/presentation/navigation/types';
import type { DmException, LanguageCode, ThemeMode } from './types';

const COMING_SOON = 'Em breve';
const COMING_SOON_BODY = 'Esta funcionalidade ainda não está disponível.';

export default function ProfileScreen() {
  const navigation = useNavigation<HomeTabsScreenProps<'Profile'>['navigation']>();
  const fallbackUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const profileQuery = useUserProfile();
  const updateMutation = useUpdateUserProfile();
  const pushNotifications = usePushNotifications();

  const profile = profileQuery.data;
  const displayName = profile?.displayName ?? fallbackUser?.displayName ?? '';
  const avatarUrl = profile?.avatarUrl ?? fallbackUser?.avatarUrl ?? null;
  const dmPermission = profile?.dmPermission ?? fallbackUser?.dmPermission ?? DmPermission.MEMBERS;
  const pushPermissionStatus =
    profile?.pushPermissionStatus ?? fallbackUser?.pushPermissionStatus ?? null;
  const createdAt = profile?.createdAt ?? null;

  const radiusKm = usePreferencesStore((s) => s.discoveryRadiusKm);
  const setDiscoveryRadiusKm = usePreferencesStore((s) => s.setDiscoveryRadiusKm);
  const dmExceptionsVisible = dmPermission !== DmPermission.EVERYONE;
  const exceptionsQuery = useDmExceptions({ enabled: dmExceptionsVisible });
  const removeDmExceptionMutation = useRemoveDmException();

  // Local-only state: backend support deferred for theming and i18n.
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [language, setLanguage] = useState<LanguageCode>('pt');

  const dmExceptions = useMemo(
    () =>
      exceptionsQuery.exceptions.map<DmException>((exception) => ({
        id: exception.peerId,
        name: exception.displayName,
        avatarUrl: exception.avatarUrl,
        createdAt: exception.createdAt,
      })),
    [exceptionsQuery.exceptions],
  );

  const handleChangeName = (next: string) => {
    if (!next || next === displayName) return;
    updateMutation.mutate({ displayName: next });
  };

  const handleChangeDm = (next: DmPermission) => {
    if (next === dmPermission) return;
    updateMutation.mutate({ dmPermission: next });
  };

  const handleCommitRadius = (next: number) => {
    if (next === radiusKm) return;
    void setDiscoveryRadiusKm(next);
  };

  const handleRemoveDmException = (id: string) => {
    removeDmExceptionMutation.mutate(id, {
      onError: () => {
        Alert.alert('Erro', 'Não foi possível revogar a exceção de DM.');
      },
    });
  };

  const handleComingSoon = () => Alert.alert(COMING_SOON, COMING_SOON_BODY);

  const handleToggleNotifications = async (next: boolean) => {
    try {
      if (next) {
        await pushNotifications.enableFromProfile();
        return;
      }
      await pushNotifications.disableFromProfile();
    } catch (err) {
      if (err instanceof PushPermissionDeniedError) {
        Alert.alert(
          'Permissão bloqueada',
          'Ative as notificações do LocalLoop nas configurações do sistema para receber avisos.',
        );
        return;
      }
      Alert.alert('Erro', 'Não foi possível atualizar as notificações.');
    }
  };

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
      dmExceptionsVisible={dmExceptionsVisible}
      dmExceptionsLoading={exceptionsQuery.isLoading}
      dmExceptionsLoadingMore={exceptionsQuery.isFetchingNextPage}
      dmExceptionsError={exceptionsQuery.isError}
      dmExceptionsHasMore={exceptionsQuery.hasNextPage}
      radiusKm={radiusKm}
      notificationsEnabled={
        pushPermissionStatus === PushPermissionStatus.GRANTED
      }
      theme={theme}
      language={language}
      isSavingName={updateMutation.isPending}
      isSavingDm={updateMutation.isPending}
      onChangeName={handleChangeName}
      onChangeAvatar={handleComingSoon}
      onChangeDmPermission={handleChangeDm}
      onRemoveDmException={handleRemoveDmException}
      onLoadMoreDmExceptions={exceptionsQuery.loadMore}
      onCommitRadius={handleCommitRadius}
      onToggleNotifications={handleToggleNotifications}
      onChangeTheme={setTheme}
      onChangeLanguage={setLanguage}
      onPressPrivacy={handleComingSoon}
      onPressBack={() => navigation.goBack()}
      onLogout={() => logout()}
      onDeleteAccount={handleDeleteAccount}
    />
  );
}

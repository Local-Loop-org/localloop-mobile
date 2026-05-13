import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { PushPermissionStatus } from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import { pushApi } from '@/infra/api/push.api';
import type { UserProfileResponse } from '@/infra/api/user.api';
import {
  addPushTokenListener,
  buildPushRegistration,
  getPermissionState,
  preparePushNotifications,
  PushPermissionDeniedError,
  requestPermissionState,
} from '@/infra/notifications/push-notifications';
import { USER_PROFILE_KEY } from './useUserProfile';

export { PushPermissionDeniedError };

function isGranted(status: Notifications.PermissionStatus): boolean {
  return status === Notifications.PermissionStatus.GRANTED;
}

function isDenied(status: Notifications.PermissionStatus): boolean {
  return status === Notifications.PermissionStatus.DENIED;
}

export function usePushNotifications() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const accessToken = useAuthStore((s) => s.accessToken);

  const setCachedPermissionStatus = useCallback(
    async (status: PushPermissionStatus) => {
      queryClient.setQueryData<UserProfileResponse | undefined>(
        USER_PROFILE_KEY,
        (old) => (old ? { ...old, pushPermissionStatus: status } : old),
      );
      await updateUser({ pushPermissionStatus: status });
    },
    [queryClient, updateUser],
  );

  const registerMutation = useMutation<void, Error, string | undefined>({
    mutationFn: async (tokenOverride) => {
      const registration = await buildPushRegistration(tokenOverride);
      await pushApi.registerCurrentDevice(registration);
    },
    onSuccess: async () => {
      await setCachedPermissionStatus(PushPermissionStatus.GRANTED);
    },
  });

  const deniedMutation = useMutation<void, Error>({
    mutationFn: () => pushApi.updatePermission(PushPermissionStatus.DENIED),
    onSuccess: async () => {
      await setCachedPermissionStatus(PushPermissionStatus.DENIED);
    },
  });

  const disableMutation = useMutation<void, Error>({
    mutationFn: () => pushApi.updatePermission(PushPermissionStatus.DISABLED),
    onSuccess: async () => {
      await setCachedPermissionStatus(PushPermissionStatus.DISABLED);
    },
  });

  const registerGrantedDevice = useCallback(
    (tokenOverride?: string) => registerMutation.mutateAsync(tokenOverride),
    [registerMutation],
  );

  const markDenied = useCallback(
    () => deniedMutation.mutateAsync(),
    [deniedMutation],
  );

  const bootstrapIfUnasked = useCallback(
    async (status: PushPermissionStatus | null | undefined) => {
      if (!accessToken) return;
      if (status !== null && status !== undefined) return;

      await preparePushNotifications();
      const current = await getPermissionState();
      if (isGranted(current.status)) {
        await registerGrantedDevice();
        return;
      }
      if (isDenied(current.status)) {
        await markDenied();
        return;
      }

      const requested = await requestPermissionState();
      if (isGranted(requested.status)) {
        await registerGrantedDevice();
        return;
      }
      await markDenied();
    },
    [accessToken, markDenied, registerGrantedDevice],
  );

  const enableFromProfile = useCallback(async () => {
    await preparePushNotifications();
    const current = await getPermissionState();
    let finalStatus = current.status;

    if (!isGranted(current.status)) {
      if (isDenied(current.status) && current.canAskAgain === false) {
        await markDenied();
        throw new PushPermissionDeniedError();
      }
      finalStatus = (await requestPermissionState()).status;
    }

    if (!isGranted(finalStatus)) {
      await markDenied();
      throw new PushPermissionDeniedError();
    }
    await registerGrantedDevice();
  }, [markDenied, registerGrantedDevice]);

  const disableFromProfile = useCallback(
    () => disableMutation.mutateAsync(),
    [disableMutation],
  );

  const listenForTokenChanges = useCallback(() => {
    if (!accessToken) return undefined;
    return addPushTokenListener((token) => {
      registerMutation.mutate(token);
    });
  }, [accessToken, registerMutation]);

  return {
    bootstrapIfUnasked,
    enableFromProfile,
    disableFromProfile,
    listenForTokenChanges,
    isRegistering: registerMutation.isPending,
    isUpdatingPermission:
      deniedMutation.isPending || disableMutation.isPending,
  };
}

export function useHomePushBootstrap(
  status: PushPermissionStatus | null | undefined,
  enabled: boolean,
) {
  const bootstrapped = useRef(false);
  const { bootstrapIfUnasked, listenForTokenChanges } = usePushNotifications();

  useEffect(() => {
    if (!enabled) return;
    if (bootstrapped.current) return;
    if (status !== null && status !== undefined) return;
    bootstrapped.current = true;
    bootstrapIfUnasked(status).catch((err) => {
      console.warn('[push] bootstrap failed', err);
    });
  }, [bootstrapIfUnasked, enabled, status]);

  useEffect(() => {
    if (!enabled) return;
    if (status !== PushPermissionStatus.GRANTED) return;
    const subscription = listenForTokenChanges();
    return () => subscription?.remove();
  }, [enabled, listenForTokenChanges, status]);
}

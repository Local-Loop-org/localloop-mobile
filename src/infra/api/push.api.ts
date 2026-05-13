import {
  DevicePlatform,
  PushPermissionStatus,
  PushProvider,
} from '@localloop/shared-types';
import { apiClient } from './api-client';

export interface RegisterPushDeviceBody {
  installationId: string;
  provider: PushProvider;
  platform: DevicePlatform;
  token: string;
}

export const pushApi = {
  registerCurrentDevice: async (
    body: RegisterPushDeviceBody,
  ): Promise<void> => {
    await apiClient.put('/users/me/push-devices/current', body);
  },

  disableCurrentDevice: async (body: {
    installationId: string;
    provider: PushProvider;
  }): Promise<void> => {
    await apiClient.delete('/users/me/push-devices/current', {
      params: body,
    });
  },

  updatePermission: async (
    status: PushPermissionStatus.DENIED | PushPermissionStatus.DISABLED,
  ): Promise<void> => {
    await apiClient.patch('/users/me/push-permission', { status });
  },
};

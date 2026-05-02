import type { DmPermission } from '@localloop/shared-types';

export interface DmException {
  id: string;
  name: string;
  hint: string;
}

export type ThemeMode = 'dark' | 'light';
export type LanguageCode = 'pt' | 'en';

export interface RadiusOption {
  km: number;
  label: string;
}

export const RADIUS_PRESETS: RadiusOption[] = [
  { km: 0.5, label: '500M' },
  { km: 1, label: '1KM' },
  { km: 2, label: '2KM' },
  { km: 5, label: '5KM' },
  { km: 10, label: '10KM' },
  { km: 25, label: '25KM' },
];

export const DM_PERMISSION_LABEL: Record<DmPermission, string> = {
  everyone: 'Todos',
  members: 'Mesmo grupo',
  nobody: 'Ninguém',
};

import type { DmPermission } from '@localloop/shared-types';
import type {
  DmException,
  LanguageCode,
  ThemeMode,
} from '../types';

export interface ProfileLayoutProps {
  displayName: string;
  avatarUrl: string | null;
  createdAt: string | null;
  dmPermission: DmPermission;
  dmExceptions: DmException[];
  candidateExceptions: DmException[];
  radiusKm: number;
  notificationsEnabled: boolean;
  theme: ThemeMode;
  language: LanguageCode;
  isSavingName: boolean;
  isSavingDm: boolean;

  onChangeName: (next: string) => void;
  onChangeAvatar: () => void;
  onChangeDmPermission: (next: DmPermission) => void;
  onAddDmException: (id: string) => void;
  onRemoveDmException: (id: string) => void;
  onChangeRadius: (km: number) => void;
  onToggleNotifications: (next: boolean) => void;
  onChangeTheme: (next: ThemeMode) => void;
  onChangeLanguage: (next: LanguageCode) => void;
  onPressPrivacy: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

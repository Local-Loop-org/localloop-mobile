import type { DmPermission } from '@localloop/shared-types';
import type {
  DmException,
  DmExceptionPickCandidate,
  LanguageCode,
  ThemeMode,
} from '../types';

export interface ProfileLayoutProps {
  displayName: string;
  avatarUrl: string | null;
  createdAt: string | null;
  dmPermission: DmPermission;
  dmExceptions: DmException[];
  dmExceptionsVisible: boolean;
  dmExceptionsLoading: boolean;
  dmExceptionsLoadingMore: boolean;
  dmExceptionsError: boolean;
  dmExceptionsHasMore: boolean;
  dmExceptionCandidates: DmExceptionPickCandidate[];
  dmExceptionCandidatesLoading: boolean;
  dmExceptionCandidatesLoadingMore: boolean;
  dmExceptionCandidatesError: boolean;
  dmExceptionCandidatesErrorLabel: string | null;
  dmExceptionCandidatesHasMore: boolean;
  dmExceptionAddPendingId: string | null;
  radiusKm: number;
  notificationsEnabled: boolean;
  theme: ThemeMode;
  language: LanguageCode;
  isSavingName: boolean;
  isSavingDm: boolean;

  onChangeName: (next: string) => void;
  onChangeAvatar: () => void;
  onChangeDmPermission: (next: DmPermission) => void;
  onRemoveDmException: (id: string) => void;
  onLoadMoreDmExceptions: () => void;
  onAddDmException: (candidate: DmExceptionPickCandidate) => void;
  onLoadMoreDmExceptionCandidates: () => void;
  onCommitRadius: (km: number) => void;
  onToggleNotifications: (next: boolean) => void;
  onChangeTheme: (next: ThemeMode) => void;
  onChangeLanguage: (next: LanguageCode) => void;
  onPressPrivacy: () => void;
  onPressBack: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

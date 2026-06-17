import {
  AnchorType,
  GroupPrivacy,
  MessagePermission,
} from '@localloop/shared-types';
import type { Coords } from '@/application/hooks/useCurrentLocation/useCurrentLocation';

export interface CreateGroupLayoutProps {
  name: string;
  description: string;
  placeType: AnchorType;
  anchorLabel: string;
  privacy: GroupPrivacy;
  /** Group anchor picked on the map; `null` until device location resolves. */
  anchorCoords: Coords | null;
  /**
   * `radiusKm` is wired through the layout but not yet persisted to the API
   * (dropped at submit time). `sendPerm`/`sendMediaPerm` are submitted as
   * `sendTextPerm`/`sendMediaPerm`.
   */
  radiusKm: number;
  sendPerm: MessagePermission;
  sendMediaPerm: MessagePermission;

  locationGranted: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;

  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPlaceTypeChange: (value: AnchorType) => void;
  onAnchorLabelChange: (value: string) => void;
  onPrivacyChange: (value: GroupPrivacy) => void;
  onRadiusChange: (value: number) => void;
  onAnchorCoordsChange: (coords: Coords) => void;
  onSendPermChange: (value: MessagePermission) => void;
  onSendMediaPermChange: (value: MessagePermission) => void;

  onSubmit: () => void;
  onClose: () => void;
}

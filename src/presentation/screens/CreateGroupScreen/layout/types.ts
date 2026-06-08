import { AnchorType, GroupPrivacy } from '@localloop/shared-types';
import type { Coords } from '@/application/hooks/useCurrentLocation/useCurrentLocation';
import type { SendPermValue } from './components/SendPermPicker';

export type { SendPermValue };

export interface CreateGroupLayoutProps {
  name: string;
  description: string;
  placeType: AnchorType;
  anchorLabel: string;
  privacy: GroupPrivacy;
  /** Group anchor picked on the map; `null` until device location resolves. */
  anchorCoords: Coords | null;
  /**
   * Local-only state (not yet persisted to the API). Wired through the layout
   * so the controls behave correctly; dropped at submit time. Tracked under
   * the `feedback_create_group_local_only_fields` memory.
   */
  radiusKm: number;
  sendPerm: SendPermValue;
  sendMediaPerm: SendPermValue;

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
  onSendPermChange: (value: SendPermValue) => void;
  onSendMediaPermChange: (value: SendPermValue) => void;

  onSubmit: () => void;
  onClose: () => void;
}

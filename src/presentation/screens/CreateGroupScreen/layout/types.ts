import { AnchorType, GroupPrivacy } from '@localloop/shared-types';

export interface CreateGroupLayoutProps {
  name: string;
  description: string;
  anchorType: AnchorType;
  anchorLabel: string;
  privacy: GroupPrivacy;
  locationGranted: boolean;
  isSubmitting: boolean;

  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAnchorTypeChange: (value: AnchorType) => void;
  onAnchorLabelChange: (value: string) => void;
  onPrivacyChange: (value: GroupPrivacy) => void;
  onRequestLocation: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

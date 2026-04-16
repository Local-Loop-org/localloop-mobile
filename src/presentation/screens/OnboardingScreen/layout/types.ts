export interface OnboardingLayoutProps {
  displayName: string;
  locationGranted: boolean;
  onDisplayNameChange: (value: string) => void;
  onRequestLocation: () => void;
  onFinish: () => void;
}

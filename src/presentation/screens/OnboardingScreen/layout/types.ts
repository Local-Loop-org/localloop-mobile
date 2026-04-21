export interface OnboardingLayoutProps {
  displayName: string;
  locationGranted: boolean;
  isLoading: boolean;
  onDisplayNameChange: (value: string) => void;
  onRequestLocation: () => void;
  onFinish: () => void;
}

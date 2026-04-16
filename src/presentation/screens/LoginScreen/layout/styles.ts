import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/shared/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 100,
    alignItems: 'center',
  },
  title: {
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  footer: {
    marginBottom: spacing.xxl,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  googleButton: {
    backgroundColor: colors.white,
  },
  appleButton: {
    backgroundColor: colors.black,
  },
  buttonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.black,
  },
});

import { StyleSheet } from 'react-native';
import { colors, spacing } from '@/shared/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  logoutBtn: {
    padding: spacing.md,
  },
  logoutBtnText: {
    color: colors.error,
    fontWeight: '600',
  },
});

import { StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '@/shared/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: 16,
  },
  errorText: {
    color: colors.text,
    fontSize: 15,
    textAlign: 'center',
  },
  errorBack: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
  },
  errorBackText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 30,
  },
  joinWrap: {
    marginTop: 22,
  },
  joinHint: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    color: colors.faint,
    letterSpacing: 0.6,
    textAlign: 'center',
    marginTop: 8,
  },
});

import { StyleSheet } from 'react-native';
import { colors, fonts } from '@/shared/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * Pad the title block by the back button's width (36) plus the header gap (12)
   * so the title stays optically centered without a right-side spacer view.
   */
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
    paddingRight: 48,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    color: colors.dim,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chipsScrollOuter: {
    flexGrow: 0,
  },
  chipsRow: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    fontSize: 13,
  },
  loaderWrap: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  footerNote: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    color: colors.faint,
    letterSpacing: 0.6,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 14,
  },
});

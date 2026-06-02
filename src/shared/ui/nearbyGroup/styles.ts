import { StyleSheet } from 'react-native';
import { colors, spacing } from '@/shared/theme';

// Shared "nearby group" row + status badge styles. Used by the Home discover
// list and the Map screen's selected-pin card so both render identically.
export const styles = StyleSheet.create({
  row: {
    padding: spacing.sm + 4,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  rowBody: {
    flex: 1,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  rowMeta: {
    fontSize: 11,
    color: colors.faint,
    letterSpacing: 0.4,
    fontWeight: '600',
    marginTop: 2,
  },
  rowLiveMeta: {
    color: colors.success,
    fontWeight: '700',
  },

  // Status badge (Entrar / Solicitar / Conversar / Aguardando)
  cardJoinBtn: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: 'rgba(112, 0, 255, 0.08)',
  },
  cardJoinText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 0.2,
  },
  cardRequestBtn: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 209, 255, 0.08)',
  },
  cardRequestText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.2,
  },
  cardMemberBtn: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
  },
  cardMemberText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.2,
  },
  cardPendingBtn: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardPendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.faint,
    letterSpacing: 0.2,
  },
});

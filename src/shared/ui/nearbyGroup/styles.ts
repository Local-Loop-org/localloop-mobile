import { StyleSheet } from 'react-native';
import { spacing, type ThemeColors } from '@/shared/theme';

// Shared "nearby group" row + status badge styles. Used by the Home discover
// list and the Map screen's selected-pin card so both render identically.
export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      padding: spacing.sm + 4,
      borderRadius: 14,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
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
      color: c.text,
      letterSpacing: -0.2,
    },
    rowMeta: {
      fontSize: 11,
      color: c.faint,
      letterSpacing: 0.4,
      fontWeight: '600',
      marginTop: 2,
    },
    rowLiveMeta: {
      color: c.success,
      fontWeight: '700',
    },

    // Status badge (Entrar / Solicitar / Conversar / Aguardando)
    cardJoinBtn: {
      paddingVertical: 4,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.secondary,
      backgroundColor: `${c.secondary}14`,
    },
    cardJoinText: {
      fontSize: 11,
      fontWeight: '700',
      color: c.secondary,
      letterSpacing: 0.2,
    },
    cardRequestBtn: {
      paddingVertical: 4,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.primary,
      backgroundColor: c.primarySoft08,
    },
    cardRequestText: {
      fontSize: 11,
      fontWeight: '700',
      color: c.primary,
      letterSpacing: 0.2,
    },
    cardMemberBtn: {
      paddingVertical: 4,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.success,
      backgroundColor: `${c.success}14`,
    },
    cardMemberText: {
      fontSize: 11,
      fontWeight: '700',
      color: c.success,
      letterSpacing: 0.2,
    },
    cardPendingBtn: {
      paddingVertical: 4,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.line,
    },
    cardPendingText: {
      fontSize: 11,
      fontWeight: '600',
      color: c.faint,
      letterSpacing: 0.2,
    },
  });

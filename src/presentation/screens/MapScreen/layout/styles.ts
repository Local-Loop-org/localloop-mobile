import { StyleSheet } from 'react-native';
import { colors, spacing } from '@/shared/theme';

/** Vertical gap from the top of the floating control stack to the action rail. */
export const RAIL_TOP_OFFSET = 138;
/**
 * Bottom offset for the selected-pin card. Mirrors the M6 design's `bottom: 96`
 * (which clears the floating tab bar owned by the navigator) plus the safe-area
 * inset applied per-instance.
 */
export const CARD_BOTTOM_OFFSET = 96;

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
    overflow: 'hidden',
  },
  topStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
  },
  radiusRow: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  rail: {
    position: 'absolute',
    right: spacing.md - 2,
    zIndex: 20,
  },
  cardWrap: {
    position: 'absolute',
    left: spacing.md - 2,
    right: spacing.md - 2,
    zIndex: 30,
  },
});

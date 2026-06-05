import { StyleSheet } from 'react-native';
import { spacing, type ThemeColors } from '@/shared/theme';

const CARD_RADIUS = 14;

/** Vertical gap from the top of the floating control stack to the action rail. */
export const RAIL_TOP_OFFSET = 138;
/**
 * Bottom offset for the selected-pin card. Mirrors the M6 design's `bottom: 96`
 * (which clears the floating tab bar owned by the navigator) plus the safe-area
 * inset applied per-instance.
 */
export const CARD_BOTTOM_OFFSET = 96;

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      // Match the basemap tone so the screen reads as full-bleed map even
      // behind the floating tab bar / before the SVG paints.
      backgroundColor: c.surface,
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
      borderRadius: CARD_RADIUS,
      backgroundColor: c.surface,
      shadowColor: '#000',
      shadowOpacity: 0.5,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    },
  });

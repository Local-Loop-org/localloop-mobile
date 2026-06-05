import React, { useMemo, useRef } from 'react';
import { Animated, PanResponder, View } from 'react-native';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { ReplyGlyph } from './ReplyGlyph';
import { createStyles } from './styles';

const SWIPE_THRESHOLD = 56;
const SWIPE_MAX = 92;
const HORIZONTAL_LOCK_THRESHOLD = 6;

interface SwipeableBubbleProps {
  /** True if the wrapped bubble is the current user's (swipes left).
   * False for peer bubbles (swipes right). */
  me: boolean;
  /** Fired once when the user releases past the threshold. */
  onSwipeReply: () => void;
  children: React.ReactNode;
}

export function SwipeableBubble({
  me,
  onSwipeReply,
  children,
}: SwipeableBubbleProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const currentDx = useRef(0);
  const firedRef = useRef(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Don't capture on touch start — let inner Pressables receive taps.
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) => {
          if (
            Math.abs(gesture.dx) < HORIZONTAL_LOCK_THRESHOLD ||
            Math.abs(gesture.dx) <= Math.abs(gesture.dy)
          ) {
            return false;
          }
          // Only the "natural" direction triggers a reply gesture.
          if (me && gesture.dx > 0) return false;
          if (!me && gesture.dx < 0) return false;
          return true;
        },
        onPanResponderGrant: () => {
          currentDx.current = 0;
          firedRef.current = false;
        },
        onPanResponderMove: (_, gesture) => {
          // Clamp to the natural direction.
          let next = me ? Math.min(0, gesture.dx) : Math.max(0, gesture.dx);
          const abs = Math.abs(next);
          if (abs > SWIPE_MAX) {
            const overshoot = abs - SWIPE_MAX;
            const damped = SWIPE_MAX + overshoot * 0.25;
            next = me ? -damped : damped;
          }
          currentDx.current = next;
          translateX.setValue(next);

          if (
            !firedRef.current &&
            Math.abs(next) >= SWIPE_THRESHOLD
          ) {
            firedRef.current = true;
          } else if (
            firedRef.current &&
            Math.abs(next) < SWIPE_THRESHOLD - 6
          ) {
            firedRef.current = false;
          }
        },
        onPanResponderRelease: () => {
          const passed = Math.abs(currentDx.current) >= SWIPE_THRESHOLD;
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
            speed: 16,
          }).start();
          currentDx.current = 0;
          firedRef.current = false;
          if (passed) onSwipeReply();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
            speed: 16,
          }).start();
          currentDx.current = 0;
          firedRef.current = false;
        },
      }),
    [me, onSwipeReply, translateX],
  );

  const iconOpacity = translateX.interpolate({
    inputRange: me ? [-SWIPE_THRESHOLD, 0] : [0, SWIPE_THRESHOLD],
    outputRange: me ? [1, 0.25] : [0.25, 1],
    extrapolate: 'clamp',
  });
  const iconScale = translateX.interpolate({
    inputRange: me ? [-SWIPE_THRESHOLD, 0] : [0, SWIPE_THRESHOLD],
    outputRange: me ? [1, 0.7] : [0.7, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.swipeWrap}>
      <Animated.View
        pointerEvents='none'
        style={[
          styles.swipeIconReveal,
          me ? styles.swipeIconRevealMe : styles.swipeIconRevealPeer,
          { opacity: iconOpacity, transform: [{ scale: iconScale }] },
        ]}
      >
        <View style={styles.swipeIconTile}>
          <ReplyGlyph size={14} color={colors.primary} strokeWidth={2.2} />
        </View>
      </Animated.View>
      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX }] }}
      >
        {children}
      </Animated.View>
    </View>
  );
}

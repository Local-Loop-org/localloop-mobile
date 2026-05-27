import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { styles } from './styles';

function pulseAnim(delay: number) {
  const value = new Animated.Value(0);
  const loop = Animated.loop(
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(value, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]),
  );
  return { value, loop };
}

export function TypingBubble() {
  const dotsRef = useRef<{ value: Animated.Value; loop: Animated.CompositeAnimation }[] | null>(
    null,
  );
  if (!dotsRef.current) {
    dotsRef.current = [pulseAnim(0), pulseAnim(180), pulseAnim(360)];
  }

  useEffect(() => {
    const dots = dotsRef.current!;
    dots.forEach((d) => d.loop.start());
    return () => {
      dots.forEach((d) => d.loop.stop());
    };
  }, []);

  return (
    <View style={styles.typingRow} testID='typing-bubble'>
      <View style={styles.typingBubble}>
        {dotsRef.current.map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.typingDot,
              {
                opacity: dot.value.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.35, 1],
                }),
                transform: [
                  {
                    scale: dot.value.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

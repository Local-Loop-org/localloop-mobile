import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import type { ThemeColors } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const GLOW_SIZE = 180;

export function HeroCard() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={[colors.duotoneSoftFrom, colors.duotoneSoftTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bg}
      >
        <View style={styles.glowWrap} pointerEvents="none">
          <Svg width={GLOW_SIZE} height={GLOW_SIZE}>
            <Defs>
              <RadialGradient
                id="heroGlow"
                cx="50%"
                cy="50%"
                rx="50%"
                ry="50%"
                fx="50%"
                fy="50%"
              >
                <Stop offset="0%" stopColor={colors.secondary} stopOpacity={0.32} />
                <Stop offset="70%" stopColor={colors.secondary} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={GLOW_SIZE / 2} cy={GLOW_SIZE / 2} r={GLOW_SIZE / 2} fill="url(#heroGlow)" />
          </Svg>
        </View>

        <Text style={styles.title}>
          Crie um <Text style={styles.titleAccent}>novo grupo</Text>
        </Text>
        <Text style={styles.tagline}>
          Defina onde, quem entra e quem fala. Você pode mudar tudo depois.
        </Text>
      </LinearGradient>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  outer: {
    marginTop: 4,
    borderRadius: 22,
    overflow: 'hidden',
    borderColor: colors.anchorTileBorder,
    borderWidth: 1,
  },
  bg: {
    padding: 18,
    position: 'relative',
  },
  glowWrap: {
    position: 'absolute',
    right: -GLOW_SIZE * 0.22,
    top: -GLOW_SIZE * 0.22,
    width: GLOW_SIZE,
    height: GLOW_SIZE,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.6,
    lineHeight: 25,
    marginBottom: 4,
  },
  titleAccent: {
    color: colors.primary,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 12.5,
    color: colors.dim,
    lineHeight: 17,
  },
});

import React from 'react';
import { Text } from 'react-native';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createStyles } from './styles';

interface Props {
  children: string;
}

export default function SectionLabel({ children }: Props) {
  const styles = useThemedStyles(createStyles);
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

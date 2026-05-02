import React from 'react';
import { Text } from 'react-native';
import { styles } from './styles';

interface Props {
  children: string;
}

export default function SectionLabel({ children }: Props) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

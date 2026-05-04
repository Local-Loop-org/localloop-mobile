import React from 'react';
import { TextInput, View } from 'react-native';
import { Icon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { styles } from './styles';

interface Props {
  value: string;
  onChange: (next: string) => void;
}

export function SearchInput({ value, onChange }: Props) {
  return (
    <View style={styles.searchWrap}>
      <View style={styles.searchPill}>
        <Icon name='search' size={14} color={colors.faint} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          value={value}
          onChangeText={onChange}
          placeholder='Buscar nos meus grupos…'
          placeholderTextColor={colors.faint}
          autoCorrect={false}
          autoCapitalize='none'
          accessibilityLabel='Buscar nos meus grupos'
        />
      </View>
    </View>
  );
}

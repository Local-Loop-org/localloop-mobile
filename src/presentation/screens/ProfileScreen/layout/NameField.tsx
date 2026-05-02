import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Icon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { styles } from './styles';

interface Props {
  value: string;
  onChange: (next: string) => void;
}

export default function NameField({ value, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onChange(trimmed);
    else setDraft(value);
  };

  if (editing) {
    return (
      <TextInput
        value={draft}
        autoFocus
        onChangeText={setDraft}
        onSubmitEditing={commit}
        onBlur={commit}
        returnKeyType='done'
        style={styles.nameInput}
        accessibilityLabel='Editar nome de exibição'
      />
    );
  }

  return (
    <Pressable
      onPress={() => {
        setDraft(value);
        setEditing(true);
      }}
      accessibilityRole='button'
      accessibilityLabel='Editar nome'
    >
      <View style={styles.nameViewWrap}>
        <Text style={styles.nameViewText}>{value}</Text>
        <Icon name='edit' size={14} color={colors.textSecondary} />
      </View>
    </Pressable>
  );
}

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '../atoms/Card';
import { SectionLabel } from '../atoms/SectionLabel';
import { FormInput } from '../atoms/FormInput';
import { FormTextArea } from '../atoms/FormTextArea';

interface AboutSectionProps {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function AboutSection({
  name,
  description,
  onNameChange,
  onDescriptionChange,
}: AboutSectionProps) {
  return (
    <View>
      <SectionLabel label="SOBRE O GRUPO" />
      <Card style={styles.body}>
        <FormInput
          value={name}
          onChangeText={onNameChange}
          placeholder="Nome do grupo"
          maxLength={80}
          testID="create-group-name"
        />
        <View style={styles.gap} />
        <FormTextArea
          value={description}
          onChangeText={onDescriptionChange}
          placeholder="Descrição (opcional)"
          maxLength={500}
          rows={3}
          testID="create-group-description"
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: 12,
  },
  gap: {
    height: 8,
  },
});

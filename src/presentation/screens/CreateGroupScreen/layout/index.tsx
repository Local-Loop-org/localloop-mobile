import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { AnchorType, GroupPrivacy } from '@localloop/shared-types';
import { colors } from '@/shared/theme';
import { ANCHOR_TYPE_LABELS } from '@/shared/anchor/labels';
import { styles } from './styles';
import type { CreateGroupLayoutProps } from './types';

const PRIVACY_LABELS: Record<GroupPrivacy, string> = {
  [GroupPrivacy.OPEN]: 'Aberto',
  [GroupPrivacy.APPROVAL_REQUIRED]: 'Requer aprovação',
};

function Chip<T extends string>({
  label,
  value,
  active,
  onPress,
}: {
  label: string;
  value: T;
  active: boolean;
  onPress: (value: T) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.optionChip, active && styles.optionChipActive]}
      onPress={() => onPress(value)}
    >
      <Text
        style={[
          styles.optionChipText,
          active && styles.optionChipTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function CreateGroupLayout({
  name,
  description,
  anchorType,
  anchorLabel,
  privacy,
  locationGranted,
  isSubmitting,
  onNameChange,
  onDescriptionChange,
  onAnchorTypeChange,
  onAnchorLabelChange,
  onPrivacyChange,
  onRequestLocation,
  onSubmit,
  onCancel,
}: CreateGroupLayoutProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Novo grupo</Text>
          <TouchableOpacity onPress={onCancel} disabled={isSubmitting}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Nome do grupo</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={onNameChange}
          placeholder="Ex: Corredores do Ibirapuera"
          placeholderTextColor={colors.textSecondary}
          maxLength={80}
        />

        <Text style={styles.label}>Descrição (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={onDescriptionChange}
          placeholder="Para que serve este grupo?"
          placeholderTextColor={colors.textSecondary}
          maxLength={500}
          multiline
        />

        <Text style={styles.label}>Tipo de âncora</Text>
        <View style={styles.optionsRow}>
          {Object.values(AnchorType).map((type) => (
            <Chip
              key={type}
              label={ANCHOR_TYPE_LABELS[type]}
              value={type}
              active={anchorType === type}
              onPress={onAnchorTypeChange}
            />
          ))}
        </View>

        <Text style={styles.label}>Nome da âncora</Text>
        <TextInput
          style={styles.input}
          value={anchorLabel}
          onChangeText={onAnchorLabelChange}
          placeholder="Ex: Parque Ibirapuera"
          placeholderTextColor={colors.textSecondary}
          maxLength={100}
        />

        <Text style={styles.label}>Privacidade</Text>
        <View style={styles.optionsRow}>
          {Object.values(GroupPrivacy).map((p) => (
            <Chip
              key={p}
              label={PRIVACY_LABELS[p]}
              value={p}
              active={privacy === p}
              onPress={onPrivacyChange}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.locationBtn,
            locationGranted && styles.locationBtnGranted,
          ]}
          onPress={onRequestLocation}
          disabled={isSubmitting}
        >
          <Text style={styles.locationBtnText}>
            {locationGranted
              ? 'Localização capturada ✅'
              : 'Capturar minha localização 📍'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.black} />
          ) : (
            <Text style={styles.submitBtnText}>Criar grupo</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

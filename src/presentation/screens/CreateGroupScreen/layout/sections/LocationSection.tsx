import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AnchorType } from '@localloop/shared-types';
import { Card } from '../atoms/Card';
import { SectionLabel } from '../atoms/SectionLabel';
import { FieldLabel } from '../atoms/FieldLabel';
import { FormInput } from '../atoms/FormInput';
import { PlaceTypeChips } from '../components/PlaceTypeChips';

interface LocationSectionProps {
  placeType: AnchorType;
  anchorLabel: string;
  locationGranted: boolean;
  onPlaceTypeChange: (value: AnchorType) => void;
  onAnchorLabelChange: (value: string) => void;
}

export function LocationSection({
  placeType,
  anchorLabel,
  locationGranted,
  onPlaceTypeChange,
  onAnchorLabelChange,
}: LocationSectionProps) {
  return (
    <View>
      <SectionLabel label="LOCAL" />
      <Card style={styles.body}>
        <FieldLabel label="TIPO DE LUGAR" />
        <PlaceTypeChips value={placeType} onChange={onPlaceTypeChange} />
        <View style={styles.gap} />
        <FieldLabel
          label="LOCAL DE REFERÊNCIA"
          hint={locationGranted ? undefined : 'PERMISSÃO PENDENTE'}
        />
        <FormInput
          value={anchorLabel}
          onChangeText={onAnchorLabelChange}
          placeholder="Ex: Parque Barigui"
          leadingIcon="pin"
          maxLength={100}
          testID="create-group-anchor-label"
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
    height: 12,
  },
});

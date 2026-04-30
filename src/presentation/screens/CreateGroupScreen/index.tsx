import React, { useState } from 'react';
import { Alert } from 'react-native';
import { AnchorType, GroupPrivacy } from '@localloop/shared-types';
import { useCurrentLocation } from '@/application/hooks/useCurrentLocation';
import { groupsApi } from '@/infra/api/groups.api';
import type { HomeTabsScreenProps } from '@/presentation/navigation/types';
import CreateGroupLayout from './layout';

type Props = HomeTabsScreenProps<'CreateGroup'>;

export default function CreateGroupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [anchorType, setAnchorType] = useState<AnchorType>(
    AnchorType.ESTABLISHMENT,
  );
  const [anchorLabel, setAnchorLabel] = useState('');
  const [privacy, setPrivacy] = useState<GroupPrivacy>(GroupPrivacy.OPEN);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { coords, granted, request: requestLocation } = useCurrentLocation();

  const handleRequestLocation = async () => {
    const result = await requestLocation();
    if (!result) {
      Alert.alert(
        'Localização',
        'Precisamos da sua localização para ancorar o grupo.',
      );
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Ops', 'Informe o nome do grupo.');
      return;
    }
    if (!anchorLabel.trim()) {
      Alert.alert('Ops', 'Informe o nome da âncora.');
      return;
    }
    if (!granted || !coords) {
      Alert.alert('Ops', 'Capture sua localização antes de criar o grupo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await groupsApi.createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        anchorType,
        anchorLabel: anchorLabel.trim(),
        lat: coords.lat,
        lng: coords.lng,
        privacy,
      });

      // Replace the stack entry so the user lands on the new group's detail
      // instead of returning to the empty form on back.
      navigation.replace('GroupDetail', { groupId: created.id });
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o grupo. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CreateGroupLayout
      name={name}
      description={description}
      anchorType={anchorType}
      anchorLabel={anchorLabel}
      privacy={privacy}
      locationGranted={granted}
      isSubmitting={isSubmitting}
      onNameChange={setName}
      onDescriptionChange={setDescription}
      onAnchorTypeChange={setAnchorType}
      onAnchorLabelChange={setAnchorLabel}
      onPrivacyChange={setPrivacy}
      onRequestLocation={handleRequestLocation}
      onSubmit={handleSubmit}
      onCancel={() => navigation.goBack()}
    />
  );
}

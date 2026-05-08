import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { AnchorType, GroupPrivacy } from '@localloop/shared-types';
import { useCurrentLocation } from '@/application/hooks/useCurrentLocation';
import { useCreateGroup } from '@/application/hooks/useCreateGroup';
import type { HomeTabsScreenProps } from '@/presentation/navigation/types';
import { StackRoutes } from '@/presentation/navigation/routes';
import CreateGroupLayout from './layout';
import type { SendPermValue } from './layout/types';

type Props = HomeTabsScreenProps<'CreateGroup'>;

const DEFAULT_RADIUS_KM = 2;
const DEFAULT_SEND_PERM: SendPermValue = 'all';

export default function CreateGroupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [placeType, setPlaceType] = useState<AnchorType>(
    AnchorType.ESTABLISHMENT,
  );
  const [anchorLabel, setAnchorLabel] = useState('');
  const [privacy, setPrivacy] = useState<GroupPrivacy>(GroupPrivacy.OPEN);

  // Local-only: not yet persisted to the API. See `feedback_create_group_local_only_fields` memory.
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS_KM);
  const [sendPerm, setSendPerm] = useState<SendPermValue>(DEFAULT_SEND_PERM);
  const [sendMediaPerm, setSendMediaPerm] = useState<SendPermValue>(DEFAULT_SEND_PERM);

  const { coords, granted, request: requestLocation } = useCurrentLocation();
  const createGroup = useCreateGroup();

  useEffect(() => {
    void requestLocation();
  }, [requestLocation]);

  const canSubmit = name.trim().length > 0 && !createGroup.isPending;

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Ops', 'Informe o nome do grupo.');
      return;
    }
    if (!anchorLabel.trim()) {
      Alert.alert('Ops', 'Informe o local de referência.');
      return;
    }
    let finalCoords = coords;
    if (!granted || !finalCoords) {
      finalCoords = await requestLocation();
      if (!finalCoords) {
        Alert.alert(
          'Localização',
          'Precisamos da sua localização para ancorar o grupo.',
        );
        return;
      }
    }

    try {
      const created = await createGroup.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        anchorType: placeType,
        anchorLabel: anchorLabel.trim(),
        lat: finalCoords.lat,
        lng: finalCoords.lng,
        privacy,
      });
      navigation.replace(StackRoutes.GroupDetail, { groupId: created.id });
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o grupo. Tente novamente.');
    }
  };

  return (
    <CreateGroupLayout
      name={name}
      description={description}
      placeType={placeType}
      anchorLabel={anchorLabel}
      privacy={privacy}
      radiusKm={radiusKm}
      sendPerm={sendPerm}
      sendMediaPerm={sendMediaPerm}
      locationGranted={granted}
      isSubmitting={createGroup.isPending}
      canSubmit={canSubmit}
      onNameChange={setName}
      onDescriptionChange={setDescription}
      onPlaceTypeChange={setPlaceType}
      onAnchorLabelChange={setAnchorLabel}
      onPrivacyChange={setPrivacy}
      onRadiusChange={setRadiusKm}
      onSendPermChange={setSendPerm}
      onSendMediaPermChange={setSendMediaPerm}
      onSubmit={handleSubmit}
      onClose={() => navigation.goBack()}
    />
  );
}

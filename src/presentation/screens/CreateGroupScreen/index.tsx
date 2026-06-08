import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { AnchorType, GroupPrivacy } from '@localloop/shared-types';
import {
  useCurrentLocation,
  type Coords,
} from '@/application/hooks/useCurrentLocation/useCurrentLocation';
import { useCreateGroup } from '@/application/hooks/useCreateGroup/useCreateGroup';
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

  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS_KM);
  const [sendPerm, setSendPerm] = useState<SendPermValue>(DEFAULT_SEND_PERM);
  const [sendMediaPerm, setSendMediaPerm] = useState<SendPermValue>(DEFAULT_SEND_PERM);

  // Anchor for the group. Seeded from device GPS and kept in sync with it until
  // the user explicitly repositions the pin on the map (`anchorPicked`), after
  // which their choice is authoritative. `anchorCoords` stays null — and the
  // group is therefore never submittable — until GPS resolves or the user picks,
  // so the map's fallback region can't leak in as an accidental anchor.
  const [anchorCoords, setAnchorCoords] = useState<Coords | null>(null);
  const [anchorPicked, setAnchorPicked] = useState(false);

  const { coords, granted, request: requestLocation } = useCurrentLocation();
  const createGroup = useCreateGroup();

  useEffect(() => {
    void requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (coords && !anchorPicked) setAnchorCoords(coords);
  }, [coords, anchorPicked]);

  const handleAnchorChange = useCallback((next: Coords) => {
    setAnchorPicked(true);
    setAnchorCoords(next);
  }, []);

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
    // Prefer the anchor the user positioned on the map; fall back to raw GPS,
    // and only re-request permission if we have no coordinates at all.
    let finalCoords = anchorCoords ?? coords;
    if (!finalCoords) {
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
        radiusKm,
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
      anchorCoords={anchorCoords}
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
      onAnchorCoordsChange={handleAnchorChange}
      onSendPermChange={setSendPerm}
      onSendMediaPermChange={setSendMediaPerm}
      onSubmit={handleSubmit}
      onClose={() => navigation.goBack()}
    />
  );
}

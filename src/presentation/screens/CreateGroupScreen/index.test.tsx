import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor, type RenderResult } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { AnchorType, GroupPrivacy, MemberRole } from '@localloop/shared-types';
import CreateGroupScreen from './index';
import { useCreateGroup } from '@/application/hooks/useCreateGroup';

jest.mock('@/application/hooks/useCreateGroup', () => ({
  useCreateGroup: jest.fn(),
}));

const mockedUseCreateGroup = useCreateGroup as jest.MockedFunction<
  typeof useCreateGroup
>;
const mockedRequestPermissions =
  Location.requestForegroundPermissionsAsync as jest.Mock;
const mockedGetPosition = Location.getCurrentPositionAsync as jest.Mock;

const navigation = {
  replace: jest.fn(),
  goBack: jest.fn(),
} as unknown as Parameters<typeof CreateGroupScreen>[0]['navigation'];

const route = { key: 'CreateGroup', name: 'CreateGroup' as const, params: undefined };

const renderScreen = async (): Promise<RenderResult> => {
  const utils = render(
    <CreateGroupScreen navigation={navigation} route={route as never} />,
  );
  // Let the on-mount requestLocation() useEffect resolve so subsequent
  // assertions don't race with the async permission/coords state update.
  await waitFor(() => expect(mockedRequestPermissions).toHaveBeenCalled());
  return utils;
};

const fillRequiredFields = (
  utils: RenderResult,
  { name = 'Morumbi Runners', anchorLabel = 'Morumbi' } = {},
) => {
  fireEvent.changeText(utils.getByPlaceholderText('Nome do grupo'), name);
  fireEvent.changeText(
    utils.getByPlaceholderText('Ex: Parque Barigui'),
    anchorLabel,
  );
};

describe('CreateGroupScreen', () => {
  let alertSpy: jest.SpyInstance;
  let mutateAsync: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockedRequestPermissions.mockResolvedValue({ status: 'granted' });
    mockedGetPosition.mockResolvedValue({
      coords: { latitude: -23.55, longitude: -46.63 },
    });
    mutateAsync = jest.fn();
    mockedUseCreateGroup.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateGroup>);
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('disables the submit button while name is empty', async () => {
    const { getByTestId } = await renderScreen();
    expect(
      getByTestId('create-group-submit').props.accessibilityState?.disabled,
    ).toBe(true);
  });

  it('disables the submit button while name is whitespace-only', async () => {
    const utils = await renderScreen();
    fireEvent.changeText(utils.getByPlaceholderText('Nome do grupo'), '   ');
    expect(
      utils.getByTestId('create-group-submit').props.accessibilityState?.disabled,
    ).toBe(true);
  });

  it('alerts with the new copy when anchorLabel is whitespace-only', async () => {
    const utils = await renderScreen();
    fireEvent.changeText(
      utils.getByPlaceholderText('Nome do grupo'),
      'Morumbi Runners',
    );
    fireEvent.changeText(utils.getByPlaceholderText('Ex: Parque Barigui'), '   ');

    await act(async () => {
      fireEvent.press(utils.getByTestId('create-group-submit'));
    });

    expect(alertSpy).toHaveBeenCalledWith('Ops', 'Informe o local de referência.');
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('alerts when location permission is denied', async () => {
    mockedRequestPermissions.mockResolvedValue({ status: 'denied' });
    const utils = await renderScreen();
    fillRequiredFields(utils);

    await act(async () => {
      fireEvent.press(utils.getByTestId('create-group-submit'));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Localização',
      'Precisamos da sua localização para ancorar o grupo.',
    );
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('submits a trimmed payload with description=undefined when empty and navigates on success', async () => {
    mutateAsync.mockResolvedValueOnce({
      id: 'g-new',
      name: 'Morumbi Runners',
      anchorType: AnchorType.NEIGHBORHOOD,
      anchorLabel: 'Morumbi',
      privacy: GroupPrivacy.OPEN,
      memberCount: 1,
      myRole: MemberRole.OWNER,
    });

    const utils = await renderScreen();
    fillRequiredFields(utils, {
      name: '  Morumbi Runners  ',
      anchorLabel: '  Morumbi  ',
    });
    fireEvent.press(utils.getByTestId('place-chip-neighborhood'));

    await act(async () => {
      fireEvent.press(utils.getByTestId('create-group-submit'));
    });

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutateAsync).toHaveBeenCalledWith({
      name: 'Morumbi Runners',
      description: undefined,
      anchorType: AnchorType.NEIGHBORHOOD,
      anchorLabel: 'Morumbi',
      lat: -23.55,
      lng: -46.63,
      privacy: GroupPrivacy.OPEN,
    });
    expect(navigation.replace).toHaveBeenCalledWith('GroupDetail', {
      groupId: 'g-new',
    });
  });

  it('does not include radiusKm, sendPerm, or sendMediaPerm in the submitted payload', async () => {
    mutateAsync.mockResolvedValueOnce({
      id: 'g-new',
      name: 'Morumbi Runners',
      anchorType: AnchorType.ESTABLISHMENT,
      anchorLabel: 'Morumbi',
      privacy: GroupPrivacy.OPEN,
      memberCount: 1,
      myRole: MemberRole.OWNER,
    });

    const utils = await renderScreen();
    fillRequiredFields(utils);

    fireEvent.press(utils.getByTestId('radius-tick-5'));
    fireEvent.press(utils.getByTestId('send-perm-admins_only'));
    fireEvent.press(utils.getByTestId('send-media-perm-within_radius'));

    await act(async () => {
      fireEvent.press(utils.getByTestId('create-group-submit'));
    });

    const payload = mutateAsync.mock.calls[0][0];
    expect(payload).not.toHaveProperty('radiusKm');
    expect(payload).not.toHaveProperty('sendPerm');
    expect(payload).not.toHaveProperty('sendMediaPerm');
  });

  it('alerts and does not navigate when the create mutation rejects', async () => {
    mutateAsync.mockRejectedValueOnce(new Error('network'));

    const utils = await renderScreen();
    fillRequiredFields(utils);

    await act(async () => {
      fireEvent.press(utils.getByTestId('create-group-submit'));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Erro',
      'Não foi possível criar o grupo. Tente novamente.',
    );
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('navigates back when the close button is pressed', async () => {
    const { getByTestId } = await renderScreen();
    fireEvent.press(getByTestId('create-group-close'));
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('selects the chosen privacy card', async () => {
    mutateAsync.mockResolvedValueOnce({
      id: 'g-new',
      name: 'Morumbi Runners',
      anchorType: AnchorType.ESTABLISHMENT,
      anchorLabel: 'Morumbi',
      privacy: GroupPrivacy.APPROVAL_REQUIRED,
      memberCount: 1,
      myRole: MemberRole.OWNER,
    });

    const utils = await renderScreen();
    fillRequiredFields(utils);
    fireEvent.press(utils.getByTestId('privacy-card-approval_required'));

    await act(async () => {
      fireEvent.press(utils.getByTestId('create-group-submit'));
    });

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ privacy: GroupPrivacy.APPROVAL_REQUIRED }),
    );
  });
});

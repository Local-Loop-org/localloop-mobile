import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { AnchorType, GroupPrivacy, MemberRole } from '@localloop/shared-types';
import GroupDetailScreen from './index';
import { groupsApi } from '@/infra/api/groups.api';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: {
    getGroupDetail: jest.fn(),
    joinGroup: jest.fn(),
    leaveGroup: jest.fn(),
    deleteGroup: jest.fn(),
    listJoinRequests: jest.fn(),
    listMembers: jest.fn(),
    resolveJoinRequest: jest.fn(),
    updateGroup: jest.fn(),
  },
}));

jest.mock('@react-navigation/native', () => {
  const ReactLib = require('react');
  return {
    useFocusEffect: (cb: () => void | (() => void)) => {
      ReactLib.useEffect(() => {
        cb();
      }, [cb]);
    },
  };
});

const mockedGetDetail = groupsApi.getGroupDetail as jest.MockedFunction<
  typeof groupsApi.getGroupDetail
>;
const mockedJoin = groupsApi.joinGroup as jest.MockedFunction<
  typeof groupsApi.joinGroup
>;
const mockedLeave = groupsApi.leaveGroup as jest.MockedFunction<
  typeof groupsApi.leaveGroup
>;
const mockedDelete = groupsApi.deleteGroup as jest.MockedFunction<
  typeof groupsApi.deleteGroup
>;
const mockedListJoinRequests =
  groupsApi.listJoinRequests as jest.MockedFunction<
    typeof groupsApi.listJoinRequests
  >;
const mockedListMembers = groupsApi.listMembers as jest.MockedFunction<
  typeof groupsApi.listMembers
>;
const mockedResolveJoinRequest =
  groupsApi.resolveJoinRequest as jest.MockedFunction<
    typeof groupsApi.resolveJoinRequest
  >;
const mockedUpdateGroup = groupsApi.updateGroup as jest.MockedFunction<
  typeof groupsApi.updateGroup
>;
const mockedRequestPermissions =
  Location.requestForegroundPermissionsAsync as jest.Mock;
const mockedGetPosition = Location.getCurrentPositionAsync as jest.Mock;

const navigation = {
  goBack: jest.fn(),
  canGoBack: jest.fn(() => true),
  navigate: jest.fn(),
} as unknown as Parameters<typeof GroupDetailScreen>[0]['navigation'];

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
}

const renderScreen = (client = makeClient()) =>
  render(
    <QueryClientProvider client={client}>
      <GroupDetailScreen
        navigation={navigation}
        route={
          {
            key: 'GroupDetail',
            name: 'GroupDetail' as const,
            params: { groupId: 'g-1' },
          } as never
        }
      />
    </QueryClientProvider>,
  );

const buildGroup = (
  overrides: Partial<import('@/infra/api/groups.api').GroupDetail> = {},
) => ({
  id: 'g-1',
  name: 'Morumbi Runners',
  description: 'Weekly runs',
  anchorType: AnchorType.NEIGHBORHOOD,
  anchorLat: -23.55,
  anchorLng: -46.63,
  anchorLabel: 'Morumbi',
  privacy: GroupPrivacy.OPEN,
  memberCount: 10,
  myRole: null,
  createdAt: '2026-03-12T15:00:00.000Z',
  ...overrides,
});

describe('GroupDetailScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockedRequestPermissions.mockResolvedValue({ status: 'granted' });
    mockedGetPosition.mockResolvedValue({
      coords: { latitude: -23.55, longitude: -46.63 },
    });
    mockedListJoinRequests.mockResolvedValue([]);
    mockedListMembers.mockResolvedValue({ data: [], next_cursor: null });
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  // --- render ---

  it('render: error state on getGroupDetail failure shows retry Voltar', async () => {
    mockedGetDetail.mockRejectedValueOnce(new Error('boom'));

    const { findByText } = renderScreen();

    expect(await findByText('Não foi possível carregar o grupo.')).toBeTruthy();
    expect(await findByText('Voltar')).toBeTruthy();
  });

  it('render: myRole=null shows the join CTA + no Sair / Excluir', async () => {
    mockedGetDetail.mockResolvedValueOnce(buildGroup({ myRole: null }));

    const { findByTestId, queryByText, queryByTestId } = renderScreen();

    expect(await findByTestId('join-group-cta')).toBeTruthy();
    expect(queryByText('Sair do grupo')).toBeNull();
    expect(queryByTestId('danger-delete')).toBeNull();
    expect(queryByTestId('role-pill-owner')).toBeNull();
  });

  it('render: shows the CRIADO EM caption from group.createdAt', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ createdAt: '2026-03-12T15:00:00.000Z' }),
    );

    const { findByTestId } = renderScreen();
    const caption = await findByTestId('group-created-at');
    expect(caption.props.children).toMatch(/^CRIADO EM 12 MAR\.? 2026$/);
  });

  it('render: hides the CRIADO EM caption when createdAt is absent', async () => {
    mockedGetDetail.mockResolvedValueOnce(buildGroup({ createdAt: undefined }));

    const { findByTestId, queryByTestId } = renderScreen();
    await findByTestId('join-group-cta');
    expect(queryByTestId('group-created-at')).toBeNull();
  });

  it('render: shows current distance in the SOBRE O GRUPO second row', async () => {
    mockedGetDetail.mockResolvedValueOnce(buildGroup({ myRole: null }));

    const { findByTestId, findByText } = renderScreen();

    expect(await findByTestId('group-detail-distance-card')).toBeTruthy();
    expect(await findByText('Distância')).toBeTruthy();
    expect(await findByText('0M')).toBeTruthy();
  });

  it('render: shows API radius in the VISÍVEL EM pill', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: null, radiusKm: 7.5 }),
    );

    const { findByText } = renderScreen();

    expect(await findByText('Visível até')).toBeTruthy();
    expect(await findByText('7.5 km')).toBeTruthy();
  });

  it('render: myRole=MEMBER shows MEMBRO pill + Sair, no Excluir, no Solicitações', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.MEMBER }),
    );

    const { findByText, findByTestId, queryByTestId, queryByText } =
      renderScreen();

    expect(await findByTestId('role-pill-member')).toBeTruthy();
    expect(await findByText('Sair do grupo')).toBeTruthy();
    expect(queryByTestId('danger-delete')).toBeNull();
    expect(queryByText('SOLICITAÇÕES')).toBeNull();
  });

  it('render: myRole=MODERATOR shows Solicitações + Sair + Excluir disabled with caption', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.MODERATOR }),
    );

    const { findByText, findByTestId } = renderScreen();

    expect(await findByText('SOLICITAÇÕES')).toBeTruthy();
    expect(await findByTestId('role-pill-moderator')).toBeTruthy();
    expect(await findByText('Sair do grupo')).toBeTruthy();
    const deleteBtn = await findByTestId('danger-delete');
    expect(deleteBtn.props.accessibilityState?.disabled).toBe(true);
    expect(await findByTestId('danger-delete-caption')).toBeTruthy();
  });

  it('render: myRole=OWNER shows Solicitações + Sair + Excluir enabled (no caption)', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.OWNER }),
    );

    const { findByText, findByTestId, queryByTestId } = renderScreen();

    expect(await findByText('SOLICITAÇÕES')).toBeTruthy();
    expect(await findByTestId('role-pill-owner')).toBeTruthy();
    expect(await findByText('Sair do grupo')).toBeTruthy();
    const deleteBtn = await findByTestId('danger-delete');
    expect(deleteBtn.props.accessibilityState?.disabled).toBe(false);
    expect(queryByTestId('danger-delete-caption')).toBeNull();
  });

  // --- join ---

  it('join: OPEN → status=joined reloads group detail', async () => {
    mockedGetDetail.mockResolvedValueOnce(buildGroup({ myRole: null }));
    mockedJoin.mockResolvedValueOnce({
      status: 'joined',
      role: MemberRole.MEMBER,
    });
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.MEMBER }),
    );

    const { findByTestId } = renderScreen();
    fireEvent.press(await findByTestId('join-group-cta'));

    expect(await findByTestId('role-pill-member')).toBeTruthy();
    expect(mockedGetDetail).toHaveBeenCalledTimes(2);
  });

  it('join: APPROVAL_REQUIRED → status=pending shows AGUARDANDO pill + Alert', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({
        myRole: null,
        privacy: GroupPrivacy.APPROVAL_REQUIRED,
      }),
    );
    mockedJoin.mockResolvedValueOnce({ status: 'pending' });

    const { findByTestId } = renderScreen();
    fireEvent.press(await findByTestId('join-group-cta'));

    expect(await findByTestId('role-pill-pending')).toBeTruthy();
    expect(alertSpy).toHaveBeenCalledWith(
      'Solicitação enviada',
      'Aguarde a aprovação de um moderador para entrar no grupo.',
    );
  });

  it('join: API failure shows Alert and keeps the join CTA', async () => {
    mockedGetDetail.mockResolvedValueOnce(buildGroup({ myRole: null }));
    mockedJoin.mockRejectedValueOnce(new Error('network'));

    const { findByTestId } = renderScreen();
    fireEvent.press(await findByTestId('join-group-cta'));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'Erro',
        'Não foi possível entrar no grupo. Tente novamente.',
      ),
    );
    expect(await findByTestId('join-group-cta')).toBeTruthy();
  });

  // --- moderation ---

  it('moderation: useFocusEffect loads pending requests when privileged', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.OWNER }),
    );
    mockedListJoinRequests.mockResolvedValue([
      {
        id: 'req-1',
        userId: 'u-9',
        displayName: 'Pending Alice',
        createdAt: '2026-04-22T00:00:00Z',
      },
    ]);

    const { findByText } = renderScreen();

    expect(await findByText('Pending Alice')).toBeTruthy();
    expect(mockedListJoinRequests).toHaveBeenCalledWith('g-1');
  });

  it('moderation: non-privileged members never trigger listJoinRequests', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.MEMBER }),
    );

    const { findByTestId } = renderScreen();
    await findByTestId('role-pill-member');

    expect(mockedListJoinRequests).not.toHaveBeenCalled();
  });

  it('moderation: approve optimistically removes + increments memberCount', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.OWNER, memberCount: 10 }),
    );
    mockedListJoinRequests.mockResolvedValue([
      {
        id: 'req-1',
        userId: 'u-9',
        displayName: 'Pending Alice',
        createdAt: '2026-04-22T00:00:00Z',
      },
    ]);
    mockedResolveJoinRequest.mockResolvedValueOnce({ status: 'approved' });

    const { findByText, findByTestId, queryByText } = renderScreen();
    await findByText('Pending Alice');

    await act(async () => {
      fireEvent.press(await findByTestId('request-row-req-1-approve'));
    });

    expect(mockedResolveJoinRequest).toHaveBeenCalledWith(
      'g-1',
      'req-1',
      'approve',
    );
    await waitFor(() => expect(queryByText('Pending Alice')).toBeNull());
    expect(await findByText('11 membros')).toBeTruthy();
  });

  it('moderation: approve API failure rolls back the request list', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.OWNER, memberCount: 10 }),
    );
    mockedListJoinRequests.mockResolvedValue([
      {
        id: 'req-1',
        userId: 'u-9',
        displayName: 'Pending Alice',
        createdAt: '2026-04-22T00:00:00Z',
      },
    ]);
    mockedResolveJoinRequest.mockRejectedValueOnce(new Error('boom'));

    const { findByText, findByTestId } = renderScreen();
    await findByText('Pending Alice');

    await act(async () => {
      fireEvent.press(await findByTestId('request-row-req-1-approve'));
    });

    expect(await findByText('Pending Alice')).toBeTruthy();
    expect(alertSpy).toHaveBeenCalledWith(
      'Erro',
      'Não foi possível aprovar esta solicitação.',
    );
  });

  it('moderation: reject optimistically removes but does NOT increment memberCount', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.OWNER, memberCount: 10 }),
    );
    mockedListJoinRequests.mockResolvedValue([
      {
        id: 'req-1',
        userId: 'u-9',
        displayName: 'Pending Alice',
        createdAt: '2026-04-22T00:00:00Z',
      },
    ]);
    mockedResolveJoinRequest.mockResolvedValueOnce({ status: 'rejected' });

    const { findByText, findByTestId, queryByText } = renderScreen();
    await findByText('Pending Alice');

    await act(async () => {
      fireEvent.press(await findByTestId('request-row-req-1-reject'));
    });

    expect(mockedResolveJoinRequest).toHaveBeenCalledWith(
      'g-1',
      'req-1',
      'reject',
    );
    await waitFor(() => expect(queryByText('Pending Alice')).toBeNull());
    expect(await findByText('10 membros')).toBeTruthy();
  });

  it('moderation: reject API failure rolls back and alerts', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.OWNER }),
    );
    mockedListJoinRequests.mockResolvedValue([
      {
        id: 'req-1',
        userId: 'u-9',
        displayName: 'Pending Alice',
        createdAt: '2026-04-22T00:00:00Z',
      },
    ]);
    mockedResolveJoinRequest.mockRejectedValueOnce(new Error('boom'));

    const { findByText, findByTestId } = renderScreen();
    await findByText('Pending Alice');

    await act(async () => {
      fireEvent.press(await findByTestId('request-row-req-1-reject'));
    });

    expect(await findByText('Pending Alice')).toBeTruthy();
    expect(alertSpy).toHaveBeenCalledWith(
      'Erro',
      'Não foi possível rejeitar esta solicitação.',
    );
  });

  // --- members ---

  it('members: VER TODOS navigates to GroupMembers with groupId + myRole', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.MODERATOR }),
    );

    const { findByTestId } = renderScreen();
    fireEvent.press(await findByTestId('members-section-view-all'));

    expect(navigation.navigate).toHaveBeenCalledWith('GroupMembers', {
      groupId: 'g-1',
      myRole: MemberRole.MODERATOR,
    });
  });

  it('members: hero chevron also navigates to GroupMembers', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.MEMBER }),
    );

    const { findByTestId } = renderScreen();
    fireEvent.press(await findByTestId('hero-members-button'));

    expect(navigation.navigate).toHaveBeenCalledWith('GroupMembers', {
      groupId: 'g-1',
      myRole: MemberRole.MEMBER,
    });
  });

  // --- delete ---

  it('delete: owner confirm → success → navigates to Home', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.OWNER }),
    );
    mockedDelete.mockResolvedValueOnce(undefined);

    const { findByTestId } = renderScreen();
    fireEvent.press(await findByTestId('danger-delete'));

    const confirmButton = alertSpy.mock.calls[0][2][1];
    expect(confirmButton.text).toBe('Excluir');
    await act(async () => {
      await confirmButton.onPress();
    });

    expect(mockedDelete).toHaveBeenCalledWith('g-1');
    expect(navigation.navigate).toHaveBeenCalledWith({
      name: 'HomeTabs',
      params: { screen: 'Home' },
    });
  });

  it('delete: API failure shows Alert and does not navigate', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.OWNER }),
    );
    mockedDelete.mockRejectedValueOnce(new Error('network'));

    const { findByTestId } = renderScreen();
    fireEvent.press(await findByTestId('danger-delete'));

    const confirmButton = alertSpy.mock.calls[0][2][1];
    await act(async () => {
      await confirmButton.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Erro',
      'Não foi possível excluir o grupo. Tente novamente.',
    );
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  // --- leave ---

  it('leave: confirm → success → navigates to Home', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.MEMBER }),
    );
    mockedLeave.mockResolvedValueOnce(undefined);

    const { findByText } = renderScreen();
    fireEvent.press(await findByText('Sair do grupo'));

    const leaveButton = alertSpy.mock.calls[0][2][1];
    expect(leaveButton.text).toBe('Sair');
    await act(async () => {
      await leaveButton.onPress();
    });

    expect(mockedLeave).toHaveBeenCalledWith('g-1');
    expect(navigation.navigate).toHaveBeenCalledWith({
      name: 'HomeTabs',
      params: { screen: 'Home' },
    });
  });

  it('leave: API failure shows Alert and does not navigate', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.MEMBER }),
    );
    mockedLeave.mockRejectedValueOnce(new Error('network'));

    const { findByText } = renderScreen();
    fireEvent.press(await findByText('Sair do grupo'));

    const leaveButton = alertSpy.mock.calls[0][2][1];
    await act(async () => {
      await leaveButton.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Erro',
      'Não foi possível sair do grupo. Tente novamente.',
    );
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  // --- inline edit ---

  it('edit: edit icon absent for regular member', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.MEMBER }),
    );

    const { findByTestId, queryByTestId } = renderScreen();
    await findByTestId('role-pill-member');

    expect(queryByTestId('group-detail-edit')).toBeNull();
  });

  it('edit: edit icon present for owner', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.OWNER }),
    );

    const { findByTestId } = renderScreen();
    expect(await findByTestId('group-detail-edit')).toBeTruthy();
  });

  it('edit: save calls updateGroup with draft values', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.OWNER, name: 'Original Name' }),
    );
    mockedUpdateGroup.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.OWNER, name: 'Updated Name' }),
    );

    const { findByTestId } = renderScreen();

    // Enter edit mode
    fireEvent.press(await findByTestId('group-detail-edit'));

    // Change name
    const nameInput = await findByTestId('hero-name-input');
    fireEvent.changeText(nameInput, 'Updated Name');

    // Save
    await act(async () => {
      fireEvent.press(await findByTestId('group-detail-save-edit'));
    });

    expect(mockedUpdateGroup).toHaveBeenCalledWith(
      'g-1',
      expect.objectContaining({ name: 'Updated Name' }),
    );
  });

  it('edit: cancel discards draft without calling updateGroup', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.OWNER, name: 'Original Name' }),
    );

    const { findByTestId } = renderScreen();

    // Enter edit mode
    fireEvent.press(await findByTestId('group-detail-edit'));

    // Change name
    const nameInput = await findByTestId('hero-name-input');
    fireEvent.changeText(nameInput, 'Discarded Name');

    // Cancel
    fireEvent.press(await findByTestId('group-detail-cancel-edit'));

    // Edit icon reappears (we're out of edit mode)
    expect(await findByTestId('group-detail-edit')).toBeTruthy();
    expect(mockedUpdateGroup).not.toHaveBeenCalled();
  });

  // --- members short list ---

  it('members: fetched short list renders rows in MembersSection', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.MEMBER, memberCount: 12 }),
    );
    mockedListMembers.mockResolvedValueOnce({
      data: [
        {
          userId: 'u-1',
          displayName: 'Ana Souza',
          avatarUrl: null,
          role: MemberRole.MEMBER,
        },
        {
          userId: 'u-2',
          displayName: 'Bruno Lima',
          avatarUrl: null,
          role: MemberRole.MEMBER,
        },
        {
          userId: 'u-3',
          displayName: 'Carla Reis',
          avatarUrl: null,
          role: MemberRole.MODERATOR,
        },
      ],
      next_cursor: null,
    });

    const { findByText, queryByText } = renderScreen();
    await findByText('VER TODOS (12)');

    await waitFor(() => expect(mockedListMembers).toHaveBeenCalledWith('g-1'));
    // Once members arrive, each row renders the display name and the
    // empty-state placeholder hides.
    await waitFor(() => {
      expect(queryByText('Ana Souza')).not.toBeNull();
      expect(queryByText('Bruno Lima')).not.toBeNull();
      expect(queryByText('Carla Reis')).not.toBeNull();
      expect(queryByText('Ainda não há membros')).toBeNull();
    });
  });
});

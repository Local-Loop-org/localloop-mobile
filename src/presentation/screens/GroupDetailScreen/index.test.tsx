import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { AnchorType, GroupPrivacy, MemberRole } from '@localloop/shared-types';
import GroupDetailScreen from './index';
import { groupsApi } from '@/infra/api/groups.api';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: {
    getGroupDetail: jest.fn(),
    joinGroup: jest.fn(),
    leaveGroup: jest.fn(),
    listJoinRequests: jest.fn(),
    resolveJoinRequest: jest.fn(),
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
const mockedListJoinRequests = groupsApi.listJoinRequests as jest.MockedFunction<
  typeof groupsApi.listJoinRequests
>;
const mockedResolveJoinRequest =
  groupsApi.resolveJoinRequest as jest.MockedFunction<
    typeof groupsApi.resolveJoinRequest
  >;

const navigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
} as unknown as Parameters<typeof GroupDetailScreen>[0]['navigation'];

const renderScreen = () =>
  render(
    <GroupDetailScreen
      navigation={navigation}
      route={
        {
          key: 'GroupDetail',
          name: 'GroupDetail' as const,
          params: { groupId: 'g-1' },
        } as never
      }
    />,
  );

const buildGroup = (overrides: Partial<import('@/infra/api/groups.api').GroupDetail> = {}) => ({
  id: 'g-1',
  name: 'Morumbi Runners',
  description: 'Weekly runs',
  anchorType: AnchorType.NEIGHBORHOOD,
  anchorLabel: 'Morumbi',
  privacy: GroupPrivacy.OPEN,
  memberCount: 10,
  myRole: null,
  ...overrides,
});

describe('GroupDetailScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockedListJoinRequests.mockResolvedValue([]);
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

  it('render: myRole=null shows "Entrar no grupo" and no Leave button', async () => {
    mockedGetDetail.mockResolvedValueOnce(buildGroup({ myRole: null }));

    const { findByText, queryByText } = renderScreen();

    expect(await findByText('Entrar no grupo')).toBeTruthy();
    expect(queryByText('Sair do grupo')).toBeNull();
    expect(queryByText('Ver membros')).toBeNull();
  });

  it('render: myRole=MEMBER shows "Você já faz parte" + Leave + Members', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.MEMBER }),
    );

    const { findByText, queryByText } = renderScreen();

    expect(await findByText('Você já faz parte')).toBeTruthy();
    expect(await findByText('Sair do grupo')).toBeTruthy();
    expect(await findByText('Ver membros')).toBeTruthy();
    expect(queryByText('Solicitações pendentes')).toBeNull();
  });

  it('render: myRole=OWNER shows Moderation panel + Members button + owner helper', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.OWNER }),
    );

    const { findByText } = renderScreen();

    expect(await findByText('Solicitações pendentes')).toBeTruthy();
    expect(await findByText('Ver membros')).toBeTruthy();
    expect(await findByText('Transfira a liderança antes de sair.')).toBeTruthy();
  });

  it('render: myRole=MODERATOR shows Moderation panel', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.MODERATOR }),
    );

    const { findByText, queryByText } = renderScreen();

    expect(await findByText('Solicitações pendentes')).toBeTruthy();
    expect(queryByText('Transfira a liderança antes de sair.')).toBeNull();
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

    const { findByText } = renderScreen();
    fireEvent.press(await findByText('Entrar no grupo'));

    expect(await findByText('Você já faz parte')).toBeTruthy();
    expect(mockedGetDetail).toHaveBeenCalledTimes(2);
  });

  it('join: APPROVAL_REQUIRED → status=pending shows pending label + Alert', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({
        myRole: null,
        privacy: GroupPrivacy.APPROVAL_REQUIRED,
      }),
    );
    mockedJoin.mockResolvedValueOnce({ status: 'pending' });

    const { findByText } = renderScreen();
    fireEvent.press(await findByText('Entrar no grupo'));

    expect(await findByText('Solicitação pendente')).toBeTruthy();
    expect(alertSpy).toHaveBeenCalledWith(
      'Solicitação enviada',
      'Aguarde a aprovação de um moderador para entrar no grupo.',
    );
  });

  it('join: API failure shows Alert and keeps Join button', async () => {
    mockedGetDetail.mockResolvedValueOnce(buildGroup({ myRole: null }));
    mockedJoin.mockRejectedValueOnce(new Error('network'));

    const { findByText } = renderScreen();
    const joinBtn = await findByText('Entrar no grupo');
    fireEvent.press(joinBtn);

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'Erro',
        'Não foi possível entrar no grupo. Tente novamente.',
      ),
    );
    expect(await findByText('Entrar no grupo')).toBeTruthy();
  });

  // --- moderation ---

  it('moderation: useFocusEffect loads pending requests when privileged', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.OWNER }),
    );
    mockedListJoinRequests.mockResolvedValueOnce([
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

    const { findByText } = renderScreen();
    await findByText('Você já faz parte');

    expect(mockedListJoinRequests).not.toHaveBeenCalled();
  });

  it('moderation: approve optimistically removes + increments memberCount', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.OWNER, memberCount: 10 }),
    );
    mockedListJoinRequests.mockResolvedValueOnce([
      {
        id: 'req-1',
        userId: 'u-9',
        displayName: 'Pending Alice',
        createdAt: '2026-04-22T00:00:00Z',
      },
    ]);
    mockedResolveJoinRequest.mockResolvedValueOnce({ status: 'approved' });

    const { findByText, queryByText, getAllByText } = renderScreen();
    await findByText('Pending Alice');

    await act(async () => {
      fireEvent.press(getAllByText('Aprovar')[0]);
    });

    expect(mockedResolveJoinRequest).toHaveBeenCalledWith('g-1', 'req-1', 'approve');
    await waitFor(() => expect(queryByText('Pending Alice')).toBeNull());
    expect(await findByText('11')).toBeTruthy();
  });

  it('moderation: approve API failure rolls back the request list', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.OWNER, memberCount: 10 }),
    );
    mockedListJoinRequests.mockResolvedValueOnce([
      {
        id: 'req-1',
        userId: 'u-9',
        displayName: 'Pending Alice',
        createdAt: '2026-04-22T00:00:00Z',
      },
    ]);
    mockedResolveJoinRequest.mockRejectedValueOnce(new Error('boom'));

    const { findByText, getAllByText } = renderScreen();
    await findByText('Pending Alice');

    await act(async () => {
      fireEvent.press(getAllByText('Aprovar')[0]);
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
    mockedListJoinRequests.mockResolvedValueOnce([
      {
        id: 'req-1',
        userId: 'u-9',
        displayName: 'Pending Alice',
        createdAt: '2026-04-22T00:00:00Z',
      },
    ]);
    mockedResolveJoinRequest.mockResolvedValueOnce({ status: 'rejected' });

    const { findByText, queryByText, getAllByText } = renderScreen();
    await findByText('Pending Alice');

    await act(async () => {
      fireEvent.press(getAllByText('Rejeitar')[0]);
    });

    expect(mockedResolveJoinRequest).toHaveBeenCalledWith('g-1', 'req-1', 'reject');
    await waitFor(() => expect(queryByText('Pending Alice')).toBeNull());
    expect(await findByText('10')).toBeTruthy();
  });

  it('moderation: reject API failure rolls back and alerts', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.OWNER }),
    );
    mockedListJoinRequests.mockResolvedValueOnce([
      {
        id: 'req-1',
        userId: 'u-9',
        displayName: 'Pending Alice',
        createdAt: '2026-04-22T00:00:00Z',
      },
    ]);
    mockedResolveJoinRequest.mockRejectedValueOnce(new Error('boom'));

    const { findByText, getAllByText } = renderScreen();
    await findByText('Pending Alice');

    await act(async () => {
      fireEvent.press(getAllByText('Rejeitar')[0]);
    });

    expect(await findByText('Pending Alice')).toBeTruthy();
    expect(alertSpy).toHaveBeenCalledWith(
      'Erro',
      'Não foi possível rejeitar esta solicitação.',
    );
  });

  // --- members ---

  it('members: button navigates to GroupMembers with groupId + myRole', async () => {
    mockedGetDetail.mockResolvedValueOnce(
      buildGroup({ myRole: MemberRole.MODERATOR }),
    );

    const { findByText } = renderScreen();
    fireEvent.press(await findByText('Ver membros'));

    expect(navigation.navigate).toHaveBeenCalledWith('GroupMembers', {
      groupId: 'g-1',
      myRole: MemberRole.MODERATOR,
    });
  });

  // --- leave ---

  it('leave: confirm → success → goBack', async () => {
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
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
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
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
});

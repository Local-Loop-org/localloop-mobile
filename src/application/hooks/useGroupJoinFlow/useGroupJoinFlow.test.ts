import React from 'react';
import { Alert } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AnchorType,
  GroupPrivacy,
  MemberRole,
  MemberStatus,
  type NearbyGroup,
} from '@localloop/shared-types';
import { groupsApi } from '@/infra/api/groups.api';
import { useGroupJoinFlow, type GroupChatNavigator } from './useGroupJoinFlow';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: { joinGroup: jest.fn() },
}));

const mockedJoin = groupsApi.joinGroup as jest.MockedFunction<
  typeof groupsApi.joinGroup
>;

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    client,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client }, children),
  };
}

const base: Omit<NearbyGroup, 'id' | 'name' | 'privacy'> = {
  description: null,
  anchorType: AnchorType.NEIGHBORHOOD,
  anchorLabel: 'Bairro',
  distanceMeters: 0,
  anchorLat: -25.4284,
  anchorLng: -49.2733,
  memberCount: 5,
  myRole: null,
  memberStatus: null,
};

const openGroup: NearbyGroup = {
  ...base,
  id: 'open-1',
  name: 'Open Group',
  privacy: GroupPrivacy.OPEN,
};
const approvalGroup: NearbyGroup = {
  ...base,
  id: 'appr-1',
  name: 'Approval Group',
  privacy: GroupPrivacy.APPROVAL_REQUIRED,
};
const activeGroup: NearbyGroup = {
  ...base,
  id: 'active-1',
  name: 'Active Group',
  privacy: GroupPrivacy.APPROVAL_REQUIRED,
  myRole: MemberRole.OWNER,
  memberStatus: MemberStatus.ACTIVE,
};
const pendingGroup: NearbyGroup = {
  ...base,
  id: 'pending-1',
  name: 'Pending Group',
  privacy: GroupPrivacy.APPROVAL_REQUIRED,
  memberStatus: MemberStatus.PENDING,
};

const groups = [openGroup, approvalGroup, activeGroup, pendingGroup];

function renderFlow() {
  const { client, wrapper } = makeWrapper();
  const navigate = jest.fn();
  const navigation: GroupChatNavigator = { navigate };
  const { result } = renderHook(() => useGroupJoinFlow({ groups, navigation }), {
    wrapper,
  });
  return { client, navigate, result };
}

describe('useGroupJoinFlow', () => {
  beforeEach(() => jest.clearAllMocks());

  it('ACTIVE member: navigates to chat with the real role and does not join', () => {
    const { navigate, result, client } = renderFlow();

    act(() => result.current.handlePressGroup('active-1'));

    expect(mockedJoin).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('GroupChat', {
      groupId: 'active-1',
      groupName: 'Active Group',
      anchorType: AnchorType.NEIGHBORHOOD,
      myRole: MemberRole.OWNER,
    });
    client.clear();
  });

  it('PENDING request: does nothing', () => {
    const { navigate, result, client } = renderFlow();

    act(() => result.current.handlePressGroup('pending-1'));

    expect(mockedJoin).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    client.clear();
  });

  it('OPEN group: joins and navigates as MEMBER', async () => {
    mockedJoin.mockResolvedValueOnce({
      status: 'joined',
      role: MemberRole.MEMBER,
    });
    const { navigate, result, client } = renderFlow();

    act(() => result.current.handlePressGroup('open-1'));

    expect(navigate).toHaveBeenCalledWith('GroupChat', {
      groupId: 'open-1',
      groupName: 'Open Group',
      anchorType: AnchorType.NEIGHBORHOOD,
      myRole: MemberRole.MEMBER,
    });
    await waitFor(() => expect(mockedJoin).toHaveBeenCalledWith('open-1'));
    client.clear();
  });

  it('APPROVAL_REQUIRED group: prompts, then confirming sends the request without navigating', async () => {
    mockedJoin.mockResolvedValueOnce({ status: 'pending' });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { navigate, result, client } = renderFlow();

    act(() => result.current.handlePressGroup('appr-1'));

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toBe('Solicitar entrada?');
    expect(mockedJoin).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();

    const buttons = alertSpy.mock.calls[0][2] as Array<{
      text: string;
      onPress?: () => void | Promise<void>;
    }>;
    const solicitar = buttons.find((b) => b.text === 'Solicitar')!;
    await act(async () => {
      await solicitar.onPress!();
    });

    expect(mockedJoin).toHaveBeenCalledWith('appr-1');
    expect(alertSpy).toHaveBeenCalledTimes(2);
    expect(alertSpy.mock.calls[1][0]).toBe('Solicitação enviada');
    expect(navigate).not.toHaveBeenCalled();
    alertSpy.mockRestore();
    client.clear();
  });

  it('debounces double-taps while a join is in flight', async () => {
    mockedJoin.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ status: 'joined', role: MemberRole.MEMBER }),
            100,
          ),
        ),
    );
    const { navigate, result, client } = renderFlow();

    act(() => result.current.handlePressGroup('open-1'));
    await waitFor(() => expect(mockedJoin).toHaveBeenCalledTimes(1));

    act(() => result.current.handlePressGroup('open-1'));
    act(() => result.current.handlePressGroup('open-1'));

    expect(mockedJoin).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);
    client.clear();
  });
});

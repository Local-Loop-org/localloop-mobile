import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AnchorType,
  GroupPrivacy,
  MemberRole,
} from '@localloop/shared-types';
import GroupMembersScreen from './index';
import { groupsApi } from '@/infra/api/groups.api';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: {
    listMembers: jest.fn(),
    banMember: jest.fn(),
    unbanMember: jest.fn(),
    promoteMember: jest.fn(),
    demoteMember: jest.fn(),
    listJoinRequests: jest.fn(),
    resolveJoinRequest: jest.fn(),
    getGroupDetail: jest.fn(),
  },
}));

const mockedListMembers = groupsApi.listMembers as jest.MockedFunction<
  typeof groupsApi.listMembers
>;
const mockedBanMember = groupsApi.banMember as jest.MockedFunction<
  typeof groupsApi.banMember
>;
const mockedUnbanMember = groupsApi.unbanMember as jest.MockedFunction<
  typeof groupsApi.unbanMember
>;
const mockedPromoteMember = groupsApi.promoteMember as jest.MockedFunction<
  typeof groupsApi.promoteMember
>;
const mockedDemoteMember = groupsApi.demoteMember as jest.MockedFunction<
  typeof groupsApi.demoteMember
>;
const mockedListJoinRequests =
  groupsApi.listJoinRequests as jest.MockedFunction<
    typeof groupsApi.listJoinRequests
  >;
const mockedResolveJoinRequest =
  groupsApi.resolveJoinRequest as jest.MockedFunction<
    typeof groupsApi.resolveJoinRequest
  >;
const mockedGetGroupDetail = groupsApi.getGroupDetail as jest.MockedFunction<
  typeof groupsApi.getGroupDetail
>;

const navigation = {
  goBack: jest.fn(),
} as unknown as Parameters<typeof GroupMembersScreen>[0]['navigation'];

const buildMember = (
  userId: string,
  displayName: string,
  role: MemberRole,
) => ({
  userId,
  displayName,
  avatarUrl: null,
  role,
});

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
}

const renderScreen = (myRole: MemberRole | null, client = makeClient()) =>
  render(
    <QueryClientProvider client={client}>
      <GroupMembersScreen
        navigation={navigation}
        route={
          {
            key: 'GroupMembers',
            name: 'GroupMembers' as const,
            params: { groupId: 'g-1', myRole },
          } as never
        }
      />
    </QueryClientProvider>,
  );

const groupFixture = {
  id: 'g-1',
  name: 'Corredores do Barigui',
  description: null,
  anchorType: AnchorType.NEIGHBORHOOD,
  anchorLat: -23.55,
  anchorLng: -46.63,
  anchorLabel: 'Barigui',
  privacy: GroupPrivacy.OPEN,
  memberCount: 3,
  myRole: null as MemberRole | null,
  createdAt: '2026-03-12T15:00:00.000Z',
};

describe('GroupMembersScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockedGetGroupDetail.mockResolvedValue(groupFixture);
    mockedListJoinRequests.mockResolvedValue([]);
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('loads active members on mount and renders them', async () => {
    mockedListMembers.mockResolvedValueOnce({
      data: [
        buildMember('u-1', 'Alice', MemberRole.OWNER),
        buildMember('u-2', 'Bob', MemberRole.MEMBER),
      ],
      next_cursor: null,
    });

    const { findByText } = renderScreen(MemberRole.OWNER);

    expect(await findByText('Alice')).toBeTruthy();
    expect(await findByText('Bob')).toBeTruthy();
    expect(mockedListMembers).toHaveBeenCalledWith('g-1');
  });

  it('shows an error when listMembers fails', async () => {
    mockedListMembers.mockRejectedValueOnce(new Error('boom'));

    const { findByText } = renderScreen(MemberRole.OWNER);

    expect(
      await findByText('Não foi possível carregar os membros.'),
    ).toBeTruthy();
  });

  it('renders the filter chips for OWNER/MODERATOR', async () => {
    mockedListMembers.mockResolvedValueOnce({
      data: [buildMember('u-1', 'Alice', MemberRole.OWNER)],
      next_cursor: null,
    });

    const { findByTestId } = renderScreen(MemberRole.OWNER);

    expect(await findByTestId('filter-chip-all')).toBeTruthy();
    expect(await findByTestId('filter-chip-active')).toBeTruthy();
    expect(await findByTestId('filter-chip-pending')).toBeTruthy();
    expect(await findByTestId('filter-chip-banned')).toBeTruthy();
  });

  it('hides chips and "..." actions for regular MEMBER, shows footer note', async () => {
    mockedListMembers.mockResolvedValueOnce({
      data: [
        buildMember('u-1', 'Alice Owner', MemberRole.OWNER),
        buildMember('u-3', 'Carol Member', MemberRole.MEMBER),
      ],
      next_cursor: null,
    });

    const { findByText, queryByTestId } = renderScreen(MemberRole.MEMBER);
    await findByText('Carol Member');

    expect(queryByTestId('filter-chip-all')).toBeNull();
    expect(queryByTestId('filter-chip-active')).toBeNull();
    expect(queryByTestId('members-section-action-u-3')).toBeNull();
    expect(queryByTestId('group-members-member-footer')).toBeTruthy();
  });

  it('OWNER sees "..." actions on non-owner rows and never on owner rows', async () => {
    mockedListMembers.mockResolvedValueOnce({
      data: [
        buildMember('u-1', 'Alice Owner', MemberRole.OWNER),
        buildMember('u-2', 'Bob Mod', MemberRole.MODERATOR),
        buildMember('u-3', 'Carol Member', MemberRole.MEMBER),
      ],
      next_cursor: null,
    });

    const { findByText, queryByTestId } = renderScreen(MemberRole.OWNER);
    await findByText('Alice Owner');

    expect(queryByTestId('members-section-action-u-1')).toBeNull();
    expect(queryByTestId('members-section-action-u-2')).toBeTruthy();
    expect(queryByTestId('members-section-action-u-3')).toBeTruthy();
  });

  it('promote confirmed → calls promoteMember', async () => {
    mockedListMembers.mockResolvedValue({
      data: [
        buildMember('u-1', 'Alice Owner', MemberRole.OWNER),
        buildMember('u-3', 'Carol Member', MemberRole.MEMBER),
      ],
      next_cursor: null,
    });
    mockedPromoteMember.mockResolvedValueOnce(undefined);

    const { findByTestId } = renderScreen(MemberRole.OWNER);

    fireEvent.press(await findByTestId('members-section-action-u-3'));
    fireEvent.press(await findByTestId('members-section-promote-u-3'));

    const confirmBtn = alertSpy.mock.calls[0][2][1];
    expect(confirmBtn.text).toBe('Promover');

    await act(async () => {
      await confirmBtn.onPress();
    });

    expect(mockedPromoteMember).toHaveBeenCalledWith('g-1', 'u-3');
  });

  it('demote confirmed → calls demoteMember (owner viewing moderator)', async () => {
    mockedListMembers.mockResolvedValue({
      data: [
        buildMember('u-1', 'Alice Owner', MemberRole.OWNER),
        buildMember('u-2', 'Bob Mod', MemberRole.MODERATOR),
      ],
      next_cursor: null,
    });
    mockedDemoteMember.mockResolvedValueOnce(undefined);

    const { findByTestId } = renderScreen(MemberRole.OWNER);

    fireEvent.press(await findByTestId('members-section-action-u-2'));
    fireEvent.press(await findByTestId('members-section-demote-u-2'));

    const confirmBtn = alertSpy.mock.calls[0][2][1];
    expect(confirmBtn.text).toBe('Rebaixar');

    await act(async () => {
      await confirmBtn.onPress();
    });

    expect(mockedDemoteMember).toHaveBeenCalledWith('g-1', 'u-2');
  });

  it('MODERATOR viewer cannot see the Rebaixar action on a moderator row', async () => {
    mockedListMembers.mockResolvedValueOnce({
      data: [
        buildMember('u-1', 'Alice Owner', MemberRole.OWNER),
        buildMember('u-2', 'Bob Mod', MemberRole.MODERATOR),
      ],
      next_cursor: null,
    });

    const { findByTestId, queryByTestId } = renderScreen(MemberRole.MODERATOR);

    fireEvent.press(await findByTestId('members-section-action-u-2'));
    expect(queryByTestId('members-section-demote-u-2')).toBeNull();
  });

  it('ban confirmed → optimistically removes the member and calls banMember', async () => {
    mockedListMembers.mockResolvedValueOnce({
      data: [
        buildMember('u-1', 'Alice Owner', MemberRole.OWNER),
        buildMember('u-3', 'Carol Member', MemberRole.MEMBER),
      ],
      next_cursor: null,
    });
    mockedBanMember.mockResolvedValueOnce(undefined);

    const { findByText, findByTestId, queryByText } = renderScreen(
      MemberRole.OWNER,
    );
    await findByText('Carol Member');

    fireEvent.press(await findByTestId('members-section-action-u-3'));
    fireEvent.press(await findByTestId('members-section-ban-u-3'));

    expect(alertSpy).toHaveBeenCalledTimes(1);
    const banButton = alertSpy.mock.calls[0][2][1];
    expect(banButton.text).toBe('Banir');

    await act(async () => {
      await banButton.onPress();
    });

    expect(mockedBanMember).toHaveBeenCalledWith('g-1', 'u-3');
    await waitFor(() => expect(queryByText('Carol Member')).toBeNull());
  });

  it('ban failure → rolls back the removal and alerts', async () => {
    // useBanMember's rollback path invalidates the members query, which
    // re-fetches — so the mock must keep returning the original list, not
    // just for the first call.
    mockedListMembers.mockResolvedValue({
      data: [
        buildMember('u-1', 'Alice Owner', MemberRole.OWNER),
        buildMember('u-3', 'Carol Member', MemberRole.MEMBER),
      ],
      next_cursor: null,
    });
    mockedBanMember.mockRejectedValueOnce(new Error('network'));

    const { findByText, findByTestId } = renderScreen(MemberRole.OWNER);
    await findByText('Carol Member');

    fireEvent.press(await findByTestId('members-section-action-u-3'));
    fireEvent.press(await findByTestId('members-section-ban-u-3'));
    const banButton = alertSpy.mock.calls[0][2][1];
    await act(async () => {
      await banButton.onPress();
    });

    expect(await findByText('Carol Member')).toBeTruthy();
    expect(alertSpy).toHaveBeenCalledWith(
      'Erro',
      'Não foi possível banir este membro. Tente novamente.',
    );
  });

  it('approve pending request calls resolveJoinRequest with action=approve', async () => {
    mockedListMembers.mockResolvedValue({ data: [], next_cursor: null });
    mockedListJoinRequests.mockResolvedValue([
      {
        id: 'r-1',
        userId: 'u-9',
        displayName: 'Pedro Almeida',
        createdAt: '2026-05-15T12:00:00.000Z',
      },
    ]);
    mockedResolveJoinRequest.mockResolvedValueOnce({ status: 'approved' });

    const { findByTestId } = renderScreen(MemberRole.OWNER);

    fireEvent.press(await findByTestId('filter-chip-pending'));
    fireEvent.press(await findByTestId('request-row-r-1-approve'));

    await waitFor(() =>
      expect(mockedResolveJoinRequest).toHaveBeenCalledWith(
        'g-1',
        'r-1',
        'approve',
      ),
    );
  });

  it('reject pending request calls resolveJoinRequest with action=reject', async () => {
    mockedListMembers.mockResolvedValue({ data: [], next_cursor: null });
    mockedListJoinRequests.mockResolvedValue([
      {
        id: 'r-2',
        userId: 'u-10',
        displayName: 'Camila Ferreira',
        createdAt: '2026-05-15T12:00:00.000Z',
      },
    ]);
    mockedResolveJoinRequest.mockResolvedValueOnce({ status: 'rejected' });

    const { findByTestId } = renderScreen(MemberRole.OWNER);

    fireEvent.press(await findByTestId('filter-chip-pending'));
    fireEvent.press(await findByTestId('request-row-r-2-reject'));

    await waitFor(() =>
      expect(mockedResolveJoinRequest).toHaveBeenCalledWith(
        'g-1',
        'r-2',
        'reject',
      ),
    );
  });

  it('does NOT call listJoinRequests for a regular MEMBER', async () => {
    mockedListMembers.mockResolvedValueOnce({
      data: [buildMember('u-1', 'Alice', MemberRole.OWNER)],
      next_cursor: null,
    });

    const { findByText } = renderScreen(MemberRole.MEMBER);
    await findByText('Alice');

    expect(mockedListJoinRequests).not.toHaveBeenCalled();
  });

  it('search filters active members by name', async () => {
    mockedListMembers.mockResolvedValueOnce({
      data: [
        buildMember('u-1', 'Alice', MemberRole.OWNER),
        buildMember('u-2', 'Bob', MemberRole.MEMBER),
      ],
      next_cursor: null,
    });

    const { findByTestId, findByText, queryByText } = renderScreen(
      MemberRole.OWNER,
    );
    await findByText('Alice');

    fireEvent.changeText(await findByTestId('member-search-input'), 'bob');

    await waitFor(() => expect(queryByText('Alice')).toBeNull());
    expect(await findByText('Bob')).toBeTruthy();
  });

  it('back button navigates goBack', async () => {
    mockedListMembers.mockResolvedValueOnce({
      data: [buildMember('u-1', 'Alice', MemberRole.OWNER)],
      next_cursor: null,
    });

    const { findByText, findByTestId } = renderScreen(MemberRole.OWNER);
    await findByText('Alice');

    fireEvent.press(await findByTestId('group-members-back'));
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});

// Suppress unused-import lint while the unban listing UX waits on backend support.
void mockedUnbanMember;

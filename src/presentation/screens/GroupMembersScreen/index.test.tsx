import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { MemberRole } from '@localloop/shared-types';
import GroupMembersScreen from './index';
import { groupsApi } from '@/infra/api/groups.api';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: {
    listMembers: jest.fn(),
    banMember: jest.fn(),
  },
}));

const mockedListMembers = groupsApi.listMembers as jest.MockedFunction<
  typeof groupsApi.listMembers
>;
const mockedBanMember = groupsApi.banMember as jest.MockedFunction<
  typeof groupsApi.banMember
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

const renderScreen = (myRole: MemberRole | null) =>
  render(
    <GroupMembersScreen
      navigation={navigation}
      route={
        {
          key: 'GroupMembers',
          name: 'GroupMembers' as const,
          params: { groupId: 'g-1', myRole },
        } as never
      }
    />,
  );

describe('GroupMembersScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('loads members on mount and renders them', async () => {
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

  it('shows an error message when listMembers fails', async () => {
    mockedListMembers.mockRejectedValueOnce(new Error('boom'));

    const { findByText } = renderScreen(MemberRole.OWNER);

    expect(await findByText('Não foi possível carregar os membros.')).toBeTruthy();
  });

  it('OWNER can ban MEMBER and MODERATOR, never another OWNER', async () => {
    mockedListMembers.mockResolvedValueOnce({
      data: [
        buildMember('u-1', 'Alice Owner', MemberRole.OWNER),
        buildMember('u-2', 'Bob Mod', MemberRole.MODERATOR),
        buildMember('u-3', 'Carol Member', MemberRole.MEMBER),
      ],
      next_cursor: null,
    });

    const { findAllByText, findByText } = renderScreen(MemberRole.OWNER);
    await findByText('Alice Owner');

    const banButtons = await findAllByText('Banir');
    expect(banButtons).toHaveLength(2);
  });

  it('MODERATOR can ban only MEMBERS, not OWNER or other MODERATORS', async () => {
    mockedListMembers.mockResolvedValueOnce({
      data: [
        buildMember('u-1', 'Alice Owner', MemberRole.OWNER),
        buildMember('u-2', 'Bob Mod', MemberRole.MODERATOR),
        buildMember('u-3', 'Carol Member', MemberRole.MEMBER),
      ],
      next_cursor: null,
    });

    const { findAllByText, findByText } = renderScreen(MemberRole.MODERATOR);
    await findByText('Alice Owner');

    const banButtons = await findAllByText('Banir');
    expect(banButtons).toHaveLength(1);
  });

  it('MEMBER sees no ban buttons at all', async () => {
    mockedListMembers.mockResolvedValueOnce({
      data: [
        buildMember('u-1', 'Alice Owner', MemberRole.OWNER),
        buildMember('u-2', 'Bob Mod', MemberRole.MODERATOR),
        buildMember('u-3', 'Carol Member', MemberRole.MEMBER),
      ],
      next_cursor: null,
    });

    const { findByText, queryAllByText } = renderScreen(MemberRole.MEMBER);
    await findByText('Alice Owner');

    expect(queryAllByText('Banir')).toHaveLength(0);
  });

  it('null role (non-member) sees no ban buttons', async () => {
    mockedListMembers.mockResolvedValueOnce({
      data: [
        buildMember('u-2', 'Bob Mod', MemberRole.MODERATOR),
        buildMember('u-3', 'Carol Member', MemberRole.MEMBER),
      ],
      next_cursor: null,
    });

    const { findByText, queryAllByText } = renderScreen(null);
    await findByText('Bob Mod');

    expect(queryAllByText('Banir')).toHaveLength(0);
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

    const { findByText, queryByText } = renderScreen(MemberRole.OWNER);
    await findByText('Carol Member');

    fireEvent.press(await findByText('Banir'));

    // The destructive 'Banir' button is the 2nd entry (index 1) in the Alert callbacks.
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
    mockedListMembers.mockResolvedValueOnce({
      data: [
        buildMember('u-1', 'Alice Owner', MemberRole.OWNER),
        buildMember('u-3', 'Carol Member', MemberRole.MEMBER),
      ],
      next_cursor: null,
    });
    mockedBanMember.mockRejectedValueOnce(new Error('network'));

    const { findByText } = renderScreen(MemberRole.OWNER);
    await findByText('Carol Member');

    fireEvent.press(await findByText('Banir'));
    const banButton = alertSpy.mock.calls[0][2][1];
    await act(async () => {
      await banButton.onPress();
    });

    // Member should be back after rollback
    expect(await findByText('Carol Member')).toBeTruthy();
    expect(alertSpy).toHaveBeenCalledWith(
      'Erro',
      'Não foi possível banir este membro. Tente novamente.',
    );
  });

  it('back button navigates goBack', async () => {
    mockedListMembers.mockResolvedValueOnce({
      data: [buildMember('u-1', 'Alice', MemberRole.OWNER)],
      next_cursor: null,
    });

    const { findByText } = renderScreen(MemberRole.OWNER);
    await findByText('Alice');

    fireEvent.press(await findByText('‹ Voltar'));
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});

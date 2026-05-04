import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnchorType, MemberRole } from '@localloop/shared-types';
import MyGroupsScreen from './index';
import { groupsApi, type MyGroup } from '@/infra/api/groups.api';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: { getMyGroups: jest.fn() },
}));

const mockedGetMyGroups = groupsApi.getMyGroups as jest.MockedFunction<
  typeof groupsApi.getMyGroups
>;

const navigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
} as unknown as Parameters<typeof MyGroupsScreen>[0]['navigation'];

const route = {
  key: 'MyGroups',
  name: 'MyGroups' as const,
  params: undefined,
};

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const renderScreen = () =>
  render(<MyGroupsScreen navigation={navigation} route={route as never} />, {
    wrapper: makeWrapper(),
  });

const baseGroup = (overrides: Partial<MyGroup>): MyGroup => ({
  id: 'mg-x',
  name: 'Grupo',
  anchorType: AnchorType.NEIGHBORHOOD,
  anchorLabel: 'Vila',
  memberCount: 5,
  myRole: MemberRole.MEMBER,
  lastActivityAt: '2026-04-29T13:00:00.000Z',
  lastMessage: null,
  ...overrides,
});

const corredores = baseGroup({
  id: 'mg-1',
  name: 'Clube dos Corredores',
  anchorType: AnchorType.NEIGHBORHOOD,
  myRole: MemberRole.OWNER,
  lastMessage: {
    content: 'Bora amanhã cedo?',
    senderName: 'Bob',
    createdAt: '2026-04-29T13:00:00.000Z',
  },
});
const cafe = baseGroup({
  id: 'mg-2',
  name: 'Café Manfredini',
  anchorType: AnchorType.ESTABLISHMENT,
  lastMessage: {
    content: 'Tem mesa livre?',
    senderName: 'Alice',
    createdAt: '2026-04-29T12:30:00.000Z',
  },
});
const jadePark = baseGroup({
  id: 'mg-3',
  name: 'Ed. Jade Park',
  anchorType: AnchorType.CONDO,
});

describe('MyGroupsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-29T13:00:00.000Z'));
    mockedGetMyGroups.mockResolvedValue({
      data: [corredores, cafe, jadePark],
      next_cursor: null,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders all groups initially', async () => {
    const { findByText } = renderScreen();

    expect(await findByText('Clube dos Corredores')).toBeTruthy();
    expect(await findByText('Café Manfredini')).toBeTruthy();
    expect(await findByText('Ed. Jade Park')).toBeTruthy();
  });

  it('renders header subtitle with total count and hides "NÃO LIDAS" while no unread', async () => {
    const { findByText, queryByText } = renderScreen();

    await findByText('Clube dos Corredores');
    expect(await findByText('3 GRUPOS')).toBeTruthy();
    expect(queryByText(/NÃO LIDAS/)).toBeNull();
  });

  it('omits the "Não lidas" chip when no group has unread', async () => {
    const { findByText, queryByText } = renderScreen();

    await findByText('Clube dos Corredores');
    expect(queryByText('Não lidas')).toBeNull();
    expect(await findByText('Todos')).toBeTruthy();
  });

  it('shows the "Não lidas" chip and unread total when at least one group has unread', async () => {
    mockedGetMyGroups.mockResolvedValueOnce({
      data: [{ ...corredores, unreadCount: 3 }, cafe, jadePark],
      next_cursor: null,
    });
    const { findByText } = renderScreen();

    expect(await findByText('Não lidas')).toBeTruthy();
    expect(await findByText(/1 NÃO LIDAS/)).toBeTruthy();
  });

  it('filters by name (case-insensitive) when typing in search', async () => {
    const { findByText, queryByText, getByPlaceholderText } = renderScreen();
    await findByText('Clube dos Corredores');

    fireEvent.changeText(
      getByPlaceholderText('Buscar nos meus grupos…'),
      'jade',
    );

    expect(await findByText('Ed. Jade Park')).toBeTruthy();
    expect(queryByText('Clube dos Corredores')).toBeNull();
    expect(queryByText('Café Manfredini')).toBeNull();
  });

  it('narrows the list when an anchor-type chip is tapped', async () => {
    const { findByText, queryByText } = renderScreen();
    await findByText('Clube dos Corredores');

    fireEvent.press(await findByText('Lugares'));

    expect(await findByText('Café Manfredini')).toBeTruthy();
    expect(queryByText('Clube dos Corredores')).toBeNull();
    expect(queryByText('Ed. Jade Park')).toBeNull();
  });

  it('chip counts reflect the unfiltered list (stable while typing)', async () => {
    const {
      findByText,
      queryAllByText,
      getByPlaceholderText,
      findByLabelText,
    } = renderScreen();
    await findByText('Clube dos Corredores');

    // Before typing: "Todos" announces 3 (unique chip count value).
    expect(await findByLabelText('Todos, 3')).toBeTruthy();
    const before3 = queryAllByText('3').length;

    fireEvent.changeText(
      getByPlaceholderText('Buscar nos meus grupos…'),
      'jade',
    );

    // List narrows to 1, but "Todos" chip's accessibilityLabel still reads 3.
    expect(await findByLabelText('Todos, 3')).toBeTruthy();
    expect(queryAllByText('3').length).toBe(before3);
  });

  it('renders the empty state when no group matches', async () => {
    const { findByText, getByPlaceholderText } = renderScreen();
    await findByText('Clube dos Corredores');

    fireEvent.changeText(
      getByPlaceholderText('Buscar nos meus grupos…'),
      'zzz-no-match',
    );

    expect(await findByText('Nada por aqui agora.')).toBeTruthy();
  });

  it('navigates to GroupChat with myRole when a row is pressed', async () => {
    const { findByText } = renderScreen();
    fireEvent.press(await findByText('Clube dos Corredores'));

    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('GroupChat', {
        groupId: 'mg-1',
        groupName: 'Clube dos Corredores',
        anchorType: AnchorType.NEIGHBORHOOD,
        myRole: MemberRole.OWNER,
      }),
    );
  });

  it('calls goBack when the back button is tapped', async () => {
    const { findByLabelText, findByText } = renderScreen();
    await findByText('Clube dos Corredores');

    fireEvent.press(await findByLabelText('Voltar'));

    expect(navigation.goBack).toHaveBeenCalled();
  });
});

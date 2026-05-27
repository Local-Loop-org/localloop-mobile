import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  InfiniteData,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import type { DirectMessage } from '@localloop/shared-types';
import {
  dmApi,
  type ListDmConversationsResponse,
  type ListDmRequestsResponse,
} from '@/infra/api/dm.api';
import { dmConversationsKey } from '../useDmConversations/useDmConversations';
import { dmRequestsKey } from '../useDmRequests/useDmRequests';
import { useAcceptDmRequest } from './useAcceptDmRequest';

jest.mock('@/infra/api/dm.api', () => ({
  dmApi: {
    acceptDmRequest: jest.fn(),
  },
}));

const mockedAcceptDmRequest = dmApi.acceptDmRequest as jest.MockedFunction<
  typeof dmApi.acceptDmRequest
>;

const requestsData: InfiniteData<ListDmRequestsResponse> = {
  pageParams: [undefined],
  pages: [
    {
      data: [
        {
          id: 'req-1',
          senderId: 'u-1',
          senderName: 'Alice',
          senderAvatarUrl: null,
          content: 'oi',
          createdAt: '2026-05-18T10:00:00.000Z',
        },
      ],
      next_cursor: null,
    },
  ],
};

const conversationsData: InfiniteData<ListDmConversationsResponse> = {
  pageParams: [undefined],
  pages: [{ data: [], next_cursor: null }],
};

const acceptedMessage: DirectMessage = {
  id: 'dm-1',
  senderId: 'u-1',
  senderName: 'Alice',
  senderAvatarUrl: null,
  recipientId: 'me',
  content: 'oi',
  mediaUrl: null,
  mediaType: null,
  createdAt: '2026-05-18T10:00:00.000Z',
};

function makeClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  client.setQueryData(dmRequestsKey(20), requestsData);
  client.setQueryData(dmConversationsKey(20), conversationsData);
  return client;
}

function wrapWith(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useAcceptDmRequest', () => {
  it('optimistically removes the request and seeds the conversation on success', async () => {
    mockedAcceptDmRequest.mockResolvedValueOnce(acceptedMessage);
    const client = makeClient();
    const { result } = renderHook(() => useAcceptDmRequest(), {
      wrapper: wrapWith(client),
    });

    act(() => {
      result.current.mutate('req-1');
    });

    await waitFor(() =>
      expect(
        client.getQueryData<InfiniteData<ListDmRequestsResponse>>(
          dmRequestsKey(20),
        )?.pages[0]?.data,
      ).toEqual([]),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedAcceptDmRequest).toHaveBeenCalledWith('req-1');
    expect(
      client.getQueryData<InfiniteData<ListDmConversationsResponse>>(
        dmConversationsKey(20),
      )?.pages[0]?.data[0],
    ).toMatchObject({
      peerId: 'u-1',
      peerName: 'Alice',
      unreadCount: 0,
    });
  });

  it('rolls back the removed request when the mutation fails', async () => {
    mockedAcceptDmRequest.mockRejectedValueOnce(new Error('boom'));
    const client = makeClient();
    const { result } = renderHook(() => useAcceptDmRequest(), {
      wrapper: wrapWith(client),
    });

    act(() => {
      result.current.mutate('req-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(
      client.getQueryData<InfiniteData<ListDmRequestsResponse>>(
        dmRequestsKey(20),
      ),
    ).toEqual(requestsData);
  });
});

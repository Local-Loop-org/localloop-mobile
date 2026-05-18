import MockAdapter from 'axios-mock-adapter';
import { apiClient } from './api-client';
import { dmApi } from './dm.api';

describe('dmApi', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.reset();
    mock.restore();
  });

  it('listDmConversations GETs /dm with limit and optional cursor', async () => {
    const response = {
      data: [
        {
          peerId: 'u-1',
          peerName: 'Alice',
          peerAvatarUrl: null,
          lastMessage: {
            content: 'oi',
            senderName: 'Alice',
            createdAt: '2026-05-18T10:00:00.000Z',
          },
          unreadCount: 2,
          archived: false,
        },
      ],
      next_cursor: 'cursor-1',
    };

    mock.onGet('/dm').replyOnce((config) => {
      expect(config.params).toEqual({ limit: 20 });
      return [200, response];
    });

    await expect(dmApi.listDmConversations()).resolves.toEqual(response);

    mock.onGet('/dm').replyOnce((config) => {
      expect(config.params).toEqual({ limit: 10, cursor: 'cursor-1' });
      return [200, { data: [], next_cursor: null }];
    });

    await expect(
      dmApi.listDmConversations({ limit: 10, cursor: 'cursor-1' }),
    ).resolves.toEqual({ data: [], next_cursor: null });
  });

  it('listDmRequests GETs /dm/requests with limit and optional cursor', async () => {
    const response = {
      data: [
        {
          id: 'req-1',
          senderId: 'u-2',
          senderName: 'Bia',
          senderAvatarUrl: null,
          content: 'oi vizinha',
          createdAt: '2026-05-18T10:00:00.000Z',
        },
      ],
      next_cursor: 'cursor-2',
    };

    mock.onGet('/dm/requests').replyOnce((config) => {
      expect(config.params).toEqual({ limit: 20 });
      return [200, response];
    });

    await expect(dmApi.listDmRequests()).resolves.toEqual(response);

    mock.onGet('/dm/requests').replyOnce((config) => {
      expect(config.params).toEqual({ limit: 5, cursor: 'cursor-2' });
      return [200, { data: [], next_cursor: null }];
    });

    await expect(
      dmApi.listDmRequests({ limit: 5, cursor: 'cursor-2' }),
    ).resolves.toEqual({ data: [], next_cursor: null });
  });

  it('getDmHistory keeps using before pagination for conversation history', async () => {
    const response = { data: [], next_cursor: null };
    mock.onGet('/dm/u-1').reply((config) => {
      expect(config.params).toEqual({ limit: 50, before: 'older' });
      return [200, response];
    });

    await expect(
      dmApi.getDmHistory('u-1', { before: 'older' }),
    ).resolves.toEqual(response);
  });
});

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

  it('acceptDmRequest POSTs /dm/requests/:id/accept', async () => {
    const response = {
      id: 'dm-1',
      senderId: 'u-2',
      senderName: 'Bia',
      senderAvatar: null,
      recipientId: 'me',
      content: 'oi',
      mediaUrl: null,
      mediaType: null,
      createdAt: '2026-05-18T10:00:00.000Z',
    };

    mock.onPost('/dm/requests/req-1/accept').replyOnce(200, response);

    await expect(dmApi.acceptDmRequest('req-1')).resolves.toEqual(response);
  });

  it('declineDmRequest POSTs /dm/requests/:id/decline', async () => {
    mock.onPost('/dm/requests/req-1/decline').replyOnce(204);

    await expect(dmApi.declineDmRequest('req-1')).resolves.toBeUndefined();
  });

  it('listDmExceptions GETs /users/me/dm-exceptions with pagination', async () => {
    const response = {
      data: [
        {
          peerId: 'u-3',
          displayName: 'Caio',
          avatarUrl: null,
          createdAt: '2026-05-18T10:00:00.000Z',
        },
      ],
      next_cursor: 'cursor-3',
    };

    mock.onGet('/users/me/dm-exceptions').replyOnce((config) => {
      expect(config.params).toEqual({ limit: 20 });
      return [200, response];
    });

    await expect(dmApi.listDmExceptions()).resolves.toEqual(response);

    mock.onGet('/users/me/dm-exceptions').replyOnce((config) => {
      expect(config.params).toEqual({ limit: 8, cursor: 'cursor-3' });
      return [200, { data: [], next_cursor: null }];
    });

    await expect(
      dmApi.listDmExceptions({ limit: 8, cursor: 'cursor-3' }),
    ).resolves.toEqual({ data: [], next_cursor: null });
  });

  it('removeDmException DELETEs /users/me/dm-exceptions/:peerId', async () => {
    mock.onDelete('/users/me/dm-exceptions/u-3').replyOnce(204);

    await expect(dmApi.removeDmException('u-3')).resolves.toBeUndefined();
  });

  it('archiveDmConversation PUTs /dm/:peerId/archive', async () => {
    mock.onPut('/dm/u-1/archive').replyOnce(204);

    await expect(dmApi.archiveDmConversation('u-1')).resolves.toBeUndefined();
  });

  it('unarchiveDmConversation DELETEs /dm/:peerId/archive', async () => {
    mock.onDelete('/dm/u-1/archive').replyOnce(204);

    await expect(dmApi.unarchiveDmConversation('u-1')).resolves.toBeUndefined();
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

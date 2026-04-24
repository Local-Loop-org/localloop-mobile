import MockAdapter from 'axios-mock-adapter';
import { apiClient } from './api-client';
import { messagesApi } from './messages.api';

describe('messagesApi', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.reset();
    mock.restore();
  });

  it('getHistory GETs /groups/:id/messages with default limit=50 and returns body', async () => {
    const body = {
      data: [
        {
          id: 'm-1',
          senderId: 'u-1',
          senderName: 'Alice',
          senderAvatar: null,
          content: 'hi',
          mediaUrl: null,
          mediaType: null,
          createdAt: '2026-04-24T10:00:00.000Z',
        },
      ],
      next_cursor: null,
    };
    mock.onGet('/groups/g-1/messages').replyOnce((config) => {
      expect(config.params).toEqual({ limit: 50 });
      return [200, body];
    });

    const result = await messagesApi.getHistory('g-1');
    expect(result).toEqual(body);
  });

  it('getHistory passes the before cursor and custom limit', async () => {
    const body = { data: [], next_cursor: null };
    mock.onGet('/groups/g-1/messages').replyOnce((config) => {
      expect(config.params).toEqual({ limit: 20, before: '2026-04-24T10:00:00.000Z' });
      return [200, body];
    });

    const result = await messagesApi.getHistory('g-1', {
      limit: 20,
      before: '2026-04-24T10:00:00.000Z',
    });
    expect(result).toEqual(body);
  });

  it('getHistory bubbles up non-2xx errors', async () => {
    mock.onGet('/groups/g-1/messages').reply(403, { message: 'forbidden' });
    await expect(messagesApi.getHistory('g-1')).rejects.toMatchObject({
      response: { status: 403 },
    });
  });
});

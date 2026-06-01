import type { InfiniteData } from '@tanstack/react-query';
import type { GroupMessage } from '@localloop/shared-types';
import {
  SEND_TIMEOUT_MS,
  createSendTimeoutTracker,
  markTempAsError,
  markTempAsSending,
} from './sendStatusTracker';
import { getLocalSendStatus, type ChatMessageWithSendStatus } from './sendStatus';

type GroupMessageWithSendStatus = ChatMessageWithSendStatus<GroupMessage>;

interface Page {
  data: GroupMessageWithSendStatus[];
  next_cursor: string | null;
}

function makeMessage(
  overrides: Partial<GroupMessageWithSendStatus>,
): GroupMessageWithSendStatus {
  return {
    id: 'm-1',
    clientMessageId: null,
    senderId: 'u-1',
    senderName: 'User',
    senderAvatarUrl: null,
    content: 'hello',
    mediaUrl: null,
    mediaType: null,
    createdAt: '2026-05-30T00:00:00.000Z',
    replyTo: null,
    isDeleted: false,
    editedAt: null,
    ...overrides,
  };
}

function makeCache(
  messages: GroupMessageWithSendStatus[],
): InfiniteData<Page> {
  return {
    pages: [{ data: messages, next_cursor: null }],
    pageParams: [undefined],
  };
}

describe('markTempAsError', () => {
  it("sets sendStatus 'error' on the matching temp and leaves siblings untouched", () => {
    const temp = makeMessage({
      id: 'temp-1',
      clientMessageId: 'temp-1',
    });
    const persisted = makeMessage({ id: 'm-99', content: 'older' });
    const cache = makeCache([temp, persisted]);

    const next = markTempAsError(cache, 'temp-1');

    expect(next).not.toBe(cache);
    const [tempAfter, persistedAfter] = next!.pages[0].data;
    expect(getLocalSendStatus(tempAfter)).toBe('error');
    expect(tempAfter.content).toBe('hello');
    expect(persistedAfter).toBe(persisted);
  });

  it('preserves array order so the bubble stays pinned at its position', () => {
    const a = makeMessage({ id: 'temp-a', clientMessageId: 'temp-a' });
    const b = makeMessage({ id: 'm-b' });
    const c = makeMessage({ id: 'm-c' });
    const cache = makeCache([a, b, c]);

    const next = markTempAsError(cache, 'temp-a');

    expect(next!.pages[0].data.map((m) => m.id)).toEqual([
      'temp-a',
      'm-b',
      'm-c',
    ]);
  });

  it('returns the same cache reference when no matching temp exists', () => {
    const persisted = makeMessage({ id: 'm-1', clientMessageId: 'temp-gone' });
    const cache = makeCache([persisted]);

    const next = markTempAsError(cache, 'temp-gone');

    expect(next).toBe(cache);
  });

  it('returns undefined when the cache is undefined', () => {
    expect(markTempAsError<GroupMessageWithSendStatus, Page>(undefined, 'temp-x')).toBeUndefined();
  });

  it('searches every page, not just the first', () => {
    const oldTemp = makeMessage({
      id: 'temp-old',
      clientMessageId: 'temp-old',
    });
    const cache: InfiniteData<Page> = {
      pages: [
        { data: [makeMessage({ id: 'm-new' })], next_cursor: 'cursor' },
        { data: [oldTemp], next_cursor: null },
      ],
      pageParams: [undefined, 'cursor'],
    };

    const next = markTempAsError(cache, 'temp-old');

    expect(getLocalSendStatus(next!.pages[1].data[0])).toBe('error');
  });
});

describe('markTempAsSending', () => {
  it("flips an errored temp back to 'sending' and leaves siblings untouched", () => {
    const temp = makeMessage({
      id: 'temp-1',
      clientMessageId: 'temp-1',
      sendStatus: 'error',
    });
    const persisted = makeMessage({ id: 'm-99', content: 'older' });
    const cache = makeCache([temp, persisted]);

    const next = markTempAsSending(cache, 'temp-1');

    expect(next).not.toBe(cache);
    const [tempAfter, persistedAfter] = next!.pages[0].data;
    expect(getLocalSendStatus(tempAfter)).toBe('sending');
    expect(tempAfter.content).toBe('hello');
    expect(persistedAfter).toBe(persisted);
  });

  it('preserves array order so the bubble stays pinned at its position', () => {
    const a = makeMessage({
      id: 'temp-a',
      clientMessageId: 'temp-a',
      sendStatus: 'error',
    });
    const b = makeMessage({ id: 'm-b' });
    const c = makeMessage({ id: 'm-c' });
    const cache = makeCache([a, b, c]);

    const next = markTempAsSending(cache, 'temp-a');

    expect(next!.pages[0].data.map((m) => m.id)).toEqual([
      'temp-a',
      'm-b',
      'm-c',
    ]);
  });

  it('returns the same cache reference when no matching temp exists', () => {
    const persisted = makeMessage({ id: 'm-1', clientMessageId: 'temp-gone' });
    const cache = makeCache([persisted]);

    const next = markTempAsSending(cache, 'temp-gone');

    expect(next).toBe(cache);
  });

  it('returns undefined when the cache is undefined', () => {
    expect(
      markTempAsSending<GroupMessageWithSendStatus, Page>(undefined, 'temp-x'),
    ).toBeUndefined();
  });

  it('searches every page, not just the first', () => {
    const oldTemp = makeMessage({
      id: 'temp-old',
      clientMessageId: 'temp-old',
      sendStatus: 'error',
    });
    const cache: InfiniteData<Page> = {
      pages: [
        { data: [makeMessage({ id: 'm-new' })], next_cursor: 'cursor' },
        { data: [oldTemp], next_cursor: null },
      ],
      pageParams: [undefined, 'cursor'],
    };

    const next = markTempAsSending(cache, 'temp-old');

    expect(getLocalSendStatus(next!.pages[1].data[0])).toBe('sending');
  });
});

describe('createSendTimeoutTracker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fires onTimeout with the clientMessageId after SEND_TIMEOUT_MS', () => {
    const tracker = createSendTimeoutTracker();
    const onTimeout = jest.fn();

    tracker.track('temp-1', onTimeout);
    expect(onTimeout).not.toHaveBeenCalled();

    jest.advanceTimersByTime(SEND_TIMEOUT_MS - 1);
    expect(onTimeout).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(onTimeout).toHaveBeenCalledWith('temp-1');
  });

  it('clear(cid) cancels a tracked timer', () => {
    const tracker = createSendTimeoutTracker();
    const onTimeout = jest.fn();

    tracker.track('temp-1', onTimeout);
    tracker.clear('temp-1');

    jest.advanceTimersByTime(SEND_TIMEOUT_MS * 2);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('clearAll() cancels every pending timer', () => {
    const tracker = createSendTimeoutTracker();
    const onTimeoutA = jest.fn();
    const onTimeoutB = jest.fn();

    tracker.track('temp-a', onTimeoutA);
    tracker.track('temp-b', onTimeoutB);
    tracker.clearAll();

    jest.advanceTimersByTime(SEND_TIMEOUT_MS * 2);
    expect(onTimeoutA).not.toHaveBeenCalled();
    expect(onTimeoutB).not.toHaveBeenCalled();
  });

  it('treats clear() on an unknown id as a no-op', () => {
    const tracker = createSendTimeoutTracker();
    expect(() => tracker.clear('never-tracked')).not.toThrow();
  });

  it('replaces an existing timer when track() is called twice with the same id', () => {
    const tracker = createSendTimeoutTracker();
    const first = jest.fn();
    const second = jest.fn();

    tracker.track('temp-1', first);
    jest.advanceTimersByTime(SEND_TIMEOUT_MS - 1);
    tracker.track('temp-1', second);

    jest.advanceTimersByTime(SEND_TIMEOUT_MS);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith('temp-1');
  });
});

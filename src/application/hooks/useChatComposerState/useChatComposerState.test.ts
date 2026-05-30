import { act, renderHook } from '@testing-library/react-native';
import type { ChatMessage } from '@localloop/shared-types';
import { useChatComposerState } from './useChatComposerState';

const ME = 'me';
const PEER = 'peer';

function msg(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'm-1',
    clientMessageId: null,
    senderId: PEER,
    senderName: 'Alice Bravo',
    senderAvatarUrl: null,
    content: 'hello world',
    mediaUrl: null,
    mediaType: null,
    createdAt: '2026-05-28T10:00:00.000Z',
    replyTo: null,
    isDeleted: false,
    editedAt: null,
    ...overrides,
  };
}

interface MakeOpts {
  messages?: ChatMessage[];
  currentUserId?: string | null;
  onSendNew?: jest.Mock;
  onEditMessage?: jest.Mock<Promise<unknown>>;
}

function makeHook(opts: MakeOpts = {}) {
  const onSendNew = opts.onSendNew ?? jest.fn();
  const onEditMessage =
    opts.onEditMessage ?? jest.fn().mockResolvedValue(undefined);
  const result = renderHook(() =>
    useChatComposerState({
      messages: opts.messages ?? [],
      currentUserId: opts.currentUserId ?? ME,
      onSendNew,
      onEditMessage,
    }),
  );
  return { ...result, onSendNew, onEditMessage };
}

describe('useChatComposerState — initial state', () => {
  it('starts empty', () => {
    const { result } = makeHook();
    expect(result.current.draft).toBe('');
    expect(result.current.composingReplyTo).toBeNull();
    expect(result.current.composingEdit).toBeNull();
    expect(result.current.editError).toBeNull();
  });
});

describe('useChatComposerState — openReplyComposerFor', () => {
  it('builds the reply chip view-model from the target message', () => {
    const { result } = makeHook({
      messages: [msg({ id: 'a', senderId: PEER, senderName: 'Alice Bravo' })],
    });
    act(() => result.current.openReplyComposerFor('a'));
    expect(result.current.composingReplyTo).toEqual({
      authorLabel: 'Alice',
      originalText: 'hello world',
      onCancel: expect.any(Function),
    });
  });

  it("labels own messages as 'Você'", () => {
    const { result } = makeHook({
      messages: [msg({ id: 'a', senderId: ME })],
    });
    act(() => result.current.openReplyComposerFor('a'));
    expect(result.current.composingReplyTo?.authorLabel).toBe('Você');
  });

  it('is a no-op for a missing message id', () => {
    const { result } = makeHook({ messages: [msg({ id: 'a' })] });
    act(() => result.current.openReplyComposerFor('missing'));
    expect(result.current.composingReplyTo).toBeNull();
  });

  it('is a no-op when the message has no snippet-worthy content', () => {
    const { result } = makeHook({
      messages: [msg({ id: 'a', content: '   ' })],
    });
    act(() => result.current.openReplyComposerFor('a'));
    expect(result.current.composingReplyTo).toBeNull();
  });

  it('clears an in-progress edit and restores its stashed draft (mutex)', () => {
    const { result } = makeHook({
      messages: [
        msg({ id: 'own', senderId: ME, content: 'original' }),
        msg({ id: 'reply-target', senderId: PEER, content: 'peer text' }),
      ],
    });
    act(() => result.current.onChangeDraft('half-typed'));
    act(() => result.current.openEditComposerFor('own'));
    expect(result.current.draft).toBe('original');
    act(() => result.current.openReplyComposerFor('reply-target'));
    expect(result.current.composingEdit).toBeNull();
    expect(result.current.composingReplyTo).not.toBeNull();
    expect(result.current.draft).toBe('half-typed');
  });
});

describe('useChatComposerState — openEditComposerFor', () => {
  it('pre-fills the draft with the message content and snapshots the prior draft', () => {
    const { result } = makeHook({
      messages: [msg({ id: 'own', senderId: ME, content: 'old content' })],
    });
    act(() => result.current.onChangeDraft('typing…'));
    act(() => result.current.openEditComposerFor('own'));
    expect(result.current.draft).toBe('old content');
    expect(result.current.composingEdit).toEqual({
      onCancel: expect.any(Function),
    });
  });

  it('clears any reply chip on entry (mutex)', () => {
    const { result } = makeHook({
      messages: [
        msg({ id: 'reply', senderId: PEER, content: 'peer text' }),
        msg({ id: 'own', senderId: ME, content: 'mine' }),
      ],
    });
    act(() => result.current.openReplyComposerFor('reply'));
    act(() => result.current.openEditComposerFor('own'));
    expect(result.current.composingReplyTo).toBeNull();
    expect(result.current.composingEdit).not.toBeNull();
  });

  it("preserves the original stash when switching from edit-A to edit-B", () => {
    const { result } = makeHook({
      messages: [
        msg({ id: 'a', senderId: ME, content: 'content-a' }),
        msg({ id: 'b', senderId: ME, content: 'content-b' }),
      ],
    });
    act(() => result.current.onChangeDraft('original draft'));
    act(() => result.current.openEditComposerFor('a'));
    act(() => result.current.openEditComposerFor('b'));
    expect(result.current.draft).toBe('content-b');
    // Cancel should restore the original stash, not content-a
    act(() => result.current.composingEdit?.onCancel());
    expect(result.current.draft).toBe('original draft');
  });

  it('clears any prior edit error', async () => {
    const failing = jest.fn().mockRejectedValue(new Error('boom'));
    const { result } = makeHook({
      messages: [msg({ id: 'own', senderId: ME, content: 'mine' })],
      onEditMessage: failing,
    });
    act(() => result.current.openEditComposerFor('own'));
    act(() => result.current.onChangeDraft('edited'));
    await act(async () => {
      result.current.onSend();
    });
    expect(result.current.editError).not.toBeNull();
    act(() => result.current.openEditComposerFor('own'));
    expect(result.current.editError).toBeNull();
  });
});

describe('useChatComposerState — cancelEdit via chip', () => {
  it('restores the stashed draft and clears the edit', () => {
    const { result } = makeHook({
      messages: [msg({ id: 'own', senderId: ME, content: 'old' })],
    });
    act(() => result.current.onChangeDraft('stashed'));
    act(() => result.current.openEditComposerFor('own'));
    act(() => result.current.composingEdit?.onCancel());
    expect(result.current.composingEdit).toBeNull();
    expect(result.current.draft).toBe('stashed');
  });
});

describe('useChatComposerState — onSend', () => {
  it('is a no-op when the draft is whitespace-only', () => {
    const { result, onSendNew, onEditMessage } = makeHook();
    act(() => result.current.onChangeDraft('   '));
    act(() => result.current.onSend());
    expect(onSendNew).not.toHaveBeenCalled();
    expect(onEditMessage).not.toHaveBeenCalled();
  });

  it('sends a new message with no replyTo by default', () => {
    const { result, onSendNew } = makeHook();
    act(() => result.current.onChangeDraft('  hi  '));
    act(() => result.current.onSend());
    expect(onSendNew).toHaveBeenCalledWith({ content: 'hi', replyTo: null });
    expect(result.current.draft).toBe('');
  });

  it('sends a new message with replyTo when a reply chip is open', () => {
    const { result, onSendNew } = makeHook({
      messages: [
        msg({ id: 'target', senderId: PEER, content: 'peer says hi' }),
      ],
    });
    act(() => result.current.openReplyComposerFor('target'));
    act(() => result.current.onChangeDraft('thanks'));
    act(() => result.current.onSend());
    expect(onSendNew).toHaveBeenCalledWith({
      content: 'thanks',
      replyTo: {
        id: 'target',
        authorId: PEER,
        snippet: 'peer says hi',
        isDeleted: false,
      },
    });
    expect(result.current.composingReplyTo).toBeNull();
    expect(result.current.draft).toBe('');
  });

  it('fires the edit callback (not send) when an edit chip is open and clears edit synchronously', async () => {
    const onEditMessage = jest.fn().mockResolvedValue(undefined);
    const { result, onSendNew } = makeHook({
      messages: [msg({ id: 'own', senderId: ME, content: 'old' })],
      onEditMessage,
    });
    act(() => result.current.openEditComposerFor('own'));
    act(() => result.current.onChangeDraft('new content'));
    await act(async () => {
      result.current.onSend();
    });
    expect(onEditMessage).toHaveBeenCalledWith({
      messageId: 'own',
      content: 'new content',
    });
    expect(onSendNew).not.toHaveBeenCalled();
    expect(result.current.composingEdit).toBeNull();
    expect(result.current.draft).toBe('');
    expect(result.current.editError).toBeNull();
  });

  it('surfaces editErrorMessage when the edit callback rejects', async () => {
    const onEditMessage = jest.fn().mockRejectedValue(new Error('boom'));
    const { result } = makeHook({
      messages: [msg({ id: 'own', senderId: ME, content: 'old' })],
      onEditMessage,
    });
    act(() => result.current.openEditComposerFor('own'));
    act(() => result.current.onChangeDraft('updated'));
    await act(async () => {
      result.current.onSend();
    });
    expect(result.current.editError).toBe('Não foi possível editar a mensagem.');
    // Edit + draft are still cleared synchronously even though the request failed.
    expect(result.current.composingEdit).toBeNull();
    expect(result.current.draft).toBe('');
  });

  it('clears a stale editError when a subsequent edit succeeds', async () => {
    const onEditMessage = jest
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(undefined);
    const { result } = makeHook({
      messages: [msg({ id: 'own', senderId: ME, content: 'old' })],
      onEditMessage,
    });
    act(() => result.current.openEditComposerFor('own'));
    act(() => result.current.onChangeDraft('first try'));
    await act(async () => {
      result.current.onSend();
    });
    expect(result.current.editError).not.toBeNull();
    act(() => result.current.openEditComposerFor('own'));
    act(() => result.current.onChangeDraft('second try'));
    await act(async () => {
      result.current.onSend();
    });
    expect(result.current.editError).toBeNull();
  });
});

describe('useChatComposerState — onDismissEditError', () => {
  it('clears the error banner state', async () => {
    const onEditMessage = jest.fn().mockRejectedValue(new Error('boom'));
    const { result } = makeHook({
      messages: [msg({ id: 'own', senderId: ME, content: 'old' })],
      onEditMessage,
    });
    act(() => result.current.openEditComposerFor('own'));
    act(() => result.current.onChangeDraft('x'));
    await act(async () => {
      result.current.onSend();
    });
    expect(result.current.editError).not.toBeNull();
    act(() => result.current.onDismissEditError());
    expect(result.current.editError).toBeNull();
  });
});

import { truncateReplySnippet } from './replySnippet';

describe('truncateReplySnippet', () => {
  it('returns null for null input', () => {
    expect(truncateReplySnippet(null)).toBeNull();
  });

  it('returns null for whitespace-only input', () => {
    expect(truncateReplySnippet('   ')).toBeNull();
    expect(truncateReplySnippet('\n\n\t  ')).toBeNull();
  });

  it('normalises internal whitespace and trims edges', () => {
    expect(truncateReplySnippet('  hello   world  ')).toBe('hello world');
  });

  it('collapses newlines into single spaces', () => {
    expect(truncateReplySnippet('line one\nline two\nline three')).toBe(
      'line one line two line three',
    );
  });

  it('returns content as-is when length is ≤ 120 chars after normalisation', () => {
    const exact = 'a'.repeat(120);
    expect(truncateReplySnippet(exact)).toBe(exact);
  });

  it('truncates to 117 chars + … when length exceeds 120', () => {
    const long = 'a'.repeat(121);
    const result = truncateReplySnippet(long);
    expect(result).toBe('a'.repeat(117) + '…');
    expect(result?.length).toBe(118);
  });

  it('trims trailing whitespace before appending the ellipsis on truncation', () => {
    const input = 'a'.repeat(115) + '   ' + 'b'.repeat(50);
    const result = truncateReplySnippet(input);
    expect(result?.endsWith('…')).toBe(true);
    expect(result).not.toContain('  ');
  });
});

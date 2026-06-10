import { formatAnchorLabel } from './labels';

describe('formatAnchorLabel', () => {
  it('returns the trimmed label when present', () => {
    expect(formatAnchorLabel('  Morumbi  ')).toBe('Morumbi');
  });

  it('returns an empty string when the label is null or blank', () => {
    expect(formatAnchorLabel(null)).toBe('');
    expect(formatAnchorLabel('   ')).toBe('');
  });
});

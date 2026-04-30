import { formatDistance } from './distance';

describe('formatDistance', () => {
  it('renders 0 meters as 0M', () => {
    expect(formatDistance(0)).toBe('0M');
  });

  it('rounds sub-kilometer values to the nearest 10 meters', () => {
    expect(formatDistance(47)).toBe('50M');
    expect(formatDistance(213)).toBe('210M');
    expect(formatDistance(995)).toBe('1000M');
  });

  it('switches to one-decimal pt-BR kilometers between 1km and 10km', () => {
    expect(formatDistance(1000)).toBe('1,0Km');
    expect(formatDistance(1234)).toBe('1,2Km');
    expect(formatDistance(9_949)).toBe('9,9Km');
  });

  it('uses integer kilometers from 10km upward', () => {
    expect(formatDistance(10_000)).toBe('10Km');
    expect(formatDistance(12_500)).toBe('13Km');
  });
});

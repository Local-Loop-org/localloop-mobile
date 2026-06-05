import { formatLastSeen } from './chat';

describe('formatLastSeen', () => {
  const now = new Date('2026-06-05T10:15:00');

  it('shows only the time for today', () => {
    expect(formatLastSeen('2026-06-05T09:30:00', now)).toBe('Visto às 09:30');
  });

  it('names yesterday with the time', () => {
    expect(formatLastSeen('2026-06-04T22:10:00', now)).toBe(
      'Visto ontem às 22:10',
    );
  });

  it('includes the day and month for older dates this year', () => {
    expect(formatLastSeen('2026-05-28T08:05:00', now)).toBe(
      'Visto 28/05 às 08:05',
    );
  });

  it('includes the full date for previous years', () => {
    expect(formatLastSeen('2025-12-31T23:59:00', now)).toBe(
      'Visto 31/12/2025 às 23:59',
    );
  });

  it('returns an empty string for invalid input', () => {
    expect(formatLastSeen('not-a-date', now)).toBe('');
  });
});

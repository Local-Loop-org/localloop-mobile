import { formatLastActivity } from './lastActivity';

describe('formatLastActivity', () => {
  const now = new Date('2026-05-03T15:00:00.000Z').getTime();

  it('renders "agora" for less than 60 seconds ago', () => {
    expect(formatLastActivity('2026-05-03T15:00:00.000Z', now)).toBe('agora');
    expect(formatLastActivity('2026-05-03T14:59:30.000Z', now)).toBe('agora');
  });

  it('renders minutes for the first hour', () => {
    expect(formatLastActivity('2026-05-03T14:55:00.000Z', now)).toBe('5m');
    expect(formatLastActivity('2026-05-03T14:01:00.000Z', now)).toBe('59m');
  });

  it('renders hours for the first day', () => {
    expect(formatLastActivity('2026-05-03T13:00:00.000Z', now)).toBe('2h');
    expect(formatLastActivity('2026-05-02T15:30:00.000Z', now)).toBe('23h');
  });

  it('renders "ontem" between 24 and 48 hours ago', () => {
    expect(formatLastActivity('2026-05-02T14:00:00.000Z', now)).toBe('ontem');
    expect(formatLastActivity('2026-05-01T15:30:00.000Z', now)).toBe('ontem');
  });

  it('renders dd/MM for anything older than 48 hours', () => {
    expect(formatLastActivity('2026-05-01T14:00:00.000Z', now)).toBe('01/05');
    expect(formatLastActivity('2026-04-12T10:00:00.000Z', now)).toBe('12/04');
  });
});

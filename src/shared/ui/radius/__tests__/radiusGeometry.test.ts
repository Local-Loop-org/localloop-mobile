import {
  RING_BASE_PX,
  RING_MAX_FACTOR,
  formatRadiusKm,
  radiusToRingPx,
} from '../radiusGeometry';

const SIZE = { width: 327, height: 170 };
const MAX = Math.min(SIZE.width, SIZE.height) * RING_MAX_FACTOR;

describe('radiusToRingPx', () => {
  it('clamps at the base value when radiusKm is at the slider minimum (0.2)', () => {
    expect(radiusToRingPx(0.2, SIZE)).toBe(RING_BASE_PX + 0.2 * 6);
  });

  it('caps at min(width,height) * RING_MAX_FACTOR for very large radii', () => {
    expect(radiusToRingPx(100, SIZE)).toBe(MAX);
  });

  it('grows monotonically between the floor and the cap', () => {
    const samples = [0.5, 1, 2, 5, 10].map((km) => radiusToRingPx(km, SIZE));
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThan(samples[i - 1]);
    }
  });

  it('never exceeds the cap regardless of map aspect', () => {
    const square = { width: 200, height: 200 };
    expect(radiusToRingPx(50, square)).toBe(200 * RING_MAX_FACTOR);
  });
});

describe('formatRadiusKm', () => {
  it('renders sub-1 km values in metres', () => {
    expect(formatRadiusKm(0.2)).toBe('200 m');
    expect(formatRadiusKm(0.95)).toBe('950 m');
  });

  it('renders integer kilometres without decimals', () => {
    expect(formatRadiusKm(1)).toBe('1 km');
    expect(formatRadiusKm(25)).toBe('25 km');
  });

  it('renders fractional kilometres with one decimal', () => {
    expect(formatRadiusKm(2.5)).toBe('2.5 km');
    expect(formatRadiusKm(7.3)).toBe('7.3 km');
  });
});

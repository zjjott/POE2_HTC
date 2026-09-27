import { describe, expect, it } from 'vitest';
import { smallestFeasibleSurcharge } from './markovItemCap.ts';

describe('smallestFeasibleSurcharge', () => {
  it('returns the smallest surcharge whose count is within the cap', () => {
    const items = (lambda: number): number => (lambda < 10 ? 50 : 3);
    const got = smallestFeasibleSurcharge(10, items);
    expect(got).toBeDefined();
    expect(items(got!)).toBeLessThanOrEqual(10);
    expect(items(got! * 0.99)).toBeGreaterThan(10);
  });

  it('returns undefined when no surcharge gets under the cap', () => {
    expect(smallestFeasibleSurcharge(2, () => 40, { doublings: 4 })).toBeUndefined();
  });

  it('stops at the last feasible surcharge when a later trial does not settle', () => {
    let calls = 0;
    const got = smallestFeasibleSurcharge(5, (lambda) => {
      calls++;
      if (calls > 3) return Number.NaN;
      return lambda < 4 ? 20 : 2;
    });
    expect(got).toBe(4);
  });
});

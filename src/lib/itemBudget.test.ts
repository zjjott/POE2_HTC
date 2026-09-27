import { describe, expect, it } from 'vitest';
import { chooseAffordable, qualifyingRows, type BudgetHolding } from './itemBudget';

const row = (over: Partial<BudgetHolding> & Pick<BudgetHolding, 'key' | 'present' | 'finish' | 'items'>): BudgetHolding => ({
  positions: over.present.map((p) => [p]),
  rarity: 'rare',
  ...over,
});

describe('qualifyingRows', () => {
  const holdings = [
    row({ key: 'done', present: ['A', 'B'], finish: 0, items: 1 }),
    row({ key: 'a-cheap', present: ['A'], finish: 10, items: 4 }),
    row({ key: 'a-dear', present: ['B'], finish: 30, items: 2 }),
    row({ key: 'none', present: [], finish: 80, items: 40 }),
    row({ key: 'many', present: ['A'], finish: 5, items: 200 }),
  ];

  it('drops the finished item and anything over the cap, and keeps the cheapest of each size', () => {
    const got = qualifyingRows(holdings, 100);
    expect(got.map((r) => r.key)).toEqual(['none', 'a-cheap']);
  });

  it('keeps a one-mod item once the cap falls under the empty item', () => {
    expect(qualifyingRows(holdings, 10).map((r) => r.key)).toEqual(['a-cheap']);
  });

  it('returns nothing for a cap that no open item meets', () => {
    expect(qualifyingRows(holdings, 1)).toEqual([]);
  });
});

describe('chooseAffordable', () => {
  const rows = [
    row({ key: 'bare', present: [], finish: 50, items: 20 }),
    row({ key: 'one', present: ['A'], finish: 8, items: 3 }),
  ];
  const white = { items: 400, total: 40 };

  it('leaves out an unpriced item, and does not treat the blank as free', () => {
    const got = chooseAffordable(rows, new Map([['one', 100]]), white, 100);
    expect(got?.key).toBe('one');
    expect(got?.total).toBe(108);
  });

  it('uses the white base when it fits the cap and nothing priced beats it', () => {
    const got = chooseAffordable(rows, new Map([['one', 100]]), { items: 12, total: 40 }, 100);
    expect(got?.kind).toBe('white');
    expect(got?.total).toBe(40);
  });

  it('drops the white base once its own count is over the cap', () => {
    const got = chooseAffordable(rows, new Map([['bare', 1], ['one', 5]]), white, 100);
    expect(got?.key).toBe('one');
    expect(got?.total).toBe(13);
  });

  it('returns nothing when every buyable item was left unpriced and white does not fit', () => {
    expect(chooseAffordable(rows, new Map(), white, 100)).toBeUndefined();
  });
});

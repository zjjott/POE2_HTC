// Which intermediate item to buy when a from-white craft would otherwise consume more bases than
// the player will. Read out of the solve that already ran: `items` is `1 + q(s) / (1 − q(start))`,
// this item plus every later white base the plan still bins back to. Filling a price does not
// re-run value iteration — the finishing cost is that solve's, and a blank price is "not for sale".

/** One clean starting item the first solve priced. */
export interface BudgetHolding {
  readonly key: string;
  readonly present: readonly string[];
  readonly positions: readonly (readonly string[])[];
  readonly rarity: 'magic' | 'rare';
  /** Expected currency to finish from it, the purchase not included. */
  readonly finish: number;
  /** Expected items consumed, this one included. */
  readonly items: number;
}

/** Crafting from a white base, the base included in `total`. */
export interface WhiteStart {
  readonly items: number;
  readonly total: number;
}

export interface BudgetChoice {
  readonly key: string;
  readonly kind: 'white' | 'buy';
  readonly present: readonly string[];
  readonly positions: readonly (readonly string[])[];
  readonly rarity?: 'magic' | 'rare';
  readonly items: number;
  /** Currency to finish. For a white base this is the whole craft, base included. */
  readonly finish: number;
  /** What the player typed for a bought item. Zero for the white base, whose price is already in `finish`. */
  readonly price: number;
  readonly total: number;
}

const WHITE_KEY = 'white';

/**
 * The best clean item at each rarity and mod-count whose expected item count is within `n`.
 *
 * The finished item is dropped: buying it is buying the target, and its count is 1 by construction.
 * Fewest modifiers first — the listing a market is most likely to have — then the cheaper finish.
 */
export function qualifyingRows(holdings: readonly BudgetHolding[], n: number): BudgetHolding[] {
  if (!(n >= 1) || !Number.isFinite(n)) return [];
  const maxMods = holdings.reduce((m, h) => Math.max(m, h.present.length), 0);
  const open = holdings.filter((h) => h.present.length < maxMods && h.items <= n && Number.isFinite(h.finish) && h.finish >= 0);
  const best = new Map<string, BudgetHolding>();
  for (const h of open) {
    const id = `${h.rarity}:${h.present.length}`;
    const prev = best.get(id);
    if (!prev || h.finish < prev.finish
      || (h.finish === prev.finish && (h.items < prev.items || (h.items === prev.items && h.key < prev.key)))) {
      best.set(id, h);
    }
  }
  return [...best.values()].sort((a, b) => a.present.length - b.present.length || a.finish - b.finish
    || (a.rarity === b.rarity ? 0 : a.rarity === 'magic' ? -1 : 1)
    || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

/**
 * The affordable option with the lowest total, after the player has priced what they can buy.
 *
 * A missing price is not zero: that item is left out, which is how "too expensive to buy" is said.
 * The white base is a candidate only while its own expected count is within `n`, at the from-scratch
 * total — its price was already charged there, so it is not typed again.
 */
export function chooseAffordable(
  rows: readonly BudgetHolding[],
  prices: ReadonlyMap<string, number>,
  white: WhiteStart | undefined,
  n: number,
): BudgetChoice | undefined {
  if (!(n >= 1) || !Number.isFinite(n)) return undefined;
  const options: BudgetChoice[] = [];
  if (white && white.items <= n && Number.isFinite(white.total) && white.total >= 0) {
    options.push({
      key: WHITE_KEY, kind: 'white', present: [], positions: [], items: white.items,
      finish: white.total, price: 0, total: white.total,
    });
  }
  for (const r of rows) {
    if (r.items > n || !Number.isFinite(r.finish)) continue;
    const price = prices.get(r.key);
    if (price === undefined || !Number.isFinite(price) || price < 0) continue;
    options.push({
      key: r.key, kind: 'buy', present: r.present, positions: r.positions, rarity: r.rarity,
      items: r.items, finish: r.finish, price, total: price + r.finish,
    });
  }
  options.sort((a, b) => a.total - b.total || a.items - b.items || a.present.length - b.present.length
    || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return options[0];
}

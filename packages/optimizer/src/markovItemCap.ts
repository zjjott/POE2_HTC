/**
 * The smallest restart surcharge whose policy stays within an expected-item cap.
 *
 * A from-white plan minimises exalt-equivalents. A white base priced near zero makes binning
 * the item the right move in most states, so the expected number of bases — `1 / (1 − q)` —
 * can be huge while the currency cost stays small. Raising what a restart costs, and nothing
 * else, makes those states keep the item instead. The smallest such raise whose expected
 * count is at most `maxItems` is the cheapest currency plan on this penalty: a larger one
 * only spends more to waste even fewer bases.
 *
 * `trial(lambda)` re-solves at that surcharge and returns the expected item count.
 * A non-finite return means the attempt did not settle (the clock, usually); the search
 * stops and returns the last surcharge that did fit, if it had one. The count is treated
 * as non-increasing in lambda, jumps included — bisection only needs the boundary.
 */
export function smallestFeasibleSurcharge(
  maxItems: number,
  trial: (lambda: number) => number,
  opts?: { readonly doublings?: number; readonly bisectSteps?: number },
): number | undefined {
  const doublings = opts?.doublings ?? 24;
  const bisectSteps = opts?.bisectSteps ?? 24;
  let feasible: number | undefined;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < doublings; i++) {
    const n = trial(hi);
    if (!Number.isFinite(n)) return feasible;
    if (n <= maxItems) { feasible = hi; break; }
    lo = hi;
    hi *= 2;
  }
  if (feasible === undefined) return undefined;
  for (let i = 0; i < bisectSteps; i++) {
    if (hi <= lo * 1.001 + 1e-6) break;
    const mid = (lo + hi) / 2;
    const n = trial(mid);
    if (!Number.isFinite(n)) return feasible;
    if (n <= maxItems) { hi = mid; feasible = mid; }
    else lo = mid;
  }
  return feasible;
}

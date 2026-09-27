import React from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { priceBasis, type Engine, type EngineMarkovResult, type TargetInput } from '../../lib/engine';
import { exactExalts, formatIn, pickUnit, type CostUnit, type Rates } from '../../lib/currency';
import { chooseAffordable, qualifyingRows, type BudgetHolding } from '../../lib/itemBudget';
import { parsePrice } from '../../lib/startingItem';
import { slotsOfHolding } from '../../lib/gearTrade';
import { cn } from '../../lib/utils';
import { GearTradeLink } from './GearTradeLink';
import { tr, useLocale } from '../../lib/i18n';

const modText = (m: string): string => m.split('\n').join(' / ');
const rarityWord = (r: 'magic' | 'rare'): string =>
  r === 'magic' ? tr('Magic', 'ui.magicWord') : tr('Rare', 'ui.rareWord');
const nameOf = (present: readonly string[], rarity: 'magic' | 'rare'): string =>
  `${rarityWord(rarity)} · ${present.map(modText).join(' + ')}`;

const RARITY_CLS = {
  magic: 'border-sky-500/50 text-sky-700 dark:text-sky-300',
  rare: 'border-yellow-500/60 text-yellow-700 dark:text-yellow-300',
} as const;

/** How many items, as a count a player can compare with the cap. */
function formatItems(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n >= 100) return Math.round(n).toLocaleString('en');
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

/**
 * Cap how many items a from-white craft may consume, then price the intermediates that fit.
 *
 * The count and the finishing cost both come from the solve already on screen. Typing a price and
 * pressing the button only chooses among those rows: a blank price is an item that is not for sale.
 */
const ItemBudget: React.FC<{
  readonly markov: EngineMarkovResult;
  readonly engine: Engine;
  readonly rates?: Rates;
  readonly solvedFor?: { readonly baseId: string; readonly targets: readonly TargetInput[] };
}> = ({ markov, engine, rates, solvedFor }) => {
  useLocale();
  const [nText, setNText] = React.useState('100');
  const solvedCap = markov.maxItems;
  const [typed, setTyped] = React.useState<Readonly<Record<string, string>>>({});
  const [asked, setAsked] = React.useState(false);
  const [priceUnitKey, setPriceUnitKey] = React.useState<CostUnit['key']>('exalt');

  const n = solvedCap ?? Number(nText);
  const nOk = Number.isInteger(n) && n >= 1;
  const inputItems = markov.inputItems;
  const scratch = (markov.restartCost ?? 0) + markov.expectedCost;
  const holdings: BudgetHolding[] = (markov.holdings ?? []).flatMap((h) => (
    h.items === undefined ? [] : [{
      key: h.key, present: h.present, positions: h.positions, rarity: h.rarity, finish: h.cost, items: h.items,
    }]
  ));
  const rows = nOk && inputItems !== undefined ? qualifyingRows(holdings, n) : [];
  const unit = pickUnit(Math.max(scratch, ...rows.map((r) => r.finish), 0), rates);
  const units: CostUnit[] = [
    { key: 'exalt', label: 'ex', perExalt: 1 },
    ...(rates?.chaos ? [{ key: 'chaos' as const, label: 'chaos', perExalt: rates.chaos }] : []),
    ...(rates?.divine ? [{ key: 'divine' as const, label: 'div', perExalt: rates.divine }] : []),
  ];
  const priceUnit = units.find((u) => u.key === priceUnitKey) ?? units[0]!;
  const fmt = (x: number): string => formatIn(unit, x);

  const prices = new Map<string, number>();
  for (const [key, text] of Object.entries(typed)) {
    const v = parsePrice(text);
    if (v !== undefined) prices.set(key, v * priceUnit.perExalt);
  }
  const choice = asked && nOk && inputItems !== undefined
    ? chooseAffordable(rows, prices, { items: inputItems, total: scratch }, n)
    : undefined;
  const league = priceBasis(engine).league;

  if (markov.bound !== 'exact' || inputItems === undefined) return null;

  const th = 'whitespace-nowrap pb-1 pr-3 font-normal';
  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-bold">{tr('Within an item cap', 'ui.itemCap')}</h3>
      <p className="text-xs text-muted-foreground">
        {solvedCap === undefined ? tr(
          `From a white base this plan expects to use ${formatItems(inputItems)} items, counting every base it bins and replaces. Set a cap and the rows below are the least-finished items that stay inside it. Open the Tencent trade link, type what one costs, and leave a row blank when you cannot buy it.`,
          'ui.itemCapIntro',
          { items: formatItems(inputItems) },
        ) : tr(
          `From a white base this plan expects to use ${formatItems(inputItems)} items, counting every base it bins and replaces. The cap of ${solvedCap} was part of that solve. The rows below are the least-finished items that stay inside it. Open the Tencent trade link, type what one costs, and leave a row blank when you cannot buy it.`,
          'ui.itemCapIntroSolved',
          { items: formatItems(inputItems), n: solvedCap },
        )}
      </p>
      {solvedCap === undefined && (
        <label className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">{tr('Item cap', 'ui.itemCapLabel')}</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={nText}
            onChange={(e) => setNText(e.target.value.replace(/[^\d]/g, ''))}
            aria-label={tr('Maximum number of items this craft may consume', 'ui.itemCapAria')}
            className="w-20 rounded border border-border bg-background px-1.5 py-0.5 text-right tabular-nums"
          />
        </label>
      )}
      {!nOk && (
        <p className="text-xs text-amber-700 dark:text-amber-300">{tr('Type a whole number of items, at least 1.', 'ui.itemCapBad')}</p>
      )}
      {markov.itemCapBound && (
        <p className="text-xs text-muted-foreground">
          {tr(
            `The solve spent more currency so the expected count stays within ${n}. That cost, above, is the currency the plan spends. The extra charge used to compare a wasted base is not included.`,
            'ui.itemCapBoundNote',
            { n },
          )}
        </p>
      )}
      {markov.itemCapMet === false && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          {tr(
            `The cap of ${n} was not met: this plan still expects ${formatItems(inputItems)} items. Raise the cap, or raise Search effort and compute again.`,
            'ui.itemCapUnmet',
            { n, items: formatItems(inputItems) },
          )}
        </p>
      )}
      {nOk && inputItems <= n && markov.itemCapBound !== true && (
        <p className="text-xs text-muted-foreground">
          {tr(
            `A white base already fits: ${formatItems(inputItems)} items, under the cap of ${n}. Its expected cost stays ${fmt(scratch)}.`,
            'ui.itemCapWhiteFits',
            { items: formatItems(inputItems), n, cost: fmt(scratch) },
          )}
        </p>
      )}
      {nOk && rows.length === 0 && inputItems > n && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          {tr(`No intermediate item finishes within ${n} items. Raise the cap.`, 'ui.itemCapNone', { n })}
        </p>
      )}
      {rows.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="flex items-center gap-1.5">
              <span className="text-muted-foreground">{tr('Trade prices in', 'ui.pricesIn')}</span>
              <select
                value={priceUnit.key}
                onChange={(e) => setPriceUnitKey(e.target.value as CostUnit['key'])}
                className="rounded border border-border bg-background px-1 py-0.5"
              >
                {units.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}
              </select>
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[11px] text-muted-foreground">
                  <th className={th}>{tr('Item to buy', 'ui.itemToBuy')}</th>
                  <th className={cn(th, 'text-right')} title={tr('Expected items consumed to finish from here, this one included', 'ui.itemCountTitle')}>{tr('Items', 'ui.items')}</th>
                  <th className={cn(th, 'text-right')}>{tr('Cost to finish', 'ui.costToFinish')}</th>
                  <th className={cn(th, 'text-right')}>{tr('Trade price', 'ui.tradePrice')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const text = typed[r.key] ?? '';
                  const unreadable = text.trim() !== '' && parsePrice(text) === undefined;
                  const label = nameOf(r.present, r.rarity);
                  return (
                    <tr key={r.key} className={cn('border-t border-border/60', choice?.key === r.key && 'bg-emerald-500/10')}>
                      <td className="min-w-[14rem] py-1.5 pr-3">
                        <div className="flex items-start gap-1.5">
                          <span className={cn('mt-px shrink-0 rounded border px-1 text-[10px] font-semibold uppercase', RARITY_CLS[r.rarity])}>
                            {rarityWord(r.rarity)}
                          </span>
                          <div>
                            {r.present.length === 0
                              ? <span className="block text-muted-foreground">{tr('No target modifiers yet', 'ui.noTargetsYet')}</span>
                              : r.present.map((m) => <span key={m} className="block">{modText(m)}</span>)}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap py-1.5 pr-3 text-right tabular-nums">{formatItems(r.items)}</td>
                      <td className="whitespace-nowrap py-1.5 pr-3 text-right tabular-nums" title={exactExalts(r.finish)}>{fmt(r.finish)}</td>
                      <td className="py-1.5 pr-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="inline-flex items-center gap-1">
                            <input
                              type="text" inputMode="decimal" autoComplete="off" placeholder="—"
                              value={text}
                              onChange={(e) => { const v = e.target.value; setTyped((t) => ({ ...t, [r.key]: v })); }}
                              aria-label={tr(`Trade price for ${label}, in ${priceUnit.label}`, 'ui.priceFor', { name: label, unit: priceUnit.label })}
                              aria-invalid={unreadable || undefined}
                              title={unreadable ? tr('Not a price — type a number, like 12 or 0.5', 'ui.notAPrice') : undefined}
                              className={cn('w-16 rounded border bg-background px-1.5 py-0.5 text-right tabular-nums', unreadable ? 'border-red-500' : 'border-border')}
                            />
                            <span className="w-8 text-left text-muted-foreground">{priceUnit.label}</span>
                          </span>
                          {solvedFor && (
                            <GearTradeLink
                              data={engine.data} league={league} baseId={solvedFor.baseId} realm="cn"
                              slots={slotsOfHolding(r.positions, solvedFor.targets)} rarity={r.rarity} label={label}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Button type="button" size="sm" disabled={!nOk} onClick={() => setAsked(true)}>
            {tr('Price the cap', 'ui.priceTheCap')}
          </Button>
          {choice && (
            <p role="status" className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs">
              {choice.kind === 'white' ? tr(
                `Within ${n} items the lowest priced way is still a white base: ${formatItems(choice.items)} items, ${fmt(choice.total)} expected.`,
                'ui.itemCapWhiteWins',
                { n, items: formatItems(choice.items), total: fmt(choice.total) },
              ) : tr(
                `Within ${n} items, buy ${nameOf(choice.present, choice.rarity!)}: ${formatItems(choice.items)} items expected, ${fmt(choice.total)} in all — ${fmt(choice.price)} for the item plus ${fmt(choice.finish)} to finish. A row you left blank was left out.`,
                'ui.itemCapBuyWins',
                {
                  n, name: nameOf(choice.present, choice.rarity!), items: formatItems(choice.items),
                  total: fmt(choice.total), price: fmt(choice.price), finish: fmt(choice.finish),
                },
              )}
            </p>
          )}
          {asked && !choice && (
            <p role="status" className="text-xs text-amber-700 dark:text-amber-300">
              {tr('Nothing you priced finishes within the cap, and a white base does not either. Type a price, or raise the cap.', 'ui.itemCapNoPick')}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            {tr('The finishing cost is the solve above, not a second one: adding the price you typed does not change which orb the plan plays. Each row assumes the rest of the item is empty. A blank price means that item is not for sale, and is not counted as free.', 'ui.itemCapFoot')}
          </p>
        </>
      )}
    </Card>
  );
};

export default ItemBudget;

import React from 'react';
import type { PatchData } from '../../../packages/engine/src/types';
import { gearSearch, loadGearTrade, type GearTrade, type WantedMod } from '../../lib/gearTrade';
import { useTradeUrl } from '../../lib/tradeLink';
import { tr, useLocale } from '../../lib/i18n';
import { cn } from '../../lib/utils';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** The gear trade ids, loaded on first use and shared by every link on the page. */
function useGearTrade(): GearTrade | undefined {
  const [trade, setTrade] = React.useState<GearTrade>();
  React.useEffect(() => {
    let live = true;
    void loadGearTrade().then((t) => { if (live) setTrade(t); });
    return () => { live = false; };
  }, []);
  return trade;
}

/**
 * "Search on trade" for an item of gear the planner shows — the finished item, or one to buy instead.
 *
 * Opens the official trade site with the search filled in: the base's class, the rarity, every modifier
 * at the tier asked of it or better, instant buyout, cheapest first. The app never asks the site anything
 * itself (tradeLink.ts). Nothing renders until the ids have loaded, or without a league to search in.
 */
export const GearTradeLink: React.FC<{
  data: PatchData;
  league: string | undefined;
  baseId: string;
  slots: readonly (readonly WantedMod[])[];
  rarity: 'magic' | 'rare' | 'nonunique';
  /** Names the item for a screen reader: "Search on trade for a Rare holding …". */
  label: string;
  /** Force the Tencent realm link, whatever language the page is in. */
  realm?: 'cn';
  className?: string;
}> = ({ data, league, baseId, slots, rarity, label, realm, className }) => {
  useLocale();
  const trade = useGearTrade();
  const { search, loose } = trade ? gearSearch(trade, data, baseId, slots) : { search: { stats: [] }, loose: false };
  const href = useTradeUrl(trade && (league || realm === 'cn') ? { league: league ?? 'cn', rarity, ...search } : null, realm);
  if (!trade || !href || (!league && realm !== 'cn')) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={tr(`Search on trade for ${label}`, realm === 'cn' ? 'ui.searchTradeForCn' : 'ui.searchTradeFor', { name: label })}
      title={loose
        ? tr('Opens the trade site. One of these modifiers has no trade stat, or shares its search with a similar one, so the listings may be looser than this item — check them.', 'ui.searchTradeLoose')
        : tr(
          realm === 'cn'
            ? 'Opens the Tencent trade site (poe.game.qq.com, 周年庆巅峰挑战): this class of item, every modifier at the tier asked of it or better, instant buyout, cheapest first'
            : 'Opens the trade site: this class of item, every modifier at the tier asked of it or better, instant buyout, cheapest first',
          realm === 'cn' ? 'ui.searchTradeTitleCn' : 'ui.searchTradeTitle',
        )}
      className={cn('inline-flex items-center rounded border border-border px-1.5 py-0.5 text-xs whitespace-nowrap hover:border-primary/60 hover:text-foreground', FOCUS, className)}
    >
      {tr(realm === 'cn' ? 'Tencent trade' : 'Search on trade', realm === 'cn' ? 'ui.searchTradeCn' : 'ui.searchTrade')}{loose && <span aria-hidden="true" className="ml-1 text-amber-400">≈</span>}
    </a>
  );
};

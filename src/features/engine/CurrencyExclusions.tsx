import React, { useState } from 'react';
import {
  ALL_GROUPS, setExclusions, toExcludedKeys, useExclusions,
  type CurrencyGroup,
} from '../../lib/currencyPrefs';
import { tr, useLocale } from '../../lib/i18n';

/**
 * "Which currencies don't you have?" — so the planners stop recommending routes you can't run.
 *
 * Each row is a group you mark as missing. Marking it excludes the whole group; ticking members inside
 * narrows the exclusion to just those. That rule is non-monotone (unticking your last member widens
 * the exclusion back to everything), so **every ticked row states its effect in words** — the jump is
 * never silent, which is the whole reason the plain-language line exists.
 *
 * The setting is shared and persisted (see currencyPrefs), so both planners always run under the same
 * rules and it survives a reload.
 */
const CurrencyExclusions: React.FC = () => {
  const exclusions = useExclusions();
  useLocale();
  const groupName = (g: CurrencyGroup) => tr(g.label, `grp.${g.id}`);
  const memberName = (id: string, label: string) => tr(label, `mem.${id}`);
  const [open, setOpen] = useState(false);
  const excludedCount = toExcludedKeys(exclusions).length;

  const toggleGroup = (g: CurrencyGroup) => {
    const next: Record<string, { only: readonly string[] }> = { ...exclusions };
    if (next[g.id]) delete next[g.id];
    else next[g.id] = { only: [] }; // marking a group starts at "all of it"
    setExclusions(next);
  };

  const toggleMember = (g: CurrencyGroup, memberId: string) => {
    const only = exclusions[g.id]?.only ?? [];
    const nextOnly = only.includes(memberId) ? only.filter((m) => m !== memberId) : [...only, memberId];
    setExclusions({ ...exclusions, [g.id]: { only: nextOnly } });
  };

  return (
    <div className="rounded-md border border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        aria-expanded={open}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {tr('Currency I don’t have', 'ui.currencyMissing')}
        </span>
        <span className="text-xs text-muted-foreground">
          {excludedCount === 0 ? tr('nothing excluded', 'ui.nothingExcluded') : tr(`${excludedCount} excluded`, 'ui.nExcluded', { n: excludedCount })}{' '}
          <span aria-hidden="true">{open ? '▾' : '▸'}</span>
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
          <p className="text-[11px] text-muted-foreground">
            {tr('Plans will never use anything you tick here. If that makes a craft impossible, you’ll be told rather than shown a plan you can’t run.', 'ui.excludeHint')}
          </p>
          {ALL_GROUPS.map((g) => {
            const entry = exclusions[g.id];
            const on = entry !== undefined;
            return (
              <div key={g.id} className="text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={on} onChange={() => toggleGroup(g)} />
                  <span>{groupName(g)}</span>
                  {on && (
                    <span className="text-[11px] text-amber-300">— {entry.only.length === 0 || g.members.length === 0
                      ? tr(`excluding all ${g.label.toLowerCase()}`, 'ui.excludingAll', { name: groupName(g) })
                      : tr(`excluding only ${g.members.filter((m) => entry.only.includes(m.id)).map((m) => m.label).join(', ')}`, 'ui.excludingOnly', { name: g.members.filter((m) => entry.only.includes(m.id)).map((m) => memberName(m.id, m.label)).join('、') })}</span>
                  )}
                </label>
                {/* A row whose label cannot carry its own effect says it in a line underneath, always
                    visible — the strength shortcut spans currencies the reader can also see listed
                    separately below, and "what is this?" is the wrong thing to make them guess. */}
                {g.hint && <p className="ml-6 text-[11px] text-muted-foreground">{tr(g.hint, `grp.${g.id}.hint`)}</p>}
                {/* Narrowing only appears once the group is marked, and only where there is something
                    to narrow: Alchemy and Annulment have exactly one version each. */}
                {on && g.members.length > 0 && (
                  <div className="ml-6 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    {g.members.map((m) => (
                      <label key={m.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={entry.only.includes(m.id)}
                          onChange={() => toggleMember(g, m.id)}
                        />
                        <span>{memberName(m.id, m.label)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {excludedCount > 0 && (
            <button
              type="button"
              onClick={() => setExclusions({})}
              className="text-xs underline text-muted-foreground hover:text-foreground"
            >
              Clear all — I have everything
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CurrencyExclusions;

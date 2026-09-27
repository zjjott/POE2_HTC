import React from 'react';
import { EFFORT_PRESETS, isTopEffort, setEffort, useEffort } from '../../lib/searchEffort';
import { tr, useLocale } from '../../lib/i18n';

// "How hard should I look?" — the one control for the solver's three caps.
//
// It lived inline in EngineLab, inside the branch that renders the LAB tab. ItemActions called
// `useEffort()` and passed `limitsFor(effort)` to the solver, so a from-item craft obeyed a setting
// its own tab gave you no way to see or change — whatever you last picked on the other tab, or the
// default. Extracted so both tabs render the same control rather than one tab owning it.
//
// The store (src/lib/searchEffort.ts) is already shared and `useSyncExternalStore`-backed, so two
// mounted copies stay in step with no extra plumbing.
//
// Two exports rather than one with a flag: the control sits INSIDE a flex row of fields while the
// hint is a block beneath it, so a single component returning both would have to be a fragment and
// would drop the paragraph into the row.

const selectCls =
  'h-9 rounded-md border border-input bg-background px-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring';

/** The picker, as a labelled field sized to sit in a row of other fields. */
export const SearchEffort: React.FC = () => {
  const effort = useEffort();
  useLocale();
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {tr('Search effort', 'effort.label')}
      </span>
      {/* The three solver caps were hard-coded guesses about someone else's patience. They stay
          honest either way — the badges say when a cap bit — but now the user can pay for more.

          The `aria-label` leads with the VISIBLE words. It replaces the wrapping <label>'s text
          rather than adding to it, so it used to read "How hard the solver should look before giving
          up" and contained none of the "Search effort" on screen — WCAG 2.5.3 Label in Name, and a
          concrete failure for voice control, where saying "Search effort" matched nothing. */}
      <select
        className={`${selectCls} w-40`}
        value={effort}
        onChange={(e) => setEffort(e.target.value)}
        title={EFFORT_PRESETS.find((p) => p.id === effort)?.hint}
        aria-label={tr('Search effort — how hard the solver should look before giving up', 'effort.aria')}
      >
        {EFFORT_PRESETS.map((p) => <option key={p.id} value={p.id}>{tr(p.label, `effort.${p.id}`)}</option>)}
      </select>
    </label>
  );
};

/** What the current preset costs you, in words. A block, meant to sit under the row. */
export const SearchEffortHint: React.FC = () => {
  const effort = useEffort();
  useLocale();
  const preset = EFFORT_PRESETS.find((p) => p.id === effort);
  return (
    <p className="text-[11px] text-muted-foreground">
      <strong>{tr('Search effort:', 'effort.label')}</strong> {preset ? tr(preset.hint, `effort.${preset.id}.hint`) : ''}{' '}
      {isTopEffort(effort)
        ? tr('This is the highest setting — a result that still stops early has nothing left to raise.', 'effort.top')
        : tr('Raise it if a result says the search stopped early.', 'effort.raise')}
    </p>
  );
};

export default SearchEffort;

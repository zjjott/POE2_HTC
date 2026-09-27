import React from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { SearchEffort, SearchEffortHint } from './SearchEffort';
import RunePicker from './RunePicker';
import SolveProgress from './SolveProgress';
import CurrencyExclusions from './CurrencyExclusions';
import BaseSelect from './BaseSelect';
import ModColumn from './ModColumn';
import { selectCls } from './ui';
import type { LabCraft } from './useLabCraft';
import { tr, useLocale } from '../../lib/i18n';

/** The Plan tab's first card: the base, what the craft may spend, the Compute button, and the mod picker. */
const LabSetup: React.FC<{ lab: LabCraft }> = ({ lab }) => {
  const {
    bases, baseId, changeBase, level, setLevel, budget, setBudget, fractured, baseCost, setBaseCost,
    itemCap, setItemCap,
    category, runes, setRunes, share, targets, reset, result, compute, canCompute, computing, progress,
    cancel, runErr, outcome, search, setSearch, filtered, counts, spare, limits, offerSpare, spareBlock,
    addSpare, blockFor, pickTier, onPickTier, addTarget,
  } = lab;
  useLocale();
  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <BaseSelect bases={bases} value={baseId} onChange={changeBase} />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{tr('Item level', 'lab.level')}</span>
          <input
            type="number" min={1} max={100} value={level}
            onChange={(e) => setLevel(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            className={`${selectCls} w-24`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {tr('Budget', 'lab.budget')} <span className="font-normal normal-case opacity-70">{tr('(exalts, optional)', 'lab.budgetNote')}</span>
          </span>
          <input
            type="number" min={0} step="any" value={budget} placeholder="ex"
            onChange={(e) => setBudget(e.target.value)}
            className={`${selectCls} w-28`}
            title="What you're willing to spend, in Exalted-Orb equivalents. Adds a panel showing the closest items this much money can actually finish."
          />
        </label>
        {/* Only a from-WHITE craft can start over, so this is the one place the number means
            anything — a carved base is an item you hold and the planner may not bin it. */}
        {fractured.size === 0 && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {tr('White base price', 'lab.baseCost')} <span className="font-normal normal-case opacity-70">{tr('(ex, this item level)', 'lab.baseCostNote')}</span>
            </span>
            <input
              type="number" min={0} step="any" value={baseCost} placeholder="ex"
              onChange={(e) => setBaseCost(e.target.value)}
              className={`${selectCls} w-28`}
              aria-label={tr('White base price in exalts for this item level', 'lab.baseCost')}
              title={tr('What a white base of this item level costs, in exalts. Leave it blank only if the base is free — otherwise the planner treats it as 0 and would rather throw a nearly finished item away than pay to fix it.', 'lab.baseCostTitle')}
            />
          </label>
        )}
        {fractured.size === 0 && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {tr('Item cap', 'lab.itemCap')}
            </span>
            <input
              type="text" inputMode="numeric" autoComplete="off" value={itemCap}
              onChange={(e) => setItemCap(e.target.value.replace(/[^\d]/g, ''))}
              className={`${selectCls} w-24`}
              aria-label={tr('Maximum expected number of items this craft may consume', 'lab.itemCapAria')}
              title={tr('The plan is solved so the expected number of bases, including every one it bins, stays within this. Leave it blank for no cap. The cost shown is the currency that plan spends.', 'lab.itemCapTitle')}
            />
          </label>
        )}
        <RunePicker category={category} value={runes} onChange={setRunes} />
        <SearchEffort />
        <div className="flex-1" />
        <Button variant="outline" onClick={() => void share()} disabled={targets.length === 0} size="lg" title="Copy a link that reproduces this workspace">
          {tr('Copy link', 'lab.copy')}
        </Button>
        <Button variant="outline" onClick={reset} disabled={targets.length === 0 && !result} size="lg">
          {tr('Reset', 'lab.reset')}
        </Button>
        <Button onClick={() => compute()} disabled={!canCompute} size="lg">
          {tr('Find plans', 'lab.find')}
        </Button>
      </div>

      <SearchEffortHint />

      <CurrencyExclusions />

      {computing && <SolveProgress progress={progress} onCancel={cancel} />}

      {/* The one place a finished solve is announced. `polite` so it waits for a pause rather than
          interrupting, and it lives outside the conditional above so the region exists before the
          text lands — a live region inserted together with its content is often not announced. */}
      <p className="sr-only" role="status" aria-live="polite">
        {computing ? '' : runErr ? `Could not compute: ${runErr}` : outcome}
      </p>

      {/* Mod picker */}
      <div>
        <label htmlFor="lab-mod-search" className="sr-only">{tr('Search modifiers to add as targets', 'ui.searchTargets')}</label>
        <input
          id="lab-mod-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tr('Search modifiers to add as targets…', 'ui.searchTargets')}
          className={`${selectCls} w-full mb-2`}
        />
        {/* Stacks on a phone. A bare `flex` kept both columns side by side at every width, so
            on a narrow screen each got half of it and the mod text was crushed to nothing. */}
        <div className="flex flex-col sm:flex-row gap-4">
          <ModColumn
            title={tr('Prefixes', 'ui.prefix')} side="prefix" list={filtered.prefixes}
            count={counts.prefix + spare.prefixes} cap={limits.prefixes}
            {...(offerSpare ? { spare: { block: spareBlock('prefix'), onAdd: () => addSpare('prefix') } } : {})}
            blockFor={blockFor} pickTier={pickTier} onPickTier={onPickTier} onAdd={addTarget}
          />
          <ModColumn
            title={tr('Suffixes', 'ui.suffix')} side="suffix" list={filtered.suffixes}
            count={counts.suffix + spare.suffixes} cap={limits.suffixes}
            {...(offerSpare ? { spare: { block: spareBlock('suffix'), onAdd: () => addSpare('suffix') } } : {})}
            blockFor={blockFor} pickTier={pickTier} onPickTier={onPickTier} onAdd={addTarget}
          />
        </div>
      </div>
    </Card>
  );
};

export default LabSetup;

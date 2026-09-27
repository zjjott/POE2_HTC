// Chinese brace-headed item text → the English modifiers on that base.
//
//   npx tsx scripts/cn-item.mts equit/法杖.txt
//   npx tsx scripts/cn-item.mts < item.txt
//
// Exact Chinese template first, then similarity. Anything that still does not settle is printed
// under 未能匹配 and the process exits 1, so a miss is not a silent guess.

import { readFileSync } from 'node:fs';
import { loadPatch } from '../packages/engine/src/loadPatch.ts';
import type { LexiconFile } from '../src/lib/lexicon.ts';
import { decodeCnItem, formatCnItem, formatPobItem, translateCnEquipment, type PobMod } from '../src/lib/cnItemText.ts';

const patch = 'data/patches/0.5.0';
const data = loadPatch(patch);
const lex = JSON.parse(readFileSync(`${patch}/locale/zh-CN.json`, 'utf8')) as LexiconFile;

const pob = JSON.parse(readFileSync('data/pob/item-mods.json', 'utf8')) as PobMod[];
const file = process.argv[2];
const text = decodeCnItem(file ? readFileSync(file) : readFileSync(0));
const report = translateCnEquipment(text, data, lex, pob);
process.stdout.write(`${formatPobItem(report)}\n`);
const notes = formatCnItem(report);
if (report.unmatched.length > 0 || report.mods.some((mod) => mod.note)) {
  process.stdout.write(`\n以下不要贴进 PoB\n${notes}\n`);
}
if (report.unmatched.length > 0) process.exitCode = 1;

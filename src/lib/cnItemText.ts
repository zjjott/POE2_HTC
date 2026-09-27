// A Chinese item written as brace-headed affix blocks — tier name in quotes, display tier in the
// header, stat lines underneath — into the English modifiers on that base.
//
// This is not the in-game Ctrl+C text `pasteLocale.ts` rewrites. Exact template first, then
// similarity, and a block that still does not settle is reported rather than assigned.

import type { ItemBase, Mod, PatchData } from '../../packages/engine/src/types.ts';
import type { LexiconFile } from './lexicon.ts';

export type MatchHow = 'exact' | 'fuzzy';

/** One row of Path of Building's crafted-mod list (`ModItem.lua`), trimmed to what a paste needs. */
export interface PobMod {
  readonly id: string;
  readonly side: 'prefix' | 'suffix';
  readonly text: string;
  readonly ranges: readonly (readonly number[])[];
  readonly tags: readonly string[];
  readonly slots: readonly string[];
}

/** Our base `class` → the word Path of Building prints as the item's first line. */
const POB_CLASS: Readonly<Record<string, string>> = {
  Rings: 'Ring', Amulets: 'Amulet', Belts: 'Belt', Wands: 'Wand', Sceptres: 'Sceptre',
  Quivers: 'Quiver', Bows: 'Bow', Staves: 'Staff', Crossbows: 'Crossbow', Spears: 'Spear',
  Foci: 'Focus', Bucklers: 'Buckler', Helmets: 'Helmet', Gloves: 'Gloves', Boots: 'Boots',
  Shields: 'Shield', 'Body Armours': 'Body Armour', 'One Hand Maces': 'One Hand Mace',
  'Two Hand Maces': 'Two Hand Mace', Quarterstaves: 'Quarterstaff',
};

/** Same class → the slot tag on a Path of Building mod (`weightKey`). */
const POB_SLOT: Readonly<Record<string, string>> = {
  Rings: 'ring', Amulets: 'amulet', Belts: 'belt', Wands: 'wand', Sceptres: 'sceptre',
  Quivers: 'quiver', Bows: 'bow', Staves: 'staff', Crossbows: 'crossbow', Spears: 'spear',
  Foci: 'focus', Bucklers: 'buckler', Helmets: 'helmet', Gloves: 'gloves', Boots: 'boots',
  Shields: 'shield',
};

const POB_TAG: Readonly<Record<string, string>> = {
  攻击: 'attack', 法术: 'caster', 施法: 'caster', 生命: 'life', 魔力: 'mana',
  火焰: 'fire', 冰霜: 'cold', 闪电: 'lightning', 混沌: 'chaos', 物理: 'physical',
};

function baseClass(base: ItemBase): string | undefined {
  return (base as ItemBase & { class?: string }).class;
}

export interface TranslatedMod {
  readonly id: string;
  readonly english: string;
  readonly filled: string;
  readonly side: 'prefix' | 'suffix';
  readonly tierEn?: string;
  readonly tierZh?: string;
  readonly displayTier?: number;
  readonly ilvl?: number;
  readonly how: MatchHow;
  readonly score: number;
  readonly desecrated: boolean;
  /** The file tagged this line `(rune)`. PoB treats `{rune}` as an implicit. */
  readonly rune: boolean;
  /** `{ 基底属性 }` — the base's own line, not a prefix or suffix. */
  readonly implicit: boolean;
  /** Parenthetical tier span from the Chinese line, used to pick a Path of Building mod id. */
  readonly spans: readonly (readonly [number, number])[];
  /** Path of Building tag names taken from the Chinese header (`攻击` → `attack`). */
  readonly tags: readonly string[];
  /** Path of Building `ModItem` id, when the English line and tier span pick exactly one. */
  readonly pobId?: string;
  /** Roll position inside that tier, 0–1, the `{range:}` Path of Building stores. */
  readonly pobRange?: number;
  readonly note?: string;
}

export interface ModSuggestion {
  readonly id: string;
  readonly english: string;
  readonly score: number;
}

export interface UnmatchedBlock {
  readonly text: string;
  readonly reason: string;
  readonly suggestions: readonly ModSuggestion[];
}

export interface CnItemReport {
  readonly baseId?: string;
  readonly baseName?: string;
  readonly baseZh?: string;
  readonly itemName?: string;
  readonly rarity?: string;
  readonly itemLevel?: number;
  readonly quality?: string;
  /** PoB `catalystList` name, from a jewellery line such as `品质（魔力词缀）`. */
  readonly catalyst?: string;
  readonly catalystQuality?: number;
  /** Path of Building's item type, the first line of a crafted item (`Ring`, not the rare name). */
  readonly pobClass?: string;
  readonly corrupted: boolean;
  readonly mods: readonly TranslatedMod[];
  readonly unmatched: readonly UnmatchedBlock[];
  readonly extra: readonly string[];
}

interface TierRow {
  readonly display: number;
  readonly ilvl: number;
  readonly en: string;
  readonly zh?: string;
  readonly ranges: readonly (readonly number[])[];
}

interface Candidate {
  readonly id: string;
  readonly mod: Mod;
  readonly zh: string;
  readonly norm: string;
  readonly tiers: readonly TierRow[];
}

interface Header {
  readonly desecrated: boolean;
  readonly crafted: boolean;
  readonly implicit: boolean;
  readonly kind: 'prefix' | 'suffix' | 'corrupted' | 'rune' | 'unknown';
  readonly tierName?: string;
  readonly displayTier?: number;
  readonly tags: readonly string[];
  readonly raw: string;
}

interface Block {
  readonly header?: Header;
  readonly lines: readonly string[];
  readonly runeTag: boolean;
}

const RARITY: Record<string, string> = {
  '普通': 'Normal', '魔法': 'Magic', '稀有': 'Rare', '传奇': 'Unique',
};

const ACCEPT = 0.75;

/** Parenthetical ranges and tags off, numbers collapsed to `#`, whitespace gone. */
function normLine(s: string): string {
  return s
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/＋/g, '+')
    .replace(/＃/g, '#')
    .replace(/％/g, '%')
    .replace(/\+#|#/g, '#')
    .replace(/[+-]?\d+(?:\.\d+)?/g, '#')
    .replace(/#+/g, '#')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function normText(text: string): string {
  return text.split('\n').map((line) => normLine(line)).filter((line) => line.length > 0).join('|');
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(cur[j - 1]! + 1, prev[j]! + 1, prev[j - 1]! + cost);
    }
    prev = cur;
  }
  return prev[b.length]!;
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const denom = Math.max(a.length, b.length, 1);
  return 1 - levenshtein(a, b) / denom;
}

function modIdsOf(base: ItemBase): string[] {
  const pools = [base.pools.normal, base.pools.desecrated, base.pools.essence];
  const ids = pools.flatMap((p) => [...p.prefixes, ...p.suffixes]);
  if (base.pools.rune) {
    for (const pool of Object.values(base.pools.rune)) ids.push(...pool.prefixes, ...pool.suffixes);
  }
  return [...new Set(ids)];
}

function tierRows(mod: Mod, zhTiers: Readonly<Record<string, string>> | undefined): TierRow[] {
  return [...mod.tiers]
    .sort((a, b) => b.ilvl - a.ilvl || a.name.localeCompare(b.name))
    .map((t, i) => ({
      display: i + 1,
      ilvl: t.ilvl,
      en: t.name,
      ...(zhTiers?.[String(t.ilvl)] ? { zh: zhTiers[String(t.ilvl)] } : {}),
      ranges: t.ranges,
    }));
}

function candidatesFor(data: PatchData, lex: LexiconFile, ids: readonly string[]): Candidate[] {
  const out: Candidate[] = [];
  for (const id of ids) {
    const mod = data.mods.get(id);
    const zh = lex.mods[id]?.text;
    if (!mod?.text || !zh) continue;
    out.push({ id, mod, zh, norm: normText(zh), tiers: tierRows(mod, lex.mods[id]?.tiers) });
  }
  return out;
}

function findBase(data: PatchData, lex: LexiconFile, lines: readonly string[]): {
  base?: ItemBase;
  zh?: string;
  how?: MatchHow;
  score?: number;
} {
  const named = Object.entries(lex.bases).filter((entry): entry is [string, string] => entry[1].length > 0);
  named.sort((a, b) => b[1].length - a[1].length);
  for (const line of lines) {
    const s = line.trim();
    for (const [en, zh] of named) {
      if (s === zh) {
        for (const base of data.bases.values()) {
          if (base.bases?.includes(en)) return { base, zh, how: 'exact', score: 1 };
        }
      }
    }
  }
  let best: { base: ItemBase; zh: string; score: number } | undefined;
  for (const line of lines) {
    const s = normLine(line);
    if (s.length < 2) continue;
    for (const [en, zh] of named) {
      const score = similarity(s, normLine(zh));
      if (score < ACCEPT) continue;
      if (best && score <= best.score) continue;
      for (const base of data.bases.values()) {
        if (base.bases?.includes(en)) best = { base, zh, score };
      }
    }
  }
  return best ? { ...best, how: 'fuzzy' } : {};
}

function parseHeader(line: string): Header | undefined {
  const t = line.trim();
  if (!t.startsWith('{') || !t.endsWith('}')) return undefined;
  let body = t.slice(1, -1).trim();
  let desecrated = false;
  let crafted = false;
  let implicit = false;
  for (;;) {
    if (body.startsWith('亵渎的')) { desecrated = true; body = body.slice('亵渎的'.length).trim(); continue; }
    if (body.startsWith('打造的')) { crafted = true; body = body.slice('打造的'.length).trim(); continue; }
    if (body.startsWith('基底属性')) { implicit = true; body = body.slice('基底属性'.length).trim(); continue; }
    break;
  }
  let kind: Header['kind'] = 'unknown';
  if (body.startsWith('前缀属性')) kind = 'prefix';
  else if (body.startsWith('后缀属性')) kind = 'suffix';
  else if (body.startsWith('腐化强化')) kind = 'corrupted';
  else if (body.startsWith('符文')) kind = 'rune';
  const quoted = /["“]([^"”]+)["”]/.exec(body);
  const tier = /等阶\s*[:：]\s*(\d+)/.exec(body);
  const tags = body.split(/[—–]/).slice(1).join('').split(/[,，]/).map((s) => s.trim()).filter((s) => s.length > 0);
  const header: Header = {
    desecrated, crafted, implicit, kind, tags, raw: t,
    ...(quoted?.[1] ? { tierName: quoted[1] } : {}),
    ...(tier?.[1] ? { displayTier: Number(tier[1]) } : {}),
  };
  return header;
}

/** GBK files from the Chinese client, and UTF-8 from everything else. */
export function decodeCnItem(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('gb18030').decode(bytes);
  }
}

function isSeparator(line: string): boolean {
  return /^-+$/.test(line.trim()) || line.trim() === '';
}

interface Props {
  rarity?: string;
  itemLevel?: number;
  quality?: string;
  catalyst?: string;
  catalystQuality?: number;
  catalystUnknown?: string;
  corrupted: boolean;
  extra: string[];
}

/**
 * The word inside `品质（…词缀）` is the catalyst's category, not weapon quality.
 * Names are Path of Building's `catalystList`. Category words are the ones in each
 * catalyst's Chinese description (`强化魔力类词缀` and the rest of that list).
 */
const CATALYST_WORD: ReadonlyArray<readonly [string, string]> = [
  ['魔力', 'Neural'],
  ['生命', 'Flesh'],
  ['护甲', 'Carapace'],
  ['物理', "Uul-Netol's"],
  ['火焰', "Xoph's"],
  ['冰霜', "Tul's"],
  ['闪电', "Esh's"],
  ['混沌', "Chayula's"],
  ['攻击', 'Reaver'],
  ['施法', 'Sibilant'],
  ['速度', 'Skittering'],
];

function catalystOf(label: string): string | undefined {
  const words = [...CATALYST_WORD].sort((a, b) => b[0].length - a[0].length);
  return words.find(([word]) => label.includes(word))?.[1];
}

function takeProp(line: string, props: Props): boolean {
  const s = line.trim();
  if (s === '被腐化' || s === '已腐化' || s === '腐化') { props.corrupted = true; return true; }
  if (s === '引路石掉落') { props.extra.push(s); return true; }
  let m = /^(?:物品类别|物品种类)\s*[:：]\s*(.*)$/.exec(s);
  if (m) { props.extra.push(`Item Class: ${m[1]}`); return true; }
  m = /^稀有度\s*[:：]\s*(.*)$/.exec(s);
  if (m?.[1]) { props.rarity = RARITY[m[1].trim()] ?? m[1].trim(); return true; }
  m = /^物品等级\s*[:：]\s*(\d+)/.exec(s);
  if (m?.[1]) { props.itemLevel = Number(m[1]); return true; }
  m = /^品质\s*[（(]\s*(.+?)\s*[）)]\s*[:：]\s*([+-]?\d+)/.exec(s);
  if (m?.[1] && m[2]) {
    const name = catalystOf(m[1]);
    if (name) {
      props.catalyst = name;
      props.catalystQuality = Number(m[2]);
    } else {
      props.catalystUnknown = m[1];
    }
    return true;
  }
  m = /^品质\s*[:：]\s*(.*)$/.exec(s);
  if (m?.[1]) { props.quality = m[1].replace(/\s*\(augmented\)\s*$/i, '').trim(); return true; }
  m = /^精魂\s*[:：]\s*(.*)$/.exec(s);
  if (m) { props.extra.push(`Spirit: ${m[1]}`); return true; }
  m = /^需求\s*[:：]\s*(.*)$/.exec(s);
  if (m?.[1]) {
    const req = m[1].replace(/等级/g, 'Level').replace(/智慧/g, 'Intelligence').replace(/力量/g, 'Strength').replace(/敏捷/g, 'Dexterity');
    props.extra.push(`Requires ${req}`);
    return true;
  }
  m = /^插槽\s*[:：]\s*(.*)$/.exec(s);
  if (m) { props.extra.push(`Sockets: ${m[1]}`); return true; }
  return false;
}

function parseBlocks(text: string): { blocks: Block[]; props: Props; names: string[] } {
  const props: Props = { corrupted: false, extra: [] };
  const blocks: Block[] = [];
  const names: string[] = [];
  let seenSep = false;
  let current: { header?: Header; lines: string[] } | undefined;
  const flush = (): void => {
    if (!current) return;
    if (current.lines.length > 0 || current.header) {
      const runeTag = current.lines.some((line) => /\(rune\)\s*$/i.test(line.trim()));
      blocks.push({
        ...(current.header ? { header: current.header } : {}),
        lines: current.lines,
        runeTag,
      });
    }
    current = undefined;
  };
  for (const raw of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = raw.trim();
    if (isSeparator(line)) { seenSep = true; flush(); continue; }
    if (seenSep && names.length > 0 && !/[\u4e00-\u9fff]/.test(line)) break;
    const header = parseHeader(line);
    if (header) {
      flush();
      current = { header, lines: [] };
      continue;
    }
    if (takeProp(line, props)) { flush(); continue; }
    if (!seenSep && !current && names.length < 2 && !/[0-9]/.test(line) && !line.startsWith('获得技能')) {
      names.push(line);
      continue;
    }
    if (!current) current = { lines: [] };
    current.lines.push(line);
  }
  flush();
  return { blocks, props, names };
}

/** A fixed number in the English line has to be the number on the item; `#` takes any roll. */
function numbersFit(template: string, lines: readonly string[]): boolean {
  const rolled = rolledNumbers(lines).map((n) => n.replace(/^\+/, ''));
  let i = 0;
  for (const m of template.matchAll(/\+#|#|[+-]?\d+(?:\.\d+)?/g)) {
    const got = rolled[i++];
    if (got === undefined) return false;
    if (m[0] !== '#' && m[0] !== '+#' && m[0].replace(/^\+/, '') !== got) return false;
  }
  return true;
}

function rolledNumbers(lines: readonly string[]): string[] {
  const nums: string[] = [];
  for (const line of lines) {
    const bare = line.replace(/[（(][^）)]*[）)]/g, ' ');
    for (const m of bare.matchAll(/[+-]?\d+(?:\.\d+)?/g)) nums.push(m[0]);
  }
  return nums;
}

function fillEnglish(template: string, nums: readonly string[]): string {
  let i = 0;
  return template.replace(/\+#|#/g, (tok) => {
    const num = nums[i++] ?? '#';
    return tok === '+#' ? (num.startsWith('+') || num.startsWith('-') ? num : `+${num}`) : num.replace(/^\+/, '');
  });
}

function parenRanges(lines: readonly string[]): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  for (const line of lines) {
    for (const m of line.matchAll(/[（(]\s*([+-]?\d+(?:\.\d+)?)\s*[-–]\s*([+-]?\d+(?:\.\d+)?)\s*[）)]/g)) {
      ranges.push([Number(m[1]), Number(m[2])]);
    }
  }
  return ranges;
}

function rangeNote(lines: readonly string[], tier: TierRow | undefined): string | undefined {
  const ranges = parenRanges(lines);
  if (!tier || ranges.length === 0) return undefined;
  const fits = ranges.every((pair, i) => {
    const span = tier.ranges[i];
    if (!span || span.length < 2) return false;
    return pair[0] === span[0] && pair[1] === span[1];
  });
  if (fits) return undefined;
  const shown = ranges.map(([a, b]) => `${a}-${b}`).join(', ');
  return `文件里的范围 (${shown}) 对不上这一阶 ${tier.en} 的范围`;
}

function tierByRange(c: Candidate, lines: readonly string[]): TierRow | undefined {
  const ranges = parenRanges(lines);
  if (ranges.length === 0) return undefined;
  const hits = c.tiers.filter((t) => ranges.length <= t.ranges.length && ranges.every((pair, i) => {
    const span = t.ranges[i];
    return !!span && span.length >= 2 && span[0] === pair[0] && span[1] === pair[1];
  }));
  return hits.length === 1 ? hits[0] : undefined;
}

function pickTier(c: Candidate, header: Header | undefined, lines: readonly string[]): TierRow | undefined {
  if (header?.tierName) {
    const byName = c.tiers.find((t) => t.zh === header.tierName);
    if (byName) return byName;
  }
  if (header?.displayTier) {
    const shown = c.tiers.find((t) => t.display === header.displayTier);
    if (shown) return shown;
  }
  return tierByRange(c, lines);
}

function sideOk(c: Candidate, header: Header | undefined): boolean {
  if (header?.kind === 'prefix' || header?.kind === 'suffix') return c.mod.type === header.kind;
  return true;
}

type Hit = { readonly c: Candidate; readonly score: number };

function narrow(hits: readonly Hit[], header: Header | undefined): Hit[] {
  let cur = hits.filter((s) => sideOk(s.c, header));
  if (cur.length === 0) cur = [...hits];
  if (header?.tierName) {
    const named = cur.filter((s) => s.c.tiers.some((t) => t.zh === header.tierName));
    if (named.length > 0) cur = named;
  }
  if (header?.displayTier !== undefined && cur.length > 1) {
    const shown = cur.filter((s) => s.c.tiers.some((t) => t.display === header.displayTier
      && (header.tierName === undefined || t.zh === header.tierName)));
    if (shown.length === 1) cur = shown;
  }
  return cur;
}

function elementWord(header: Header | undefined): { zh: string; en: string } | undefined {
  const tags = (header?.tags ?? []).join(',');
  if (tags.includes('冰霜')) return { zh: '冰霜', en: 'Cold' };
  if (tags.includes('火焰')) return { zh: '火焰', en: 'Fire' };
  if (tags.includes('闪电')) return { zh: '闪电', en: 'Lightning' };
  if (tags.includes('混沌')) return { zh: '混沌', en: 'Chaos' };
  if (tags.includes('物理')) return { zh: '物理', en: 'Physical' };
  return undefined;
}

function rangeHits(pool: readonly Candidate[], lines: readonly string[], norm: string): Hit[] {
  const ranges = parenRanges(lines);
  if (ranges.length === 0) return [];
  const itemLines = norm.split('|');
  const hits: Hit[] = [];
  for (const c of pool) {
    const covered = c.tiers.some((t) => ranges.length <= t.ranges.length && ranges.every((pair, i) => {
      const span = t.ranges[i];
      return !!span && span.length >= 2 && span[0] === pair[0] && span[1] === pair[1];
    }));
    if (!covered) continue;
    const overlap = c.norm.split('|').every((cl) => itemLines.some((il) => il === cl));
    if (overlap) hits.push({ c, score: 1 });
  }
  return hits;
}

function matchBlock(block: Block, pool: readonly Candidate[]): TranslatedMod | UnmatchedBlock {
  const text = block.lines.join('\n');
  const norm = normText(text);
  const header = block.header;
  if (block.lines.length === 0) {
    return { text: header?.raw ?? '', reason: '只有阶名，没有词缀原文', suggestions: [] };
  }
  if (block.lines.some((line) => line.startsWith('获得技能'))) {
    return { text, reason: '这是授权技能，词缀表里没有对应的英文词缀', suggestions: [] };
  }

  const scored = pool.map((c) => ({ c, score: similarity(norm, c.norm) }));
  scored.sort((a, b) => b.score - a.score || a.c.id.localeCompare(b.c.id));
  const suggestions: ModSuggestion[] = scored.slice(0, 5).filter((s) => s.score >= 0.45).map((s) => ({
    id: s.c.id, english: s.c.mod.text ?? s.c.id, score: s.score,
  }));

  let chosen = narrow(scored.filter((s) => s.score === 1), header);
  let how: MatchHow = 'exact';
  let extraNote: string | undefined;
  if (chosen.length === 0) {
    const ranged = narrow(rangeHits(pool, block.lines, norm), header);
    if (ranged.length === 1) {
      chosen = ranged;
      extraNote = '中文词缀表少写了后面的行，按数值范围对上';
    }
  }
  if (chosen.length === 0 && header?.tierName) {
    const named = scored.filter((s) => s.c.tiers.some((t) => t.zh === header.tierName) && sideOk(s.c, header));
    if (named.length === 1 && named[0]!.score >= 0.5) {
      chosen = named;
      how = named[0]!.score === 1 ? 'exact' : 'fuzzy';
    }
  }
  if (chosen.length === 0) {
    const best = scored[0];
    if (best && best.score >= ACCEPT && sideOk(best.c, header)) {
      const tied = scored.filter((s) => s.score >= best.score - 0.01 && sideOk(s.c, header));
      const word = elementWord(header);
      const byElement = word ? tied.filter((s) => (s.c.mod.text ?? '').includes(word.en)) : tied;
      if (byElement.length === 1) {
        chosen = byElement;
        how = 'fuzzy';
        if (tied.length > 1 && word) extraNote = `中文词缀表把相近词缀写成了同一句，按标题里的「${word.zh}」对上 ${word.en}`;
      }
    }
  }
  if (chosen.length > 1) {
    const fitted = chosen.filter((s) => numbersFit(s.c.mod.text ?? '', block.lines));
    if (fitted.length > 0) chosen = fitted;
  }
  if (chosen.length !== 1) {
    const reason = chosen.length > 1
      ? `有 ${chosen.length} 条英文词缀对得上，无法确定是哪一条`
      : '没有对上的英文词缀';
    return { text: header ? `${header.raw}\n${text}` : text, reason, suggestions };
  }

  const c = chosen[0]!.c;
  const tier = pickTier(c, header, block.lines);
  const notes: string[] = [];
  if (how === 'fuzzy') notes.push(`模糊匹配（相似度 ${chosen[0]!.score.toFixed(2)}）`);
  if (extraNote) notes.push(extraNote);
  if (header?.kind === 'corrupted') notes.push('文件标成腐化强化，词缀表里它是可制作词缀');
  if (header?.crafted) notes.push('文件标成打造');
  if (block.runeTag && !c.mod.rune) notes.push('文件标成符文，词缀表里它不是符文词缀');
  if (header?.desecrated) notes.push('文件标成亵渎');
  if (header?.tierName && tier && tier.zh !== header.tierName) {
    const via = header.displayTier !== undefined ? `按等阶 ${header.displayTier}` : '按数值范围';
    notes.push(`阶名「${header.tierName}」不在词缀表里，${via} 取 ${tier.en}`);
  }
  const range = rangeNote(block.lines, tier);
  if (range) notes.push(range);
  if (header?.displayTier && tier && tier.display !== header.displayTier) {
    notes.push(`文件写等阶 ${header.displayTier}，阶名「${header.tierName ?? tier.zh}」对应等阶 ${tier.display}`);
  }
  return {
    id: c.id,
    english: c.mod.text ?? c.id,
    filled: fillEnglish(c.mod.text ?? '', rolledNumbers(block.lines)),
    side: c.mod.type,
    ...(tier ? { tierEn: tier.en, tierZh: tier.zh, displayTier: tier.display, ilvl: tier.ilvl } : {}),
    how,
    score: chosen[0]!.score,
    desecrated: header?.desecrated === true,
    rune: block.runeTag,
    implicit: header?.implicit === true,
    spans: parenRanges(block.lines),
    tags: [...new Set((header?.tags ?? []).map((tag) => POB_TAG[tag]).filter((tag): tag is string => tag !== undefined))],
    ...(notes.length > 0 ? { note: notes.join('。') } : {}),
  };
}

function isTranslated(x: TranslatedMod | UnmatchedBlock): x is TranslatedMod {
  return 'id' in x;
}

/** PoB writes a tier as `+(150-164)`; our templates use `+#`. Both become `+#`. */
function pobNorm(s: string): string {
  return normText(s.replace(/\(([+-]?\d+(?:\.\d+)?)-([+-]?\d+(?:\.\d+)?)\)/g, '#'));
}

function sameSpans(a: readonly (readonly number[])[], b: readonly (readonly number[])[]): boolean {
  return a.length > 0 && a.length === b.length && a.every((span, i) => span[0] === b[i]?.[0] && span[1] === b[i]?.[1]);
}

function slider(spans: readonly (readonly [number, number])[], filled: string): number {
  const span = spans[0];
  const roll = Number(rolledNumbers([filled])[0]);
  if (!span || !Number.isFinite(roll) || span[1] === span[0]) return 0.5;
  return Math.min(1, Math.max(0, (roll - span[0]) / (span[1] - span[0])));
}

function attachPob(mod: TranslatedMod, slot: string | undefined, catalog: readonly PobMod[]): TranslatedMod {
  if (mod.implicit || mod.rune) return { ...mod, pobRange: slider(mod.spans, mod.filled) };
  const norm = pobNorm(mod.english);
  let hits = catalog.filter((p) => p.side === mod.side && pobNorm(p.text) === norm
    && (mod.spans.length === 0 ? p.ranges.length === 0 : sameSpans(mod.spans, p.ranges)));
  if (slot) {
    const slotted = hits.filter((p) => p.slots.includes(slot));
    if (slotted.length > 0) hits = slotted;
  }
  if (hits.length !== 1) {
    const note = hits.length > 1 ? '有多条 Path of Building 词缀 id 对得上' : '没有对上 Path of Building 的词缀 id';
    return { ...mod, note: mod.note ? `${mod.note}。${note}` : note };
  }
  return { ...mod, pobId: hits[0]!.id, pobRange: slider(mod.spans, mod.filled) };
}

/**
 * Turn one Chinese item into the English modifiers on its base.
 * `pob` is Path of Building's crafted-mod list; without it the paste has no `Prefix:` ids.
 * `unmatched` is everything that did not settle — the caller shows it and does not guess.
 */
export function translateCnEquipment(
  text: string, data: PatchData, lex: LexiconFile, pob?: readonly PobMod[],
): CnItemReport {
  const { blocks, props, names } = parseBlocks(text);
  const found = findBase(data, lex, names.length > 0 ? names : text.split(/\r?\n/));
  const pool = found.base ? candidatesFor(data, lex, modIdsOf(found.base)) : [];
  const slot = found.base ? POB_SLOT[baseClass(found.base) ?? ''] : undefined;
  const mods: TranslatedMod[] = [];
  const unmatched: UnmatchedBlock[] = [];
  if (!found.base) {
    unmatched.push({
      text: names.join(' / ') || '(没有基底名)',
      reason: '基底名没有对上英文基底',
      suggestions: [],
    });
  } else {
    if (props.catalystUnknown) {
      unmatched.push({
        text: `品质（${props.catalystUnknown}）`,
        reason: '这种催化剂品质没有对应的英文名称',
        suggestions: [],
      });
    }
    for (const block of blocks) {
      const hit = matchBlock(block, pool);
      if (isTranslated(hit)) mods.push(pob ? attachPob(hit, slot, pob) : hit);
      else unmatched.push(hit);
    }
  }
  const baseEn = found.base?.bases?.find((name) => lex.bases[name] === found.zh) ?? found.base?.name;
  const rareName = names.find((name) => name !== found.zh);
  return {
    ...(found.base ? { baseId: found.base.id, baseName: baseEn, baseZh: found.zh } : {}),
    ...(rareName ? { itemName: rareName } : {}),
    ...(props.rarity ? { rarity: props.rarity } : {}),
    ...(props.itemLevel !== undefined ? { itemLevel: props.itemLevel } : {}),
    ...(props.quality ? { quality: props.quality } : {}),
    ...(props.catalyst ? { catalyst: props.catalyst } : {}),
    ...(props.catalystQuality !== undefined ? { catalystQuality: props.catalystQuality } : {}),
    ...(found.base && baseClass(found.base) ? { pobClass: POB_CLASS[baseClass(found.base)!] ?? baseClass(found.base) } : {}),
    corrupted: props.corrupted,
    mods,
    unmatched,
    extra: [
      ...(found.how === 'fuzzy' ? [`基底是模糊匹配（相似度 ${found.score?.toFixed(2)}）：${found.zh} → ${baseEn}`] : []),
      ...props.extra,
    ],
  };
}

const SIDE: Record<TranslatedMod['side'], string> = { prefix: '前缀', suffix: '后缀' };

/** The report a person reads. Unmatched blocks are last, each with its nearest English mods. */
export function formatCnItem(report: CnItemReport): string {
  const lines: string[] = [];
  if (report.baseName) lines.push(`基底: ${report.baseName}${report.baseZh ? `（${report.baseZh}）` : ''}`);
  if (report.baseId) lines.push(`类别: ${report.baseId}`);
  if (report.rarity) lines.push(`稀有度: ${report.rarity}`);
  if (report.quality) lines.push(`品质: ${report.quality}`);
  if (report.corrupted) lines.push('已腐化');
  for (const extra of report.extra) {
    if (extra.startsWith('Requires ') || extra.startsWith('Sockets:')) continue;
    lines.push(extra);
  }
  lines.push('');
  report.mods.forEach((mod, i) => {
    const tier = mod.tierEn ? `  ${mod.tierZh ?? ''} ${mod.tierEn}  等阶 ${mod.displayTier ?? '?'}  ilvl ${mod.ilvl ?? '?'}` : '';
    lines.push(`${i + 1}. ${SIDE[mod.side]}${mod.desecrated ? '  亵渎' : ''}  ${mod.how === 'exact' ? '精确' : '模糊'}`);
    lines.push(`   ${mod.id}${tier}`);
    for (const row of mod.filled.split('\n')) lines.push(`   ${row}`);
    if (mod.note) lines.push(`   注: ${mod.note}`);
  });
  if (report.unmatched.length > 0) {
    lines.push('');
    lines.push('未能匹配，需要确认:');
    for (const block of report.unmatched) {
      lines.push(`- ${block.text.replace(/\n/g, ' / ')}`);
      lines.push(`  ${block.reason}`);
      for (const s of block.suggestions) {
        const preview = s.english.split('\n').join(' / ');
        lines.push(`  最接近 ${s.score.toFixed(2)}  ${s.id}  ${preview}`);
      }
    }
  }
  return lines.join('\n');
}

function fmtRange(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}

/** Implicit lines keep the tier span, the way a crafted item stores `{range:}` on the base mod. */
function implicitLine(mod: TranslatedMod): string[] {
  let i = 0;
  const body = mod.english.replace(/\+#|#/g, (tok) => {
    const span = mod.spans[i++];
    if (!span) return tok;
    const shown = `${span[0]}-${span[1]}`;
    return tok === '+#' ? `+(${shown})` : `(${shown})`;
  });
  const tags = mod.tags.length > 0 ? `{tags:${mod.tags.join(',')}}` : '';
  const range = mod.pobRange !== undefined ? `{range:${fmtRange(mod.pobRange)}}` : '';
  return body.split('\n').filter((row) => row.length > 0).map((row, n) => (n === 0 ? `${tags}${range}${row}` : row));
}

/**
 * The block Path of Building pastes as a crafted item: class, base, `Crafted: true`,
 * then `Prefix:` / `Suffix:` mod ids with `{range:}`, then the stat lines under `Implicits`.
 * The rare name is not part of that block.
 */
export function formatPobItem(report: CnItemReport): string {
  if (!report.baseName) return '';
  const lines: string[] = [];
  if (report.pobClass) lines.push(report.pobClass);
  lines.push(report.baseName);
  lines.push('Crafted: true');
  for (const mod of report.mods) {
    if (mod.implicit || mod.rune || !mod.pobId) continue;
    const side = mod.side === 'prefix' ? 'Prefix' : 'Suffix';
    const range = mod.pobRange !== undefined ? `{range:${fmtRange(mod.pobRange)}}` : '';
    lines.push(`${side}: ${range}${mod.pobId}`);
  }
  if (report.catalyst) {
    lines.push(`Catalyst: ${report.catalyst}`);
    if (report.catalystQuality !== undefined) lines.push(`CatalystQuality: ${report.catalystQuality}`);
  }
  const quality = report.quality?.match(/[+-]?\d+(?:\.\d+)?/)?.[0];
  if (quality) lines.push(`Quality: ${quality}`);
  const implicitRows: string[] = [];
  const explicitRows: string[] = [];
  for (const mod of report.mods) {
    if (mod.rune) {
      implicitRows.push(...mod.filled.split('\n').filter((row) => row.length > 0).map((row) => `{rune}${row}`));
    } else if (mod.implicit) {
      implicitRows.push(...implicitLine(mod));
    } else {
      const tag = mod.desecrated ? '{desecrated}' : '';
      explicitRows.push(...mod.filled.split('\n').filter((row) => row.length > 0).map((row) => `${tag}${row}`));
    }
  }
  lines.push(`Implicits: ${implicitRows.length}`);
  lines.push(...implicitRows, ...explicitRows);
  if (report.corrupted) lines.push('Corrupted');
  return lines.join('\n');
}

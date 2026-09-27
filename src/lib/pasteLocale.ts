// Rewrite a 国服 Ctrl+C item into the English block `parseItemText` / `resolveMods` already understand.
// Matching stays on English templates; this only moves the clipboard text onto them.

import type { PatchData } from '../../packages/engine/src/types.ts';
import { getLexicon } from './lexicon.ts';

const RARITY: Record<string, string> = {
  '普通': 'Normal', '魔法': 'Magic', '稀有': 'Rare', '传奇': 'Unique',
};

const HEAD: Array<[RegExp, string]> = [
  [/^(?:物品类别|物品种类|物品类别)\s*[:：]\s*/u, 'Item Class: '],
  [/^稀有度\s*[:：]\s*/u, 'Rarity: '],
  [/^物品等级\s*[:：]\s*/u, 'Item Level: '],
  [/^品质\s*[:：]\s*\+?/u, 'Quality: +'],
];

const NUM = String.raw`([+-]?\d+(?:\.\d+)?)`;
const TOKEN = /[+-]?(?:#|\d+(?:\.\d+)?)|\s+/g;
const escapeRe = (s: string): string => s.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');

function compile(text: string): RegExp {
  let out = '';
  let last = 0;
  TOKEN.lastIndex = 0;
  for (let m = TOKEN.exec(text); m !== null; m = TOKEN.exec(text)) {
    out += escapeRe(text.slice(last, m.index));
    out += /\s/.test(m[0]) ? String.raw`\s+` : NUM;
    last = m.index + m[0].length;
  }
  out += escapeRe(text.slice(last));
  return new RegExp(`^${out}$`);
}

/** Header, flags and base name. Modifier lines are left for `translateModLines`. */
export function translateCnItem(text: string): string {
  const lex = getLexicon();
  const bases = lex ? Object.entries(lex.bases).sort((a, b) => b[1].length - a[1].length) : [];
  return text.split('\n').map((line) => {
    let s = line.trimEnd();
    if (s === '已腐化' || s === '腐化') return 'Corrupted';
    for (const [re, prefix] of HEAD) {
      if (!re.test(s)) continue;
      const rest = s.replace(re, '').trim();
      if (prefix.startsWith('Rarity')) return `Rarity: ${RARITY[rest] ?? rest}`;
      return prefix + rest;
    }
    for (const [en, zh] of bases) {
      if (zh && s.includes(zh)) return s.replace(zh, en);
    }
    return s;
  }).join('\n');
}

/**
 * Replace Chinese stat lines with the English template of a mod on this base, numbers filled in.
 * Lines that do not match stay as they are, so `resolveMods` can still report them unresolved.
 */
export function translateModLines(data: PatchData, baseId: string, lines: readonly string[]): string[] {
  const lex = getLexicon();
  const base = data.bases.get(baseId);
  if (!lex || !base) return [...lines];
  const ids = [
    ...base.pools.normal.prefixes, ...base.pools.normal.suffixes,
    ...base.pools.essence.prefixes, ...base.pools.essence.suffixes,
    ...base.pools.desecrated.prefixes, ...base.pools.desecrated.suffixes,
  ];
  const matchers = ids.flatMap((id) => {
    const zh = lex.mods[id]?.text;
    const en = data.mods.get(id)?.text;
    if (!zh || !en) return [];
    return [{ re: compile(zh), en }];
  });
  return lines.map((line) => {
    for (const { re, en } of matchers) {
      const m = re.exec(line.trim());
      if (!m) continue;
      let i = 1;
      // `+#` in the English template is one printed number, sign included. The capture already
      // has the sign (`+12` or `-4`); leaving the template's `+` in front would print `++12`.
      return en.replace(/\+#|#/g, (tok) => {
        const num = m[i++] ?? '#';
        return tok === '+#' ? num : num.replace(/^\+/, '');
      });
    }
    return line;
  });
}

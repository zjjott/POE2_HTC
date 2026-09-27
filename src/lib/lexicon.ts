// Display overlay for game strings. English in mods.json stays the identity; zh-CN is joined by mod
// id and by base name. Missing entries fall back to English.

import { getLocale } from './i18n';

export interface ModLocale {
  readonly text?: string;
  readonly tiers?: Readonly<Record<string, string>>;
}

export interface LexiconFile {
  readonly mods: Readonly<Record<string, ModLocale>>;
  readonly bases: Readonly<Record<string, string>>;
}

let lexicon: LexiconFile | null = null;
const listeners = new Set<() => void>();

export function installLexicon(next: LexiconFile | null): void {
  lexicon = next;
  for (const l of listeners) l();
}

export function lexiconReady(): boolean {
  return lexicon !== null;
}

export function subscribeLexicon(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getLexicon(): LexiconFile | null {
  return lexicon;
}

function active(): LexiconFile | null {
  return getLocale() === 'zh-CN' ? lexicon : null;
}

/** poe2db tier names sometimes arrive as an `<a>` around the currency. The page prints text, not markup. */
function plain(s: string): string {
  if (!s.includes('<')) return s;
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}

/** The Chinese stat template (`+# 全属性`), or undefined to keep `mod.text`. */
export function lexiconModText(modId: string): string | undefined {
  const text = active()?.mods[modId]?.text;
  const cleaned = text ? plain(text) : '';
  return cleaned.length > 0 ? cleaned : undefined;
}

/** Tier name at this item level (`云端之`), or undefined to keep the English name. */
export function lexiconTierName(modId: string, ilvl: number): string | undefined {
  const name = active()?.mods[modId]?.tiers?.[String(ilvl)];
  const cleaned = name ? plain(name) : '';
  return cleaned.length > 0 ? cleaned : undefined;
}

/** Translate one base name, or a comma-separated list of them. Unknown names stay English. */
export function lexiconBaseName(name: string): string {
  const table = active()?.bases;
  if (!table) return name;
  return name.split(', ').map((part) => table[part] ?? part).join(', ');
}

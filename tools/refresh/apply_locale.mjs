#!/usr/bin/env node
// Build data/patches/0.5.0/locale/zh-CN.json from poe2db's simplified-Chinese pages.
//
// English stays in mods.json / base_items.json. This file is a display overlay keyed by the same
// ids: mod id → template + tier names (by ilvl), base name → Chinese name.
//
// Join key is (type, family, ilvl), which is stable across /us/ and /cn/. A row that does not
// join is omitted; the app falls back to English for that id.
//
// Usage: node tools/refresh/apply_locale.mjs
// Network: fetches https://poe2db.tw/cn/<page> (cached under tools/refresh/cache/poe2db/cn/).

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePoe2dbHtml } from './poe2db.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data/patches/0.5.0');
const CACHE = join(ROOT, 'tools/refresh/cache/poe2db/cn');

const CATEGORY_CLASS = {
  Wands: 'Wands', Sceptres: 'Sceptres', Bows: 'Bows', Crossbows: 'Crossbows',
  Quarterstaves: 'Quarterstaves', Staves: 'Staves', Spears: 'Spears',
  OneHand_Maces: 'One_Hand_Maces', TwoHand_Maces: 'Two_Hand_Maces',
  Foci: 'Foci', Quivers: 'Quivers', Bucklers: 'Bucklers', Amulets: 'Amulets', Rings: 'Rings',
  Belts: 'Belts', Tablets: 'Tablets',
};
const ARMOUR_CATS = new Set(['Body_Armours', 'Boots', 'Gloves', 'Helmets', 'Shields']);

function pageName(base) {
  if (ARMOUR_CATS.has(base.category)) return base.id;
  return CATEGORY_CLASS[base.category] ?? base.category;
}

/** Turn a poe2db printed stat into the same `#` template the English `mod.text` uses. */
function toTemplate(printed) {
  if (!printed) return null;
  return printed
    .replace(/\(\d+(?:\.\d+)?\s*[—–-]\s*\d+(?:\.\d+)?\)/g, '#')
    .replace(/(?<![\d.])\d+(?:\.\d+)?\s*[—–-]\s*\d+(?:\.\d+)?(?![\d.])/g, '#')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}

async function fetchPage(page) {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, `${page}.html`);
  if (existsSync(file)) return readFileSync(file, 'utf8');
  const url = `https://poe2db.tw/cn/${page}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'POE2_HTC locale refresh' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  const html = await res.text();
  writeFileSync(file, html);
  return html;
}

function indexPools(html) {
  const pools = parsePoe2dbHtml(html);
  const byKey = new Map();
  for (const rows of Object.values(pools)) {
    for (const row of rows) {
      const k = `${row.type}:${row.family}:${row.ilvl}`;
      if (!byKey.has(k)) byKey.set(k, row);
    }
  }
  return byKey;
}

function baseNames(html, allowed) {
  const names = new Map();
  const re = /class="whiteitem[^"]*"[^>]*href="(?:\/cn\/)?([A-Za-z0-9_]+)"[^>]*>([^<]+)</g;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const en = m[1].replace(/_/g, ' ');
    const zh = m[2].replace(/<[^>]+>/g, '').trim();
    if (allowed.has(en) && zh && /[\u4e00-\u9fff]/.test(zh)) names.set(en, zh);
  }
  return names;
}

const modsFile = JSON.parse(readFileSync(join(OUT, 'mods.json'), 'utf8'));
const basesFile = JSON.parse(readFileSync(join(OUT, 'base_items.json'), 'utf8'));

const knownBases = new Set(basesFile.items.flatMap((b) => b.bases ?? []));
const pages = [...new Set(basesFile.items.map(pageName))].filter(Boolean).sort();
const pageIndex = new Map();
const bases = {};
for (const page of pages) {
  let html;
  try {
    html = await fetchPage(page);
  } catch (err) {
    console.warn(`skip ${page}: ${err.message}`);
    continue;
  }
  pageIndex.set(page, indexPools(html));
  for (const [en, zh] of baseNames(html, knownBases)) bases[en] = zh;
  console.log(`fetched ${page}`);
}

const mods = {};
let joined = 0;
let missed = 0;
for (const base of basesFile.items) {
  const idx = pageIndex.get(pageName(base));
  if (!idx) continue;
  const ids = new Set();
  for (const pool of Object.values(base.pools ?? {})) {
    if (!pool || typeof pool !== 'object') continue;
    for (const id of [...(pool.prefixes ?? []), ...(pool.suffixes ?? [])]) ids.add(id);
  }
  for (const id of ids) {
    if (mods[id]) continue;
    const mod = modsFile.mods.find((m) => m.id === id);
    if (!mod) continue;
    const tiers = {};
    let text = null;
    let hit = false;
    for (const tier of mod.tiers ?? []) {
      const row = idx.get(`${mod.type}:${mod.family}:${tier.ilvl}`);
      if (!row) continue;
      hit = true;
      if (row.name) tiers[String(tier.ilvl)] = row.name;
      if (!text && row.text) text = toTemplate(row.text);
    }
    if (!hit) { missed++; continue; }
    joined++;
    mods[id] = {
      ...(text ? { text } : {}),
      ...(Object.keys(tiers).length ? { tiers } : {}),
    };
  }
}

mkdirSync(join(OUT, 'locale'), { recursive: true });
const locale = {
  locale: 'zh-CN',
  generated: new Date().toISOString().slice(0, 10),
  source: 'poe2db.tw/cn item-class pages, joined by (type, family, ilvl) onto 0.5.0 mod ids',
  mods,
  bases,
};
writeFileSync(join(OUT, 'locale/zh-CN.json'), JSON.stringify(locale, null, 2) + '\n');
console.log(`wrote zh-CN.json mods=${joined} missed=${missed} bases=${Object.keys(bases).length}`);

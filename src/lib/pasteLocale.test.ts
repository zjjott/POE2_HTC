import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadPatch } from '../../packages/engine/src/loadPatch.ts';
import { resolveMods } from '../../packages/engine/src/resolveMods.ts';
import { getLocale, setLocale } from './i18n.ts';
import { installLexicon, lexiconModText, type LexiconFile } from './lexicon.ts';
import { translateCnItem, translateModLines } from './pasteLocale.ts';
import { readPastedItem } from './pasteItem.ts';

const data = loadPatch('data/patches/0.5.0');
const lex = JSON.parse(readFileSync('data/patches/0.5.0/locale/zh-CN.json', 'utf8')) as LexiconFile;

afterEach(() => setLocale('en'));

describe('zh-CN lexicon', () => {
  it('stays English until the locale and the overlay are both on', () => {
    installLexicon(lex);
    expect(getLocale()).toBe('en');
    expect(lexiconModText('Amulets/AllAttributes')).toBeUndefined();
    setLocale('zh-CN');
    expect(lexiconModText('Amulets/AllAttributes')).toBe('+# 全属性');
  });
});

describe('a 国服 paste', () => {
  it('reads a simplified-Chinese amulet as the same mod id', () => {
    installLexicon(lex);
    setLocale('zh-CN');
    const text = [
      '稀有度: 稀有',
      '测试',
      '琥珀项链',
      '--------',
      '物品等级: 82',
      '--------',
      '+12 全属性',
    ].join('\n');
    const reading = readPastedItem(data, text);
    expect(reading?.baseId).toBe('Amulets');
    expect(reading?.level).toBe(82);
    expect(reading?.rows.some((r) => r.modId === 'Amulets/AllAttributes')).toBe(true);
  });

  it('rewrites a stat line onto the English template before the pools see it', () => {
    installLexicon(lex);
    const [line] = translateModLines(data, 'Amulets', ['+12 全属性']);
    const resolved = resolveMods(data, data.bases.get('Amulets')!, [line!]);
    expect(resolved.resolved[0]?.modId).toBe('Amulets/AllAttributes');
    expect(translateCnItem('稀有度: 稀有\n琥珀项链')).toContain('Rarity: Rare');
    expect(translateCnItem('稀有度: 稀有\n琥珀项链')).toContain('Amber Amulet');
  });
});

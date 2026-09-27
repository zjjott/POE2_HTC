import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadPatch } from '../../packages/engine/src/loadPatch.ts';
import { decodeCnItem, formatCnItem, formatPobItem, translateCnEquipment, type PobMod } from './cnItemText.ts';
import type { LexiconFile } from './lexicon.ts';

const data = loadPatch('data/patches/0.5.0');
const lex = JSON.parse(readFileSync('data/patches/0.5.0/locale/zh-CN.json', 'utf8')) as LexiconFile;
const pob = JSON.parse(readFileSync('data/pob/item-mods.json', 'utf8')) as PobMod[];

describe('translateCnEquipment', () => {
  const text = decodeCnItem(readFileSync('equit/法杖.txt'));
  const report = translateCnEquipment(text, data, lex, pob);

  it('reads the dueling wand and the affixes whose Chinese is in the lexicon', () => {
    expect(report.baseId).toBe('Wands');
    expect(report.baseName).toBe('Dueling Wand');
    expect(report.baseZh).toBe('决斗法杖');
    expect(report.itemName).toBe('魔像 利勾');
    expect(report.rarity).toBe('Rare');
    expect(report.itemLevel).toBe(81);
    expect(report.corrupted).toBe(false);
    expect(report.mods.map((m) => m.id)).toEqual([
      'Wands/GlobalIncreaseSpellSkillGemLevelWeapon',
      'Wands/Desecrated_WeaponDamageTypePrefix',
      'Wands/DamageGainedAsLightning',
      'Wands/PerfectEssence_IncreasedMana',
      'Wands/GlobalIncreaseColdSpellSkillGemLevelWeapon',
      'Wands/SpellCriticalStrikeChance',
      'Wands/ManaGainedFromEnemyDeath',
    ]);
    const lightning = report.mods.find((m) => m.id === 'Wands/DamageGainedAsLightning')!;
    expect(lightning.how).toBe('exact');
    expect(lightning.displayTier).toBe(3);
    expect(lightning.filled).toContain('22');
    const crit = report.mods.find((m) => m.id === 'Wands/SpellCriticalStrikeChance')!;
    expect(crit.how).toBe('exact');
    expect(crit.displayTier).toBe(5);
    const cold = report.mods.find((m) => m.id === 'Wands/GlobalIncreaseColdSpellSkillGemLevelWeapon')!;
    expect(cold.how).toBe('fuzzy');
    expect(cold.displayTier).toBe(2);
    expect(cold.note).toContain('冰霜');
    const alloy = report.mods.find((m) => m.id === 'Wands/PerfectEssence_IncreasedMana')!;
    expect(alloy.filled).toContain('184');
    expect(alloy.note).toContain('数值范围');
  });

  it('writes the block Path of Building pastes', () => {
    const block = formatPobItem(report);
    expect(block.startsWith('Wand\nDueling Wand\nCrafted: true\n')).toBe(true);
    expect(block).not.toContain('魔像');
    expect(block).not.toContain('Rarity:');
    expect(block).toContain('Quality: +19');
    expect(block).toContain('{rune}+1 to Level of all Spell Skills');
    expect(block).toContain('Prefix: {range:');
  });

  it('asks about the granted skill instead of inventing a modifier', () => {
    expect(report.unmatched.map((u) => u.text)).toEqual(['获得技能: 等级 18 法术节魔']);
    expect(formatCnItem(report)).toContain('未能匹配');
    expect(formatCnItem(report)).toContain('授权技能');
    expect(formatCnItem(report)).not.toContain('物品等级');
    expect(formatCnItem(report)).not.toContain('Requires');
    expect(formatCnItem(report)).not.toContain('Sockets');
  });

  it('writes jewellery catalyst quality as Catalyst and CatalystQuality', () => {
    const ring = translateCnEquipment(decodeCnItem(readFileSync('equit/左戒指.txt')), data, lex, pob);
    expect(ring.baseName).toBe('Emerald Ring');
    expect(ring.catalyst).toBe('Neural');
    expect(ring.catalystQuality).toBe(20);
    const block = formatPobItem(ring);
    expect(block.startsWith('Ring\nEmerald Ring\nCrafted: true\n')).toBe(true);
    expect(block).not.toContain('灵魂');
    expect(formatCnItem(ring)).not.toContain('灵魂');
    expect(block).toContain('Catalyst: Neural\nCatalystQuality: 20');
    expect(block.split('\n').some((line) => line.startsWith('Quality:'))).toBe(false);
    expect(block).toContain('Prefix: {range:1}IncreasedMana11');
    expect(block).toContain('Prefix: {range:0.75}ColdDamagePercent4');
    expect(block).toContain('Prefix: {range:1}EssenceIncreasedManaPercent1');
    expect(block).toContain('Suffix: {range:0}AllResistances5');
    expect(block).toContain('Suffix: {range:0.25}FireResist6');
    expect(block).toContain('Suffix: {range:1}ColdResist8');
    expect(block).toContain('{tags:attack}{range:0.875}+(120-160) to Accuracy Rating');
  });

  it('fuzzy-matches a near miss and refuses a line that is not close', () => {
    const fuzzy = translateCnEquipment([
      '克己权杖',
      '稀有度: 稀有',
      '物品等级: 80',
      '{ 后缀属性 "幸福之" (等阶：2) }',
      '魔力再生速度提高 53 (50-59)%',
    ].join('\n'), data, lex);
    expect(fuzzy.mods.map((m) => m.id)).toEqual(['Sceptres/ManaRegeneration']);
    expect(fuzzy.mods[0]!.how).toBe('fuzzy');
    expect(fuzzy.unmatched).toHaveLength(0);

    const none = translateCnEquipment([
      '克己权杖',
      '稀有度: 稀有',
      '--------',
      '完全不存在的属性描述',
    ].join('\n'), data, lex);
    expect(none.mods).toHaveLength(0);
    expect(none.unmatched).toHaveLength(1);
    expect(none.unmatched[0]!.reason).toContain('没有对上');
  });
});

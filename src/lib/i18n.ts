// UI locale. Game data (mod ids, share links, the solver) stays English; this only picks which
// strings the screen draws. Default is English so every existing test keeps seeing the copy it asserts.

import { useSyncExternalStore } from 'react';

export const LOCALES = ['en', 'zh-CN'] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_KEY = 'poe2htc.locale';

const ZH: Record<string, string> = {
  'app.tagline': '流放之路 2 制作指南',
  'app.by': '作者',
  'app.rate': '给应用评分',
  'app.next': '接下来做什么？',
  'app.report': '报告问题',
  'app.discord': 'Discord',
  'app.support': '支持',
  'app.star': '加星并贡献',
  'app.version': '版本 {version} — 在 GitHub 打开项目',
  'app.author': '作者 Dboire — 打开 GitHub 主页',
  'app.lang': '语言',
  'tab.plan': '从零规划',
  'tab.item': '我已有物品',
  'tab.tablets': '碑牌',
  'tab.gear': '主播装备',
  'tab.new': '新',
  'tab.beta': '测试',
  'lab.level': '物品等级',
  'lab.budget': '预算',
  'lab.budgetNote': '（崇高石，可选）',
  'lab.baseCost': '该等级白装价格',
  'lab.baseCostNote': '（崇高石）',
  'lab.baseCostTitle': '这个物品等级的白装要多少崇高石。只有白装真的免费时才留空——留空会按 0 计算，方案会宁愿扔掉快做完的物品，也不花钱修好它。',
  'lab.itemCap': '件数上限',
  'lab.itemCapAria': '这次制作期望消耗的装备件数上限',
  'lab.itemCapTitle': '求解会把期望用掉的装备件数（包括扔掉再换的底子）压在这个数以内。留空表示不限制。画面上的花费是这套方案真正要花的通货。',
  'ui.searchTrade': '在交易行搜索',
  'ui.searchTradeFor': '在交易行搜索：{name}',
  'ui.searchTradeLoose': '打开交易行。其中一条词缀没有对应的搜索项，或和相近词缀共用搜索，所以列表可能比这件物品更宽，请自己核对。',
  'ui.searchTradeTitle': '打开交易行：这一类物品，每条词缀至少达到要求的等阶，立即购买，从便宜到贵。',
  'ui.searchTradeFilled': '打开交易行，并填好这次搜索。',
  'ui.searchTradeShare': '打开交易行。这条词缀和另一条相近的共用说法，所以两边都可能出现。',
  'ui.searchTradeMagic': '打开交易行：魔法、10 次使用、只带这一侧的词缀，立即购买，从便宜到贵。',
  'ui.findPlain': '在交易行找一件白的',
  'ui.findOne': '在交易行找一件',
  'lab.copy': '复制链接',
  'lab.reset': '重置',
  'lab.find': '寻找方案',
  'lab.loading': '正在加载版本数据…',
  'lab.guide': '正在加载指南…',
  'effort.label': '搜索力度',
  'effort.quick': '快速',
  'effort.standard': '标准',
  'effort.exhaustive': '彻底',
  'effort.aria': '搜索力度 — 求解器在放弃前要找多仔细',
  'cat.Amulets': '项链',
  'cat.Belts': '腰带',
  'cat.Body_Armours': '胸甲',
  'cat.Boots': '鞋子',
  'cat.Gloves': '手套',
  'cat.Helmets': '头盔',
  'cat.Shields': '盾牌',
  'cat.Wands': '法杖',
  'cat.Sceptres': '短杖',
  'cat.Staves': '长杖',
  'cat.Bows': '弓',
  'cat.Crossbows': '弩',
  'cat.Quarterstaves': '细杖',
  'cat.Spears': '长矛',
  'cat.OneHand_Maces': '单手锤',
  'cat.TwoHand_Maces': '双手锤',
  'cat.Foci': '法器',
  'cat.Quivers': '箭袋',
  'cat.Bucklers': '轻盾',
  'cat.Rings': '戒指',
  'tier.any': '任意',
  'tier.ilvl': '物品等级',
  'cur.transmute': '蜕变',
  'cur.augment': '增幅',
  'cur.regal': '富豪',
  'cur.exalt': '崇高',
  'cur.alchemy': '点金',
  'cur.chaos': '混沌',
  'cur.annul': '无效',
  'cur.desecrate': '渎灵',
  'cur.essence': '精华',
  'cur.perfect-essence': '完美精华',
  'cur.greater': '高阶',
  'cur.perfect': '完美',
  'cur.basic': '基础',
  'src.perfect': ' · 完美精华',
  'src.alloy': ' · 合金',
  'src.essence': ' · 仅精华',
  'src.desecrated': ' · 渎灵',
  'src.rune': ' · 符文',
  'ui.base': '底子',
  'ui.variant': '变体',
  'ui.prefix': '前缀',
  'ui.suffix': '后缀',
  'ui.anyPrefix': '任意前缀',
  'ui.anySuffix': '任意后缀',
  'ui.anyNote': ' — 这里出什么都行',
  'ui.noMatches': '没有匹配',
  'ui.searchTargets': '搜索要作为目标的词缀…',
  'ui.searchItem': '搜索要加到物品上的词缀…',
  'ui.rarity': '稀有度',
  'ui.rare': '稀有（3 + 3）',
  'ui.magic': '魔法（1 + 1）',
  'ui.onItem': '物品上已有的词缀',
  'ui.fractured': '破裂',
  'ui.desecrated': '渎灵',
  'ui.ess': '精华',
  'ui.perf': '完美',
  'ui.alloy': '合金',
  'ui.desec': '渎灵',
  'ui.currencyMissing': '我没有的通货',
  'ui.nothingExcluded': '没有排除',
  'ui.nExcluded': '已排除 {n} 项',
  'ui.excludeHint': '勾选的东西不会出现在方案里。如果因此做不出来，会直接告诉你，而不是给出一条你跑不了的方案。',
  'ui.excludingAll': '排除全部{name}',
  'ui.excludingOnly': '只排除 {name}',
  'ui.newHere': '第一次用？看这里',
  'ui.hide': '收起',
  'ui.readGuide': '阅读说明',
  'ui.targetMods': '目标物品（{n} 条词缀）',
  'ui.targetSlots': '目标物品（{slots} 个孔位，{n} 条词缀{named}）',
  'ui.named': '，已命名',
  'ui.quickCheck': '快速通货检查',
  'ui.fullPlan': '规划到目标',
  'ui.trueCost': '真实期望花费',
  'ui.buyInstead': '改买一件半成品来做',
  'ui.wantNext': '接下来想要什么？',
  'ui.report': '报告问题',
  'ui.rate': '给 POE2HTC 评分',
  'ui.whatDo': '你想做什么？',
  'ui.currencyOptions': '通货选项',
  'ui.endAs': '这件物品要做成什么样？',
  'ui.gearWorn': '别人身上的装备',
  'ui.runes': '已镶嵌符文',
  'rune.astrids-creativity': '阿斯特丽德的创造',
  'rune.serles-triumph': '瑟尔的凯旋',
  'rune.thruds-might': '斯鲁德的神力',
  'rune.uhtreds-sidereus': '乌崔德的星辰',
  'rune.kolrs-hunt': '克尔的狩猎',
  'rune.katlas-gloom': '卡塔拉的阴霾',
  'rune.voranas-carnage': '沃拉娜的屠戮',
  'rune.medveds-tending': '梅德维德的照料',
  'rune.fx.astrids-creativity': '可以有 1 个额外工艺词缀（精华、完美精华或合金）',
  'rune.fx.serles-triumph': '允许多 1 条后缀',
  'rune.fx.thruds-might': '可以选取毁灭词缀',
  'rune.fx.uhtreds-sidereus': '可以重置塑时术师词缀',
  'rune.fx.kolrs-hunt': '可以重置神射手词缀',
  'rune.fx.katlas-gloom': '可以重置腐蚀词缀',
  'rune.fx.voranas-carnage': '可以重置盛怒词缀',
  'rune.fx.medveds-tending': '可以重置灵魂词缀',
  'rune.allows': '效果：{effect}',
  'ui.optional': '（可选）',
  'ui.loadFail': '版本数据加载失败',
  'ui.any': '任意',
  'ui.elementAny': '任意元素',
  'ui.elementOnly': '仅{name}',
  'attr.str': '力量',
  'attr.dex': '敏捷',
  'attr.int': '智慧',
  'def.str': '护甲',
  'def.dex': '闪避',
  'def.int': '能量护盾',
  'el.fire': '火焰',
  'el.cold': '冰霜',
  'el.lightning': '闪电',
  'el.physical': '物理',
  'el.chaos': '混沌',
  'effort.quick.hint': '几秒钟。更可能回来要求再算久一点，而不是直接给出答案。',
  'effort.standard.hint': '默认。大预算制作大约 25 秒。',
  'effort.exhaustive.hint': '要几分钟。短一档算不完的制作用这个。测过的都能在五分钟内定下来。',
  'effort.top': '这已是最高档。结果仍提前停下的话，没有更高的设置了。',
  'effort.raise': '如果结果说搜索提前停了，就调高一档。',
  'grp.chaos': '混沌石',
  'grp.exalt': '崇高石',
  'grp.annul': '无效石',
  'grp.alchemy': '点金石',
  'grp.regal': '富豪石',
  'grp.transmute': '蜕变石',
  'grp.augment': '增幅石',
  'grp.essence': '精华',
  'grp.desecrate': '渎灵（骨）',
  'grp.strengths': '高阶与完美的石和精华',
  'grp.strengths.hint': '快捷方式：这里勾高阶，等于在下面每一种石和精华里都勾高阶。预兆是另外一栏。',
  'grp.omens': '预兆',
  'mem.base': '基础',
  'mem.greater': '高阶',
  'mem.perfect': '完美',
  'mem.lesser': '低阶',
  'mem.normal': '普通',
  'mem.preserved': '保存',
  'mem.ancient': '远古',
  'mem.sinAnnul': '左旋无效',
  'mem.dexAnnul': '右旋无效',
  'mem.light': '光明',
  'mem.sinExalt': '左旋崇高',
  'mem.dexExalt': '右旋崇高',
  'mem.greaterExalt': '强效崇高',
  'mem.sinCryst': '左旋结晶',
  'mem.dexCryst': '右旋结晶',
  'mem.whittling': '削切',
  'mem.sinNecro': '左旋死灵',
  'mem.dexNecro': '右旋死灵',
  'mem.echoes': '深渊回响',
  'mem.blackblooded': '黑血',
  'mem.liege': '领主',
  'mem.sovereign': '君主',
  'ui.copyMods': '复制我当前的词缀',
  'ui.modToAdd': '要添加的词缀',
  'ui.modSacrifice': '要牺牲的词缀（混沌 / 无效）',
  'ui.none': '— 无 —',
  'ui.or': ' 或 ',
  'ui.theRoute': '路线',
  'ui.fullGraph': '完整图 · {n} 个状态',
  'ui.routeHint': '大多数能做完的做法是这样走的。切到图上，可以看到没掷中时会怎样。',
  'ui.graphHint': '策略能走到的每一个状态，以及它们之间怎么走。点一个方块看详情。',
  'ui.noRouteYet': '还没有路线。',
  'ui.noRouteBody': '求解在策略稳定之前就停了，算到的状态都到不了目标——每个状态还缺词缀，而且没找到加上去的办法。下面这些状态是真的，但它们是死路，不是方案。请提高',
  'ui.noRouteAgain': '再算一次。',
  'ui.searchEffort': '搜索力度',
  'ui.onward': '{p} 继续',
  'ui.finishesIt': ' · {p} 做完',
  'ui.noChange': ' · {p} 没变化，再来一次',
  'ui.back': ' · {p} 退回去',
  'ui.targetMark': '✓ 目标',
  'ui.startOverBox': '↺ 重来 · {cost}',
  'ui.graphLegend': '每个方块是一种物品状态，从左边的{start}到右边的目标。实线箭头是进展；琥珀色虚线是翻车——没掷中，或目标词缀低于要求的等阶、占住了家族，于是退回一步，策略再把它救回来。',
  'ui.yourItem': '你的物品',
  'ui.itemYouBuy': '你买的那件',
  'ui.targetReached': '到达目标',
  'ui.freshBase': '一块新的白装底子',
  'ui.startOverFresh': '换一块新的白装底子重来：',
  'ui.magicWord': '魔法',
  'ui.rareWord': '稀有',
  'ui.show': '展开',
  'ui.itemToBuy': '要买的物品',
  'ui.costToFinish': '做完的花费',
  'ui.payAtMost': '最多付这么多',
  'ui.tradePrice': '交易价格',
  'ui.total': '合计',
  'ui.routeBtn': '路线 ▸',
  'ui.hideRoute': '收起路线',
  'ui.hideThisRoute': '收起这条路线',
  'ui.drawingRoute': '正在画路线…',
  'ui.bestBuy': '最划算',
  'ui.notWorth': '不值得买',
  'ui.scratchCosts': '从零做的花费',
  'ui.whitePlus': '— 白装底子（{cost}）加上制作',
  'ui.whiteFreeLead': '— 白装底子按免费算；如果不是，请填写',
  'ui.whiteFreeTail': '。',
  'ui.baseCost': '底子花费',
  'ui.modsAlready': '物品上已经有的目标词缀',
  'ui.modsAlreadyAria': '物品上已经有的目标词缀',
  'ui.pricesIn': '交易价格单位',
  'ui.buyIntro': '买一件已经带上部分目标词缀的物品，再从它做到目标。把交易行上的价格填进来，看这样是否比从零做更便宜。',
  'ui.routeFrom': '从 {name} 出发的路线',
  'ui.saves': '省下 {n}',
  'ui.more': '多花 {n}',
  'ui.costFinishTitle': '从这件物品做到目标的真实期望花费',
  'ui.payAtMostTitle': '从零做的花费减去做到目标的花费：付得比这少就划算',
  'ui.totalTitle': '交易价格加上做到目标的花费',
  'ui.priceFor': '{name} 的交易价格，单位 {unit}',
  'ui.notAPrice': '这不是价格——填一个数字，比如 12 或 0.5',
  'ui.bestStatus': '你标过价的里面最划算：{name} — 合计 {total}，比从零做少 {saved}。',
  'ui.noneStatus': '你标过价的都不比从零做划算：最便宜的 {name} 要 {total}，多花 {more}。',
  'ui.routeFromLine': '从 ',
  'ui.finishCosts': ' 出发 — 做完要花 ',
  'ui.restartCheap': '从这件物品出发，最便宜的做法是换一块白装底子重来——它并不比从零做更省。',
  'ui.buyFoot': '价格表里没有「带指定词缀的成品」的价格，所以把你在交易行看到的填进来——小数点或逗号都可以（0.5 或 0,5）。每一行都假设这件物品其余词缀是空的：如果还带着你不想要的词缀，做完会更贵，因为得先把它们洗掉。买来的物品如果做砸了，方案可能会扔掉它、从白装底子重来，只要那样更便宜——你已经付的钱不会退。',
  'ui.itemCap': '件数上限内的中间装备',
  'ui.itemCapIntro': '从白装做完，这套方案期望用掉 {items} 件装备，每一次扔掉再换的底子都算在内。填一个上限，下面列出还能留在上限里、目标词缀又最少的那些中间装备。打开国服交易行链接，把现价填进来；买不到的那一行留空。',
  'ui.itemCapIntroSolved': '从白装做完，这套方案期望用掉 {items} 件装备，每一次扔掉再换的底子都算在内。上限 {n} 已经写进这次求解。下面列出还能留在上限里、目标词缀又最少的那些中间装备。打开国服交易行链接，把现价填进来；买不到的那一行留空。',
  'ui.itemCapBoundNote': '为了把期望件数压在 {n} 以内，方案少扔装备，通货因此花得更多。上面的花费是这套方案真正要花的通货，不含为了比较而加在重开上的额外代价。',
  'ui.itemCapUnmet': '上限 {n} 没有达到：这套方案仍期望 {items} 件。把上限调高，或把搜索力度开大后再算。',
  'ui.itemCapUnmetShort': '件数上限 {n} 没有达到。把上限调高，或把搜索力度开大后再算。',
  'ui.itemCapLabel': '件数上限',
  'ui.itemCapAria': '这次制作最多消耗多少件装备',
  'ui.itemCapBad': '填一个至少为 1 的整数。',
  'ui.itemCapWhiteFits': '白装本身就在上限里：{items} 件，不超过 {n}。期望花费仍是 {cost}。',
  'ui.itemCapNone': '没有一件中间装备能在 {n} 件以内做完。把上限调高。',
  'ui.items': '件数',
  'ui.itemCountTitle': '从这里做到目标期望消耗的装备件数，包括这一件',
  'ui.noTargetsYet': '还没有目标词缀',
  'ui.priceTheCap': '按现价计算',
  'ui.itemCapWhiteWins': '在 {n} 件以内，标过价的里面仍然是白装最便宜：{items} 件，期望 {total}。',
  'ui.itemCapBuyWins': '在 {n} 件以内，买 {name}：期望 {items} 件，合计 {total}——装备现价 {price}，做完再花 {finish}。留空的行没有算进去。',
  'ui.itemCapNoPick': '你标过价的都不能在这个上限里做完，白装也不行。填一个价格，或把上限调高。',
  'ui.itemCapFoot': '做完的花费来自上面那次求解，不是再跑一遍：加上你填的现价，不会改方案用哪一种通货。每一行都假设这件装备其余词缀是空的。留空表示买不到，不会被当成免费。',
  'ui.searchTradeCn': '国服交易行',
  'ui.searchTradeForCn': '在国服交易行搜索：{name}',
  'ui.searchTradeTitleCn': '打开腾讯国服交易行（poe.game.qq.com，周年庆巅峰挑战）：这一类物品，每条词缀至少达到要求的等阶，立即购买，从便宜到贵。',
  'ui.carvedNoBuy': '从破裂词缀开始的制作不能改买半成品：那件物品已经是起点，没有一块白装底子可以拿买来的东西替换。',
  'ui.stoppedEarly': '这里每一行的花费都来自上面那次求解，而那次求解在花费稳定之前就停了——所以还没有一份能信的列表。',
  'ui.computing': '正在计算…',
  'ui.computeAgain': '用{label}再算一次',
  'ui.beyondSettle': '已经是 {label} 了——这件装备超出求解器能算稳的范围。',
  'ui.singleTarget': '只有一条目标词缀时，没有半成品可买：已经带着它的物品就是成品。',
  'side.sinistral': '左旋',
  'side.dextral': '右旋',
  'side.prefix': '前缀',
  'side.suffix': '后缀',
  'omen.ancient': '远古',
  'omen.echoes': '深渊回响预兆',
  'omen.light': '光明预兆',
  'omen.boss.blackblooded': '黑血预兆',
  'omen.boss.liege': '领主预兆',
  'omen.boss.sovereign': '君主预兆',
  'act.restart': '换一个新底子重来',
  'act.exalt': '崇高',
  'st.white': '白装底子',
  'st.magic': '魔法',
  'st.mod1': '1 条词缀',
  'st.mods': '{n} 条词缀',
  'st.blocked1': '1 条被占',
  'st.blocked': '{n} 条被占',
  'st.junk': '+{n} 条垃圾',
  'st.junkDes': '1 条垃圾是渎灵',
  'st.desecrated': '渎灵',
};

let locale: Locale | null = null;
const listeners = new Set<() => void>();

/** jsdom's Storage, not Node's incomplete `localStorage` (no `clear`) that a bad flag can install. */
function storage(): Storage | null {
  // jsdom tests must not touch `localStorage`. This environment sets Node's
  // `--localstorage-file` without a path; the first read replaces jsdom's Storage with one that
  // has no `clear` / `removeItem`, and every later test that uses those methods dies.
  if (typeof window === 'undefined') return null;
  if (window.navigator?.userAgent?.includes('jsdom')) return null;
  try {
    if (typeof localStorage.getItem !== 'function' || typeof localStorage.removeItem !== 'function') return null;
    return localStorage;
  } catch {
    return null;
  }
}

function readStored(): Locale {
  const v = storage()?.getItem(LOCALE_KEY);
  if (v === 'zh-CN' || v === 'en') return v;
  return 'en';
}

export function getLocale(): Locale {
  locale ??= readStored();
  return locale;
}

export function setLocale(next: Locale): void {
  if (next === locale) return;
  locale = next;
  try { storage()?.setItem(LOCALE_KEY, next); } catch { /* ignore */ }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = next === 'zh-CN' ? 'zh-CN' : 'en';
  }
  for (const l of listeners) l();
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const raw = locale === 'zh-CN' ? (ZH[key] ?? key) : key;
  // English falls back to the key only when the caller passed a sentence. Call sites that want
  // English copy pass it as the default via `en`, kept out of the catalog so the source string
  // stays next to the JSX. Keys used as the English text are the ones without a separate `en`.
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ''));
}

/**
 * English sentence with a Chinese override. The English string is what tests assert, and it is
 * returned whenever the locale is `en` — including when the key has no Chinese entry.
 */
export function tr(en: string, key: string, vars?: Record<string, string | number>): string {
  if (locale !== 'zh-CN') return en;
  const zh = ZH[key] ?? en;
  if (!vars) return zh;
  return zh.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ''));
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale, getLocale);
}

if (typeof document !== 'undefined') {
  document.documentElement.lang = getLocale() === 'zh-CN' ? 'zh-CN' : 'en';
}

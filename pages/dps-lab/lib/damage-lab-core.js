const SAFE_MODEL_NOTE = '增益按时间轨道生效 ';
const STACKING_NOTE = '同类增益按最大有效值合并 ';
const BASE_FIRE_RATE_HZ = 15.0;
const CHART_MAX_POINTS = 200;
const OUTPOST_WINDOW_MIN_DEG = 0;
const OUTPOST_WINDOW_MAX_DEG = 360;
const OUTPOST_WINDOW_STEP_DEG = 5;

const OUTPOST_WINDOW_DEFAULT_BY_ATTACKER = {
  hero: 360,
  infantry: 120,
  sentry: 120,
  drone: 120,
};

const RESULT_TAUNT_LIBRARY = {
  quick: [
    '这就是数值吗，吓哭了',
    '血条归零比你挂科还快，对面纯纯经验包',
    '对手：妈妈，对面在打我；妈妈，对面把我秒了',
    '省流：动力强劲',
    '这TTK，对面买活都是浪费金币',
  ],
  clean: [
    '输出丝滑，让对面一个接着一个来排队暴毙吧',
    '每一发都精准打脸，对面连挣扎都显得多余',
    '不吵不闹闷声虐菜，稳稳送对面底盘下电咯',
    '赛场点名处决，轮到谁谁直接原地蒸发',
  ],
  grind: [
    '高情商：输出平滑；低情商：略显颓势',
    '伤害一点点刮，好歹最后应该是刮死了',
    '打这么慢，对面难道不会躲吗',
  ],
  stalled: [
    '这输出是给对面抛光装甲板？不如上去创了都比这疼',
    '对面的血好厚啊（doge），绝对不是自己输出太菜对吧',
    '差一步击穿，像差一分挂科，菜得抠脚。',
    '你大可以努力感动自己，自瞄肯定没那么弱的对吧',
    '打歪了，你中那点伤害是为了最后这点体面吗',
    'dps没输，输在对面死赖就是不吃伤害啊 嘿嘿',
  ],
  shielded: [
    '护甲没开就输出？对着空气打拳，纯纯搞笑',
    '门都没开，白给一波，对面看了都想笑',
    '护甲一合，伤害直接归零，白费力气',
    '护甲没开的输出，焦虑拉满，伤害为零',
  ],
};

const RESULT_TAUNT_REACTIONS = [
  '对面要是能打字，早哭着喊投降退赛了',
  '把这结果贴裁判台，让大家看对面有多菜',
  '数据说明一切，今天对面就不配上场',
  '这曲线有声的话，全是对面破防的哀嚎',
  '对面现在缺的不是战术，是能扛揍的脸',
];

const LEVEL_OPTIONS = Array.from({ length: 10 }, (_, index) => ({
  key: String(index + 1),
  label: `Lv.${index + 1}`,
  value: index + 1,
}));

const LARGE_ENERGY_DURATION_OPTIONS = [
  { key: 'arm_5', label: '激活 5 臂', durationSec: 30 },
  { key: 'arm_6', label: '激活 6 臂', durationSec: 35 },
  { key: 'arm_7', label: '激活 7 臂', durationSec: 40 },
  { key: 'arm_8', label: '激活 8 臂', durationSec: 45 },
  { key: 'arm_9', label: '激活 9 臂', durationSec: 50 },
  { key: 'arm_10', label: '激活 10 臂', durationSec: 60 },
];

const ATTACKER_ROLE_OPTIONS = [
  { key: 'hero', label: '英雄' },
  { key: 'infantry', label: '步兵' },
  { key: 'sentry', label: '哨兵' },
  { key: 'drone', label: '无人机' },
];

const TARGET_ROLE_OPTIONS = [
  { key: 'base', label: '基地' },
  { key: 'outpost', label: '前哨站' },
  { key: 'infantry', label: '步兵' },
  { key: 'hero', label: '英雄' },
  { key: 'sentry', label: '哨兵' },
  { key: 'engineer', label: '工程' },
];

const POSTURE_KEY_MOBILE = 'mobile';
const SENTRY_POSTURE_DECAY_SEC = 180;
const SENTRY_BASE_COOLING_RATE = 30;

const SENTRY_POSTURE_INTRINSIC_EFFECTS = {
  mobile: {
    target: {
      normal: { damageTakenMult: 1.25 },
      decayed: { damageTakenMult: 1.25 },
    },
  },
  attack: {
    attacker: {
      normal: { coolingMult: 3 },
      decayed: { coolingMult: 2 },
    },
    target: {
      normal: { damageTakenMult: 1.25 },
      decayed: { damageTakenMult: 1.25 },
    },
  },
  defense: {
    target: {
      normal: { damageTakenMult: 0.5 },
      decayed: { damageTakenMult: 0.75 },
    },
  },
};

const ROLE_LABELS = {
  hero: '英雄',
  infantry: '步兵',
  sentry: '哨兵',
  drone: '无人机',
};

const TARGET_LABELS = {
  base: '基地',
  outpost: '前哨站',
  infantry: '步兵',
  hero: '英雄',
  sentry: '哨兵',
  engineer: '工程',
};

const TARGET_DEFAULT_HEALTH = {
  base: 2000,
  outpost: 1500,
  infantry: 200,
  hero: 150,
  sentry: 400,
  engineer: 250,
};

const HERO_LEVEL_STATS = {
  melee: [
    null,
    { maxHealth: 200, maxHeat: 140, coolingRate: 12 },
    { maxHealth: 225, maxHeat: 150, coolingRate: 14 },
    { maxHealth: 250, maxHeat: 160, coolingRate: 16 },
    { maxHealth: 275, maxHeat: 170, coolingRate: 18 },
    { maxHealth: 300, maxHeat: 180, coolingRate: 20 },
    { maxHealth: 325, maxHeat: 190, coolingRate: 22 },
    { maxHealth: 350, maxHeat: 200, coolingRate: 24 },
    { maxHealth: 375, maxHeat: 210, coolingRate: 26 },
    { maxHealth: 400, maxHeat: 220, coolingRate: 28 },
    { maxHealth: 450, maxHeat: 240, coolingRate: 30 },
  ],
  ranged: [
    null,
    { maxHealth: 150, maxHeat: 100, coolingRate: 20 },
    { maxHealth: 165, maxHeat: 102, coolingRate: 23 },
    { maxHealth: 180, maxHeat: 104, coolingRate: 26 },
    { maxHealth: 195, maxHeat: 106, coolingRate: 29 },
    { maxHealth: 210, maxHeat: 108, coolingRate: 32 },
    { maxHealth: 225, maxHeat: 110, coolingRate: 35 },
    { maxHealth: 240, maxHeat: 115, coolingRate: 38 },
    { maxHealth: 255, maxHeat: 120, coolingRate: 41 },
    { maxHealth: 270, maxHeat: 125, coolingRate: 44 },
    { maxHealth: 300, maxHeat: 130, coolingRate: 50 },
  ],
};

const INFANTRY_ATTACK_LEVEL_STATS = {
  burst: [
    null,
    { maxHeat: 170, coolingRate: 5 },
    { maxHeat: 180, coolingRate: 7 },
    { maxHeat: 190, coolingRate: 9 },
    { maxHeat: 200, coolingRate: 11 },
    { maxHeat: 210, coolingRate: 12 },
    { maxHeat: 220, coolingRate: 13 },
    { maxHeat: 230, coolingRate: 14 },
    { maxHeat: 240, coolingRate: 16 },
    { maxHeat: 250, coolingRate: 18 },
    { maxHeat: 260, coolingRate: 20 },
  ],
  cooling: [
    null,
    { maxHeat: 40, coolingRate: 12 },
    { maxHeat: 48, coolingRate: 14 },
    { maxHeat: 56, coolingRate: 16 },
    { maxHeat: 64, coolingRate: 18 },
    { maxHeat: 72, coolingRate: 20 },
    { maxHeat: 80, coolingRate: 22 },
    { maxHeat: 88, coolingRate: 24 },
    { maxHeat: 96, coolingRate: 26 },
    { maxHeat: 114, coolingRate: 28 },
    { maxHeat: 120, coolingRate: 30 },
  ],
};

const INFANTRY_TARGET_LEVEL_STATS = {
  power: [
    null,
    { maxHealth: 150 },
    { maxHealth: 175 },
    { maxHealth: 200 },
    { maxHealth: 225 },
    { maxHealth: 250 },
    { maxHealth: 275 },
    { maxHealth: 300 },
    { maxHealth: 325 },
    { maxHealth: 350 },
    { maxHealth: 400 },
  ],
  health: [
    null,
    { maxHealth: 200 },
    { maxHealth: 225 },
    { maxHealth: 250 },
    { maxHealth: 275 },
    { maxHealth: 300 },
    { maxHealth: 325 },
    { maxHealth: 350 },
    { maxHealth: 375 },
    { maxHealth: 400 },
    { maxHealth: 400 },
  ],
};

const DRONE_LEVEL_STATS = [
  null,
  { maxHeat: 100, coolingRate: 20 },
  { maxHeat: 110, coolingRate: 30 },
  { maxHeat: 120, coolingRate: 40 },
  { maxHeat: 130, coolingRate: 50 },
  { maxHeat: 140, coolingRate: 60 },
  { maxHeat: 150, coolingRate: 70 },
  { maxHeat: 160, coolingRate: 80 },
  { maxHeat: 170, coolingRate: 90 },
  { maxHeat: 180, coolingRate: 100 },
  { maxHeat: 200, coolingRate: 120 },
];

const TARGET_PARTS = {
  base: [
    { key: 'normal_plate', label: '普通装甲板', receiveRatio: 1, damageScale17mm: 20, damageScale42mm: 75 },
    { key: 'front_upper_plate', label: '上方装甲板', receiveRatio: 1, damageScale17mm: 12, damageScale42mm: 68 },
    { key: 'shield_closed', label: '护甲未展开', receiveRatio: 0, damageScale17mm: 0, damageScale42mm: 0 },
  ],
  outpost: [
    { key: 'central_plate', label: '中部装甲板', receiveRatio: 120 / 360, damageScale17mm: 20, damageScale42mm: 75 },
  ],
  infantry: [{ key: 'armor_plate', label: '装甲模块', receiveRatio: 1, damageScale17mm: 15, damageScale42mm: 60 }],
  hero: [{ key: 'armor_plate', label: '装甲模块', receiveRatio: 1, damageScale17mm: 15, damageScale42mm: 60 }],
  sentry: [{ key: 'armor_plate', label: '装甲模块', receiveRatio: 1, damageScale17mm: 12, damageScale42mm: 52 }],
  engineer: [{ key: 'armor_plate', label: '装甲模块', receiveRatio: 1, damageScale17mm: 15, damageScale42mm: 60 }],
};

function getDefaultOutpostWindowDegrees(attackerRole) {
  return OUTPOST_WINDOW_DEFAULT_BY_ATTACKER[attackerRole] || 120;
}

function normalizeOutpostWindowDegrees(value, attackerRole) {
  return clamp(toNumber(value, getDefaultOutpostWindowDegrees(attackerRole)), OUTPOST_WINDOW_MIN_DEG, OUTPOST_WINDOW_MAX_DEG);
}

function computeOutpostReceiveRatio(windowDegrees) {
  return clamp(windowDegrees, OUTPOST_WINDOW_MIN_DEG, OUTPOST_WINDOW_MAX_DEG) / 360;
}

function buildOutpostWindowNote(windowDegrees) {
  return `前哨站受击按 ${Number(windowDegrees).toFixed(0)}° 可击打窗口折算 `;
}

function pickTauntVariant(list, seed) {
  if (!Array.isArray(list) || !list.length) {
    return '';
  }
  return list[Math.abs(seed) % list.length];
}

function buildAnalysisTaunt(context) {
  const { inputs, target, ttkSec, totalDamage, peakHeat, totalShots, lastReceiveRatio, targetPart } = context;
  let bucketKey = 'clean';
  if (inputs.targetRole === 'base' && inputs.targetPart === 'shield_closed') {
    bucketKey = 'shielded';
  } else if (inputs.targetRole === 'outpost') {
    bucketKey = inputs.targetWindowDegrees >= 240 ? 'outpostWide' : 'outpostTight';
  } else if (ttkSec === null) {
    bucketKey = 'stalled';
  } else if (ttkSec <= 3) {
    bucketKey = 'quick';
  } else if (ttkSec > 10) {
    bucketKey = 'grind';
  }

  const primarySeed = Math.round(totalDamage) + totalShots + Math.round(peakHeat) + Math.round(lastReceiveRatio * 100) + String(inputs.attackerRole).length * 11 + String(inputs.targetRole).length * 7;
  const reactionSeed = Math.round((ttkSec === null ? inputs.durationSec : ttkSec) * 10) + Math.round((target && target.resolved && target.resolved.maxHealth) || 0) + Math.round((targetPart && targetPart.receiveRatio || 0) * 1000);
  const primary = pickTauntVariant(RESULT_TAUNT_LIBRARY[bucketKey], primarySeed);
  const reaction = pickTauntVariant(RESULT_TAUNT_REACTIONS, reactionSeed);
  return {
    title: '',
    lines: [primary, reaction].filter(Boolean),
  };
}

const EFFECTS = [
  {
    key: 'hero_deployment',
    label: '英雄部署区',
    description: '按英雄部署区常驻占位近似，提供 +50% 攻击并附带 25% 防御 ',
    damageDealtMult: 1.5,
    damageTakenMult: 0.75,
    coolingMult: 1,
    hitProbabilityMult: 1,
    attackerRoles: ['hero'],
    targetUnits: ['hero'],
    showOnAttacker: true,
    showOnTarget: true,
  },
  {
    key: 'fort',
    label: '己方堡垒支援',
    description: '按堡垒增益点的射击热量冷却加成近似，主要强化持续输出 ',
    damageDealtMult: 1,
    damageTakenMult: 1,
    coolingMult: 1.5,
    hitProbabilityMult: 1,
    attackerRoles: ['infantry', 'sentry'],
    targetUnits: ['infantry', 'sentry'],
    showOnAttacker: true,
    showOnTarget: false,
  },
  {
    key: 'enemy_fort_exposed',
    label: '敌方堡垒暴露',
    description: '按敌方堡垒点暴露阶段近似，当前使用 +100% 易伤做风险对比 ',
    damageDealtMult: 1,
    damageTakenMult: 2,
    coolingMult: 1,
    hitProbabilityMult: 1,
    attackerRoles: [],
    targetUnits: ['infantry', 'sentry'],
    showOnAttacker: false,
    showOnTarget: true,
  },
  {
    key: 'small_energy_mechanism',
    label: '小能量机关',
    description: '小能量机关激活后，己方机器人、前哨站、基地获得 25% 防御增益，当前按 45 秒持续时间近似 ',
    defaultDurationSec: 45,
    damageDealtMult: 1,
    damageTakenMult: 0.75,
    coolingMult: 1,
    hitProbabilityMult: 1,
    attackerRoles: ['hero', 'infantry', 'sentry', 'drone'],
    targetUnits: ['base', 'outpost', 'infantry', 'hero', 'sentry', 'engineer'],
    showOnAttacker: true,
    showOnTarget: true,
  },
  {
    key: 'large_energy_mechanism',
    label: '大能量机关',
    description: '大能量机关按平均环数提供不同档位的攻击、防御与热量冷却增益，持续时间按激活灯臂数确定 ',
    damageDealtMult: 1,
    damageTakenMult: 1,
    coolingMult: 1,
    hitProbabilityMult: 1,
    defaultDurationKey: 'arm_8',
    durationOptions: LARGE_ENERGY_DURATION_OPTIONS,
    variants: [
      {
        key: 'ring_1_3',
        label: '平均环数 [1,3]',
        description: '平均环数 [1,3]：攻击 +150%，防御 +25%，无热量冷却增益 ',
        sideOverrides: {
          attacker: { damageDealtMult: 2.5, damageTakenMult: 0.75, coolingMult: 1 },
          target: { damageDealtMult: 1, damageTakenMult: 0.75, coolingMult: 1 },
        },
      },
      {
        key: 'ring_3_7',
        label: '平均环数 (3,7]',
        description: '平均环数 (3,7]：攻击 +150%，防御 +25%，热量冷却 2 倍 ',
        sideOverrides: {
          attacker: { damageDealtMult: 2.5, damageTakenMult: 0.75, coolingMult: 2 },
          target: { damageDealtMult: 1, damageTakenMult: 0.75, coolingMult: 1 },
        },
      },
      {
        key: 'ring_7_8',
        label: '平均环数 (7,8]',
        description: '平均环数 (7,8]：攻击 +200%，防御 +25%，热量冷却 2 倍 ',
        sideOverrides: {
          attacker: { damageDealtMult: 3, damageTakenMult: 0.75, coolingMult: 2 },
          target: { damageDealtMult: 1, damageTakenMult: 0.75, coolingMult: 1 },
        },
      },
      {
        key: 'ring_8_9',
        label: '平均环数 (8,9]',
        description: '平均环数 (8,9]：攻击 +200%，防御 +25%，热量冷却 3 倍 ',
        sideOverrides: {
          attacker: { damageDealtMult: 3, damageTakenMult: 0.75, coolingMult: 3 },
          target: { damageDealtMult: 1, damageTakenMult: 0.75, coolingMult: 1 },
        },
      },
      {
        key: 'ring_9_10',
        label: '平均环数 (9,10]',
        description: '平均环数 (9,10]：攻击 +300%，防御 +50%，热量冷却 5 倍 ',
        sideOverrides: {
          attacker: { damageDealtMult: 4, damageTakenMult: 0.5, coolingMult: 5 },
          target: { damageDealtMult: 1, damageTakenMult: 0.5, coolingMult: 1 },
        },
      },
    ],
    attackerRoles: ['hero', 'infantry', 'sentry', 'drone'],
    targetUnits: ['base', 'outpost', 'infantry', 'hero', 'sentry', 'engineer'],
    showOnAttacker: true,
    showOnTarget: true,
  },
  {
    key: 'respawn_weak',
    label: '复活虚弱',
    description: '复活虚弱阶段近似：攻击侧 -30% 出伤，受击侧额外 +15% 易伤 ',
    defaultDurationSec: 9,
    damageDealtMult: 0.7,
    damageTakenMult: 1.15,
    coolingMult: 1,
    hitProbabilityMult: 1,
    attackerRoles: ['hero', 'infantry', 'sentry', 'drone'],
    targetUnits: ['hero', 'infantry', 'sentry', 'engineer'],
    showOnAttacker: true,
    showOnTarget: true,
  },
  {
    key: 'base_buff',
    label: '基地增益点',
    description: '第七分钟后的基地增益点，按 50% 防御并清除虚弱做对比 ',
    damageDealtMult: 1,
    damageTakenMult: 0.5,
    coolingMult: 1,
    hitProbabilityMult: 1,
    attackerRoles: [],
    targetUnits: ['hero', 'infantry', 'sentry', 'engineer'],
    showOnAttacker: false,
    showOnTarget: true,
  },
  {
    key: 'outpost_buff',
    label: '前哨增益点',
    description: '前哨站增益点按 25% 防御近似，并保留发弹量兑换语义 ',
    damageDealtMult: 1,
    damageTakenMult: 0.75,
    coolingMult: 1,
    hitProbabilityMult: 1,
    attackerRoles: [],
    targetUnits: ['hero', 'infantry', 'sentry', 'engineer'],
    showOnAttacker: false,
    showOnTarget: true,
  },
  {
    key: 'central_highland',
    label: '中央高地',
    description: '中央高地占点近似，提供 25% 防御 ',
    damageDealtMult: 1,
    damageTakenMult: 0.75,
    coolingMult: 1,
    hitProbabilityMult: 1,
    attackerRoles: [],
    targetUnits: ['hero', 'infantry', 'sentry'],
    showOnAttacker: false,
    showOnTarget: true,
  },
  {
    key: 'trapezoid_highland',
    label: '梯形高地',
    description: '梯形高地占点近似，提供 50% 防御 ',
    damageDealtMult: 1,
    damageTakenMult: 0.5,
    coolingMult: 1,
    hitProbabilityMult: 1,
    attackerRoles: [],
    targetUnits: ['hero', 'infantry', 'sentry', 'engineer'],
    showOnAttacker: false,
    showOnTarget: true,
  },
  {
    key: 'terrain_crossing',
    label: '地形跨越',
    description: '可切换公路、飞坡、高地、隧道，并为其单独编排生效时间 ',
    damageDealtMult: 1,
    damageTakenMult: 1,
    coolingMult: 1,
    hitProbabilityMult: 1,
    variants: [
      {
        key: 'road',
        label: '公路',
        description: '公路轨道固定 5 秒 攻击方无额外属性，受击方获得 25% 防御 ',
        damageTakenMult: 1,
        coolingMult: 1,
        sideOverrides: {
          attacker: { damageTakenMult: 1, coolingMult: 1 },
          target: { damageTakenMult: 0.75, coolingMult: 1 },
        },
        defaultDurationSecBySide: { attacker: 5, target: 5 },
      },
      {
        key: 'flyover',
        label: '飞坡',
        description: '飞坡轨道固定 30 秒 攻击方无额外属性，受击方获得 25% 防御 ',
        damageTakenMult: 1,
        coolingMult: 1,
        sideOverrides: {
          attacker: { damageTakenMult: 1, coolingMult: 1 },
          target: { damageTakenMult: 0.75, coolingMult: 1 },
        },
        defaultDurationSecBySide: { attacker: 30, target: 30 },
      },
      {
        key: 'highland',
        label: '高地',
        description: '高地轨道固定 30 秒 攻击方无额外属性，受击方获得 25% 防御 ',
        damageTakenMult: 1,
        coolingMult: 1,
        sideOverrides: {
          attacker: { damageTakenMult: 1, coolingMult: 1 },
          target: { damageTakenMult: 0.75, coolingMult: 1 },
        },
        defaultDurationSecBySide: { attacker: 30, target: 30 },
      },
      {
        key: 'tunnel',
        label: '隧道',
        description: '隧道轨道固定时长 攻击方只有 100% 冷却增益，受击方获得 50% 防御 ',
        damageTakenMult: 1,
        coolingMult: 1,
        sideOverrides: {
          attacker: { damageTakenMult: 1, coolingMult: 2 },
          target: { damageTakenMult: 0.5, coolingMult: 1 },
        },
        defaultDurationSecBySide: { attacker: 120, target: 10 },
      },
    ],
    attackerRoles: ['hero', 'infantry', 'sentry'],
    targetUnits: ['hero', 'infantry', 'sentry', 'engineer'],
    showOnAttacker: true,
    showOnTarget: true,
  },
  {
    key: 'radar_vulnerability',
    label: '雷达易伤',
    description: '雷达判定易伤：目标额外承受 25% 伤害 ',
    damageDealtMult: 1,
    damageTakenMult: 1.25,
    coolingMult: 1,
    hitProbabilityMult: 1,
    attackerRoles: [],
    targetUnits: ['hero', 'infantry', 'sentry', 'engineer'],
    showOnAttacker: false,
    showOnTarget: true,
  },
  {
    key: 'engineer_opening_defense',
    label: '工程开局防御',
    description: '工程开局防御阶段按常驻防御对比，用于快速估算开局硬度 ',
    damageDealtMult: 1,
    damageTakenMult: 0.5,
    coolingMult: 1,
    hitProbabilityMult: 1,
    attackerRoles: [],
    targetUnits: ['engineer'],
    showOnAttacker: false,
    showOnTarget: true,
  },
];

const ATTACKER_CATALOG = {
  hero: {
    label: '英雄',
    showProfileSelector: true,
    showLevelSelector: true,
    showPostureSelector: false,
    defaultProfile: 'ranged',
    defaultLevel: 1,
    profiles: {
      melee: {
        label: '近战优先',
        resolve(level) {
          const stats = getLeveledStats(HERO_LEVEL_STATS.melee, level);
          return { ammoType: '42mm', heatPerShot: 12, maxHealth: stats.maxHealth, maxHeat: stats.maxHeat, coolingRate: stats.coolingRate, note: '英雄攻击方支持近战/远程两种配置，参数按性能体系表修正 ' };
        },
      },
      ranged: {
        label: '远程优先',
        resolve(level) {
          const stats = getLeveledStats(HERO_LEVEL_STATS.ranged, level);
          return { ammoType: '42mm', heatPerShot: 12, maxHealth: stats.maxHealth, maxHeat: stats.maxHeat, coolingRate: stats.coolingRate, note: '英雄攻击方支持近战/远程两种配置，参数按性能体系表修正 ' };
        },
      },
    },
  },
  infantry: {
    label: '步兵',
    showProfileSelector: true,
    showLevelSelector: true,
    showPostureSelector: false,
    defaultProfile: 'cooling',
    defaultLevel: 1,
    profiles: {
      burst: {
        label: '爆发优先',
        resolve(level) {
          const stats = getLeveledStats(INFANTRY_ATTACK_LEVEL_STATS.burst, level);
          return { ammoType: '17mm', heatPerShot: 10, maxHeat: stats.maxHeat, coolingRate: stats.coolingRate, note: '步兵攻击方只配置爆发优先/冷却优先，参数按性能体系表修正 ' };
        },
      },
      cooling: {
        label: '冷却优先',
        resolve(level) {
          const stats = getLeveledStats(INFANTRY_ATTACK_LEVEL_STATS.cooling, level);
          return { ammoType: '17mm', heatPerShot: 10, maxHeat: stats.maxHeat, coolingRate: stats.coolingRate, note: '步兵攻击方只配置爆发优先/冷却优先，参数按性能体系表修正 ' };
        },
      },
    },
  },
  sentry: {
    label: '哨兵',
    showProfileSelector: false,
    showLevelSelector: false,
    showPostureSelector: true,
    defaultPosture: POSTURE_KEY_MOBILE,
    postures: {
      mobile: { label: '移动姿态', resolve() { return { ammoType: '17mm', heatPerShot: 10, maxHeat: 220, coolingRate: SENTRY_BASE_COOLING_RATE, note: getSentryAttackerNote('mobile') }; } },
      attack: { label: '进攻姿态', resolve() { return { ammoType: '17mm', heatPerShot: 10, maxHeat: 240, coolingRate: SENTRY_BASE_COOLING_RATE, note: getSentryAttackerNote('attack') }; } },
      defense: { label: '防御姿态', resolve() { return { ammoType: '17mm', heatPerShot: 10, maxHeat: 220, coolingRate: SENTRY_BASE_COOLING_RATE, note: getSentryAttackerNote('defense') }; } },
    },
  },
  drone: {
    label: '无人机',
    showProfileSelector: false,
    showLevelSelector: true,
    showPostureSelector: false,
    defaultLevel: 1,
    resolve(level) {
      const stats = getLeveledStats(DRONE_LEVEL_STATS, level);
      return { ammoType: '17mm', heatPerShot: 10, maxHeat: stats.maxHeat, coolingRate: stats.coolingRate, note: '无人机只有等级，没有配置，且只作为攻击方，参数按性能体系表修正 ' };
    },
  },
};

const TARGET_CATALOG = {
  base: { label: '基地', showProfileSelector: false, showLevelSelector: false, showPostureSelector: false, resolve() { return { maxHealth: TARGET_DEFAULT_HEALTH.base, damageReduction: 0, note: '基地支持普通装甲板、上方装甲板和护甲未展开三种状态 ' }; } },
  outpost: { label: '前哨站', showProfileSelector: false, showLevelSelector: false, showPostureSelector: false, resolve() { return { maxHealth: TARGET_DEFAULT_HEALTH.outpost, damageReduction: 0, note: buildOutpostWindowNote(getDefaultOutpostWindowDegrees(DEFAULT_FORM.attackerRole)) }; } },
  infantry: {
    label: '步兵', showProfileSelector: true, showLevelSelector: true, showPostureSelector: false, defaultProfile: 'health', defaultLevel: 1,
    profiles: {
      health: { label: '血量优先', resolve(level) { const stats = getLeveledStats(INFANTRY_TARGET_LEVEL_STATS.health, level); return { maxHealth: stats.maxHealth, damageReduction: 0, note: '步兵受击方配置为血量优先/功率优先，参数按性能体系表修正 ' }; } },
      power: { label: '功率优先', resolve(level) { const stats = getLeveledStats(INFANTRY_TARGET_LEVEL_STATS.power, level); return { maxHealth: stats.maxHealth, damageReduction: 0, note: '步兵受击方配置为血量优先/功率优先，参数按性能体系表修正 ' }; } },
    },
  },
  hero: {
    label: '英雄', showProfileSelector: true, showLevelSelector: true, showPostureSelector: false, defaultProfile: 'ranged', defaultLevel: 1,
    profiles: {
      melee: { label: '近战优先', resolve(level) { const stats = getLeveledStats(HERO_LEVEL_STATS.melee, level); return { maxHealth: stats.maxHealth, damageReduction: 0, note: '英雄受击方支持近战/远程两种配置，参数按性能体系表修正 ' }; } },
      ranged: { label: '远程优先', resolve(level) { const stats = getLeveledStats(HERO_LEVEL_STATS.ranged, level); return { maxHealth: stats.maxHealth, damageReduction: 0, note: '英雄受击方支持近战/远程两种配置，参数按性能体系表修正 ' }; } },
    },
  },
  sentry: {
    label: '哨兵', showProfileSelector: false, showLevelSelector: false, showPostureSelector: true, defaultPosture: POSTURE_KEY_MOBILE,
    postures: {
      mobile: { label: '移动姿态', resolve() { return { maxHealth: TARGET_DEFAULT_HEALTH.sentry, damageReduction: 0, note: getSentryTargetNote('mobile') }; } },
      attack: { label: '进攻姿态', resolve() { return { maxHealth: TARGET_DEFAULT_HEALTH.sentry, damageReduction: 0, note: getSentryTargetNote('attack') }; } },
      defense: { label: '防御姿态', resolve() { return { maxHealth: TARGET_DEFAULT_HEALTH.sentry, damageReduction: 0, note: getSentryTargetNote('defense') }; } },
    },
  },
  engineer: { label: '工程', showProfileSelector: false, showLevelSelector: false, showPostureSelector: false, resolve() { return { maxHealth: TARGET_DEFAULT_HEALTH.engineer, damageReduction: 0, note: '工程目标支持开局防御等特定状态对比 ' }; } },
};

const DEFAULT_FORM = {
  attackerRole: 'sentry',
  attackerProfile: 'cooling',
  attackerLevel: 1,
  attackerPosture: 'attack',
  targetRole: 'outpost',
  targetProfile: '',
  targetLevel: 1,
  targetPosture: POSTURE_KEY_MOBILE,
  targetPart: 'central_plate',
  targetWindowDegrees: getDefaultOutpostWindowDegrees('sentry'),
  durationSec: 60,
  requestedFireRateHz: BASE_FIRE_RATE_HZ,
  initialHeat: 0,
  targetHealthPercent: 100,
  hitRatePercent: 100,
  attackerEffects: [],
  targetEffects: [],
  attackerSchedules: [],
  targetSchedules: [],
};

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function toNumber(value, fallback) { const numeric = Number(value); return Number.isFinite(numeric) ? numeric : fallback; }
function dedupeArray(value) { if (!Array.isArray(value)) { return []; } return Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean))); }
function getLeveledStats(levelTable, level) { return levelTable[clamp(toNumber(level, 1), 1, 10)] || levelTable[1]; }
function pickOptionIndex(options, key) { const index = options.findIndex((item) => item.key === key); return index >= 0 ? index : 0; }
function getProfileOptions(roleConfig) { if (!roleConfig || !roleConfig.profiles) { return []; } return Object.keys(roleConfig.profiles).map((key) => ({ key, label: roleConfig.profiles[key].label })); }
function getPostureOptions(roleConfig) { if (!roleConfig || !roleConfig.postures) { return []; } return Object.keys(roleConfig.postures).map((key) => ({ key, label: roleConfig.postures[key].label })); }
function getTargetPartOptions(targetUnit) { return TARGET_PARTS[targetUnit] || TARGET_PARTS.infantry; }
function resolveTargetPart(targetUnit, targetPart, outpostWindowDegrees) {
  const options = getTargetPartOptions(targetUnit);
  const resolvedPart = options.find((item) => item.key === targetPart) || options[0];
  if (targetUnit !== 'outpost') {
    return resolvedPart;
  }
  return Object.assign({}, resolvedPart, {
    receiveRatio: computeOutpostReceiveRatio(outpostWindowDegrees),
  });
}
function positiveEffectPct(multiplier) { return Math.max(0, Number(multiplier) - 1); }
function negativeEffectPct(multiplier) { return Math.max(0, 1 - Number(multiplier)); }
function formatEffectPercent(value) { return `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(0)}%`; }

function createEffect(overrides = {}) {
  return Object.assign({
    damageDealtMult: 1,
    damageTakenMult: 1,
    coolingMult: 1,
    hitProbabilityMult: 1,
  }, overrides);
}

function isSentryPostureDecayed(currentTime) {
  return Number(currentTime) >= SENTRY_POSTURE_DECAY_SEC - 1e-9;
}

function getSentryPostureEffects(postureKey, side, currentTime) {
  const postureEffects = SENTRY_POSTURE_INTRINSIC_EFFECTS[postureKey] || SENTRY_POSTURE_INTRINSIC_EFFECTS[POSTURE_KEY_MOBILE];
  const sideEffects = postureEffects && postureEffects[side];
  if (!sideEffects) {
    return null;
  }
  return createEffect(isSentryPostureDecayed(currentTime) ? sideEffects.decayed : sideEffects.normal);
}

function getSentryAttackerNote(postureKey) {
  if (postureKey === 'attack') {
    return '哨兵进攻姿态按 30/s 基础冷却计算，前 180 秒附带 3 倍冷却增益，之后衰减为 2 倍 ';
  }
  if (postureKey === 'defense') {
    return '哨兵防御姿态按 30/s 冷却计算；若作为受击方，前 180 秒保持 50% 防御，之后衰减为 25% ';
  }
  return '哨兵移动姿态按 30/s 冷却计算；若作为受击方，常驻 25% 易伤 ';
}

function getSentryTargetNote(postureKey) {
  if (postureKey === 'attack') {
    return '哨兵进攻姿态受击时常驻 25% 易伤；若作为攻击方，前 180 秒附带 3 倍冷却增益，之后衰减为 2 倍 ';
  }
  if (postureKey === 'defense') {
    return '哨兵防御姿态受击时前 180 秒获得 50% 防御，之后衰减为 25% 防御 ';
  }
  return '哨兵移动姿态受击时常驻 25% 易伤 ';
}

function buildEffectBadges(effect) {
  const badges = [];
  const attackDelta = (Number(effect.damageDealtMult) - 1) * 100;
  const defenseDelta = (1 - Number(effect.damageTakenMult)) * 100;
  const vulnerabilityDelta = (Number(effect.damageTakenMult) - 1) * 100;
  const coolingDelta = (Number(effect.coolingMult) - 1) * 100;
  const hitDelta = (Number(effect.hitProbabilityMult) - 1) * 100;

  if (Math.abs(attackDelta) > 1e-6) {
    badges.push({ tone: attackDelta >= 0 ? 'attack' : 'penalty', text: `攻击 ${formatEffectPercent(attackDelta)}` });
  }
  if (defenseDelta > 1e-6) {
    badges.push({ tone: 'defense', text: `防御 +${defenseDelta.toFixed(0)}%` });
  }
  if (vulnerabilityDelta > 1e-6) {
    badges.push({ tone: 'vulnerability', text: `易伤 +${vulnerabilityDelta.toFixed(0)}%` });
  }
  if (Math.abs(coolingDelta) > 1e-6) {
    badges.push({ tone: coolingDelta >= 0 ? 'cooling' : 'penalty', text: `冷却 ${formatEffectPercent(coolingDelta)}` });
  }
  if (Math.abs(hitDelta) > 1e-6) {
    badges.push({ tone: hitDelta >= 0 ? 'hit' : 'penalty', text: `命中 ${formatEffectPercent(hitDelta)}` });
  }
  return badges;
}

function inferEffectCategory(effect, badges) {
  if (badges.length > 1) {
    return '复合状态';
  }
  if (Number(effect.damageTakenMult) < 1) {
    return '防御增益';
  }
  if (Number(effect.damageTakenMult) > 1) {
    return '易伤状态';
  }
  if (Number(effect.coolingMult) !== 1) {
    return '冷却增益';
  }
  if (Number(effect.damageDealtMult) !== 1) {
    return '攻击增益';
  }
  if (Number(effect.hitProbabilityMult) !== 1) {
    return '命中修正';
  }
  return '规则状态';
}

function inferEffectTone(effect, badges) {
  if (badges.length > 1) {
    return 'mixed';
  }
  if (Number(effect.damageTakenMult) < 1) {
    return 'defense';
  }
  if (Number(effect.damageTakenMult) > 1) {
    return 'vulnerability';
  }
  if (Number(effect.coolingMult) !== 1) {
    return 'cooling';
  }
  if (Number(effect.damageDealtMult) > 1) {
    return 'attack';
  }
  if (Number(effect.damageDealtMult) < 1 || Number(effect.hitProbabilityMult) < 1) {
    return 'penalty';
  }
  return 'neutral';
}

function getEffectByKey(effectKey) {
  return EFFECTS.find((effect) => effect.key === effectKey) || null;
}

function isEffectAvailable(effect, side, ownerKey) {
  if (!effect) {
    return false;
  }
  if (side === 'attacker') {
    return effect.showOnAttacker && effect.attackerRoles.includes(ownerKey);
  }
  return effect.showOnTarget && effect.targetUnits.includes(ownerKey);
}

function getTimelineBounds(durationSec, schedules = []) {
  const extensionSec = (Array.isArray(schedules) ? schedules : []).reduce((currentMax, schedule) => {
    const fixedDurationSec = Math.max(0, toNumber(schedule && schedule.fixedDurationSec, 0));
    const scheduleSpan = Math.max(0, toNumber(schedule && schedule.endSec, 0) - toNumber(schedule && schedule.startSec, 0));
    return Math.max(currentMax, fixedDurationSec, scheduleSpan);
  }, 0);
  return {
    min: extensionSec > 0 ? -extensionSec : 0,
    max: durationSec + extensionSec,
  };
}

function buildTimelineSegmentMetrics(startSec, endSec, simulationEndSec) {
  const totalDurationSec = Math.max(0.1, endSec - startSec);
  const preSimDurationSec = Math.max(0, Math.min(endSec, 0) - startSec);
  const simDurationSec = Math.max(0, Math.min(endSec, simulationEndSec) - Math.max(startSec, 0));
  const postSimDurationSec = Math.max(0, endSec - Math.max(startSec, simulationEndSec));
  const preSimPercent = Number((preSimDurationSec / totalDurationSec * 100).toFixed(3));
  const simPercent = Number((simDurationSec / totalDurationSec * 100).toFixed(3));
  const postSimPercent = Number((postSimDurationSec / totalDurationSec * 100).toFixed(3));
  const simOffsetPercent = preSimPercent;
  const postSimOffsetPercent = Number((preSimPercent + simPercent).toFixed(3));
  return {
    totalDurationSec,
    preSimDurationSec: Number(preSimDurationSec.toFixed(1)),
    simDurationSec: Number(simDurationSec.toFixed(1)),
    postSimDurationSec: Number(postSimDurationSec.toFixed(1)),
    preSimPercent,
    simPercent,
    postSimPercent,
    simOffsetPercent,
    postSimOffsetPercent,
    hasPreSimSegment: preSimDurationSec > 0,
    hasPostSimSegment: postSimDurationSec > 0,
  };
}

function buildRows(items, rowSize = 2) {
  const source = Array.isArray(items) ? items : [];
  const rows = [];
  for (let index = 0; index < source.length; index += rowSize) {
    rows.push(source.slice(index, index + rowSize));
  }
  return rows;
}

function formatTimelineAxisLabel(value) {
  const numeric = Number(value) || 0;
  const text = Math.abs(numeric - Math.round(numeric)) < 1e-6 ? String(Math.round(numeric)) : numeric.toFixed(1);
  return `${text}s`;
}

function getEffectVariantOptions(effect, side) {
  if (!effect || !Array.isArray(effect.variants)) {
    return [];
  }
  return effect.variants.map((variant) => {
    const durationBySide = variant.defaultDurationSecBySide && (variant.defaultDurationSecBySide[side] || variant.defaultDurationSecBySide.shared);
    return { key: variant.key, label: variant.label, durationSec: toNumber(durationBySide, toNumber(variant.defaultDurationSec, 0)) };
  });
}

function getEffectDurationOptions(effect, side) {
  if (!effect || !Array.isArray(effect.durationOptions)) {
    return [];
  }
  return effect.durationOptions.map((option) => {
    const durationBySide = option.durationSecBySide && (option.durationSecBySide[side] || option.durationSecBySide.shared);
    return {
      key: option.key,
      label: option.label,
      durationSec: toNumber(durationBySide, toNumber(option.durationSec, 0)),
    };
  });
}

function resolveEffectDuration(effect, schedule, side, variantMeta) {
  const durationOptions = getEffectDurationOptions(effect, side);
  if (durationOptions.length) {
    const defaultKey = effect.defaultDurationKey || durationOptions[0].key;
    const durationMeta = durationOptions.find((item) => item.key === (schedule && schedule.durationKey))
      || durationOptions.find((item) => item.key === defaultKey)
      || durationOptions[0];
    return {
      durationKey: durationMeta.key,
      durationLabel: durationMeta.label,
      fixedDurationSec: toNumber(durationMeta.durationSec, 0),
    };
  }

  if (variantMeta) {
    return {
      durationKey: '',
      durationLabel: '',
      fixedDurationSec: toNumber(variantMeta.durationSec, 0),
    };
  }

  return {
    durationKey: '',
    durationLabel: '',
    fixedDurationSec: toNumber(
      schedule && schedule.fixedDurationSec,
      toNumber(effect && effect.defaultDurationSec, 0),
    ),
  };
}

function resolveScheduledEffect(effect, schedule, side) {
  if (!effect) {
    return null;
  }
  const variants = getEffectVariantOptions(effect, side);
  if (!variants.length) {
    const durationMeta = resolveEffectDuration(effect, schedule, side, null);
    return Object.assign({}, effect, {
      variantKey: '',
      variantLabel: '',
      durationKey: durationMeta.durationKey,
      durationLabel: durationMeta.durationLabel,
      displayLabel: effect.label,
      fixedDurationSec: durationMeta.fixedDurationSec,
    });
  }
  const variantMeta = variants.find((item) => item.key === schedule.variantKey) || variants[0];
  const variant = effect.variants.find((item) => item.key === variantMeta.key) || effect.variants[0];
  const sideOverrides = variant.sideOverrides && variant.sideOverrides[side] ? variant.sideOverrides[side] : null;
  const durationMeta = resolveEffectDuration(effect, schedule, side, variantMeta);
  return Object.assign({}, effect, variant, sideOverrides || {}, {
    variantKey: variantMeta.key,
    variantLabel: variantMeta.label,
    durationKey: durationMeta.durationKey,
    durationLabel: durationMeta.durationLabel,
    displayLabel: `${effect.label}·${variant.label}`,
    description: variant.description || effect.description,
    fixedDurationSec: durationMeta.fixedDurationSec,
  });
}

function getDefaultScheduleEnd(resolvedEffect, durationSec, startSec) {
  const fixedDuration = toNumber(resolvedEffect && resolvedEffect.fixedDurationSec, durationSec);
  const rawEndSec = startSec + (fixedDuration > 0 ? fixedDuration : durationSec);
  const bounds = getTimelineBounds(durationSec, [{
    startSec,
    endSec: rawEndSec,
    fixedDurationSec: fixedDuration,
  }]);
  return clamp(rawEndSec, bounds.min, bounds.max);
}

function normalizeSchedules(scheduleValues, effectKeys, side, ownerKey, durationSec) {
  const source = Array.isArray(scheduleValues) ? scheduleValues : [];
  const existingMap = new Map(source.filter((item) => item && item.effectKey).map((item) => [item.effectKey, item]));
  const bounds = getTimelineBounds(durationSec, source);
  return effectKeys
    .map((effectKey) => getEffectByKey(effectKey))
    .filter((effect) => isEffectAvailable(effect, side, ownerKey))
    .map((effect) => {
      const existing = existingMap.get(effect.key) || {};
      const resolvedEffect = resolveScheduledEffect(effect, existing, side);
      const fixedDurationSec = toNumber(resolvedEffect.fixedDurationSec, 0);
      const minStartSec = fixedDurationSec > 0 ? -fixedDurationSec : 0;
      const maxStartSec = fixedDurationSec > 0 ? bounds.max - fixedDurationSec : bounds.max;
      const startSec = clamp(toNumber(existing.startSec, 0), minStartSec, maxStartSec);
      const endFallback = getDefaultScheduleEnd(resolvedEffect, durationSec, startSec);
      const endSec = fixedDurationSec > 0
        ? Number((startSec + fixedDurationSec).toFixed(1))
        : clamp(toNumber(existing.endSec, endFallback), bounds.min, bounds.max);
      return {
        effectKey: effect.key,
        variantKey: resolvedEffect.variantKey,
        durationKey: resolvedEffect.durationKey,
        startSec: Number(startSec.toFixed(1)),
        endSec: Number(endSec.toFixed(1)),
        fixedDurationSec: Number(fixedDurationSec.toFixed(1)),
      };
    });
}

function buildScheduleMap(schedules) {
  return new Map((Array.isArray(schedules) ? schedules : []).map((item) => [item.effectKey, item]));
}

function buildTimelineTracks(schedules, side, durationSec) {
  const bounds = getTimelineBounds(durationSec, schedules);
  const totalSpan = Math.max(1, bounds.max - bounds.min);
  return (Array.isArray(schedules) ? schedules : []).map((schedule) => {
    const effect = getEffectByKey(schedule.effectKey);
    const resolvedEffect = resolveScheduledEffect(effect, schedule, side);
    const badges = buildEffectBadges(resolvedEffect);
    const variantOptions = getEffectVariantOptions(effect, side);
    const durationOptions = getEffectDurationOptions(effect, side);
    const startPercent = (schedule.startSec - bounds.min) / totalSpan * 100;
    const endPercent = (schedule.endSec - bounds.min) / totalSpan * 100;
    const segmentMetrics = buildTimelineSegmentMetrics(schedule.startSec, schedule.endSec, durationSec);
    return {
      effectKey: schedule.effectKey,
      label: effect.label,
      displayLabel: resolvedEffect.displayLabel,
      description: resolvedEffect.description,
      category: inferEffectCategory(resolvedEffect, badges),
      tone: inferEffectTone(resolvedEffect, badges),
      badges,
      variantKey: resolvedEffect.variantKey,
      variantLabel: resolvedEffect.variantLabel,
      hasVariants: variantOptions.length > 0,
      variantOptions,
      variantIndex: pickOptionIndex(variantOptions, resolvedEffect.variantKey),
      durationKey: resolvedEffect.durationKey,
      durationLabel: resolvedEffect.durationLabel,
      hasDurationOptions: durationOptions.length > 0,
      durationOptions,
      durationIndex: pickOptionIndex(durationOptions, resolvedEffect.durationKey),
      startSec: schedule.startSec,
      endSec: schedule.endSec,
      fixedDurationSec: toNumber(resolvedEffect.fixedDurationSec, 0),
      durationSec: Number((schedule.endSec - schedule.startSec).toFixed(1)),
      timelineMin: bounds.min,
      timelineMax: bounds.max,
      startPercent,
      endPercent,
      spanPercent: Math.max(1.5, endPercent - startPercent),
      preSimDurationSec: segmentMetrics.preSimDurationSec,
      simDurationSec: segmentMetrics.simDurationSec,
      postSimDurationSec: segmentMetrics.postSimDurationSec,
      preSimPercent: segmentMetrics.preSimPercent,
      simPercent: segmentMetrics.simPercent,
      postSimPercent: segmentMetrics.postSimPercent,
      simOffsetPercent: segmentMetrics.simOffsetPercent,
      postSimOffsetPercent: segmentMetrics.postSimOffsetPercent,
      hasPreSimSegment: segmentMetrics.hasPreSimSegment,
      hasPostSimSegment: segmentMetrics.hasPostSimSegment,
      timingText: `${schedule.startSec.toFixed(1)}s - ${schedule.endSec.toFixed(1)}s`,
      side,
    };
  });
}

function applyTimelineBounds(tracks, bounds) {
  const source = Array.isArray(tracks) ? tracks : [];
  const totalSpan = Math.max(1, bounds.max - bounds.min);
  return source.map((track) => {
    const startPercent = (track.startSec - bounds.min) / totalSpan * 100;
    const endPercent = (track.endSec - bounds.min) / totalSpan * 100;
    return Object.assign({}, track, {
      timelineMin: bounds.min,
      timelineMax: bounds.max,
      startPercent,
      endPercent,
      spanPercent: Math.max(1.5, endPercent - startPercent),
    });
  });
}

function getActiveTracks(tracks, currentTime) {
  return tracks.filter((track) => currentTime + 1e-9 >= track.startSec && currentTime <= track.endSec + 1e-9);
}

function resolveEffectMultipliers(attackerEffects, targetEffects) {
  const attackerList = Array.isArray(attackerEffects) ? attackerEffects : [];
  const targetList = Array.isArray(targetEffects) ? targetEffects : [];
  const attackBonusPct = attackerList.reduce((current, effect) => Math.max(current, positiveEffectPct(effect.damageDealtMult)), 0);
  const attackPenaltyPct = attackerList.reduce((current, effect) => Math.max(current, negativeEffectPct(effect.damageDealtMult)), 0);
  const hitBonusPct = attackerList.reduce((current, effect) => Math.max(current, positiveEffectPct(effect.hitProbabilityMult)), 0);
  const hitPenaltyPct = attackerList.reduce((current, effect) => Math.max(current, negativeEffectPct(effect.hitProbabilityMult)), 0);
  const coolingBonusPct = attackerList.reduce((current, effect) => Math.max(current, positiveEffectPct(effect.coolingMult)), 0);
  const coolingPenaltyPct = attackerList.reduce((current, effect) => Math.max(current, negativeEffectPct(effect.coolingMult)), 0);
  const defenseBonusPct = targetList.reduce((current, effect) => Math.max(current, negativeEffectPct(effect.damageTakenMult)), 0);
  const vulnerabilityBonusPct = targetList.reduce((current, effect) => Math.max(current, positiveEffectPct(effect.damageTakenMult)), 0);
  return {
    damageDealtMult: Math.max(0, 1 + attackBonusPct - attackPenaltyPct),
    hitProbabilityMult: Math.max(0, 1 + hitBonusPct - hitPenaltyPct),
    damageTakenMult: Math.max(0, 1 - defenseBonusPct + vulnerabilityBonusPct),
    coolingMultiplier: Math.max(0, 1 + coolingBonusPct - coolingPenaltyPct),
  };
}

function downsampleSeries(timeAxis, seriesCollection) {
  if (timeAxis.length <= CHART_MAX_POINTS) {
    return {
      timeSec: timeAxis.map((item) => Number(item.toFixed(2))),
      series: seriesCollection.map((series) => ({ key: series.key, label: series.label, color: series.color, values: series.values.map((item) => Number(item.toFixed(2))) })),
    };
  }
  const indices = [];
  for (let step = 0; step < CHART_MAX_POINTS; step += 1) {
    indices.push(Math.round(step * (timeAxis.length - 1) / (CHART_MAX_POINTS - 1)));
  }
  return {
    timeSec: indices.map((index) => Number(timeAxis[index].toFixed(2))),
    series: seriesCollection.map((series) => ({ key: series.key, label: series.label, color: series.color, values: indices.map((index) => Number(series.values[index].toFixed(2))) })),
  };
}

function buildRateCurve(totalDamageCurve, dt) {
  const windowSteps = Math.max(1, Math.round(1 / dt));
  return totalDamageCurve.map((value, index) => {
    const previousIndex = Math.max(0, index - windowSteps);
    const deltaDamage = value - totalDamageCurve[previousIndex];
    const deltaTime = Math.max(dt, (index - previousIndex) * dt);
    return deltaDamage / deltaTime;
  });
}

function resolveAttacker(form) {
  const roleKey = ATTACKER_CATALOG[form.attackerRole] ? form.attackerRole : DEFAULT_FORM.attackerRole;
  const roleConfig = ATTACKER_CATALOG[roleKey];
  const profileOptions = getProfileOptions(roleConfig);
  const postureOptions = getPostureOptions(roleConfig);
  const profileKey = roleConfig.showProfileSelector ? (roleConfig.profiles[form.attackerProfile] ? form.attackerProfile : roleConfig.defaultProfile) : '';
  const level = roleConfig.showLevelSelector ? clamp(toNumber(form.attackerLevel, roleConfig.defaultLevel || 1), 1, 10) : 1;
  const postureKey = roleConfig.showPostureSelector ? (roleConfig.postures[form.attackerPosture] ? form.attackerPosture : roleConfig.defaultPosture) : '';
  let resolved;
  if (roleKey === 'drone') {
    resolved = roleConfig.resolve(level);
  } else if (roleConfig.showPostureSelector) {
    resolved = roleConfig.postures[postureKey].resolve(level);
  } else {
    resolved = roleConfig.profiles[profileKey].resolve(level);
  }
  return {
    roleKey,
    roleLabel: ROLE_LABELS[roleKey],
    showProfileSelector: roleConfig.showProfileSelector === true,
    showLevelSelector: roleConfig.showLevelSelector !== false,
    showPostureSelector: roleConfig.showPostureSelector === true,
    profileOptions,
    postureOptions,
    profileKey,
    level,
    postureKey,
    profileLabel: profileKey && roleConfig.profiles ? roleConfig.profiles[profileKey].label : '',
    postureLabel: postureKey && roleConfig.postures ? roleConfig.postures[postureKey].label : '',
    resolved,
  };
}

function resolveTarget(form) {
  const roleKey = TARGET_CATALOG[form.targetRole] ? form.targetRole : DEFAULT_FORM.targetRole;
  const roleConfig = TARGET_CATALOG[roleKey];
  const profileOptions = getProfileOptions(roleConfig);
  const postureOptions = getPostureOptions(roleConfig);
  const profileKey = roleConfig.showProfileSelector ? (roleConfig.profiles[form.targetProfile] ? form.targetProfile : roleConfig.defaultProfile) : '';
  const level = roleConfig.showLevelSelector ? clamp(toNumber(form.targetLevel, roleConfig.defaultLevel || 1), 1, 10) : 1;
  const postureKey = roleConfig.showPostureSelector ? (roleConfig.postures[form.targetPosture] ? form.targetPosture : roleConfig.defaultPosture) : '';
  let resolved;
  if (roleConfig.showPostureSelector) {
    resolved = roleConfig.postures[postureKey].resolve(level);
  } else if (roleConfig.showProfileSelector) {
    resolved = roleConfig.profiles[profileKey].resolve(level);
  } else {
    resolved = roleConfig.resolve(level);
  }
  if (roleKey === 'outpost') {
    resolved = Object.assign({}, resolved, {
      note: buildOutpostWindowNote(normalizeOutpostWindowDegrees(form.targetWindowDegrees, form.attackerRole)),
    });
  }
  return {
    roleKey,
    roleLabel: TARGET_LABELS[roleKey],
    showProfileSelector: roleConfig.showProfileSelector === true,
    showLevelSelector: roleConfig.showLevelSelector !== false,
    showPostureSelector: roleConfig.showPostureSelector === true,
    profileOptions,
    postureOptions,
    profileKey,
    level,
    postureKey,
    profileLabel: profileKey && roleConfig.profiles ? roleConfig.profiles[profileKey].label : '',
    postureLabel: postureKey && roleConfig.postures ? roleConfig.postures[postureKey].label : '',
    resolved,
  };
}

function selectEffects(effectKeys, side, ownerKey) {
  return EFFECTS.filter((effect) => effectKeys.includes(effect.key)).filter((effect) => {
    if (side === 'attacker') {
      return effect.showOnAttacker && effect.attackerRoles.includes(ownerKey);
    }
    return effect.showOnTarget && effect.targetUnits.includes(ownerKey);
  });
}

function buildEffectOptions(effectKeys, schedules, side, ownerKey, durationSec) {
  const scheduleMap = buildScheduleMap(schedules);
  return EFFECTS.filter((effect) => {
    if (side === 'attacker') {
      return effect.showOnAttacker && effect.attackerRoles.includes(ownerKey);
    }
    return effect.showOnTarget && effect.targetUnits.includes(ownerKey);
  }).map((effect) => {
    const schedule = scheduleMap.get(effect.key) || { effectKey: effect.key };
    const resolvedEffect = resolveScheduledEffect(effect, schedule, side);
    const badges = buildEffectBadges(resolvedEffect);
    const variantOptions = getEffectVariantOptions(effect, side);
    const durationOptions = getEffectDurationOptions(effect, side);
    return {
      key: effect.key,
      label: effect.label,
      description: resolvedEffect.description,
      badges,
      category: inferEffectCategory(resolvedEffect, badges),
      tone: inferEffectTone(resolvedEffect, badges),
      hasVariants: variantOptions.length > 0,
      variantOptions,
      variantIndex: pickOptionIndex(variantOptions, resolvedEffect.variantKey),
      variantLabel: scheduleMap.has(effect.key) ? resolvedEffect.variantLabel : '',
      hasDurationOptions: durationOptions.length > 0,
      durationOptions,
      durationIndex: pickOptionIndex(durationOptions, resolvedEffect.durationKey),
      durationLabel: scheduleMap.has(effect.key) ? resolvedEffect.durationLabel : '',
      timingText: scheduleMap.has(effect.key) ? `${schedule.startSec.toFixed(1)}s - ${schedule.endSec.toFixed(1)}s` : '',
      active: effectKeys.includes(effect.key),
    };
  });
}

function normalizeForm(form = {}) {
  const draft = Object.assign({}, DEFAULT_FORM, form);
  draft.durationSec = clamp(toNumber(draft.durationSec, DEFAULT_FORM.durationSec), 15, 240);
  draft.requestedFireRateHz = clamp(toNumber(draft.requestedFireRateHz, DEFAULT_FORM.requestedFireRateHz), 0, 30);
  draft.initialHeat = clamp(toNumber(draft.initialHeat, DEFAULT_FORM.initialHeat), 0, 500);
  draft.targetHealthPercent = clamp(toNumber(draft.targetHealthPercent, DEFAULT_FORM.targetHealthPercent), 0, 100);
  draft.hitRatePercent = clamp(toNumber(draft.hitRatePercent, DEFAULT_FORM.hitRatePercent), 0, 100);
  draft.targetWindowDegrees = normalizeOutpostWindowDegrees(draft.targetWindowDegrees, draft.attackerRole);
  draft.attackerEffects = dedupeArray(draft.attackerEffects);
  draft.targetEffects = dedupeArray(draft.targetEffects);

  const attacker = resolveAttacker(draft);
  draft.attackerRole = attacker.roleKey;
  draft.attackerProfile = attacker.profileKey;
  draft.attackerLevel = attacker.level;
  draft.attackerPosture = attacker.postureKey || POSTURE_KEY_MOBILE;

  const target = resolveTarget(draft);
  draft.targetRole = target.roleKey;
  draft.targetProfile = target.profileKey;
  draft.targetLevel = target.level;
  draft.targetPosture = target.postureKey || POSTURE_KEY_MOBILE;

  const targetPart = resolveTargetPart(draft.targetRole, draft.targetPart, draft.targetWindowDegrees);
  draft.targetPart = targetPart.key;
  draft.attackerSchedules = normalizeSchedules(draft.attackerSchedules, draft.attackerEffects, 'attacker', draft.attackerRole, draft.durationSec);
  draft.targetSchedules = normalizeSchedules(draft.targetSchedules, draft.targetEffects, 'target', draft.targetRole, draft.durationSec);
  return draft;
}

function analyzeDamageLab(form = {}) {
  const inputs = normalizeForm(form);
  const attacker = resolveAttacker(inputs);
  const target = resolveTarget(inputs);
  const targetPart = resolveTargetPart(inputs.targetRole, inputs.targetPart, inputs.targetWindowDegrees);
  const baseDamage = attacker.resolved.ammoType === '42mm' ? targetPart.damageScale42mm : targetPart.damageScale17mm;
  const currentTargetHealth = target.resolved.maxHealth * inputs.targetHealthPercent / 100;
  const dt = inputs.durationSec <= 600 ? 0.01 : 0.02;
  const totalSteps = Math.floor(inputs.durationSec / dt + 0.5) + 1;
  const shotInterval = inputs.requestedFireRateHz <= 1e-9 ? Number.POSITIVE_INFINITY : 1 / inputs.requestedFireRateHz;

  const attackerTracks = inputs.attackerSchedules.map((schedule) => ({
    startSec: schedule.startSec,
    endSec: schedule.endSec,
    effect: resolveScheduledEffect(getEffectByKey(schedule.effectKey), schedule, 'attacker'),
  }));
  const targetTracks = inputs.targetSchedules.map((schedule) => ({
    startSec: schedule.startSec,
    endSec: schedule.endSec,
    effect: resolveScheduledEffect(getEffectByKey(schedule.effectKey), schedule, 'target'),
  }));

  const timeAxis = new Array(totalSteps);
  const totalDamageCurve = new Array(totalSteps).fill(0);
  const receivedDamageCurve = new Array(totalSteps).fill(0);
  const targetHealthCurve = new Array(totalSteps).fill(0);
  const heatCurve = new Array(totalSteps).fill(0);
  const shotsCurve = new Array(totalSteps).fill(0);

  let heat = clamp(inputs.initialHeat, 0, attacker.resolved.maxHeat);
  let totalDamage = 0;
  let totalReceivedDamage = 0;
  let totalShots = 0;
  let peakHeat = heat;
  let peakSingleShotDamage = 0;
  let peakCoolingRate = attacker.resolved.coolingRate;
  let lastReceiveRatio = clamp(inputs.hitRatePercent / 100 * targetPart.receiveRatio, 0, 1);
  let lastCoolingRate = attacker.resolved.coolingRate;
  let nextShotTime = shotInterval === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : 0;
  let nextCoolingTickTime = 0.1;

  for (let index = 0; index < totalSteps; index += 1) {
    const currentTime = index * dt;
    timeAxis[index] = currentTime;
    const activeAttackerEffects = getActiveTracks(attackerTracks, currentTime).map((track) => track.effect);
    const activeTargetEffects = getActiveTracks(targetTracks, currentTime).map((track) => track.effect);
    const attackerPostureEffect = attacker.roleKey === 'sentry'
      ? getSentryPostureEffects(attacker.postureKey, 'attacker', currentTime)
      : null;
    const targetPostureEffect = target.roleKey === 'sentry'
      ? getSentryPostureEffects(target.postureKey, 'target', currentTime)
      : null;
    if (attackerPostureEffect) {
      activeAttackerEffects.push(attackerPostureEffect);
    }
    if (targetPostureEffect) {
      activeTargetEffects.push(targetPostureEffect);
    }
    const modifiers = resolveEffectMultipliers(activeAttackerEffects, activeTargetEffects);
    const effectiveCoolingRate = attacker.resolved.coolingRate * modifiers.coolingMultiplier;
    const effectiveReceiveRatio = clamp(inputs.hitRatePercent / 100 * targetPart.receiveRatio * modifiers.hitProbabilityMult, 0, 1);
    const singleShotDamageNow = baseDamage * modifiers.damageDealtMult * modifiers.damageTakenMult;
    peakCoolingRate = Math.max(peakCoolingRate, effectiveCoolingRate);
    peakSingleShotDamage = Math.max(peakSingleShotDamage, singleShotDamageNow);
    lastReceiveRatio = effectiveReceiveRatio;
    lastCoolingRate = effectiveCoolingRate;
    while (nextShotTime <= currentTime + 1e-9) {
      if (heat + attacker.resolved.heatPerShot <= attacker.resolved.maxHeat + 1e-9) {
        totalShots += 1;
        totalDamage += singleShotDamageNow;
        totalReceivedDamage += singleShotDamageNow * effectiveReceiveRatio;
        heat += attacker.resolved.heatPerShot;
        peakHeat = Math.max(peakHeat, heat);
      }
      nextShotTime += shotInterval;
    }
    while (nextCoolingTickTime <= currentTime + 1e-9) {
      heat = Math.max(0, heat - effectiveCoolingRate / 10);
      nextCoolingTickTime += 0.1;
    }
    totalDamageCurve[index] = totalDamage;
    receivedDamageCurve[index] = totalReceivedDamage;
    targetHealthCurve[index] = Math.max(0, currentTargetHealth - totalReceivedDamage);
    heatCurve[index] = heat;
    shotsCurve[index] = totalShots;
  }

  const dpsCurve = buildRateCurve(totalDamageCurve, dt);
  const dpmCurve = dpsCurve.map((value) => value * 60);
  const avgDps = totalDamageCurve[totalSteps - 1] / Math.max(inputs.durationSec, 1e-9);
  const avgReceivedDps = receivedDamageCurve[totalSteps - 1] / Math.max(inputs.durationSec, 1e-9);
  const peakDps = dpsCurve.reduce((current, item) => Math.max(current, item), 0);
  const actualFireRateHz = totalShots / Math.max(inputs.durationSec, 1e-9);

  let ttkSec = null;
  for (let index = 0; index < targetHealthCurve.length; index += 1) {
    if (targetHealthCurve[index] <= 1e-9) {
      ttkSec = timeAxis[index];
      break;
    }
  }

  const outputChart = downsampleSeries(timeAxis, [
    { key: 'dps', label: 'DPS', color: '#d5543f', values: dpsCurve },
    { key: 'dpm', label: 'DPM', color: '#2563eb', values: dpmCurve },
    { key: 'totalDamage', label: '总伤害', color: '#f59f00', values: totalDamageCurve },
  ]);
  const heatChart = downsampleSeries(timeAxis, [
    { key: 'heat', label: '热量', color: '#7c3aed', values: heatCurve },
    { key: 'shots', label: '累计发弹', color: '#0f9d77', values: shotsCurve },
  ]);
  const targetChart = downsampleSeries(timeAxis, [
    { key: 'receivedDamage', label: '累计受击', color: '#ef4444', values: receivedDamageCurve },
    { key: 'targetHealth', label: '敌方血量', color: '#16a34a', values: targetHealthCurve },
  ]);

  const attackerConfigText = [attacker.profileLabel, attacker.level ? `Lv.${attacker.level}` : '', attacker.postureLabel].filter(Boolean).join(' · ');
  const targetConfigText = [target.profileLabel, target.level ? `Lv.${target.level}` : '', target.postureLabel].filter(Boolean).join(' · ');
  const attackerTimelineTracks = buildTimelineTracks(inputs.attackerSchedules, 'attacker', inputs.durationSec);
  const targetTimelineTracks = buildTimelineTracks(inputs.targetSchedules, 'target', inputs.durationSec);
  const noteLines = [SAFE_MODEL_NOTE, STACKING_NOTE];
  if (inputs.targetRole === 'outpost') { noteLines.push(buildOutpostWindowNote(inputs.targetWindowDegrees)); }
  if (inputs.targetRole === 'base' && inputs.targetPart === 'shield_closed') { noteLines.push('基地护甲未展开时按不可受击处理 '); }
  if (inputs.attackerRole === 'sentry' || inputs.targetRole === 'sentry') { noteLines.push('哨兵姿态按 180 秒连续持续时间做默认/衰减分段：进攻姿态冷却由 3 倍降至 2 倍，防御姿态防御由 50% 衰减至 25% '); }
  if (attackerTimelineTracks.length) { noteLines.push(`攻击轨道 ${attackerTimelineTracks.map((item) => `${item.displayLabel} ${item.timingText}`).join('；')}`); }
  if (targetTimelineTracks.length) { noteLines.push(`受击轨道 ${targetTimelineTracks.map((item) => `${item.displayLabel} ${item.timingText}`).join('；')}`); }
  const summaryHighlights = [
    { label: '总出伤', value: totalDamageCurve[totalSteps - 1].toFixed(2), tone: 'attack' },
    { label: '折算受击总量', value: receivedDamageCurve[totalSteps - 1].toFixed(2), tone: 'vulnerability' },
    { label: '峰值单发', value: peakSingleShotDamage.toFixed(2), tone: 'cooling' },
    { label: '等效频率', value: `${actualFireRateHz.toFixed(2)} Hz`, tone: 'defense' },
    { label: '热量峰值', value: peakHeat.toFixed(1), tone: 'mixed' },
    { label: '归零结果', value: ttkSec === null ? '未归零' : `${ttkSec.toFixed(2)} 秒`, tone: ttkSec === null ? 'neutral' : 'attack' },
  ];
  const taunt = buildAnalysisTaunt({
    inputs,
    attacker,
    target,
    targetPart,
    ttkSec,
    totalDamage: totalDamageCurve[totalSteps - 1],
    peakHeat,
    totalShots,
    lastReceiveRatio,
  });

  return {
    inputs,
    attacker,
    target,
    targetPart,
    cards: [
      { label: '平均 DPS', value: avgDps.toFixed(2) },
      { label: '受击 DPS', value: avgReceivedDps.toFixed(2) },
      { label: '峰值 DPS', value: peakDps.toFixed(2) },
      { label: '累计发弹', value: String(totalShots) },
      { label: '冷却峰值', value: `${peakCoolingRate.toFixed(2)}/s` },
      { label: '当前受击折算', value: `${(lastReceiveRatio * 100).toFixed(2)}%` },
    ],
    summaryLines: [
      `${attacker.roleLabel}${attackerConfigText ? ` · ${attackerConfigText}` : ''} · ${attacker.resolved.ammoType}`,
      `${target.roleLabel}${targetConfigText ? ` · ${targetConfigText}` : ''} · ${targetPart.label}${inputs.targetRole === 'outpost' ? ` · 窗口 ${inputs.targetWindowDegrees.toFixed(0)}°` : ''}`,
    ],
    summaryHighlights,
    taunt,
    noteLines,
    attackerEffectOptions: buildEffectOptions(inputs.attackerEffects, inputs.attackerSchedules, 'attacker', inputs.attackerRole, inputs.durationSec),
    targetEffectOptions: buildEffectOptions(inputs.targetEffects, inputs.targetSchedules, 'target', inputs.targetRole, inputs.durationSec),
    attackerTimelineTracks,
    targetTimelineTracks,
    resolved: {
      attackerText: `${attacker.roleLabel}${attackerConfigText ? ` · ${attackerConfigText}` : ''}`,
      targetText: `${target.roleLabel}${targetConfigText ? ` · ${targetConfigText}` : ''}`,
      currentTargetHealth: currentTargetHealth.toFixed(1),
      maxTargetHealth: target.resolved.maxHealth.toFixed(1),
      targetPartText: targetPart.label,
      outpostWindowDegreesText: `${inputs.targetWindowDegrees.toFixed(0)}°`,
      outpostWindowRatioText: `${(targetPart.receiveRatio * 100).toFixed(2)}%`,
      receiveRatioText: `${(lastReceiveRatio * 100).toFixed(2)}%`,
      coolingRateText: `${lastCoolingRate.toFixed(2)}/s`,
    },
    charts: {
      output: { title: '输出组合图', subtitle: 'DPS / DPM / 总伤害', unitHint: 'DPS / DPM / 总伤害', timeSec: outputChart.timeSec, series: outputChart.series },
      thermal: { title: '热量与发弹', subtitle: `热量峰值 ${peakHeat.toFixed(1)} / 累计发弹 ${totalShots}`, unitHint: '热量 / 发弹量', timeSec: heatChart.timeSec, series: heatChart.series },
      target: { title: '累计受击与敌方血量', subtitle: ttkSec === null ? '当前时长内未归零' : `${ttkSec.toFixed(2)} 秒归零`, unitHint: '受击量 / 剩余血量', timeSec: targetChart.timeSec, series: targetChart.series },
    },
  };
}

function buildPageState(form = {}) {
  const analysis = analyzeDamageLab(form);
  const inputs = analysis.inputs;
  const targetPartOptions = getTargetPartOptions(inputs.targetRole);
  const combinedSchedules = [].concat(inputs.attackerSchedules || [], inputs.targetSchedules || []);
  const timelineBounds = getTimelineBounds(inputs.durationSec, combinedSchedules);
  const timelineSpan = Math.max(1, timelineBounds.max - timelineBounds.min);
  const attackerTimelineTracks = applyTimelineBounds(analysis.attackerTimelineTracks, timelineBounds);
  const targetTimelineTracks = applyTimelineBounds(analysis.targetTimelineTracks, timelineBounds);
  return {
    form: inputs,
    analysis,
    attackerRoleOptions: ATTACKER_ROLE_OPTIONS,
    attackerRoleIndex: pickOptionIndex(ATTACKER_ROLE_OPTIONS, inputs.attackerRole),
    attackerProfileOptions: analysis.attacker.profileOptions,
    attackerProfileIndex: pickOptionIndex(analysis.attacker.profileOptions, inputs.attackerProfile),
    attackerLevelOptions: LEVEL_OPTIONS,
    attackerLevelIndex: pickOptionIndex(LEVEL_OPTIONS, String(inputs.attackerLevel)),
    attackerPostureOptions: analysis.attacker.postureOptions,
    attackerPostureIndex: pickOptionIndex(analysis.attacker.postureOptions, inputs.attackerPosture),
    showAttackerProfile: analysis.attacker.showProfileSelector,
    showAttackerLevel: analysis.attacker.showLevelSelector,
    showAttackerPosture: analysis.attacker.showPostureSelector,
    targetRoleOptions: TARGET_ROLE_OPTIONS,
    targetRoleIndex: pickOptionIndex(TARGET_ROLE_OPTIONS, inputs.targetRole),
    targetProfileOptions: analysis.target.profileOptions,
    targetProfileIndex: pickOptionIndex(analysis.target.profileOptions, inputs.targetProfile),
    targetLevelOptions: LEVEL_OPTIONS,
    targetLevelIndex: pickOptionIndex(LEVEL_OPTIONS, String(inputs.targetLevel)),
    targetPostureOptions: analysis.target.postureOptions,
    targetPostureIndex: pickOptionIndex(analysis.target.postureOptions, inputs.targetPosture),
    targetPartOptions,
    targetPartIndex: pickOptionIndex(targetPartOptions, inputs.targetPart),
    showOutpostWindowControl: inputs.targetRole === 'outpost',
    showTargetProfile: analysis.target.showProfileSelector,
    showTargetLevel: analysis.target.showLevelSelector,
    showTargetPosture: analysis.target.showPostureSelector,
    attackerTimelineTracks,
    targetTimelineTracks,
    timelineRangeMin: timelineBounds.min,
    timelineRangeMax: timelineBounds.max,
    timelineRangeStartLabel: formatTimelineAxisLabel(timelineBounds.min),
    timelineRangeEndLabel: formatTimelineAxisLabel(timelineBounds.max),
    simulationStartPercent: (0 - timelineBounds.min) / timelineSpan * 100,
    simulationSpanPercent: inputs.durationSec / timelineSpan * 100,
    metricRows: buildRows(analysis.cards, 2),
    summaryHighlightRows: buildRows(analysis.summaryHighlights, 2),
    attackerEffectRows: buildRows(analysis.attackerEffectOptions, 2),
    targetEffectRows: buildRows(analysis.targetEffectOptions, 2),
  };
}

function createDefaultPageState() {
  return buildPageState(DEFAULT_FORM);
}

module.exports = {
  buildPageState,
  createDefaultPageState,
};
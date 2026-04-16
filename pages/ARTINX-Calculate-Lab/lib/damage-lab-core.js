if (!window.SAFE_MODEL_NOTE) window.SAFE_MODEL_NOTE = '增益按时间轨道生效；热量控制采用安全控频模式，仅当剩余热量允许下一发不超上限时发射 ';
if (!window.STACKING_NOTE) window.STACKING_NOTE = '同类增益按最大有效值合并 ';
if (!window.BASE_FIRE_RATE_HZ) window.BASE_FIRE_RATE_HZ = 15.0;
if (!window.CHART_MAX_POINTS) window.CHART_MAX_POINTS = 200;
if (!window.AUTO_SIM_MAX_SEC) window.AUTO_SIM_MAX_SEC = 180;

// 从全局作用域获取已定义的变量
var SAFE_MODEL_NOTE = window.SAFE_MODEL_NOTE;
var STACKING_NOTE = window.STACKING_NOTE;
var BASE_FIRE_RATE_HZ = window.BASE_FIRE_RATE_HZ;
var CHART_MAX_POINTS = window.CHART_MAX_POINTS;
var AUTO_SIM_MAX_SEC = window.AUTO_SIM_MAX_SEC;

const OUTPOST_WINDOW_MIN_DEG = 0;
const OUTPOST_WINDOW_MAX_DEG = 360;
const OUTPOST_WINDOW_STEP_DEG = 5;
const OUTPOST_ANGULAR_SPEED_RAD_PER_SEC = 0.8 * Math.PI;
const OUTPOST_ANGULAR_SPEED_DEG_PER_SEC = OUTPOST_ANGULAR_SPEED_RAD_PER_SEC * 180 / Math.PI;

const OUTPOST_WINDOW_DEFAULT_BY_ATTACKER = {
  hero: 360,
  infantry: 120,
  sentry: 120,
  drone: 120,
};

const RESULT_TAUNT_LIBRARY = {
  quick: [
    '这就是数值吗，吓哭了',
    '对手：妈妈，对面在打我；1s后：妈妈，对面把我秒了',
    '省流：动力强劲',
    '这TTK，对面买活都是浪费金币',
  ],
  clean: [
    '输出丝滑，让对面一个接着一个来排队暴毙吧',
    '每一发都精准而优雅，对面连挣扎都显得多余',
    '不吵不闹闷声虐菜，稳稳送对面底盘下电咯',
  ],
  grind: [
    '高情商：输出平滑；低情商：略显颓势',
    '伤害好刮，好歹最后应该是刮死了',
    '打这么慢，对面难道不会躲吗',
  ],
  stalled: [
    '对面的血好厚啊（doge），绝对不是自己输出不够对吧',
    '你大可以相信自己的自瞄肯定没那么弱 对吧',
    '你中那点伤害是为了最后这点体面吗',
  ],
  shielded: [
    '护甲没开就输出？对着空气打拳',
  ],
};

const RESULT_TAUNT_REACTIONS = [
  '数据说明一切'
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

const SENTRY_PROFILE_STATS = {
  auto: {
    label: '全自动',
    maxHealth: 400,
    maxHeat: 260,
    coolingRate: 30,
    chassisPower: 100,
  },
  semi: {
    label: '半自动',
    maxHealth: 200,
    maxHeat: 100,
    coolingRate: 10,
    chassisPower: 60,
  },
};

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

if (!window.ROLE_LABELS) window.ROLE_LABELS = {
  hero: '英雄',
  infantry: '步兵',
  sentry: '哨兵',
  drone: '无人机',
};

var ROLE_LABELS = window.ROLE_LABELS;

if (!window.TARGET_LABELS) window.TARGET_LABELS = {
  base: '基地',
  outpost: '前哨站',
  infantry: '步兵',
  hero: '英雄',
  sentry: '哨兵',
  engineer: '工程',
};

var TARGET_LABELS = window.TARGET_LABELS;

if (!window.TARGET_DEFAULT_HEALTH) window.TARGET_DEFAULT_HEALTH = {
  base: 2000,
  outpost: 1500,
  infantry: 200,
  hero: 150,
  sentry: 400,
  engineer: 250,
};

var TARGET_DEFAULT_HEALTH = window.TARGET_DEFAULT_HEALTH;

const TARGET_MOTION_OPTIONS = [
  { key: 'stationary', label: '静止' },
  { key: 'moving', label: '平动' },
  { key: 'spinner', label: '小陀螺' },
  { key: 'moving_spinner', label: '平动小陀螺' },
];

const TARGET_MOTION_LABELS = TARGET_MOTION_OPTIONS.reduce((acc, item) => {
  acc[item.key] = item.label;
  return acc;
}, {});

const TARGET_MOTION_HIT_FIELD_BY_KEY = {
  stationary: 'hitRateStationaryPercent',
  moving: 'hitRateMovingPercent',
  spinner: 'hitRateSpinnerPercent',
  moving_spinner: 'hitRateMovingSpinnerPercent',
};

function getTargetMotionDefaultKey(targetRole, targetPartKey) {
  if (targetRole === 'base') {
    if (targetPartKey === 'front_upper_plate') {
      return 'moving';
    }
    return 'stationary';
  }
  if (targetRole === 'outpost') {
    return 'spinner';
  }
  return 'stationary';
}

function normalizeTargetMotionKey(value, targetRole, targetPartKey) {
  const fixedRole = targetRole === 'base' || targetRole === 'outpost';
  if (fixedRole) {
    return getTargetMotionDefaultKey(targetRole, targetPartKey);
  }
  const candidate = String(value || '').trim();
  if (TARGET_MOTION_LABELS[candidate]) {
    return candidate;
  }
  return getTargetMotionDefaultKey(targetRole, targetPartKey);
}

function getTargetMotionOptionsForRole(targetRole) {
  if (targetRole === 'infantry' || targetRole === 'hero' || targetRole === 'sentry' || targetRole === 'engineer') {
    return TARGET_MOTION_OPTIONS;
  }
  return [];
}

function getHitRateFieldByTargetMotion(motionKey) {
  return TARGET_MOTION_HIT_FIELD_BY_KEY[motionKey] || TARGET_MOTION_HIT_FIELD_BY_KEY.stationary;
}

function resolveTargetHitRatePercent(inputs, targetRole, targetPartKey, targetMotionKey) {
  const motionKey = normalizeTargetMotionKey(targetMotionKey, targetRole, targetPartKey);
  const field = getHitRateFieldByTargetMotion(motionKey);
  return clamp(toNumber(inputs[field], 100), 0, 100);
}

function getTargetMotionLabel(motionKey) {
  return TARGET_MOTION_LABELS[motionKey] || TARGET_MOTION_LABELS.stationary;
}

function hashStringToUint32(input) {
  const text = String(input || '');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return function seededRandom() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

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

if (!window.TARGET_PARTS) window.TARGET_PARTS = {
  base: [
    { key: 'normal_plate', label: '普通装甲板', receiveRatio: 1, damageScale17mm: 20, damageScale42mm: 200 },
    { key: 'front_upper_plate', label: '上方装甲板', receiveRatio: 1, damageScale17mm: 5, damageScale42mm: 200 },
    { key: 'shield_closed', label: '护甲未展开', receiveRatio: 0, damageScale17mm: 0, damageScale42mm: 0 },
  ],
  outpost: [
    { key: 'central_plate', label: '中部装甲板', receiveRatio: 120 / 360, damageScale17mm: 20, damageScale42mm: 200 },
  ],
  infantry: [{ key: 'armor_plate', label: '装甲模块', receiveRatio: 1, damageScale17mm: 20, damageScale42mm: 200 }],
  hero: [{ key: 'armor_plate', label: '装甲模块', receiveRatio: 1, damageScale17mm: 20, damageScale42mm: 200 }],
  sentry: [{ key: 'armor_plate', label: '装甲模块', receiveRatio: 1, damageScale17mm: 20, damageScale42mm: 200 }],
  engineer: [{ key: 'armor_plate', label: '装甲模块', receiveRatio: 1, damageScale17mm: 20, damageScale42mm: 200 }],
};

var TARGET_PARTS = window.TARGET_PARTS;

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
  return `前哨站按 0.8π/s 转速旋转，仅在 ${Number(windowDegrees).toFixed(0)}° 窗口内可受击 `;
}

function isOutpostWindowOpenAtTime(currentTimeSec, windowDegrees) {
  const normalizedWindow = clamp(Number(windowDegrees) || 0, OUTPOST_WINDOW_MIN_DEG, OUTPOST_WINDOW_MAX_DEG);
  if (normalizedWindow <= OUTPOST_WINDOW_MIN_DEG + 1e-9) {
    return false;
  }
  if (normalizedWindow >= OUTPOST_WINDOW_MAX_DEG - 1e-9) {
    return true;
  }
  const angleDeg = ((Number(currentTimeSec) * OUTPOST_ANGULAR_SPEED_DEG_PER_SEC) % 360 + 360) % 360;
  return angleDeg <= normalizedWindow + 1e-9;
}

function pickTauntVariant(list, seed) {
  if (!Array.isArray(list) || !list.length) {
    return '';
  }
  return list[Math.abs(seed) % list.length];
}

function buildDescriptionSegments(description) {
  const source = String(description || '');
  if (!source) {
    return [];
  }
  const pattern = /([+\-]?\d+(?:\.\d+)?%?|[+\-]?\d+(?:\.\d+)?[a-zA-Z]+)/g;
  const segments = [];
  let lastIndex = 0;
  let match = pattern.exec(source);
  while (match) {
    if (match.index > lastIndex) {
      segments.push({ text: source.slice(lastIndex, match.index), isNumber: false });
    }
    segments.push({ text: match[0], isNumber: true });
    lastIndex = match.index + match[0].length;
    match = pattern.exec(source);
  }
  if (lastIndex < source.length) {
    segments.push({ text: source.slice(lastIndex), isNumber: false });
  }
  return segments;
}

function resolveTauntBucket(context) {
  const { inputs, target, ttkSec, totalDamage, totalShots, lastReceiveRatio, targetPart } = context;
  const maxTargetHealth = Math.max(1, Number(target && target.resolved && target.resolved.maxHealth) || 0);
  const damageCoverage = Number(totalDamage) / maxTargetHealth;
  const windowRatio = Math.max(0.01, Number((targetPart && targetPart.receiveRatio) || lastReceiveRatio || 1));
  const evaluatedSec = Math.max(1, Number(ttkSec === null ? inputs.durationSec : ttkSec) || 1);
  const shotDensity = Number(totalShots) / evaluatedSec;

  if (inputs.targetRole === 'base' && inputs.targetPart === 'shield_closed') {
    return 'shielded';
  }

  if (ttkSec === null) {
    if (damageCoverage >= 0.82) {
      return 'grind';
    }
    if (damageCoverage >= 0.45 || (damageCoverage >= 0.28 && windowRatio <= 0.4) || (shotDensity >= 7.5 && damageCoverage >= 0.3)) {
      return 'grind';
    }
    return 'stalled';
  }

  if (ttkSec <= 2.6 || (ttkSec <= 3.4 && damageCoverage >= 1.08)) {
    return 'quick';
  }
  if (ttkSec <= 6.5 || (ttkSec <= 8.2 && damageCoverage >= 1.25) || (shotDensity >= 9 && ttkSec <= 9.5)) {
    return 'clean';
  }
  if (ttkSec <= 12.5 || damageCoverage >= 1.35 || (windowRatio <= 0.4 && ttkSec <= 14.5)) {
    return 'grind';
  }
  return 'stalled';
}

function resolveTauntBucketCandidates(context, primaryBucket) {
  const { inputs, target, ttkSec, totalDamage, totalShots, lastReceiveRatio, targetPart } = context;
  const maxTargetHealth = Math.max(1, Number(target && target.resolved && target.resolved.maxHealth) || 0);
  const damageCoverage = Number(totalDamage) / maxTargetHealth;
  const windowRatio = Math.max(0.01, Number((targetPart && targetPart.receiveRatio) || lastReceiveRatio || 1));
  const evaluatedSec = Math.max(1, Number(ttkSec === null ? inputs.durationSec : ttkSec) || 1);
  const shotDensity = Number(totalShots) / evaluatedSec;
  const candidates = [primaryBucket];

  if (primaryBucket === 'shielded') {
    candidates.push(damageCoverage >= 0.18 ? 'stalled' : 'shielded');
    return Array.from(new Set(candidates));
  }

  if (ttkSec === null) {
    if (damageCoverage >= 0.3 || (windowRatio <= 0.4 && damageCoverage >= 0.22) || shotDensity >= 8.5) {
      candidates.push('grind');
    }
    if (damageCoverage <= 0.55) {
      candidates.push('stalled');
    }
    return Array.from(new Set(candidates));
  }

  if (ttkSec >= 2.2 && ttkSec <= 4.2) {
    candidates.push('quick', 'clean');
  }
  if (ttkSec >= 5.8 && ttkSec <= 9.5) {
    candidates.push('clean', 'grind');
  }
  if (ttkSec >= 10.5) {
    candidates.push('grind', 'stalled');
  }
  if (damageCoverage >= 1.28 && ttkSec <= 8.8) {
    candidates.push('clean');
  }
  if (windowRatio <= 0.4 && ttkSec <= 15) {
    candidates.push('grind');
  }
  return Array.from(new Set(candidates));
}

function buildTauntVariantPool(bucketKeys) {
  return bucketKeys.reduce((collection, bucketKey) => {
    const list = RESULT_TAUNT_LIBRARY[bucketKey];
    if (Array.isArray(list) && list.length) {
      return collection.concat(list);
    }
    return collection;
  }, []);
}

function buildAnalysisTaunt(context) {
  const { inputs, target, ttkSec, totalDamage, peakHeat, totalShots, lastReceiveRatio, targetPart } = context;
  const bucketKey = resolveTauntBucket(context);
  const bucketCandidates = resolveTauntBucketCandidates(context, bucketKey);
  const tauntPool = buildTauntVariantPool(bucketCandidates);

  const primarySeed = Math.round(totalDamage) + totalShots + Math.round(peakHeat) + Math.round(lastReceiveRatio * 100) + String(inputs.attackerRole).length * 11 + String(inputs.targetRole).length * 7;
  const reactionSeed = Math.round((ttkSec === null ? inputs.durationSec : ttkSec) * 10) + Math.round((target && target.resolved && target.resolved.maxHealth) || 0) + Math.round((targetPart && targetPart.receiveRatio || 0) * 1000);
  const primary = pickTauntVariant(tauntPool.length ? tauntPool : (RESULT_TAUNT_LIBRARY[bucketKey] || RESULT_TAUNT_LIBRARY.clean), primarySeed);
  const reaction = pickTauntVariant(RESULT_TAUNT_REACTIONS, reactionSeed);
  return {
    title: '',
    lines: [primary, reaction].filter(Boolean),
  };
}

if (!window.EFFECTS) window.EFFECTS = [
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
        resolve(level) {           const stats = getLeveledStats(HERO_LEVEL_STATS.melee, level);
          return { ammoType: '42mm', heatPerShot: 100, maxHealth: stats.maxHealth, maxHeat: stats.maxHeat, coolingRate: stats.coolingRate, note: '英雄攻击方支持近战/远程两种配置，42mm大弹丸每发消耗100点热量 ' };
        },
      },
      ranged: {
        label: '远程优先',
        resolve(level) {
          const stats = getLeveledStats(HERO_LEVEL_STATS.ranged, level);
          return { ammoType: '42mm', heatPerShot: 100, maxHealth: stats.maxHealth, maxHeat: stats.maxHeat, coolingRate: stats.coolingRate, note: '英雄攻击方支持近战/远程两种配置，42mm大弹丸每发消耗100点热量 ' };
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
    showProfileSelector: true,
    showLevelSelector: false,
    showPostureSelector: true,
    defaultProfile: 'auto',
    defaultPosture: POSTURE_KEY_MOBILE,
    profiles: {
      auto: { label: '全自动' },
      semi: { label: '半自动' },
    },
    postures: {
      mobile: { label: '移动姿态' },
      attack: { label: '进攻姿态' },
      defense: { label: '防御姿态' },
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
    label: '哨兵', showProfileSelector: true, showLevelSelector: false, showPostureSelector: true, defaultProfile: 'auto', defaultPosture: POSTURE_KEY_MOBILE,
    profiles: {
      auto: { label: '全自动' },
      semi: { label: '半自动' },
    },
    postures: {
      mobile: { label: '移动姿态' },
      attack: { label: '进攻姿态' },
      defense: { label: '防御姿态' },
    },
  },
  engineer: { label: '工程', showProfileSelector: false, showLevelSelector: false, showPostureSelector: false, resolve() { return { maxHealth: TARGET_DEFAULT_HEALTH.engineer, damageReduction: 0, note: '工程目标支持开局防御等特定状态对比 ' }; } },
};

if (!window.DEFAULT_FORM) window.DEFAULT_FORM = {
  attackerRole: 'sentry',
  attackerProfile: 'auto',
  attackerLevel: 1,
  attackerPosture: 'attack',
  targetRole: 'outpost',
  targetProfile: '',
  targetLevel: 1,
  targetPosture: POSTURE_KEY_MOBILE,
  targetMotion: 'spinner',
  targetPart: 'central_plate',
  targetWindowDegrees: getDefaultOutpostWindowDegrees('sentry'),
  durationSec: AUTO_SIM_MAX_SEC,
  requestedFireRateHz: BASE_FIRE_RATE_HZ,
  initialHeat: 0,
  targetHealthPercent: 100,
  enableStructureCrit: false,
  structureCritChancePercent: 15,
  hitRatePercent: 100,
  hitRateStationaryPercent: 100,
  hitRateMovingPercent: 80,
  hitRateSpinnerPercent: 70,
  hitRateMovingSpinnerPercent: 60,
  showDetailedHitRates: false,
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

function getSentryProfileStats(profileKey) {
  return SENTRY_PROFILE_STATS[profileKey] || SENTRY_PROFILE_STATS.auto;
}

function getSentryProfileText(profileKey) {
  const stats = getSentryProfileStats(profileKey);
  return `${stats.label}配置按 ${stats.maxHealth} 血 / ${stats.maxHeat} 热量上限 / ${stats.coolingRate}/s 冷却 / ${stats.chassisPower}W 底盘功率计算`;
}

function getSentryAttackerNote(profileKey, postureKey) {
  const profileText = getSentryProfileText(profileKey);
  if (postureKey === 'attack') {
    return `哨兵${profileText}；进攻姿态前 180 秒附带 3 倍冷却增益，之后衰减为 2 倍 `;
  }
  if (postureKey === 'defense') {
    return `哨兵${profileText}；防御姿态若作为受击方，前 180 秒保持 50% 防御，之后衰减为 25% `;
  }
  return `哨兵${profileText}；移动姿态若作为受击方，常驻 25% 易伤 `;
}

function getSentryTargetNote(profileKey, postureKey) {
  const profileText = getSentryProfileText(profileKey);
  if (postureKey === 'attack') {
    return `哨兵${profileText}；进攻姿态受击时常驻 25% 易伤，若作为攻击方则前 180 秒附带 3 倍冷却增益，之后衰减为 2 倍 `;
  }
  if (postureKey === 'defense') {
    return `哨兵${profileText}；防御姿态受击时前 180 秒获得 50% 防御，之后衰减为 25% 防御 `;
  }
  return `哨兵${profileText}；移动姿态受击时常驻 25% 易伤 `;
}

function resolveSentryAttacker(profileKey, postureKey) {
  const stats = getSentryProfileStats(profileKey);
  return {
    ammoType: '17mm',
    heatPerShot: 10,
    maxHealth: stats.maxHealth,
    maxHeat: stats.maxHeat,
    coolingRate: stats.coolingRate,
    note: getSentryAttackerNote(profileKey, postureKey),
  };
}

function resolveSentryTarget(profileKey, postureKey) {
  const stats = getSentryProfileStats(profileKey);
  return {
    maxHealth: stats.maxHealth,
    damageReduction: 0,
    note: getSentryTargetNote(profileKey, postureKey),
  };
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

function downsampleSeries(timeAxis, seriesCollection, highlightMasks, overlayMasks) {
  const sourceMasks = highlightMasks && typeof highlightMasks === 'object' ? highlightMasks : null;
  const sourceOverlays = overlayMasks && typeof overlayMasks === 'object' ? overlayMasks : null;
  const normalizeMaskValue = (value) => Number(value) > 0 ? 1 : 0;
  const buildBinaryPayload = (sourceMap, indices) => {
    if (!sourceMap) {
      return {};
    }
    const nextMasks = {};
    Object.keys(sourceMap).forEach((seriesKey) => {
      const source = Array.isArray(sourceMap[seriesKey]) ? sourceMap[seriesKey] : [];
      nextMasks[seriesKey] = indices.map((index, sampleIndex) => {
        const rangeStart = sampleIndex <= 0 ? 0 : indices[sampleIndex - 1] + 1;
        const rangeEnd = index;
        for (let cursor = rangeStart; cursor <= rangeEnd; cursor += 1) {
          if (normalizeMaskValue(source[cursor])) {
            return 1;
          }
        }
        return normalizeMaskValue(source[index]);
      });
    });
    return nextMasks;
  };

  if (timeAxis.length <= CHART_MAX_POINTS) {
    const indices = timeAxis.map((_, index) => index);
    return {
      timeSec: timeAxis.map((item) => Number(item.toFixed(2))),
      series: seriesCollection.map((series) => ({ key: series.key, label: series.label, color: series.color, values: series.values.map((item) => Number(item.toFixed(2))) })),
      highlightMasks: buildBinaryPayload(sourceMasks, indices),
      overlayMasks: buildBinaryPayload(sourceOverlays, indices),
    };
  }
  const indices = [];
  for (let step = 0; step < CHART_MAX_POINTS; step += 1) {
    indices.push(Math.round(step * (timeAxis.length - 1) / (CHART_MAX_POINTS - 1)));
  }
  return {
    timeSec: indices.map((index) => Number(timeAxis[index].toFixed(2))),
    series: seriesCollection.map((series) => ({ key: series.key, label: series.label, color: series.color, values: indices.map((index) => Number(series.values[index].toFixed(2))) })),
    highlightMasks: buildBinaryPayload(sourceMasks, indices),
    overlayMasks: buildBinaryPayload(sourceOverlays, indices),
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
  } else if (roleKey === 'sentry') {
    resolved = resolveSentryAttacker(profileKey, postureKey);
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
  if (roleKey === 'sentry') {
    resolved = resolveSentryTarget(profileKey, postureKey);
  } else if (roleConfig.showPostureSelector) {
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
      descriptionSegments: buildDescriptionSegments(resolvedEffect.description),
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
  draft.durationSec = AUTO_SIM_MAX_SEC;
  draft.requestedFireRateHz = clamp(toNumber(draft.requestedFireRateHz, DEFAULT_FORM.requestedFireRateHz), 0, 30);
  draft.initialHeat = clamp(toNumber(draft.initialHeat, DEFAULT_FORM.initialHeat), 0, 500);
  draft.targetHealthPercent = clamp(toNumber(draft.targetHealthPercent, DEFAULT_FORM.targetHealthPercent), 0, 100);
  draft.structureCritChancePercent = clamp(toNumber(draft.structureCritChancePercent, DEFAULT_FORM.structureCritChancePercent), 0.5, 100);
  draft.enableStructureCrit = draft.enableStructureCrit === true || draft.enableStructureCrit === 'true' || draft.enableStructureCrit === 1 || draft.enableStructureCrit === '1';
  draft.showDetailedHitRates = draft.showDetailedHitRates === true || draft.showDetailedHitRates === 'true' || draft.showDetailedHitRates === 1 || draft.showDetailedHitRates === '1';
  draft.hitRatePercent = clamp(toNumber(draft.hitRatePercent, DEFAULT_FORM.hitRatePercent), 0, 100);
  draft.hitRateStationaryPercent = clamp(toNumber(draft.hitRateStationaryPercent, DEFAULT_FORM.hitRateStationaryPercent), 0, 100);
  draft.hitRateMovingPercent = clamp(toNumber(draft.hitRateMovingPercent, DEFAULT_FORM.hitRateMovingPercent), 0, 100);
  draft.hitRateSpinnerPercent = clamp(toNumber(draft.hitRateSpinnerPercent, DEFAULT_FORM.hitRateSpinnerPercent), 0, 100);
  draft.hitRateMovingSpinnerPercent = clamp(toNumber(draft.hitRateMovingSpinnerPercent, DEFAULT_FORM.hitRateMovingSpinnerPercent), 0, 100);
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
  draft.targetMotion = normalizeTargetMotionKey(draft.targetMotion, draft.targetRole, draft.targetPart);
  draft.hitRatePercent = resolveTargetHitRatePercent(draft, draft.targetRole, draft.targetPart, draft.targetMotion);
  draft.attackerSchedules = normalizeSchedules(draft.attackerSchedules, draft.attackerEffects, 'attacker', draft.attackerRole, draft.durationSec);
  draft.targetSchedules = normalizeSchedules(draft.targetSchedules, draft.targetEffects, 'target', draft.targetRole, draft.durationSec);
  return draft;
}

function analyzeDamageLab(form = {}) {
  const inputs = normalizeForm(form);
  const attacker = resolveAttacker(inputs);
  const target = resolveTarget(inputs);
  const targetPart = resolveTargetPart(inputs.targetRole, inputs.targetPart, inputs.targetWindowDegrees);
  const targetMotionKey = normalizeTargetMotionKey(inputs.targetMotion, inputs.targetRole, targetPart.key);
  const targetMotionLabel = getTargetMotionLabel(targetMotionKey);
  const targetBaseHitRatePercent = resolveTargetHitRatePercent(inputs, inputs.targetRole, targetPart.key, targetMotionKey);
  const baseDamage = attacker.resolved.ammoType === '42mm' ? targetPart.damageScale42mm : targetPart.damageScale17mm;
  const currentTargetHealth = target.resolved.maxHealth * inputs.targetHealthPercent / 100;
  const simulationMaxDurationSec = Math.max(30, toNumber(inputs.durationSec, AUTO_SIM_MAX_SEC));
  const dt = simulationMaxDurationSec <= 600 ? 0.01 : 0.02;
  const totalSteps = Math.floor(simulationMaxDurationSec / dt + 0.5) + 1;
  const shotInterval = inputs.requestedFireRateHz <= 1e-9 ? Number.POSITIVE_INFINITY : 1 / inputs.requestedFireRateHz;
  const heatPerShot = attacker.resolved.ammoType === '42mm' ? 100 : 10;
  const overheatEasterChance = inputs.requestedFireRateHz > 20 ? 0.05 : 0;
  const structureCritEnabled = inputs.enableStructureCrit && (inputs.targetRole === 'base' || inputs.targetRole === 'outpost');
  const structureCritChance = structureCritEnabled ? clamp(inputs.structureCritChancePercent / 100, 0.005, 1) : 0;
  const simulationRandom = createSeededRandom(hashStringToUint32(JSON.stringify({
    attackerRole: inputs.attackerRole,
    attackerProfile: inputs.attackerProfile,
    attackerLevel: inputs.attackerLevel,
    attackerPosture: inputs.attackerPosture,
    targetRole: inputs.targetRole,
    targetProfile: inputs.targetProfile,
    targetLevel: inputs.targetLevel,
    targetPosture: inputs.targetPosture,
    targetMotion: targetMotionKey,
    targetPart: targetPart.key,
    durationSec: simulationMaxDurationSec,
    requestedFireRateHz: inputs.requestedFireRateHz,
    initialHeat: inputs.initialHeat,
    targetHealthPercent: inputs.targetHealthPercent,
    targetWindowDegrees: inputs.targetWindowDegrees,
    structureCritEnabled,
    structureCritChance,
    targetBaseHitRatePercent,
  })));

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
  const shotStepDamageCurve = new Array(totalSteps).fill(0);
  const singleShotNominalCurve = new Array(totalSteps).fill(0);
  const shotStepReceivedCurve = new Array(totalSteps).fill(0);
  const critStepCurve = new Array(totalSteps).fill(0);
  const critReceivedStepCurve = new Array(totalSteps).fill(0);
  const targetHealthCurve = new Array(totalSteps).fill(0);
  const heatCurve = new Array(totalSteps).fill(0);
  const shotsCurve = new Array(totalSteps).fill(0);
  const outpostWindowStepMask = new Array(totalSteps).fill(0);
  const noFireStepMask = new Array(totalSteps).fill(0);

  let heat = clamp(inputs.initialHeat, 0, attacker.resolved.maxHeat);
  let totalDamage = 0;
  let totalReceivedDamage = 0;
  let totalShots = 0;
  let totalCritShots = 0;
  let peakHeat = heat;
  let peakSingleShotDamage = 0;
  let peakCoolingRate = attacker.resolved.coolingRate;
  let lastReceiveRatio = clamp(targetBaseHitRatePercent / 100, 0, 1);
  let lastCoolingRate = attacker.resolved.coolingRate;
  let nextShotTime = shotInterval === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : 0;
  let nextCoolingTickTime = 0.1;
  let ttkSec = null;
  let adaptiveEndSec = simulationMaxDurationSec;
  let lastComputedStepIndex = totalSteps - 1;
  let heatBlockedShots = 0;
  let accumulatedShotHeat = 0;
  let easterOverheatShots = 0;
  let heatLockActive = false;
  let noFireActive = shotInterval === Number.POSITIVE_INFINITY;

  for (let index = 0; index < totalSteps; index += 1) {
    const currentTime = index * dt;
    if (currentTime > adaptiveEndSec + 1e-9) {
      lastComputedStepIndex = Math.max(0, index - 1);
      break;
    }
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
    const effectiveHitProbability = clamp(targetBaseHitRatePercent / 100 * modifiers.hitProbabilityMult, 0, 1);
    const singleShotDamageBase = baseDamage * modifiers.damageDealtMult * modifiers.damageTakenMult;
    peakCoolingRate = Math.max(peakCoolingRate, effectiveCoolingRate);
    lastReceiveRatio = effectiveHitProbability;
    lastCoolingRate = effectiveCoolingRate;
    // 边界时刻采用“先判发弹后结算冷却”，避免同刻冷却导致额外放出一发。
    while (nextCoolingTickTime < currentTime - 1e-9) {
      heat = Math.max(0, heat - effectiveCoolingRate / 10);
      nextCoolingTickTime += 0.1;
    }
    heat = Math.max(0, heat);
    if (heatLockActive && heat <= 1e-9) {
      heatLockActive = false;
    }
    const outpostWindowOpenNow = inputs.targetRole === 'outpost'
      ? isOutpostWindowOpenAtTime(currentTime, inputs.targetWindowDegrees)
      : true;
    // 单发伤害曲线使用“当前时刻单发理论伤害”，不受是否触发暴击的随机结果影响。
    singleShotNominalCurve[index] = outpostWindowOpenNow ? singleShotDamageBase : 0;
    outpostWindowStepMask[index] = outpostWindowOpenNow ? 1 : 0;

    let shotDamageStepNow = 0;
    let shotReceivedStepNow = 0;
    let critDamageStepNow = 0;
    let critReceivedStepNow = 0;
    let hadSuccessfulShot = false;
    let hadBlockedAttempt = false;
    while (nextShotTime <= currentTime + 1e-9) {
      if (heatLockActive) {
        hadBlockedAttempt = true;
        break;
      }

      const canAttackOutpost = inputs.targetRole !== 'outpost'
        || isOutpostWindowOpenAtTime(nextShotTime, inputs.targetWindowDegrees);
      if (!canAttackOutpost) {
        hadBlockedAttempt = true;
        nextShotTime += shotInterval;
        continue;
      }

      const projectedHeat = heat + heatPerShot;
      const exceedsHeatCap = projectedHeat > attacker.resolved.maxHeat + 1e-9;
      if (exceedsHeatCap) {
        const triggerEasterOverheat = overheatEasterChance > 0 && simulationRandom() < overheatEasterChance;
        if (!triggerEasterOverheat) {
          if (!heatLockActive) {
            heatBlockedShots += 1;
          }
          heatLockActive = true;
          hadBlockedAttempt = true;
          // 超热时保持待发时间不推进，进入锁定等待冷却。
          break;
        }
        easterOverheatShots += 1;
      }

      let shotDamageNow = singleShotDamageBase;
      let didHitTarget = false;
      if (effectiveHitProbability > 1e-9) {
        didHitTarget = simulationRandom() <= effectiveHitProbability + 1e-9;
      }

      let isCritShot = false;
      if (didHitTarget && structureCritEnabled && structureCritChance > 1e-9) {
        if (simulationRandom() <= structureCritChance + 1e-9) {
          shotDamageNow *= 1.5;
          totalCritShots += 1;
          isCritShot = true;
          critDamageStepNow += shotDamageNow;
        }
      }

      totalShots += 1;
      totalDamage += shotDamageNow;
      shotDamageStepNow += shotDamageNow;
      peakSingleShotDamage = Math.max(peakSingleShotDamage, shotDamageNow);
      if (didHitTarget) {
        totalReceivedDamage += shotDamageNow;
        shotReceivedStepNow += shotDamageNow;
        if (isCritShot) {
          critReceivedStepNow += shotDamageNow;
        }
      }
      accumulatedShotHeat += heatPerShot;
      heat = projectedHeat;
      peakHeat = Math.max(peakHeat, heat);
      hadSuccessfulShot = true;
      // 彩蛋超热后也进入锁定，直到热量归零。
      heatLockActive = projectedHeat > attacker.resolved.maxHeat + 1e-9 ? true : false;
      nextShotTime = shotInterval === Number.POSITIVE_INFINITY
        ? Number.POSITIVE_INFINITY
        : currentTime + shotInterval;
    }
    while (nextCoolingTickTime <= currentTime + 1e-9) {
      heat = Math.max(0, heat - effectiveCoolingRate / 10);
      nextCoolingTickTime += 0.1;
    }
    heat = Math.max(0, heat);
    if (hadSuccessfulShot) {
      noFireActive = false;
    } else if (hadBlockedAttempt) {
      noFireActive = true;
    }
    noFireStepMask[index] = noFireActive ? 1 : 0;
    totalDamageCurve[index] = totalDamage;
    receivedDamageCurve[index] = totalReceivedDamage;
    shotStepDamageCurve[index] = shotDamageStepNow;
    shotStepReceivedCurve[index] = shotReceivedStepNow;
    critStepCurve[index] = critDamageStepNow;
    critReceivedStepCurve[index] = critReceivedStepNow;
    targetHealthCurve[index] = Math.max(0, currentTargetHealth - totalReceivedDamage);
    if (ttkSec === null && targetHealthCurve[index] <= 1e-9) {
      ttkSec = currentTime;
      const adaptiveCandidate = Math.min(simulationMaxDurationSec, ttkSec);
      if (adaptiveCandidate < adaptiveEndSec - 1e-9) {
        adaptiveEndSec = adaptiveCandidate;
      }
    }
    heatCurve[index] = heat;
    shotsCurve[index] = totalShots;
    if (index === totalSteps - 1) {
      lastComputedStepIndex = index;
    }
  }

  const usedCount = Math.max(1, lastComputedStepIndex + 1);
  const usedTimeAxis = timeAxis.slice(0, usedCount);
  const usedTotalDamageCurve = totalDamageCurve.slice(0, usedCount);
  const usedReceivedDamageCurve = receivedDamageCurve.slice(0, usedCount);
  const usedShotStepDamageCurve = shotStepDamageCurve.slice(0, usedCount);
  const usedSingleShotNominalCurve = singleShotNominalCurve.slice(0, usedCount);
  const usedCritStepCurve = critStepCurve.slice(0, usedCount);
  const usedCritReceivedStepCurve = critReceivedStepCurve.slice(0, usedCount);
  const usedTargetHealthCurve = targetHealthCurve.slice(0, usedCount);
  const usedHeatCurve = heatCurve.slice(0, usedCount);
  const usedShotsCurve = shotsCurve.slice(0, usedCount);
  const usedOutpostWindowStepMask = outpostWindowStepMask.slice(0, usedCount);
  const usedNoFireStepMask = noFireStepMask.slice(0, usedCount);
  const effectiveDurationSec = Math.max(usedTimeAxis[usedCount - 1], 1e-9);
  const hitSimulationCeiling = ttkSec === null && effectiveDurationSec >= simulationMaxDurationSec - 1e-6;

  const dpsCurve = buildRateCurve(usedTotalDamageCurve, dt);
  const stepDamageCurve = dpsCurve.map((value) => Number(value.toFixed(4)));
  const stepSingleDamageCurve = usedSingleShotNominalCurve.map((value) => Number(value.toFixed(4)));
  const stepTotalDamageCurve = usedTotalDamageCurve.map((value) => Number(value.toFixed(4)));
  const stepTotalReceivedCurve = usedReceivedDamageCurve.map((value) => Number(value.toFixed(4)));
  const stepCritCurve = usedCritStepCurve.map((value) => Number(value.toFixed(4)));
  const stepCritReceivedCurve = usedCritReceivedStepCurve.map((value) => Number(value.toFixed(4)));
  const critDamageStepMask = stepCritCurve.map((value) => value > 1e-9 ? 1 : 0);
  const critReceivedStepMask = stepCritReceivedCurve.map((value) => value > 1e-9 ? 1 : 0);
  const outpostWindowMask = usedOutpostWindowStepMask.map((value) => value > 0 ? 1 : 0);
  const forceOutpostFullWindowHighlight = structureCritEnabled
    && inputs.targetRole === 'outpost'
    && structureCritChance >= 1 - 1e-9;
  const totalDamageFinal = usedTotalDamageCurve[usedCount - 1];
  const totalReceivedFinal = usedReceivedDamageCurve[usedCount - 1];
  const avgDps = totalDamageFinal / effectiveDurationSec;
  const avgReceivedDps = totalReceivedFinal / effectiveDurationSec;
  const peakDps = dpsCurve.reduce((current, item) => Math.max(current, item), 0);
  const actualFireRateHz = totalShots / effectiveDurationSec;
  const actualCritRatePercent = totalShots > 0 ? (totalCritShots / totalShots) * 100 : 0;

  const outputSeries = [
    { key: 'dps', label: 'DPS(按1秒发弹)', color: '#cfff2e', values: stepDamageCurve },
    { key: 'singleDamage', label: '理论单发伤害', color: '#ff3ea5', values: stepSingleDamageCurve },
    { key: 'heat', label: '热量', color: '#8b56ff', values: usedHeatCurve },
    
  ];
  const outputChart = downsampleSeries(usedTimeAxis, outputSeries, null, {
    noFire: usedNoFireStepMask,
  });
  const targetChart = downsampleSeries(usedTimeAxis, [
    { key: 'receivedDamage', label: '累计受击', color: '#6ee7ff', values: stepTotalReceivedCurve },
    { key: 'totalDamage', label: '总伤害', color: '#ff9b2f', values: stepTotalDamageCurve },
    { key: 'targetHealth', label: '敌方血量', color: '#d4ff3a', values: usedTargetHealthCurve },
  ], {
    receivedDamage: forceOutpostFullWindowHighlight ? outpostWindowMask : critReceivedStepMask,
    totalDamage: forceOutpostFullWindowHighlight ? outpostWindowMask : critDamageStepMask,
  }, {
    noFire: usedNoFireStepMask,
  });

  const attackerConfigText = [attacker.profileLabel, attacker.level ? `Lv.${attacker.level}` : '', attacker.postureLabel].filter(Boolean).join(' · ');
  const targetConfigText = [target.profileLabel, target.level ? `Lv.${target.level}` : '', target.postureLabel].filter(Boolean).join(' · ');
  const attackerTimelineTracks = buildTimelineTracks(inputs.attackerSchedules, 'attacker', effectiveDurationSec);
  const targetTimelineTracks = buildTimelineTracks(inputs.targetSchedules, 'target', effectiveDurationSec);
  const noteLines = [SAFE_MODEL_NOTE, STACKING_NOTE];
  noteLines.push(`热量控制：严格上限 ${attacker.resolved.maxHeat.toFixed(1)}；17mm 每发 +10，42mm 每发 +100；若下一发会超上限则锁定枪管，直到热量归零`);
  if (overheatEasterChance > 0) {
    noteLines.push(`热量彩蛋：请求发弹频率 >20 时有 1% 概率触发超限发弹（本次触发 ${easterOverheatShots} 次）`);
  }
  noteLines.push(`热量计数：累计发弹 ${totalShots} 发，累计发射注热 ${accumulatedShotHeat.toFixed(0)}`);
  noteLines.push(`热量锁定统计：共触发 ${heatBlockedShots} 次，峰值热量 ${peakHeat.toFixed(1)}`);
  noteLines.push('图中 20% 不透明度灰色遮罩表示未开火区间');
  if (inputs.targetRole === 'outpost') { noteLines.push(buildOutpostWindowNote(inputs.targetWindowDegrees)); }
  noteLines.push(`命中建模：受击状态 ${targetMotionLabel}，命中率 ${targetBaseHitRatePercent.toFixed(1)}%，按逐发概率判定，命中后再判定暴击`);
  noteLines.push('单发伤害曲线按每时刻单发理论伤害绘制，不按均值/折算值，也不按暴击随机结果抖动');
  if (structureCritEnabled) { noteLines.push(`建筑暴击已启用：配置概率 ${inputs.structureCritChancePercent.toFixed(1)}%，实测触发 ${actualCritRatePercent.toFixed(1)}%，触发时 +50% 伤害`); }
  if (ttkSec !== null) {
    noteLines.push(`仿真时长自动采用目标存活时长：${ttkSec.toFixed(2)} 秒`);
  } else if (hitSimulationCeiling) {
    noteLines.push(`仿真时长自动模式：目标在 ${simulationMaxDurationSec.toFixed(0)} 秒上限内未归零`);
  }
  if (inputs.targetRole === 'base' && inputs.targetPart === 'shield_closed') { noteLines.push('基地护甲未展开时按不可受击处理 '); }
  if (inputs.attackerRole === 'sentry' || inputs.targetRole === 'sentry') { noteLines.push('哨兵姿态按 180 秒连续持续时间做默认/衰减分段：进攻姿态冷却由 3 倍降至 2 倍，防御姿态防御由 50% 衰减至 25% '); }
  if (attackerTimelineTracks.length) { noteLines.push(`攻击轨道 ${attackerTimelineTracks.map((item) => `${item.displayLabel} ${item.timingText}`).join('；')}`); }
  if (targetTimelineTracks.length) { noteLines.push(`受击轨道 ${targetTimelineTracks.map((item) => `${item.displayLabel} ${item.timingText}`).join('；')}`); }
  const summaryHighlights = [
    { label: '总出伤', value: totalDamageFinal.toFixed(2), tone: 'attack' },
    { label: '累计受击总量', value: totalReceivedFinal.toFixed(2), tone: 'vulnerability' },
    { label: '热量峰值', value: peakHeat.toFixed(1), tone: 'mixed' },
    {
      label: '归零结果',
      value: ttkSec === null ? '未归零' : `${ttkSec.toFixed(2)} 秒`,
      tone: ttkSec === null ? 'neutral' : (ttkSec <= 8 ? 'ttk-blazing' : (ttkSec <= 18 ? 'ttk-fast' : (ttkSec <= 32 ? 'ttk-mid' : 'ttk-slow'))),
    },
  ];
  const taunt = buildAnalysisTaunt({
    inputs,
    attacker,
    target,
    targetPart,
    ttkSec,
    totalDamage: totalDamageFinal,
    peakHeat,
    totalShots,
    lastReceiveRatio,
  });
  if (heatBlockedShots > 0) {
    const heatLockTauntLine = '这么高发弹频率现实里大概率是会锁枪管的对吧，我模拟一下很合理吧（doge）';
    const mergedTauntLines = Array.isArray(taunt.lines) ? taunt.lines.slice() : [];
    if (!mergedTauntLines.includes(heatLockTauntLine)) {
      mergedTauntLines.push(heatLockTauntLine);
    }
    taunt.lines = mergedTauntLines;
    taunt.warningLine = heatLockTauntLine;
  }

  return {
    inputs,
    attacker,
    target,
    targetPart,
    cards: [
      { label: '平均 DPS', value: avgDps.toFixed(2) },
      { label: '受击 DPS', value: avgReceivedDps.toFixed(2) },
      { label: '峰值 DPS', value: peakDps.toFixed(2) },
      { label: '单发峰值', value: peakSingleShotDamage.toFixed(2), tone: 'neon-red' },
      { label: '累计发弹', value: String(totalShots) },
      { label: '热量锁定次数', value: String(heatBlockedShots) },
      { label: '累计发射注热', value: accumulatedShotHeat.toFixed(0) },
      { label: '冷却峰值', value: `${peakCoolingRate.toFixed(2)}/s` },
      { label: '当前命中判定', value: `${(lastReceiveRatio * 100).toFixed(2)}%` },
      {
        label: '暴击率(理论/实际)',
        value: structureCritEnabled
          ? `${inputs.structureCritChancePercent.toFixed(1)}% / ${actualCritRatePercent.toFixed(1)}%`
          : '关闭 / -',
      },
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
      targetMotionText: targetMotionLabel,
      activeHitRateText: `${targetBaseHitRatePercent.toFixed(1)}%`,
      outpostWindowDegreesText: `${inputs.targetWindowDegrees.toFixed(0)}°`,
      outpostWindowRatioText: `${(targetPart.receiveRatio * 100).toFixed(2)}%`,
      structureCritText: structureCritEnabled ? `${inputs.structureCritChancePercent.toFixed(1)}% / 实测 ${actualCritRatePercent.toFixed(1)}%` : '关闭',
      receiveRatioText: `${(lastReceiveRatio * 100).toFixed(2)}%`,
      coolingRateText: `${lastCoolingRate.toFixed(2)}/s`,
      simulatedDurationSec: Number(effectiveDurationSec.toFixed(2)),
      simulatedDurationText: `${effectiveDurationSec.toFixed(2)}s`,
    },
    charts: {
      output: {
        title: '输出总曲线图',
        subtitle: '按请求发弹频率计算：DPS / 理论单发伤害 / 热量（灰色遮罩=没开火）',
        unitHint: 'DPS / 理论单发伤害 / 热量',
        timeSec: outputChart.timeSec,
        series: outputChart.series,
        highlightMasks: outputChart.highlightMasks,
        highlightColor: '#ff2b2b',
        overlayMasks: outputChart.overlayMasks,
        noFireColor: 'rgba(128, 128, 128, 0.2)',
      },
      target: {
        title: '血量与伤害总曲线图',
        subtitle: ttkSec === null ? '累计受击 / 总伤害 / 敌方血量（当前时长内未归零，灰色遮罩=没开火）' : `累计受击 / 总伤害 / 敌方血量（${ttkSec.toFixed(2)} 秒归零，灰色遮罩=没开火）`,
        unitHint: '累计受击 / 总伤害 / 剩余血量',
        timeSec: targetChart.timeSec,
        series: targetChart.series,
        highlightMasks: targetChart.highlightMasks,
        highlightColor: '#ff2b2b',
        overlayMasks: targetChart.overlayMasks,
        noFireColor: 'rgba(128, 128, 128, 0.2)',
      },
    },
  };
}

function buildPageState(form = {}) {
  const analysis = analyzeDamageLab(form);
  const inputs = analysis.inputs;
  const targetPartOptions = getTargetPartOptions(inputs.targetRole);
  const simulationDurationSec = Math.max(0.1, toNumber(analysis.resolved && analysis.resolved.simulatedDurationSec, inputs.durationSec));
  const combinedSchedules = [].concat(inputs.attackerSchedules || [], inputs.targetSchedules || []);
  const timelineBounds = getTimelineBounds(simulationDurationSec, combinedSchedules);
  const timelineSpan = Math.max(1, timelineBounds.max - timelineBounds.min);
  const effectiveSimDurationSec = clamp(simulationDurationSec, 0, timelineSpan);
  const targetMotionOptions = getTargetMotionOptionsForRole(inputs.targetRole);
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
    targetMotionOptions,
    targetMotionIndex: pickOptionIndex(targetMotionOptions, inputs.targetMotion),
    targetPartOptions,
    targetPartIndex: pickOptionIndex(targetPartOptions, inputs.targetPart),
    showOutpostWindowControl: inputs.targetRole === 'outpost',
    showStructureCritControl: inputs.targetRole === 'base' || inputs.targetRole === 'outpost',
    showTargetProfile: analysis.target.showProfileSelector,
    showTargetLevel: analysis.target.showLevelSelector,
    showTargetPosture: analysis.target.showPostureSelector,
    showTargetMotion: targetMotionOptions.length > 0,
    attackerTimelineTracks,
    targetTimelineTracks,
    timelineRangeMin: timelineBounds.min,
    timelineRangeMax: timelineBounds.max,
    timelineRangeStartLabel: formatTimelineAxisLabel(timelineBounds.min),
    timelineRangeEndLabel: formatTimelineAxisLabel(timelineBounds.max),
    simulationStartPercent: (0 - timelineBounds.min) / timelineSpan * 100,
    simulationSpanPercent: effectiveSimDurationSec / timelineSpan * 100,
    metricRows: buildRows(analysis.cards, 2),
    summaryHighlightRows: buildRows(analysis.summaryHighlights, 2),
    attackerEffectRows: buildRows(analysis.attackerEffectOptions, 2),
    targetEffectRows: buildRows(analysis.targetEffectOptions, 2),
  };
}

function createDefaultPageState() {
  return buildPageState(DEFAULT_FORM);
}
const SAFE_MODEL_NOTE = '已选规则状态按整个仿真时长持续生效，并始终按不超热的安全控频发弹 ';
const STACKING_NOTE = '同类攻击/防御/易伤/冷却增益按规则只取最大效果，防御与易伤按净值合并 ';
const STRUCTURE_CRIT_NOTE = '结构暴击为分析器内的可选对比项，当前按期望伤害折算，不做逐发随机模拟 ';

const BASE_FIRE_RATE_HZ = 8.0;
const HEAT_DETECTION_HZ = 10.0;
const FORT_DEFENSE_MULT = 0.5;
const FORT_ENEMY_VULNERABILITY_MULT = 2.0;
const OUTPOST_DEFENSE_MULT = 0.5;
const ROAD_DEFENSE_MULT = 0.75;
const TUNNEL_DEFENSE_MULT = 0.5;
const TUNNEL_COOLING_MULT = 2.0;
const FORT_COOLING_DIVISOR_HP = 40.0;
const FORT_COOLING_MAX = 75.0;
const FORT_RESERVE_AMMO_BASE = 100;
const FORT_RESERVE_AMMO_DIVISOR_HP = 15.0;
const FORT_RESERVE_AMMO_STEP = 2;
const FORT_RESERVE_AMMO_MAX = 500;
const STRUCTURE_CRIT_MIN_PERCENT = 0.5;
const STRUCTURE_CRIT_MAX_PERCENT = 30.0;
const STRUCTURE_CRIT_DEFAULT_PERCENT = 5.0;
const STRUCTURE_CRIT_MULTIPLIER = 1.5;
const CHART_MAX_POINTS = 600;

const ROLE_LABELS = {
  hero: '英雄',
  infantry: '步兵',
  sentry: '哨兵',
  drone: '无人机',
};

const PROFILE_LABELS = {
  melee_priority: '近战优先',
  ranged_priority: '远程优先',
  cooling_priority: '冷却优先',
  burst_priority: '爆发优先',
  power_priority: '功率优先',
  health_priority: '血量优先',
  auto: '全自动',
  semi_auto: '半自动',
};

const TARGET_PROFILE_LABELS = {
  melee_priority: '血量优先',
  ranged_priority: '爆发优先',
  cooling_priority: '血量优先',
  burst_priority: '爆发优先',
  power_priority: '功率优先',
  health_priority: '血量优先',
  auto: '血量优先',
  semi_auto: '爆发优先',
};

const TARGET_LABELS = {
  base: '基地',
  outpost: '前哨站',
  infantry: '步兵',
  hero: '英雄',
  sentry: '哨兵',
  drone: '无人机',
  engineer: '工程',
};

const TARGET_DEFAULT_HEALTH = {
  base: 2000.0,
  outpost: 1500.0,
  infantry: 200.0,
  hero: 150.0,
  sentry: 400.0,
  drone: 200.0,
  engineer: 250.0,
};

const TARGET_TYPE_TO_DAMAGE_KEY = {
  base: 'base',
  outpost: 'outpost',
  infantry: 'robot',
  hero: 'robot',
  engineer: 'robot',
  drone: 'robot',
  sentry: 'sentry',
};

const TARGET_PARTS = {
  base: [
    { key: 'normal_plate', label: '普通装甲板', damageKey: 'bullet_17mm', receiveRatio: 1.0 },
    { key: 'front_upper_plate', label: '上方前装甲板', damageKey: 'bullet_17mm_front_upper', receiveRatio: 1.0 },
    { key: 'shield_closed', label: '护甲未展开', damageKey: 'blocked', receiveRatio: 0.0 },
  ],
  outpost: [
    { key: 'central_plate', label: '中部装甲板', damageKey: 'bullet_17mm', receiveRatio: 120.0 / 360.0 },
  ],
  infantry: [{ key: 'armor_plate', label: '装甲模块', damageKey: 'bullet_17mm', receiveRatio: 1.0 }],
  hero: [{ key: 'armor_plate', label: '装甲模块', damageKey: 'bullet_17mm', receiveRatio: 1.0 }],
  sentry: [{ key: 'armor_plate', label: '装甲模块', damageKey: 'bullet_17mm', receiveRatio: 1.0 }],
  drone: [{ key: 'armor_plate', label: '装甲模块', damageKey: 'bullet_17mm', receiveRatio: 1.0 }],
  engineer: [{ key: 'armor_plate', label: '装甲模块', damageKey: 'bullet_17mm', receiveRatio: 1.0 }],
};

const ROBOT_TARGETS = ['hero', 'infantry', 'sentry', 'drone', 'engineer'];
const STRUCTURE_CRIT_TARGETS = ['base', 'outpost'];

const SENTRY_POSTURES = {
  mobile: { label: '移动姿态', coolingMult: 1.0, summary: ' 移动姿态 30/s 冷却 ' },
  attack: { label: '进攻姿态', coolingMult: 3.0, summary: ' 进攻姿态 90/s 冷却 ' },
  defense: { label: '防御姿态', coolingMult: 1.0, summary: ' 防御姿态 30/s 冷却 ' },
};

function buildLevelMap(rows, ammoType, heatPerShot) {
  return rows.reduce((levels, row) => {
    const [level, maxHealth, maxHeat, coolingRate] = row;
    levels[String(level)] = {
      maxHealth,
      maxHeat,
      coolingRate,
      ammoType,
      heatPerShot,
      baseFireRateHz: BASE_FIRE_RATE_HZ,
    };
    return levels;
  }, {});
}

const HERO_MELEE_ROWS = [
  [1, 200, 140, 12],
  [2, 225, 150, 14],
  [3, 250, 160, 16],
  [4, 275, 170, 18],
  [5, 300, 180, 20],
  [6, 325, 190, 22],
  [7, 350, 200, 24],
  [8, 375, 210, 26],
  [9, 400, 220, 28],
  [10, 450, 240, 30],
];

const HERO_RANGED_ROWS = [
  [1, 150, 100, 20],
  [2, 165, 102, 23],
  [3, 180, 104, 26],
  [4, 195, 106, 29],
  [5, 210, 108, 32],
  [6, 225, 110, 35],
  [7, 240, 115, 38],
  [8, 255, 120, 41],
  [9, 270, 125, 44],
  [10, 300, 130, 50],
];

const INFANTRY_BURST_ROWS = [
  [1, 200, 170, 5],
  [2, 200, 180, 7],
  [3, 200, 190, 9],
  [4, 200, 200, 11],
  [5, 200, 210, 12],
  [6, 200, 220, 13],
  [7, 200, 230, 14],
  [8, 200, 240, 16],
  [9, 200, 250, 18],
  [10, 200, 260, 20],
];

const INFANTRY_COOLING_ROWS = [
  [1, 200, 40, 12],
  [2, 200, 48, 14],
  [3, 200, 56, 16],
  [4, 200, 64, 18],
  [5, 200, 72, 20],
  [6, 200, 80, 22],
  [7, 200, 88, 24],
  [8, 200, 96, 26],
  [9, 200, 114, 28],
  [10, 200, 120, 30],
];

const DRONE_POWER_ROWS = [
  [1, 150],
  [2, 175],
  [3, 200],
  [4, 225],
  [5, 250],
  [6, 275],
  [7, 300],
  [8, 325],
  [9, 350],
  [10, 400],
];

const DRONE_HEALTH_ROWS = [
  [1, 200],
  [2, 225],
  [3, 250],
  [4, 275],
  [5, 300],
  [6, 325],
  [7, 350],
  [8, 375],
  [9, 400],
  [10, 400],
];

const DRONE_LAUNCHER_ROWS = [
  [1, 100, 20],
  [2, 110, 30],
  [3, 120, 40],
  [4, 130, 50],
  [5, 140, 60],
  [6, 150, 70],
  [7, 160, 80],
  [8, 170, 90],
  [9, 180, 100],
  [10, 200, 120],
];

function buildDroneLevelMap(chassisRows, launcherRows) {
  const launcherMap = launcherRows.reduce((lookup, row) => {
    const [level, maxHeat, coolingRate] = row;
    lookup[String(level)] = { maxHeat, coolingRate };
    return lookup;
  }, {});

  return chassisRows.reduce((levels, row) => {
    const [level, maxHealth] = row;
    const key = String(level);
    const launcher = launcherMap[key];
    levels[key] = {
      maxHealth,
      maxHeat: launcher.maxHeat,
      coolingRate: launcher.coolingRate,
      ammoType: '17mm',
      heatPerShot: 10.0,
      baseFireRateHz: BASE_FIRE_RATE_HZ,
    };
    return levels;
  }, {});
}

const ROLE_CATALOG = {
  hero: {
    label: ROLE_LABELS.hero,
    defaultProfile: 'ranged_priority',
    defaultLevel: 1,
    showLevelSelector: true,
    showPostureSelector: false,
    profiles: {
      melee_priority: {
        label: PROFILE_LABELS.melee_priority,
        levels: buildLevelMap(HERO_MELEE_ROWS, '42mm', 100.0),
      },
      ranged_priority: {
        label: PROFILE_LABELS.ranged_priority,
        levels: buildLevelMap(HERO_RANGED_ROWS, '42mm', 100.0),
      },
    },
  },
  infantry: {
    label: ROLE_LABELS.infantry,
    defaultProfile: 'cooling_priority',
    defaultLevel: 1,
    showLevelSelector: true,
    showPostureSelector: false,
    profiles: {
      burst_priority: {
        label: PROFILE_LABELS.burst_priority,
        levels: buildLevelMap(INFANTRY_BURST_ROWS, '17mm', 10.0),
      },
      cooling_priority: {
        label: PROFILE_LABELS.cooling_priority,
        levels: buildLevelMap(INFANTRY_COOLING_ROWS, '17mm', 10.0),
      },
    },
  },
  sentry: {
    label: ROLE_LABELS.sentry,
    defaultProfile: 'auto',
    defaultLevel: 1,
    showLevelSelector: false,
    showPostureSelector: true,
    profiles: {
      auto: {
        label: PROFILE_LABELS.auto,
        levels: {
          '1': {
            maxHealth: 400.0,
            maxHeat: 260.0,
            coolingRate: 30.0,
            ammoType: '17mm',
            heatPerShot: 10.0,
            baseFireRateHz: BASE_FIRE_RATE_HZ,
          },
        },
      },
      semi_auto: {
        label: PROFILE_LABELS.semi_auto,
        levels: {
          '1': {
            maxHealth: 200.0,
            maxHeat: 100.0,
            coolingRate: 10.0,
            ammoType: '17mm',
            heatPerShot: 10.0,
            baseFireRateHz: BASE_FIRE_RATE_HZ,
          },
        },
      },
    },
    postures: SENTRY_POSTURES,
  },
  drone: {
    label: ROLE_LABELS.drone,
    defaultProfile: 'health_priority',
    defaultLevel: 1,
    showLevelSelector: true,
    showPostureSelector: false,
    profiles: {
      power_priority: {
        label: PROFILE_LABELS.power_priority,
        levels: buildDroneLevelMap(DRONE_POWER_ROWS, DRONE_LAUNCHER_ROWS),
      },
      health_priority: {
        label: PROFILE_LABELS.health_priority,
        levels: buildDroneLevelMap(DRONE_HEALTH_ROWS, DRONE_LAUNCHER_ROWS),
      },
    },
  },
};

const TARGET_ROLE_KEYS = ['hero', 'infantry', 'sentry', 'drone'];
const TARGET_ROLE_SET = new Set(TARGET_ROLE_KEYS);

function targetProfileLabel(profileKey, fallbackLabel) {
  return TARGET_PROFILE_LABELS[profileKey] || fallbackLabel;
}

function buildProfileOptions(roleConfig, useTargetLabels = false) {
  return Object.entries(roleConfig.profiles).map(([key, value]) => ({
    key,
    label: useTargetLabels ? targetProfileLabel(key, value.label) : value.label,
  }));
}

function buildLevelOptions(profileConfig) {
  return Object.keys(profileConfig.levels).map((level) => ({
    key: Number(level),
    label: `Lv.${level}`,
  }));
}

function resolveTargetPreset(targetUnit, targetProfile, targetLevel) {
  if (!TARGET_ROLE_SET.has(targetUnit) || !ROLE_CATALOG[targetUnit]) {
    return {
      configurable: false,
      targetUnit,
      profileKey: '',
      profileLabel: '',
      level: 1,
      levelLabel: '',
      maxHealth: TARGET_DEFAULT_HEALTH[targetUnit] || 1,
      profileOptions: [],
      levelOptions: [],
    };
  }

  const roleConfig = ROLE_CATALOG[targetUnit];
  const profileOptions = buildProfileOptions(roleConfig, true);
  const profileKey = roleConfig.profiles[targetProfile] ? targetProfile : roleConfig.defaultProfile;
  const profileConfig = roleConfig.profiles[profileKey];
  const levelOptions = buildLevelOptions(profileConfig);
  const fallbackLevel = roleConfig.defaultLevel || (levelOptions[0] ? Number(levelOptions[0].key) : 1);
  const requestedLevel = Math.trunc(Number.isFinite(Number(targetLevel)) ? Number(targetLevel) : fallbackLevel);
  const level = levelOptions.some((item) => item.key === requestedLevel) ? requestedLevel : fallbackLevel;
  const resolvedLevelKey = profileConfig.levels[String(level)] ? String(level) : Object.keys(profileConfig.levels)[0];
  const resolvedLevel = Number(resolvedLevelKey);

  return {
    configurable: true,
    targetUnit,
    profileKey,
    profileLabel: targetProfileLabel(profileKey, profileConfig.label),
    level: resolvedLevel,
    levelLabel: `Lv.${resolvedLevel}`,
    maxHealth: profileConfig.levels[resolvedLevelKey].maxHealth,
    profileOptions,
    levelOptions,
  };
}

const EFFECTS = [
  {
    key: 'hero_deployment',
    label: '英雄部署区',
    description: '+50% 出伤，25% 防御，仅远程优先英雄 ',
    damageDealtMult: 1.5,
    damageTakenMult: 0.75,
    coolingMult: 1.0,
    hitProbabilityMult: 1.0,
    attackerRoles: ['hero'],
    targetUnits: ['hero'],
    showOnAttacker: true,
    showOnTarget: true,
  },
  {
    key: 'fort',
    label: '己方堡垒',
    description: '50% 防御，额外冷却 w=floor(Δ/40) 且上限 75，仅步兵/哨兵 ',
    damageDealtMult: 1.0,
    damageTakenMult: FORT_DEFENSE_MULT,
    coolingMult: 1.0,
    hitProbabilityMult: 1.0,
    attackerRoles: ['infantry', 'sentry'],
    targetUnits: ['infantry', 'sentry'],
    showOnAttacker: true,
    showOnTarget: true,
  },
  {
    key: 'enemy_fort_exposed',
    label: '敌方堡垒暴露',
    description: '仅在比赛已过 3 分钟、对方前哨已毁且对方基地护甲未展开时生效，+100% 易伤 ',
    damageDealtMult: 1.0,
    damageTakenMult: FORT_ENEMY_VULNERABILITY_MULT,
    coolingMult: 1.0,
    hitProbabilityMult: 1.0,
    attackerRoles: [],
    targetUnits: ['infantry', 'sentry'],
    showOnAttacker: false,
    showOnTarget: true,
  },
  {
    key: 'terrain_road_defense',
    label: '地形跨越（公路）',
    description: '25% 防御，当前按已触发后持续生效对比 ',
    damageDealtMult: 1.0,
    damageTakenMult: ROAD_DEFENSE_MULT,
    coolingMult: 1.0,
    hitProbabilityMult: 1.0,
    attackerRoles: [],
    targetUnits: ['hero', 'infantry', 'sentry', 'drone', 'engineer'],
    showOnAttacker: false,
    showOnTarget: true,
  },
  {
    key: 'energy_mechanism',
    label: '中央能量机关',
    description: '+15% 出伤，+20% 冷却 ',
    damageDealtMult: 1.15,
    damageTakenMult: 1.0,
    coolingMult: 1.2,
    hitProbabilityMult: 1.0,
    attackerRoles: ['hero', 'infantry', 'sentry', 'drone'],
    targetUnits: [],
    showOnAttacker: true,
    showOnTarget: false,
  },
  {
    key: 'respawn_weak',
    label: '复活虚弱',
    description: '攻击方 -30% 出伤；受击方 +15% 易伤 ',
    damageDealtMult: 0.7,
    damageTakenMult: 1.15,
    coolingMult: 1.0,
    hitProbabilityMult: 1.0,
    attackerRoles: ['hero', 'infantry', 'sentry', 'drone'],
    targetUnits: ROBOT_TARGETS,
    showOnAttacker: true,
    showOnTarget: true,
  },
  {
    key: 'base_buff',
    label: '基地增益点',
    description: '50% 防御 ',
    damageDealtMult: 1.0,
    damageTakenMult: 0.5,
    coolingMult: 1.0,
    hitProbabilityMult: 1.0,
    attackerRoles: [],
    targetUnits: ROBOT_TARGETS,
    showOnAttacker: false,
    showOnTarget: true,
  },
  {
    key: 'outpost_buff',
    label: '前哨增益点',
    description: '50% 防御 ',
    damageDealtMult: 1.0,
    damageTakenMult: OUTPOST_DEFENSE_MULT,
    coolingMult: 1.0,
    hitProbabilityMult: 1.0,
    attackerRoles: [],
    targetUnits: ['hero', 'infantry', 'sentry', 'drone', 'engineer'],
    showOnAttacker: false,
    showOnTarget: true,
  },
  {
    key: 'central_highland',
    label: '中央高地',
    description: '25% 防御 ',
    damageDealtMult: 1.0,
    damageTakenMult: 0.75,
    coolingMult: 1.0,
    hitProbabilityMult: 1.0,
    attackerRoles: [],
    targetUnits: ['hero', 'infantry', 'sentry', 'drone'],
    showOnAttacker: false,
    showOnTarget: true,
  },
  {
    key: 'trapezoid_highland',
    label: '梯形高地',
    description: '50% 防御 ',
    damageDealtMult: 1.0,
    damageTakenMult: 0.5,
    coolingMult: 1.0,
    hitProbabilityMult: 1.0,
    attackerRoles: [],
    targetUnits: ROBOT_TARGETS,
    showOnAttacker: false,
    showOnTarget: true,
  },
  {
    key: 'terrain_highland_defense',
    label: '地形跨越（高地）',
    description: '25% 防御，当前按已触发后持续生效对比 ',
    damageDealtMult: 1.0,
    damageTakenMult: 0.75,
    coolingMult: 1.0,
    hitProbabilityMult: 1.0,
    attackerRoles: [],
    targetUnits: ['hero', 'infantry', 'sentry', 'drone', 'engineer'],
    showOnAttacker: false,
    showOnTarget: true,
  },
  {
    key: 'terrain_fly_slope_defense',
    label: '地形跨越（飞坡）',
    description: '25% 防御，当前按已触发后持续生效对比 ',
    damageDealtMult: 1.0,
    damageTakenMult: 0.75,
    coolingMult: 1.0,
    hitProbabilityMult: 1.0,
    attackerRoles: [],
    targetUnits: ['hero', 'infantry', 'sentry', 'drone', 'engineer'],
    showOnAttacker: false,
    showOnTarget: true,
  },
  {
    key: 'terrain_slope_defense',
    label: '地形跨越（隧道）',
    description: '50% 防御，+100% 冷却，当前按已触发后持续生效对比 ',
    damageDealtMult: 1.0,
    damageTakenMult: TUNNEL_DEFENSE_MULT,
    coolingMult: TUNNEL_COOLING_MULT,
    hitProbabilityMult: 1.0,
    attackerRoles: ['hero', 'infantry', 'sentry', 'drone'],
    targetUnits: ['hero', 'infantry', 'sentry', 'drone', 'engineer'],
    showOnAttacker: true,
    showOnTarget: true,
  },
  {
    key: 'energy_small_defense',
    label: '小能量机关护甲',
    description: '25% 防御 ',
    damageDealtMult: 1.0,
    damageTakenMult: 0.75,
    coolingMult: 1.0,
    hitProbabilityMult: 1.0,
    attackerRoles: [],
    targetUnits: ['hero', 'infantry', 'sentry', 'drone', 'engineer'],
    showOnAttacker: false,
    showOnTarget: true,
  },
  {
    key: 'radar_vulnerability',
    label: '雷达易伤',
    description: '25% 易伤 ',
    damageDealtMult: 1.0,
    damageTakenMult: 1.25,
    coolingMult: 1.0,
    hitProbabilityMult: 1.0,
    attackerRoles: [],
    targetUnits: ROBOT_TARGETS,
    showOnAttacker: false,
    showOnTarget: true,
  },
  {
    key: 'engineer_opening_defense',
    label: '工程开局防御',
    description: '工程开局前 180 秒的 50% 防御，当前按常驻对比 ',
    damageDealtMult: 1.0,
    damageTakenMult: 0.5,
    coolingMult: 1.0,
    hitProbabilityMult: 1.0,
    attackerRoles: [],
    targetUnits: ['engineer'],
    showOnAttacker: false,
    showOnTarget: true,
  },
];

const DAMAGE_SYSTEM = {
  base: {
    bullet_17mm: 20,
    bullet_17mm_front_upper: 5,
    bullet_42mm: 200,
  },
  outpost: {
    bullet_17mm: 20,
    bullet_42mm: 200,
  },
  robot: {
    bullet_17mm: 20,
    bullet_42mm: 200,
  },
  sentry: {
    bullet_17mm: 20,
    bullet_42mm: 200,
  },
};

const DEFAULT_FORM = {
  durationSec: 60,
  requestedFireRateHz: BASE_FIRE_RATE_HZ,
  initialHeat: 0,
  structureCritEnabled: false,
  structureCritChancePercent: STRUCTURE_CRIT_DEFAULT_PERCENT,
  attackerBaseHealthDelta: 0,
  attackerRole: 'sentry',
  attackerProfile: 'auto',
  attackerLevel: 1,
  attackerPosture: 'attack',
  targetUnit: 'outpost',
  targetProfile: '',
  targetLevel: 1,
  targetHealth: TARGET_DEFAULT_HEALTH.outpost,
  targetBaseHealthDelta: 0,
  targetPart: 'central_plate',
  hitProbabilityPercent: 100,
  attackerEffects: [],
  targetEffects: [],
};

function cloneConfig(value) {
  return JSON.parse(JSON.stringify(value));
}

function getUiConfig() {
  return cloneConfig({
    attackers: Object.entries(ROLE_CATALOG).map(([key, value]) => ({ key, label: value.label })),
    attackerCatalog: ROLE_CATALOG,
    targets: ['base', 'outpost', 'infantry', 'hero', 'sentry', 'drone', 'engineer'].map((key) => ({
      key,
      label: TARGET_LABELS[key],
      defaultHealth: resolveTargetPreset(key).maxHealth,
    })),
    targetParts: TARGET_PARTS,
    effects: EFFECTS,
    defaults: DEFAULT_FORM,
    notes: SAFE_MODEL_NOTE,
  });
}

export {
  BASE_FIRE_RATE_HZ,
  CHART_MAX_POINTS,
  DAMAGE_SYSTEM,
  DEFAULT_FORM,
  EFFECTS,
  FORT_COOLING_DIVISOR_HP,
  FORT_COOLING_MAX,
  FORT_RESERVE_AMMO_BASE,
  FORT_RESERVE_AMMO_DIVISOR_HP,
  FORT_RESERVE_AMMO_MAX,
  FORT_RESERVE_AMMO_STEP,
  HEAT_DETECTION_HZ,
  PROFILE_LABELS,
  ROLE_CATALOG,
  ROLE_LABELS,
  SAFE_MODEL_NOTE,
  SENTRY_POSTURES,
  STACKING_NOTE,
  STRUCTURE_CRIT_DEFAULT_PERCENT,
  STRUCTURE_CRIT_MAX_PERCENT,
  STRUCTURE_CRIT_MIN_PERCENT,
  STRUCTURE_CRIT_MULTIPLIER,
  STRUCTURE_CRIT_NOTE,
  STRUCTURE_CRIT_TARGETS,
  TARGET_DEFAULT_HEALTH,
  TARGET_LABELS,
  TARGET_PARTS,
  TARGET_TYPE_TO_DAMAGE_KEY,
  TUNNEL_COOLING_MULT,
  getUiConfig,
  resolveTargetPreset,
};
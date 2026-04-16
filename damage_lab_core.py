from __future__ import annotations

import io
import math
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import matplotlib

matplotlib.use('Agg')
import numpy as np
from matplotlib.backends.backend_agg import FigureCanvasAgg
from matplotlib.figure import Figure
from matplotlib import font_manager

from rules.rules_engine import RulesEngine


def _pick_chart_fonts() -> list[str]:
    preferred_fonts = ['Microsoft YaHei', 'SimHei', 'Noto Sans SC', 'DengXian', 'DejaVu Sans']
    available_fonts = {entry.name for entry in font_manager.fontManager.ttflist}
    resolved_fonts = [font_name for font_name in preferred_fonts if font_name in available_fonts]
    return resolved_fonts or ['DejaVu Sans']


matplotlib.rcParams['font.family'] = 'sans-serif'
matplotlib.rcParams['font.sans-serif'] = _pick_chart_fonts()
matplotlib.rcParams['axes.unicode_minus'] = False

PROJECT_ROOT = Path(__file__).resolve().parent
RULES_DIR = PROJECT_ROOT / '规则'
HEAT_DETECTION_HZ = 10.0
BASE_FIRE_RATE_HZ = 8.0
SAFE_MODEL_NOTE = '已选规则状态按整个仿真时长持续生效，并始终按不超热的安全控频发弹。'
STACKING_NOTE = '同类攻击/防御/易伤/冷却增益按规则只取最大效果，防御与易伤按净值合并。'
STRUCTURE_CRIT_NOTE = '结构暴击为分析器内的可选对比项，当前按期望伤害折算，不做逐发随机模拟。'
FORT_DEFENSE_MULT = 0.5
FORT_ENEMY_VULNERABILITY_MULT = 2.0
OUTPOST_DEFENSE_MULT = 0.5
ROAD_DEFENSE_MULT = 0.75
TUNNEL_DEFENSE_MULT = 0.5
TUNNEL_COOLING_MULT = 2.0
FORT_COOLING_DIVISOR_HP = 40.0
FORT_COOLING_MAX = 75.0
FORT_RESERVE_AMMO_BASE = 100
FORT_RESERVE_AMMO_DIVISOR_HP = 15.0
FORT_RESERVE_AMMO_STEP = 2
FORT_RESERVE_AMMO_MAX = 500
STRUCTURE_CRIT_MIN_PERCENT = 0.5
STRUCTURE_CRIT_MAX_PERCENT = 30.0
STRUCTURE_CRIT_DEFAULT_PERCENT = 5.0
STRUCTURE_CRIT_MULTIPLIER = 1.5
CHART_MAX_POINTS = 900
STRUCTURE_CRIT_TARGETS = {'base', 'outpost'}

_RULE_ENGINE = RulesEngine({})
RULES = _RULE_ENGINE.rules
DAMAGE_SYSTEM = _RULE_ENGINE.damage_system

ROLE_LABELS = {
    'hero': '英雄',
    'engineer': '工程',
    'infantry': '步兵',
    'sentry': '哨兵',
}

PROFILE_LABELS = {
    'melee_priority': '近战优先',
    'ranged_priority': '远程优先',
    'cooling_priority': '冷却优先',
    'burst_priority': '爆发优先',
    'auto': '全自动',
    'semi_auto': '半自动',
    'support': '工程作业',
}

TARGET_LABELS = {
    'base': '基地',
    'outpost': '前哨站',
    'infantry': '步兵',
    'hero': '英雄',
    'sentry': '哨兵',
    'engineer': '工程',
}

TARGET_DEFAULT_HEALTH = {
    'base': 2000.0,
    'outpost': 1500.0,
    'infantry': 200.0,
    'hero': 150.0,
    'sentry': 400.0,
    'engineer': 250.0,
}

TARGET_TYPE_TO_DAMAGE_KEY = {
    'base': 'base',
    'outpost': 'outpost',
    'infantry': 'robot',
    'hero': 'robot',
    'engineer': 'robot',
    'sentry': 'sentry',
}

TARGET_PART_OPTIONS = {
    'base': [
        {'key': 'normal_plate', 'label': '普通装甲板', 'damage_key': 'bullet_17mm', 'receive_ratio': 1.0},
        {'key': 'front_upper_plate', 'label': '上方装甲板', 'damage_key': 'bullet_17mm_front_upper', 'receive_ratio': 1.0},
        {'key': 'shield_closed', 'label': '护甲未展开', 'damage_key': 'blocked', 'receive_ratio': 0.0},
    ],
    'outpost': [
        {'key': 'central_plate', 'label': '中部装甲板', 'damage_key': 'bullet_17mm', 'receive_ratio': 120.0 / 360.0},
    ],
    'infantry': [{'key': 'armor_plate', 'label': '装甲模块', 'damage_key': 'bullet_17mm', 'receive_ratio': 1.0}],
    'hero': [{'key': 'armor_plate', 'label': '装甲模块', 'damage_key': 'bullet_17mm', 'receive_ratio': 1.0}],
    'sentry': [{'key': 'armor_plate', 'label': '装甲模块', 'damage_key': 'bullet_17mm', 'receive_ratio': 1.0}],
    'engineer': [{'key': 'armor_plate', 'label': '装甲模块', 'damage_key': 'bullet_17mm', 'receive_ratio': 1.0}],
}

SENTRY_POSTURES = {
    'mobile': {'label': '移动姿态', 'cooling_mult': 1.0, 'summary': '冷却 30/s '},
    'attack': {'label': '进攻姿态', 'cooling_mult': 3.0, 'summary': '冷却 90/s '},
    'defense': {'label': '防御姿态', 'cooling_mult': 1.0, 'summary': '冷却 30/s '},
}

ROBOT_TARGETS = {'hero', 'infantry', 'sentry', 'engineer'}

EFFECTS = [
    {
        'key': 'hero_deployment',
        'label': '英雄部署区',
        'description': '+50% 出伤，25% 防御，仅远程优先英雄。',
        'damage_dealt_mult': float(RULES['buff_zones']['buff_hero_deployment']['damage_dealt_mult']),
        'damage_taken_mult': float(RULES['buff_zones']['buff_hero_deployment']['damage_taken_mult']),
        'cooling_mult': 1.0,
        'hit_probability_mult': 1.0,
        'attacker_roles': ['hero'],
        'target_units': ['hero'],
        'show_on_attacker': True,
        'show_on_target': True,
    },
    {
        'key': 'fort',
        'label': '己方堡垒',
        'description': '50% 防御，额外冷却 w=floor(Δ/40) 且上限 75，仅步兵/哨兵。',
        'damage_dealt_mult': 1.0,
        'damage_taken_mult': FORT_DEFENSE_MULT,
        'cooling_mult': 1.0,
        'hit_probability_mult': 1.0,
        'attacker_roles': ['infantry', 'sentry'],
        'target_units': ['infantry', 'sentry'],
        'show_on_attacker': True,
        'show_on_target': True,
    },
    {
        'key': 'enemy_fort_exposed',
        'label': '敌方堡垒暴露',
        'description': '仅在比赛已过 3 分钟、对方前哨已毁且对方基地护甲未展开时生效，+100% 易伤。',
        'damage_dealt_mult': 1.0,
        'damage_taken_mult': FORT_ENEMY_VULNERABILITY_MULT,
        'cooling_mult': 1.0,
        'hit_probability_mult': 1.0,
        'attacker_roles': [],
        'target_units': ['infantry', 'sentry'],
        'show_on_attacker': False,
        'show_on_target': True,
    },
    {
        'key': 'terrain_road_defense',
        'label': '地形跨越（公路）',
        'description': '25% 防御，当前按已触发后持续生效对比。',
        'damage_dealt_mult': 1.0,
        'damage_taken_mult': ROAD_DEFENSE_MULT,
        'cooling_mult': 1.0,
        'hit_probability_mult': 1.0,
        'attacker_roles': [],
        'target_units': ['hero', 'infantry', 'sentry', 'engineer'],
        'show_on_attacker': False,
        'show_on_target': True,
    },
    {
        'key': 'energy_mechanism',
        'label': '中央能量机关',
        'description': '+15% 出伤，+20% 冷却。',
        'damage_dealt_mult': float(RULES['energy_mechanism']['damage_dealt_mult']),
        'damage_taken_mult': 1.0,
        'cooling_mult': float(RULES['energy_mechanism']['cooling_mult']),
        'hit_probability_mult': 1.0,
        'attacker_roles': ['hero', 'infantry', 'sentry'],
        'target_units': [],
        'show_on_attacker': True,
        'show_on_target': False,
    },
    {
        'key': 'respawn_weak',
        'label': '复活虚弱',
        'description': '攻击方 -30% 出伤；受击方 +15% 易伤。',
        'damage_dealt_mult': float(RULES['respawn']['weaken_damage_dealt_mult']),
        'damage_taken_mult': float(RULES['respawn']['weaken_damage_taken_mult']),
        'cooling_mult': 1.0,
        'hit_probability_mult': 1.0,
        'attacker_roles': ['hero', 'infantry', 'sentry'],
        'target_units': list(ROBOT_TARGETS),
        'show_on_attacker': True,
        'show_on_target': True,
    },
    {
        'key': 'base_buff',
        'label': '基地增益点',
        'description': '50% 防御。',
        'damage_dealt_mult': 1.0,
        'damage_taken_mult': float(RULES['buff_zones']['buff_base']['damage_taken_mult']),
        'cooling_mult': 1.0,
        'hit_probability_mult': 1.0,
        'attacker_roles': [],
        'target_units': list(ROBOT_TARGETS),
        'show_on_attacker': False,
        'show_on_target': True,
    },
    {
        'key': 'outpost_buff',
        'label': '前哨增益点',
        'description': '50% 防御。',
        'damage_dealt_mult': 1.0,
        'damage_taken_mult': OUTPOST_DEFENSE_MULT,
        'cooling_mult': 1.0,
        'hit_probability_mult': 1.0,
        'attacker_roles': [],
        'target_units': ['hero', 'infantry', 'sentry', 'engineer'],
        'show_on_attacker': False,
        'show_on_target': True,
    },
    {
        'key': 'central_highland',
        'label': '中央高地',
        'description': '25% 防御。',
        'damage_dealt_mult': 1.0,
        'damage_taken_mult': float(RULES['buff_zones']['buff_central_highland']['damage_taken_mult']),
        'cooling_mult': 1.0,
        'hit_probability_mult': 1.0,
        'attacker_roles': [],
        'target_units': ['hero', 'infantry', 'sentry'],
        'show_on_attacker': False,
        'show_on_target': True,
    },
    {
        'key': 'trapezoid_highland',
        'label': '梯形高地',
        'description': '50% 防御。',
        'damage_dealt_mult': 1.0,
        'damage_taken_mult': float(RULES['buff_zones']['buff_trapezoid_highland']['damage_taken_mult']),
        'cooling_mult': 1.0,
        'hit_probability_mult': 1.0,
        'attacker_roles': [],
        'target_units': list(ROBOT_TARGETS),
        'show_on_attacker': False,
        'show_on_target': True,
    },
    {
        'key': 'terrain_highland_defense',
        'label': '地形跨越（高地）',
        'description': '25% 防御，当前按已触发后持续生效对比。',
        'damage_dealt_mult': 1.0,
        'damage_taken_mult': 0.75,
        'cooling_mult': 1.0,
        'hit_probability_mult': 1.0,
        'attacker_roles': [],
        'target_units': ['hero', 'infantry', 'sentry', 'engineer'],
        'show_on_attacker': False,
        'show_on_target': True,
    },
    {
        'key': 'terrain_fly_slope_defense',
        'label': '地形跨越（飞坡）',
        'description': '25% 防御，当前按已触发后持续生效对比。',
        'damage_dealt_mult': 1.0,
        'damage_taken_mult': 0.75,
        'cooling_mult': 1.0,
        'hit_probability_mult': 1.0,
        'attacker_roles': [],
        'target_units': ['hero', 'infantry', 'sentry', 'engineer'],
        'show_on_attacker': False,
        'show_on_target': True,
    },
    {
        'key': 'terrain_slope_defense',
        'label': '地形跨越（隧道）',
        'description': '50% 防御，+100% 冷却，当前按已触发后持续生效对比。',
        'damage_dealt_mult': 1.0,
        'damage_taken_mult': TUNNEL_DEFENSE_MULT,
        'cooling_mult': TUNNEL_COOLING_MULT,
        'hit_probability_mult': 1.0,
        'attacker_roles': ['hero', 'infantry', 'sentry'],
        'target_units': ['hero', 'infantry', 'sentry', 'engineer'],
        'show_on_attacker': True,
        'show_on_target': True,
    },
    {
        'key': 'energy_small_defense',
        'label': '小能量机关护甲',
        'description': '25% 防御。',
        'damage_dealt_mult': 1.0,
        'damage_taken_mult': float(RULES['energy_mechanism']['small_defense_mult']),
        'cooling_mult': 1.0,
        'hit_probability_mult': 1.0,
        'attacker_roles': [],
        'target_units': ['hero', 'infantry', 'sentry', 'engineer'],
        'show_on_attacker': False,
        'show_on_target': True,
    },
    {
        'key': 'radar_vulnerability',
        'label': '雷达易伤',
        'description': '25% 易伤。',
        'damage_dealt_mult': 1.0,
        'damage_taken_mult': float(RULES['radar']['vulnerability_mult']),
        'cooling_mult': 1.0,
        'hit_probability_mult': 1.0,
        'attacker_roles': [],
        'target_units': list(ROBOT_TARGETS),
        'show_on_attacker': False,
        'show_on_target': True,
    },
    {
        'key': 'engineer_opening_defense',
        'label': '工程开局防御',
        'description': '工程开局前 180 秒的 50% 防御，当前按常驻对比。',
        'damage_dealt_mult': 1.0,
        'damage_taken_mult': 0.5,
        'cooling_mult': 1.0,
        'hit_probability_mult': 1.0,
        'attacker_roles': [],
        'target_units': ['engineer'],
        'show_on_attacker': False,
        'show_on_target': True,
    },
]

EFFECT_LOOKUP = {effect['key']: effect for effect in EFFECTS}


@dataclass(frozen=True)
class AnalysisInput:
    duration_sec: float
    requested_fire_rate_hz: float
    initial_heat: float
    structure_crit_enabled: bool
    structure_crit_chance_percent: float
    attacker_base_health_delta: float
    attacker_role: str
    attacker_profile: str
    attacker_level: int
    attacker_posture: str
    attacker_effects: tuple[str, ...]
    target_unit: str
    target_health: float
    target_base_health_delta: float
    target_part: str
    hit_probability_percent: float
    target_effects: tuple[str, ...]


@dataclass
class AnalysisResult:
    time_axis: np.ndarray
    dps_curve: np.ndarray
    dpm_curve: np.ndarray
    total_damage_curve: np.ndarray
    received_damage_curve: np.ndarray
    target_health_curve: np.ndarray
    heat_curve: np.ndarray
    shots_curve: np.ndarray
    total_shots: int
    actual_fire_rate_hz: float
    avg_dps: float
    avg_received_dps: float
    peak_dps: float
    ttk_sec: float | None
    effective_receive_ratio: float
    peak_heat: float
    final_heat: float
    max_heat: float
    effective_cooling_rate: float
    single_shot_damage: float
    expected_total_damage: float
    structure_crit_enabled: bool
    structure_crit_chance_percent: float
    structure_crit_multiplier: float
    structure_crit_expected_mult: float
    target_label: str
    target_part_label: str
    attacker_label: str
    attacker_profile_label: str
    posture_label: str
    ammo_type_label: str
    attacker_effect_labels: list[str]
    target_effect_labels: list[str]
    notes: list[str]


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def _normalize_text(value: Any) -> str:
    return str(value or '').strip()


def _sorted_level_keys(table: dict[str, Any]) -> list[int]:
    return sorted(int(key) for key in table.keys() if str(key).isdigit())


def _resolve_level_profile(table: dict[str, Any], level: int) -> dict[str, Any]:
    level = int(max(1, level))
    if str(level) in table:
        return dict(table[str(level)])
    levels = _sorted_level_keys(table)
    if not levels:
        return {}
    fallback = max([key for key in levels if key <= level] or [levels[0]])
    return dict(table[str(fallback)])


def _relative_path(path: Path) -> str:
    return path.relative_to(PROJECT_ROOT).as_posix()


def _build_role_catalog() -> dict[str, Any]:
    hero_modes = RULES['performance_profiles']['hero']['weapon_modes']
    infantry_modes = RULES['performance_profiles']['infantry']['gimbal_modes']
    sentry_modes = RULES['sentry']['modes']
    engineer_profile = RULES['robot_profiles']['engineer']

    def levelled_profile(profile_table: dict[str, Any], heat_per_shot: float, ammo_type: str, fallback_health: float, *, can_shoot: bool = True) -> dict[str, Any]:
        levels: dict[str, Any] = {}
        for level in _sorted_level_keys(profile_table):
            profile = dict(profile_table[str(level)])
            levels[str(level)] = {
                'maxHealth': float(profile.get('max_health', fallback_health)),
                'maxHeat': float(profile['max_heat']),
                'coolingRate': float(profile['heat_dissipation_rate']),
                'ammoType': ammo_type,
                'heatPerShot': heat_per_shot,
                'baseFireRateHz': BASE_FIRE_RATE_HZ,
                'canShoot': bool(can_shoot),
            }
        return levels

    return {
        'hero': {
            'label': ROLE_LABELS['hero'],
            'defaultProfile': 'ranged_priority',
            'defaultLevel': 1,
            'showProfileSelector': True,
            'showLevelSelector': True,
            'showPostureSelector': False,
            'profiles': {
                key: {
                    'label': PROFILE_LABELS[key],
                    'levels': levelled_profile(value, RULES['shooting']['heat_gain_42mm'], '42mm', TARGET_DEFAULT_HEALTH['hero']),
                }
                for key, value in hero_modes.items()
            },
        },
        'infantry': {
            'label': ROLE_LABELS['infantry'],
            'defaultProfile': 'cooling_priority',
            'defaultLevel': 1,
            'showProfileSelector': True,
            'showLevelSelector': True,
            'showPostureSelector': False,
            'profiles': {
                key: {
                    'label': PROFILE_LABELS[key],
                    'levels': levelled_profile(value, RULES['shooting']['heat_gain_17mm'], '17mm', TARGET_DEFAULT_HEALTH['infantry']),
                }
                for key, value in infantry_modes.items()
            },
        },
        'engineer': {
            'label': ROLE_LABELS['engineer'],
            'defaultProfile': 'support',
            'defaultLevel': 1,
            'showProfileSelector': False,
            'showLevelSelector': False,
            'showPostureSelector': False,
            'profiles': {
                'support': {
                    'label': PROFILE_LABELS['support'],
                    'levels': {
                        '1': {
                            'maxHealth': float(engineer_profile['max_health']),
                            'maxHeat': float(engineer_profile['max_heat']),
                            'coolingRate': float(engineer_profile['heat_dissipation_rate']),
                            'ammoType': str(engineer_profile.get('ammo_type', 'none')),
                            'heatPerShot': float(engineer_profile.get('heat_gain_per_shot', 0.0)),
                            'baseFireRateHz': float(engineer_profile.get('fire_rate_hz', 0.0)),
                            'canShoot': False,
                        }
                    },
                }
            },
        },
        'sentry': {
            'label': ROLE_LABELS['sentry'],
            'defaultProfile': 'auto',
            'defaultLevel': 1,
            'showProfileSelector': True,
            'showLevelSelector': False,
            'showPostureSelector': True,
            'profiles': {
                key: {
                    'label': PROFILE_LABELS[key],
                    'levels': {
                        '1': {
                            'maxHealth': float(value['max_health']),
                            'maxHeat': float(value['max_heat']),
                            'coolingRate': float(value['heat_dissipation_rate']),
                            'ammoType': '17mm',
                            'heatPerShot': float(RULES['shooting']['heat_gain_17mm']),
                            'baseFireRateHz': BASE_FIRE_RATE_HZ,
                            'canShoot': True,
                        }
                    },
                }
                for key, value in sentry_modes.items()
            },
            'postures': {
                key: {
                    'label': value['label'],
                    'coolingMult': float(value['cooling_mult']),
                    'summary': value['summary'],
                }
                for key, value in SENTRY_POSTURES.items()
            },
        },
    }


ROLE_CATALOG = _build_role_catalog()


def _build_rule_images() -> list[dict[str, str]]:
    candidates = [
        ('damage', '伤害机制', RULES_DIR / '伤害机制.png'),
        ('buff', '增益总览', RULES_DIR / '增益' / '总览.png'),
        ('buff', '增益 1', RULES_DIR / '增益' / '1.png'),
        ('buff', '增益 2', RULES_DIR / '增益' / '2.png'),
        ('buff', '增益 3', RULES_DIR / '增益' / '3.png'),
        ('buff', '增益 4', RULES_DIR / '增益' / '4.png'),
        ('hero', '英雄机制 1', RULES_DIR / '英雄机制' / '英雄1.png'),
        ('hero', '英雄机制 2', RULES_DIR / '英雄机制' / '英雄2.png'),
        ('sentry', '哨兵机制 1', RULES_DIR / '哨兵机制' / '哨兵1.png'),
        ('sentry', '哨兵机制 2', RULES_DIR / '哨兵机制' / '哨兵2.png'),
    ]
    images: list[dict[str, str]] = []
    for group, label, path in candidates:
        if path.exists():
            images.append({'group': group, 'label': label, 'path': _relative_path(path)})
    return images


RULE_IMAGE_CATALOG = _build_rule_images()


def _target_part_config(target_unit: str, target_part: str) -> dict[str, Any]:
    options = TARGET_PART_OPTIONS.get(target_unit, TARGET_PART_OPTIONS['infantry'])
    for option in options:
        if option['key'] == target_part:
            return dict(option)
    return dict(options[0])


def _resolve_attacker_profile(inputs: AnalysisInput) -> dict[str, Any]:
    role_config = ROLE_CATALOG[inputs.attacker_role]
    profile_config = role_config['profiles'][inputs.attacker_profile]
    level_key = str(inputs.attacker_level if role_config['showLevelSelector'] else 1)
    profile = dict(profile_config['levels'][level_key])
    posture = {'label': '常规姿态', 'coolingMult': 1.0, 'summary': ''}
    if inputs.attacker_role == 'sentry':
        posture = dict(role_config['postures'][inputs.attacker_posture])
        profile['coolingRate'] = float(profile['coolingRate']) * float(posture['coolingMult'])
    profile['label'] = role_config['label']
    profile['profileLabel'] = profile_config['label']
    profile['postureLabel'] = posture['label']
    profile['postureSummary'] = posture['summary']
    return profile


def _damage_key_for_ammo(target_part: dict[str, Any], ammo_type: str) -> str:
    if str(ammo_type).strip().lower() in {'', 'none'}:
        return 'blocked'
    if target_part['damage_key'] == 'blocked':
        return 'blocked'
    if ammo_type == '42mm':
        return 'bullet_42mm'
    return str(target_part['damage_key'])


def _base_damage(target_unit: str, target_part: dict[str, Any], ammo_type: str) -> float:
    key = _damage_key_for_ammo(target_part, ammo_type)
    if key == 'blocked':
        return 0.0
    damage_table_key = TARGET_TYPE_TO_DAMAGE_KEY[target_unit]
    return float(DAMAGE_SYSTEM[damage_table_key].get(key, 0.0))


def _effect_labels(effect_keys: tuple[str, ...]) -> list[str]:
    return [EFFECT_LOOKUP[key]['label'] for key in effect_keys if key in EFFECT_LOOKUP]


def _positive_effect_pct(multiplier: float) -> float:
    return max(0.0, float(multiplier) - 1.0)


def _negative_effect_pct(multiplier: float) -> float:
    return max(0.0, 1.0 - float(multiplier))


def _fort_cooling_bonus(base_health_delta: float) -> float:
    delta = max(0.0, float(base_health_delta))
    return min(FORT_COOLING_MAX, math.floor(delta / FORT_COOLING_DIVISOR_HP))


def _fort_reserve_ammo(base_health_delta: float) -> int:
    delta = max(0.0, float(base_health_delta))
    reserve_ammo = FORT_RESERVE_AMMO_BASE + FORT_RESERVE_AMMO_STEP * math.floor(delta / FORT_RESERVE_AMMO_DIVISOR_HP)
    return int(min(FORT_RESERVE_AMMO_MAX, reserve_ammo))


def _selected_effects(effect_keys: tuple[str, ...], side: str, owner_key: str) -> list[dict[str, Any]]:
    selected: list[dict[str, Any]] = []
    for effect_key in effect_keys:
        effect = EFFECT_LOOKUP.get(effect_key)
        if effect is None:
            continue
        if side == 'attacker' and owner_key in effect['attacker_roles'] and effect['show_on_attacker']:
            selected.append(effect)
        if side == 'target' and owner_key in effect['target_units'] and effect['show_on_target']:
            selected.append(effect)
    return selected


def _downsample_indices(length: int, max_points: int = CHART_MAX_POINTS) -> np.ndarray:
    if length <= max_points:
        return np.arange(length, dtype=int)
    indices = np.linspace(0, length - 1, num=max_points, dtype=int)
    return np.unique(indices)


def _build_chart_payload(result: AnalysisResult) -> dict[str, Any]:
    indices = _downsample_indices(int(result.time_axis.size))
    target_loss_curve = np.maximum(0.0, float(result.target_health_curve[0]) - result.target_health_curve)
    return {
        'timeSec': np.round(result.time_axis[indices], 3).tolist(),
        'dps': np.round(result.dps_curve[indices], 3).tolist(),
        'totalDamage': np.round(result.total_damage_curve[indices], 3).tolist(),
        'heat': np.round(result.heat_curve[indices], 3).tolist(),
        'receivedDamage': np.round(result.received_damage_curve[indices], 3).tolist(),
        'targetHealth': np.round(result.target_health_curve[indices], 3).tolist(),
        'targetLoss': np.round(target_loss_curve[indices], 3).tolist(),
        'shots': result.shots_curve[indices].astype(int).tolist(),
        'ttkSec': None if result.ttk_sec is None else round(float(result.ttk_sec), 3),
        'maxHeat': round(float(result.max_heat), 3),
        'structureCritEnabled': bool(result.structure_crit_enabled),
        'structureCritChancePercent': round(float(result.structure_crit_chance_percent), 3),
        'structureCritMultiplier': round(float(result.structure_crit_multiplier), 3),
        'structureCritExpectedMult': round(float(result.structure_crit_expected_mult), 6),
    }


def _build_combined_charts_payload(result: AnalysisResult) -> dict[str, Any]:
    indices = _downsample_indices(int(result.time_axis.size))
    time_sec = np.round(result.time_axis[indices], 3).tolist()
    target_loss_curve = np.maximum(0.0, float(result.target_health_curve[0]) - result.target_health_curve)
    marker_label = '当前时长内未归零' if result.ttk_sec is None else f'{result.ttk_sec:.2f}s 归零'
    return {
        'dps': {
            'title': 'DPS / DPM / 总伤害',
            'timeSec': time_sec,
            'values': {
                'dps': np.round(result.dps_curve[indices], 3).tolist(),
                'dpm': np.round(result.dpm_curve[indices], 3).tolist(),
                'totalDamage': np.round(result.total_damage_curve[indices], 3).tolist(),
            },
        },
        'heat': {
            'title': '热量 / 累计发弹',
            'timeSec': time_sec,
            'values': {
                'heat': np.round(result.heat_curve[indices], 3).tolist(),
                'shots': result.shots_curve[indices].astype(int).tolist(),
            },
            'referenceValue': round(float(result.max_heat), 3),
            'referenceLabel': '热量上限',
        },
        'receivedDamage': {
            'title': '累计受击 / 敌方血量',
            'timeSec': time_sec,
            'values': {
                'receivedDamage': np.round(result.received_damage_curve[indices], 3).tolist(),
                'targetHealth': np.round(result.target_health_curve[indices], 3).tolist(),
                'targetLoss': np.round(target_loss_curve[indices], 3).tolist(),
            },
            'markerTime': None if result.ttk_sec is None else round(float(result.ttk_sec), 3),
            'markerLabel': marker_label,
        },
    }


def _build_rate_curve(total_damage: np.ndarray, window_sec: float, dt: float) -> np.ndarray:
    window_samples = max(1, int(round(window_sec / max(dt, 1e-9))))
    shifted = np.zeros_like(total_damage)
    shifted[window_samples:] = total_damage[:-window_samples]
    return (total_damage - shifted) / max(window_sec, 1e-9)


def parse_analysis_input(payload: dict[str, Any]) -> AnalysisInput:
    role = _normalize_text(payload.get('attackerRole') or 'sentry')
    if role not in ROLE_CATALOG:
        raise ValueError('攻击方兵种无效。')

    role_config = ROLE_CATALOG[role]
    attacker_profile = _normalize_text(payload.get('attackerProfile') or role_config['defaultProfile'])
    if attacker_profile not in role_config['profiles']:
        raise ValueError('攻击方配置无效。')

    attacker_level = int(payload.get('attackerLevel') or role_config['defaultLevel'])
    if role_config['showLevelSelector']:
        available_levels = {int(level) for level in role_config['profiles'][attacker_profile]['levels'].keys()}
        if attacker_level not in available_levels:
            raise ValueError('攻击方等级无效。')
    else:
        attacker_level = 1

    attacker_posture = _normalize_text(payload.get('attackerPosture') or 'mobile')
    if role == 'sentry':
        if attacker_posture not in role_config['postures']:
            raise ValueError('哨兵姿态无效。')
    else:
        attacker_posture = 'mobile'

    target_unit = _normalize_text(payload.get('targetUnit') or 'outpost')
    if target_unit not in TARGET_LABELS:
        raise ValueError('受击单位无效。')

    target_part = _normalize_text(payload.get('targetPart') or TARGET_PART_OPTIONS[target_unit][0]['key'])
    valid_target_part_keys = {item['key'] for item in TARGET_PART_OPTIONS[target_unit]}
    if target_part not in valid_target_part_keys:
        raise ValueError('受击部位无效。')

    duration_sec = float(payload.get('durationSec') or 180.0)
    requested_fire_rate_hz = float(payload.get('requestedFireRateHz') or BASE_FIRE_RATE_HZ)
    target_health = float(payload.get('targetHealth') or TARGET_DEFAULT_HEALTH[target_unit])
    structure_crit_enabled = bool(payload.get('structureCritEnabled', False))
    structure_crit_chance_percent = float(payload.get('structureCritChancePercent') or STRUCTURE_CRIT_DEFAULT_PERCENT)
    attacker_base_health_delta = float(payload.get('attackerBaseHealthDelta') or 0.0)
    target_base_health_delta = float(payload.get('targetBaseHealthDelta') or 0.0)
    hit_probability_percent = float(payload.get('hitProbabilityPercent') or 100.0)
    initial_heat = float(payload.get('initialHeat') or 0.0)

    if not math.isfinite(duration_sec) or duration_sec <= 0.0:
        raise ValueError('仿真时长需要大于 0。')
    if duration_sec > 1800.0:
        raise ValueError('仿真时长建议不要超过 1800 秒。')
    if not math.isfinite(requested_fire_rate_hz) or requested_fire_rate_hz < 0.0:
        raise ValueError('请求射速需要大于等于 0。')
    if requested_fire_rate_hz > 30.0:
        raise ValueError('请求射速超过 30 Hz，已超出这个规则对比工具的分析范围。')
    if not math.isfinite(target_health) or target_health <= 0.0:
        raise ValueError('目标血量需要大于 0。')
    if structure_crit_enabled:
        if target_unit not in STRUCTURE_CRIT_TARGETS:
            structure_crit_enabled = False
        elif not math.isfinite(structure_crit_chance_percent):
            raise ValueError('结构暴击概率无效。')
        elif structure_crit_chance_percent < STRUCTURE_CRIT_MIN_PERCENT or structure_crit_chance_percent > STRUCTURE_CRIT_MAX_PERCENT:
            raise ValueError('结构暴击概率需要在 0.5% 到 30% 之间。')
    if not math.isfinite(attacker_base_health_delta) or attacker_base_health_delta < 0.0:
        raise ValueError('攻击方堡垒 Δ 需要大于等于 0。')
    if not math.isfinite(target_base_health_delta) or target_base_health_delta < 0.0:
        raise ValueError('受击方堡垒 Δ 需要大于等于 0。')
    if not math.isfinite(hit_probability_percent):
        raise ValueError('有效受击概率无效。')

    attacker_profile_data = _resolve_attacker_profile(
        AnalysisInput(
            duration_sec=duration_sec,
            requested_fire_rate_hz=requested_fire_rate_hz,
            initial_heat=initial_heat,
            structure_crit_enabled=structure_crit_enabled,
            structure_crit_chance_percent=structure_crit_chance_percent,
            attacker_base_health_delta=attacker_base_health_delta,
            attacker_role=role,
            attacker_profile=attacker_profile,
            attacker_level=attacker_level,
            attacker_posture=attacker_posture,
            attacker_effects=(),
            target_unit=target_unit,
            target_health=target_health,
            target_base_health_delta=target_base_health_delta,
            target_part=target_part,
            hit_probability_percent=hit_probability_percent,
            target_effects=(),
        )
    )
    max_heat = float(attacker_profile_data['maxHeat'])
    if not math.isfinite(initial_heat) or initial_heat < 0.0:
        raise ValueError('初始热量需要大于等于 0。')
    if initial_heat > max_heat:
        raise ValueError('初始热量不能超过当前兵种配置的热量上限。')

    attacker_effects = tuple(dict.fromkeys(str(item) for item in payload.get('attackerEffects', []) if str(item)))
    target_effects = tuple(dict.fromkeys(str(item) for item in payload.get('targetEffects', []) if str(item)))

    return AnalysisInput(
        duration_sec=duration_sec,
        requested_fire_rate_hz=requested_fire_rate_hz,
        initial_heat=initial_heat,
        structure_crit_enabled=structure_crit_enabled,
        structure_crit_chance_percent=structure_crit_chance_percent,
        attacker_base_health_delta=attacker_base_health_delta,
        attacker_role=role,
        attacker_profile=attacker_profile,
        attacker_level=attacker_level,
        attacker_posture=attacker_posture,
        attacker_effects=attacker_effects,
        target_unit=target_unit,
        target_health=target_health,
        target_base_health_delta=target_base_health_delta,
        target_part=target_part,
        hit_probability_percent=_clamp(hit_probability_percent, 0.0, 100.0),
        target_effects=target_effects,
    )


def run_analysis(inputs: AnalysisInput) -> AnalysisResult:
    attacker_profile = _resolve_attacker_profile(inputs)
    target_part = _target_part_config(inputs.target_unit, inputs.target_part)
    attacker_effects = _selected_effects(inputs.attacker_effects, side='attacker', owner_key=inputs.attacker_role)
    target_effects = _selected_effects(inputs.target_effects, side='target', owner_key=inputs.target_unit)
    can_shoot = bool(attacker_profile.get('canShoot', True))

    attack_bonus_pct = max((_positive_effect_pct(effect['damage_dealt_mult']) for effect in attacker_effects), default=0.0)
    attack_penalty_pct = max((_negative_effect_pct(effect['damage_dealt_mult']) for effect in attacker_effects), default=0.0)
    hit_bonus_pct = max((_positive_effect_pct(effect['hit_probability_mult']) for effect in attacker_effects), default=0.0)
    hit_penalty_pct = max((_negative_effect_pct(effect['hit_probability_mult']) for effect in attacker_effects), default=0.0)
    cooling_bonus_pct = max((_positive_effect_pct(effect['cooling_mult']) for effect in attacker_effects), default=0.0)
    cooling_penalty_pct = max((_negative_effect_pct(effect['cooling_mult']) for effect in attacker_effects), default=0.0)
    defense_bonus_pct = max((_negative_effect_pct(effect['damage_taken_mult']) for effect in target_effects), default=0.0)
    vulnerability_bonus_pct = max((_positive_effect_pct(effect['damage_taken_mult']) for effect in target_effects), default=0.0)

    damage_dealt_mult = max(0.0, 1.0 + attack_bonus_pct - attack_penalty_pct)
    hit_probability_mult = max(0.0, 1.0 + hit_bonus_pct - hit_penalty_pct)
    damage_taken_mult = max(0.0, 1.0 - defense_bonus_pct + vulnerability_bonus_pct)
    structure_crit_expected_mult = 1.0
    if inputs.structure_crit_enabled and inputs.target_unit in STRUCTURE_CRIT_TARGETS and target_part['damage_key'] != 'blocked':
        structure_crit_expected_mult = 1.0 + inputs.structure_crit_chance_percent / 100.0 * (STRUCTURE_CRIT_MULTIPLIER - 1.0)

    base_damage = _base_damage(inputs.target_unit, target_part, str(attacker_profile['ammoType']))
    single_shot_damage = base_damage * damage_dealt_mult * damage_taken_mult * structure_crit_expected_mult
    effective_receive_ratio = _clamp(
        inputs.hit_probability_percent / 100.0 * float(target_part['receive_ratio']) * hit_probability_mult,
        0.0,
        1.0,
    )
    base_cooling_rate = float(attacker_profile['coolingRate'])
    cooling_mult = max(0.0, 1.0 + cooling_bonus_pct - cooling_penalty_pct)
    effective_cooling_rate = base_cooling_rate * cooling_mult
    if any(effect['key'] == 'fort' for effect in attacker_effects):
        effective_cooling_rate = max(effective_cooling_rate, base_cooling_rate + _fort_cooling_bonus(inputs.attacker_base_health_delta))
    max_heat = float(attacker_profile['maxHeat'])
    heat_per_shot = float(attacker_profile['heatPerShot'])

    dt = 0.01 if inputs.duration_sec <= 600.0 else 0.02
    time_axis = np.arange(0.0, inputs.duration_sec + dt * 0.5, dt, dtype=float)
    total_damage_curve = np.zeros_like(time_axis)
    received_damage_curve = np.zeros_like(time_axis)
    target_health_curve = np.zeros_like(time_axis)
    heat_curve = np.zeros_like(time_axis)
    shots_curve = np.zeros_like(time_axis, dtype=int)

    heat = _clamp(inputs.initial_heat, 0.0, max_heat)
    effective_requested_fire_rate_hz = 0.0 if not can_shoot else float(inputs.requested_fire_rate_hz)
    shot_interval = math.inf if effective_requested_fire_rate_hz <= 1e-9 else 1.0 / effective_requested_fire_rate_hz
    next_shot_time = 0.0 if math.isfinite(shot_interval) else math.inf
    next_cooling_tick_time = 1.0 / HEAT_DETECTION_HZ

    total_shots = 0
    total_damage = 0.0
    total_received_damage = 0.0
    peak_heat = heat

    for index, current_time in enumerate(time_axis):
        while next_shot_time <= current_time + 1e-9:
            if math.isfinite(shot_interval) and heat + heat_per_shot <= max_heat + 1e-9:
                total_shots += 1
                total_damage += single_shot_damage
                total_received_damage += single_shot_damage * effective_receive_ratio
                heat += heat_per_shot
                peak_heat = max(peak_heat, heat)
            next_shot_time += shot_interval

        while next_cooling_tick_time <= current_time + 1e-9:
            heat = max(0.0, heat - effective_cooling_rate / HEAT_DETECTION_HZ)
            next_cooling_tick_time += 1.0 / HEAT_DETECTION_HZ

        total_damage_curve[index] = total_damage
        received_damage_curve[index] = total_received_damage
        target_health_curve[index] = max(0.0, inputs.target_health - total_received_damage)
        heat_curve[index] = heat
        shots_curve[index] = total_shots

    dps_curve = _build_rate_curve(total_damage_curve, window_sec=1.0, dt=dt)
    dpm_curve = dps_curve * 60.0
    actual_fire_rate_hz = total_shots / max(inputs.duration_sec, 1e-9)
    avg_dps = float(total_damage_curve[-1] / max(inputs.duration_sec, 1e-9))
    avg_received_dps = float(received_damage_curve[-1] / max(inputs.duration_sec, 1e-9))
    peak_dps = float(np.max(dps_curve)) if dps_curve.size else 0.0

    ttk_sec = None
    zero_indices = np.where(target_health_curve <= 1e-9)[0]
    if zero_indices.size > 0:
        ttk_sec = float(time_axis[int(zero_indices[0])])

    notes = [SAFE_MODEL_NOTE, STACKING_NOTE]
    if inputs.attacker_role == 'sentry':
        notes.append(str(attacker_profile['postureSummary']))
    if not can_shoot:
        notes.append('当前攻击方按无发射机构处理，仅输出静态热量与目标血量基线。')
    if inputs.target_unit == 'outpost':
        notes.append('前哨站按 120° 可击打窗口折算。')
    if inputs.target_unit == 'base' and inputs.target_part == 'shield_closed':
        notes.append('基地护甲未展开时按不可受击处理。')
    if inputs.structure_crit_enabled and inputs.target_unit in STRUCTURE_CRIT_TARGETS and target_part['damage_key'] != 'blocked':
        notes.append(
            f'结构暴击已开启：暴击率 {inputs.structure_crit_chance_percent:.1f}%，按 {STRUCTURE_CRIT_MULTIPLIER:.2f}x 期望伤害折算，当前等效倍率 {structure_crit_expected_mult:.4f}x。'
        )
        notes.append(STRUCTURE_CRIT_NOTE)
    if any(effect['key'] == 'fort' for effect in attacker_effects):
        fort_bonus = _fort_cooling_bonus(inputs.attacker_base_health_delta)
        reserve_ammo = _fort_reserve_ammo(inputs.attacker_base_health_delta)
        notes.append(f'攻击方己方堡垒按 Δ={inputs.attacker_base_health_delta:.0f} 计算：50% 防御，额外冷却 {fort_bonus:.0f}/s，储备允许发弹量 {reserve_ammo}。')
    if any(effect['key'] == 'fort' for effect in target_effects):
        reserve_ammo = _fort_reserve_ammo(inputs.target_base_health_delta)
        notes.append(f'受击方己方堡垒按 Δ={inputs.target_base_health_delta:.0f} 计算：50% 防御，储备允许发弹量 {reserve_ammo}。')
    if any(effect['key'] == 'enemy_fort_exposed' for effect in target_effects):
        notes.append('敌方堡垒暴露按“比赛已过 3 分钟、对方前哨已毁、对方基地护甲未展开”前提计算。')
    if any(effect['key'] == 'fort' for effect in attacker_effects + target_effects):
        notes.append('堡垒提供的储备允许发弹量当前仅展示规则值，未在本工具里单独截断总发弹。')

    ammo_type_label = '42mm' if str(attacker_profile['ammoType']) == '42mm' else '17mm'
    return AnalysisResult(
        time_axis=time_axis,
        dps_curve=dps_curve,
        dpm_curve=dpm_curve,
        total_damage_curve=total_damage_curve,
        received_damage_curve=received_damage_curve,
        target_health_curve=target_health_curve,
        heat_curve=heat_curve,
        shots_curve=shots_curve,
        total_shots=total_shots,
        actual_fire_rate_hz=actual_fire_rate_hz,
        avg_dps=avg_dps,
        avg_received_dps=avg_received_dps,
        peak_dps=peak_dps,
        ttk_sec=ttk_sec,
        effective_receive_ratio=effective_receive_ratio,
        peak_heat=float(peak_heat),
        final_heat=float(heat_curve[-1]),
        max_heat=max_heat,
        effective_cooling_rate=effective_cooling_rate,
        single_shot_damage=float(single_shot_damage),
        expected_total_damage=float(received_damage_curve[-1]),
        structure_crit_enabled=bool(inputs.structure_crit_enabled and inputs.target_unit in STRUCTURE_CRIT_TARGETS and target_part['damage_key'] != 'blocked'),
        structure_crit_chance_percent=float(inputs.structure_crit_chance_percent if inputs.structure_crit_enabled else 0.0),
        structure_crit_multiplier=float(STRUCTURE_CRIT_MULTIPLIER),
        structure_crit_expected_mult=float(structure_crit_expected_mult),
        target_label=TARGET_LABELS[inputs.target_unit],
        target_part_label=str(target_part['label']),
        attacker_label=ROLE_LABELS[inputs.attacker_role],
        attacker_profile_label=str(attacker_profile['profileLabel']),
        posture_label=str(attacker_profile['postureLabel']),
        ammo_type_label=ammo_type_label,
        attacker_effect_labels=_effect_labels(inputs.attacker_effects),
        target_effect_labels=_effect_labels(inputs.target_effects),
        notes=notes,
    )


def render_chart_png(result: AnalysisResult) -> bytes:
    figure = Figure(figsize=(12.8, 8.2), dpi=110, facecolor='#f7f1e3')
    figure.subplots_adjust(left=0.08, right=0.86, top=0.93, bottom=0.08, hspace=0.36)

    output_axis = figure.add_subplot(211)
    dpm_axis = output_axis.twinx()
    total_axis = output_axis.twinx()
    total_axis.spines['right'].set_position(('axes', 1.12))
    total_axis.set_frame_on(True)
    total_axis.patch.set_visible(False)

    target_axis = figure.add_subplot(212)
    heat_axis = target_axis.twinx()

    output_axis.set_title(f'{result.attacker_label} 理论出伤曲线', loc='left', fontsize=13, fontweight='bold')
    line_dps, = output_axis.plot(result.time_axis, result.dps_curve, color='#a63c32', linewidth=2.2, label='DPS')
    line_dpm, = dpm_axis.plot(result.time_axis, result.dpm_curve, color='#d97706', linewidth=1.9, linestyle='--', label='DPM')
    line_total, = total_axis.plot(result.time_axis, result.total_damage_curve, color='#2563eb', linewidth=2.3, label='总伤害')

    output_axis.set_xlabel('时间 / 秒')
    output_axis.set_ylabel('DPS', color='#a63c32')
    dpm_axis.set_ylabel('DPM', color='#d97706')
    total_axis.set_ylabel('累计伤害', color='#2563eb')
    output_axis.tick_params(axis='y', colors='#a63c32')
    dpm_axis.tick_params(axis='y', colors='#d97706')
    total_axis.tick_params(axis='y', colors='#2563eb')
    output_axis.grid(True, linestyle='--', linewidth=0.65, alpha=0.3)
    output_axis.legend(handles=[line_dps, line_dpm, line_total], loc='upper right', frameon=False)

    target_axis.set_title(f'{result.target_label} 受击与热量', loc='left', fontsize=13, fontweight='bold')
    line_hp, = target_axis.step(
        result.time_axis,
        result.target_health_curve,
        where='post',
        color='#18794e',
        linewidth=2.3,
        label='目标剩余血量',
    )
    target_axis.fill_between(result.time_axis, result.target_health_curve, color='#3b82f6', alpha=0.10)
    line_heat, = heat_axis.plot(result.time_axis, result.heat_curve, color='#7c3aed', linewidth=1.8, label='枪口热量')
    heat_axis.axhline(result.max_heat, color='#7c3aed', linestyle=':', linewidth=1.0, alpha=0.8)

    target_axis.set_xlabel('时间 / 秒')
    target_axis.set_ylabel('剩余血量', color='#18794e')
    heat_axis.set_ylabel('热量', color='#7c3aed')
    target_axis.tick_params(axis='y', colors='#18794e')
    heat_axis.tick_params(axis='y', colors='#7c3aed')
    target_axis.grid(True, linestyle='--', linewidth=0.65, alpha=0.3)
    target_axis.legend(handles=[line_hp, line_heat], loc='upper right', frameon=False)

    if result.ttk_sec is not None:
        target_axis.axvline(result.ttk_sec, color='#a63c32', linewidth=1.0, linestyle='--')
        target_axis.text(
            result.ttk_sec + max(result.time_axis[-1] * 0.015, 0.5),
            max(result.target_health_curve[0] * 0.06, 1.0),
            f'{result.ttk_sec:.2f}s 归零',
            color='#a63c32',
            fontsize=9,
        )
    else:
        target_axis.text(
            result.time_axis[-1] * 0.54,
            max(result.target_health_curve.max() * 0.08, 1.0),
            '当前时长内未归零',
            color='#475569',
            fontsize=10,
        )

    canvas = FigureCanvasAgg(figure)
    buffer = io.BytesIO()
    canvas.print_png(buffer)
    return buffer.getvalue()


def _effect_payload(effect: dict[str, Any]) -> dict[str, Any]:
    return {
        'key': effect['key'],
        'label': effect['label'],
        'description': effect['description'],
        'attackerRoles': effect['attacker_roles'],
        'targetUnits': effect['target_units'],
        'showOnAttacker': effect['show_on_attacker'],
        'showOnTarget': effect['show_on_target'],
    }


@lru_cache(maxsize=1)
def get_ui_config() -> dict[str, Any]:
    return {
        'attackers': [{'key': key, 'label': value['label']} for key, value in ROLE_CATALOG.items()],
        'attackerCatalog': ROLE_CATALOG,
        'targets': [
            {'key': key, 'label': TARGET_LABELS[key], 'defaultHealth': TARGET_DEFAULT_HEALTH[key]}
            for key in ['base', 'outpost', 'infantry', 'hero', 'sentry', 'engineer']
        ],
        'targetParts': TARGET_PART_OPTIONS,
        'effects': [_effect_payload(effect) for effect in EFFECTS],
        'ruleImages': RULE_IMAGE_CATALOG,
        'folders': [
            {'key': 'buff', 'label': '增益图片目录'},
            {'key': 'rules', 'label': '规则总目录'},
        ],
        'defaults': {
            'durationSec': 180,
            'requestedFireRateHz': BASE_FIRE_RATE_HZ,
            'initialHeat': 0,
            'structureCritEnabled': False,
            'structureCritChancePercent': STRUCTURE_CRIT_DEFAULT_PERCENT,
            'attackerBaseHealthDelta': 0,
            'attackerRole': 'sentry',
            'attackerProfile': 'auto',
            'attackerLevel': 1,
            'attackerPosture': 'attack',
            'targetUnit': 'outpost',
            'targetHealth': TARGET_DEFAULT_HEALTH['outpost'],
            'targetBaseHealthDelta': 0,
            'targetPart': 'central_plate',
            'hitProbabilityPercent': 100,
            'attackerEffects': [],
            'targetEffects': [],
        },
        'notes': SAFE_MODEL_NOTE,
    }


def result_to_payload(result: AnalysisResult) -> dict[str, Any]:
    ttk_text = '未在当前时长内归零'
    if result.ttk_sec is not None:
        ttk_text = f'{result.ttk_sec:.2f} 秒归零'
    sentry_posture_text = ''
    if result.attacker_label == '哨兵':
        sentry_posture_text = f' · {result.posture_label}'
    return {
        'cards': {
            'avgDps': f'{result.avg_dps:.2f}',
            'avgReceivedDps': f'{result.avg_received_dps:.2f}',
            'peakDps': f'{result.peak_dps:.2f}',
            'ttk': ttk_text,
            'actualFireRateHz': f'{result.actual_fire_rate_hz:.2f}',
            'totalShots': str(result.total_shots),
            'singleShotDamage': f'{result.single_shot_damage:.2f}',
            'coolingRate': f'{result.effective_cooling_rate:.2f}/s',
            'heat': f'{result.peak_heat:.1f} / {result.max_heat:.0f}',
            'receiveRatio': f'{result.effective_receive_ratio * 100.0:.2f}%',
        },
        'summaryLines': [
            f'{result.attacker_label} · {result.attacker_profile_label}{sentry_posture_text} · {result.ammo_type_label}',
            f'理论单发伤害 {result.single_shot_damage:.2f}，理论总出伤 {result.total_damage_curve[-1]:.2f}，折算受击总量 {result.expected_total_damage:.2f}。',
            f'实际发射 {result.total_shots} 发，等效频率 {result.actual_fire_rate_hz:.2f} Hz，热量峰值 {result.peak_heat:.1f}，结束热量 {result.final_heat:.1f}。',
            f'{result.target_label} · {result.target_part_label}，折算受击系数 {result.effective_receive_ratio * 100.0:.2f}%，结果 {ttk_text}。',
        ],
        'chart': _build_chart_payload(result),
        'charts': _build_combined_charts_payload(result),
        'resolved': {
            'attackerLabel': result.attacker_label,
            'attackerProfileLabel': result.attacker_profile_label,
            'postureLabel': result.posture_label,
            'targetLabel': result.target_label,
            'targetPartLabel': result.target_part_label,
            'ammoTypeLabel': result.ammo_type_label,
        },
        'attackerEffects': result.attacker_effect_labels,
        'targetEffects': result.target_effect_labels,
        'notes': result.notes,
    }
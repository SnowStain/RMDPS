(function () {
  'use strict';

  var appRoot = document.getElementById('app');
  var contentRoot = document.getElementById('appContent');

  if (!appRoot || !contentRoot || typeof buildPageState !== 'function' || typeof renderChart !== 'function') {
    return;
  }

  var state = {
    theme: 'dark',
    form: {},
    page: null,
    backdropExpanded: true,
    showFloatingTitle: false,
    hideUiForBackdrop: true,
    viewport: {
      output: { start: 0, end: 1 },
      target: { start: 0, end: 1 },
    },
    timelineDrag: null,
    drag: null,
    wheelDrag: null,
    exhibitDrag: null,
    wheelSnapTimer: null,
    backdropTransitionTimer: null,
    backdropTransitioning: false,
    backdropRevealing: false,
    backdropRevealTimer: 0,
    componentWheelAngle: 0,
    componentWheelIndex: 0,
    componentHint: '逐发 诊断出伤 + 曲线分析',
    anchorReady: false,
    anchorFreezePending: false,
    anchorFreezeRaf: 0,
    anchorFreezeFrames: 0,
    anchorStableFrames: 0,
    anchorLastMetrics: null,
    anchorRebuild: false,
    anchorRebuildTimer: 0,
    anchorSnapshot: null,
    wheelExpanded: false,
    wheelAssembling: false,
    wheelDissolving: false,
    wheelDissolveTimer: 0,
    wheelAssembleTimer: 0,
    wheelProtectionUntil: 0,
    wheelTriggerNearby: false,
    wheelTriggerBurst: false,
    wheelTriggerBurstTimer: 0,
    motionParticleTransition: false,
    motionParticleTimer: 0,
    motionParticleCooldownUntil: 0,
    cultureShowcaseCollapsed: false,
    sidebarCollapsed: true,
    quickNavKey: 'home',
    mainPageIndex: 0,
    mainPageWheelLockUntil: 0,
    uiLoadingRaf: 0,
    uiLoadingHideTimer: 0,
    uiLoadingStableRaf: 0,
    backdropVideoSwitchTimer: 0,
    themeExhibitRetryTimer: 0,
    mouseX: null,
    mouseY: null,
    floatingCheckRaf: 0,
    cultureSyncRaf: 0,
    wheelUiRaf: 0,
    pageSwitchOutTimer: 0,
    pageSwitchInTimer: 0,
    homePatternIndex: 0,
    homePatternDetailOpen: false,
    introduceView: 'catalog',
    introduceHoverIndex: -1,
    introducePointerX: null,
    introducePointerY: null,
    introduceFollowX: 0.5,
    introduceFollowY: 0.5,
    introduceFollowTargetX: 0.5,
    introduceFollowTargetY: 0.5,
    introduceFollowRaf: 0,
    introduceGroupKey: 'function',
    toolsCompactMode: false,
    layoutVarsSignature: '',
    layout: {
      wheel: { x: 50, y: 50 },
      exhibit: { x: 27, y: 52 },
      flow: { x: 25, y: 49 },
      bridge: { x: 50, y: 75 },
      floating: { x: 88, y: 92 },
    },
  };

  var EXHIBIT_IMAGE_SOURCES = [];
  var EXHIBIT_INTRODUCE_OVERVIEW_SOURCE = '../../assets/ARTINX-Laboratory/WhiteLogo.png';

  var EXHIBIT_IMAGE_CACHE = Object.create(null);

  var EXHIBIT_ROTATE_INTERVAL_MS = 8000;
  var FLOOD_DURATION_MS = 1000;
  var VIEW_MODE_QUERY_KEY = 'view';
  var VIEW_MODE_INDEX = 'index';
  var EXHIBIT_INTERACT_RADIUS = 300;
  var EXHIBIT_INTERACT_RADIUS_SQ = EXHIBIT_INTERACT_RADIUS * EXHIBIT_INTERACT_RADIUS;
  var EXHIBIT_GLOW_RADIUS = 300;
  var EXHIBIT_GLOW_RADIUS_SQ = EXHIBIT_GLOW_RADIUS * EXHIBIT_GLOW_RADIUS;
  var EXHIBIT_POINTER_ACTIVE_RADIUS_RATIO = 0.46;
  var EXHIBIT_POINTER_ACTIVE_RADIUS_MIN = 84;
  var EXHIBIT_ORBITER_MIN = 12;
  var EXHIBIT_ORBITER_MAX = 36;
  var ANCHOR_STABLE_FRAMES_REQUIRED = 5;
  var ANCHOR_FREEZE_MAX_FRAMES = 24;
  var MAIN_FOCUS_PAGES = ['home', 'tools', 'introduce', 'culture', 'more'];
  var MAIN_VIEW_KEYS = ['index', 'tools', 'introduce', 'culture', 'more'];
  var INTRODUCE_VIEW_CATALOG = 'catalog';
  var INTRODUCE_VIEW_PREVIEW = 'preview';
  var INTRODUCE_VIEW_DETAIL = 'detail';
  var INTRODUCE_GROUP_FUNCTION = 'function';
  var INTRODUCE_GROUP_ARMS = 'arms';
  var INTRODUCE_GROUP_PERSONNEL = 'personnel';
  var THEME_STORAGE_KEY = 'artinx-lab-theme';

  function getPatternImageThemeSuffix() {
    return state.theme === 'dark' ? 'light' : 'dark';
  }

  function getPatternImageSource(entryKey) {
    var key = String(entryKey || '').trim();
    if (!key) {
      return '';
    }
    return '../../assets/ARTINX-Laboratory/particlePattern/' + key + '-' + getPatternImageThemeSuffix() + '.png';
  }

  function refreshPatternEntryImages() {
    for (var i = 0; i < HOME_PATTERN_ENTRIES.length; i += 1) {
      var entry = HOME_PATTERN_ENTRIES[i];
      if (!entry || !entry.key) {
        continue;
      }
      entry.image = getPatternImageSource(entry.key);
    }
  }

  function syncExhibitImageSources() {
    EXHIBIT_IMAGE_SOURCES = HOME_PATTERN_ENTRIES
      .map(function (entry) {
        return entry && entry.image ? String(entry.image) : '';
      })
      .filter(function (src) {
        return !!src;
      });
  }

  var HOME_PATTERN_ENTRIES = [
    {
      key: 'dart',
      title: '飞镖',
      english: 'DART',
      image: getPatternImageSource('dart'),
      intro: '飞镖组负责超远距离快速打击与路径决策，强调一次出击效率与打击可靠性。',
    },
    {
      key: 'hero',
      title: '英雄',
      english: 'HERO',
      image: getPatternImageSource('hero'),
      intro: '英雄位承担高爆发主火力与关键点压制，需要兼顾机动、稳定和热管理。',
    },
    {
      key: 'operator',
      title: '宣运组',
      english: 'OPERATOR',
      image: getPatternImageSource('operator'),
      intro: '宣运组负责战队传播、视觉叙事与赛事呈现，输出统一且有辨识度的视觉语言。',
    },
    {
      key: 'rune',
      title: '能量机关',
      english: 'ENERGY',
      image: getPatternImageSource('rune'),
      intro: '能量机关方向聚焦任务判定链路与命中策略，强调识别精度、节奏与联动效率。',
    },
    {
      key: 'vision',
      title: '视觉组',
      english: 'VISION',
      image: getPatternImageSource('vision'),
      intro: '视觉组负责目标检测、状态估计与多源融合，为自动决策提供稳定的感知输入。',
    },
    {
      key: 'balance',
      title: '轮腿步兵',
      english: 'BALANCE',
      image: getPatternImageSource('balance'),
      intro: '轮腿步兵兼顾地形适应与机动推进，重点在运动控制、姿态稳定与火控耦合。',
    },
    {
      key: 'electronicControl',
      title: '电控组',
      english: 'EMBEDDED',
      image: getPatternImageSource('electronicControl'),
      intro: '电控组保障底层驱动与任务调度，构建实时可靠的控制链路与系统总线。',
    },
    {
      key: 'drone',
      title: '无人机',
      english: 'DRONE',
      image: getPatternImageSource('drone'),
      intro: '无人机方向关注空中侦察与辅助压制，强调航迹规划、机载识别与抗扰控制。',
    },
    {
      key: 'engineer',
      title: '工程',
      english: 'ENGINEER',
      image: getPatternImageSource('engineer'),
      intro: '工程位承担资源调度与任务执行，核心在路径规划、机构协作与动作可靠性。',
    },
    {
      key: 'machinery',
      title: '机械组',
      english: 'MECHANISM',
      image: getPatternImageSource('machinery'),
      intro: '机械组负责整机结构、传动设计与加工迭代，保证强度、重量与维护效率平衡。',
    },
    {
      key: 'radar',
      title: '雷达',
      english: 'RADAR',
      image: getPatternImageSource('radar'),
      intro: '雷达方向聚焦场地全局感知与信息回传，强调数据覆盖、时效和定位稳定性。',
    },
    {
      key: 'sentry',
      title: '哨兵',
      english: 'SENTRY',
      image: getPatternImageSource('sentry'),
      intro: '哨兵系统负责持续防守与自动火力输出，关键是长期稳定、抗干扰和策略切换。',
    },
  ];

  refreshPatternEntryImages();
  syncExhibitImageSources();

  var INTRODUCE_GROUPS = [
    {
      key: INTRODUCE_GROUP_FUNCTION,
      label: '职能组',
      entryKeys: ['machinery', 'electronicControl', 'vision', 'operator'],
    },
    {
      key: INTRODUCE_GROUP_ARMS,
      label: '兵种组',
      entryKeys: ['dart', 'hero', 'rune', 'balance', 'drone', 'engineer', 'radar', 'sentry'],
    },
    {
      key: INTRODUCE_GROUP_PERSONNEL,
      label: '技术人员',
      entryKeys: [],
    },
  ];

  var exhibitRuntime = {
    inited: false,
    rafId: 0,
    timerId: 0,
    zone: null,
    canvas: null,
    ctx: null,
    dpr: 1,
    width: 0,
    height: 0,
    mouseX: -9999,
    mouseY: -9999,
    particles: [],
    orbiters: [],
    slides: [],
    slideSourceToIndex: {},
    slideIndex: 0,
    moveHandler: null,
    leaveHandler: null,
    selectorOffsetPx: 0,
    selectorVelocityPx: 0,
    selectorRafId: 0,
    selectorSpacing: 74,
    selectorSuppressClickUntil: 0,
    selectorDragging: false,
    pointerLeft: 0,
    pointerTop: 0,
    loadToken: 0,
    overviewPoints: [],
    overviewSource: '',
    detailPointsBySource: {},
    introduceTransition: null,
    lastAppliedTargetKey: '',
  };

  var focusFlowRuntime = {
    canvas: null,
    ctx: null,
    dpr: 1,
    width: 0,
    height: 0,
    offsetLeft: 0,
    offsetTop: 0,
    particles: [],
    streams: [],
    bits: [],
    seededTheme: '',
  };

  var themeGradientRuntime = {
    theme: '',
    entries: [],
  };

  var COMPONENT_WHEEL_SLOTS = [
    {
      key: 'damage-lab',
      label: 'Damage Lab',
      title: 'Damage Studio',
      effectLine: '逐发 诊断出伤 + 曲线分析',
      detailLine: '分界面 · 伤害计算组件',
      shortLabel: 'DL',
      available: true,
    },
    {
      key: 'heat-lab',
      label: 'Heat Lab',
      title: 'Heat Studio',
      effectLine: '热管理专项（开发中）',
      detailLine: '将支持散热策略对比与热阈预警',
      shortLabel: 'HT',
      available: false,
    },
    {
      key: 'armor-lab',
      label: 'Armor Lab',
      title: 'Armor Matrix',
      effectLine: '装甲耦合分析（开发中）',
      detailLine: '将支持命中部位与姿态联动推演',
      shortLabel: 'AR',
      available: false,
    },
    {
      key: 'coming-soon',
      label: 'Coming Soon',
      title: 'Coming Soon',
      effectLine: '后续功能等待开发',
      detailLine: '可先拖动左轮预览后续模块形态',
      shortLabel: 'CS',
      available: false,
    },
    {
      key: 'tactic-lab',
      label: 'Tactic Lab',
      title: 'Tactic Deck',
      effectLine: '战术联动分析（开发中）',
      detailLine: '将支持状态时序与战术窗口回放',
      shortLabel: 'TC',
      available: false,
    },
    {
      key: 'ai-lab',
      label: 'AI Lab',
      title: 'Aiming Synth',
      effectLine: '瞄准仿真模块（开发中）',
      detailLine: '将支持命中概率分布与策略回归',
      shortLabel: 'AI',
      available: false,
    },
  ];

  var THEME_ASSETS = {
    darkLogo: '../../assets/ARTINX-Laboratory/DarkLogo.png',
    lightLogo: '../../assets/ARTINX-Laboratory/WhiteLogo.png',
    darkBackdropVideo: '../../assets/ARTINX-Laboratory/Dark1.mp4',
    lightBackdropVideo: '../../assets/ARTINX-Laboratory/White1.mp4',
    darkToolsBackdropVideo: '../../assets/ARTINX-Laboratory/tool_back_dark.mp4',
    lightToolsBackdropVideo: '../../assets/ARTINX-Laboratory/tool_back_white.mp4',
  };

  var DEFAULT_LAYOUT = {
    wheel: { x: 50, y: 50 },
    exhibit: { x: 27, y: 52 },
    flow: { x: 25, y: 49 },
    bridge: { x: 50, y: 75 },
    floating: { x: 88, y: 92 },
  };

  var NUMERIC_FIELDS = new Set([
    'requestedFireRateHz',
    'hitRatePercent',
    'hitRateStationaryPercent',
    'hitRateMovingPercent',
    'hitRateSpinnerPercent',
    'hitRateMovingSpinnerPercent',
    'initialHeat',
    'targetHealthPercent',
    'structureCritChancePercent',
    'targetWindowDegrees',
    'attackerLevel',
    'targetLevel',
  ]);

  var HIT_RATE_DETAIL_FIELDS = new Set([
    'hitRateStationaryPercent',
    'hitRateMovingPercent',
    'hitRateSpinnerPercent',
    'hitRateMovingSpinnerPercent',
  ]);

  var INT_FIELDS = new Set(['attackerLevel', 'targetLevel']);
  var FLOATING_OBSTRUCTION_SELECTOR = '.hero-title, .panel-title-inline, .chart-title, .section-label, .effect-title, .mini-label, .metric-value';

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toNumber(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clampPercent(value, fallback) {
    var numeric = toNumber(value, fallback);
    return Math.max(0, Math.min(100, numeric));
  }

  function getResolvedTargetMotionKey(formLike) {
    var form = formLike || state.form || {};
    var targetRole = String(form.targetRole || '');
    var targetPart = String(form.targetPart || '');
    if (targetRole === 'base') {
      return targetPart === 'front_upper_plate' ? 'moving' : 'stationary';
    }
    if (targetRole === 'outpost') {
      return 'spinner';
    }
    var motion = String(form.targetMotion || '');
    if (motion === 'stationary' || motion === 'moving' || motion === 'spinner' || motion === 'moving_spinner') {
      return motion;
    }
    return 'stationary';
  }

  function getHitRateFieldByMotionKey(motionKey) {
    if (motionKey === 'moving') {
      return 'hitRateMovingPercent';
    }
    if (motionKey === 'spinner') {
      return 'hitRateSpinnerPercent';
    }
    if (motionKey === 'moving_spinner') {
      return 'hitRateMovingSpinnerPercent';
    }
    return 'hitRateStationaryPercent';
  }

  function syncMainHitRateFromDetail() {
    var motionKey = getResolvedTargetMotionKey(state.form);
    var detailField = getHitRateFieldByMotionKey(motionKey);
    var fallback = toNumber(state.form.hitRatePercent, 100);
    state.form.hitRatePercent = clampPercent(state.form[detailField], fallback);
  }

  function applyMainHitRateToDetail(rawValue) {
    var motionKey = getResolvedTargetMotionKey(state.form);
    var detailField = getHitRateFieldByMotionKey(motionKey);
    var fallback = toNumber(state.form[detailField], toNumber(state.form.hitRatePercent, 100));
    var next = clampPercent(rawValue, fallback);
    state.form[detailField] = next;
    state.form.hitRatePercent = next;
  }

  function getOutpostWindowDefault(attackerRole) {
    if (typeof getDefaultOutpostWindowDegrees === 'function') {
      return toNumber(getDefaultOutpostWindowDegrees(attackerRole), 120);
    }
    if (attackerRole === 'hero') {
      return 360;
    }
    return 120;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function ensureArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function isDesktopLike() {
    return !!(window.matchMedia && window.matchMedia('(pointer:fine)').matches);
  }

  function shouldUseCompactToolsMode() {
    var width = window.innerWidth || document.documentElement.clientWidth || 0;
    var height = window.innerHeight || document.documentElement.clientHeight || 0;
    return width <= 1180 || (width <= 1366 && height <= 820);
  }

  function normalizeQuickNavKey(rawKey) {
    var key = String(rawKey || '').toLowerCase();
    return MAIN_FOCUS_PAGES.indexOf(key) >= 0 ? key : 'home';
  }

  function normalizeMainViewKey(rawMode) {
    var mode = String(rawMode || '').toLowerCase();
    if (mode === 'home') {
      mode = 'index';
    }
    return MAIN_VIEW_KEYS.indexOf(mode) >= 0 ? mode : VIEW_MODE_INDEX;
  }

  function normalizeIntroduceView(rawView) {
    var view = String(rawView || '').toLowerCase();
    if (view === INTRODUCE_VIEW_PREVIEW || view === INTRODUCE_VIEW_DETAIL) {
      return view;
    }
    return INTRODUCE_VIEW_CATALOG;
  }

  function normalizeIntroduceGroupKey(rawGroupKey) {
    var key = String(rawGroupKey || '').toLowerCase();
    return INTRODUCE_GROUPS.some(function (group) { return group.key === key; })
      ? key
      : INTRODUCE_GROUP_FUNCTION;
  }

  function getIntroduceGroupByKey(rawGroupKey) {
    var key = normalizeIntroduceGroupKey(rawGroupKey);
    for (var i = 0; i < INTRODUCE_GROUPS.length; i += 1) {
      if (INTRODUCE_GROUPS[i].key === key) {
        return INTRODUCE_GROUPS[i];
      }
    }
    return INTRODUCE_GROUPS[0];
  }

  function getIntroduceRowsByGroupKey(rawGroupKey) {
    var group = getIntroduceGroupByKey(rawGroupKey);
    var rows = [];

    ensureArray(group.entryKeys).forEach(function (entryKey) {
      var patternIndex = HOME_PATTERN_ENTRIES.findIndex(function (item) {
        return item && item.key === entryKey;
      });
      if (patternIndex >= 0) {
        rows.push({
          patternIndex: patternIndex,
          entry: HOME_PATTERN_ENTRIES[patternIndex],
        });
      }
    });

    if (!rows.length && group.key !== INTRODUCE_GROUP_PERSONNEL) {
      rows = HOME_PATTERN_ENTRIES.map(function (entry, patternIndex) {
        return {
          patternIndex: patternIndex,
          entry: entry,
        };
      });
    }

    return rows;
  }

  function getIntroduceRowIndex(rows, patternIndex) {
    var target = toNumber(patternIndex, -1);
    for (var i = 0; i < rows.length; i += 1) {
      if (rows[i] && rows[i].patternIndex === target) {
        return i;
      }
    }
    return -1;
  }

  function getExhibitSlideIndexByPatternIndex(patternIndex) {
    var safeIndex = toNumber(patternIndex, -1);
    if (safeIndex < 0 || safeIndex >= HOME_PATTERN_ENTRIES.length) {
      return -1;
    }
    var entry = HOME_PATTERN_ENTRIES[safeIndex];
    var source = entry && entry.image ? String(entry.image) : '';
    if (!source) {
      return -1;
    }
    if (exhibitRuntime && exhibitRuntime.slideSourceToIndex && Object.prototype.hasOwnProperty.call(exhibitRuntime.slideSourceToIndex, source)) {
      return toNumber(exhibitRuntime.slideSourceToIndex[source], -1);
    }
    return EXHIBIT_IMAGE_SOURCES.findIndex(function (src) {
      return String(src) === source;
    });
  }

  function setIntroduceView(rawView) {
    var previousView = normalizeIntroduceView(state.introduceView);
    state.introduceView = normalizeIntroduceView(rawView);
    if (state.introduceView === INTRODUCE_VIEW_DETAIL) {
      state.introduceHoverIndex = -1;
    }
    if (previousView !== state.introduceView && state.introduceView !== INTRODUCE_VIEW_DETAIL) {
      exhibitRuntime.introduceTransition = null;
      exhibitRuntime.lastAppliedTargetKey = '';
      exhibitRuntime.particles = [];
      exhibitRuntime.overviewPoints = [];
    }
    if (state.hideUiForBackdrop && normalizeQuickNavKey(state.quickNavKey) === 'introduce') {
      syncFocusLayoutByPage();
      applyLayoutVars(true);
      scheduleCultureExhibitSync();
      if (previousView !== state.introduceView && state.introduceView !== INTRODUCE_VIEW_DETAIL) {
        syncIntroduceExhibitTarget({ force: true });
      }
    }
  }

  function getIntroduceOverviewSource() {
    if (state.theme === 'dark' && THEME_ASSETS && THEME_ASSETS.darkLogo) {
      return String(THEME_ASSETS.darkLogo);
    }
    if (THEME_ASSETS && THEME_ASSETS.lightLogo) {
      return String(THEME_ASSETS.lightLogo);
    }
    return EXHIBIT_INTRODUCE_OVERVIEW_SOURCE;
  }

  function getIntroduceDetailExhibitAnchor() {
    var detailEntry = HOME_PATTERN_ENTRIES[toNumber(state.homePatternIndex, -1)] || null;
    var detailKey = detailEntry && detailEntry.key ? String(detailEntry.key) : '';
    var anchorMap = {
      machinery: { x: 14.4, y: 52.0 },
      electronicControl: { x: 15.0, y: 52.2 },
      vision: { x: 16.0, y: 52.1 },
      operator: { x: 14.8, y: 51.8 },
      dart: { x: 14.2, y: 52.0 },
      hero: { x: 16.4, y: 52.3 },
      rune: { x: 16.2, y: 52.8 },
      balance: { x: 15.4, y: 52.1 },
      drone: { x: 16.1, y: 52.4 },
      engineer: { x: 14.6, y: 52.2 },
      radar: { x: 15.6, y: 52.1 },
      sentry: { x: 15.8, y: 52.0 },
    };
    return anchorMap[detailKey] || { x: 15.4, y: 52.2 };
  }

  function loadThemePreference() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      var stored = String(window.localStorage.getItem(THEME_STORAGE_KEY) || '').toLowerCase();
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    } catch (error) {
      // ignore storage read errors
    }
    return null;
  }

  function saveThemePreference(nextTheme) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme === 'light' ? 'light' : 'dark');
    } catch (error) {
      // ignore storage write errors
    }
  }

  function getViewKeyByNavKey(navKey) {
    var normalized = normalizeQuickNavKey(navKey);
    if (normalized === 'home') {
      return 'index';
    }
    return normalized;
  }

  function getNavKeyByViewKey(viewKey) {
    var normalized = normalizeMainViewKey(viewKey);
    if (normalized === 'index') {
      return 'home';
    }
    return normalizeQuickNavKey(normalized);
  }

  function getMainPageIndexByNavKey(navKey) {
    var normalized = normalizeQuickNavKey(navKey);
    var index = MAIN_FOCUS_PAGES.indexOf(normalized);
    return index >= 0 ? index : 0;
  }

  function clearPageSwitchTimers() {
    if (state.pageSwitchOutTimer) {
      window.clearTimeout(state.pageSwitchOutTimer);
      state.pageSwitchOutTimer = 0;
    }
    if (state.pageSwitchInTimer) {
      window.clearTimeout(state.pageSwitchInTimer);
      state.pageSwitchInTimer = 0;
    }
  }

  function runPagePushTransition(nextKey, usePushState) {
    var targetKey = normalizeQuickNavKey(nextKey);
    var currentIndex = getMainPageIndexByNavKey(state.quickNavKey);
    var nextIndex = getMainPageIndexByNavKey(targetKey);
    var direction = nextIndex >= currentIndex ? 1 : -1;

    clearPageSwitchTimers();
    appRoot.style.setProperty('--page-push-direction', String(direction));
    appRoot.classList.remove('page-switch-in');
    appRoot.classList.add('page-switch-out');

    state.pageSwitchOutTimer = window.setTimeout(function () {
      state.pageSwitchOutTimer = 0;
      state.quickNavKey = targetKey;
      state.mainPageIndex = nextIndex;

      syncFocusPageVisualState();
      updateWheelFlyOffsetVars();
      renderMain();
      applyShellChrome();

      appRoot.classList.remove('page-switch-out');
      appRoot.classList.add('page-switch-in');
      state.pageSwitchInTimer = window.setTimeout(function () {
        state.pageSwitchInTimer = 0;
        appRoot.classList.remove('page-switch-in');
      }, 360);

      syncViewModeUrl(getViewKeyByNavKey(targetKey), usePushState !== false);
    }, 220);
  }

  function syncFocusLayoutByPage() {
    var key = normalizeQuickNavKey(state.quickNavKey);
    var wheelX = 50;
    var wheelY = 50;
    var exhibitX = 21;
    var exhibitY = 52;
    var flowX = 25;
    var flowY = 49;

    if (key === 'tools') {
      wheelX = 25;
      wheelY = 50;
      flowX = 50;
      flowY = 50;
    } else if (key === 'introduce') {
      var introduceView = normalizeIntroduceView(state.introduceView);
      if (introduceView === INTRODUCE_VIEW_DETAIL) {
        var detailAnchor = getIntroduceDetailExhibitAnchor();
        exhibitX = clamp(detailAnchor.x, 13.2, 16.8);
        exhibitY = clamp(detailAnchor.y, 50.8, 53.4);
      } else {
        exhibitX = 74;
        exhibitY = 53;
      }
      flowX = 64;
      flowY = 52;
    } else if (key === 'culture') {
      exhibitX = 52;
      exhibitY = 50;
      flowX = 50;
      flowY = 52;
    } else if (key === 'more') {
      flowX = 50;
      flowY = 52;
    }

    state.layout.wheel.x = wheelX;
    state.layout.wheel.y = wheelY;
    state.layout.exhibit.x = exhibitX;
    state.layout.exhibit.y = exhibitY;
    state.layout.flow.x = flowX;
    state.layout.flow.y = flowY;
  }

  function syncFocusPageVisualState(options) {
    var opts = options || {};
    if (!state.hideUiForBackdrop) {
      return;
    }

    state.quickNavKey = normalizeQuickNavKey(state.quickNavKey);
    state.mainPageIndex = getMainPageIndexByNavKey(state.quickNavKey);
    syncFocusLayoutByPage();

    state.toolsCompactMode = shouldUseCompactToolsMode();
    var shouldShowWheel = state.quickNavKey === 'tools' && !state.toolsCompactMode;
    if (shouldShowWheel) {
      if (!state.wheelExpanded && !state.wheelAssembling && !state.wheelDissolving) {
        beginWheelAssembly();
      }
    } else if (opts.instant) {
      hideWheelInstant();
    } else if (state.wheelExpanded && !state.wheelAssembling && !state.wheelDissolving) {
      beginWheelDissolve();
    }

    if (state.quickNavKey === 'culture') {
      state.cultureShowcaseCollapsed = false;
    }
  }

  function setFocusPageByKey(nextKey, usePushState) {
    var previousKey = normalizeQuickNavKey(state.quickNavKey);
    var normalized = normalizeQuickNavKey(nextKey);

    if (normalized === 'introduce' && previousKey !== 'introduce') {
      state.introduceHoverIndex = -1;
      setIntroduceView(INTRODUCE_VIEW_CATALOG);
    } else if (normalized !== 'introduce') {
      state.introduceHoverIndex = -1;
    }

    if (!state.hideUiForBackdrop) {
      applyBackdropViewMode(getViewKeyByNavKey(normalized), usePushState !== false);
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          syncFocusPageVisualState();
          updateWheelFlyOffsetVars();
          renderMain();
          applyShellChrome();
        });
      });
      return;
    }

    if (previousKey !== normalized) {
      runPagePushTransition(normalized, usePushState);
      return;
    }

    state.quickNavKey = normalized;
    state.mainPageIndex = getMainPageIndexByNavKey(normalized);
    syncFocusPageVisualState();
    updateWheelFlyOffsetVars();
    renderMain();
    applyShellChrome();
    syncViewModeUrl(getViewKeyByNavKey(normalized), usePushState !== false);
  }

  function isUiStableForLoading() {
    if (state.backdropTransitioning || state.backdropRevealing || state.anchorFreezePending || state.anchorRebuild) {
      return false;
    }
    if (state.hideUiForBackdrop && normalizeQuickNavKey(state.quickNavKey) === 'tools') {
      if (state.wheelAssembling || state.wheelDissolving || !state.wheelExpanded) {
        return false;
      }
    }
    return true;
  }

  function startGlobalLoadingOverlay(label, durationMs, onMiddle, options) {
    var overlay = document.getElementById('globalLoadingOverlay');
    var progressNode = document.getElementById('globalLoadingProgress');
    var percentNode = document.getElementById('globalLoadingPercent');
    var labelNode = document.getElementById('globalLoadingLabel');
    var duration = Math.max(400, toNumber(durationMs, 1100));
    var opts = options || {};
    var waitForStable = !!opts.waitForStable;
    var maxStableWaitMs = Math.max(600, toNumber(opts.maxStableWaitMs, 1600));
    var middleTriggered = false;
    var startAt = 0;
    var stableWaitStart = 0;
    var baseLabel = label || 'LOADING';

    if (!overlay || !progressNode || !percentNode || !labelNode) {
      if (typeof onMiddle === 'function') {
        onMiddle();
      }
      return;
    }

    if (state.uiLoadingRaf) {
      window.cancelAnimationFrame(state.uiLoadingRaf);
      state.uiLoadingRaf = 0;
    }
    if (state.uiLoadingStableRaf) {
      window.cancelAnimationFrame(state.uiLoadingStableRaf);
      state.uiLoadingStableRaf = 0;
    }
    if (state.uiLoadingHideTimer) {
      window.clearTimeout(state.uiLoadingHideTimer);
      state.uiLoadingHideTimer = 0;
    }

    labelNode.textContent = baseLabel + ' - 0%';
    overlay.classList.add('global-loading-overlay-visible');
    overlay.setAttribute('aria-hidden', 'false');
    progressNode.style.width = '0%';
    percentNode.textContent = '0%';

    function finalizeLoadingOverlay() {
      state.uiLoadingRaf = 0;
      state.uiLoadingHideTimer = window.setTimeout(function () {
        overlay.classList.remove('global-loading-overlay-visible');
        overlay.setAttribute('aria-hidden', 'true');
        state.uiLoadingHideTimer = 0;
      }, 180);
    }

    function tick(now) {
      if (!startAt) {
        startAt = now;
      }
      var elapsed = now - startAt;
      var p = Math.min(1, elapsed / duration);
      var eased = 1 - Math.pow(1 - p, 2.2);
      var percent = waitForStable ? Math.round(eased * 92) : Math.round(eased * 100);
      progressNode.style.width = String(percent) + '%';
      percentNode.textContent = String(percent) + '%';
      labelNode.textContent = baseLabel + ' - ' + String(percent) + '%';

      if (!middleTriggered && eased >= 0.42) {
        middleTriggered = true;
        if (typeof onMiddle === 'function') {
          onMiddle();
        }
      }

      if (p < 1) {
        state.uiLoadingRaf = window.requestAnimationFrame(tick);
        return;
      }

      if (waitForStable) {
        if (!stableWaitStart) {
          stableWaitStart = now;
        }
        if (!isUiStableForLoading() && now - stableWaitStart < maxStableWaitMs) {
          state.uiLoadingRaf = window.requestAnimationFrame(tick);
          return;
        }
        progressNode.style.width = '100%';
        percentNode.textContent = '100%';
        labelNode.textContent = baseLabel + ' - 100%';
      }

      finalizeLoadingOverlay();
    }

    state.uiLoadingRaf = window.requestAnimationFrame(tick);
  }

  function buildOptionList(options, selectedKey) {
    return ensureArray(options)
      .map(function (item) {
        var key = getOptionValue(item);
        var selected = key === String(selectedKey) ? ' selected' : '';
        return '<option value="' + escapeHtml(key) + '"' + selected + '>' + escapeHtml(item.label || key) + '</option>';
      })
      .join('');
  }

  function getOptionValue(option) {
    if (!option || typeof option !== 'object') {
      return '';
    }
    if (option.key != null) {
      return String(option.key);
    }
    if (option.value != null) {
      return String(option.value);
    }
    return '';
  }

  function getSelectedOptionIndex(options, selectedKey) {
    var optionList = ensureArray(options);
    if (!optionList.length) {
      return -1;
    }
    var target = String(selectedKey);
    for (var index = 0; index < optionList.length; index += 1) {
      if (getOptionValue(optionList[index]) === target) {
        return index;
      }
    }
    return -1;
  }

  function getSelectOptionsByField(field) {
    var page = state.page || {};
    switch (field) {
      case 'attackerRole':
        return ensureArray(page.attackerRoleOptions);
      case 'attackerProfile':
        return ensureArray(page.attackerProfileOptions);
      case 'attackerLevel':
        return ensureArray(page.attackerLevelOptions);
      case 'attackerPosture':
        return ensureArray(page.attackerPostureOptions);
      case 'targetRole':
        return ensureArray(page.targetRoleOptions);
      case 'targetProfile':
        return ensureArray(page.targetProfileOptions);
      case 'targetLevel':
        return ensureArray(page.targetLevelOptions);
      case 'targetPosture':
        return ensureArray(page.targetPostureOptions);
      case 'targetMotion':
        return ensureArray(page.targetMotionOptions);
      case 'targetPart':
        return ensureArray(page.targetPartOptions);
      default:
        return [];
    }
  }

  function renderSelect(field, options, selectedKey, extraAttrs) {
    var attrs = extraAttrs ? ' ' + extraAttrs : '';
    var optionList = ensureArray(options);
    var selectedIndex = getSelectedOptionIndex(optionList, selectedKey);
    var hasPrev = selectedIndex > 0;
    var hasNext = selectedIndex >= 0 && selectedIndex < optionList.length - 1;

    return (
      '<view class="picker-stepper-shell">'
      + '<button class="picker-stepper-btn picker-stepper-btn-prev' + (hasPrev ? '' : ' picker-stepper-btn-disabled') + '" type="button"'
      + ' data-action="select-step" data-field="' + escapeHtml(field) + '" data-direction="prev" data-disabled="' + (hasPrev ? 'false' : 'true') + '">◀</button>'
      + '<view class="picker-container">'
      + '<select data-field="' + escapeHtml(field) + '"' + attrs + '>'
      + buildOptionList(optionList, selectedKey)
      + '</select>'
      + '</view>'
      + '<button class="picker-stepper-btn picker-stepper-btn-next' + (hasNext ? '' : ' picker-stepper-btn-disabled') + '" type="button"'
      + ' data-action="select-step" data-field="' + escapeHtml(field) + '" data-direction="next" data-disabled="' + (hasNext ? 'false' : 'true') + '">▶</button>'
      + '</view>'
    );
  }

  function renderInlineSelect(options, selectedKey, attrs) {
    return (
      '<view class="picker-container">'
      + '<select ' + attrs + '>'
      + buildOptionList(options, selectedKey)
      + '</select>'
      + '</view>'
    );
  }

  function toneOfEffect(effect) {
    return effect && effect.tone ? effect.tone : 'neutral';
  }

  function renderEffectRows(rows, side) {
    return ensureArray(rows)
      .reduce(function (acc, row) {
        return acc.concat(ensureArray(row));
      }, [])
      .map(function (effect) {
            var badges = ensureArray(effect.badges)
              .map(function (badge) {
                var tone = badge.tone || 'neutral';
                return '<text class="effect-badge effect-badge-' + escapeHtml(tone) + '">' + escapeHtml(badge.text || '') + '</text>';
              })
              .join('');
            var segments = ensureArray(effect.descriptionSegments)
              .map(function (seg) {
                return '<text>' + escapeHtml(seg.text || '') + '</text>';
              })
              .join('');

            var variantPicker = '';
            if (effect.active && effect.hasVariants) {
              variantPicker = '<view class="timeline-picker effect-picker-inline">'
                + renderInlineSelect(
                  effect.variantOptions,
                  effect.variantOptions[effect.variantIndex] && effect.variantOptions[effect.variantIndex].key,
                  'data-action="effect-variant" data-side="' + side + '" data-effect-key="' + escapeHtml(effect.key) + '"'
                )
                + '</view>';
            }

            var durationPicker = '';
            if (effect.active && effect.hasDurationOptions) {
              durationPicker = '<view class="timeline-picker effect-picker-inline">'
                + renderInlineSelect(
                  effect.durationOptions,
                  effect.durationOptions[effect.durationIndex] && effect.durationOptions[effect.durationIndex].key,
                  'data-action="effect-duration" data-side="' + side + '" data-effect-key="' + escapeHtml(effect.key) + '"'
                )
                + '</view>';
            }

            var activeClass = effect.active ? ' effect-active' : '';
            if (effect.active && side === 'target') {
              activeClass += ' target-active';
            }

            var selectedTag = effect.active
              ? '<view class="effect-selected-indicator' + (side === 'target' ? ' target-indicator' : '') + '">已选中</view>'
              : '';

            var effectMeta = '';
            if (effect.active && (effect.variantLabel || effect.durationLabel || effect.timingText)) {
              var pieces = [];
              if (effect.variantLabel) pieces.push(effect.variantLabel);
              if (effect.durationLabel) pieces.push(effect.durationLabel);
              if (effect.timingText) pieces.push(effect.timingText);
              effectMeta = '<text class="effect-meta">' + escapeHtml(pieces.join(' · ')) + '</text>';
            }

            return (
              '<view class="effect-card' + activeClass + '" data-action="toggle-effect" data-side="' + side + '" data-key="' + escapeHtml(effect.key) + '">'
              + selectedTag
              + '<view class="effect-top">'
              + '<text class="effect-title">' + escapeHtml(effect.label) + '</text>'
              + '<text class="effect-pill effect-pill-' + escapeHtml(toneOfEffect(effect)) + '">' + escapeHtml(effect.category || '状态') + '</text>'
              + '</view>'
              + variantPicker
              + durationPicker
              + effectMeta
              + (badges ? '<view class="effect-badge-row">' + badges + '</view>' : '')
              + '<view class="effect-copy">' + (segments || '<text>' + escapeHtml(effect.description || '') + '</text>') + '</view>'
              + '</view>'
            );
      })
      .join('');
  }

  function renderTimelineRows(tracks, side, simStartPercent, simSpanPercent) {
    return ensureArray(tracks)
      .map(function (item) {
        var variantPicker = '';
        if (item.hasVariants) {
          variantPicker = '<view class="timeline-picker">'
            + renderInlineSelect(
              item.variantOptions,
              item.variantOptions[item.variantIndex] && item.variantOptions[item.variantIndex].key,
              'data-action="effect-variant" data-side="' + side + '" data-effect-key="' + escapeHtml(item.effectKey) + '"'
            )
            + '</view>';
        }

        var durationPicker = '';
        if (item.hasDurationOptions) {
          durationPicker = '<view class="timeline-picker">'
            + renderInlineSelect(
              item.durationOptions,
              item.durationOptions[item.durationIndex] && item.durationOptions[item.durationIndex].key,
              'data-action="effect-duration" data-side="' + side + '" data-effect-key="' + escapeHtml(item.effectKey) + '"'
            )
            + '</view>';
        }

        var preSeg = item.preSimPercent > 0
          ? '<view class="timeline-track-segment timeline-track-segment-pre' + (side === 'target' ? ' target-track-segment-pre' : '') + '" style="width: ' + item.preSimPercent + '%;"></view>'
          : '';
        var mainSeg = '<view class="timeline-track-segment timeline-track-segment-main' + (side === 'target' ? ' target-track-segment-main' : '') + '" style="left: ' + item.simOffsetPercent + '%; width: ' + item.simPercent + '%;"></view>';
        var postSeg = item.postSimPercent > 0
          ? '<view class="timeline-track-segment timeline-track-segment-post' + (side === 'target' ? ' target-track-segment-post' : '') + '" style="left: ' + item.postSimOffsetPercent + '%; width: ' + item.postSimPercent + '%;"></view>'
          : '';

        return (
          '<view class="timeline-row">'
          + '<view class="timeline-row-head">'
          + '<text class="effect-title">' + escapeHtml(item.displayLabel || item.label) + '</text>'
          + '<text class="effect-pill effect-pill-' + escapeHtml(item.tone || 'neutral') + '">' + escapeHtml(item.category || '状态') + '</text>'
          + '</view>'
          + variantPicker
          + durationPicker
          + '<text class="effect-meta">持续 ' + escapeHtml(item.durationSec) + 's，可拖动滑块调整开始时间</text>'
          + '<view class="timeline-track-bar timeline-track-bar-large">'
          + '<view class="timeline-sim-window" style="left: ' + simStartPercent + '%; width: ' + simSpanPercent + '%;"></view>'
          + '<view class="timeline-track-fill timeline-track-fill-draggable' + (side === 'target' ? ' target-track-fill' : '') + '" style="left: ' + item.startPercent + '%; width: ' + item.spanPercent + '%;"'
          + ' data-action="timeline-drag" data-side="' + side + '" data-effect-key="' + escapeHtml(item.effectKey) + '"'
          + ' data-timeline-min="' + escapeHtml(item.timelineMin) + '" data-timeline-max="' + escapeHtml(item.timelineMax) + '"'
          + ' data-start-sec="' + escapeHtml(item.startSec) + '" data-duration="' + escapeHtml(item.durationSec) + '">'
          + '<view class="timeline-track-segments">' + preSeg + mainSeg + postSeg + '</view>'
          + '<view class="timeline-track-handle"></view>'
          + '</view>'
          + '</view>'
          + '<view class="timeline-sim-nodes">'
          + '<text class="timeline-sim-node" style="left:' + simStartPercent + '%;"></text>'
          + '<text class="timeline-sim-node timeline-sim-node-end" style="left:' + (simStartPercent + simSpanPercent) + '%;"></text>'
          + '</view>'
          + '<view class="range-labels"><text>开始 ' + escapeHtml(item.startSec) + 's</text><text>结束 ' + escapeHtml(item.endSec) + 's</text></view>'
          + '</view>'
        );
      })
      .join('');
  }

  function getCardValue(cards, labelKey) {
    var item = ensureArray(cards).find(function (card) {
      return String(card && card.label || '').indexOf(labelKey) >= 0;
    });
    if (!item) {
      return null;
    }
    var numeric = parseFloat(String(item.value || '').replace(/[^\d.-]/g, ''));
    return Number.isFinite(numeric) ? numeric : null;
  }

  function buildBattleTaunt(analysis, form) {
    var cards = analysis && analysis.cards;
    var coreTaunt = analysis && analysis.taunt ? analysis.taunt : null;
    var hitRate = toNumber(form && form.hitRatePercent, 100);
    var avgDps = getCardValue(cards, '平均 DPS');
    var peakDps = getCardValue(cards, '峰值 DPS');
    var ttkText = analysis && analysis.charts && analysis.charts.target && analysis.charts.target.subtitle
      ? String(analysis.charts.target.subtitle)
      : '';
    var ttkSec = null;
    if (ttkText.indexOf('归零') >= 0) {
      var matched = ttkText.match(/([\d.]+)/);
      if (matched) {
        ttkSec = toNumber(matched[1], NaN);
      }
    }

    var hitLine = '命中率火力稳定，压制节奏在线。';
    if (hitRate < 45) {
      hitLine = '命中率像把子弹打成了许愿星，建议先把准星找回来。';
    } else if (hitRate < 70) {
      hitLine = '命中率还在热身，火力到账但有点飘。';
    } else if (hitRate >= 95) {
      hitLine = '命中率近乎锁头，对面护甲开始怀疑人生。';
    }

    var ttkLine = '归零速度一般，属于稳扎稳打节奏。';
    if (ttkSec == null || !Number.isFinite(ttkSec)) {
      ttkLine = '目标在当前时长内没归零，对面还在场上继续营业。';
    } else if (ttkSec < 10) {
      ttkLine = '归零速度凶狠，属于“刚露头就回家”的档位。';
    } else if (ttkSec < 22) {
      ttkLine = '归零效率不错，推进窗口足够舒服。';
    } else if (ttkSec > 40) {
      ttkLine = '归零时间偏长，建议补命中或抬高持续 DPS。';
    }

    var dpsLine = 'DPS曲线正常，输出尚可。';
    if (avgDps != null && peakDps != null) {
      if (avgDps < 40) {
        dpsLine = '平均 DPS 偏低，像在给对面做刮痧理疗。';
      } else if (avgDps > 120) {
        dpsLine = '平均 DPS 很硬，火力密度已经进入高压区。';
      } else {
        dpsLine = 'DPS手感平稳，持续压制能力在线。';
      }
      if (peakDps > avgDps * 2.1) {
        dpsLine += ' 峰值爆发很高，但要注意续航别掉。';
      }
    }

    var finalTitle = '嘴替';
    var finalLines = [hitLine, ttkLine, dpsLine];

    var warningLine = coreTaunt && coreTaunt.warningLine ? String(coreTaunt.warningLine).trim() : '';
    var heatOverlimitCount = getCardValue(cards, '超限锁管次数');
    if (heatOverlimitCount != null && heatOverlimitCount > 0) {
      var forcedWarningLine = '弹频那么高，给你模拟一下连发了哈哈';
      warningLine = warningLine || forcedWarningLine;
      if (!finalLines.includes(warningLine)) {
        finalLines.push(warningLine);
      }
    }

    return {
      title: finalTitle,
      lines: finalLines,
      warningLine: warningLine,
    };
  }

  function renderMetricRows(rows) {
    return ensureArray(rows)
      .reduce(function (acc, row) {
        return acc.concat(ensureArray(row));
      }, [])
      .map(function (item) {
        return '<view class="metric-card metric-card-' + escapeHtml(item.tone || 'neutral') + '"><text class="metric-label">' + escapeHtml(item.label) + '</text><text class="metric-value">' + escapeHtml(item.value) + '</text></view>';
      })
      .join('');
  }

  function renderSummaryHighlightRows(rows) {
    return ensureArray(rows)
      .reduce(function (acc, row) {
        return acc.concat(ensureArray(row));
      }, [])
      .map(function (item) {
        return '<view class="summary-highlight-card summary-highlight-' + escapeHtml(item.tone || 'neutral') + '">'
          + '<text class="summary-highlight-label">' + escapeHtml(item.label) + '</text>'
          + '<text class="summary-highlight-value">' + escapeHtml(item.value) + '</text>'
          + '</view>';
      })
      .join('');
  }

  function renderLegend(series) {
    return ensureArray(series)
      .map(function (item) {
        return '<view class="legend-item"><text class="legend-dot" style="background:' + escapeHtml(item.color || '#8b5cf6') + ';"></text><text class="legend-label" style="color:' + escapeHtml(item.color || '#8b5cf6') + ';">' + escapeHtml(item.label || item.key || '') + '</text></view>';
      })
      .join('');
  }

  function renderNotes(lines) {
    return ensureArray(lines).map(function (line) {
      return '<text class="summary-line">' + escapeHtml(line) + '</text>';
    }).join('');
  }

  function refreshFloatingTitle() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    state.showFloatingTitle = state.hideUiForBackdrop || !state.backdropExpanded || scrollTop > 120;
  }

  function isVisibleNode(node) {
    if (!node || !(node instanceof Element)) {
      return false;
    }
    var style = window.getComputedStyle(node);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  function isRectOverlap(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  function updateFloatingTitleObstruction() {
    var floatingTitle = document.getElementById('floatingStageTitle');
    if (!floatingTitle) {
      return;
    }
    if (!state.showFloatingTitle) {
      appRoot.classList.remove('floating-stage-title-obstructed');
      return;
    }

    var floatingRect = floatingTitle.getBoundingClientRect();
    var pointerOverlap = false;
    var pointerNear = false;
    if (state.mouseX != null && state.mouseY != null) {
      pointerOverlap = state.mouseX >= floatingRect.left && state.mouseX <= floatingRect.right && state.mouseY >= floatingRect.top && state.mouseY <= floatingRect.bottom;
      var centerX = (floatingRect.left + floatingRect.right) / 2;
      var centerY = (floatingRect.top + floatingRect.bottom) / 2;
      var dx = state.mouseX - centerX;
      var dy = state.mouseY - centerY;
      pointerNear = Math.sqrt(dx * dx + dy * dy) <= 220;
    }

    var textOverlap = false;
    var candidates = contentRoot.querySelectorAll(FLOATING_OBSTRUCTION_SELECTOR);
    for (var i = 0; i < candidates.length && i < 48; i += 1) {
      var node = candidates[i];
      if (!isVisibleNode(node)) {
        continue;
      }
      var rect = node.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) {
        continue;
      }
      if (isRectOverlap(floatingRect, rect)) {
        textOverlap = true;
        break;
      }
    }

    appRoot.classList.toggle('floating-stage-title-obstructed', pointerOverlap || textOverlap);
    appRoot.classList.toggle('floating-stage-title-near', pointerNear || pointerOverlap);
  }

  function scheduleFloatingTitleObstructionCheck() {
    if (state.floatingCheckRaf) {
      return;
    }
    state.floatingCheckRaf = window.requestAnimationFrame(function () {
      state.floatingCheckRaf = 0;
      updateFloatingTitleObstruction();
    });
  }

  function scheduleCultureExhibitSync() {
    if (state.cultureSyncRaf) {
      return;
    }
    state.cultureSyncRaf = window.requestAnimationFrame(function () {
      state.cultureSyncRaf = 0;
      if (state.hideUiForBackdrop) {
        syncCultureExhibit();
        syncExhibitSelectorUi();
        return;
      }
      teardownCultureExhibit();
    });
  }

  function scheduleThemeExhibitRetry() {
    if (state.themeExhibitRetryTimer) {
      window.clearTimeout(state.themeExhibitRetryTimer);
      state.themeExhibitRetryTimer = 0;
    }
    state.themeExhibitRetryTimer = window.setTimeout(function () {
      state.themeExhibitRetryTimer = 0;
      if (!state.hideUiForBackdrop) {
        return;
      }
      var quickKey = normalizeQuickNavKey(state.quickNavKey);
      if (quickKey !== 'home' && quickKey !== 'introduce') {
        return;
      }
      if (exhibitRuntime.particles.length) {
        return;
      }
      exhibitRuntime.introduceTransition = null;
      exhibitRuntime.lastAppliedTargetKey = '';
      exhibitRuntime.loadToken += 1;
      exhibitRuntime.slides = [];
      exhibitRuntime.slideSourceToIndex = {};
      if (quickKey === 'introduce') {
        syncIntroduceExhibitTarget({ force: true });
      }
      scheduleCultureExhibitSync();
    }, 680);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeLayoutPoint(point, fallback) {
    var source = point && typeof point === 'object' ? point : {};
    var base = fallback && typeof fallback === 'object' ? fallback : { x: 50, y: 50 };
    return {
      x: clamp(toNumber(source.x, base.x), 4, 96),
      y: clamp(toNumber(source.y, base.y), 4, 96),
    };
  }

  function normalizeLayoutConfig(layout) {
    var source = layout && typeof layout === 'object' ? layout : {};
    return {
      wheel: normalizeLayoutPoint(source.wheel, DEFAULT_LAYOUT.wheel),
      exhibit: normalizeLayoutPoint(source.exhibit, DEFAULT_LAYOUT.exhibit),
      flow: normalizeLayoutPoint(source.flow, DEFAULT_LAYOUT.flow),
      bridge: normalizeLayoutPoint(source.bridge, DEFAULT_LAYOUT.bridge),
      floating: normalizeLayoutPoint(source.floating, DEFAULT_LAYOUT.floating),
    };
  }

  function applyLayoutVars(forceWrite) {
    var layout = normalizeLayoutConfig(state.layout);
    state.layout = layout;
    var wheelX = layout.wheel.x.toFixed(3) + '%';
    var wheelY = layout.wheel.y.toFixed(3) + '%';
    var exhibitX = layout.exhibit.x.toFixed(3) + '%';
    var exhibitY = layout.exhibit.y.toFixed(3) + '%';
    var flowX = layout.flow.x.toFixed(3) + '%';
    var flowY = layout.flow.y.toFixed(3) + '%';
    var bridgeX = layout.bridge.x.toFixed(3) + '%';
    var bridgeY = layout.bridge.y.toFixed(3) + '%';
    var floatingX = layout.floating.x.toFixed(3) + '%';
    var floatingY = layout.floating.y.toFixed(3) + '%';

    var signature = [wheelX, wheelY, exhibitX, exhibitY, flowX, flowY, bridgeX, bridgeY, floatingX, floatingY].join('|');
    if (!forceWrite && signature === state.layoutVarsSignature) {
      return;
    }
    state.layoutVarsSignature = signature;

    appRoot.style.setProperty('--layout-wheel-x', wheelX);
    appRoot.style.setProperty('--layout-wheel-y', wheelY);
    appRoot.style.setProperty('--layout-exhibit-x', exhibitX);
    appRoot.style.setProperty('--layout-exhibit-y', exhibitY);
    appRoot.style.setProperty('--layout-flow-x', flowX);
    appRoot.style.setProperty('--layout-flow-y', flowY);
    appRoot.style.setProperty('--layout-bridge-x', bridgeX);
    appRoot.style.setProperty('--layout-bridge-y', bridgeY);
    appRoot.style.setProperty('--layout-floating-x', floatingX);
    appRoot.style.setProperty('--layout-floating-y', floatingY);

    appRoot.style.setProperty('--wheel-anchor-x', wheelX);
    appRoot.style.setProperty('--wheel-anchor-y', wheelY);
    appRoot.style.setProperty('--wheel-anchor-left', wheelX);
    appRoot.style.setProperty('--wheel-anchor-top', wheelY);
    appRoot.style.setProperty('--video-center-left', wheelX);
    appRoot.style.setProperty('--video-center-top', wheelY);
  }

  function getLayoutPoint(key) {
    var layout = normalizeLayoutConfig(state.layout);
    return layout[key] || { x: 50, y: 50 };
  }

  function getWheelScaleValue() {
    return 1;
  }

  function clearWheelTimers() {
    if (state.wheelDissolveTimer) {
      window.clearTimeout(state.wheelDissolveTimer);
      state.wheelDissolveTimer = 0;
    }
    if (state.wheelAssembleTimer) {
      window.clearTimeout(state.wheelAssembleTimer);
      state.wheelAssembleTimer = 0;
    }
    if (state.wheelTriggerBurstTimer) {
      window.clearTimeout(state.wheelTriggerBurstTimer);
      state.wheelTriggerBurstTimer = 0;
    }
  }

  function setWheelTriggerNearby(nextValue) {
    var normalized = !!nextValue;
    if (state.wheelTriggerNearby === normalized) {
      return;
    }
    state.wheelTriggerNearby = normalized;
    applyShellChrome();
  }

  function updateWheelTriggerProximity(clientX, clientY) {
    if (!state.hideUiForBackdrop || state.wheelExpanded || state.wheelAssembling || state.wheelDissolving) {
      setWheelTriggerNearby(false);
      return;
    }
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
      setWheelTriggerNearby(false);
      return;
    }
    var wheelPoint = getLayoutPoint('wheel');
    var triggerX = (window.innerWidth || 0) * (wheelPoint.x / 100);
    var triggerY = (window.innerHeight || 0) * (wheelPoint.y / 100);
    var dx = clientX - triggerX;
    var dy = clientY - triggerY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var revealRadius = Math.max(150, Math.min(window.innerWidth || 0, window.innerHeight || 0) * 0.16);
    setWheelTriggerNearby(dist <= revealRadius);
  }

  function triggerMotionParticleTransition(durationMs) {
    var now = Date.now();
    if (now < state.motionParticleCooldownUntil) {
      return;
    }
    if (state.motionParticleTimer) {
      window.clearTimeout(state.motionParticleTimer);
      state.motionParticleTimer = 0;
    }
    state.motionParticleTransition = true;
    state.motionParticleCooldownUntil = now + 240;
    applyShellChrome();
    state.motionParticleTimer = window.setTimeout(function () {
      state.motionParticleTransition = false;
      state.motionParticleTimer = 0;
      applyShellChrome();
    }, Math.max(240, toNumber(durationMs, 460)));
  }

  function beginTriggerBurst() {
    if (state.wheelTriggerBurstTimer) {
      window.clearTimeout(state.wheelTriggerBurstTimer);
      state.wheelTriggerBurstTimer = 0;
    }
    state.wheelTriggerBurst = true;
    applyShellChrome();
    state.wheelTriggerBurstTimer = window.setTimeout(function () {
      state.wheelTriggerBurst = false;
      state.wheelTriggerBurstTimer = 0;
      applyShellChrome();
    }, 560);
  }

  function updateWheelFlyOffsetVars() {
    var wheelPoint = getLayoutPoint('wheel');
    var triggerX = (window.innerWidth || 0) * (wheelPoint.x / 100);
    var triggerY = (window.innerHeight || 0) * (wheelPoint.y / 100);
    var targetX = triggerX;
    var targetY = triggerY;
    appRoot.style.setProperty('--wheel-fly-dx', (triggerX - targetX).toFixed(2) + 'px');
    appRoot.style.setProperty('--wheel-fly-dy', (triggerY - targetY).toFixed(2) + 'px');
  }

  function hideWheelInstant() {
    clearWheelTimers();
    state.wheelExpanded = false;
    state.wheelAssembling = false;
    state.wheelDissolving = false;
    state.wheelTriggerNearby = false;
    state.wheelTriggerBurst = false;
  }

  function beginWheelAssembly() {
    if (!state.hideUiForBackdrop) {
      return;
    }
    clearWheelTimers();
    updateWheelFlyOffsetVars();
    triggerMotionParticleTransition(620);
    state.wheelExpanded = true;
    state.wheelAssembling = true;
    state.wheelDissolving = false;
    state.wheelProtectionUntil = Date.now() + 1200;
    applyShellChrome();
    state.wheelAssembleTimer = window.setTimeout(function () {
      state.wheelAssembling = false;
      state.wheelAssembleTimer = 0;
      applyShellChrome();
    }, 720);
  }

  function beginWheelDissolve() {
    if (!state.wheelExpanded || state.wheelDissolving) {
      return;
    }
    clearWheelTimers();
    updateWheelFlyOffsetVars();
    triggerMotionParticleTransition(520);
    state.wheelAssembling = false;
    state.wheelDissolving = true;
    applyShellChrome();
    state.wheelDissolveTimer = window.setTimeout(function () {
      state.wheelDissolving = false;
      state.wheelExpanded = false;
      state.wheelDissolveTimer = 0;
      applyShellChrome();
    }, 560);
  }

  function updateWheelDistanceFade(clientX, clientY) {
    if (!state.hideUiForBackdrop || !state.wheelExpanded || state.wheelAssembling || state.wheelDissolving) {
      return;
    }
    if (normalizeQuickNavKey(state.quickNavKey) === 'tools') {
      return;
    }
    if (Date.now() < state.wheelProtectionUntil) {
      return;
    }
    if (state.wheelDrag || exhibitRuntime.selectorDragging) {
      return;
    }
    var wheel = document.querySelector('.component-revolver');
    if (!wheel) {
      return;
    }
    var rect = wheel.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) {
      return;
    }
    var centerX = rect.left + rect.width * 0.5;
    var centerY = rect.top + rect.height * 0.5;
    var dx = clientX - centerX;
    var dy = clientY - centerY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var threshold = Math.max(300, Math.min(window.innerWidth || 0, window.innerHeight || 0) * 0.28);
    if (dist > threshold) {
      beginWheelDissolve();
    }
  }

  function collectAnchorMetricsSignature() {
    if (!state.hideUiForBackdrop) {
      return '';
    }
    var probes = ['.component-revolver', '.focus-flow-canvas', '.collapse-bridge', '.hero-component-indicator'];
    var parts = [];
    for (var i = 0; i < probes.length; i += 1) {
      var node = document.querySelector(probes[i]);
      if (!node) {
        continue;
      }
      var style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') {
        continue;
      }
      var rect = node.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) {
        continue;
      }
      parts.push([
        probes[i],
        rect.left.toFixed(2),
        rect.top.toFixed(2),
        rect.width.toFixed(2),
        rect.height.toFixed(2),
      ].join(':'));
    }
    return parts.join('|');
  }

  function startAnchorFreeze(resetScaleBase) {
    if (!state.hideUiForBackdrop) {
      state.anchorSnapshot = null;
      state.anchorLastMetrics = null;
      state.anchorFreezePending = false;
      state.anchorReady = true;
      if (state.anchorFreezeRaf) {
        window.cancelAnimationFrame(state.anchorFreezeRaf);
        state.anchorFreezeRaf = 0;
      }
      updateWheelAnchorFromBackdrop(!!resetScaleBase);
      return;
    }

    state.anchorSnapshot = null;
    state.anchorLastMetrics = '';
    state.anchorFreezePending = true;
    state.anchorReady = false;
    state.anchorFreezeFrames = 0;
    state.anchorStableFrames = 0;
    if (state.anchorFreezeRaf) {
      window.cancelAnimationFrame(state.anchorFreezeRaf);
      state.anchorFreezeRaf = 0;
    }

    updateWheelAnchorFromBackdrop(!!resetScaleBase);

    function step() {
      if (!state.hideUiForBackdrop) {
        state.anchorFreezePending = false;
        state.anchorReady = true;
        state.anchorFreezeRaf = 0;
        applyShellChrome();
        return;
      }

      state.anchorFreezeFrames += 1;
      updateWheelAnchorFromBackdrop(false);

      var signature = collectAnchorMetricsSignature();
      if (signature && signature === state.anchorLastMetrics) {
        state.anchorStableFrames += 1;
      } else {
        state.anchorStableFrames = 0;
      }
      state.anchorLastMetrics = signature;

      if (state.anchorStableFrames >= ANCHOR_STABLE_FRAMES_REQUIRED || state.anchorFreezeFrames >= ANCHOR_FREEZE_MAX_FRAMES) {
        state.anchorFreezePending = false;
        state.anchorReady = true;
        state.anchorFreezeRaf = 0;
        applyShellChrome();
        return;
      }
      state.anchorFreezeRaf = window.requestAnimationFrame(step);
    }

    state.anchorFreezeRaf = window.requestAnimationFrame(step);
  }

  function updateWheelAnchorFromBackdrop(resetScaleBase) {
    applyLayoutVars(resetScaleBase === true);
  }

  function teardownCultureExhibit() {
    if (exhibitRuntime.timerId) {
      window.clearInterval(exhibitRuntime.timerId);
      exhibitRuntime.timerId = 0;
    }
    if (exhibitRuntime.rafId) {
      window.cancelAnimationFrame(exhibitRuntime.rafId);
      exhibitRuntime.rafId = 0;
    }
    if (exhibitRuntime.zone && exhibitRuntime.moveHandler) {
      exhibitRuntime.zone.removeEventListener('pointermove', exhibitRuntime.moveHandler);
    }
    if (exhibitRuntime.zone && exhibitRuntime.leaveHandler) {
      exhibitRuntime.zone.removeEventListener('pointerleave', exhibitRuntime.leaveHandler);
    }
    exhibitRuntime.inited = false;
    exhibitRuntime.zone = null;
    exhibitRuntime.canvas = null;
    exhibitRuntime.ctx = null;
    exhibitRuntime.particles = [];
    exhibitRuntime.orbiters = [];
    exhibitRuntime.mouseX = -9999;
    exhibitRuntime.mouseY = -9999;
    exhibitRuntime.pointerLeft = 0;
    exhibitRuntime.pointerTop = 0;
    exhibitRuntime.selectorDragging = false;
    exhibitRuntime.overviewPoints = [];
    exhibitRuntime.introduceTransition = null;
    exhibitRuntime.lastAppliedTargetKey = '';
    stopExhibitSelectorMotion();
    teardownFocusFlow();
  }

  function teardownFocusFlow() {
    focusFlowRuntime.canvas = null;
    focusFlowRuntime.ctx = null;
    focusFlowRuntime.width = 0;
    focusFlowRuntime.height = 0;
    focusFlowRuntime.offsetLeft = 0;
    focusFlowRuntime.offsetTop = 0;
    focusFlowRuntime.particles = [];
    focusFlowRuntime.streams = [];
    focusFlowRuntime.bits = [];
    focusFlowRuntime.seededTheme = '';
  }

  function getThemeParticlePalette() {
    if (state.theme === 'dark') {
      return {
        a: { r: 184, g: 255, b: 44 },
        b: { r: 132, g: 255, b: 92 },
        c: { r: 68, g: 214, b: 164 },
      };
    }
    return {
      a: { r: 96, g: 88, b: 255 },
      b: { r: 64, g: 144, b: 255 },
      c: { r: 130, g: 96, b: 255 },
    };
  }

  function mixColor(a, b, t) {
    var ratio = clamp(t, 0, 1);
    return {
      r: Math.round(a.r + (b.r - a.r) * ratio),
      g: Math.round(a.g + (b.g - a.g) * ratio),
      b: Math.round(a.b + (b.b - a.b) * ratio),
    };
  }

  function getThemeGradientLut() {
    if (themeGradientRuntime.theme === state.theme && themeGradientRuntime.entries.length) {
      return themeGradientRuntime.entries;
    }
    var palette = getThemeParticlePalette();
    var entries = [];
    for (var i = 0; i <= 96; i += 1) {
      var ratio = i / 96;
      var weightedRatio = Math.pow(ratio, 0.82);
      var base;
      if (weightedRatio <= 0.5) {
        base = mixColor(palette.a, palette.c, weightedRatio * 2);
      } else {
        base = mixColor(palette.c, palette.b, (weightedRatio - 0.5) * 2);
      }
      var pulse = Math.sin(weightedRatio * Math.PI) * 24;
      entries.push({
        r: Math.round(clamp(base.r + pulse * 0.24, 0, 255)),
        g: Math.round(clamp(base.g + pulse * 0.46, 0, 255)),
        b: Math.round(clamp(base.b + pulse * 0.36, 0, 255)),
      });
    }
    themeGradientRuntime.theme = state.theme;
    themeGradientRuntime.entries = entries;
    return entries;
  }

  function sampleThemeGradient(t) {
    var ratio = clamp(t, 0, 1);
    var lut = getThemeGradientLut();
    return lut[Math.round(ratio * (lut.length - 1))] || lut[0];
  }

  function getExhibitSelectorMetrics() {
    var selector = document.getElementById('exhibitSelector');
    if (!selector) {
      return null;
    }
    var firstThumb = selector.querySelector('.exhibit-thumb');
    if (!firstThumb) {
      return null;
    }
    var selectorStyle = window.getComputedStyle(selector);
    var gap = toNumber(selectorStyle.columnGap || selectorStyle.gap, 0);
    var thumbRect = firstThumb.getBoundingClientRect();
    var wheelScale = getWheelScaleValue();
    var baseWidth = Math.max(1, thumbRect.width);
    var spacing = Math.max(42 * wheelScale, baseWidth + gap);
    return {
      selector: selector,
      thumbs: selector.querySelectorAll('.exhibit-thumb'),
      thumbWidth: thumbRect.width,
      spacing: spacing,
    };
  }

  function normalizeLoopIndex(index, total) {
    if (!total) {
      return 0;
    }
    return ((index % total) + total) % total;
  }

  function normalizeLoopDelta(delta, total) {
    if (!total) {
      return 0;
    }
    var half = total / 2;
    var value = delta;
    while (value > half) {
      value -= total;
    }
    while (value < -half) {
      value += total;
    }
    return value;
  }

  function stopExhibitSelectorMotion() {
    if (exhibitRuntime.selectorRafId) {
      window.cancelAnimationFrame(exhibitRuntime.selectorRafId);
      exhibitRuntime.selectorRafId = 0;
    }
    exhibitRuntime.selectorVelocityPx = 0;
  }

  function updateExhibitSelectorArc() {
    var metrics = getExhibitSelectorMetrics();
    if (!metrics || !metrics.thumbs.length) {
      return;
    }
    var count = metrics.thumbs.length;
    var spacing = metrics.spacing;
    var wheelScale = getWheelScaleValue();
    exhibitRuntime.selectorSpacing = spacing;

    if (!Number.isFinite(exhibitRuntime.selectorOffsetPx)) {
      exhibitRuntime.selectorOffsetPx = -exhibitRuntime.slideIndex * spacing;
    }

    var centerFloat = -exhibitRuntime.selectorOffsetPx / spacing;
    var selector = metrics.selector;
    selector.classList.toggle('exhibit-selector-dragging', !!exhibitRuntime.selectorDragging);

    metrics.thumbs.forEach(function (node, index) {
      var rel = normalizeLoopDelta(index - centerFloat, count);
      var abs = Math.abs(rel);
      var visible = abs <= 2.4;
      var focus = clamp(1 - abs / 2.5, 0, 1);
      var x = rel * spacing;
      var y = (14 * wheelScale) - Math.pow(abs, 1.26) * (8.2 * wheelScale);
      var scale = 0.72 + focus * 0.44;
      var rotateX = 16 + abs * 8.5;
      var opacity = visible ? (0.2 + focus * 0.8) : 0;
      var saturate = 0.62 + focus * 0.72;
      node.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotateX(' + rotateX.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
      node.style.opacity = opacity.toFixed(3);
      node.style.filter = 'saturate(' + saturate.toFixed(3) + ')';
      node.style.zIndex = String(20 + Math.round(focus * 80));
      node.style.visibility = visible ? 'visible' : 'hidden';
      node.style.pointerEvents = visible ? 'auto' : 'none';
    });
  }

  function snapExhibitSelectorToNearest(applySelection) {
    var metrics = getExhibitSelectorMetrics();
    if (!metrics || !metrics.thumbs.length) {
      return;
    }
    var count = metrics.thumbs.length;
    var spacing = metrics.spacing;
    var centerFloat = -exhibitRuntime.selectorOffsetPx / spacing;
    var targetIndex = normalizeLoopIndex(Math.round(centerFloat), count);
    exhibitRuntime.selectorOffsetPx = -targetIndex * spacing;
    updateExhibitSelectorArc();
    if (applySelection) {
      applyExhibitSelection(targetIndex, true);
    }
  }

  function startExhibitSelectorInertia() {
    var metrics = getExhibitSelectorMetrics();
    if (!metrics || !metrics.thumbs.length) {
      return;
    }

    stopExhibitSelectorMotion();
    function step() {
      if (!state.hideUiForBackdrop) {
        exhibitRuntime.selectorRafId = 0;
        return;
      }

      exhibitRuntime.selectorOffsetPx += exhibitRuntime.selectorVelocityPx;
      exhibitRuntime.selectorVelocityPx *= 0.935;
      updateExhibitSelectorArc();

      if (Math.abs(exhibitRuntime.selectorVelocityPx) < 0.22) {
        exhibitRuntime.selectorRafId = 0;
        snapExhibitSelectorToNearest(true);
        return;
      }

      exhibitRuntime.selectorRafId = window.requestAnimationFrame(step);
    }
    exhibitRuntime.selectorRafId = window.requestAnimationFrame(step);
  }

  function alignExhibitSelectorToSlide() {
    var metrics = getExhibitSelectorMetrics();
    if (!metrics || !metrics.thumbs.length) {
      return;
    }
    var spacing = metrics.spacing;
    exhibitRuntime.selectorSpacing = spacing;
    exhibitRuntime.selectorOffsetPx = -exhibitRuntime.slideIndex * spacing;
    updateExhibitSelectorArc();
  }

  function syncExhibitSelectorUi() {
    var selectorButtons = contentRoot.querySelectorAll('.exhibit-thumb');
    selectorButtons.forEach(function (node) {
      var idx = toNumber(node.getAttribute('data-exhibit-index'), -1);
      var isActive = idx === exhibitRuntime.slideIndex;
      node.classList.toggle('exhibit-thumb-active', isActive);
    });
    if (!exhibitRuntime.selectorDragging) {
      alignExhibitSelectorToSlide();
    } else {
      updateExhibitSelectorArc();
    }
  }

  function syncCultureShowcaseUi() {
    var collapsed = !!state.cultureShowcaseCollapsed;
    appRoot.classList.toggle('culture-showcase-collapsed', collapsed);
    var toggleNodes = contentRoot.querySelectorAll('.team-culture-toggle[data-action="toggle-culture-showcase"]');
    toggleNodes.forEach(function (node) {
      node.textContent = collapsed ? '展开' : '折叠';
    });
  }

  function setCultureShowcaseCollapsed(nextCollapsed) {
    state.cultureShowcaseCollapsed = !!nextCollapsed;
    syncCultureShowcaseUi();
    if (state.hideUiForBackdrop) {
      scheduleCultureExhibitSync();
    }
  }

  function shouldRotateExhibitSlides() {
    if (!state.hideUiForBackdrop) {
      return false;
    }
    return normalizeQuickNavKey(state.quickNavKey) !== 'introduce';
  }

  function restartExhibitTimer() {
    if (exhibitRuntime.timerId) {
      window.clearInterval(exhibitRuntime.timerId);
      exhibitRuntime.timerId = 0;
    }
    if (!exhibitRuntime.slides.length) {
      return;
    }
    if (!shouldRotateExhibitSlides()) {
      return;
    }
    exhibitRuntime.timerId = window.setInterval(function () {
      applyExhibitSlide((exhibitRuntime.slideIndex + 1) % exhibitRuntime.slides.length);
    }, EXHIBIT_ROTATE_INTERVAL_MS);
  }

  function applyExhibitSelection(index, fromManual) {
    if (!exhibitRuntime.slides.length) {
      return;
    }
    var bounded = ((index % exhibitRuntime.slides.length) + exhibitRuntime.slides.length) % exhibitRuntime.slides.length;
    applyExhibitSlide(bounded);
    if (fromManual) {
      if (shouldRotateExhibitSlides()) {
        restartExhibitTimer();
      }
    }
  }

  function createFlowParticle(width, height) {
    var spawnBias = Math.random();
    return {
      x: Math.random() * width,
      y: height + Math.random() * (height * 0.26),
      vx: (Math.random() - 0.5) * (0.6 + spawnBias * 0.8),
      vy: -(0.8 + Math.random() * 1.6),
      alpha: 0.18 + Math.random() * 0.56,
      life: Math.random() * 0.6,
      size: 1 + Math.random() * 1.9,
      trail: 5 + Math.random() * 12,
      drift: (Math.random() - 0.5) * 0.03,
    };
  }

  function createFlowStream(width, height) {
    return {
      x: Math.random() * width,
      sway: 10 + Math.random() * 28,
      phase: Math.random() * Math.PI * 2,
      speed: 0.006 + Math.random() * 0.012,
      width: 2.2 + Math.random() * 2.6,
      alpha: 0.2 + Math.random() * 0.38,
      capY: (0.56 + Math.random() * 0.18) * height,
      dashOffset: Math.random() * 80,
    };
  }

  function buildFallbackExhibitPoints(width, height, seed) {
    var points = [];
    var cx = width * 0.5;
    var cy = height * 0.52;
    var ringR = Math.min(width, height) * 0.24;
    var ringPulse = (seed % 7) * 0.03;

    for (var i = 0; i < 540; i += 1) {
      var t = (i / 540) * Math.PI * 2;
      var jitter = (Math.random() - 0.5) * 1.6;
      var rx = ringR + Math.sin(t * 3 + seed) * ringPulse * ringR;
      var x = cx + Math.cos(t) * rx + jitter;
      var y = cy + Math.sin(t) * ringR + jitter;
      points.push({ x: x, y: y, a: 0.82 });
    }

    for (var j = 0; j < 320; j += 1) {
      var p = j / 319;
      var stemX = cx + Math.sin(p * Math.PI * 1.7 + seed * 0.7) * (ringR * 0.32);
      var stemY = cy + ringR * 0.92 - p * ringR * 2.05;
      points.push({ x: stemX + (Math.random() - 0.5) * 1.3, y: stemY + (Math.random() - 0.5) * 1.3, a: 0.84 });
    }

    for (var k = 0; k < 200; k += 1) {
      var q = k / 199;
      var wingY = cy - ringR * 0.86 + q * ringR * 0.86;
      var half = (1 - q) * ringR * 0.52;
      points.push({ x: cx - half + (Math.random() - 0.5) * 1.1, y: wingY + (Math.random() - 0.5) * 1.1, a: 0.78 });
      points.push({ x: cx + half + (Math.random() - 0.5) * 1.1, y: wingY + (Math.random() - 0.5) * 1.1, a: 0.78 });
    }

    return points;
  }

  function normalizeExhibitPoints(points, width, height) {
    if (!points || !points.length || width < 2 || height < 2) {
      return points || [];
    }
    var minX = Infinity;
    var maxX = -Infinity;
    var minY = Infinity;
    var maxY = -Infinity;
    for (var i = 0; i < points.length; i += 1) {
      var p = points[i];
      if (!p) {
        continue;
      }
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) {
      return points;
    }
    var boxW = Math.max(1, maxX - minX);
    var boxH = Math.max(1, maxY - minY);
    var inIntroduce = state.hideUiForBackdrop && normalizeQuickNavKey(state.quickNavKey) === 'introduce';
    var introduceDetail = inIntroduce && normalizeIntroduceView(state.introduceView) === INTRODUCE_VIEW_DETAIL;
    var introduceCatalog = inIntroduce && !introduceDetail;
    var fitRatio = inIntroduce ? (introduceDetail ? 0.64 : 0.86) : 0.9;
    var targetW = width * fitRatio;
    var targetH = height * fitRatio;
    var scale = Math.min(targetW / boxW, targetH / boxH, 1);
    var cx = (minX + maxX) * 0.5;
    var cy = (minY + maxY) * 0.5;
    var tx = width * (introduceDetail ? 0.48 : 0.5);
    var ty = height * (introduceDetail ? 0.52 : 0.5);
    var safePadding = Math.max(2, Math.floor(Math.min(width, height) * 0.01));
    var safePaddingX = introduceDetail
      ? Math.max(safePadding, Math.floor(width * 0.14))
      : (introduceCatalog ? Math.max(safePadding, Math.floor(width * 0.055)) : safePadding);
    var safePaddingY = introduceDetail
      ? Math.max(safePadding, Math.floor(height * 0.12))
      : (introduceCatalog ? Math.max(safePadding, Math.floor(height * 0.08)) : safePadding);
    var normalized = [];
    var distances = [];
    for (var j = 0; j < points.length; j += 1) {
      var pt = points[j];
      if (!pt) {
        continue;
      }
      var rawX = (pt.x - cx) * scale + tx;
      var rawY = (pt.y - cy) * scale + ty;
      var nx = clamp(rawX, safePaddingX, width - safePaddingX);
      var ny = clamp(rawY, safePaddingY, height - safePaddingY);
      if (introduceCatalog && (Math.abs(rawX - nx) > 0.01 || Math.abs(rawY - ny) > 0.01)) {
        continue;
      }
      var dx = nx - tx;
      var dy = ny - ty;
      var dist = Math.sqrt(dx * dx + dy * dy);
      normalized.push({ x: nx, y: ny, a: pt.a, d: dist });
      distances.push(dist);
    }
    if (!normalized.length) {
      return [];
    }
    distances.sort(function (a, b) { return a - b; });
    var cutoffIndex = clamp(Math.floor(distances.length * 0.998), 0, distances.length - 1);
    var cutoff = distances[cutoffIndex];
    var softLimit = Math.max(width, height) * 0.56;
    var shouldTrim = normalized.length > 520 && cutoff > softLimit;
    var limit = shouldTrim ? cutoff : distances[distances.length - 1];
    var result = normalized
      .filter(function (item) {
        return item.d <= limit;
      })
      .map(function (item) {
        return {
          x: item.x,
          y: item.y,
          a: item.a,
        };
      });

    var maxPoints = clamp(Math.floor((width * height) / 700), 2600, 5200);
    if (result.length <= maxPoints) {
      return result;
    }

    var sampled = [];
    var stride = result.length / maxPoints;
    for (var si = 0; si < maxPoints; si += 1) {
      sampled.push(result[Math.floor(si * stride)]);
    }
    return sampled;
  }

  function getCachedExhibitImage(src) {
    var key = String(src || '');
    if (!key) {
      return Promise.resolve(null);
    }
    var cached = EXHIBIT_IMAGE_CACHE[key];
    if (cached) {
      if (cached.status === 'ready') {
        return Promise.resolve(cached.image);
      }
      if (cached.status === 'error') {
        return Promise.resolve(null);
      }
      if (cached.promise) {
        return cached.promise;
      }
    }

    var entry = {
      status: 'loading',
      image: null,
      promise: null,
    };

    entry.promise = new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        entry.status = 'ready';
        entry.image = img;
        resolve(img);
      };
      img.onerror = function () {
        entry.status = 'error';
        entry.image = null;
        resolve(null);
      };
      img.src = encodeURI(key);
    });

    EXHIBIT_IMAGE_CACHE[key] = entry;
    return entry.promise;
  }

  function createFlowBit(width, height, streamCount) {
    var sid = Math.floor(Math.random() * Math.max(1, streamCount));
    return {
      streamId: sid,
      x: Math.random() * width,
      y: height + Math.random() * (height * 0.18),
      vx: 0,
      vy: -(0.7 + Math.random() * 1.8),
      alpha: 0.2 + Math.random() * 0.56,
      life: Math.random() * 0.4,
      size: 1.1 + Math.random() * 2.4,
    };
  }

  function applyFocusRepulsion(entity, pointerX, pointerY) {
    var dx = entity.x - pointerX;
    var dy = entity.y - pointerY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 72) {
      var force = ((72 - dist) / 72) * 0.95;
      var angle = Math.atan2(dy, dx);
      entity.vx += Math.cos(angle) * force;
      entity.vy += Math.sin(angle) * force;
    }
  }

  function seedFocusFlowParticles() {
    if (!focusFlowRuntime.width || !focusFlowRuntime.height) {
      return;
    }
    var targetCount = Math.min(240, Math.max(120, Math.floor(focusFlowRuntime.width * focusFlowRuntime.height / 16500 * 0.84)));
    if (focusFlowRuntime.particles.length > targetCount) {
      focusFlowRuntime.particles = focusFlowRuntime.particles.slice(0, targetCount);
      return;
    }
    while (focusFlowRuntime.particles.length < targetCount) {
      focusFlowRuntime.particles.push(createFlowParticle(focusFlowRuntime.width, focusFlowRuntime.height));
    }

    var streamTargetCount = Math.min(18, Math.max(9, Math.floor(focusFlowRuntime.width / 150 * 0.86)));
    if (focusFlowRuntime.streams.length > streamTargetCount) {
      focusFlowRuntime.streams = focusFlowRuntime.streams.slice(0, streamTargetCount);
    }
    while (focusFlowRuntime.streams.length < streamTargetCount) {
      focusFlowRuntime.streams.push(createFlowStream(focusFlowRuntime.width, focusFlowRuntime.height));
    }

    var bitTargetCount = Math.min(320, Math.max(180, Math.floor(streamTargetCount * 16 * 0.9)));
    if (focusFlowRuntime.bits.length > bitTargetCount) {
      focusFlowRuntime.bits = focusFlowRuntime.bits.slice(0, bitTargetCount);
    }
    while (focusFlowRuntime.bits.length < bitTargetCount) {
      focusFlowRuntime.bits.push(createFlowBit(focusFlowRuntime.width, focusFlowRuntime.height, focusFlowRuntime.streams.length));
    }
  }

  function syncFocusFlowCanvas() {
    if (!state.hideUiForBackdrop) {
      teardownFocusFlow();
      return;
    }
    var canvas = document.getElementById('focusFlowCanvas');
    if (!canvas) {
      teardownFocusFlow();
      return;
    }
    var dpr = Math.max(1, window.devicePixelRatio || 1);
    var rect = canvas.getBoundingClientRect();
    var nextWidth = Math.max(80, Math.floor(rect.width * dpr));
    var nextHeight = Math.max(80, Math.floor(rect.height * dpr));

    focusFlowRuntime.canvas = canvas;
    focusFlowRuntime.ctx = canvas.getContext('2d');
    if (!focusFlowRuntime.ctx) {
      teardownFocusFlow();
      return;
    }

    if (nextWidth !== focusFlowRuntime.width || nextHeight !== focusFlowRuntime.height || dpr !== focusFlowRuntime.dpr) {
      focusFlowRuntime.width = nextWidth;
      focusFlowRuntime.height = nextHeight;
      focusFlowRuntime.dpr = dpr;
      focusFlowRuntime.offsetLeft = rect.left;
      focusFlowRuntime.offsetTop = rect.top;
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      focusFlowRuntime.particles = [];
      focusFlowRuntime.streams = [];
      focusFlowRuntime.bits = [];
    } else {
      focusFlowRuntime.offsetLeft = rect.left;
      focusFlowRuntime.offsetTop = rect.top;
    }

    if (focusFlowRuntime.seededTheme !== state.theme) {
      focusFlowRuntime.seededTheme = state.theme;
      focusFlowRuntime.particles = [];
      focusFlowRuntime.streams = [];
      focusFlowRuntime.bits = [];
    }

    seedFocusFlowParticles();
  }

  function buildBinaryExhibitPointsFromImage(image, width, height) {
    if (!image || width < 2 || height < 2) {
      return [];
    }

    var offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    var offctx = offscreen.getContext('2d');
    if (!offctx) {
      return [];
    }

    var padding = Math.max(8, Math.min(width, height) * 0.08);
    var drawWidth = width - padding * 2;
    var drawHeight = height - padding * 2;
    var imgRatio = image.width / Math.max(1, image.height);
    var boxRatio = drawWidth / Math.max(1, drawHeight);
    var w = drawWidth;
    var h = drawHeight;
    if (imgRatio > boxRatio) {
      h = drawWidth / imgRatio;
    } else {
      w = drawHeight * imgRatio;
    }
    var x = (width - w) / 2;
    var y = (height - h) / 2;
    offctx.clearRect(0, 0, width, height);
    offctx.drawImage(image, x, y, w, h);

    var imageData;
    try {
      imageData = offctx.getImageData(0, 0, width, height).data;
    } catch (error) {
      return [];
    }

    var alphaThreshold = 8;
    var step = Math.max(1, Math.floor(Math.min(width, height) / 240));
    var grayValues = [];
    var cornerGray = 0;
    var cornerAlpha = 0;

    function pixelAt(px, py) {
      var sx = clamp(Math.floor(px), 0, width - 1);
      var sy = clamp(Math.floor(py), 0, height - 1);
      var idx = (sy * width + sx) * 4;
      var r = imageData[idx];
      var g = imageData[idx + 1];
      var b = imageData[idx + 2];
      var a = imageData[idx + 3];
      var gray = r * 0.299 + g * 0.587 + b * 0.114;
      return { gray: gray, alpha: a };
    }

    var p1 = pixelAt(0, 0);
    var p2 = pixelAt(width - 1, 0);
    var p3 = pixelAt(0, height - 1);
    var p4 = pixelAt(width - 1, height - 1);
    cornerGray = (p1.gray + p2.gray + p3.gray + p4.gray) / 4;
    cornerAlpha = (p1.alpha + p2.alpha + p3.alpha + p4.alpha) / 4;

    for (var sy = 0; sy < height; sy += step) {
      for (var sx = 0; sx < width; sx += step) {
        var idx = (sy * width + sx) * 4;
        var a = imageData[idx + 3];
        if (a <= alphaThreshold) {
          continue;
        }
        var r = imageData[idx];
        var g = imageData[idx + 1];
        var b = imageData[idx + 2];
        grayValues.push(r * 0.299 + g * 0.587 + b * 0.114);
      }
    }

    if (!grayValues.length) {
      return [];
    }

    grayValues.sort(function (a, b) { return a - b; });
    var threshold = grayValues[Math.floor(grayValues.length * 0.5)];
    var bgIsTransparent = cornerAlpha < 20;
    var bgBit = cornerGray >= threshold ? 1 : 0;
    var foregroundBit = bgBit === 1 ? 0 : 1;
    var points = [];

    for (var y2 = 0; y2 < height; y2 += step) {
      for (var x2 = 0; x2 < width; x2 += step) {
        var i2 = (y2 * width + x2) * 4;
        var alpha = imageData[i2 + 3];
        if (alpha <= alphaThreshold) {
          continue;
        }
        var rr = imageData[i2];
        var gg = imageData[i2 + 1];
        var bb = imageData[i2 + 2];
        var gray = rr * 0.299 + gg * 0.587 + bb * 0.114;
        var bit = gray >= threshold ? 1 : 0;
        var inForeground = bgIsTransparent ? true : (bit === foregroundBit);
        if (!inForeground) {
          continue;
        }

        points.push({
          x: x2,
          y: y2,
          a: clamp((alpha / 255) * (bit ? 0.88 : 0.72), 0.16, 0.96),
        });
      }
    }

    return points;
  }

  function buildExhibitPointsFromImage(image, width, height, relaxMode) {
    if (!image || width < 2 || height < 2) {
      return [];
    }

    var offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    var offctx = offscreen.getContext('2d');
    if (!offctx) {
      return [];
    }

    var padding = Math.max(8, Math.min(width, height) * 0.08);
    var drawWidth = width - padding * 2;
    var drawHeight = height - padding * 2;
    var imgRatio = image.width / Math.max(1, image.height);
    var boxRatio = drawWidth / Math.max(1, drawHeight);
    var w = drawWidth;
    var h = drawHeight;
    if (imgRatio > boxRatio) {
      h = drawWidth / imgRatio;
    } else {
      w = drawHeight * imgRatio;
    }
    var x = (width - w) / 2;
    var y = (height - h) / 2;
    offctx.clearRect(0, 0, width, height);
    offctx.drawImage(image, x, y, w, h);

    var imageData;
    try {
      imageData = offctx.getImageData(0, 0, width, height).data;
    } catch (error) {
      if (typeof window !== 'undefined') {
        window.__exhibitDebug = window.__exhibitDebug || {};
        window.__exhibitDebug.imageReadError = String(error && error.message ? error.message : error);
      }
      return [];
    }
    var step = relaxMode ? Math.max(2, Math.floor(Math.min(width, height) / 150)) : Math.max(2, Math.floor(Math.min(width, height) / 120));
    var alphaThreshold = relaxMode ? 4 : 10;

    function sampleRgb(px, py) {
      var sx = clamp(Math.floor(px), 0, width - 1);
      var sy = clamp(Math.floor(py), 0, height - 1);
      var sidx = (sy * width + sx) * 4;
      return {
        r: imageData[sidx],
        g: imageData[sidx + 1],
        b: imageData[sidx + 2],
      };
    }

    var c1 = sampleRgb(0, 0);
    var c2 = sampleRgb(width - 1, 0);
    var c3 = sampleRgb(0, height - 1);
    var c4 = sampleRgb(width - 1, height - 1);
    var bgColor = {
      r: (c1.r + c2.r + c3.r + c4.r) / 4,
      g: (c1.g + c2.g + c3.g + c4.g) / 4,
      b: (c1.b + c2.b + c3.b + c4.b) / 4,
    };

    var bgLuminance = bgColor.r * 0.299 + bgColor.g * 0.587 + bgColor.b * 0.114;
    var candidateScores = [];
    var candidateMeta = [];

    for (var sy = 0; sy < height; sy += step) {
      for (var sx = 0; sx < width; sx += step) {
        var sidx = (sy * width + sx) * 4;
        var sr = imageData[sidx];
        var sg = imageData[sidx + 1];
        var sb = imageData[sidx + 2];
        var sa = imageData[sidx + 3];
        if (sa <= alphaThreshold) {
          continue;
        }
        var sl = sr * 0.299 + sg * 0.587 + sb * 0.114;
        var sdr = sr - bgColor.r;
        var sdg = sg - bgColor.g;
        var sdb = sb - bgColor.b;
        var sDist = Math.sqrt(sdr * sdr + sdg * sdg + sdb * sdb);
        var sLumaDelta = Math.abs(sl - bgLuminance);
        var sScore = sDist + sLumaDelta * 0.85;
        candidateScores.push(sScore);
        candidateMeta.push({ x: sx, y: sy, score: sScore });
      }
    }

    if (!candidateScores.length) {
      return [];
    }

    candidateScores.sort(function (a, b) { return a - b; });
    var percentile = relaxMode ? 0.56 : 0.68;
    var thresholdIndex = clamp(Math.floor(candidateScores.length * percentile), 0, candidateScores.length - 1);
    var adaptiveThreshold = candidateScores[thresholdIndex];
    var points = [];
    for (var i = 0; i < candidateMeta.length; i += 1) {
      var item = candidateMeta[i];
      if (item.score >= adaptiveThreshold) {
        points.push({
          x: item.x,
          y: item.y,
          a: clamp(item.score / 220, 0.22, 1),
        });
      }
    }

    if (points.length < 60 && candidateScores.length > 120) {
      var relaxedPercentile = relaxMode ? 0.44 : 0.54;
      var relaxedIndex = clamp(Math.floor(candidateScores.length * relaxedPercentile), 0, candidateScores.length - 1);
      var relaxedThreshold = candidateScores[relaxedIndex];
      points = [];
      for (var j = 0; j < candidateMeta.length; j += 1) {
        var relaxedItem = candidateMeta[j];
        if (relaxedItem.score >= relaxedThreshold) {
          points.push({
            x: relaxedItem.x,
            y: relaxedItem.y,
            a: clamp(relaxedItem.score / 220, 0.2, 0.96),
          });
        }
      }
    }
    return points;
  }

  function buildUltraImagePoints(image, width, height) {
    if (!image || width < 2 || height < 2) {
      return [];
    }

    var offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    var offctx = offscreen.getContext('2d');
    if (!offctx) {
      return [];
    }

    var padding = Math.max(8, Math.min(width, height) * 0.08);
    var drawWidth = width - padding * 2;
    var drawHeight = height - padding * 2;
    var imgRatio = image.width / Math.max(1, image.height);
    var boxRatio = drawWidth / Math.max(1, drawHeight);
    var w = drawWidth;
    var h = drawHeight;
    if (imgRatio > boxRatio) {
      h = drawWidth / imgRatio;
    } else {
      w = drawHeight * imgRatio;
    }
    var x = (width - w) / 2;
    var y = (height - h) / 2;
    offctx.clearRect(0, 0, width, height);
    offctx.drawImage(image, x, y, w, h);

    var imageData;
    try {
      imageData = offctx.getImageData(0, 0, width, height).data;
    } catch (error) {
      return [];
    }

    function sampleRgb(px, py) {
      var sx = clamp(Math.floor(px), 0, width - 1);
      var sy = clamp(Math.floor(py), 0, height - 1);
      var sidx = (sy * width + sx) * 4;
      return {
        r: imageData[sidx],
        g: imageData[sidx + 1],
        b: imageData[sidx + 2],
      };
    }

    var c1 = sampleRgb(0, 0);
    var c2 = sampleRgb(width - 1, 0);
    var c3 = sampleRgb(0, height - 1);
    var c4 = sampleRgb(width - 1, height - 1);
    var bgColor = {
      r: (c1.r + c2.r + c3.r + c4.r) / 4,
      g: (c1.g + c2.g + c3.g + c4.g) / 4,
      b: (c1.b + c2.b + c3.b + c4.b) / 4,
    };
    var bgLuminance = bgColor.r * 0.299 + bgColor.g * 0.587 + bgColor.b * 0.114;

    function median(values) {
      if (!values.length) {
        return 0;
      }
      var sorted = values.slice().sort(function (a, b) { return a - b; });
      return sorted[Math.floor(sorted.length / 2)];
    }

    var step = Math.max(1, Math.floor(Math.min(width, height) / 220));
    var candidates = [];
    var rs = [];
    var gs = [];
    var bs = [];

    for (var py = 0; py < height; py += step) {
      for (var px = 0; px < width; px += step) {
        var idx = (py * width + px) * 4;
        var r = imageData[idx];
        var g = imageData[idx + 1];
        var b = imageData[idx + 2];
        var a = imageData[idx + 3];
        if (a < 2) {
          continue;
        }
        rs.push(r);
        gs.push(g);
        bs.push(b);
        var luminance = r * 0.299 + g * 0.587 + b * 0.114;
        var dr = r - bgColor.r;
        var dg = g - bgColor.g;
        var db = b - bgColor.b;
        var distance = Math.sqrt(dr * dr + dg * dg + db * db);
        var lumaDelta = Math.abs(luminance - bgLuminance);
        var chroma = Math.max(r, g, b) - Math.min(r, g, b);
        candidates.push({
          x: px,
          y: py,
          r: r,
          g: g,
          b: b,
          luminance: luminance,
          distance: distance,
          lumaDelta: lumaDelta,
          chroma: chroma,
        });
      }
    }

    var dominantColor = {
      r: median(rs),
      g: median(gs),
      b: median(bs),
    };
    var dominantLuma = dominantColor.r * 0.299 + dominantColor.g * 0.587 + dominantColor.b * 0.114;

    var points = [];
    for (var ci = 0; ci < candidates.length; ci += 1) {
      var c = candidates[ci];
      var ddR = c.r - dominantColor.r;
      var ddG = c.g - dominantColor.g;
      var ddB = c.b - dominantColor.b;
      var dominantDistance = Math.sqrt(ddR * ddR + ddG * ddG + ddB * ddB);
      var dominantLumaDelta = Math.abs(c.luminance - dominantLuma);
      var foreground = c.distance > 18 || c.lumaDelta > 14;
      var notDominant = dominantDistance > 24 || dominantLumaDelta > 18 || c.chroma > 24;
      if (foreground && notDominant) {
        points.push({
          x: c.x,
          y: c.y,
          a: clamp((c.distance + dominantDistance + c.lumaDelta) / 240, 0.2, 0.92),
        });
      }
    }
    return points;
  }

  function applyExhibitSlide(index, options) {
    var opts = options || {};
    var slides = exhibitRuntime.slides;
    if (!slides.length) {
      return;
    }
    var nextPoints = slides[index % slides.length] || [];
    var maxLen = Math.max(exhibitRuntime.particles.length, nextPoints.length);
    var nextParticles = [];
    var shouldSnap = !!opts.snapToTarget;
    var regroupFromScatter = !!opts.regroupFromScatter;
    var width = Math.max(1, exhibitRuntime.width || 1);
    var height = Math.max(1, exhibitRuntime.height || 1);
    var centerX = width * 0.5;
    var centerY = height * 0.5;

    for (var i = 0; i < maxLen; i += 1) {
      var oldParticle = exhibitRuntime.particles[i];
      var target = nextPoints[i];

      if (target) {
        if (!oldParticle) {
          var spawnX = regroupFromScatter ? clamp(centerX + (Math.random() - 0.5) * width * 0.45, 4, width - 4) : target.x;
          var spawnY = regroupFromScatter ? clamp(centerY + (Math.random() - 0.5) * height * 0.45, 4, height - 4) : target.y;
          oldParticle = {
            x: spawnX,
            y: spawnY,
            vx: 0,
            vy: 0,
            tx: target.x,
            ty: target.y,
            alpha: regroupFromScatter ? 0 : 1,
            ta: Number.isFinite(target.a) ? target.a : 1,
            tone: Math.random(),
          };
        }
        oldParticle.tx = target.x;
        oldParticle.ty = target.y;
        oldParticle.ta = Number.isFinite(target.a) ? target.a : 1;
        oldParticle.tone = Number.isFinite(oldParticle.tone) ? oldParticle.tone : Math.random();
        if (regroupFromScatter) {
          oldParticle.vx += (Math.random() - 0.5) * 2.4;
          oldParticle.vy += (Math.random() - 0.5) * 2.4;
          oldParticle.alpha = clamp(oldParticle.alpha, 0, 1);
        } else if (shouldSnap) {
          oldParticle.x = oldParticle.tx;
          oldParticle.y = oldParticle.ty;
          oldParticle.vx = 0;
          oldParticle.vy = 0;
          oldParticle.alpha = oldParticle.ta;
        }
      } else {
        if (!oldParticle) {
          continue;
        }
        oldParticle.tx = oldParticle.x;
        oldParticle.ty = oldParticle.y;
        oldParticle.ta = 0;
        oldParticle.vx *= 0.4;
        oldParticle.vy *= 0.4;
        if (shouldSnap) {
          oldParticle.alpha = 0;
        }
      }
      nextParticles.push(oldParticle);
    }

    exhibitRuntime.particles = nextParticles;
    exhibitRuntime.slideIndex = index % slides.length;
    if (!opts.skipUiSync) {
      syncExhibitSelectorUi();
    }
  }

  function startIntroduceParticleTransition(nextPoints, targetKey, options) {
    var opts = options || {};
    if (!nextPoints || !nextPoints.length) {
      return false;
    }
    var activeTransition = exhibitRuntime.introduceTransition;
    if (activeTransition && activeTransition.pendingKey === targetKey) {
      return true;
    }

    if (!exhibitRuntime.particles.length || opts.immediate) {
      var backupSlides = exhibitRuntime.slides;
      exhibitRuntime.slides = [nextPoints];
      applyExhibitSlide(0, { snapToTarget: true });
      exhibitRuntime.slides = backupSlides;
      exhibitRuntime.introduceTransition = null;
      exhibitRuntime.lastAppliedTargetKey = targetKey;
      return true;
    }

    var width = Math.max(1, exhibitRuntime.width || 1);
    var height = Math.max(1, exhibitRuntime.height || 1);
    var centerX = width * 0.5;
    var centerY = height * 0.5;
    for (var i = 0; i < exhibitRuntime.particles.length; i += 1) {
      var p = exhibitRuntime.particles[i];
      var dx = p.x - centerX;
      var dy = p.y - centerY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var angle = Math.random() * Math.PI * 2;
      var dirX = dist > 0.001 ? (dx / dist) : Math.cos(angle);
      var dirY = dist > 0.001 ? (dy / dist) : Math.sin(angle);
      var burst = 46 + Math.random() * 124;
      p.tx = clamp(p.x + dirX * burst + (Math.random() - 0.5) * 52, 6, width - 6);
      p.ty = clamp(p.y + dirY * burst + (Math.random() - 0.5) * 52, 6, height - 6);
      p.ta = 0;
      p.vx += dirX * (1.4 + Math.random() * 2.1);
      p.vy += dirY * (1.4 + Math.random() * 2.1);
    }

    var now = Date.now();
    exhibitRuntime.introduceTransition = {
      phase: 'scatter',
      switchAt: now + 240,
      endAt: now + 920,
      pendingPoints: nextPoints,
      pendingKey: targetKey,
    };
    return true;
  }

  function processIntroduceParticleTransitionFrame() {
    var transition = exhibitRuntime.introduceTransition;
    if (!transition) {
      return;
    }
    if (!state.hideUiForBackdrop || normalizeQuickNavKey(state.quickNavKey) !== 'introduce') {
      exhibitRuntime.introduceTransition = null;
      return;
    }

    var now = Date.now();
    if (transition.phase === 'scatter' && now >= transition.switchAt) {
      transition.phase = 'regroup';
      var points = transition.pendingPoints || [];
      var backupSlides = exhibitRuntime.slides;
      exhibitRuntime.slides = [points];
      applyExhibitSlide(0, { regroupFromScatter: true });
      exhibitRuntime.slides = backupSlides;
      exhibitRuntime.lastAppliedTargetKey = transition.pendingKey || exhibitRuntime.lastAppliedTargetKey;
    }

    if (now >= transition.endAt) {
      exhibitRuntime.introduceTransition = null;
    }
  }

  function syncIntroduceExhibitTarget(options) {
    var opts = options || {};
    if (!state.hideUiForBackdrop || normalizeQuickNavKey(state.quickNavKey) !== 'introduce') {
      return;
    }
    if (!exhibitRuntime.width || !exhibitRuntime.height) {
      return;
    }
    var view = normalizeIntroduceView(state.introduceView);

    var applyIntroducePoints = function (points, targetKey) {
      if (!points || !points.length) {
        return false;
      }
      if (!opts.force && exhibitRuntime.lastAppliedTargetKey === targetKey && (!exhibitRuntime.introduceTransition || exhibitRuntime.introduceTransition.pendingKey === targetKey)) {
        return true;
      }
      return startIntroduceParticleTransition(points, targetKey, {
        immediate: !!opts.force || view !== INTRODUCE_VIEW_DETAIL,
      });
    };

    var ensurePointsFromSource = function (source, cacheMap, cacheKey, callback) {
      var key = String(source || '');
      if (!key) {
        callback([]);
        return;
      }
      var fromCache = cacheMap && cacheMap[cacheKey || key];
      if (fromCache && fromCache.length) {
        callback(fromCache);
        return;
      }
      var cached = EXHIBIT_IMAGE_CACHE[key];
      var buildAndReturn = function (img) {
        if (!img) {
          callback([]);
          return;
        }
        var pts = buildBinaryExhibitPointsFromImage(img, exhibitRuntime.width, exhibitRuntime.height);
        var normalized = normalizeExhibitPoints(pts, exhibitRuntime.width, exhibitRuntime.height);
        if (!normalized.length) {
          normalized = normalizeExhibitPoints(buildUltraImagePoints(img, exhibitRuntime.width, exhibitRuntime.height), exhibitRuntime.width, exhibitRuntime.height);
        }
        if (!normalized.length) {
          normalized = normalizeExhibitPoints(buildExhibitPointsFromImage(img, exhibitRuntime.width, exhibitRuntime.height, true), exhibitRuntime.width, exhibitRuntime.height);
        }
        if (cacheMap) {
          cacheMap[cacheKey || key] = normalized;
        }
        callback(normalized);
      };

      if (cached && cached.status === 'ready' && cached.image) {
        buildAndReturn(cached.image);
        return;
      }
      if (opts.silentLoad) {
        callback([]);
        return;
      }
      getCachedExhibitImage(key).then(function (img) {
        buildAndReturn(img);
        syncIntroduceExhibitTarget({ force: true, silentLoad: true });
      });
      callback([]);
    };

    var overviewSource = getIntroduceOverviewSource();
    exhibitRuntime.orbiters = [];

    if (view !== INTRODUCE_VIEW_DETAIL) {
      if (exhibitRuntime.overviewSource !== overviewSource) {
        exhibitRuntime.overviewSource = overviewSource;
        exhibitRuntime.overviewPoints = [];
      }
      ensurePointsFromSource(overviewSource, { overview: exhibitRuntime.overviewPoints }, 'overview', function (points) {
        if (points && points.length) {
          exhibitRuntime.overviewPoints = points;
          applyIntroducePoints(points, 'catalog:overview:' + overviewSource);
          return;
        }

        if (exhibitRuntime.overviewPoints && exhibitRuntime.overviewPoints.length) {
          applyIntroducePoints(exhibitRuntime.overviewPoints, 'catalog:cached-overview:' + overviewSource);
          return;
        }

        exhibitRuntime.introduceTransition = null;
        exhibitRuntime.lastAppliedTargetKey = '';
        exhibitRuntime.particles = [];
      });
      return;
    }

    var detailEntry = HOME_PATTERN_ENTRIES[toNumber(state.homePatternIndex, -1)] || null;
    var detailSource = detailEntry && detailEntry.image ? String(detailEntry.image) : '';
    if (!detailSource) {
      if (exhibitRuntime.overviewPoints.length) {
        applyIntroducePoints(exhibitRuntime.overviewPoints, 'detail:fallback-overview');
      }
      return;
    }

    if (Object.prototype.hasOwnProperty.call(exhibitRuntime.slideSourceToIndex, detailSource)) {
      var mappedIndex = toNumber(exhibitRuntime.slideSourceToIndex[detailSource], -1);
      if (mappedIndex >= 0 && mappedIndex < exhibitRuntime.slides.length) {
        var mappedPoints = exhibitRuntime.slides[mappedIndex];
        if (mappedPoints && mappedPoints.length) {
          applyIntroducePoints(mappedPoints, 'detail:mapped:' + detailSource);
          return;
        }
      }
    }

    ensurePointsFromSource(detailSource, exhibitRuntime.detailPointsBySource, detailSource, function (points) {
      if (points && points.length) {
        applyIntroducePoints(points, 'detail:' + detailSource);
        return;
      }

      var logoSource = getIntroduceOverviewSource();
      if (Object.prototype.hasOwnProperty.call(exhibitRuntime.slideSourceToIndex, logoSource)) {
        var logoIndex = toNumber(exhibitRuntime.slideSourceToIndex[logoSource], -1);
        if (logoIndex >= 0 && logoIndex < exhibitRuntime.slides.length) {
          var logoPoints = exhibitRuntime.slides[logoIndex];
          if (logoPoints && logoPoints.length) {
            applyIntroducePoints(logoPoints, 'detail:fallback-logo:' + logoSource);
            return;
          }
        }
      }

      if (exhibitRuntime.overviewPoints && exhibitRuntime.overviewPoints.length) {
        applyIntroducePoints(exhibitRuntime.overviewPoints, 'detail:fallback-overview');
        return;
      }

      for (var si = 0; si < exhibitRuntime.slides.length; si += 1) {
        if (exhibitRuntime.slides[si] && exhibitRuntime.slides[si].length) {
          applyIntroducePoints(exhibitRuntime.slides[si], 'detail:fallback-slide:' + String(si));
          return;
        }
      }
    });
  }

  function createExhibitOrbiter(width, height) {
    var floatSpeedBase = (Math.PI * 2) / (60 * 4.8);
    var ttl = 90 + Math.random() * 280;
    return {
      baseX: width * (0.46 + Math.random() * 0.08),
      baseY: height * (0.8 + Math.random() * 0.1),
      radiusX: 14 + Math.random() * 62,
      radiusY: 5 + Math.random() * 18,
      angle: Math.random() * Math.PI * 2,
      speed: (Math.random() < 0.5 ? -1 : 1) * (0.012 + Math.random() * 0.022),
      tilt: Math.random() * Math.PI * 2,
      size: 1 + Math.random() * 2.4,
      alpha: 0.14 + Math.random() * 0.26,
      tone: Math.random(),
      life: 0,
      ttl: ttl,
      ttlMax: ttl,
      px: NaN,
      py: NaN,
      floatPhase: Math.random() * Math.PI * 2,
      floatSpeed: floatSpeedBase * (0.92 + Math.random() * 0.16),
      floatAmplitude: 12 * (0.86 + Math.random() * 0.28),
    };
  }

  function syncExhibitOrbiters(width, height) {
    var target = clamp(Math.floor(Math.min(width, height) / 48), EXHIBIT_ORBITER_MIN, EXHIBIT_ORBITER_MAX);
    if (exhibitRuntime.orbiters.length > target) {
      exhibitRuntime.orbiters = exhibitRuntime.orbiters.slice(0, target);
    }
    while (exhibitRuntime.orbiters.length < target) {
      exhibitRuntime.orbiters.push(createExhibitOrbiter(width, height));
    }
  }

  function shouldAllowExhibitPointerInteraction(pointerX, pointerY, width, height) {
    if (!Number.isFinite(pointerX) || !Number.isFinite(pointerY)) {
      return false;
    }
    var quickKey = normalizeQuickNavKey(state.quickNavKey);
    if (quickKey !== 'introduce') {
      return true;
    }

    var view = normalizeIntroduceView(state.introduceView);
    var minX;
    var maxX;
    var minY;
    var maxY;

    if (view !== INTRODUCE_VIEW_DETAIL) {
      if (Number.isFinite(state.introducePointerX) && Number.isFinite(state.introducePointerY)) {
        return false;
      }
      minX = width * 0.16;
      maxX = width * 0.92;
      minY = height * 0.14;
      maxY = height * 0.9;
    } else {
      minX = width * 0.08;
      maxX = width * 0.94;
      minY = height * 0.1;
      maxY = height * 0.92;
    }

    return pointerX >= minX && pointerX <= maxX && pointerY >= minY && pointerY <= maxY;
  }

  function renderExhibitFrame() {
    if (!exhibitRuntime.ctx || !exhibitRuntime.canvas || !state.hideUiForBackdrop) {
      return;
    }
    var ctx = exhibitRuntime.ctx;
    var width = exhibitRuntime.width;
    var height = exhibitRuntime.height;
    var pointerX = exhibitRuntime.mouseX;
    var pointerY = exhibitRuntime.mouseY;
    var pointerInteractive = shouldAllowExhibitPointerInteraction(pointerX, pointerY, width, height);
    var inIntroducePage = normalizeQuickNavKey(state.quickNavKey) === 'introduce';
    if (inIntroducePage) {
      processIntroduceParticleTransitionFrame();
    } else {
      exhibitRuntime.introduceTransition = null;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();
    for (var i = exhibitRuntime.particles.length - 1; i >= 0; i -= 1) {
      var p = exhibitRuntime.particles[i];
      var dx = 0;
      var dy = 0;
      var distSq = Number.POSITIVE_INFINITY;
      var dist = -1;
      if (pointerInteractive) {
        dx = p.x - pointerX;
        dy = p.y - pointerY;
        distSq = dx * dx + dy * dy;
      }
      if (distSq < EXHIBIT_INTERACT_RADIUS_SQ) {
        dist = Math.sqrt(Math.max(distSq, 0.0001));
        var force = ((EXHIBIT_INTERACT_RADIUS - dist) / EXHIBIT_INTERACT_RADIUS) * 1.08;
        var invDist = 1 / dist;
        p.vx += dx * invDist * force;
        p.vy += dy * invDist * force;
      }

      p.vx += (p.tx - p.x) * 0.064;
      p.vy += (p.ty - p.y) * 0.064;
      p.vx *= 0.84;
      p.vy *= 0.84;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha += (p.ta - p.alpha) * (inIntroducePage ? 0.11 : 0.17);

      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
        p.x = p.tx;
        p.y = p.ty;
        p.vx = 0;
        p.vy = 0;
      }
      p.x = clamp(p.x, 0, width);
      p.y = clamp(p.y, 0, height);

      if (p.alpha < 0.02 && p.ta === 0) {
        exhibitRuntime.particles.splice(i, 1);
        continue;
      }

      var gradT = clamp(((p.x / Math.max(1, width)) * 0.38) + ((p.y / Math.max(1, height)) * 0.42) + ((Number.isFinite(p.tone) ? p.tone : 0.5) * 0.2), 0, 1);
      var color = sampleThemeGradient(gradT);
      var alphaGain = state.theme === 'light' ? 1.52 : 1.26;
      if (inIntroducePage) {
        alphaGain *= 1.28;
      }
      var alpha = clamp(p.alpha * alphaGain, 0, 1);
      var particleRadius = inIntroducePage ? 1.85 : 1.45;
      var trailRadius = inIntroducePage ? 2.7 : 2.2;
      ctx.fillStyle = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',' + alpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, particleRadius, 0, Math.PI * 2);
      ctx.fill();

      var trailAlpha = clamp(alpha * 0.18, 0, 0.34);
      ctx.fillStyle = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',' + trailAlpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, trailRadius, 0, Math.PI * 2);
      ctx.fill();

      var coreAlpha = clamp(alpha * 0.78, 0, 0.94);
      ctx.fillStyle = 'rgba(248,252,255,' + coreAlpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 0.75, 0, Math.PI * 2);
      ctx.fill();

      if (distSq < EXHIBIT_GLOW_RADIUS_SQ) {
        if (dist < 0) {
          dist = Math.sqrt(Math.max(distSq, 0.0001));
        }
        var glowAlpha = clamp((EXHIBIT_GLOW_RADIUS - dist) / EXHIBIT_GLOW_RADIUS, 0, 1) * 0.24;
        ctx.fillStyle = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',' + glowAlpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (inIntroducePage) {
      exhibitRuntime.orbiters = [];
    } else {
      syncExhibitOrbiters(width, height);
      for (var oi = exhibitRuntime.orbiters.length - 1; oi >= 0; oi -= 1) {
        var orbiter = exhibitRuntime.orbiters[oi];
        orbiter.life = Math.min(1, orbiter.life + 0.018);
        orbiter.ttl -= 1;
        orbiter.angle += orbiter.speed;
        orbiter.floatPhase += orbiter.floatSpeed;

        if (orbiter.ttl <= 0) {
          exhibitRuntime.orbiters[oi] = createExhibitOrbiter(width, height);
          continue;
        }

        var orbitFadeIn = Math.min(1, orbiter.life * 1.5);
        var orbitFadeOut = Math.min(1, (orbiter.ttl / Math.max(1, orbiter.ttlMax)) * 1.9);
        var orbitAlpha = orbiter.alpha * orbitFadeIn * orbitFadeOut;
        if (orbitAlpha <= 0.01) {
          continue;
        }

        var orbitX = orbiter.baseX + Math.cos(orbiter.angle) * orbiter.radiusX;
        var floatOffsetY = Math.sin(orbiter.floatPhase) * orbiter.floatAmplitude;
        var orbitY = orbiter.baseY + Math.sin(orbiter.angle + orbiter.tilt) * orbiter.radiusY + floatOffsetY;
        orbitX = clamp(orbitX, 2, width - 2);
        orbitY = clamp(orbitY, height * 0.63, height - 2);

        var orbitColor = sampleThemeGradient(clamp(0.36 + orbiter.tone * 0.46 + Math.sin(orbiter.angle * 0.7) * 0.12, 0, 1));

        if (Number.isFinite(orbiter.px) && Number.isFinite(orbiter.py)) {
          ctx.strokeStyle = 'rgba(' + orbitColor.r + ',' + orbitColor.g + ',' + orbitColor.b + ',' + (orbitAlpha * 0.34).toFixed(3) + ')';
          ctx.lineWidth = Math.max(0.6, orbiter.size * 0.44);
          ctx.beginPath();
          ctx.moveTo(orbiter.px, orbiter.py);
          ctx.lineTo(orbitX, orbitY);
          ctx.stroke();
        }

        ctx.fillStyle = 'rgba(' + orbitColor.r + ',' + orbitColor.g + ',' + orbitColor.b + ',' + orbitAlpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(orbitX, orbitY, orbiter.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(236,245,255,' + (orbitAlpha * 0.46).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(orbitX, orbitY, Math.max(0.5, orbiter.size * 0.45), 0, Math.PI * 2);
        ctx.fill();

        orbiter.px = orbitX;
        orbiter.py = orbitY;
      }
    }
    ctx.restore();
  }

  function renderFocusFlowFrame() {
    if (!focusFlowRuntime.ctx || !focusFlowRuntime.canvas || !state.hideUiForBackdrop) {
      return;
    }
    var ctx = focusFlowRuntime.ctx;
    var width = focusFlowRuntime.width;
    var height = focusFlowRuntime.height;
    if (width < 2 || height < 2) {
      return;
    }

    seedFocusFlowParticles();
    ctx.clearRect(0, 0, width, height);

    var palette = getThemeParticlePalette();
    var pointerX = Number.isFinite(state.mouseX)
      ? (state.mouseX - focusFlowRuntime.offsetLeft) * focusFlowRuntime.dpr
      : -9999;
    var pointerY = Number.isFinite(state.mouseY)
      ? (state.mouseY - focusFlowRuntime.offsetTop) * focusFlowRuntime.dpr
      : -9999;

    var streamXMap = [];
    for (var si = 0; si < focusFlowRuntime.streams.length; si += 1) {
      var stream = focusFlowRuntime.streams[si];
      stream.phase += stream.speed;
      stream.dashOffset += 0.8 + stream.speed * 40;
      var streamX = stream.x + Math.sin(stream.phase) * stream.sway;
      streamXMap[si] = streamX;

      var streamGrad = ctx.createLinearGradient(streamX, height + 10, streamX, stream.capY);
      streamGrad.addColorStop(0, 'rgba(' + palette.c.r + ',' + palette.c.g + ',' + palette.c.b + ',' + (stream.alpha * 0.58).toFixed(3) + ')');
      streamGrad.addColorStop(0.52, 'rgba(' + palette.a.r + ',' + palette.a.g + ',' + palette.a.b + ',' + (stream.alpha * 0.34).toFixed(3) + ')');
      streamGrad.addColorStop(1, 'rgba(' + palette.b.r + ',' + palette.b.g + ',' + palette.b.b + ',' + (stream.alpha * 0.09).toFixed(3) + ')');

      ctx.strokeStyle = streamGrad;
      ctx.lineWidth = stream.width;
      ctx.beginPath();
      ctx.moveTo(streamX, height + 10);
      ctx.lineTo(streamX, stream.capY);
      ctx.stroke();

      ctx.setLineDash([5, 12]);
      ctx.lineDashOffset = -stream.dashOffset;
      ctx.strokeStyle = 'rgba(' + palette.a.r + ',' + palette.a.g + ',' + palette.a.b + ',' + (stream.alpha * 0.26).toFixed(3) + ')';
      ctx.lineWidth = Math.max(1.2, stream.width * 0.62);
      ctx.beginPath();
      ctx.moveTo(streamX, height + 4);
      ctx.lineTo(streamX, stream.capY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (var bi = 0; bi < focusFlowRuntime.bits.length; bi += 1) {
      var bit = focusFlowRuntime.bits[bi];
      var anchorX = streamXMap[bit.streamId % Math.max(1, streamXMap.length)];
      if (!Number.isFinite(anchorX)) {
        anchorX = width * 0.5;
      }

      bit.vx += (anchorX - bit.x) * 0.018;
      applyFocusRepulsion(bit, pointerX, pointerY);
      bit.vx *= 0.9;
      bit.vy *= 0.97;
      bit.x += bit.vx;
      bit.y += bit.vy;
      bit.life += 0.007;

      var bitFade = clamp(1 - bit.life, 0, 1);
      var bt = clamp((height - bit.y) / Math.max(1, height), 0, 1);
      var bitColor = mixColor(palette.a, palette.b, bt);
      ctx.fillStyle = 'rgba(' + bitColor.r + ',' + bitColor.g + ',' + bitColor.b + ',' + (bit.alpha * bitFade).toFixed(3) + ')';
      ctx.fillRect(bit.x - bit.size * 0.5, bit.y - bit.size * 0.8, bit.size, bit.size * 1.6);

      if (bit.y < height * 0.5 || bit.x < -48 || bit.x > width + 48 || bit.life >= 1) {
        focusFlowRuntime.bits[bi] = createFlowBit(width, height, focusFlowRuntime.streams.length);
      }
    }

    for (var i = 0; i < focusFlowRuntime.particles.length; i += 1) {
      var p = focusFlowRuntime.particles[i];
      applyFocusRepulsion(p, pointerX, pointerY);

      p.vx += p.drift;
      p.vy -= 0.006;
      p.vx *= 0.94;
      p.vy *= 0.975;
      p.x += p.vx;
      p.y += p.vy;
      p.life += 0.005;

      var fade = clamp(1 - p.life, 0, 1);
      var t = clamp((height - p.y) / Math.max(1, height), 0, 1);
      var headColor = mixColor(palette.a, palette.b, t);
      var trailColor = mixColor(palette.c, palette.a, t * 0.8);

      ctx.strokeStyle = 'rgba(' + trailColor.r + ',' + trailColor.g + ',' + trailColor.b + ',' + (p.alpha * fade * 0.6).toFixed(3) + ')';
      ctx.lineWidth = Math.max(1, p.size * 0.9);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * p.trail, p.y - p.vy * p.trail);
      ctx.stroke();

      ctx.fillStyle = 'rgba(' + headColor.r + ',' + headColor.g + ',' + headColor.b + ',' + (p.alpha * fade).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      if (p.y < height * 0.48 || p.x < -48 || p.x > width + 48 || p.life >= 1) {
        focusFlowRuntime.particles[i] = createFlowParticle(width, height);
      }
    }
  }

  function startExhibitLoop() {
    if (exhibitRuntime.rafId) {
      window.cancelAnimationFrame(exhibitRuntime.rafId);
    }

    var minFrameGapMs = 1000 / 50;
    var lastFrameTs = 0;

    function loop(now) {
      if (!lastFrameTs || now - lastFrameTs >= minFrameGapMs) {
        lastFrameTs = now;
        renderExhibitFrame();
        renderFocusFlowFrame();
      }
      exhibitRuntime.rafId = window.requestAnimationFrame(loop);
    }

    exhibitRuntime.rafId = window.requestAnimationFrame(loop);
  }

  function syncCultureExhibit() {
    var zone = document.getElementById('cultureExhibitZone');
    var canvas = document.getElementById('cultureExhibitCanvas');
    if (!zone || !canvas) {
      teardownCultureExhibit();
      return;
    }

    syncFocusFlowCanvas();
    if (!exhibitRuntime.rafId) {
      startExhibitLoop();
    }

    if (exhibitRuntime.zone !== zone) {
      teardownCultureExhibit();
      exhibitRuntime.zone = zone;
      exhibitRuntime.canvas = canvas;
      exhibitRuntime.ctx = canvas.getContext('2d');
      exhibitRuntime.moveHandler = function (event) {
        var scale = Math.max(1, exhibitRuntime.dpr || window.devicePixelRatio || 1);
        exhibitRuntime.mouseX = (event.clientX - exhibitRuntime.pointerLeft) * scale;
        exhibitRuntime.mouseY = (event.clientY - exhibitRuntime.pointerTop) * scale;
      };
      exhibitRuntime.leaveHandler = function () {
        exhibitRuntime.mouseX = -9999;
        exhibitRuntime.mouseY = -9999;
      };
      zone.addEventListener('pointermove', exhibitRuntime.moveHandler);
      zone.addEventListener('pointerleave', exhibitRuntime.leaveHandler);
      exhibitRuntime.inited = true;
    }

    var dpr = Math.max(1, window.devicePixelRatio || 1);
    var rect = zone.getBoundingClientRect();
    exhibitRuntime.pointerLeft = rect.left;
    exhibitRuntime.pointerTop = rect.top;
    var nextWidth = Math.max(80, Math.floor(rect.width * dpr));
    var nextHeight = Math.max(80, Math.floor(rect.height * dpr));
    if (nextWidth !== exhibitRuntime.width || nextHeight !== exhibitRuntime.height) {
      exhibitRuntime.width = nextWidth;
      exhibitRuntime.height = nextHeight;
      exhibitRuntime.dpr = dpr;
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      exhibitRuntime.slides = [];
      exhibitRuntime.slideSourceToIndex = {};
      exhibitRuntime.orbiters = [];
    }

    if (!exhibitRuntime.slides.length) {
      if (normalizeQuickNavKey(state.quickNavKey) === 'introduce') {
        syncIntroduceExhibitTarget({ force: true });
      }
      exhibitRuntime.loadToken += 1;
      var loadToken = exhibitRuntime.loadToken;
      var loadSources = EXHIBIT_IMAGE_SOURCES.concat([THEME_ASSETS.darkLogo, THEME_ASSETS.lightLogo]);
      Promise.all(loadSources.map(function (src) {
        return getCachedExhibitImage(src);
      })).then(function (images) {
        if (loadToken !== exhibitRuntime.loadToken) {
          return;
        }
        if (!exhibitRuntime.zone || !exhibitRuntime.ctx || !state.hideUiForBackdrop) {
          return;
        }
        var patternImages = images.slice(0, EXHIBIT_IMAGE_SOURCES.length);
        exhibitRuntime.slides = [];
        exhibitRuntime.slideSourceToIndex = {};
        for (var pi = 0; pi < patternImages.length; pi += 1) {
          var pimg = patternImages[pi];
          if (!pimg) {
            continue;
          }
          var ppts = buildBinaryExhibitPointsFromImage(pimg, exhibitRuntime.width, exhibitRuntime.height);
          var normalizedBinary = normalizeExhibitPoints(ppts, exhibitRuntime.width, exhibitRuntime.height);
          if (normalizedBinary.length > 20) {
            exhibitRuntime.slideSourceToIndex[String(EXHIBIT_IMAGE_SOURCES[pi])] = exhibitRuntime.slides.length;
            exhibitRuntime.slides.push(normalizedBinary);
          }
        }

        var sourceMode = exhibitRuntime.slides.length ? 'image-binary' : 'none';
        if (!exhibitRuntime.slides.length) {
          exhibitRuntime.slides = [];
          exhibitRuntime.slideSourceToIndex = {};
          for (var ui = 0; ui < patternImages.length; ui += 1) {
            var uimg = patternImages[ui];
            if (!uimg) {
              continue;
            }
            var upts = buildUltraImagePoints(uimg, exhibitRuntime.width, exhibitRuntime.height);
            var normalizedUltra = normalizeExhibitPoints(upts, exhibitRuntime.width, exhibitRuntime.height);
            if (normalizedUltra.length > 20) {
              exhibitRuntime.slideSourceToIndex[String(EXHIBIT_IMAGE_SOURCES[ui])] = exhibitRuntime.slides.length;
              exhibitRuntime.slides.push(normalizedUltra);
            }
          }
          sourceMode = exhibitRuntime.slides.length ? 'image-ultra' : 'none';
        }

        if (!exhibitRuntime.slides.length) {
          exhibitRuntime.slides = [];
          exhibitRuntime.slideSourceToIndex = {};
          for (var ri = 0; ri < patternImages.length; ri += 1) {
            var rimg = patternImages[ri];
            if (!rimg) {
              continue;
            }
            var rpts = buildExhibitPointsFromImage(rimg, exhibitRuntime.width, exhibitRuntime.height, true);
            var normalizedRelaxed = normalizeExhibitPoints(rpts, exhibitRuntime.width, exhibitRuntime.height);
            if (normalizedRelaxed.length > 8) {
              exhibitRuntime.slideSourceToIndex[String(EXHIBIT_IMAGE_SOURCES[ri])] = exhibitRuntime.slides.length;
              exhibitRuntime.slides.push(normalizedRelaxed);
            }
          }
          sourceMode = exhibitRuntime.slides.length ? 'image-relaxed' : 'none';
        }

        var fallbackUsed = false;
        if (!exhibitRuntime.slides.length) {
          fallbackUsed = true;
          sourceMode = 'generated-fallback';
          exhibitRuntime.slideSourceToIndex = {};
          exhibitRuntime.slides = EXHIBIT_IMAGE_SOURCES.map(function (_, idx) {
            var pts = buildFallbackExhibitPoints(exhibitRuntime.width, exhibitRuntime.height, idx + 1);
            exhibitRuntime.slideSourceToIndex[String(EXHIBIT_IMAGE_SOURCES[idx])] = idx;
            return normalizeExhibitPoints(pts, exhibitRuntime.width, exhibitRuntime.height);
          });
        }

        if (typeof window !== 'undefined') {
          window.__exhibitDebug = {
            slideCount: exhibitRuntime.slides.length,
            pointCounts: exhibitRuntime.slides.map(function (arr) { return arr.length; }),
            width: exhibitRuntime.width,
            height: exhibitRuntime.height,
            theme: state.theme,
            fallbackUsed: fallbackUsed,
            sourceMode: sourceMode,
          };
        }
        if (exhibitRuntime.slides.length) {
          syncIntroduceExhibitTarget({ force: true });
          if (!exhibitRuntime.lastAppliedTargetKey) {
            applyExhibitSlide(exhibitRuntime.slideIndex);
          }
          restartExhibitTimer();
        }
      });
      return;
    }

    if (!exhibitRuntime.rafId) {
      startExhibitLoop();
    }
    if (!exhibitRuntime.particles.length && exhibitRuntime.slides.length) {
      syncIntroduceExhibitTarget({ force: true });
      if (!exhibitRuntime.lastAppliedTargetKey) {
        applyExhibitSlide(exhibitRuntime.slideIndex);
      }
    }
    syncIntroduceExhibitTarget();
    if (!exhibitRuntime.timerId && shouldRotateExhibitSlides()) {
      restartExhibitTimer();
    }
  }

  function applyShellChrome() {
    applyLayoutVars();
    refreshFloatingTitle();
    appRoot.classList.toggle('theme-dark', state.theme === 'dark');
    appRoot.classList.toggle('theme-light', state.theme !== 'dark');
    appRoot.classList.toggle('backdrop-expanded', state.backdropExpanded);
    appRoot.classList.toggle('backdrop-collapsed', !state.backdropExpanded);
    appRoot.classList.toggle('show-floating-title', state.showFloatingTitle);
    appRoot.classList.toggle('focus-mode', state.hideUiForBackdrop);
    appRoot.classList.toggle('wheel-expanded', state.wheelExpanded);
    appRoot.classList.toggle('wheel-assembling', state.wheelAssembling);
    appRoot.classList.toggle('wheel-dissolving', state.wheelDissolving);
    appRoot.classList.toggle('motion-particle-transition', state.motionParticleTransition);
    appRoot.classList.toggle('culture-showcase-collapsed', state.cultureShowcaseCollapsed);
    appRoot.classList.toggle('backdrop-transitioning', state.backdropTransitioning);
    appRoot.classList.toggle('backdrop-revealing', state.backdropRevealing);

    var activePageKey = normalizeQuickNavKey(state.quickNavKey);
    appRoot.classList.toggle('main-page-home', state.hideUiForBackdrop && activePageKey === 'home');
    appRoot.classList.toggle('main-page-tools', state.hideUiForBackdrop && activePageKey === 'tools');
    appRoot.classList.toggle('main-page-introduce', state.hideUiForBackdrop && activePageKey === 'introduce');
    appRoot.classList.toggle('main-page-culture', state.hideUiForBackdrop && activePageKey === 'culture');
    appRoot.classList.toggle('main-page-more', state.hideUiForBackdrop && activePageKey === 'more');
    var inIntroduce = state.hideUiForBackdrop && activePageKey === 'introduce';
    var introduceView = normalizeIntroduceView(state.introduceView);
    appRoot.classList.toggle('introduce-view-detail', inIntroduce && introduceView === INTRODUCE_VIEW_DETAIL);
    appRoot.classList.toggle('introduce-view-catalog', inIntroduce && introduceView !== INTRODUCE_VIEW_DETAIL);
    appRoot.classList.toggle('tools-compact-mode', state.hideUiForBackdrop && activePageKey === 'tools' && state.toolsCompactMode);

    var backdropVideo = document.getElementById('backdropVideo');
    if (backdropVideo) {
      var isToolsPage = state.hideUiForBackdrop && activePageKey === 'tools';
      var backdropSrc = state.theme === 'dark'
        ? (isToolsPage ? THEME_ASSETS.darkToolsBackdropVideo : THEME_ASSETS.darkBackdropVideo)
        : (isToolsPage ? THEME_ASSETS.lightToolsBackdropVideo : THEME_ASSETS.lightBackdropVideo);
      switchBackdropVideoSource(backdropVideo, backdropSrc);
      if (!backdropVideo.dataset.anchorBound) {
        backdropVideo.dataset.anchorBound = 'true';
        backdropVideo.addEventListener('loadedmetadata', function () {
          updateWheelAnchorFromBackdrop(true);
        });
        backdropVideo.addEventListener('loadeddata', updateWheelAnchorFromBackdrop);
      }
      if (typeof backdropVideo.play === 'function') {
        backdropVideo.play().catch(function () { });
      }
    }

    updateWheelAnchorFromBackdrop();

    var shouldShowExhibit = state.hideUiForBackdrop && (
      activePageKey === 'home'
      || activePageKey === 'introduce'
    );

    if (shouldShowExhibit) {
      scheduleCultureExhibitSync();
    } else {
      if (state.cultureSyncRaf) {
        window.cancelAnimationFrame(state.cultureSyncRaf);
        state.cultureSyncRaf = 0;
      }
      teardownCultureExhibit();
    }

    var frost = document.getElementById('pageFrost');
    if (frost) {
      frost.classList.toggle('page-content-frost-dark', state.theme === 'dark');
      frost.classList.toggle('page-content-frost-light', state.theme !== 'dark');
    }

    var floatingTitle = document.getElementById('floatingStageTitle');
    if (floatingTitle) {
      floatingTitle.classList.toggle('floating-stage-title-visible', state.showFloatingTitle);
    }

    var floatingThemeSwitch = document.getElementById('floatingThemeSwitch');
    if (floatingThemeSwitch) {
      floatingThemeSwitch.textContent = state.theme === 'dark' ? '霓虹' : '极昼';
    }

    var loadingMark = document.querySelector('.global-loading-mark');
    if (loadingMark) {
      loadingMark.setAttribute('src', state.theme === 'dark' ? THEME_ASSETS.darkLogo : THEME_ASSETS.lightLogo);
    }

    appRoot.classList.toggle('anchor-ready', state.anchorReady);
    appRoot.classList.toggle('anchor-frozen', state.anchorFreezePending);
    appRoot.classList.toggle('anchor-rebuild', state.anchorRebuild);
    syncQuickSidebarUi();

    scheduleFloatingTitleObstructionCheck();
  }

  function startBackdropReveal(floodDurationMs) {
    if (state.backdropRevealTimer) {
      window.clearTimeout(state.backdropRevealTimer);
    }
    var floodDuration = Math.max(0, toNumber(floodDurationMs, FLOOD_DURATION_MS));
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        state.backdropRevealing = true;
        applyShellChrome();
        if (state.backdropTransitionTimer) {
          window.clearTimeout(state.backdropTransitionTimer);
        }
        state.backdropTransitionTimer = window.setTimeout(function () {
          state.backdropTransitioning = false;
          applyShellChrome();
        }, floodDuration);
        state.backdropRevealTimer = window.setTimeout(function () {
          state.backdropRevealing = false;
          applyShellChrome();
        }, Math.max(260, floodDuration));
      });
    });
  }

  function switchBackdropVideoSource(backdropVideo, backdropSrc) {
    if (!backdropVideo || !backdropSrc) {
      return;
    }
    var currentSrc = String(backdropVideo.getAttribute('src') || '');
    if (currentSrc === backdropSrc) {
      return;
    }

    var switchToken = String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8);
    backdropVideo.dataset.switchToken = switchToken;
    backdropVideo.classList.add('page-backdrop-art-image-switching');

    var onLoaded = function () {
      if (backdropVideo.dataset.switchToken !== switchToken) {
        return;
      }
      backdropVideo.classList.remove('page-backdrop-art-image-switching');
      if (typeof backdropVideo.play === 'function') {
        backdropVideo.play().catch(function () { });
      }
    };

    backdropVideo.addEventListener('loadeddata', onLoaded, { once: true });
    backdropVideo.setAttribute('src', backdropSrc);
    backdropVideo.load();

    if (state.backdropVideoSwitchTimer) {
      window.clearTimeout(state.backdropVideoSwitchTimer);
      state.backdropVideoSwitchTimer = 0;
    }
    state.backdropVideoSwitchTimer = window.setTimeout(function () {
      if (backdropVideo.dataset.switchToken === switchToken) {
        backdropVideo.classList.remove('page-backdrop-art-image-switching');
      }
      state.backdropVideoSwitchTimer = 0;
    }, 520);
  }

  function syncRangeTrackFill(scope) {
    var root = scope || contentRoot;
    if (!root || typeof root.querySelectorAll !== 'function') {
      return;
    }
    var ranges = root.querySelectorAll('input[type="range"]');
    ranges.forEach(function (range) {
      var min = toNumber(range.min, 0);
      var max = toNumber(range.max, 100);
      var value = toNumber(range.value, min);
      var percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
      range.style.setProperty('--track-percent', percent.toFixed(3) + '%');
    });
  }

  function normalizeWheelAngle(angle) {
    var normalized = Number(angle) || 0;
    while (normalized > 180) normalized -= 360;
    while (normalized <= -180) normalized += 360;
    return normalized;
  }

  function getPointerAngle(cx, cy, px, py) {
    return Math.atan2(py - cy, px - cx) * 180 / Math.PI;
  }

  function getWheelIndexByAngle(angle) {
    var normalized = normalizeWheelAngle(angle);
    var slotCount = Math.max(1, COMPONENT_WHEEL_SLOTS.length);
    var index = ((Math.round((-normalized) / 60) % slotCount) + slotCount) % slotCount;
    return index;
  }

  function getActiveWheelSlot() {
    return COMPONENT_WHEEL_SLOTS[state.componentWheelIndex] || COMPONENT_WHEEL_SLOTS[0];
  }

  function buildWheelSlotsHtml() {
    return COMPONENT_WHEEL_SLOTS.map(function (slot, index) {
      var angle = index * 60;
      var activeClass = index === state.componentWheelIndex ? ' revolver-slot-active' : '';
      var availableClass = slot.available ? ' revolver-slot-available' : ' revolver-slot-locked';
      var shortLabel = slot.shortLabel || slot.label.slice(0, 2);
      return '<view class="revolver-slot' + activeClass + availableClass + '" data-action="wheel-slot" data-wheel-index="' + index + '" style="transform: rotate(' + angle + 'deg) translateY(var(--revolver-slot-radius));">'
        + '<text class="revolver-slot-label">' + escapeHtml(shortLabel) + '</text>'
        + '</view>';
    }).join('');
  }

  function buildExhibitSelectorHtml() {
    return EXHIBIT_IMAGE_SOURCES.map(function (src, index) {
      var safeSrc = encodeURI(src);
      var activeClass = index === exhibitRuntime.slideIndex ? ' exhibit-thumb-active' : '';
      return '<button class="exhibit-thumb' + activeClass + '" type="button" data-action="exhibit-select" data-exhibit-index="' + index + '" style="background-image:url(\'' + safeSrc + '\')">'
        + '<span class="exhibit-thumb-overlay"></span>'
        + '</button>';
    }).join('');
  }

  function buildQuickSidebarItemsHtml() {
    var navItems = [
      { key: 'home', label: 'INDEX', subLabel: '首页' },
      { key: 'tools', label: 'TOOLS', subLabel: '工具' },
      { key: 'introduce', label: 'INTRODUCE', subLabel: '介绍' },
      { key: 'culture', label: 'CULTURE', subLabel: '文创' },
      { key: 'more', label: 'MORE', subLabel: '更多内容' },
    ];

    return navItems.map(function (item) {
      var activeClass = state.quickNavKey === item.key ? ' quick-sidebar-item-active' : '';
      return '<view class="quick-sidebar-nav-block">'
        + '<button class="quick-sidebar-item quick-sidebar-item-nav' + activeClass + '" type="button" data-action="quick-nav" data-nav-key="' + escapeHtml(item.key) + '" data-page-index="' + getMainPageIndexByNavKey(item.key) + '" title="' + escapeHtml(item.label) + '">'
        + '<text class="quick-sidebar-item-label">' + escapeHtml(item.label) + '</text>'
        + '<text class="quick-sidebar-item-sub">' + escapeHtml(item.subLabel || '') + '</text>'
        + '</button>'
        + '</view>';
    }).join('');
  }

  function syncQuickSidebarUi() {
    var sidebar = document.getElementById('quickSidebar');
    if (!sidebar) {
      return;
    }
    var list = document.getElementById('quickSidebarList');
    if (list) {
      list.innerHTML = buildQuickSidebarItemsHtml();
    }
    var logo = document.getElementById('quickSidebarLogo');
    if (logo) {
      logo.src = state.theme === 'dark' ? THEME_ASSETS.darkLogo : THEME_ASSETS.lightLogo;
    }
  }

  function updateComponentHintBySlot(slot) {
    if (!slot) {
      state.componentHint = '拖动左轮查看组件效果';
      return;
    }
    state.componentHint = slot.effectLine || '该仓位暂未启用';
  }

  function getComponentEffectTextBySlot(slot) {
    if (!slot) {
      return '拖动左轮查看组件效果';
    }
    return slot.effectLine || '该仓位暂未启用';
  }

  function getComponentDetailTextBySlot(slot) {
    if (!slot) {
      return '拖动、点击、进入都可触发不同交互策略';
    }
    return slot.detailLine || '该组件暂未开放，敬请期待';
  }

  function getComponentDisplayNameBySlot(slot) {
    if (!slot) {
      return 'ComponentModule';
    }
    return slot.title || slot.label || 'ModuleLocked';
  }

  function animateWheelToIndex(index, onDone) {
    var slotCount = COMPONENT_WHEEL_SLOTS.length;
    if (index < 0 || index >= slotCount) {
      if (typeof onDone === 'function') {
        onDone();
      }
      return;
    }

    var targetAngle = normalizeWheelAngle(-index * 60);
    state.componentWheelIndex = index;
    updateComponentHintBySlot(COMPONENT_WHEEL_SLOTS[index]);

    var rotator = document.getElementById('componentWheelRotator');
    if (!rotator) {
      state.componentWheelAngle = targetAngle;
      syncComponentWheelUi();
      if (typeof onDone === 'function') {
        onDone();
      }
      return;
    }

    rotator.classList.remove('revolver-rotator-dragging');
    rotator.classList.add('revolver-rotator-snapping');
    state.componentWheelAngle = targetAngle;
    syncComponentWheelUi();

    if (state.wheelSnapTimer) {
      window.clearTimeout(state.wheelSnapTimer);
    }
    state.wheelSnapTimer = window.setTimeout(function () {
      var currentRotator = document.getElementById('componentWheelRotator');
      if (currentRotator) {
        currentRotator.classList.remove('revolver-rotator-snapping');
      }
      state.wheelSnapTimer = null;
      if (typeof onDone === 'function') {
        onDone();
      }
    }, 380);
  }

  function findWheelSlotIndexByKey(slotKey) {
    var key = String(slotKey || '').toLowerCase();
    if (!key) {
      return -1;
    }
    for (var i = 0; i < COMPONENT_WHEEL_SLOTS.length; i += 1) {
      var slot = COMPONENT_WHEEL_SLOTS[i];
      if (slot && String(slot.key || '').toLowerCase() === key) {
        return i;
      }
    }
    return -1;
  }

  function normalizeViewModeKey(rawMode) {
    var mode = String(rawMode || '').toLowerCase();
    if (MAIN_VIEW_KEYS.indexOf(mode) >= 0 || mode === 'home') {
      return normalizeMainViewKey(mode);
    }
    return findWheelSlotIndexByKey(mode) >= 0 ? mode : VIEW_MODE_INDEX;
  }

  function getViewModeFromUrl() {
    var params = new URLSearchParams(window.location.search || '');
    return normalizeViewModeKey(params.get(VIEW_MODE_QUERY_KEY));
  }

  function syncViewModeUrl(mode, usePushState) {
    if (!window.history || !window.location) {
      return;
    }
    var nextMode = normalizeViewModeKey(mode);
    var currentParams = new URLSearchParams(window.location.search || '');
    currentParams.set(VIEW_MODE_QUERY_KEY, nextMode);
    var nextQuery = currentParams.toString();
    var nextUrl = window.location.pathname + (nextQuery ? '?' + nextQuery : '') + (window.location.hash || '');
    var fn = usePushState ? 'pushState' : 'replaceState';
    try {
      window.history[fn](null, '', nextUrl);
    } catch (error) {
      // ignore history errors in restricted contexts
    }
  }

  function applyBackdropViewMode(viewModeKey, usePushState) {
    var normalizedMode = normalizeViewModeKey(viewModeKey);
    var toFocusMode = MAIN_VIEW_KEYS.indexOf(normalizedMode) >= 0;

    state.backdropExpanded = toFocusMode;
    state.hideUiForBackdrop = toFocusMode;

    if (toFocusMode) {
      hideWheelInstant();
      startAnchorFreeze(true);
      updateWheelAnchorFromBackdrop(true);
    }

    if (!toFocusMode) {
      hideWheelInstant();
      startAnchorFreeze(true);
      var slotIndex = findWheelSlotIndexByKey(normalizedMode);
      if (slotIndex < 0) {
        slotIndex = 0;
      }
      state.componentWheelIndex = slotIndex;
      state.componentWheelAngle = normalizeWheelAngle(-slotIndex * 60);
      updateComponentHintBySlot(COMPONENT_WHEEL_SLOTS[slotIndex]);
    }

    state.showFloatingTitle = false;
    if (toFocusMode) {
      state.quickNavKey = getNavKeyByViewKey(normalizedMode);
      if (state.quickNavKey === 'introduce') {
        state.introduceHoverIndex = -1;
        setIntroduceView(INTRODUCE_VIEW_CATALOG);
      } else {
        state.introduceHoverIndex = -1;
      }
      state.mainPageIndex = getMainPageIndexByNavKey(state.quickNavKey);
      syncFocusLayoutByPage();
    } else {
      state.quickNavKey = normalizedMode === 'damage-lab' ? 'tools' : 'more';
      state.mainPageIndex = getMainPageIndexByNavKey(state.quickNavKey);
    }
    state.backdropTransitioning = true;
    applyLayoutVars();
    updateWheelFlyOffsetVars();
    renderMain();

    if (toFocusMode) {
      startGlobalLoadingOverlay('LOADING INDEX', 1100, null, { waitForStable: true, maxStableWaitMs: 1800 });
      window.requestAnimationFrame(function () {
        syncFocusPageVisualState();
        updateWheelAnchorFromBackdrop();
        scheduleCultureExhibitSync();
      });
    }

    if (state.backdropTransitionTimer) {
      window.clearTimeout(state.backdropTransitionTimer);
    }
    startBackdropReveal(FLOOD_DURATION_MS);

    syncViewModeUrl(toFocusMode ? getViewKeyByNavKey(state.quickNavKey) : normalizedMode, usePushState);
  }

  function applyThemeToggle() {
    startGlobalLoadingOverlay('SWITCHING THEME', 980, function () {
      var keepWheelExpanded = !!state.wheelExpanded;
      var keepWheelAssembling = !!state.wheelAssembling;
      var keepWheelDissolving = !!state.wheelDissolving;
      var keepWheelTriggerNearby = !!state.wheelTriggerNearby;
      var keepWheelTriggerBurst = !!state.wheelTriggerBurst;
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      saveThemePreference(state.theme);
      refreshPatternEntryImages();
      syncExhibitImageSources();
      EXHIBIT_IMAGE_CACHE = Object.create(null);
      focusFlowRuntime.seededTheme = '';
      focusFlowRuntime.particles = [];
      focusFlowRuntime.streams = [];
      focusFlowRuntime.bits = [];
      exhibitRuntime.slides = [];
      exhibitRuntime.slideSourceToIndex = {};
      exhibitRuntime.particles = [];
      exhibitRuntime.orbiters = [];
      exhibitRuntime.introduceTransition = null;
      exhibitRuntime.overviewSource = '';
      exhibitRuntime.overviewPoints = [];
      exhibitRuntime.detailPointsBySource = {};
      exhibitRuntime.lastAppliedTargetKey = '';
      exhibitRuntime.loadToken += 1;
      state.wheelExpanded = keepWheelExpanded;
      state.wheelAssembling = keepWheelAssembling;
      state.wheelDissolving = keepWheelDissolving;
      state.wheelTriggerNearby = keepWheelTriggerNearby;
      state.wheelTriggerBurst = keepWheelTriggerBurst;
      state.showFloatingTitle = false;
      state.backdropTransitioning = false;
      state.backdropRevealing = false;
      syncFocusLayoutByPage();
      updateWheelAnchorFromBackdrop(true);
      updateWheelFlyOffsetVars();
      renderMain();
      if (state.hideUiForBackdrop) {
        window.requestAnimationFrame(function () {
          scheduleCultureExhibitSync();
          scheduleThemeExhibitRetry();
        });
      }
      applyShellChrome();
    }, { waitForStable: true, maxStableWaitMs: 1600 });
  }

  function snapComponentWheelToNearest() {
    var snappedIndex = getWheelIndexByAngle(state.componentWheelAngle);
    var targetAngle = normalizeWheelAngle(-snappedIndex * 60);
    state.componentWheelIndex = snappedIndex;

    var rotator = document.getElementById('componentWheelRotator');
    if (!rotator) {
      state.componentWheelAngle = targetAngle;
      updateComponentHintBySlot(getActiveWheelSlot());
      syncComponentWheelUi();
      return;
    }

    var delta = normalizeWheelAngle(targetAngle - state.componentWheelAngle);
    var overshoot = Math.abs(delta) > 2 ? normalizeWheelAngle(targetAngle + Math.sign(delta) * 6) : targetAngle;
    rotator.classList.remove('revolver-rotator-dragging');
    rotator.classList.add('revolver-rotator-snapping');

    state.componentWheelAngle = overshoot;
    updateComponentHintBySlot(getActiveWheelSlot());
    syncComponentWheelUi();

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        state.componentWheelAngle = targetAngle;
        syncComponentWheelUi();
      });
    });

    if (state.wheelSnapTimer) {
      window.clearTimeout(state.wheelSnapTimer);
    }
    state.wheelSnapTimer = window.setTimeout(function () {
      var currentRotator = document.getElementById('componentWheelRotator');
      if (currentRotator) {
        currentRotator.classList.remove('revolver-rotator-snapping');
      }
      state.wheelSnapTimer = null;
    }, 420);
  }

  function activateCurrentComponent() {
    var activeSlot = getActiveWheelSlot();
    if (!activeSlot) {
      return;
    }
    if (activeSlot.available && activeSlot.key === 'damage-lab') {
      window.location.href = 'damage-lab.html';
      return;
    }
    updateComponentHintBySlot(activeSlot);
    syncComponentWheelUi();
  }

  function syncComponentWheelUi() {
    var activeSlot = getActiveWheelSlot();
    var rotator = document.getElementById('componentWheelRotator');
    if (rotator) {
      rotator.style.transform = 'translate(-50%, -50%) rotate(' + state.componentWheelAngle.toFixed(2) + 'deg)';
    }
    var slots = contentRoot.querySelectorAll('.revolver-slot');
    slots.forEach(function (node, index) {
      node.classList.toggle('revolver-slot-active', index === state.componentWheelIndex);
    });
    var hintNode = document.getElementById('componentWheelHint');
    if (hintNode) {
      hintNode.textContent = getComponentEffectTextBySlot(activeSlot);
    }
    var detailNode = document.getElementById('componentWheelDetail');
    if (detailNode) {
      detailNode.textContent = getComponentDetailTextBySlot(activeSlot);
    }
    var currentNameNode = document.getElementById('componentWheelCurrentName');
    if (currentNameNode) {
      currentNameNode.textContent = getComponentDisplayNameBySlot(activeSlot);
    }
    var componentNameNode = document.getElementById('currentComponentName');
    if (componentNameNode) {
      componentNameNode.textContent = getComponentDisplayNameBySlot(activeSlot);
    }

    var focusToolTitleNode = document.getElementById('focusToolDetailTitle');
    if (focusToolTitleNode) {
      focusToolTitleNode.textContent = activeSlot && activeSlot.title ? activeSlot.title : '组件';
    }
    var focusToolEffectNode = document.getElementById('focusToolDetailEffect');
    if (focusToolEffectNode) {
      focusToolEffectNode.textContent = getComponentEffectTextBySlot(activeSlot);
    }
    var focusToolCopyNode = document.getElementById('focusToolDetailCopy');
    if (focusToolCopyNode) {
      focusToolCopyNode.textContent = getComponentDetailTextBySlot(activeSlot);
    }
    var focusToolActionNode = document.getElementById('focusToolDetailAction');
    if (focusToolActionNode) {
      var canEnter = !!(activeSlot && activeSlot.available && activeSlot.key === 'damage-lab');
      focusToolActionNode.textContent = canEnter ? '进入组件网页' : '开发中';
      focusToolActionNode.classList.toggle('focus-tool-detail-action-disabled', !canEnter);
      focusToolActionNode.setAttribute('data-enabled', canEnter ? 'true' : 'false');
    }
    syncQuickSidebarUi();
  }

  function scheduleWheelUiSync() {
    if (state.wheelUiRaf) {
      return;
    }
    state.wheelUiRaf = window.requestAnimationFrame(function () {
      state.wheelUiRaf = 0;
      syncComponentWheelUi();
    });
  }

  function updateWheelHoverFx(event) {
    var shell = contentRoot.querySelector('.revolver-shell');
    if (!shell || !state.hideUiForBackdrop) {
      return;
    }
    var rect = shell.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    var inside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
    if (!inside) {
      shell.classList.remove('revolver-shell-hovering');
      shell.style.setProperty('--hover-alpha', '0');
      return;
    }

    var nx = Math.max(0, Math.min(100, (x / Math.max(1, rect.width)) * 100));
    var ny = Math.max(0, Math.min(100, (y / Math.max(1, rect.height)) * 100));
    shell.classList.add('revolver-shell-hovering');
    shell.style.setProperty('--hover-x', nx.toFixed(2) + '%');
    shell.style.setProperty('--hover-y', ny.toFixed(2) + '%');
    shell.style.setProperty('--hover-alpha', '0.44');
  }

  function renderMain() {
    var page = state.page;
    if (!page) {
      return;
    }

    var form = page.form;
    var analysis = page.analysis;

    var attackerProfileField = page.showAttackerProfile
      ? '<view class="field-item field-item-half"><text class="field-label">配置</text>'
        + renderSelect('attackerProfile', page.attackerProfileOptions, page.attackerProfileOptions[page.attackerProfileIndex] && page.attackerProfileOptions[page.attackerProfileIndex].key)
        + '</view>'
      : '';

    var attackerLevelField = page.showAttackerLevel
      ? '<view class="field-item field-item-half"><text class="field-label">等级</text>'
        + renderSelect('attackerLevel', page.attackerLevelOptions, page.attackerLevelOptions[page.attackerLevelIndex] && page.attackerLevelOptions[page.attackerLevelIndex].key)
        + '</view>'
      : '';

    var attackerPostureField = page.showAttackerPosture
      ? '<view class="field-item field-item-half"><text class="field-label">姿态</text>'
        + renderSelect('attackerPosture', page.attackerPostureOptions, page.attackerPostureOptions[page.attackerPostureIndex] && page.attackerPostureOptions[page.attackerPostureIndex].key)
        + '</view>'
      : '';

    var targetProfileField = page.showTargetProfile
      ? '<view class="field-item field-item-half"><text class="field-label">配置</text>'
        + renderSelect('targetProfile', page.targetProfileOptions, page.targetProfileOptions[page.targetProfileIndex] && page.targetProfileOptions[page.targetProfileIndex].key)
        + '</view>'
      : '';

    var targetLevelField = page.showTargetLevel
      ? '<view class="field-item field-item-half"><text class="field-label">等级</text>'
        + renderSelect('targetLevel', page.targetLevelOptions, page.targetLevelOptions[page.targetLevelIndex] && page.targetLevelOptions[page.targetLevelIndex].key)
        + '</view>'
      : '';

    var targetPostureField = page.showTargetPosture
      ? '<view class="field-item field-item-half"><text class="field-label">姿态</text>'
        + renderSelect('targetPosture', page.targetPostureOptions, page.targetPostureOptions[page.targetPostureIndex] && page.targetPostureOptions[page.targetPostureIndex].key)
        + '</view>'
      : '';

    var targetMotionField = page.showTargetMotion
      ? '<view class="field-item field-item-half"><text class="field-label">受击状态</text>'
        + renderSelect('targetMotion', page.targetMotionOptions, page.targetMotionOptions[page.targetMotionIndex] && page.targetMotionOptions[page.targetMotionIndex].key)
        + '</view>'
      : '';

    var outpostWindowControl = page.showOutpostWindowControl
      ? '<view class="field-item full-span control-cluster">'
        + '<view class="mini-slider"><text class="mini-label">前哨可攻击窗口</text><view class="mini-value-input"><input class="slider-input" type="number" step="5" min="0" max="360" data-field="targetWindowDegrees" value="' + escapeHtml(form.targetWindowDegrees) + '" /><text class="slider-input-suffix">deg</text></view></view>'
        + '<view class="control-slider-shell shell-window"><view class="control-slider-rail"></view><input class="control-slider" type="range" min="0" max="360" step="5" data-field="targetWindowDegrees" value="' + escapeHtml(form.targetWindowDegrees) + '" /></view>'
        + '<view class="range-labels"><text>0°</text><text>窗口占空比 ' + escapeHtml(analysis.resolved.outpostWindowRatioText || '-') + '</text><text>360°</text></view>'
        + '</view>'
      : '';

    var currentHealthControl = '<view class="field-item full-span control-cluster">'
      + '<view class="mini-slider"><text class="mini-label">当前血量</text><view class="mini-value-input"><input class="slider-input" type="number" min="0" max="100" step="5" data-field="targetHealthPercent" value="' + escapeHtml(form.targetHealthPercent) + '" /><text class="slider-input-suffix">%</text></view></view>'
      + '<view class="control-slider-shell shell-window"><view class="control-slider-rail"></view><input class="control-slider" type="range" min="0" max="100" step="5" data-field="targetHealthPercent" value="' + escapeHtml(form.targetHealthPercent) + '" /></view>'
      + '<view class="range-labels"><text>0 血</text><text>' + escapeHtml(analysis.resolved.currentTargetHealth) + ' / ' + escapeHtml(analysis.resolved.maxTargetHealth) + '</text><text>满血</text></view>'
      + '</view>';

    var structureCritToggleText = form.enableStructureCrit ? '暴击已开启' : '暴击已关闭';
    var detailedHitRateToggleText = form.showDetailedHitRates ? '收起细化命中率' : '细化命中率';
    var hitRateModeText = (analysis.resolved && analysis.resolved.targetMotionText ? analysis.resolved.targetMotionText : '当前目标')
      + ' '
      + (analysis.resolved && analysis.resolved.activeHitRateText ? analysis.resolved.activeHitRateText : (String(form.hitRatePercent) + '%'));
    var hitRateDetailRows = form.showDetailedHitRates
      ? '<view class="hit-rate-detail-grid top-gap">'
        + '<view class="hit-rate-detail-item">'
        + '<view class="mini-slider"><text class="mini-label">静止命中率</text><view class="mini-value-input"><input class="slider-input" type="number" min="0" max="100" step="5" data-field="hitRateStationaryPercent" value="' + escapeHtml(form.hitRateStationaryPercent) + '" /><text class="slider-input-suffix">%</text></view></view>'
        + '<view class="control-slider-shell shell-hit"><view class="control-slider-rail"></view><input class="control-slider" type="range" min="0" max="100" step="5" data-field="hitRateStationaryPercent" value="' + escapeHtml(form.hitRateStationaryPercent) + '" /></view>'
        + '</view>'
        + '<view class="hit-rate-detail-item">'
        + '<view class="mini-slider"><text class="mini-label">平动命中率</text><view class="mini-value-input"><input class="slider-input" type="number" min="0" max="100" step="5" data-field="hitRateMovingPercent" value="' + escapeHtml(form.hitRateMovingPercent) + '" /><text class="slider-input-suffix">%</text></view></view>'
        + '<view class="control-slider-shell shell-hit"><view class="control-slider-rail"></view><input class="control-slider" type="range" min="0" max="100" step="5" data-field="hitRateMovingPercent" value="' + escapeHtml(form.hitRateMovingPercent) + '" /></view>'
        + '</view>'
        + '<view class="hit-rate-detail-item">'
        + '<view class="mini-slider"><text class="mini-label">小陀螺命中率</text><view class="mini-value-input"><input class="slider-input" type="number" min="0" max="100" step="5" data-field="hitRateSpinnerPercent" value="' + escapeHtml(form.hitRateSpinnerPercent) + '" /><text class="slider-input-suffix">%</text></view></view>'
        + '<view class="control-slider-shell shell-hit"><view class="control-slider-rail"></view><input class="control-slider" type="range" min="0" max="100" step="5" data-field="hitRateSpinnerPercent" value="' + escapeHtml(form.hitRateSpinnerPercent) + '" /></view>'
        + '</view>'
        + '<view class="hit-rate-detail-item">'
        + '<view class="mini-slider"><text class="mini-label">平动小陀螺命中率</text><view class="mini-value-input"><input class="slider-input" type="number" min="0" max="100" step="5" data-field="hitRateMovingSpinnerPercent" value="' + escapeHtml(form.hitRateMovingSpinnerPercent) + '" /><text class="slider-input-suffix">%</text></view></view>'
        + '<view class="control-slider-shell shell-hit"><view class="control-slider-rail"></view><input class="control-slider" type="range" min="0" max="100" step="5" data-field="hitRateMovingSpinnerPercent" value="' + escapeHtml(form.hitRateMovingSpinnerPercent) + '" /></view>'
        + '</view>'
        + '</view>'
      : '';
    var structureCritControl = page.showStructureCritControl
      ? '<view class="field-item full-span control-cluster">'
        + '<view class="mini-slider"><text class="mini-label">建筑暴击（基地/前哨）</text><view class="mini-value-input"><view class="theme-switch mini" data-action="toggle-structure-crit">' + structureCritToggleText + '</view></view></view>'
        + '<view class="mini-slider top-gap"><text class="mini-label">暴击概率</text><view class="mini-value-input"><input class="slider-input" type="number" min="0.5" max="100" step="0.5" data-field="structureCritChancePercent" value="' + escapeHtml(form.structureCritChancePercent) + '" /><text class="slider-input-suffix">%</text></view></view>'
        + '<view class="control-slider-shell shell-crit"><view class="control-slider-rail"></view><input class="control-slider" type="range" min="0.5" max="100" step="0.5" data-field="structureCritChancePercent" value="' + escapeHtml(form.structureCritChancePercent) + '" /></view>'
        + '<view class="range-labels"><text>0.5%</text><text>暴击判定 ' + escapeHtml(analysis.resolved.structureCritText || '关闭') + '</text><text>100%</text></view>'
        + '</view>'
      : '';

    var tauntData = buildBattleTaunt(analysis, form);
    var taunt = '';
    if (tauntData && ensureArray(tauntData.lines).length) {
      var warningLine = tauntData.warningLine ? String(tauntData.warningLine) : '';
      taunt = '<view class="summary-box taunt-box">'
        + '<text class="taunt-title">' + escapeHtml(tauntData.title || '战场嘴替') + '</text>'
        + ensureArray(tauntData.lines).map(function (line) {
          var lineText = String(line == null ? '' : line);
          var lineClass = warningLine && lineText === warningLine ? 'taunt-line taunt-line-warning' : 'taunt-line';
          return '<text class="' + lineClass + '">' + escapeHtml(lineText) + '</text>';
        }).join('')
        + '</view>';
    }

    var attackerTracks = ensureArray(page.attackerTimelineTracks);
    var targetTracks = ensureArray(page.targetTimelineTracks);
    var focusPageKey = normalizeQuickNavKey(state.quickNavKey);
    var isFocusHome = state.hideUiForBackdrop && focusPageKey === 'home';
    var isFocusTools = state.hideUiForBackdrop && focusPageKey === 'tools';
    var isFocusIntroduce = state.hideUiForBackdrop && focusPageKey === 'introduce';
    var isFocusCulture = state.hideUiForBackdrop && focusPageKey === 'culture';
    var introduceView = normalizeIntroduceView(state.introduceView);
    if (!isFocusIntroduce && introduceView !== INTRODUCE_VIEW_CATALOG) {
      introduceView = INTRODUCE_VIEW_CATALOG;
    }
    state.introduceView = introduceView;
    var introduceGroupKey = normalizeIntroduceGroupKey(state.introduceGroupKey);
    state.introduceGroupKey = introduceGroupKey;
    var introduceRows = getIntroduceRowsByGroupKey(introduceGroupKey);
    if (introduceRows.length && getIntroduceRowIndex(introduceRows, state.homePatternIndex) < 0) {
      state.homePatternIndex = introduceRows[0].patternIndex;
    }
    if (!introduceRows.length) {
      setIntroduceView(INTRODUCE_VIEW_CATALOG);
      state.introduceHoverIndex = -1;
      introduceView = INTRODUCE_VIEW_CATALOG;
    }
    var isToolsCompact = isFocusTools && state.toolsCompactMode;
    var showIntroduceParticle = isFocusIntroduce;
    var heroCardClass = state.hideUiForBackdrop
      ? ('hero-card hero-card-focus' + (isFocusHome ? ' hero-card-visible' : ''))
      : 'hero-card';
    var columnsClass = state.hideUiForBackdrop ? 'lab-columns lab-columns-hidden' : 'lab-columns';
    var collapseBridgeClass = 'collapse-bridge collapse-bridge-visible';
    var collapseButtonMarkup = state.hideUiForBackdrop
      ? ''
      : '<view class="collapse-bridge-btn theme-switch" data-action="toggle-backdrop">返回主界面</view>';
    var wheelClass = isFocusTools && !isToolsCompact ? 'component-revolver component-revolver-visible' : 'component-revolver';
    var exhibitClass = (isFocusHome || showIntroduceParticle) ? 'culture-exhibit-zone culture-exhibit-zone-visible' : 'culture-exhibit-zone';
    var flowCanvasClass = isFocusTools && !isToolsCompact ? 'focus-flow-canvas focus-flow-canvas-visible' : 'focus-flow-canvas';
    var currentComponentDisplayName = getComponentDisplayNameBySlot(getActiveWheelSlot());
    var currentComponentEffect = getComponentEffectTextBySlot(getActiveWheelSlot());
    var currentComponentDetail = getComponentDetailTextBySlot(getActiveWheelSlot());
    var safePatternIndex = Math.max(0, Math.min(HOME_PATTERN_ENTRIES.length - 1, toNumber(state.homePatternIndex, 0)));
    state.homePatternIndex = safePatternIndex;
    var activeRowIndex = getIntroduceRowIndex(introduceRows, safePatternIndex);
    var activeHomePattern = activeRowIndex >= 0 ? (introduceRows[activeRowIndex] && introduceRows[activeRowIndex].entry) : null;
    var hoverPatternIndex = toNumber(state.introduceHoverIndex, -1);
    var hoverRowIndex = getIntroduceRowIndex(introduceRows, hoverPatternIndex);
    if (hoverRowIndex < 0) {
      state.introduceHoverIndex = -1;
      hoverPatternIndex = -1;
    }
    var decoratePattern = hoverRowIndex >= 0 ? (introduceRows[hoverRowIndex] && introduceRows[hoverRowIndex].entry) : null;
    var introducePatternSection = '';
    var cultureShowcaseSection = '';
    var focusCarouselSection = '';
    if (state.hideUiForBackdrop) {
      var selectedSlot = getActiveWheelSlot();
      var selectedSlotCanEnter = !!(selectedSlot && selectedSlot.available && selectedSlot.key === 'damage-lab');
      var selectedSlotActionClass = selectedSlotCanEnter ? '' : ' focus-tool-detail-action-disabled';
      var pageWidth = 100 / MAIN_FOCUS_PAGES.length;
      var pageOffset = state.mainPageIndex * pageWidth;
      var compactSelectorHtml = COMPONENT_WHEEL_SLOTS.map(function (slot, index) {
        var activeClass = index === state.componentWheelIndex ? ' focus-tool-compact-item-active' : '';
        var availableClass = slot.available ? ' focus-tool-compact-item-ready' : ' focus-tool-compact-item-locked';
        return '<button type="button" class="focus-tool-compact-item' + activeClass + availableClass + '" data-action="focus-tool-select" data-wheel-index="' + index + '">'
          + '<text class="focus-tool-compact-item-name">' + escapeHtml(slot.title || slot.label || ('TOOL ' + String(index + 1))) + '</text>'
          + '</button>';
      }).join('');
      var compactSelectorSection = isToolsCompact
        ? '<view class="focus-tool-compact-panel"><text class="focus-tool-compact-title">组件选择</text><view class="focus-tool-compact-list">' + compactSelectorHtml + '</view></view>'
        : '';
      var cultureCardsHtml = HOME_PATTERN_ENTRIES.slice(0, 6).map(function (entry) {
        return '<view class="culture-showcase-card">'
          + '<img class="culture-showcase-img" src="' + encodeURI(entry.image) + '" alt="' + escapeHtml(entry.title) + '" />'
          + '<text class="culture-showcase-name">' + escapeHtml(entry.title) + '</text>'
          + '</view>';
      }).join('');
      focusCarouselSection = ''
        + '<view class="main-focus-carousel">'
        + '<view class="main-focus-track" style="--focus-page-count:' + String(MAIN_FOCUS_PAGES.length) + ';transform:translate3d(-' + pageOffset.toFixed(3) + '%, 0, 0);">'
        + '<view class="main-focus-page main-focus-page-index">'
        + '</view>'
        + '<view class="main-focus-page main-focus-page-tools">'
        + '<text class="main-focus-page-kicker">TOOLS / 工具页</text>'
        + '<text class="main-focus-page-title">组件选择</text>'
        + compactSelectorSection
        + '<view class="focus-tool-detail-panel">'
        + '<text id="focusToolDetailTitle" class="focus-tool-detail-title">' + escapeHtml(selectedSlot && selectedSlot.title ? selectedSlot.title : '组件') + '</text>'
        + '<text id="focusToolDetailEffect" class="focus-tool-detail-effect">' + escapeHtml(getComponentEffectTextBySlot(selectedSlot)) + '</text>'
        + '<text id="focusToolDetailCopy" class="focus-tool-detail-copy">' + escapeHtml(getComponentDetailTextBySlot(selectedSlot)) + '</text>'
        + '<button id="focusToolDetailAction" type="button" class="focus-tool-detail-action' + selectedSlotActionClass + '" data-action="focus-tool-enter" data-enabled="' + (selectedSlotCanEnter ? 'true' : 'false') + '">' + (selectedSlotCanEnter ? '进入组件网页' : '开发中') + '</button>'
        + '</view>'
        + '</view>'
        + '<view class="main-focus-page main-focus-page-introduce">'
        + '<text class="main-focus-page-kicker">INTRODUCE / 介绍页</text>'
        + '</view>'
        + '<view class="main-focus-page main-focus-page-culture">'
        + '<text class="main-focus-page-kicker">CULTURE / 文创页</text>'
        + '<text class="main-focus-page-title">文创展示 · 视觉资料</text>'
        + '<view class="culture-showcase-grid">' + cultureCardsHtml + '</view>'
        + '</view>'
        + '<view class="main-focus-page main-focus-page-more">'
        + '<text class="main-focus-page-kicker">MORE / 更多</text>'
        + '<text class="main-focus-page-title">扩展内容（预留）</text>'
        + '<view class="focus-page-placeholder-grid">'
        + '<view class="focus-page-placeholder-card"><text>活动入口</text></view>'
        + '<view class="focus-page-placeholder-card"><text>系统设置</text></view>'
        + '<view class="focus-page-placeholder-card"><text>公告模块</text></view>'
        + '</view>'
        + '</view>'
        + '</view>'
        + '</view>';
    }

    if (isFocusIntroduce) {
      var activeGroup = getIntroduceGroupByKey(introduceGroupKey);
      var hasIntroduceRows = introduceRows.length > 0;
      var groupTabsHtml = INTRODUCE_GROUPS.map(function (group) {
        var activeClass = group.key === introduceGroupKey ? ' introduce-group-tab-active' : '';
        return '<button type="button" class="introduce-group-tab' + activeClass + '" data-action="introduce-group-select" data-group-key="' + escapeHtml(group.key) + '">'
          + '<text>' + escapeHtml(group.label) + '</text>'
          + '</button>';
      }).join('');

      if (introduceView === INTRODUCE_VIEW_DETAIL && activeHomePattern) {
        var detailOrder = Math.max(0, activeRowIndex) + 1;
        var orderText = String(detailOrder);
        if (orderText.length < 2) {
          orderText = '0' + orderText;
        }
        var totalText = String(Math.max(1, introduceRows.length));
        if (totalText.length < 2) {
          totalText = '0' + totalText;
        }
        var progressPercent = introduceRows.length
          ? (detailOrder / introduceRows.length) * 100
          : 0;
        var navDisabled = introduceRows.length <= 1 ? ' introduce-arrow-disabled' : '';
        introducePatternSection = ''
          + '<view class="introduce-stage introduce-stage-mode-detail">'
          + '<view class="introduce-group-column">' + groupTabsHtml + '</view>'
          + '<button type="button" class="introduce-arrow introduce-arrow-left' + navDisabled + '" data-action="home-pattern-nav" data-pattern-delta="-1" aria-label="上一个条目"><span class="introduce-arrow-icon"></span></button>'
          + '<view class="introduce-core">'
          + '<view class="introduce-core-copy">'
          + '<text class="introduce-core-group">' + escapeHtml(activeGroup.label) + '</text>'
          + '<text class="introduce-core-cn">' + escapeHtml(activeHomePattern.title) + '</text>'
          + '<text class="introduce-core-en">' + escapeHtml(activeHomePattern.english || '') + '</text>'
          + '<text class="introduce-core-desc">' + escapeHtml(activeHomePattern.intro || '') + '</text>'
          + '<text class="introduce-core-tag">ARTINX INTRODUCTION</text>'
          + '</view>'
          + '</view>'
          + '<button type="button" class="introduce-arrow introduce-arrow-right' + navDisabled + '" data-action="home-pattern-nav" data-pattern-delta="1" aria-label="下一个条目"><span class="introduce-arrow-icon"></span></button>'
          + '<view class="introduce-side-index"><text class="introduce-side-total"> ' + orderText + ' / ' + totalText + '</text><text class="introduce-side-label">' + escapeHtml(activeGroup.label) + '</text></view>'
          + '<view class="introduce-progress-row">'
          + '<view class="introduce-progress-track"><view class="introduce-progress-fill" style="width:' + progressPercent.toFixed(3) + '%;"></view></view>'
          + '<button type="button" class="introduce-back-btn" data-action="introduce-back">BACK</button>'
          + '</view>'
          + '</view>';
      } else {
        var catalogRowsHtml = introduceRows.map(function (row) {
          var entry = row.entry || {};
          var activeClass = row.patternIndex === safePatternIndex ? ' introduce-catalog-row-active' : '';
          var hoverClass = row.patternIndex === hoverPatternIndex ? ' introduce-catalog-row-hover' : '';
          return '<button type="button" class="introduce-catalog-row' + activeClass + hoverClass + '" data-action="introduce-select" data-pattern-index="' + row.patternIndex + '">'
            + '<text class="introduce-catalog-cn">' + escapeHtml(entry.title || '') + '</text>'
            + '<text class="introduce-catalog-en">' + escapeHtml(entry.english || '') + '</text>'
            + '</button>';
        }).join('');

        var decorateClass = decoratePattern ? ' introduce-decor-panel-visible' : '';
        var decorateImageHtml = decoratePattern
          ? '<img class="introduce-decor-image" src="' + encodeURI(decoratePattern.image) + '" alt="' + escapeHtml(decoratePattern.title || '') + '" />'
          : '';
        var decorateWordHtml = decoratePattern
          ? '<text class="introduce-decor-word">' + escapeHtml(decoratePattern.english || '') + '</text>'
          : '';
        var catalogBodyHtml = hasIntroduceRows
          ? '<view id="introduceCatalogScroll" class="introduce-catalog-scroll">' + catalogRowsHtml + '</view>'
          : '<view class="introduce-catalog-empty">技术人员页面预留，敬请期待。</view>';

        introducePatternSection = ''
          + '<view class="introduce-catalog-stage introduce-stage-mode-catalog">'
          + '<view class="introduce-group-column">' + groupTabsHtml + '</view>'
          + '<view class="introduce-catalog-left">'
          + '<view id="introduceCatalogMain" class="introduce-catalog-main">'
          + '<view class="introduce-decor-panel' + decorateClass + '">'
          + decorateImageHtml
          + decorateWordHtml
          + '</view>'
          + '<view class="introduce-catalog-foreground">'
          + catalogBodyHtml
          + '</view>'
          + '</view>'
          + '</view>'
          + '</view>';
      }
    }

    if (isFocusCulture) {
      cultureShowcaseSection = '<view class="culture-stage-note">文创页面已恢复，可在此扩展海报、周边、视觉素材与活动记录。</view>';
    }
    updateComponentHintBySlot(getActiveWheelSlot());

    contentRoot.innerHTML = ''
      + '<view class="portrait-stage-shell">'
      + '<view class="portrait-stage-copy">'
      + '<text class="portrait-stage-kicker">ARTINX LAB</text>'
      + '<text class="portrait-stage-title">大道至简匠心至臻</text>'
      + '</view>'
      + '</view>'
      + focusCarouselSection
      + '<view class="' + heroCardClass + '">'
      + '<view class="hero-top">'
      + '<view class="hero-brand">'
      + '<view class="hero-texts">'
      + '<text class="hero-copy"></text>'
      + '</view>'
      + '</view>'
      + '<view class="hero-component-indicator">'
      + '<text class="hero-eyebrow hero-eyebrow-right">RoboMaster</text>'
      + '<text class="hero-university-inline hero-university-right">南方科技大学</text>'
      + '<text class="hero-title hero-title-right">ARTINX Laboratory</text>'
      + '<text class="hero-component-kicker">分界面</text>'
      + '<text id="currentComponentName" class="hero-component-name">' + escapeHtml(currentComponentDisplayName) + '</text>'
      + '</view>'
      + '</view>'
      + '</view>'
      + '<view class="' + collapseBridgeClass + '" data-layout-key="bridge">' + collapseButtonMarkup + '</view>'
      + '<view class="' + wheelClass + '" data-layout-key="wheel">'
      + '<view class="revolver-module-panel">'
      + '<text class="revolver-module-kicker">组件</text>'
      + '<text id="componentWheelCurrentName" class="revolver-module-current" data-action="wheel-enter">' + escapeHtml(currentComponentDisplayName) + '</text>'
      + '<text id="componentWheelHint" class="revolver-module-text">' + escapeHtml(currentComponentEffect) + '</text>'
      + '<text id="componentWheelDetail" class="revolver-module-detail">' + escapeHtml(currentComponentDetail) + '</text>'
      + '</view>'
      + '<view class="revolver-shell-wrap">'
      + '<view class="revolver-top-indicator" aria-hidden="true"></view>'
      + '<view class="revolver-shell">'
      + '<view id="componentWheelRotator" class="revolver-rotator" data-wheel-drag="true">'
      + buildWheelSlotsHtml()
      + '</view>'
      + '</view>'
      + '</view>'
      + '</view>'
      + '<view id="cultureExhibitZone" class="' + exhibitClass + '" data-layout-key="exhibit"><canvas id="cultureExhibitCanvas" class="culture-exhibit-canvas"></canvas></view>'
      + '<canvas id="focusFlowCanvas" class="' + flowCanvasClass + '" data-layout-key="flow"></canvas>'
      + introducePatternSection
      + cultureShowcaseSection

      + '<view class="' + columnsClass + '">'
      + '<view class="lab-main-column">'

      + '<view class="panel-card compact">'
      + '<view class="panel-header"><view class="panel-heading-inline"><text class="panel-kicker">ATTACKER</text><text class="panel-title panel-title-inline">攻击方</text></view></view>'
      + '<view class="field-grid">'
      + '<view class="field-item field-item-half"><text class="field-label">攻方</text>'
      + renderSelect('attackerRole', page.attackerRoleOptions, page.attackerRoleOptions[page.attackerRoleIndex] && page.attackerRoleOptions[page.attackerRoleIndex].key)
      + '</view>'
      + attackerProfileField
      + attackerPostureField
      + attackerLevelField
      + '<view class="field-item full-span control-cluster">'
      + '<view class="range-labels"><text>自动时长</text><text>实际仿真 ' + escapeHtml((analysis.resolved && analysis.resolved.simulatedDurationText) || '0.00s') + '</text><text>按目标存活</text></view>'
      + '<view class="mini-slider top-gap"><text class="mini-label">初始热量</text><view class="mini-value-input"><input class="slider-input" type="number" min="0" max="500" step="10" data-field="initialHeat" value="' + escapeHtml(form.initialHeat) + '" /></view></view>'
      + '<view class="control-slider-shell shell-heat"><view class="control-slider-rail"></view><input class="control-slider" type="range" min="0" max="500" step="10" data-field="initialHeat" value="' + escapeHtml(form.initialHeat) + '" /></view>'
      + '<view class="mini-slider top-gap"><text class="mini-label">请求射速</text><view class="mini-value-input"><input class="slider-input" type="number" min="0" max="30" step="0.5" data-field="requestedFireRateHz" value="' + escapeHtml(form.requestedFireRateHz) + '" /><text class="slider-input-suffix">Hz</text></view></view>'
      + '<view class="control-slider-shell shell-fire"><view class="control-slider-rail"></view><input class="control-slider" type="range" min="0" max="30" step="0.5" data-field="requestedFireRateHz" value="' + escapeHtml(form.requestedFireRateHz) + '" /></view>'
      + '<view class="mini-slider top-gap"><text class="mini-label">命中率</text><view class="mini-value-input"><input class="slider-input" type="number" min="0" max="100" step="5" data-field="hitRatePercent" value="' + escapeHtml(form.hitRatePercent) + '" /><text class="slider-input-suffix">%</text></view></view>'
      + '<view class="control-slider-shell shell-hit"><view class="control-slider-rail"></view><input class="control-slider" type="range" min="0" max="100" step="5" data-field="hitRatePercent" value="' + escapeHtml(form.hitRatePercent) + '" /></view>'
      + '<view class="range-labels"><text>0%</text><text>' + escapeHtml(hitRateModeText) + '</text><text>100%</text></view>'
      + '<view class="mini-slider top-gap"><text class="mini-label">命中率细化</text><view class="mini-value-input"><view class="theme-switch mini" data-action="toggle-detailed-hitrates">' + detailedHitRateToggleText + '</view></view></view>'
      + hitRateDetailRows
      + '</view>'
      + '<view class="field-item full-span field-note"><text>' + escapeHtml(analysis.resolved.attackerText || '') + '</text></view>'
      + '</view>'
      + '</view>'

      + '<view class="panel-card compact">'
      + '<view class="panel-header"><view class="panel-heading-inline"><text class="panel-kicker">TARGET</text><text class="panel-title panel-title-inline">受击方</text></view></view>'
      + '<view class="field-grid">'
      + '<view class="field-item field-item-half"><text class="field-label">单位</text>'
      + renderSelect('targetRole', page.targetRoleOptions, page.targetRoleOptions[page.targetRoleIndex] && page.targetRoleOptions[page.targetRoleIndex].key)
      + '</view>'
      + targetProfileField
      + targetPostureField
      + targetLevelField
      + '<view class="field-item field-item-half"><text class="field-label">受击部位</text>'
      + renderSelect('targetPart', page.targetPartOptions, page.targetPartOptions[page.targetPartIndex] && page.targetPartOptions[page.targetPartIndex].key)
      + '</view>'
      + targetMotionField
      + currentHealthControl
      + outpostWindowControl
      + structureCritControl
      + '<view class="field-item full-span field-note"><text>' + escapeHtml(analysis.resolved.targetText || '') + '</text></view>'
      + '</view>'
      + '</view>'

      + '<view class="panel-card compact">'
      + '<view class="panel-header"><view class="panel-heading-inline"><text class="panel-kicker">BUFFS / DEBUFFS</text><text class="panel-title panel-title-inline">增益 / 减益</text></view></view>'
      + '<text class="section-label">攻击方状态</text>'
      + '<view class="effect-grid">' + renderEffectRows(page.attackerEffectRows, 'attacker') + '</view>'
      + '<text class="section-label section-gap">受击方状态</text>'
      + '<view class="effect-grid">' + renderEffectRows(page.targetEffectRows, 'target') + '</view>'
      + '</view>'

      + '<view class="panel-card compact">'
      + '<view class="panel-header align-center"><view class="panel-heading-inline"><text class="panel-kicker">TIMELINE</text><text class="panel-title panel-title-inline">出伤进程</text></view></view>'
      + '<text class="section-label">攻击方轨道</text>'
      + (attackerTracks.length
        ? '<view class="timeline-board"><view class="timeline-axis"><text>' + escapeHtml(page.timelineRangeStartLabel) + '</text><text>' + escapeHtml(page.timelineRangeEndLabel) + '</text></view>' + renderTimelineRows(attackerTracks, 'attacker', page.simulationStartPercent, page.simulationSpanPercent) + '</view>'
        : '<view class="summary-box compact-empty"><text class="summary-line">攻击方当前还没有可用状态</text></view>')
      + '<text class="section-label section-gap">受击方轨道</text>'
      + (targetTracks.length
        ? '<view class="timeline-board timeline-board-target"><view class="timeline-axis"><text>' + escapeHtml(page.timelineRangeStartLabel) + '</text><text>' + escapeHtml(page.timelineRangeEndLabel) + '</text></view>' + renderTimelineRows(targetTracks, 'target', page.simulationStartPercent, page.simulationSpanPercent) + '</view>'
        : '<view class="summary-box compact-empty"><text class="summary-line">受击方当前还没有可用状态</text></view>')
      + '</view>'

      + '</view>'
      + '<view class="lab-right-column">'

      + '<view class="panel-card compact panel-data" data-panel="data">'
      + '<view class="panel-header align-center"><view class="panel-heading-inline"><text class="panel-kicker">DATA</text><text class="panel-title panel-title-inline">数据分析</text></view></view>'
      + '<view class="metric-grid">' + renderMetricRows(page.metricRows) + '</view>'
      + '<view class="summary-box"><view class="summary-highlight-grid">' + renderSummaryHighlightRows(page.summaryHighlightRows) + '</view>'
      + renderNotes(analysis.summaryLines)
      + '</view>'
      + taunt
      + '</view>'

      + '<view class="panel-card compact panel-curves">'
      + '<view class="panel-header align-center"><view class="panel-heading-inline"><text class="panel-kicker">CURVES</text><text class="panel-title panel-title-inline">数值曲线</text></view><view class="theme-switch mini" data-action="refresh-sim">刷新</view></view>'

      + '<view class="chart-card">'
      + '<view class="chart-head"><view><text class="chart-title">' + escapeHtml(analysis.charts.output.title) + '</text><text class="chart-subtitle">' + escapeHtml(analysis.charts.output.subtitle) + '</text></view><view class="chart-chip">' + escapeHtml(analysis.charts.output.unitHint) + '</view></view>'
      + '<view class="legend-row">' + renderLegend(analysis.charts.output.series) + '</view>'
      + '<view id="outputChartWrap" class="chart-touch-layer" data-chart-key="output"><canvas id="outputChart" class="chart-canvas"></canvas></view>'
      + '</view>'

      + '<view class="chart-card">'
      + '<view class="chart-head"><view><text class="chart-title">' + escapeHtml(analysis.charts.target.title) + '</text><text class="chart-subtitle">' + escapeHtml(analysis.charts.target.subtitle) + '</text></view><view class="chart-chip">' + escapeHtml(analysis.charts.target.unitHint) + '</view></view>'
      + '<view class="legend-row">' + renderLegend(analysis.charts.target.series) + '</view>'
      + '<view id="targetChartWrap" class="chart-touch-layer" data-chart-key="target"><canvas id="targetChart" class="chart-canvas"></canvas></view>'
      + '</view>'

      + '</view>'
      + '</view>'
      + '</view>'
      + '<view class="lab-bottom-note"><text class="lab-footer-copy">由 南科大ARTINX战队-归尘 开发，仍在优化阶段 如有不合理之处敬请谅解</text>'
      + '<text class="lab-footer-version">版本号 v2.2.4</text></view>'
      + '</view>';

    if (isFocusIntroduce && introduceView !== INTRODUCE_VIEW_DETAIL) {
      var catalogStageNode = contentRoot.querySelector('.introduce-catalog-stage');
      var catalogMainNode = contentRoot.querySelector('#introduceCatalogMain');
      if (catalogStageNode) {
        var kickIntroduceFollowLoop = function () {
          if (state.introduceFollowRaf) {
            return;
          }
          var step = function () {
            state.introduceFollowRaf = 0;
            var panelNode = contentRoot.querySelector('.introduce-decor-panel');
            if (!panelNode) {
              return;
            }
            state.introduceFollowX += (state.introduceFollowTargetX - state.introduceFollowX) * 0.22;
            state.introduceFollowY += (state.introduceFollowTargetY - state.introduceFollowY) * 0.22;
            panelNode.style.setProperty('--follow-x', (state.introduceFollowX * 100).toFixed(3) + '%');
            panelNode.style.setProperty('--follow-y', (state.introduceFollowY * 100).toFixed(3) + '%');
            var dx = Math.abs(state.introduceFollowTargetX - state.introduceFollowX);
            var dy = Math.abs(state.introduceFollowTargetY - state.introduceFollowY);
            if (dx > 0.001 || dy > 0.001) {
              state.introduceFollowRaf = window.requestAnimationFrame(step);
            }
          };
          state.introduceFollowRaf = window.requestAnimationFrame(step);
        };

        var updateIntroduceDecorAnchor = function () {
          var panel = contentRoot.querySelector('.introduce-decor-panel');
          if (!panel || state.introduceHoverIndex < 0) {
            return;
          }
          var hostRect = catalogMainNode ? catalogMainNode.getBoundingClientRect() : panel.getBoundingClientRect();
          if (!hostRect || hostRect.height <= 0) {
            return;
          }
          var rowNode = catalogStageNode.querySelector('.introduce-catalog-row[data-pattern-index="' + String(state.introduceHoverIndex) + '"]');
          if (!rowNode) {
            return;
          }
          var rowRect = rowNode.getBoundingClientRect();
          var centerYRatio = clamp(((rowRect.top + rowRect.height * 0.5) - hostRect.top) / hostRect.height, 0.1, 0.9);
          panel.style.setProperty('--anchor-y', (centerYRatio * 100).toFixed(3) + '%');
        };

        var updateIntroduceDecorMotion = function (clientX, clientY) {
          var panel = contentRoot.querySelector('.introduce-decor-panel');
          if (!panel || state.introduceHoverIndex < 0) {
            return;
          }
          var hostRect = catalogMainNode ? catalogMainNode.getBoundingClientRect() : panel.getBoundingClientRect();
          if (!hostRect || hostRect.width <= 0 || hostRect.height <= 0) {
            return;
          }
          if (clientX < hostRect.left || clientX > hostRect.right || clientY < hostRect.top || clientY > hostRect.bottom) {
            panel.style.setProperty('--mouse-x', '0');
            panel.style.setProperty('--mouse-y', '0');
            state.introduceFollowTargetX = 0.5;
            state.introduceFollowTargetY = 0.5;
            kickIntroduceFollowLoop();
            return;
          }
          var px = ((clientX - hostRect.left) / hostRect.width) * 2 - 1;
          var py = ((clientY - hostRect.top) / hostRect.height) * 2 - 1;
          var rx = clamp((clientX - hostRect.left) / hostRect.width, 0.08, 0.92);
          var ry = clamp((clientY - hostRect.top) / hostRect.height, 0.1, 0.9);
          panel.style.setProperty('--mouse-x', String(clamp(px, -1, 1)));
          panel.style.setProperty('--mouse-y', String(clamp(py, -1, 1)));
          state.introduceFollowTargetX = rx;
          state.introduceFollowTargetY = ry;
          kickIntroduceFollowLoop();
          updateIntroduceDecorAnchor();
        };

        var resetDecorMotion = function () {
          var panel = contentRoot.querySelector('.introduce-decor-panel');
          if (panel) {
            panel.style.setProperty('--mouse-x', '0');
            panel.style.setProperty('--mouse-y', '0');
            panel.style.setProperty('--anchor-y', '24%');
          }
          state.introduceFollowTargetX = 0.5;
          state.introduceFollowTargetY = 0.5;
          kickIntroduceFollowLoop();
        };

        var handleCatalogMouseMove = function (event) {
          state.introducePointerX = event.clientX;
          state.introducePointerY = event.clientY;
          var rowNode = event.target.closest('.introduce-catalog-row');
          if (!rowNode) {
            if (state.introduceHoverIndex >= 0) {
              state.introduceHoverIndex = -1;
              resetDecorMotion();
              renderMain();
            }
            return;
          }
          var hoverIndex = toNumber(rowNode.getAttribute('data-pattern-index'), -1);
          if (hoverIndex < 0 || hoverIndex >= HOME_PATTERN_ENTRIES.length) {
            return;
          }
          if (hoverIndex !== state.introduceHoverIndex) {
            state.introduceHoverIndex = hoverIndex;
            renderMain();
            return;
          }
          updateIntroduceDecorAnchor();
          updateIntroduceDecorMotion(event.clientX, event.clientY);
        };

        if (catalogMainNode) {
          catalogMainNode.addEventListener('mousemove', handleCatalogMouseMove);
          catalogMainNode.addEventListener('mouseleave', function () {
            state.introducePointerX = null;
            state.introducePointerY = null;
            if (state.introduceHoverIndex >= 0) {
              state.introduceHoverIndex = -1;
              resetDecorMotion();
              renderMain();
            }
          });
        }

        catalogStageNode.addEventListener('mouseleave', function () {
          if (state.introduceHoverIndex < 0) {
            return;
          }
          state.introducePointerX = null;
          state.introducePointerY = null;
          resetDecorMotion();
          state.introduceHoverIndex = -1;
          renderMain();
        });

        if (Number.isFinite(state.introducePointerX) && Number.isFinite(state.introducePointerY)) {
          updateIntroduceDecorAnchor();
          updateIntroduceDecorMotion(state.introducePointerX, state.introducePointerY);
        } else {
          state.introduceFollowTargetX = 0.5;
          state.introduceFollowTargetY = 0.5;
          kickIntroduceFollowLoop();
        }
      }
    }

    syncRangeTrackFill(contentRoot);
    applyShellChrome();
    syncComponentWheelUi();
    scheduleFloatingTitleObstructionCheck();

    renderCharts();
  }

  function getChartTheme() {
    if (state.theme === 'dark') {
      return {
        gridColor: 'rgba(194, 255, 18, 0.14)',
        axisColor: 'rgba(255, 255, 255, 0.28)',
        tickColor: 'rgba(255, 255, 255, 0.72)',
        tickAccentColor: '#c2ff12',
        textColor: '#f8fbff',
      };
    }
    return {
      gridColor: 'rgba(145, 76, 255, 0.18)',
      axisColor: 'rgba(127, 69, 242, 0.28)',
      tickColor: 'rgba(75, 45, 138, 0.72)',
      tickAccentColor: '#7f45f2',
      textColor: '#2a184d',
    };
  }

  function drawSingleChart(wrapId, canvasId, chartKey, chartData) {
    var wrap = document.getElementById(wrapId);
    if (!wrap || !chartData) {
      return;
    }
    var width = Math.max(420, Math.floor(wrap.clientWidth || 420));
    var height = width >= 600 ? Math.max(300, Math.floor(width * 0.56)) : Math.max(220, Math.floor(width * 0.52));
    var viewport = state.viewport[chartKey] || { start: 0, end: 1 };
    renderChart(canvasId, chartData, width, height, getChartTheme(), viewport);
  }

  function renderCharts() {
    if (!state.page || !state.page.analysis || !state.page.analysis.charts) {
      return;
    }
    drawSingleChart('outputChartWrap', 'outputChart', 'output', state.page.analysis.charts.output);
    drawSingleChart('targetChartWrap', 'targetChart', 'target', state.page.analysis.charts.target);
  }

  function recompute() {
    try {
      state.page = buildPageState(clone(state.form));
      state.form = clone(state.page.form);
      renderMain();
    } catch (error) {
      console.error(error);
    }
  }

  function getScheduleArrayName(side) {
    return side === 'attacker' ? 'attackerSchedules' : 'targetSchedules';
  }

  function updateSchedule(side, effectKey, patch) {
    var arrName = getScheduleArrayName(side);
    var list = ensureArray(state.form[arrName]).slice();
    var index = list.findIndex(function (item) { return item && item.effectKey === effectKey; });
    if (index === -1) {
      list.push(Object.assign({
        effectKey: effectKey,
        startSec: 0,
        endSec: toNumber(state.form.durationSec, 60),
      }, patch || {}));
    } else {
      list[index] = Object.assign({}, list[index], patch || {}, { effectKey: effectKey });
    }
    state.form[arrName] = list;
  }

  function toggleEffect(side, effectKey) {
    var effectField = side === 'attacker' ? 'attackerEffects' : 'targetEffects';
    var scheduleField = side === 'attacker' ? 'attackerSchedules' : 'targetSchedules';
    var effects = ensureArray(state.form[effectField]).slice();
    var exists = effects.includes(effectKey);

    if (exists) {
      state.form[effectField] = effects.filter(function (item) { return item !== effectKey; });
      state.form[scheduleField] = ensureArray(state.form[scheduleField]).filter(function (item) {
        return item && item.effectKey !== effectKey;
      });
    } else {
      effects.push(effectKey);
      state.form[effectField] = effects;
    }

    recompute();
  }

  function setField(field, rawValue) {
    if (!field) {
      return;
    }

    var value = rawValue;
    if (NUMERIC_FIELDS.has(field)) {
      var fallback = toNumber(state.form[field], 0);
      value = toNumber(rawValue, fallback);
      if (INT_FIELDS.has(field)) {
        value = Math.round(value);
      }
    }

    state.form[field] = value;

    if (field === 'attackerRole' && state.form.targetRole === 'outpost') {
      state.form.targetWindowDegrees = getOutpostWindowDefault(String(value));
    }
    if (field === 'targetRole') {
      if (String(value) === 'outpost') {
        state.form.targetWindowDegrees = getOutpostWindowDefault(String(state.form.attackerRole));
        state.form.targetPart = 'central_plate';
      }
      if (String(value) === 'base') {
        state.form.targetPart = 'normal_plate';
      }
    }

    if (field === 'hitRatePercent') {
      applyMainHitRateToDetail(value);
    }

    if (HIT_RATE_DETAIL_FIELDS.has(field) || field === 'targetRole' || field === 'targetPart' || field === 'targetMotion' || field === 'hitRatePercent') {
      syncMainHitRateFromDetail();
    }

    recompute();
  }

  function normalizeViewport(viewport) {
    var start = Math.max(0, Math.min(0.95, toNumber(viewport.start, 0)));
    var end = Math.max(start + 0.05, Math.min(1, toNumber(viewport.end, 1)));
    return { start: start, end: end };
  }

  function setViewport(chartKey, viewport) {
    state.viewport[chartKey] = normalizeViewport(viewport);
    renderCharts();
  }

  function handlePointerDown(event) {
    var exhibitDragNode = event.target.closest('[data-exhibit-drag="true"]');
    if (exhibitDragNode && state.hideUiForBackdrop && event.button === 0) {
      stopExhibitSelectorMotion();
      exhibitRuntime.selectorDragging = true;
      if (!Number.isFinite(exhibitRuntime.selectorOffsetPx)) {
        alignExhibitSelectorToSlide();
      }
      var startOffset = Number.isFinite(exhibitRuntime.selectorOffsetPx) ? exhibitRuntime.selectorOffsetPx : 0;
      var now = Date.now();
      state.exhibitDrag = {
        pointerId: event.pointerId,
        handleNode: exhibitDragNode,
        startX: event.clientX,
        lastX: event.clientX,
        startOffset: startOffset,
        lastTs: now,
        velocityPx: 0,
        travelPx: 0,
      };
      if (typeof exhibitDragNode.setPointerCapture === 'function') {
        exhibitDragNode.setPointerCapture(event.pointerId);
      }
      updateExhibitSelectorArc();
      event.preventDefault();
      return;
    }

    var wheelDragNode = event.target.closest('[data-wheel-drag="true"]');
    if (wheelDragNode && state.hideUiForBackdrop) {
      var shell = contentRoot.querySelector('.revolver-shell');
      if (!shell) {
        return;
      }
      var rect = shell.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;
      state.wheelDrag = {
        pointerId: event.pointerId,
        centerX: centerX,
        centerY: centerY,
        startPointerAngle: getPointerAngle(centerX, centerY, event.clientX, event.clientY),
        startWheelAngle: state.componentWheelAngle,
        handleNode: wheelDragNode,
      };
      if (typeof wheelDragNode.setPointerCapture === 'function') {
        wheelDragNode.setPointerCapture(event.pointerId);
      }
      wheelDragNode.classList.remove('revolver-rotator-snapping');
      wheelDragNode.classList.add('revolver-rotator-dragging');
      event.preventDefault();
      return;
    }

    var timelineHandle = event.target.closest('[data-action="timeline-drag"]');
    if (timelineHandle) {
      var rect = timelineHandle.parentElement ? timelineHandle.parentElement.getBoundingClientRect() : timelineHandle.getBoundingClientRect();
      state.timelineDrag = {
        side: timelineHandle.getAttribute('data-side'),
        effectKey: timelineHandle.getAttribute('data-effect-key'),
        timelineMin: toNumber(timelineHandle.getAttribute('data-timeline-min'), 0),
        timelineMax: toNumber(timelineHandle.getAttribute('data-timeline-max'), 60),
        duration: Math.max(0.1, toNumber(timelineHandle.getAttribute('data-duration'), 1)),
        originStartSec: toNumber(timelineHandle.getAttribute('data-start-sec'), 0),
        startX: event.clientX,
        rect: rect,
        lastAppliedStartSec: null,
        pointerId: event.pointerId,
        handleNode: timelineHandle,
      };
      if (typeof timelineHandle.setPointerCapture === 'function') {
        timelineHandle.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      return;
    }

    var wrap = event.target.closest('.chart-touch-layer');
    if (!wrap) {
      return;
    }
    if (event.button !== 0) {
      return;
    }

    var chartKey = wrap.getAttribute('data-chart-key');
    var viewport = normalizeViewport(state.viewport[chartKey] || { start: 0, end: 1 });
    state.drag = {
      key: chartKey,
      startX: event.clientX,
      startViewport: viewport,
      width: Math.max(1, wrap.clientWidth),
    };

    wrap.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    updateWheelHoverFx(event);
    updateWheelTriggerProximity(event.clientX, event.clientY);
    updateWheelDistanceFade(event.clientX, event.clientY);

    if (state.exhibitDrag) {
      var dragState = state.exhibitDrag;
      var now = Date.now();
      var dx = event.clientX - dragState.startX;
      var frameDx = event.clientX - dragState.lastX;
      var dt = Math.max(1, now - dragState.lastTs);
      dragState.lastX = event.clientX;
      dragState.lastTs = now;
      dragState.travelPx = Math.max(dragState.travelPx, Math.abs(dx));
      dragState.velocityPx = frameDx / dt;

      exhibitRuntime.selectorOffsetPx = dragState.startOffset + dx;
      exhibitRuntime.selectorVelocityPx = dragState.velocityPx * 16;
      updateExhibitSelectorArc();
      event.preventDefault();
      return;
    }

    if (state.wheelDrag) {
      var wheelDrag = state.wheelDrag;
      var pointerAngle = getPointerAngle(wheelDrag.centerX, wheelDrag.centerY, event.clientX, event.clientY);
      var delta = pointerAngle - wheelDrag.startPointerAngle;
      state.componentWheelAngle = normalizeWheelAngle(wheelDrag.startWheelAngle + delta);
      var nextWheelIndex = getWheelIndexByAngle(state.componentWheelAngle);
      if (nextWheelIndex !== state.componentWheelIndex) {
        state.componentWheelIndex = nextWheelIndex;
        updateComponentHintBySlot(getActiveWheelSlot());
      }
      scheduleWheelUiSync();
      return;
    }

    if (state.timelineDrag) {
      var dragInfo = state.timelineDrag;
      var span = Math.max(0.1, dragInfo.timelineMax - dragInfo.timelineMin);
      var rectWidth = Math.max(1, dragInfo.rect && dragInfo.rect.width ? dragInfo.rect.width : 1);
      var deltaX = event.clientX - dragInfo.startX;
      var deltaSec = (deltaX / rectWidth) * span;
      var maxStart = dragInfo.timelineMax - dragInfo.duration;
      var nextStartSec = Math.max(dragInfo.timelineMin, Math.min(maxStart, dragInfo.originStartSec + deltaSec));
      var roundedStartSec = Number(nextStartSec.toFixed(1));

      if (dragInfo.lastAppliedStartSec !== roundedStartSec) {
        dragInfo.lastAppliedStartSec = roundedStartSec;
        updateSchedule(dragInfo.side, dragInfo.effectKey, {
          startSec: roundedStartSec,
          endSec: Number((roundedStartSec + dragInfo.duration).toFixed(1)),
        });
        recompute();
      }
      return;
    }

    if (!state.drag) {
      return;
    }

    var drag = state.drag;
    var span = drag.startViewport.end - drag.startViewport.start;
    var delta = (event.clientX - drag.startX) / drag.width;
    var nextStart = drag.startViewport.start - delta * span;
    var nextEnd = drag.startViewport.end - delta * span;

    if (nextStart < 0) {
      nextEnd -= nextStart;
      nextStart = 0;
    }
    if (nextEnd > 1) {
      nextStart -= (nextEnd - 1);
      nextEnd = 1;
    }

    setViewport(drag.key, { start: nextStart, end: nextEnd });
  }

  function handlePointerUp() {
    var hadExhibitDrag = !!state.exhibitDrag;
    if (state.exhibitDrag && state.exhibitDrag.handleNode && typeof state.exhibitDrag.handleNode.releasePointerCapture === 'function') {
      try {
        state.exhibitDrag.handleNode.releasePointerCapture(state.exhibitDrag.pointerId);
      } catch (error) {
        // releasePointerCapture may fail if pointer already released
      }
    }

    if (hadExhibitDrag) {
      var dragTravel = state.exhibitDrag && Number.isFinite(state.exhibitDrag.travelPx) ? state.exhibitDrag.travelPx : 0;
      var dragVelocity = state.exhibitDrag && Number.isFinite(state.exhibitDrag.velocityPx) ? state.exhibitDrag.velocityPx : 0;
      exhibitRuntime.selectorDragging = false;
      state.exhibitDrag = null;
      if (dragTravel > 6) {
        exhibitRuntime.selectorSuppressClickUntil = Date.now() + 220;
      }
      exhibitRuntime.selectorVelocityPx = dragVelocity * 16;
      if (Math.abs(exhibitRuntime.selectorVelocityPx) > 0.45 || dragTravel > 6) {
        startExhibitSelectorInertia();
      } else {
        snapExhibitSelectorToNearest(true);
      }
    }

    var hadWheelDrag = !!state.wheelDrag;
    if (state.wheelDrag && state.wheelDrag.handleNode && typeof state.wheelDrag.handleNode.releasePointerCapture === 'function') {
      try {
        state.wheelDrag.handleNode.releasePointerCapture(state.wheelDrag.pointerId);
      } catch (error) {
        // releasePointerCapture may fail if pointer already released
      }
    }
    if (state.wheelDrag && state.wheelDrag.handleNode) {
      state.wheelDrag.handleNode.classList.remove('revolver-rotator-dragging');
    }
    state.wheelDrag = null;

    if (state.timelineDrag && state.timelineDrag.handleNode && typeof state.timelineDrag.handleNode.releasePointerCapture === 'function') {
      try {
        state.timelineDrag.handleNode.releasePointerCapture(state.timelineDrag.pointerId);
      } catch (error) {
        // releasePointerCapture may fail if pointer already released
      }
    }
    state.timelineDrag = null;
    state.drag = null;

    if (hadWheelDrag) {
      snapComponentWheelToNearest();
    }
  }

  contentRoot.addEventListener('click', function (event) {
    var actionNode = event.target.closest('[data-action]');
    if (!actionNode) {
      return;
    }

    var action = actionNode.getAttribute('data-action');

    if (action === 'toggle-theme') {
      applyThemeToggle();
      return;
    }

    if (action === 'toggle-structure-crit') {
      state.form.enableStructureCrit = !state.form.enableStructureCrit;
      recompute();
      return;
    }

    if (action === 'toggle-detailed-hitrates') {
      state.form.showDetailedHitRates = !state.form.showDetailedHitRates;
      recompute();
      return;
    }

    if (action === 'select-step') {
      if (actionNode.getAttribute('data-disabled') === 'true') {
        return;
      }
      var stepField = actionNode.getAttribute('data-field');
      var stepDirection = actionNode.getAttribute('data-direction');
      var optionList = getSelectOptionsByField(stepField);
      if (!optionList.length) {
        return;
      }
      var currentIndex = getSelectedOptionIndex(optionList, state.form[stepField]);
      if (currentIndex < 0) {
        currentIndex = 0;
      }
      var delta = stepDirection === 'prev' ? -1 : 1;
      var nextIndex = Math.max(0, Math.min(optionList.length - 1, currentIndex + delta));
      if (nextIndex === currentIndex) {
        return;
      }
      setField(stepField, getOptionValue(optionList[nextIndex]));
      return;
    }

    if (action === 'toggle-backdrop') {
      window.location.href = 'ARTINX-Laboratory.html?view=index';
      return;
    }

    if (action === 'home-pattern-open') {
      var patternIndex = toNumber(actionNode.getAttribute('data-pattern-index'), -1);
      if (patternIndex < 0 || patternIndex >= HOME_PATTERN_ENTRIES.length) {
        return;
      }
      state.homePatternIndex = patternIndex;
      setIntroduceView(INTRODUCE_VIEW_PREVIEW);
      renderMain();
      return;
    }

    if (action === 'home-pattern-focus') {
      setIntroduceView(INTRODUCE_VIEW_DETAIL);
      renderMain();
      return;
    }

    if (action === 'home-pattern-close') {
      setIntroduceView(INTRODUCE_VIEW_CATALOG);
      renderMain();
      return;
    }

    if (action === 'introduce-select') {
      var introduceIndex = toNumber(actionNode.getAttribute('data-pattern-index'), -1);
      if (introduceIndex < 0 || introduceIndex >= HOME_PATTERN_ENTRIES.length) {
        return;
      }
      state.homePatternIndex = introduceIndex;
      state.introduceHoverIndex = -1;
      setIntroduceView(INTRODUCE_VIEW_DETAIL);
      renderMain();
      return;
    }

    if (action === 'introduce-group-select') {
      var nextGroupKey = normalizeIntroduceGroupKey(actionNode.getAttribute('data-group-key'));
      if (nextGroupKey === state.introduceGroupKey) {
        return;
      }
      state.introduceGroupKey = nextGroupKey;
      state.introduceHoverIndex = -1;
      setIntroduceView(INTRODUCE_VIEW_CATALOG);
      var nextRows = getIntroduceRowsByGroupKey(nextGroupKey);
      if (nextRows.length) {
        state.homePatternIndex = nextRows[0].patternIndex;
      }
      renderMain();
      return;
    }

    if (action === 'introduce-preview-enter') {
      setIntroduceView(INTRODUCE_VIEW_DETAIL);
      renderMain();
      return;
    }

    if (action === 'home-pattern-nav') {
      var navDelta = toNumber(actionNode.getAttribute('data-pattern-delta'), 0);
      if (!navDelta) {
        return;
      }
      var navRows = getIntroduceRowsByGroupKey(state.introduceGroupKey);
      var currentRowIndex = getIntroduceRowIndex(navRows, state.homePatternIndex);
      if (currentRowIndex < 0 && navRows.length) {
        currentRowIndex = 0;
      }
      var count = navRows.length;
      if (!count) {
        return;
      }
      var nextRowIndex = (currentRowIndex + navDelta + count) % count;
      state.homePatternIndex = navRows[nextRowIndex].patternIndex;
      state.introduceHoverIndex = -1;
      if (normalizeQuickNavKey(state.quickNavKey) === 'introduce') {
        setIntroduceView(INTRODUCE_VIEW_DETAIL);
      }
      renderMain();
      return;
    }

    if (action === 'introduce-back') {
      state.introduceHoverIndex = -1;
      setIntroduceView(INTRODUCE_VIEW_CATALOG);
      renderMain();
      return;
    }

    if (action === 'quick-wheel-slot') {
      var quickIndex = toNumber(actionNode.getAttribute('data-wheel-index'), -1);
      if (quickIndex < 0 || quickIndex >= COMPONENT_WHEEL_SLOTS.length) {
        return;
      }
      animateWheelToIndex(quickIndex, function () {
        var slot = COMPONENT_WHEEL_SLOTS[quickIndex];
        if (state.hideUiForBackdrop && slot && slot.available) {
          activateCurrentComponent();
        }
      });
      return;
    }

    if (action === 'focus-tool-select') {
      var selectIndex = toNumber(actionNode.getAttribute('data-wheel-index'), -1);
      if (selectIndex < 0 || selectIndex >= COMPONENT_WHEEL_SLOTS.length) {
        return;
      }
      animateWheelToIndex(selectIndex);
      return;
    }

    if (action === 'focus-tool-jump') {
      var jumpIndex = toNumber(actionNode.getAttribute('data-wheel-index'), -1);
      if (jumpIndex < 0 || jumpIndex >= COMPONENT_WHEEL_SLOTS.length) {
        return;
      }
      var jumpMode = String(actionNode.getAttribute('data-view-mode') || '');
      animateWheelToIndex(jumpIndex, function () {
        var jumpSlot = COMPONENT_WHEEL_SLOTS[jumpIndex];
        if (jumpSlot && jumpSlot.available && jumpSlot.key === 'damage-lab') {
          window.location.href = 'damage-lab.html';
          return;
        }
        var targetMode = normalizeViewModeKey(jumpMode || (jumpSlot && jumpSlot.key) || VIEW_MODE_INDEX);
        if (MAIN_VIEW_KEYS.indexOf(targetMode) >= 0) {
          setFocusPageByKey(getNavKeyByViewKey(targetMode), true);
        }
      });
      return;
    }

    if (action === 'wheel-slot') {
      var wheelIndex = toNumber(actionNode.getAttribute('data-wheel-index'), -1);
      if (wheelIndex < 0 || wheelIndex >= COMPONENT_WHEEL_SLOTS.length) {
        return;
      }
      var targetSlot = COMPONENT_WHEEL_SLOTS[wheelIndex];
      animateWheelToIndex(wheelIndex, function () {
        if (state.hideUiForBackdrop && targetSlot && targetSlot.available) {
          activateCurrentComponent();
        }
      });
      return;
    }

    if (action === 'wheel-enter') {
      activateCurrentComponent();
      return;
    }

    if (action === 'focus-tool-enter') {
      if (String(actionNode.getAttribute('data-enabled') || '') !== 'true') {
        return;
      }
      activateCurrentComponent();
      return;
    }

    if (action === 'toggle-culture-showcase') {
      setCultureShowcaseCollapsed(!state.cultureShowcaseCollapsed);
      return;
    }

    if (action === 'exhibit-select') {
      if (Date.now() < exhibitRuntime.selectorSuppressClickUntil) {
        return;
      }
      var exhibitIndex = toNumber(actionNode.getAttribute('data-exhibit-index'), -1);
      if (exhibitIndex < 0) {
        return;
      }
      applyExhibitSelection(exhibitIndex, true);
      return;
    }

    if (action === 'refresh-sim') {
      state.viewport.output = { start: 0, end: 1 };
      state.viewport.target = { start: 0, end: 1 };
      state.form.randomNonce = Date.now() + Math.random();
      recompute();
      return;
    }

    if (action === 'toggle-effect') {
      if (event.target.closest('select')) {
        return;
      }
      var side = actionNode.getAttribute('data-side');
      var key = actionNode.getAttribute('data-key');
      if (side && key) {
        toggleEffect(side, key);
      }
      return;
    }
  });

  contentRoot.addEventListener('change', function (event) {
    var target = event.target;
    if (!target) {
      return;
    }

    var field = target.getAttribute('data-field');
    if (field) {
      setField(field, target.value);
      return;
    }

    var action = target.getAttribute('data-action');
    if (!action) {
      return;
    }

    var side = target.getAttribute('data-side');
    var effectKey = target.getAttribute('data-effect-key');
    if (!side || !effectKey) {
      return;
    }

    if (action === 'effect-variant') {
      updateSchedule(side, effectKey, { variantKey: target.value });
      recompute();
      return;
    }

    if (action === 'effect-duration') {
      updateSchedule(side, effectKey, { durationKey: target.value });
      recompute();
      return;
    }
  });

  contentRoot.addEventListener('input', function (event) {
    var target = event.target;
    if (!target) {
      return;
    }

    var field = target.getAttribute('data-field');
    if (field && target.type === 'range') {
      var value = target.value;
      if (NUMERIC_FIELDS.has(field)) {
        var fallback = toNumber(state.form[field], 0);
        value = toNumber(value, fallback);
        if (INT_FIELDS.has(field)) {
          value = Math.round(value);
        }
      }
      state.form[field] = value;
      syncRangeTrackFill(contentRoot);
      return;
    }

    var action = target.getAttribute('data-action');
    if (action === 'timeline-start') {
      return;
    }
  });

  contentRoot.addEventListener('pointerdown', handlePointerDown);

  window.addEventListener('wheel', function (event) {
    if (!state.hideUiForBackdrop) {
      return;
    }

    var target = event.target;
    if (target && target.closest('.component-revolver, [data-wheel-drag="true"], input, select, textarea')) {
      return;
    }

    var now = Date.now();
    if (now < state.mainPageWheelLockUntil) {
      event.preventDefault();
      return;
    }

    var deltaX = toNumber(event.deltaX, 0);
    var deltaY = toNumber(event.deltaY, 0);
    var dominantDelta = Math.abs(deltaY) >= Math.abs(deltaX) ? deltaY : deltaX;
    if (Math.abs(dominantDelta) < 14) {
      return;
    }

    var currentIndex = getMainPageIndexByNavKey(state.quickNavKey);
    var nextIndex = Math.max(0, Math.min(MAIN_FOCUS_PAGES.length - 1, currentIndex + (dominantDelta > 0 ? 1 : -1)));
    if (nextIndex === currentIndex) {
      return;
    }

    event.preventDefault();
    state.mainPageWheelLockUntil = now + 420;
    setFocusPageByKey(MAIN_FOCUS_PAGES[nextIndex], false);
  }, { passive: false });

  appRoot.addEventListener('click', function (event) {
    var actionNode = event.target.closest('[data-action]');
    if (!actionNode || contentRoot.contains(actionNode)) {
      return;
    }
    var action = actionNode.getAttribute('data-action');
    if (action === 'quick-nav') {
      var navKey = normalizeQuickNavKey(actionNode.getAttribute('data-nav-key'));
      setFocusPageByKey(navKey, true);
      return;
    }
    if (action === 'toggle-theme') {
      applyThemeToggle();
      return;
    }
    if (action === 'quick-home') {
      setFocusPageByKey('home', true);
      return;
    }
    if (action === 'quick-wheel-slot') {
      var quickIndex = toNumber(actionNode.getAttribute('data-wheel-index'), -1);
      if (quickIndex < 0 || quickIndex >= COMPONENT_WHEEL_SLOTS.length) {
        return;
      }
      animateWheelToIndex(quickIndex, function () {
        var slot = COMPONENT_WHEEL_SLOTS[quickIndex];
        if (state.hideUiForBackdrop && slot && slot.available) {
          activateCurrentComponent();
        }
      });
    }
  });
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('mousemove', function (event) {
    state.mouseX = event.clientX;
    state.mouseY = event.clientY;
    updateWheelTriggerProximity(event.clientX, event.clientY);
    scheduleFloatingTitleObstructionCheck();
  }, { passive: true });
  window.addEventListener('resize', function () {
    var compactModeBefore = state.toolsCompactMode;
    state.toolsCompactMode = shouldUseCompactToolsMode();
    if (compactModeBefore !== state.toolsCompactMode && state.hideUiForBackdrop && normalizeQuickNavKey(state.quickNavKey) === 'tools') {
      syncFocusPageVisualState();
      renderMain();
    }
    applyShellChrome();
    renderCharts();
    updateWheelFlyOffsetVars();
    if (Number.isFinite(state.mouseX) && Number.isFinite(state.mouseY)) {
      updateWheelTriggerProximity(state.mouseX, state.mouseY);
    }
    var quickKey = normalizeQuickNavKey(state.quickNavKey);
    var introduceView = normalizeIntroduceView(state.introduceView);
    if (state.hideUiForBackdrop && (quickKey === 'home' || (quickKey === 'introduce' && introduceView !== INTRODUCE_VIEW_DETAIL))) {
      scheduleCultureExhibitSync();
    }
  });
  window.addEventListener('scroll', function () {
    applyShellChrome();
    scheduleFloatingTitleObstructionCheck();
  }, { passive: true });

  function init() {
    var initialPage = typeof createDefaultPageState === 'function'
      ? createDefaultPageState()
      : buildPageState(window.DEFAULT_FORM || {});

    state.form = clone(initialPage.form || window.DEFAULT_FORM || {});
    state.page = initialPage;
    var preferredTheme = loadThemePreference();
    if (preferredTheme) {
      state.theme = preferredTheme;
    } else if (appRoot.classList.contains('theme-light')) {
      state.theme = 'light';
    } else {
      state.theme = 'dark';
    }
    refreshPatternEntryImages();
    syncExhibitImageSources();
    var initialViewMode = getViewModeFromUrl();
    state.hideUiForBackdrop = MAIN_VIEW_KEYS.indexOf(initialViewMode) >= 0;
    state.backdropExpanded = state.hideUiForBackdrop;
    state.quickNavKey = state.hideUiForBackdrop
      ? getNavKeyByViewKey(initialViewMode)
      : (initialViewMode === 'damage-lab' ? 'tools' : 'more');
    state.quickNavKey = normalizeQuickNavKey(state.quickNavKey);
    if (state.quickNavKey === 'introduce') {
      setIntroduceView(INTRODUCE_VIEW_CATALOG);
    } else {
      setIntroduceView(state.introduceView);
    }
    state.mainPageIndex = getMainPageIndexByNavKey(state.quickNavKey);
    state.toolsCompactMode = shouldUseCompactToolsMode();
    if (!state.hideUiForBackdrop) {
      var initialSlotIndex = findWheelSlotIndexByKey(initialViewMode);
      if (initialSlotIndex >= 0) {
        state.componentWheelIndex = initialSlotIndex;
        state.componentWheelAngle = normalizeWheelAngle(-initialSlotIndex * 60);
        updateComponentHintBySlot(COMPONENT_WHEEL_SLOTS[initialSlotIndex]);
      }
    }
    state.anchorReady = true;
    state.anchorFreezePending = false;
    state.anchorRebuild = false;
    if (state.hideUiForBackdrop) {
      syncFocusPageVisualState({ instant: true });
    }
    applyLayoutVars();
    hideWheelInstant();
    updateWheelAnchorFromBackdrop(true);
    startAnchorFreeze(true);
    updateWheelFlyOffsetVars();
    renderMain();
    syncViewModeUrl(state.hideUiForBackdrop ? getViewKeyByNavKey(state.quickNavKey) : ((getActiveWheelSlot() && getActiveWheelSlot().key) || 'damage-lab'), false);
    applyShellChrome();
    if (state.hideUiForBackdrop) {
      startGlobalLoadingOverlay('LOADING INDEX', 1260, null, { waitForStable: true, maxStableWaitMs: 2000 });
    }
  }

  init();
})();

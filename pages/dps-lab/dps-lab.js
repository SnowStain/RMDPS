// 模块已在全局作用域中定义，无需导入

const LIGHT_THEME = {
  canvasBg: 'transparent',
  textColor: '#6f37dd',
  tickColor: '#7f45f2',
  tickAccentColor: '#9fd92b',
  axisColor: 'rgba(127, 69, 242, 0.22)',
  gridColor: 'rgba(145, 76, 255, 0.16)',
};

const DARK_THEME = {
  canvasBg: 'transparent',
  textColor: '#c18cff',
  tickColor: '#b78cff',
  tickAccentColor: '#d4ff3a',
  axisColor: 'rgba(194, 255, 18, 0.24)',
  gridColor: 'rgba(145, 76, 255, 0.20)',
};

const TIMELINE_SNAP_THRESHOLD_RATIO = 0.018;
const TIMELINE_SNAP_THRESHOLD_MIN_SEC = 0.35;
const TIMELINE_SNAP_THRESHOLD_MAX_SEC = 1.2;
const PAGE_EDGE_SQUISH_RANGE_PX = 84;
const PAGE_EDGE_SQUISH_MAX_SHIFT_PX = 5;
const PAGE_EDGE_SQUISH_MIN_SCALE_Y = 0.988;
const PAGE_GRID_COLUMN_COUNT = 8;
const PORTRAIT_STAGE_BASE_PX = 148;
const PORTRAIT_STAGE_MAX_RATIO = 0.82;
const PORTRAIT_STAGE_MAX_REVEAL_PX = 720;
const PORTRAIT_STAGE_SNAP_RATIO = 0.48;
const PORTRAIT_DRAGGER_HEIGHT_PX = 144;
const PORTRAIT_DRAGGER_MIN_TOP_PX = 18;
const PORTRAIT_DRAGGER_MAX_TOP_PX = 92;
const LOGO_MULTI_TAP_TARGET = 5;
const LOGO_MULTI_TAP_RESET_MS = 1800;
const BILIBILI_PROFILE_URL = 'https://space.bilibili.com/645940972';

function getInitialWindowInfo() {
  return {
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    statusBarHeight: 24,
    theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  };
}

function getMenuButtonRect() {
  return {
    bottom: 50,
    height: 32,
    left: window.innerWidth - 100,
    right: window.innerWidth - 20,
    top: 18,
    width: 80
  };
}

function createScopedSelectorQuery(context) {
  return {
    select(selector) {
      return {
        boundingClientRect(callback) {
          const element = document.querySelector(selector);
          if (element) {
            const rect = element.getBoundingClientRect();
            callback(rect);
          } else {
            callback(null);
          }
          return this;
        },
        exec() {}
      };
    }
  };
}

function mergeForm(currentForm, patch) {
  return Object.assign({}, currentForm, patch);
}

function getDefaultOutpostWindowDegrees(attackerRole) {
  return attackerRole === 'hero' ? 360 : 120;
}

function createDefaultViewport() {
  return { start: 0, end: 1 };
}

function formatTimelineRangeText(startSec, endSec) {
  return `${startSec.toFixed(1)}s - ${endSec.toFixed(1)}s`;
}

function getTimelineSnapThreshold(meta) {
  const baseSpan = Math.max(1, Number(meta && meta.simulationEndSec) || Number(meta && meta.timelineMax) - Number(meta && meta.timelineMin));
  return clamp(baseSpan * TIMELINE_SNAP_THRESHOLD_RATIO, TIMELINE_SNAP_THRESHOLD_MIN_SEC, TIMELINE_SNAP_THRESHOLD_MAX_SEC);
}

function snapTimelineRange(startSec, durationSec, meta) {
  const safeDurationSec = Math.max(0, Number(durationSec) || 0);
  const minStartSec = Number(meta && meta.timelineMin) || 0;
  const maxStartSec = (Number(meta && meta.timelineMax) || 0) - safeDurationSec;
  const simulationEndSec = Number(meta && meta.simulationEndSec) || 0;
  const thresholdSec = getTimelineSnapThreshold(meta);
  let nextStartSec = clamp(startSec, minStartSec, maxStartSec);

  if (Math.abs(nextStartSec - minStartSec) <= thresholdSec) {
    nextStartSec = minStartSec;
  }
  if (Math.abs(nextStartSec) <= thresholdSec) {
    nextStartSec = 0;
  }

  let nextEndSec = nextStartSec + safeDurationSec;
  if (Math.abs(nextEndSec - simulationEndSec) <= thresholdSec) {
    nextEndSec = simulationEndSec;
    nextStartSec = nextEndSec - safeDurationSec;
  }
  if (Math.abs(nextEndSec - (Number(meta && meta.timelineMax) || 0)) <= thresholdSec) {
    nextEndSec = Number(meta && meta.timelineMax) || 0;
    nextStartSec = nextEndSec - safeDurationSec;
  }

  nextStartSec = clamp(nextStartSec, minStartSec, maxStartSec);
  return {
    startSec: Number(nextStartSec.toFixed(1)),
    endSec: Number((nextStartSec + safeDurationSec).toFixed(1)),
  };
}

function getTrackDurationSec(track) {
  return Number(track && track.fixedDurationSec) || Number(track && track.durationSec) || 0;
}

function getStepPrecision(step) {
  const text = String(step || '1');
  const dotIndex = text.indexOf('.');
  return dotIndex >= 0 ? text.length - dotIndex - 1 : 0;
}

function normalizeNumericValue(rawValue, fallbackValue, min, max, step) {
  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) {
    return fallbackValue;
  }
  const safeStep = Number(step) || 1;
  const precision = getStepPrecision(safeStep);
  const steppedValue = Math.round(numericValue / safeStep) * safeStep;
  const clampedValue = clamp(steppedValue, min, max);
  return Number(clampedValue.toFixed(precision));
}

function getTimelineDataKeys(side) {
  if (side === 'attacker') {
    return {
      tracksKey: 'attackerTimelineTracks',
      effectOptionsPath: 'analysis.attackerEffectOptions',
    };
  }
  return {
    tracksKey: 'targetTimelineTracks',
    effectOptionsPath: 'analysis.targetEffectOptions',
  };
}

function buildTimelinePreviewPatch(state, side, effectKey, startSec, endSec) {
  const { tracksKey, effectOptionsPath } = getTimelineDataKeys(side);
  const trackList = state[tracksKey] || [];
  const trackIndex = trackList.findIndex((item) => item.effectKey === effectKey);
  if (trackIndex < 0) {
    return null;
  }

  const track = trackList[trackIndex];
  const timelineMin = Number(track.timelineMin) || 0;
  const timelineMax = Number(track.timelineMax) || 0;
  const totalSpan = Math.max(1, timelineMax - timelineMin);
  const durationSec = Number(track.fixedDurationSec) || Number((endSec - startSec).toFixed(1));
  const nextEndSec = Number((startSec + durationSec).toFixed(1));
  const startPercent = (startSec - timelineMin) / totalSpan * 100;
  const endPercent = (nextEndSec - timelineMin) / totalSpan * 100;
  const timingText = formatTimelineRangeText(startSec, nextEndSec);
  const nextDurationSec = durationSec;
  const simulationEndSec = Number(state && state.form && state.form.durationSec) || 0;
  const totalDurationSec = Math.max(0.1, nextEndSec - startSec);
  const preSimDurationSec = Math.max(0, Math.min(nextEndSec, 0) - startSec);
  const simDurationSec = Math.max(0, Math.min(nextEndSec, simulationEndSec) - Math.max(startSec, 0));
  const postSimDurationSec = Math.max(0, nextEndSec - Math.max(startSec, simulationEndSec));
  const preSimPercent = Number((preSimDurationSec / totalDurationSec * 100).toFixed(3));
  const simPercent = Number((simDurationSec / totalDurationSec * 100).toFixed(3));
  const postSimPercent = Number((postSimDurationSec / totalDurationSec * 100).toFixed(3));
  const patch = {
    [`${tracksKey}[${trackIndex}].startSec`]: startSec,
    [`${tracksKey}[${trackIndex}].endSec`]: nextEndSec,
    [`${tracksKey}[${trackIndex}].startPercent`]: startPercent,
    [`${tracksKey}[${trackIndex}].endPercent`]: endPercent,
    [`${tracksKey}[${trackIndex}].spanPercent`]: Math.max(1.5, endPercent - startPercent),
    [`${tracksKey}[${trackIndex}].durationSec`]: nextDurationSec,
    [`${tracksKey}[${trackIndex}].preSimDurationSec`]: Number(preSimDurationSec.toFixed(1)),
    [`${tracksKey}[${trackIndex}].simDurationSec`]: Number(simDurationSec.toFixed(1)),
    [`${tracksKey}[${trackIndex}].postSimDurationSec`]: Number(postSimDurationSec.toFixed(1)),
    [`${tracksKey}[${trackIndex}].preSimPercent`]: preSimPercent,
    [`${tracksKey}[${trackIndex}].simPercent`]: simPercent,
    [`${tracksKey}[${trackIndex}].postSimPercent`]: postSimPercent,
    [`${tracksKey}[${trackIndex}].simOffsetPercent`]: preSimPercent,
    [`${tracksKey}[${trackIndex}].postSimOffsetPercent`]: Number((preSimPercent + simPercent).toFixed(3)),
    [`${tracksKey}[${trackIndex}].hasPreSimSegment`]: preSimDurationSec > 0,
    [`${tracksKey}[${trackIndex}].hasPostSimSegment`]: postSimDurationSec > 0,
    [`${tracksKey}[${trackIndex}].timingText`]: timingText,
  };

  const effectOptions = side === 'attacker'
    ? (state.analysis && state.analysis.attackerEffectOptions) || []
    : (state.analysis && state.analysis.targetEffectOptions) || [];
  const effectIndex = effectOptions.findIndex((item) => item.key === effectKey);
  if (effectIndex >= 0) {
    patch[`${effectOptionsPath}[${effectIndex}].timingText`] = timingText;
  }
  return patch;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getEdgeSquishProgress(distancePx, rangePx) {
  if (distancePx < 0 || distancePx > rangePx) {
    return 0;
  }
  return Number((1 - distancePx / rangePx).toFixed(4));
}

function getTouchAxisValue(touch, primaryKey, secondaryKey) {
  if (!touch) {
    return 0;
  }
  if (typeof touch[primaryKey] === 'number') {
    return touch[primaryKey];
  }
  if (typeof touch[secondaryKey] === 'number') {
    return touch[secondaryKey];
  }
  return 0;
}

function getTouchDistance(touches = []) {
  if (!touches || touches.length < 2) {
    return 0;
  }
  const firstX = getTouchAxisValue(touches[0], 'x', 'clientX');
  const firstY = getTouchAxisValue(touches[0], 'y', 'clientY');
  const secondX = getTouchAxisValue(touches[1], 'x', 'clientX');
  const secondY = getTouchAxisValue(touches[1], 'y', 'clientY');
  const deltaX = firstX - secondX;
  const deltaY = firstY - secondY;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

function getTouchCenterRatio(touches = [], rect) {
  if (!touches || touches.length < 2 || !rect || !rect.width) {
    return 0.5;
  }
  const firstX = getTouchAxisValue(touches[0], 'x', 'clientX');
  const secondX = getTouchAxisValue(touches[1], 'x', 'clientX');
  const centerX = (firstX + secondX) / 2;
  return clamp((centerX - rect.left) / rect.width, 0, 1);
}

function getPortraitHandleTopPx(stageHeightPx, windowHeight, pageTopInsetPx) {
  const safeWindowHeight = Math.max(320, Number(windowHeight) || 812);
  const safePageTopInsetPx = Math.max(0, Number(pageTopInsetPx) || 0);
  const preferredTopPx = PORTRAIT_DRAGGER_MIN_TOP_PX + (Math.max(PORTRAIT_STAGE_BASE_PX, Number(stageHeightPx) || PORTRAIT_STAGE_BASE_PX) - PORTRAIT_STAGE_BASE_PX) * 0.16;
  const maxTopPx = Math.max(
    PORTRAIT_DRAGGER_MIN_TOP_PX,
    Math.min(
      PORTRAIT_DRAGGER_MAX_TOP_PX,
      safeWindowHeight - safePageTopInsetPx - PORTRAIT_DRAGGER_HEIGHT_PX - 16,
    ),
  );

  return Math.round(clamp(preferredTopPx, PORTRAIT_DRAGGER_MIN_TOP_PX, maxTopPx));
}

function getPortraitFrostOpacity(revealProgress, contentFocusProgress) {
  const safeRevealProgress = clamp(Number(revealProgress) || 0, 0, 1);
  const safeContentFocusProgress = clamp(Number(contentFocusProgress) || 0, 0, 1);
  const baseOpacity = 0.14 + safeContentFocusProgress * 0.16 - safeRevealProgress * 0.30;
  return Number(clamp(baseOpacity, 0, 0.32).toFixed(3));
}

function getScrollReactiveVisualState(scrollTop, stageHeightPx, revealProgress) {
  const safeScrollTop = Math.max(0, Number(scrollTop) || 0);
  const safeStageHeightPx = Math.max(PORTRAIT_STAGE_BASE_PX, Number(stageHeightPx) || PORTRAIT_STAGE_BASE_PX);
  const stickyThresholdPx = Math.max(36, safeStageHeightPx - 84);
  const contentFocusStartPx = Math.max(24, safeStageHeightPx - 24);
  const contentFocusProgress = clamp((safeScrollTop - contentFocusStartPx) / 180, 0, 1);

  return {
    showFloatingStageTitle: safeScrollTop >= stickyThresholdPx,
    contentFocusProgress: Number(contentFocusProgress.toFixed(4)),
    portraitFrostOpacity: getPortraitFrostOpacity(revealProgress, contentFocusProgress),
  };
}

function buildPortraitRevealState(revealOffsetPx, maxRevealPx, windowHeight, pageTopInsetPx, contentFocusProgress) {
  const safeMaxRevealPx = Math.max(1, Number(maxRevealPx) || 1);
  const safeRevealOffsetPx = clamp(Number(revealOffsetPx) || 0, 0, safeMaxRevealPx);
  const progress = safeRevealOffsetPx / safeMaxRevealPx;
  const portraitStageHeightPx = Math.round(PORTRAIT_STAGE_BASE_PX + safeRevealOffsetPx);

  return {
    portraitRevealOffsetPx: Number(safeRevealOffsetPx.toFixed(1)),
    portraitRevealProgress: Number(progress.toFixed(4)),
    portraitStageHeightPx,
    portraitArtScale: Number((1.08 - progress * 0.08).toFixed(4)),
    portraitArtShiftY: Number((22 + progress * 20).toFixed(2)),
    portraitShadeOpacity: Number((0.64 - progress * 0.48).toFixed(3)),
    portraitFrostOpacity: getPortraitFrostOpacity(progress, contentFocusProgress),
    portraitArtBlurPx: Number((2.6 - progress * 2.6).toFixed(2)),
    portraitArtSaturate: Number((0.9 + progress * 0.14).toFixed(3)),
    portraitArtBrightness: Number((0.93 + progress * 0.1).toFixed(3)),
    portraitArtImageOpacity: Number((0.9 + progress * 0.1).toFixed(3)),
    portraitArtGridOpacity: Number((0.26 - progress * 0.18).toFixed(3)),
    portraitArtBlendOpacity: Number((0.52 - progress * 0.42).toFixed(3)),
    portraitHandleTopPx: getPortraitHandleTopPx(portraitStageHeightPx, windowHeight, pageTopInsetPx),
    portraitRevealHint: progress >= 0.68 ? '上推收起背景' : '下拉展开背景',
  };
}

function getSystemTheme(windowInfo) {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function noop() {}

const INITIAL_WINDOW_INFO = getInitialWindowInfo();
const INITIAL_THEME = getSystemTheme(INITIAL_WINDOW_INFO);
const INITIAL_STATUS_BAR_HEIGHT = INITIAL_WINDOW_INFO && INITIAL_WINDOW_INFO.statusBarHeight
  ? INITIAL_WINDOW_INFO.statusBarHeight
  : 24;
const INITIAL_WINDOW_WIDTH = (INITIAL_WINDOW_INFO && INITIAL_WINDOW_INFO.windowWidth) || 375;
const INITIAL_CHART_WIDTH = Math.max(300, ((INITIAL_WINDOW_INFO && INITIAL_WINDOW_INFO.windowWidth) || 375) - 44);
const INITIAL_PAGE_GRID_CELL_PX = Number((INITIAL_WINDOW_WIDTH / PAGE_GRID_COLUMN_COUNT).toFixed(2));

// 页面数据
let pageData = Object.assign(
  {
    theme: INITIAL_THEME,
    statusBarHeight: INITIAL_STATUS_BAR_HEIGHT,
    chartWidth: INITIAL_CHART_WIDTH,
    chartHeight: 220,
    pageTopInsetPx: INITIAL_STATUS_BAR_HEIGHT + 10,
    pageGridCellPx: INITIAL_PAGE_GRID_CELL_PX,
    pageGridOffsetPx: 0,
    floatingStageTitleTopPx: INITIAL_STATUS_BAR_HEIGHT + 6,
    scrollShiftY: 0,
    scrollScaleY: 1,
    portraitRevealMaxPx: 420,
    portraitRevealOffsetPx: 0,
    portraitRevealProgress: 0,
    portraitStageHeightPx: PORTRAIT_STAGE_BASE_PX,
    portraitArtScale: 1.08,
    portraitArtShiftY: 22,
    portraitShadeOpacity: 0.64,
    portraitFrostOpacity: 0.14,
    portraitArtBlurPx: 2.6,
    portraitArtSaturate: 0.9,
    portraitArtBrightness: 0.93,
    portraitArtImageOpacity: 0.9,
    portraitArtGridOpacity: 0.26,
    portraitArtBlendOpacity: 0.52,
    portraitHandleTopPx: PORTRAIT_DRAGGER_MIN_TOP_PX,
    portraitRevealHint: '下拉展开',
    contentFocusProgress: 0,
    showFloatingStageTitle: false,
    darkLogo: '../../assets/dps-lab/logo-dark.webp',
    lightLogo: '../../assets/dps-lab/logo-light.webp',
    darkBackdrop: '../../assets/dps-lab/backdrop-dark.webp',
    lightBackdrop: '../../assets/dps-lab/backdrop-light.webp',
    activeTimelineTrackId: '',
    activeTimelineTrackSide: '',
  },
  createDefaultPageState(),
);

// 页面实例
const pageInstance = {
  data: pageData,
  chartViewport: createDefaultViewport(),
  chartGesture: null,
  timelineDrag: null,
  portraitRevealDrag: null,
  isPageReady: false,
  isPageDisposed: false,
  pendingChartRender: false,
  chartRenderScheduled: false,
  currentScrollTop: 0,
  scrollMotionResetTimer: null,
  logoTapResetTimer: null,
  logoTapCount: 0,
  windowHeight: INITIAL_WINDOW_INFO.windowHeight || 812,
  
  onLoad() {
    const windowInfo = getInitialWindowInfo() || INITIAL_WINDOW_INFO || {};
    const menuButtonRect = getMenuButtonRect();
    const chartWidth = Math.max(300, (windowInfo.windowWidth || 375) - 44);
    const pageGridCellPx = Number((((windowInfo.windowWidth || INITIAL_WINDOW_WIDTH) / PAGE_GRID_COLUMN_COUNT)).toFixed(2));
    this.windowHeight = windowInfo.windowHeight || 812;
    const pageTopInsetPx = Math.max(
      (windowInfo.statusBarHeight || 24) + 10,
      menuButtonRect && menuButtonRect.bottom ? Math.round(menuButtonRect.bottom + 12) : 0,
    );
    const floatingStageTitleTopPx = Math.max(
      (windowInfo.statusBarHeight || 24) + 8,
      pageTopInsetPx - 12,
    );
    const portraitRevealMaxPx = Math.min(
      PORTRAIT_STAGE_MAX_REVEAL_PX,
      Math.max(260, Math.round(this.windowHeight * PORTRAIT_STAGE_MAX_RATIO)),
    );
    this.pageContentHeight = this.windowHeight;
    this.themeChangeHandler = (event) => {
      this.setData({ theme: getSystemTheme(event) }, () => {
        this.scheduleDrawAllCharts();
      });
    };
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.themeChangeHandler);
    this.setData({
      theme: getSystemTheme(windowInfo),
      statusBarHeight: windowInfo.statusBarHeight || 24,
      chartWidth,
      pageTopInsetPx,
      pageGridCellPx,
      pageGridOffsetPx: 0,
      floatingStageTitleTopPx,
      portraitRevealMaxPx,
      ...buildPortraitRevealState(0, portraitRevealMaxPx, this.windowHeight, pageTopInsetPx, 0),
    }, () => {
      this.refreshPageState(this.data.form);
    });
  },
  
  onReady() {
    this.isPageReady = true;
    this.scheduleDrawAllCharts();
    this.measurePageMetrics();
  },
  
  onUnload() {
    this.isPageDisposed = true;
    this.isPageReady = false;
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.themeChangeHandler);
    if (this.scrollMotionResetTimer) {
      clearTimeout(this.scrollMotionResetTimer);
      this.scrollMotionResetTimer = null;
    }
    if (this.logoTapResetTimer) {
      clearTimeout(this.logoTapResetTimer);
      this.logoTapResetTimer = null;
    }
  },
  
  onPageScroll(event) {
    const scrollTop = Number(event && event.scrollTop) || 0;
    this.currentScrollTop = scrollTop;
    const maxScrollTop = Math.max(0, (this.pageContentHeight || this.windowHeight || 0) - (this.windowHeight || 0));
    const topProgress = getEdgeSquishProgress(scrollTop, PAGE_EDGE_SQUISH_RANGE_PX);
    const bottomProgress = getEdgeSquishProgress(maxScrollTop - scrollTop, PAGE_EDGE_SQUISH_RANGE_PX);
    const activeProgress = Math.max(topProgress, bottomProgress);
    const nextShiftY = Number(((topProgress - bottomProgress) * PAGE_EDGE_SQUISH_MAX_SHIFT_PX).toFixed(2));
    const nextScaleY = Number((1 - activeProgress * (1 - PAGE_EDGE_SQUISH_MIN_SCALE_Y)).toFixed(4));
    const scrollReactiveState = getScrollReactiveVisualState(
      scrollTop,
      this.data.portraitStageHeightPx,
      this.data.portraitRevealProgress,
    );

    if (
      Math.abs(nextShiftY - this.data.scrollShiftY) < 0.01
      && Math.abs(nextScaleY - this.data.scrollScaleY) < 0.0005
      && Math.abs(scrollReactiveState.contentFocusProgress - this.data.contentFocusProgress) < 0.0005
      && Math.abs(scrollReactiveState.portraitFrostOpacity - this.data.portraitFrostOpacity) < 0.001
      && scrollReactiveState.showFloatingStageTitle === this.data.showFloatingStageTitle
    ) {
      return;
    }

    this.setData({
      scrollShiftY: nextShiftY,
      scrollScaleY: nextScaleY,
      contentFocusProgress: scrollReactiveState.contentFocusProgress,
      portraitFrostOpacity: scrollReactiveState.portraitFrostOpacity,
      showFloatingStageTitle: scrollReactiveState.showFloatingStageTitle,
    });
  },
  
  scheduleDrawAllCharts() {
    if (this.isPageDisposed) {
      return;
    }

    if (!this.isPageReady) {
      this.pendingChartRender = true;
      return;
    }

    if (this.chartRenderScheduled) {
      return;
    }

    this.chartRenderScheduled = true;
    const commitRender = () => {
      this.chartRenderScheduled = false;
      if (this.isPageDisposed) {
        return;
      }
      this.pendingChartRender = false;
      this.drawAllCharts();
    };

    setTimeout(commitRender, 0);
  },
  
  measurePageMetrics(callback) {
    const query = createScopedSelectorQuery(this);
    if (!query) {
      if (typeof callback === 'function') {
        callback();
      }
      return;
    }
    query
      .select('.page-content')
      .boundingClientRect((rect) => {
        if (rect && rect.height) {
          this.pageContentHeight = rect.height;
        }
        if (typeof callback === 'function') {
          callback();
        }
      })
      .exec();
  },
  
  onLogoTap() {
    this.logoTapCount += 1;
    if (this.logoTapResetTimer) {
      clearTimeout(this.logoTapResetTimer);
    }
    this.logoTapResetTimer = setTimeout(() => {
      this.logoTapCount = 0;
      this.logoTapResetTimer = null;
    }, LOGO_MULTI_TAP_RESET_MS);

    if (this.logoTapCount < LOGO_MULTI_TAP_TARGET) {
      return;
    }

    this.logoTapCount = 0;
    clearTimeout(this.logoTapResetTimer);
    this.logoTapResetTimer = null;
    window.open(BILIBILI_PROFILE_URL, '_blank');
  },
  
  getThemePalette() {
    return this.data.theme === 'dark' ? DARK_THEME : LIGHT_THEME;
  },
  
  applyPortraitReveal(revealOffsetPx, callback) {
    const state = buildPortraitRevealState(
      revealOffsetPx,
      this.data.portraitRevealMaxPx,
      this.windowHeight,
      this.data.pageTopInsetPx,
      this.data.contentFocusProgress,
    );
    
    // 更新DOM元素
    const backdropImage = document.getElementById('page-backdrop-art-image');
    if (backdropImage) {
      backdropImage.style.filter = `blur(${state.portraitArtBlurPx}px) saturate(${state.portraitArtSaturate}) brightness(${state.portraitArtBrightness})`;
      backdropImage.style.opacity = state.portraitArtImageOpacity;
      backdropImage.style.transform = `scale(${state.portraitArtScale}) translateY(${state.portraitArtShiftY}px)`;
    }
    
    const backdropBlend = document.getElementById('page-backdrop-art-blend');
    if (backdropBlend) {
      backdropBlend.style.opacity = state.portraitArtBlendOpacity;
    }
    
    const backdropGrid = document.getElementById('page-backdrop-art-grid');
    if (backdropGrid) {
      backdropGrid.style.opacity = state.portraitArtGridOpacity;
    }
    
    const backdropShade = document.getElementById('page-backdrop-shade');
    if (backdropShade) {
      backdropShade.style.opacity = state.portraitShadeOpacity;
    }
    
    const contentFrost = document.getElementById('page-content-frost');
    if (contentFrost) {
      contentFrost.style.opacity = state.portraitFrostOpacity;
    }
    
    const portraitStageShell = document.getElementById('portrait-stage-shell');
    if (portraitStageShell) {
      portraitStageShell.style.height = `${state.portraitStageHeightPx}px`;
    }
    
    const floatingRevealHandle = document.getElementById('floating-reveal-handle');
    if (floatingRevealHandle) {
      floatingRevealHandle.style.top = `${state.portraitHandleTopPx}px`;
    }
    
    const portraitRevealHint = document.getElementById('portrait-reveal-hint');
    if (portraitRevealHint) {
      portraitRevealHint.textContent = state.portraitRevealHint;
    }
    
    const heroPortraitRevealHint = document.getElementById('hero-portrait-reveal-hint');
    if (heroPortraitRevealHint) {
      heroPortraitRevealHint.textContent = state.portraitRevealHint;
    }
    
    this.setData(state, callback);
  },
  
  onPortraitRevealStart(event) {
    const touch = event.touches && event.touches[0];
    if (!touch) {
      return;
    }

    if (this.currentScrollTop > 18 && this.data.portraitRevealOffsetPx <= 0) {
      return;
    }

    this.portraitRevealDrag = {
      startY: getTouchAxisValue(touch, 'y', 'clientY'),
      startOffsetPx: this.data.portraitRevealOffsetPx,
    };
  },
  
  onPortraitRevealMove(event) {
    if (!this.portraitRevealDrag) {
      return;
    }

    const touch = event.touches && event.touches[0];
    if (!touch) {
      return;
    }

    const currentY = getTouchAxisValue(touch, 'y', 'clientY');
    const deltaY = currentY - this.portraitRevealDrag.startY;
    const nextOffsetPx = clamp(
      this.portraitRevealDrag.startOffsetPx + deltaY,
      0,
      this.data.portraitRevealMaxPx,
    );

    this.applyPortraitReveal(nextOffsetPx);
  },
  
  onPortraitRevealEnd() {
    if (!this.portraitRevealDrag) {
      return;
    }

    this.portraitRevealDrag = null;
    const nextOffsetPx = this.data.portraitRevealOffsetPx >= this.data.portraitRevealMaxPx * PORTRAIT_STAGE_SNAP_RATIO
      ? this.data.portraitRevealMaxPx
      : 0;

    this.applyPortraitReveal(nextOffsetPx, () => {
      this.measurePageMetrics();
    });
  },
  
  // 电脑端点击切换下拉/收起
  onPortraitRevealToggle() {
    const currentOffset = this.data.portraitRevealOffsetPx || 0;
    const nextOffsetPx = currentOffset > 0 ? 0 : this.data.portraitRevealMaxPx;
    
    this.applyPortraitReveal(nextOffsetPx, () => {
      this.measurePageMetrics();
    });
  },
  
  onPortraitRevealStartMouse(event) {
    event.preventDefault();
    
    if (this.currentScrollTop > 18 && this.data.portraitRevealOffsetPx <= 0) {
      return;
    }

    const clientY = event.clientY || (event.touches && event.touches[0] ? event.touches[0].clientY : 0);
    
    this.portraitRevealDrag = {
      startY: clientY,
      startOffsetPx: this.data.portraitRevealOffsetPx,
      isMouse: true,
    };
    
    // 添加鼠标移动和释放事件监听器
    document.addEventListener('mousemove', this.onPortraitRevealMouseMove.bind(this));
    document.addEventListener('mouseup', this.onPortraitRevealMouseUp.bind(this));
  },
  
  onPortraitRevealMouseMove(event) {
    if (!this.portraitRevealDrag || !this.portraitRevealDrag.isMouse) {
      return;
    }

    const currentY = event.clientY || 0;
    const deltaY = currentY - this.portraitRevealDrag.startY;
    const nextOffsetPx = clamp(
      this.portraitRevealDrag.startOffsetPx + deltaY,
      0,
      this.data.portraitRevealMaxPx,
    );

    this.applyPortraitReveal(nextOffsetPx);
  },
  
  onPortraitRevealMouseUp() {
    if (!this.portraitRevealDrag || !this.portraitRevealDrag.isMouse) {
      return;
    }

    // 移除事件监听器
    document.removeEventListener('mousemove', this.onPortraitRevealMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onPortraitRevealMouseUp.bind(this));

    this.portraitRevealDrag = null;
    const nextOffsetPx = this.data.portraitRevealOffsetPx >= this.data.portraitRevealMaxPx * PORTRAIT_STAGE_SNAP_RATIO
      ? this.data.portraitRevealMaxPx
      : 0;

    this.applyPortraitReveal(nextOffsetPx, () => {
      this.measurePageMetrics();
    });
  },
  
  refreshPageState(formPatch, callback) {
    const nextState = buildPageState(formPatch);
    this.setData(nextState, () => {
      this.scheduleDrawAllCharts();
      this.measurePageMetrics(callback);
    });
  },
  
  drawAllCharts() {
    const charts = this.data.analysis && this.data.analysis.charts;
    if (!charts) {
      // 如果没有图表数据，生成默认数据
      this.generateDefaultChartData();
      return;
    }
    const theme = this.getThemePalette();
    renderChart('outputChart', charts.output, this.data.chartWidth, this.data.chartHeight, theme, this.chartViewport);
    renderChart('thermalChart', charts.thermal, this.data.chartWidth, this.data.chartHeight, theme, this.chartViewport);
    renderChart('targetChart', charts.target, this.data.chartWidth, this.data.chartHeight, theme, this.chartViewport);
  },
  
  generateDefaultChartData() {
    // 生成默认图表数据
    const defaultCharts = {
      output: {
        labels: ['0s', '10s', '20s', '30s', '40s', '50s', '60s'],
        datasets: [
          {
            label: '每秒伤害',
            data: [0, 150, 280, 320, 300, 290, 280],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4
          },
          {
            label: '总伤害',
            data: [0, 1500, 4300, 7500, 10500, 13400, 16200],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4
          }
        ]
      },
      thermal: {
        labels: ['0s', '10s', '20s', '30s', '40s', '50s', '60s'],
        datasets: [
          {
            label: '热量',
            data: [0, 50, 90, 120, 140, 150, 160],
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4
          },
          {
            label: '冷却',
            data: [0, 10, 25, 40, 55, 70, 85],
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            tension: 0.4
          }
        ]
      },
      target: {
        labels: ['0s', '10s', '20s', '30s', '40s', '50s', '60s'],
        datasets: [
          {
            label: '剩余血量',
            data: [1500, 1350, 1070, 750, 450, 160, 0],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4
          }
        ]
      }
    };
    
    if (!this.data.analysis) {
      this.data.analysis = {};
    }
    this.data.analysis.charts = defaultCharts;
    
    // 重新绘制图表
    this.drawAllCharts();
  },
  
  onToggleTheme() {
    const newTheme = this.data.theme === 'dark' ? 'light' : 'dark';
    this.setData({
      theme: newTheme,
    }, () => {
      // 更新主题切换按钮文本
      const themeSwitch = document.getElementById('theme-switch');
      if (themeSwitch) {
        themeSwitch.textContent = newTheme === 'dark' ? '霓虹' : '极昼';
      }
      // 更新背景图片和logo
      const backdropImage = document.getElementById('page-backdrop-art-image');
      if (backdropImage) {
        backdropImage.src = newTheme === 'dark' ? this.data.darkBackdrop : this.data.lightBackdrop;
      }
      const logo = document.getElementById('hero-logo');
      if (logo) {
        logo.src = newTheme === 'dark' ? this.data.darkLogo : this.data.lightLogo;
      }
      // 更新页面shell的主题类
      const pageShell = document.getElementById('page-shell');
      if (pageShell) {
        pageShell.className = `page-shell theme-${newTheme}`;
      }
      this.scheduleDrawAllCharts();
    });
  },
  
  onPickerTap: noop,
  
  onAnalyzeTap() {
    this.refreshPageState(this.data.form);
  },
  
  onResetTap() {
    this.chartViewport = createDefaultViewport();
    this.chartGesture = null;
    this.timelineDrag = null;
    this.portraitRevealDrag = null;
    this.setData(Object.assign({}, createDefaultPageState(), {
      scrollShiftY: 0,
      scrollScaleY: 1,
      portraitRevealOffsetPx: 0,
      portraitRevealProgress: 0,
      portraitStageHeightPx: PORTRAIT_STAGE_BASE_PX,
      portraitArtScale: 1.08,
      portraitArtShiftY: 22,
      portraitShadeOpacity: 0.64,
      portraitFrostOpacity: getPortraitFrostOpacity(0, 0),
      portraitArtBlurPx: 2.6,
      portraitArtSaturate: 0.9,
      portraitArtBrightness: 0.93,
      portraitArtImageOpacity: 0.9,
      portraitArtGridOpacity: 0.26,
      portraitArtBlendOpacity: 0.52,
      portraitHandleTopPx: getPortraitHandleTopPx(PORTRAIT_STAGE_BASE_PX, this.windowHeight, this.data.pageTopInsetPx),
      portraitRevealHint: '下拉展开',
      contentFocusProgress: 0,
      showFloatingStageTitle: false,
      activeTimelineTrackId: '',
      activeTimelineTrackSide: '',
    }), () => {
      this.scheduleDrawAllCharts();
      this.measurePageMetrics();
    });
  },
  
  onResetChartViewport() {
    this.chartViewport = createDefaultViewport();
    this.chartGesture = null;
    this.drawAllCharts();
  },
  
  onTimelineDragStart(event) {
    const side = event.currentTarget.dataset.side;
    const effectKey = event.currentTarget.dataset.effectKey;
    const track = this.getTimelineTrack(side, effectKey);
    const touches = event.touches || [];
    if (!track || !touches.length) {
      return;
    }
    const query = createScopedSelectorQuery(this);
    if (!query) {
      return;
    }
    query
      .select(`#timeline-track-${side}-${effectKey}`)
      .boundingClientRect((rect) => {
        if (!rect || !rect.width) {
          return;
        }
        const touchX = getTouchAxisValue(touches[0], 'x', 'clientX');
        const ratio = clamp((touchX - rect.left) / rect.width, 0, 1);
        const touchTime = track.timelineMin + ratio * (track.timelineMax - track.timelineMin);
        this.timelineDrag = {
          side,
          effectKey,
          rect,
          startSec: track.startSec,
          endSec: track.endSec,
          timelineMin: track.timelineMin,
          timelineMax: track.timelineMax,
          simulationEndSec: Number(this.data.form && this.data.form.durationSec) || 0,
          durationSec: getTrackDurationSec(track),
          fixedDurationSec: Number(track.fixedDurationSec) || 0,
          touchOffsetSec: touchTime - track.startSec,
          changed: false,
        };
        this.setData({
          activeTimelineTrackId: effectKey,
          activeTimelineTrackSide: side,
        });
      })
      .exec();
  },
  
  onTimelineDragMove(event) {
    const touches = event.touches || [];
    if (!this.timelineDrag || !touches.length) {
      return;
    }
    const touchX = getTouchAxisValue(touches[0], 'x', 'clientX');
    const ratio = clamp((touchX - this.timelineDrag.rect.left) / this.timelineDrag.rect.width, 0, 1);
    const touchTime = this.timelineDrag.timelineMin + ratio * (this.timelineDrag.timelineMax - this.timelineDrag.timelineMin);
    const durationSec = Math.max(0, this.timelineDrag.fixedDurationSec || this.timelineDrag.durationSec);
    const rawStartSec = clamp(touchTime - this.timelineDrag.touchOffsetSec, this.timelineDrag.timelineMin, this.timelineDrag.timelineMax - durationSec);
    const snappedRange = snapTimelineRange(rawStartSec, durationSec, this.timelineDrag);
    const nextStartSec = snappedRange.startSec;
    const nextEndSec = snappedRange.endSec;
    if (nextStartSec === this.timelineDrag.startSec && nextEndSec === this.timelineDrag.endSec) {
      return;
    }

    const previewPatch = buildTimelinePreviewPatch(this.data, this.timelineDrag.side, this.timelineDrag.effectKey, nextStartSec, nextEndSec);
    if (!previewPatch) {
      return;
    }

    this.timelineDrag.startSec = nextStartSec;
    this.timelineDrag.endSec = nextEndSec;
    this.timelineDrag.changed = true;
    this.setData(previewPatch);
  },
  
  onTimelineDragEnd() {
    const dragState = this.timelineDrag;
    this.timelineDrag = null;
    if (!dragState) {
      this.setData({
        activeTimelineTrackId: '',
        activeTimelineTrackSide: '',
      });
      return;
    }

    if (!dragState.changed) {
      this.setData({
        activeTimelineTrackId: '',
        activeTimelineTrackSide: '',
      });
      return;
    }

    this.updateEffectSchedule(dragState.side, dragState.effectKey, {
      startSec: dragState.startSec,
      endSec: Number((dragState.startSec + Math.max(0, dragState.fixedDurationSec || dragState.durationSec)).toFixed(1)),
      fixedDurationSec: Number((Math.max(0, dragState.fixedDurationSec || dragState.durationSec)).toFixed(1)),
    }, () => {
      this.setData({
        activeTimelineTrackId: '',
        activeTimelineTrackSide: '',
      });
    });
  },
  
  onAttackerRoleChange(event) {
    const role = this.data.attackerRoleOptions[Number(event.target.value)];
    const patch = {
      attackerRole: role.key,
      attackerProfile: '',
      attackerLevel: 1,
      attackerPosture: 'mobile',
      attackerEffects: [],
    };
    if (this.data.form.targetRole === 'outpost') {
      patch.targetWindowDegrees = getDefaultOutpostWindowDegrees(role.key);
    }
    this.refreshPageState(mergeForm(this.data.form, patch));
  },
  
  onAttackerProfileChange(event) {
    const option = this.data.attackerProfileOptions[Number(event.target.value)];
    this.refreshPageState(mergeForm(this.data.form, { attackerProfile: option.key }));
  },
  
  onAttackerLevelChange(event) {
    const option = this.data.attackerLevelOptions[Number(event.target.value)];
    this.refreshPageState(mergeForm(this.data.form, { attackerLevel: option.value }));
  },
  
  onAttackerPostureChange(event) {
    const option = this.data.attackerPostureOptions[Number(event.target.value)];
    this.refreshPageState(mergeForm(this.data.form, { attackerPosture: option.key }));
  },
  
  onTargetRoleChange(event) {
    const role = this.data.targetRoleOptions[Number(event.target.value)];
    const patch = {
      targetRole: role.key,
      targetProfile: '',
      targetLevel: 1,
      targetPosture: 'mobile',
      targetEffects: [],
    };
    if (role.key === 'outpost') {
      patch.targetWindowDegrees = getDefaultOutpostWindowDegrees(this.data.form.attackerRole);
    }
    this.refreshPageState(mergeForm(this.data.form, patch));
  },
  
  onTargetProfileChange(event) {
    const option = this.data.targetProfileOptions[Number(event.target.value)];
    this.refreshPageState(mergeForm(this.data.form, { targetProfile: option.key }));
  },
  
  onTargetLevelChange(event) {
    const option = this.data.targetLevelOptions[Number(event.target.value)];
    this.refreshPageState(mergeForm(this.data.form, { targetLevel: option.value }));
  },
  
  onTargetPostureChange(event) {
    const option = this.data.targetPostureOptions[Number(event.target.value)];
    this.refreshPageState(mergeForm(this.data.form, { targetPosture: option.key }));
  },
  
  onTargetPartChange(event) {
    const option = this.data.targetPartOptions[Number(event.target.value)];
    this.refreshPageState(mergeForm(this.data.form, { targetPart: option.key }));
  },
  
  onOutpostWindowChange(event) {
    this.refreshPageState(mergeForm(this.data.form, { targetWindowDegrees: event.target.value }));
  },
  
  onOutpostWindowInputCommit(event) {
    const value = normalizeNumericValue(event.target.value, this.data.form.targetWindowDegrees, 0, 360, 5);
    this.refreshPageState(mergeForm(this.data.form, { targetWindowDegrees: value }));
  },
  
  onDurationChange(event) {
    this.refreshPageState(mergeForm(this.data.form, { durationSec: event.target.value }));
  },
  
  onDurationInputCommit(event) {
    const value = normalizeNumericValue(event.target.value, this.data.form.durationSec, 15, 240, 1);
    this.refreshPageState(mergeForm(this.data.form, { durationSec: value }));
  },
  
  onFireRateChange(event) {
    this.refreshPageState(mergeForm(this.data.form, { requestedFireRateHz: event.target.value }));
  },
  
  onFireRateInputCommit(event) {
    const value = normalizeNumericValue(event.target.value, this.data.form.requestedFireRateHz, 0, 30, 0.1);
    this.refreshPageState(mergeForm(this.data.form, { requestedFireRateHz: value }));
  },
  
  onHitRateChange(event) {
    this.refreshPageState(mergeForm(this.data.form, { hitRatePercent: event.target.value }));
  },
  
  onHitRateInputCommit(event) {
    const value = normalizeNumericValue(event.target.value, this.data.form.hitRatePercent, 0, 100, 1);
    this.refreshPageState(mergeForm(this.data.form, { hitRatePercent: value }));
  },
  
  onHeatChange(event) {
    this.refreshPageState(mergeForm(this.data.form, { initialHeat: event.target.value }));
  },
  
  onHeatInputCommit(event) {
    const value = normalizeNumericValue(event.target.value, this.data.form.initialHeat, 0, 300, 1);
    this.refreshPageState(mergeForm(this.data.form, { initialHeat: value }));
  },
  
  onTargetHealthChange(event) {
    this.refreshPageState(mergeForm(this.data.form, { targetHealthPercent: event.target.value }));
  },
  
  updateEffectSchedule(side, effectKey, patch, callback) {
    const scheduleKey = side === 'attacker' ? 'attackerSchedules' : 'targetSchedules';
    const schedules = Array.isArray(this.data.form[scheduleKey]) ? this.data.form[scheduleKey].slice() : [];
    const scheduleIndex = schedules.findIndex((item) => item.effectKey === effectKey);
    if (scheduleIndex < 0) {
      if (typeof callback === 'function') {
        callback();
      }
      return;
    }
    schedules[scheduleIndex] = Object.assign({}, schedules[scheduleIndex], patch);
    this.refreshPageState(mergeForm(this.data.form, { [scheduleKey]: schedules }), callback);
  },
  
  getTimelineTrack(side, effectKey) {
    const listKey = side === 'attacker' ? 'attackerTimelineTracks' : 'targetTimelineTracks';
    const tracks = this.data[listKey] || [];
    return tracks.find((item) => item.effectKey === effectKey) || null;
  },
  
  onToggleAttackerEffect(event) {
    const key = event.currentTarget.dataset.key;
    if (selected.has(key)) {
      selected.delete(key);
    } else {
      selected.add(key);
    }
    this.refreshPageState(mergeForm(this.data.form, { attackerEffects: Array.from(selected) }));
  },
  
  onToggleTargetEffect(event) {
    const key = event.currentTarget.dataset.key;
    const selected = new Set(this.data.form.targetEffects || []);
    if (selected.has(key)) {
      selected.delete(key);
    } else {
      selected.add(key);
    }
    this.refreshPageState(mergeForm(this.data.form, { targetEffects: Array.from(selected) }));
  },
  
  onEffectVariantChange(event) {
    const side = event.currentTarget.dataset.side;
    const effectKey = event.currentTarget.dataset.effectKey;
    const track = this.getTimelineTrack(side, effectKey);
    if (!track || !track.variantOptions || !track.variantOptions.length) {
      return;
    }
    const option = track.variantOptions[Number(event.target.value)] || track.variantOptions[0];
    const fixedDurationSec = Number(option.durationSec) || Number(track.fixedDurationSec) || 0;
    this.updateEffectSchedule(side, effectKey, {
      variantKey: option.key,
      endSec: Number((track.startSec + fixedDurationSec).toFixed(1)),
    });
  },
  
  onEffectDurationChange(event) {
    const side = event.currentTarget.dataset.side;
    const effectKey = event.currentTarget.dataset.effectKey;
    const track = this.getTimelineTrack(side, effectKey);
    if (!track || !track.durationOptions || !track.durationOptions.length) {
      return;
    }
    const option = track.durationOptions[Number(event.target.value)] || track.durationOptions[0];
    const fixedDurationSec = Number(option.durationSec) || 0;
    this.updateEffectSchedule(side, effectKey, {
      durationKey: option.key,
      endSec: Number((track.startSec + fixedDurationSec).toFixed(1)),
    });
  },
  
  onEffectScheduleStartChange(event) {
    const side = event.currentTarget.dataset.side;
    const effectKey = event.currentTarget.dataset.effectKey;
    const track = this.getTimelineTrack(side, effectKey);
    if (!track) {
      return;
    }
    const fixedDurationSec = Number(track.fixedDurationSec) || 0;
    const startSec = clamp(Number(event.target.value), track.timelineMin, track.timelineMax - fixedDurationSec);
    const patch = { startSec };
    if (fixedDurationSec > 0) {
      patch.endSec = Number((startSec + fixedDurationSec).toFixed(1));
    }
    this.updateEffectSchedule(side, effectKey, patch);
  },
  
  onEffectScheduleEndChange(event) {
    const side = event.currentTarget.dataset.side;
    const effectKey = event.currentTarget.dataset.effectKey;
    const track = this.getTimelineTrack(side, effectKey);
    if (!track) {
      return;
    }
    const fixedDurationSec = Number(track.fixedDurationSec) || 0;
    const endSec = clamp(Number(event.target.value), track.timelineMin + fixedDurationSec, track.timelineMax);
    const patch = { endSec };
    if (fixedDurationSec > 0) {
      patch.startSec = Number((endSec - fixedDurationSec).toFixed(1));
    }
    this.updateEffectSchedule(side, effectKey, patch);
  },
  
  onChartTouchStart(event) {
    const touches = event.touches || [];
    if (touches.length < 2) {
      this.chartGesture = null;
      return;
    }
    const chartKey = event.currentTarget.dataset.chartKey;
    const query = createScopedSelectorQuery(this);
    if (!query) {
      return;
    }
    query
      .select(`#${chartKey}ChartWrap`)
      .boundingClientRect((rect) => {
        if (!rect || !rect.width) {
          return;
        }
        const viewport = this.chartViewport || createDefaultViewport();
        const span = viewport.end - viewport.start;
        const centerRatio = getTouchCenterRatio(touches, rect);
        this.chartGesture = {
          rect,
          startDistance: Math.max(getTouchDistance(touches), 1),
          anchor: viewport.start + span * centerRatio,
          viewport: Object.assign({}, viewport),
        };
      })
      .exec();
  },
  
  onChartTouchMove(event) {
    const touches = event.touches || [];
    if (touches.length < 2 || !this.chartGesture) {
      return;
    }
    const centerRatio = getTouchCenterRatio(touches, this.chartGesture.rect);
    const currentDistance = Math.max(getTouchDistance(touches), 1);
    const startSpan = this.chartGesture.viewport.end - this.chartGesture.viewport.start;
    const nextSpan = clamp(startSpan * (this.chartGesture.startDistance / currentDistance), 0.08, 1);
    const nextStart = clamp(this.chartGesture.anchor - nextSpan * centerRatio, 0, 1 - nextSpan);
    this.chartViewport = {
      start: nextStart,
      end: nextStart + nextSpan,
    };
    this.drawAllCharts();
  },
  
  onChartTouchEnd(event) {
    const touches = event.touches || [];
    if (touches.length < 2) {
      this.chartGesture = null;
    }
  },
  
  // 自定义setData方法，用于更新页面数据并刷新UI
  setData(data, callback) {
    // 更新数据
    Object.assign(this.data, data);
    
    // 刷新UI
    this.updateUI();
    
    // 执行回调
    if (typeof callback === 'function') {
      callback();
    }
  },
  
  // 更新UI
  updateUI() {
    // 更新主题
    const pageShell = document.getElementById('page-shell');
    if (pageShell) {
      pageShell.className = `page-shell ${this.data.theme === 'dark' ? 'theme-dark' : 'theme-light'}`;
    }
    
    // 更新背景图片
    const backdropImage = document.getElementById('page-backdrop-art-image');
    if (backdropImage) {
      backdropImage.src = this.data.theme === 'dark' ? this.data.darkBackdrop : this.data.lightBackdrop;
    }
    
    // 更新logo
    const heroLogo = document.getElementById('hero-logo');
    if (heroLogo) {
      heroLogo.src = this.data.theme === 'dark' ? this.data.darkLogo : this.data.lightLogo;
    }
    
    // 更新主题切换按钮
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
      themeSwitch.textContent = this.data.theme === 'dark' ? '霓虹' : '极昼';
    }
    
    // 更新下拉提示
    const portraitRevealHint = document.getElementById('portrait-reveal-hint');
    if (portraitRevealHint) {
      portraitRevealHint.textContent = this.data.portraitRevealHint;
    }
    
    // 渲染攻击方buff
    const attackerEffectGrid = document.getElementById('attacker-effect-grid');
    if (attackerEffectGrid) {
      attackerEffectGrid.innerHTML = '';
      const attackerEffects = this.data.attackerEffectOptions || [];
      attackerEffects.forEach(effect => {
        const effectCard = document.createElement('div');
        effectCard.className = 'effect-card';
        effectCard.innerHTML = `
          <div class="effect-content">
            <div class="effect-title">${effect.label}</div>
            <div class="effect-copy">${effect.description}</div>
          </div>
          <div class="effect-toggle">
            <input type="checkbox" ${this.data.form.attackerEffects && this.data.form.attackerEffects.includes(effect.key) ? 'checked' : ''} onchange="pageInstance.onToggleAttackerEffect({currentTarget: {dataset: {key: '${effect.key}'}}})">
          </div>
        `;
        attackerEffectGrid.appendChild(effectCard);
      });
    }
    
    // 渲染受击方buff
    const targetEffectGrid = document.getElementById('target-effect-grid');
    if (targetEffectGrid) {
      targetEffectGrid.innerHTML = '';
      const targetEffects = this.data.targetEffectOptions || [];
      targetEffects.forEach(effect => {
        const effectCard = document.createElement('div');
        effectCard.className = 'effect-card';
        effectCard.innerHTML = `
          <div class="effect-content">
            <div class="effect-title">${effect.label}</div>
            <div class="effect-copy">${effect.description}</div>
          </div>
          <div class="effect-toggle">
            <input type="checkbox" ${this.data.form.targetEffects && this.data.form.targetEffects.includes(effect.key) ? 'checked' : ''} onchange="pageInstance.onToggleTargetEffect({currentTarget: {dataset: {key: '${effect.key}'}}})">
          </div>
        `;
        targetEffectGrid.appendChild(effectCard);
      });
    }
    
    const heroPortraitRevealHint = document.getElementById('hero-portrait-reveal-hint');
    if (heroPortraitRevealHint) {
      heroPortraitRevealHint.textContent = this.data.portraitRevealHint;
    }
    
    // 更新肖像舞台高度
    const portraitStageShell = document.getElementById('portrait-stage-shell');
    if (portraitStageShell) {
      portraitStageShell.style.height = `${this.data.portraitStageHeightPx}px`;
    }
    
    // 更新浮动标题显示
    const floatingStageTitle = document.getElementById('floating-stage-title');
    if (floatingStageTitle) {
      floatingStageTitle.className = `floating-stage-title ${this.data.showFloatingStageTitle ? 'floating-stage-title-visible' : ''}`;
    }
    
    // 更新攻击者和目标状态
    this.updateAttackerEffects();
    this.updateTargetEffects();
    
    // 更新时间线
    this.updateTimeline();
    
    // 更新数据分析
    this.updateAnalysis();
    
    // 更新图表
    this.drawAllCharts();
  },
  
  // 更新攻击方状态
  updateAttackerEffects() {
    const attackerEffectGrid = document.getElementById('attacker-effect-grid');
    if (!attackerEffectGrid) return;
    
    // 清空现有内容
    attackerEffectGrid.innerHTML = '';
    
    // 生成攻击方状态
    if (this.data.attackerEffectRows) {
      this.data.attackerEffectRows.forEach((row, rowIndex) => {
        const rowElement = document.createElement('div');
        rowElement.className = 'effect-row';
        
        row.forEach((effect) => {
          const effectCard = document.createElement('div');
          effectCard.className = `effect-card ${effect.active ? 'effect-active' : ''}`;
          effectCard.dataset.key = effect.key;
          
          effectCard.innerHTML = `
            ${effect.active ? '<div class="effect-selected-indicator">已选中</div>' : ''}
            <div class="effect-top">
              <span class="effect-title">${effect.label}</span>
              <span class="effect-pill effect-pill-${effect.tone}">${effect.category}</span>
            </div>
            ${effect.active && effect.hasVariants ? `
              <select class="timeline-picker effect-picker-inline" data-side="attacker" data-effect-key="${effect.key}" onchange="pageInstance.onEffectVariantChange(event)">
                ${effect.variantOptions.map((option, index) => `<option value="${index}" ${effect.variantIndex === index ? 'selected' : ''}>${option.label}</option>`).join('')}
              </select>
            ` : ''}
            ${effect.active && effect.hasDurationOptions ? `
              <select class="timeline-picker effect-picker-inline" data-side="attacker" data-effect-key="${effect.key}" onchange="pageInstance.onEffectDurationChange(event)">
                ${effect.durationOptions.map((option, index) => `<option value="${index}" ${effect.durationIndex === index ? 'selected' : ''}>${option.label}</option>`).join('')}
              </select>
            ` : ''}
            ${effect.active && (effect.variantLabel || effect.durationLabel) ? `<span class="effect-meta">${effect.variantLabel}${effect.variantLabel && effect.durationLabel ? ' · ' : ''}${effect.durationLabel}${effect.timingText ? ' · ' : ''}${effect.timingText}</span>` : ''}
            ${effect.badges.length ? `
              <div class="effect-badge-row">
                ${effect.badges.map((badge) => `<span class="effect-badge effect-badge-${badge.tone}">${badge.text}</span>`).join('')}
              </div>
            ` : ''}
            <div class="effect-copy">
              ${effect.descriptionSegments.map((segment) => `<span class="effect-copy-segment ${segment.isNumber ? 'effect-copy-number' : ''}">${segment.text}</span>`).join('')}
            </div>
          `;
          
          effectCard.addEventListener('click', (event) => {
            if (!event.target.tagName === 'SELECT') {
              this.onToggleAttackerEffect(event);
            }
          });
          
          rowElement.appendChild(effectCard);
        });
        
        attackerEffectGrid.appendChild(rowElement);
      });
    }
  },
  
  // 更新受击方状态
  updateTargetEffects() {
    const targetEffectGrid = document.getElementById('target-effect-grid');
    if (!targetEffectGrid) return;
    
    // 清空现有内容
    targetEffectGrid.innerHTML = '';
    
    // 生成受击方状态
    if (this.data.targetEffectRows) {
      this.data.targetEffectRows.forEach((row, rowIndex) => {
        const rowElement = document.createElement('div');
        rowElement.className = 'effect-row';
        
        row.forEach((effect) => {
          const effectCard = document.createElement('div');
          effectCard.className = `effect-card ${effect.active ? 'effect-active target-active' : ''}`;
          effectCard.dataset.key = effect.key;
          
          effectCard.innerHTML = `
            ${effect.active ? '<div class="effect-selected-indicator target-indicator">已选中</div>' : ''}
            <div class="effect-top">
              <span class="effect-title">${effect.label}</span>
              <span class="effect-pill effect-pill-${effect.tone}">${effect.category}</span>
            </div>
            ${effect.active && effect.hasVariants ? `
              <select class="timeline-picker effect-picker-inline" data-side="target" data-effect-key="${effect.key}" onchange="pageInstance.onEffectVariantChange(event)">
                ${effect.variantOptions.map((option, index) => `<option value="${index}" ${effect.variantIndex === index ? 'selected' : ''}>${option.label}</option>`).join('')}
              </select>
            ` : ''}
            ${effect.active && effect.hasDurationOptions ? `
              <select class="timeline-picker effect-picker-inline" data-side="target" data-effect-key="${effect.key}" onchange="pageInstance.onEffectDurationChange(event)">
                ${effect.durationOptions.map((option, index) => `<option value="${index}" ${effect.durationIndex === index ? 'selected' : ''}>${option.label}</option>`).join('')}
              </select>
            ` : ''}
            ${effect.active && (effect.variantLabel || effect.durationLabel) ? `<span class="effect-meta">${effect.variantLabel}${effect.variantLabel && effect.durationLabel ? ' · ' : ''}${effect.durationLabel}${effect.timingText ? ' · ' : ''}${effect.timingText}</span>` : ''}
            ${effect.badges.length ? `
              <div class="effect-badge-row">
                ${effect.badges.map((badge) => `<span class="effect-badge effect-badge-${badge.tone}">${badge.text}</span>`).join('')}
              </div>
            ` : ''}
            <div class="effect-copy">
              ${effect.descriptionSegments.map((segment) => `<span class="effect-copy-segment ${segment.isNumber ? 'effect-copy-number' : ''}">${segment.text}</span>`).join('')}
            </div>
          `;
          
          effectCard.addEventListener('click', (event) => {
            if (!event.target.tagName === 'SELECT') {
              this.onToggleTargetEffect(event);
            }
          });
          
          rowElement.appendChild(effectCard);
        });
        
        targetEffectGrid.appendChild(rowElement);
      });
    }
  },
  
  // 更新时间线
  updateTimeline() {
    // 更新攻击方时间线
    const attackerTimelineBoard = document.getElementById('attacker-timeline-board');
    if (attackerTimelineBoard) {
      if (this.data.attackerTimelineTracks && this.data.attackerTimelineTracks.length) {
        attackerTimelineBoard.innerHTML = `
          <div class="timeline-axis">
            <span>${this.data.timelineRangeStartLabel}</span>
            <span>${this.data.timelineRangeEndLabel}</span>
          </div>
          ${this.data.attackerTimelineTracks.map((item) => `
            <div class="timeline-row">
              <div class="timeline-row-head">
                <span class="effect-title">${item.label}</span>
                <span class="effect-pill effect-pill-${item.tone}">${item.category}</span>
              </div>
              ${item.hasVariants ? `
                <select class="timeline-picker" data-side="attacker" data-effect-key="${item.effectKey}" onchange="pageInstance.onEffectVariantChange(event)">
                  ${item.variantOptions.map((option, index) => `<option value="${index}" ${item.variantIndex === index ? 'selected' : ''}>${option.label}</option>`).join('')}
                </select>
              ` : ''}
              ${item.hasDurationOptions ? `
                <select class="timeline-picker" data-side="attacker" data-effect-key="${item.effectKey}" onchange="pageInstance.onEffectDurationChange(event)">
                  ${item.durationOptions.map((option, index) => `<option value="${index}" ${item.durationIndex === index ? 'selected' : ''}>${option.label || '选择激活灯臂'}</option>`).join('')}
                </select>
              ` : ''}
              ${!item.hasVariants && !item.hasDurationOptions ? `<span class="effect-meta">${item.description}</span>` : ''}
              <span class="effect-meta">${item.variantLabel}${item.variantLabel && item.durationLabel ? ' · ' : ''}${item.durationLabel}${(item.variantLabel || item.durationLabel) ? ' · ' : ''}持续 ${item.durationSec}s，可直接拖动调整开始时间</span>
              <div id="timeline-track-attacker-${item.effectKey}" class="timeline-track-bar timeline-track-bar-large">
                <div class="timeline-sim-window" style="left: ${this.data.simulationStartPercent}%; width: ${this.data.simulationSpanPercent}%;"></div>
                <div class="timeline-track-fill timeline-track-fill-draggable ${this.data.activeTimelineTrackId === item.effectKey && this.data.activeTimelineTrackSide === 'attacker' ? 'timeline-track-active' : ''}" style="left: ${item.startPercent}%; width: ${item.spanPercent}%;" data-side="attacker" data-effect-key="${item.effectKey}">
                  <div class="timeline-track-segments">
                    ${item.hasPreSimSegment ? `<div class="timeline-track-segment timeline-track-segment-pre" style="width: ${item.preSimPercent}%;"></div>` : ''}
                    <div class="timeline-track-segment timeline-track-segment-main" style="left: ${item.simOffsetPercent}%; width: ${item.simPercent}%;"></div>
                    ${item.hasPostSimSegment ? `<div class="timeline-track-segment timeline-track-segment-post" style="left: ${item.postSimOffsetPercent}%; width: ${item.postSimPercent}%;"></div>` : ''}
                  </div>
                  <div class="timeline-track-handle"></div>
                </div>
              </div>
              <div class="range-labels">
                <span>开始 ${item.startSec}s</span>
                <span>结束 ${item.endSec}s</span>
              </div>
            </div>
          `).join('')}
        `;
        
        // 添加拖拽事件
        this.data.attackerTimelineTracks.forEach((item) => {
          const trackFill = document.querySelector(`#timeline-track-attacker-${item.effectKey} .timeline-track-fill`);
          if (trackFill) {
            trackFill.addEventListener('mousedown', this.onTimelineDragStart.bind(this));
            trackFill.addEventListener('mousemove', this.onTimelineDragMove.bind(this));
            trackFill.addEventListener('mouseup', this.onTimelineDragEnd.bind(this));
            trackFill.addEventListener('mouseleave', this.onTimelineDragEnd.bind(this));
          }
        });
      } else {
        attackerTimelineBoard.innerHTML = `
          <div class="summary-box compact-empty">
            <span class="summary-line">攻击方当前还没有可用状态 </span>
          </div>
        `;
      }
    }
    
    // 更新受击方时间线
    const targetTimelineBoard = document.getElementById('target-timeline-board');
    if (targetTimelineBoard) {
      if (this.data.targetTimelineTracks && this.data.targetTimelineTracks.length) {
        targetTimelineBoard.innerHTML = `
          <div class="timeline-axis">
            <span>${this.data.timelineRangeStartLabel}</span>
            <span>${this.data.timelineRangeEndLabel}</span>
          </div>
          ${this.data.targetTimelineTracks.map((item) => `
            <div class="timeline-row">
              <div class="timeline-row-head">
                <span class="effect-title">${item.label}</span>
                <span class="effect-pill effect-pill-${item.tone}">${item.category}</span>
              </div>
              ${item.hasVariants ? `
                <select class="timeline-picker" data-side="target" data-effect-key="${item.effectKey}" onchange="pageInstance.onEffectVariantChange(event)">
                  ${item.variantOptions.map((option, index) => `<option value="${index}" ${item.variantIndex === index ? 'selected' : ''}>${option.label}</option>`).join('')}
                </select>
              ` : ''}
              ${item.hasDurationOptions ? `
                <select class="timeline-picker" data-side="target" data-effect-key="${item.effectKey}" onchange="pageInstance.onEffectDurationChange(event)">
                  ${item.durationOptions.map((option, index) => `<option value="${index}" ${item.durationIndex === index ? 'selected' : ''}>${option.label || '选择激活灯臂'}</option>`).join('')}
                </select>
              ` : ''}
              ${!item.hasVariants && !item.hasDurationOptions ? `<span class="effect-meta">${item.description}</span>` : ''}
              <span class="effect-meta">${item.variantLabel}${item.variantLabel && item.durationLabel ? ' · ' : ''}${item.durationLabel}${(item.variantLabel || item.durationLabel) ? ' · ' : ''}持续 ${item.durationSec}s，可直接拖动调整开始时间</span>
              <div id="timeline-track-target-${item.effectKey}" class="timeline-track-bar timeline-track-bar-large">
                <div class="timeline-sim-window" style="left: ${this.data.simulationStartPercent}%; width: ${this.data.simulationSpanPercent}%;"></div>
                <div class="timeline-track-fill timeline-track-fill-draggable ${this.data.activeTimelineTrackId === item.effectKey && this.data.activeTimelineTrackSide === 'target' ? 'timeline-track-active' : ''}" style="left: ${item.startPercent}%; width: ${item.spanPercent}%;" data-side="target" data-effect-key="${item.effectKey}">
                  <div class="timeline-track-segments">
                    ${item.hasPreSimSegment ? `<div class="timeline-track-segment target-track-segment-pre" style="width: ${item.preSimPercent}%;"></div>` : ''}
                    <div class="timeline-track-segment target-track-segment-main" style="left: ${item.simOffsetPercent}%; width: ${item.simPercent}%;"></div>
                    ${item.hasPostSimSegment ? `<div class="timeline-track-segment target-track-segment-post" style="left: ${item.postSimOffsetPercent}%; width: ${item.postSimPercent}%;"></div>` : ''}
                  </div>
                  <div class="timeline-track-handle"></div>
                </div>
              </div>
              <div class="range-labels">
                <span>开始 ${item.startSec}s</span>
                <span>结束 ${item.endSec}s</span>
              </div>
            </div>
          `).join('')}
        `;
        
        // 添加拖拽事件
        this.data.targetTimelineTracks.forEach((item) => {
          const trackFill = document.querySelector(`#timeline-track-target-${item.effectKey} .timeline-track-fill`);
          if (trackFill) {
            trackFill.addEventListener('mousedown', this.onTimelineDragStart.bind(this));
            trackFill.addEventListener('mousemove', this.onTimelineDragMove.bind(this));
            trackFill.addEventListener('mouseup', this.onTimelineDragEnd.bind(this));
            trackFill.addEventListener('mouseleave', this.onTimelineDragEnd.bind(this));
          }
        });
      } else {
        targetTimelineBoard.innerHTML = `
          <div class="summary-box compact-empty">
            <span class="summary-line">受击方当前还没有可用状态 </span>
          </div>
        `;
      }
    }
  },
  
  // 更新数据分析
  updateAnalysis() {
    const metricGrid = document.getElementById('metric-grid');
    if (!metricGrid) return;
    
    // 清空现有内容
    metricGrid.innerHTML = '';
    
    // 生成数据分析
    if (this.data.analysis && this.data.analysis.metrics) {
      this.data.analysis.metrics.forEach((metric, index) => {
        if (index % 2 === 0) {
          const rowElement = document.createElement('div');
          rowElement.className = 'metric-row';
          
          for (let i = index; i < Math.min(index + 2, this.data.analysis.metrics.length); i++) {
            const metricItem = this.data.analysis.metrics[i];
            const metricCard = document.createElement('div');
            metricCard.className = 'metric-card';
            
            metricCard.innerHTML = `
              <span class="metric-label">${metricItem.label}</span>
              <span class="metric-value">${metricItem.value}</span>
            `;
            
            rowElement.appendChild(metricCard);
          }
          
          metricGrid.appendChild(rowElement);
        }
      });
    }
    
    // 更新摘要
    const summaryBox = document.getElementById('summary-box');
    if (summaryBox) {
      if (this.data.analysis && this.data.analysis.summary) {
        summaryBox.innerHTML = `
          <div class="summary-highlight-grid">
            ${this.data.analysis.summary.highlights.map((highlight) => `
              <div class="summary-highlight-card summary-highlight-${highlight.tone}">
                <span class="summary-highlight-label">${highlight.label}</span>
                <span class="summary-highlight-value">${highlight.value}</span>
              </div>
            `).join('')}
          </div>
          ${this.data.analysis.summary.lines.map((line) => `<span class="summary-line">${line.text}</span>`).join('')}
        `;
      } else {
        summaryBox.innerHTML = `
          <div class="summary-box compact-empty">
            <span class="summary-line">请选择攻击方和受击方配置 </span>
          </div>
        `;
      }
    }
    
    // 更新评价
    const tauntBox = document.getElementById('taunt-box');
    if (tauntBox) {
      if (this.data.analysis && this.data.analysis.taunt) {
        tauntBox.innerHTML = `
          <span class="taunt-title">分析评价</span>
          ${this.data.analysis.taunt.lines.map((line) => `<span class="taunt-line">${line.text}</span>`).join('')}
        `;
      } else {
        tauntBox.innerHTML = '';
      }
    }
  }
};

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', function() {
  pageInstance.onLoad();
  setTimeout(() => {
    pageInstance.onReady();
  }, 100);
});

// 页面滚动事件
window.addEventListener('scroll', function(event) {
  if (pageInstance.onPageScroll) {
    pageInstance.onPageScroll({ scrollTop: window.scrollY });
  }
});

// 主题切换按钮点击事件
const themeSwitch = document.getElementById('theme-switch');
if (themeSwitch) {
  themeSwitch.addEventListener('click', function() {
    if (pageInstance.onToggleTheme) {
      pageInstance.onToggleTheme();
    }
  });
}

// 肖像舞台拖拽事件
const portraitStageShell = document.getElementById('portrait-stage-shell');
if (portraitStageShell) {
  portraitStageShell.addEventListener('mousedown', pageInstance.onPortraitRevealStart.bind(pageInstance));
  document.addEventListener('mousemove', pageInstance.onPortraitRevealMove.bind(pageInstance));
  document.addEventListener('mouseup', pageInstance.onPortraitRevealEnd.bind(pageInstance));
}

// Logo点击事件
const heroLogo = document.getElementById('hero-logo');
if (heroLogo) {
  heroLogo.addEventListener('click', pageInstance.onLogoTap.bind(pageInstance));
}

// 重置图表视图按钮点击事件
const resetChartViewport = document.getElementById('reset-chart-viewport');
if (resetChartViewport) {
  resetChartViewport.addEventListener('click', function() {
    if (pageInstance.onResetChartViewport) {
      pageInstance.onResetChartViewport();
    }
  });
}

// 表单事件监听
const attackerRoleSelect = document.getElementById('attacker-role');
if (attackerRoleSelect) {
  attackerRoleSelect.addEventListener('change', pageInstance.onAttackerRoleChange.bind(pageInstance));
}

const attackerProfileSelect = document.getElementById('attacker-profile');
if (attackerProfileSelect) {
  attackerProfileSelect.addEventListener('change', pageInstance.onAttackerProfileChange.bind(pageInstance));
}

const attackerPostureSelect = document.getElementById('attacker-posture');
if (attackerPostureSelect) {
  attackerPostureSelect.addEventListener('change', pageInstance.onAttackerPostureChange.bind(pageInstance));
}

const targetRoleSelect = document.getElementById('target-role');
if (targetRoleSelect) {
  targetRoleSelect.addEventListener('change', pageInstance.onTargetRoleChange.bind(pageInstance));
}

const targetProfileSelect = document.getElementById('target-profile');
if (targetProfileSelect) {
  targetProfileSelect.addEventListener('change', pageInstance.onTargetProfileChange.bind(pageInstance));
}

const targetPostureSelect = document.getElementById('target-posture');
if (targetPostureSelect) {
  targetPostureSelect.addEventListener('change', pageInstance.onTargetPostureChange.bind(pageInstance));
}

const targetPartSelect = document.getElementById('target-part');
if (targetPartSelect) {
  targetPartSelect.addEventListener('change', pageInstance.onTargetPartChange.bind(pageInstance));
}

const outpostWindowSlider = document.getElementById('outpost-window-slider');
if (outpostWindowSlider) {
  outpostWindowSlider.addEventListener('input', pageInstance.onOutpostWindowChange.bind(pageInstance));
}

const outpostWindowInput = document.getElementById('outpost-window-input');
if (outpostWindowInput) {
  outpostWindowInput.addEventListener('change', pageInstance.onOutpostWindowInputCommit.bind(pageInstance));
}

const durationSlider = document.getElementById('duration-slider');
if (durationSlider) {
  durationSlider.addEventListener('input', pageInstance.onDurationChange.bind(pageInstance));
}

const durationInput = document.getElementById('duration-input');
if (durationInput) {
  durationInput.addEventListener('change', pageInstance.onDurationInputCommit.bind(pageInstance));
}

const fireRateSlider = document.getElementById('fire-rate-slider');
if (fireRateSlider) {
  fireRateSlider.addEventListener('input', pageInstance.onFireRateChange.bind(pageInstance));
}

const fireRateInput = document.getElementById('fire-rate-input');
if (fireRateInput) {
  fireRateInput.addEventListener('change', pageInstance.onFireRateInputCommit.bind(pageInstance));
}

const hitRateSlider = document.getElementById('hit-rate-slider');
if (hitRateSlider) {
  hitRateSlider.addEventListener('input', pageInstance.onHitRateChange.bind(pageInstance));
}

const hitRateInput = document.getElementById('hit-rate-input');
if (hitRateInput) {
  hitRateInput.addEventListener('change', pageInstance.onHitRateInputCommit.bind(pageInstance));
}

const heatSlider = document.getElementById('heat-slider');
if (heatSlider) {
  heatSlider.addEventListener('input', pageInstance.onHeatChange.bind(pageInstance));
}

const heatInput = document.getElementById('heat-input');
if (heatInput) {
  heatInput.addEventListener('change', pageInstance.onHeatInputCommit.bind(pageInstance));
}

const targetHealthSlider = document.getElementById('target-health-slider');
if (targetHealthSlider) {
  targetHealthSlider.addEventListener('input', pageInstance.onTargetHealthChange.bind(pageInstance));
}

// 图表触摸事件
const outputChartWrap = document.getElementById('outputChartWrap');
if (outputChartWrap) {
  outputChartWrap.addEventListener('touchstart', pageInstance.onChartTouchStart.bind(pageInstance));
  outputChartWrap.addEventListener('touchmove', pageInstance.onChartTouchMove.bind(pageInstance));
  outputChartWrap.addEventListener('touchend', pageInstance.onChartTouchEnd.bind(pageInstance));
}

const thermalChartWrap = document.getElementById('thermalChartWrap');
if (thermalChartWrap) {
  thermalChartWrap.addEventListener('touchstart', pageInstance.onChartTouchStart.bind(pageInstance));
  thermalChartWrap.addEventListener('touchmove', pageInstance.onChartTouchMove.bind(pageInstance));
  thermalChartWrap.addEventListener('touchend', pageInstance.onChartTouchEnd.bind(pageInstance));
}

const targetChartWrap = document.getElementById('targetChartWrap');
if (targetChartWrap) {
  targetChartWrap.addEventListener('touchstart', pageInstance.onChartTouchStart.bind(pageInstance));
  targetChartWrap.addEventListener('touchmove', pageInstance.onChartTouchMove.bind(pageInstance));
  targetChartWrap.addEventListener('touchend', pageInstance.onChartTouchEnd.bind(pageInstance));
}
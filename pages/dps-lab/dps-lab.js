const { buildPageState, createDefaultPageState } = require('./lib/damage-lab-core');
const { renderChart } = require('./lib/damage-lab-chart');

const LIGHT_THEME = {
  canvasBg: 'transparent',
  textColor: '#11131a',
  axisColor: 'rgba(17, 19, 26, 0.24)',
  gridColor: 'rgba(145, 76, 255, 0.12)',
};

const DARK_THEME = {
  canvasBg: 'transparent',
  textColor: '#f8fbff',
  axisColor: 'rgba(194, 255, 18, 0.3)',
  gridColor: 'rgba(145, 76, 255, 0.18)',
};

const TIMELINE_SNAP_THRESHOLD_RATIO = 0.018;
const TIMELINE_SNAP_THRESHOLD_MIN_SEC = 0.35;
const TIMELINE_SNAP_THRESHOLD_MAX_SEC = 1.2;
const PAGE_EDGE_SQUISH_RANGE_PX = 84;
const PAGE_EDGE_SQUISH_MAX_SHIFT_PX = 5;
const PAGE_EDGE_SQUISH_MIN_SCALE_Y = 0.988;
const PORTRAIT_STAGE_BASE_PX = 148;
const PORTRAIT_STAGE_MAX_RATIO = 0.72;
const PORTRAIT_STAGE_MAX_REVEAL_PX = 620;
const PORTRAIT_STAGE_SNAP_RATIO = 0.48;
const PORTRAIT_HANDLE_HEIGHT_PX = 74;
const PORTRAIT_HANDLE_MIN_TOP_PX = 142;
const PORTRAIT_HANDLE_FOLLOW_OFFSET_PX = 18;
const LOGO_MULTI_TAP_TARGET = 5;
const LOGO_MULTI_TAP_RESET_MS = 1800;
const BILIBILI_PROFILE_URL = 'https://space.bilibili.com/645940972';

function getInitialWindowInfo() {
  try {
    if (typeof wx !== 'undefined' && wx.getWindowInfo) {
      return wx.getWindowInfo();
    }
  } catch (error) {
    return null;
  }
  return null;
}

function getMenuButtonRect() {
  try {
    if (typeof wx !== 'undefined' && wx.getMenuButtonBoundingClientRect) {
      return wx.getMenuButtonBoundingClientRect();
    }
  } catch (error) {
    return null;
  }
  return null;
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
  const preferredTopPx = Number(stageHeightPx) - PORTRAIT_HANDLE_FOLLOW_OFFSET_PX;
  const maxTopPx = Math.max(
    PORTRAIT_HANDLE_MIN_TOP_PX,
    safeWindowHeight - safePageTopInsetPx - PORTRAIT_HANDLE_HEIGHT_PX - 12,
  );

  return Math.round(clamp(preferredTopPx, PORTRAIT_HANDLE_MIN_TOP_PX, maxTopPx));
}

function buildPortraitRevealState(revealOffsetPx, maxRevealPx, windowHeight, pageTopInsetPx) {
  const safeMaxRevealPx = Math.max(1, Number(maxRevealPx) || 1);
  const safeRevealOffsetPx = clamp(Number(revealOffsetPx) || 0, 0, safeMaxRevealPx);
  const progress = safeRevealOffsetPx / safeMaxRevealPx;
  const portraitStageHeightPx = Math.round(PORTRAIT_STAGE_BASE_PX + safeRevealOffsetPx);

  return {
    portraitRevealOffsetPx: Number(safeRevealOffsetPx.toFixed(1)),
    portraitRevealProgress: Number(progress.toFixed(4)),
    portraitStageHeightPx,
    portraitArtScale: Number((1.04 - progress * 0.01).toFixed(4)),
    portraitArtShiftY: Number((34 + progress * 12).toFixed(2)),
    portraitShadeOpacity: Number((0.56 - progress * 0.20).toFixed(3)),
    portraitFrostOpacity: Number((0.24 - progress * 0.24).toFixed(3)),
    portraitHandleTopPx: getPortraitHandleTopPx(portraitStageHeightPx, windowHeight, pageTopInsetPx),
    portraitRevealHint: progress >= 0.68 ? '' : '',
  };
}

function getSystemTheme(windowInfo) {
  const theme = windowInfo && windowInfo.theme;
  return theme === 'dark' ? 'dark' : 'light';
}

function noop() {}

const INITIAL_WINDOW_INFO = getInitialWindowInfo();
const INITIAL_THEME = getSystemTheme(INITIAL_WINDOW_INFO);
const INITIAL_STATUS_BAR_HEIGHT = INITIAL_WINDOW_INFO && INITIAL_WINDOW_INFO.statusBarHeight
  ? INITIAL_WINDOW_INFO.statusBarHeight
  : 24;
const INITIAL_CHART_WIDTH = Math.max(300, ((INITIAL_WINDOW_INFO && INITIAL_WINDOW_INFO.windowWidth) || 375) - 44);

Page({
  data: Object.assign(
    {
      theme: INITIAL_THEME,
      statusBarHeight: INITIAL_STATUS_BAR_HEIGHT,
      chartWidth: INITIAL_CHART_WIDTH,
      chartHeight: 220,
      pageTopInsetPx: INITIAL_STATUS_BAR_HEIGHT + 10,
      scrollShiftY: 0,
      scrollScaleY: 1,
      portraitRevealMaxPx: 420,
      portraitRevealOffsetPx: 0,
      portraitRevealProgress: 0,
      portraitStageHeightPx: PORTRAIT_STAGE_BASE_PX,
      portraitArtScale: 1.04,
      portraitArtShiftY: 34,
      portraitShadeOpacity: 0.56,
      portraitFrostOpacity: 0.24,
      portraitHandleTopPx: PORTRAIT_HANDLE_MIN_TOP_PX,
      portraitRevealHint: '下拉展开',
      darkLogo: '/ARTINX DPS 1.webp',
      lightLogo: '/ARTINX DPS 2.webp',
      activeTimelineTrackId: '',
      activeTimelineTrackSide: '',
    },
    createDefaultPageState(),
  ),

  onLoad() {
    this.chartViewport = createDefaultViewport();
    this.chartGesture = null;
    this.timelineDrag = null;
    this.portraitRevealDrag = null;
    this.currentScrollTop = 0;
    this.scrollMotionResetTimer = null;
    this.logoTapResetTimer = null;
    this.logoTapCount = 0;
    const windowInfo = getInitialWindowInfo() || INITIAL_WINDOW_INFO || {};
    const menuButtonRect = getMenuButtonRect();
    const chartWidth = Math.max(300, (windowInfo.windowWidth || 375) - 44);
    this.windowHeight = windowInfo.windowHeight || 812;
    const pageTopInsetPx = Math.max(
      (windowInfo.statusBarHeight || 24) + 10,
      menuButtonRect && menuButtonRect.bottom ? Math.round(menuButtonRect.bottom + 12) : 0,
    );
    const portraitRevealMaxPx = Math.min(
      PORTRAIT_STAGE_MAX_REVEAL_PX,
      Math.max(260, Math.round(this.windowHeight * PORTRAIT_STAGE_MAX_RATIO)),
    );
    this.pageContentHeight = this.windowHeight;
    this.themeChangeHandler = (event) => {
      this.setData({ theme: event && event.theme === 'dark' ? 'dark' : 'light' }, () => {
        this.drawAllCharts();
      });
    };
    if (wx.onThemeChange) {
      wx.onThemeChange(this.themeChangeHandler);
    }
    this.setData({
      theme: getSystemTheme(windowInfo),
      statusBarHeight: windowInfo.statusBarHeight || 24,
      chartWidth,
      pageTopInsetPx,
      portraitRevealMaxPx,
      ...buildPortraitRevealState(0, portraitRevealMaxPx, this.windowHeight, pageTopInsetPx),
    }, () => {
      this.refreshPageState(this.data.form);
    });
  },

  onUnload() {
    if (wx.offThemeChange && this.themeChangeHandler) {
      wx.offThemeChange(this.themeChangeHandler);
    }
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

    if (Math.abs(nextShiftY - this.data.scrollShiftY) < 0.01 && Math.abs(nextScaleY - this.data.scrollScaleY) < 0.0005) {
      return;
    }

    this.setData({
      scrollShiftY: nextShiftY,
      scrollScaleY: nextScaleY,
    });
  },

  measurePageMetrics(callback) {
    wx.createSelectorQuery()
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
    wx.navigateTo({
      url: `/pages/dps-lab/webview/webview?url=${encodeURIComponent(BILIBILI_PROFILE_URL)}`,
      fail: () => {
        wx.setClipboardData({
          data: BILIBILI_PROFILE_URL,
        });
      },
    });
  },

  getThemePalette() {
    return this.data.theme === 'dark' ? DARK_THEME : LIGHT_THEME;
  },

  applyPortraitReveal(revealOffsetPx, callback) {
    this.setData(
      buildPortraitRevealState(
        revealOffsetPx,
        this.data.portraitRevealMaxPx,
        this.windowHeight,
        this.data.pageTopInsetPx,
      ),
      callback,
    );
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

  refreshPageState(formPatch, callback) {
    const nextState = buildPageState(formPatch);
    this.setData(nextState, () => {
      this.drawAllCharts();
      this.measurePageMetrics(callback);
    });
  },

  drawAllCharts() {
    const charts = this.data.analysis && this.data.analysis.charts;
    if (!charts) {
      return;
    }
    const theme = this.getThemePalette();
    renderChart('outputChart', charts.output, this.data.chartWidth, this.data.chartHeight, theme, this.chartViewport);
    renderChart('thermalChart', charts.thermal, this.data.chartWidth, this.data.chartHeight, theme, this.chartViewport);
    renderChart('targetChart', charts.target, this.data.chartWidth, this.data.chartHeight, theme, this.chartViewport);
  },

  onToggleTheme() {
    this.setData({
      theme: this.data.theme === 'dark' ? 'light' : 'dark',
    }, () => {
      this.drawAllCharts();
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
      activeTimelineTrackId: '',
      activeTimelineTrackSide: '',
    }), () => {
      this.drawAllCharts();
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
    wx.createSelectorQuery()
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
    const role = this.data.attackerRoleOptions[Number(event.detail.value)];
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
    const option = this.data.attackerProfileOptions[Number(event.detail.value)];
    this.refreshPageState(mergeForm(this.data.form, { attackerProfile: option.key }));
  },

  onAttackerLevelChange(event) {
    const option = this.data.attackerLevelOptions[Number(event.detail.value)];
    this.refreshPageState(mergeForm(this.data.form, { attackerLevel: option.value }));
  },

  onAttackerPostureChange(event) {
    const option = this.data.attackerPostureOptions[Number(event.detail.value)];
    this.refreshPageState(mergeForm(this.data.form, { attackerPosture: option.key }));
  },

  onTargetRoleChange(event) {
    const role = this.data.targetRoleOptions[Number(event.detail.value)];
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
    const option = this.data.targetProfileOptions[Number(event.detail.value)];
    this.refreshPageState(mergeForm(this.data.form, { targetProfile: option.key }));
  },

  onTargetLevelChange(event) {
    const option = this.data.targetLevelOptions[Number(event.detail.value)];
    this.refreshPageState(mergeForm(this.data.form, { targetLevel: option.value }));
  },

  onTargetPostureChange(event) {
    const option = this.data.targetPostureOptions[Number(event.detail.value)];
    this.refreshPageState(mergeForm(this.data.form, { targetPosture: option.key }));
  },

  onTargetPartChange(event) {
    const option = this.data.targetPartOptions[Number(event.detail.value)];
    this.refreshPageState(mergeForm(this.data.form, { targetPart: option.key }));
  },

  onOutpostWindowChange(event) {
    this.refreshPageState(mergeForm(this.data.form, { targetWindowDegrees: event.detail.value }));
  },

  onOutpostWindowInputCommit(event) {
    const value = normalizeNumericValue(event.detail.value, this.data.form.targetWindowDegrees, 0, 360, 5);
    this.refreshPageState(mergeForm(this.data.form, { targetWindowDegrees: value }));
  },

  onDurationChange(event) {
    this.refreshPageState(mergeForm(this.data.form, { durationSec: event.detail.value }));
  },

  onDurationInputCommit(event) {
    const value = normalizeNumericValue(event.detail.value, this.data.form.durationSec, 15, 240, 1);
    this.refreshPageState(mergeForm(this.data.form, { durationSec: value }));
  },

  onFireRateChange(event) {
    this.refreshPageState(mergeForm(this.data.form, { requestedFireRateHz: event.detail.value }));
  },

  onFireRateInputCommit(event) {
    const value = normalizeNumericValue(event.detail.value, this.data.form.requestedFireRateHz, 0, 30, 0.1);
    this.refreshPageState(mergeForm(this.data.form, { requestedFireRateHz: value }));
  },

  onHitRateChange(event) {
    this.refreshPageState(mergeForm(this.data.form, { hitRatePercent: event.detail.value }));
  },

  onHitRateInputCommit(event) {
    const value = normalizeNumericValue(event.detail.value, this.data.form.hitRatePercent, 0, 100, 1);
    this.refreshPageState(mergeForm(this.data.form, { hitRatePercent: value }));
  },

  onHeatChange(event) {
    this.refreshPageState(mergeForm(this.data.form, { initialHeat: event.detail.value }));
  },

  onHeatInputCommit(event) {
    const value = normalizeNumericValue(event.detail.value, this.data.form.initialHeat, 0, 300, 1);
    this.refreshPageState(mergeForm(this.data.form, { initialHeat: value }));
  },

  onTargetHealthChange(event) {
    this.refreshPageState(mergeForm(this.data.form, { targetHealthPercent: event.detail.value }));
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
    const selected = new Set(this.data.form.attackerEffects || []);
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
    const option = track.variantOptions[Number(event.detail.value)] || track.variantOptions[0];
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
    const option = track.durationOptions[Number(event.detail.value)] || track.durationOptions[0];
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
    const startSec = clamp(Number(event.detail.value), track.timelineMin, track.timelineMax - fixedDurationSec);
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
    const endSec = clamp(Number(event.detail.value), track.timelineMin + fixedDurationSec, track.timelineMax);
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
    wx.createSelectorQuery()
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
});
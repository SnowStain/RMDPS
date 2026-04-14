const { buildPageState, createDefaultPageState } = require('./lib/damage-lab-core');
const { renderChart } = require('./lib/damage-lab-chart');

const LIGHT_THEME = {
  canvasBg: '#ffffff',
  textColor: '#102030',
  axisColor: 'rgba(16, 32, 48, 0.24)',
  gridColor: 'rgba(16, 32, 48, 0.08)',
};

const DARK_THEME = {
  canvasBg: '#0f1624',
  textColor: '#eef4ff',
  axisColor: 'rgba(238, 244, 255, 0.2)',
  gridColor: 'rgba(238, 244, 255, 0.08)',
};

function getInitialWindowInfo() {
  try {
    if (typeof wx !== 'undefined' && wx.getWindowInfo) {
      return wx.getWindowInfo();
    }
    if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
      return wx.getSystemInfoSync();
    }
  } catch (error) {
    return null;
  }
  return null;
}

function mergeForm(currentForm, patch) {
  return Object.assign({}, currentForm, patch);
}

function createDefaultViewport() {
  return { start: 0, end: 1 };
}

function formatTimelineRangeText(startSec, endSec) {
  return `${startSec.toFixed(1)}s - ${endSec.toFixed(1)}s`;
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
  const totalDurationSec = Math.max(0.1, nextEndSec - startSec);
  const preSimDurationSec = Math.max(0, Math.min(nextEndSec, 0) - startSec);
  const simDurationSec = Math.max(0, nextEndSec - Math.max(startSec, 0));
  const patch = {
    [`${tracksKey}[${trackIndex}].startSec`]: startSec,
    [`${tracksKey}[${trackIndex}].endSec`]: nextEndSec,
    [`${tracksKey}[${trackIndex}].startPercent`]: startPercent,
    [`${tracksKey}[${trackIndex}].endPercent`]: endPercent,
    [`${tracksKey}[${trackIndex}].spanPercent`]: Math.max(1.5, endPercent - startPercent),
    [`${tracksKey}[${trackIndex}].durationSec`]: nextDurationSec,
    [`${tracksKey}[${trackIndex}].preSimDurationSec`]: Number(preSimDurationSec.toFixed(1)),
    [`${tracksKey}[${trackIndex}].simDurationSec`]: Number(simDurationSec.toFixed(1)),
    [`${tracksKey}[${trackIndex}].preSimPercent`]: Number((preSimDurationSec / totalDurationSec * 100).toFixed(3)),
    [`${tracksKey}[${trackIndex}].simPercent`]: Number((simDurationSec / totalDurationSec * 100).toFixed(3)),
    [`${tracksKey}[${trackIndex}].hasPreSimSegment`]: preSimDurationSec > 0,
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
    const windowInfo = getInitialWindowInfo() || INITIAL_WINDOW_INFO || {};
    const chartWidth = Math.max(300, (windowInfo.windowWidth || 375) - 44);
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
    }, () => {
      this.refreshPageState(this.data.form);
    });
  },

  onUnload() {
    if (wx.offThemeChange && this.themeChangeHandler) {
      wx.offThemeChange(this.themeChangeHandler);
    }
  },

  getThemePalette() {
    return this.data.theme === 'dark' ? DARK_THEME : LIGHT_THEME;
  },

  refreshPageState(formPatch, callback) {
    const nextState = buildPageState(formPatch);
    this.setData(nextState, () => {
      this.drawAllCharts();
      if (typeof callback === 'function') {
        callback();
      }
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
    this.setData(Object.assign({}, createDefaultPageState(), {
      activeTimelineTrackId: '',
      activeTimelineTrackSide: '',
    }), () => {
      this.drawAllCharts();
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
    const startSec = clamp(touchTime - this.timelineDrag.touchOffsetSec, this.timelineDrag.timelineMin, this.timelineDrag.timelineMax - durationSec);
    const nextStartSec = Number(startSec.toFixed(1));
    const nextEndSec = Number((startSec + durationSec).toFixed(1));
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
    this.refreshPageState(mergeForm(this.data.form, {
      attackerRole: role.key,
      attackerProfile: '',
      attackerLevel: 1,
      attackerPosture: 'mobile',
      attackerEffects: [],
    }));
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
    this.refreshPageState(mergeForm(this.data.form, {
      targetRole: role.key,
      targetProfile: '',
      targetLevel: 1,
      targetPosture: 'mobile',
      targetEffects: [],
    }));
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
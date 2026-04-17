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
    wheelScaleBase: null,
    wheelAnchorLock: null,
    wheelAnchorLockUntil: 0,
    mouseX: null,
    mouseY: null,
    floatingCheckRaf: 0,
  };

  var EXHIBIT_IMAGE_SOURCES = [
    '../../assets/ARTINX-Calculate-Lab/particlePattern/balance.jpg',
    '../../assets/ARTINX-Calculate-Lab/particlePattern/dart.jpg',
    '../../assets/ARTINX-Calculate-Lab/particlePattern/drone.jpg',
    '../../assets/ARTINX-Calculate-Lab/particlePattern/electronicControl.jpg',
    '../../assets/ARTINX-Calculate-Lab/particlePattern/engineer.jpg',
    '../../assets/ARTINX-Calculate-Lab/particlePattern/hero.jpg',
    '../../assets/ARTINX-Calculate-Lab/particlePattern/machinery.jpg',
    '../../assets/ARTINX-Calculate-Lab/particlePattern/operator.jpg',
    '../../assets/ARTINX-Calculate-Lab/particlePattern/radar.jpg',
    '../../assets/ARTINX-Calculate-Lab/particlePattern/rune.jpg',
    '../../assets/ARTINX-Calculate-Lab/particlePattern/sentry.jpg',
    '../../assets/ARTINX-Calculate-Lab/particlePattern/vision.jpg',

  ];

  var EXHIBIT_ROTATE_INTERVAL_MS = 4000;
  var FLOOD_DURATION_MS = 680;

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
    slides: [],
    slideIndex: 0,
    moveHandler: null,
    leaveHandler: null,
    selectorOffsetPx: 0,
    selectorVelocityPx: 0,
    selectorRafId: 0,
    selectorSpacing: 74,
    selectorSuppressClickUntil: 0,
    selectorDragging: false,
    loadToken: 0,
  };

  var focusFlowRuntime = {
    canvas: null,
    ctx: null,
    dpr: 1,
    width: 0,
    height: 0,
    particles: [],
    streams: [],
    bits: [],
    seededTheme: '',
  };

  var COMPONENT_WHEEL_SLOTS = [
    {
      key: 'damage-lab',
      label: '伤害计算',
      title: '伤害计算',
      effectLine: '逐发 诊断出伤 + 曲线分析',
      detailLine: '分界面 · 伤害计算组件',
      shortLabel: '伤',
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
    darkLogo: '../../assets/ARTINX-Calculate-Lab/DarkLogo.png',
    lightLogo: '../../assets/ARTINX-Calculate-Lab/WhiteLogo.png',
    darkBackdropVideo: '../../assets/ARTINX-Calculate-Lab/Dark1.mp4',
    lightBackdropVideo: '../../assets/ARTINX-Calculate-Lab/White1.mp4',
  };

  var THEME_HAND_ANCHORS = {
    dark: { x: 0.12, y: 0.57 },
    light: { x: 0.12, y: 0.58 },
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

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function updateWheelAnchorFromBackdrop(resetScaleBase) {
    if (!resetScaleBase && state.wheelAnchorLock && Date.now() < state.wheelAnchorLockUntil) {
      appRoot.style.setProperty('--wheel-anchor-x', state.wheelAnchorLock.x);
      appRoot.style.setProperty('--wheel-anchor-y', state.wheelAnchorLock.y);
      appRoot.style.setProperty('--wheel-anchor-left', state.wheelAnchorLock.left);
      appRoot.style.setProperty('--wheel-anchor-top', state.wheelAnchorLock.top);
      appRoot.style.setProperty('--wheel-scale', state.wheelAnchorLock.scale);
      return;
    }

    var backdropVideo = document.getElementById('backdropVideo');
    if (!backdropVideo) {
      appRoot.style.setProperty('--wheel-scale', '1');
      return;
    }

    var rect = backdropVideo.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) {
      appRoot.style.setProperty('--wheel-scale', '1');
      return;
    }

    var mediaWidth = Math.max(1, toNumber(backdropVideo.videoWidth, 1920));
    var mediaHeight = Math.max(1, toNumber(backdropVideo.videoHeight, 1080));
    var mediaRatio = mediaWidth / mediaHeight;
    var boxRatio = rect.width / rect.height;

    var renderedWidth;
    var renderedHeight;
    var offsetX;
    var offsetY;

    if (mediaRatio > boxRatio) {
      renderedWidth = rect.width;
      renderedHeight = rect.width / mediaRatio;
      offsetX = 0;
      offsetY = (rect.height - renderedHeight) / 2;
    } else {
      renderedHeight = rect.height;
      renderedWidth = rect.height * mediaRatio;
      offsetY = 0;
      offsetX = (rect.width - renderedWidth) / 2;
    }

    var handAnchor = state.theme === 'dark' ? THEME_HAND_ANCHORS.dark : THEME_HAND_ANCHORS.light;
    var anchorX = rect.left + offsetX + renderedWidth * handAnchor.x;
    var anchorY = rect.top + offsetY + renderedHeight * handAnchor.y;

    var viewportWidth = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
    var viewportHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);

    var anchorXPercent = clamp((anchorX / viewportWidth) * 100, 8, 92);
    var anchorYPercent = clamp((anchorY / viewportHeight) * 100, 16, 92);

    if (resetScaleBase || !Number.isFinite(state.wheelScaleBase) || state.wheelScaleBase <= 0) {
      state.wheelScaleBase = renderedHeight;
    }
    var videoScale = renderedHeight / Math.max(1, state.wheelScaleBase);

    appRoot.style.setProperty('--wheel-anchor-x', anchorXPercent.toFixed(3) + '%');
    appRoot.style.setProperty('--wheel-anchor-y', anchorYPercent.toFixed(3) + '%');
    appRoot.style.setProperty('--wheel-anchor-left', anchorX.toFixed(2) + 'px');
    appRoot.style.setProperty('--wheel-anchor-top', anchorY.toFixed(2) + 'px');
    appRoot.style.setProperty('--wheel-scale', Math.max(0.0001, videoScale).toFixed(4));
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
    exhibitRuntime.mouseX = -9999;
    exhibitRuntime.mouseY = -9999;
    exhibitRuntime.selectorDragging = false;
    stopExhibitSelectorMotion();
    teardownFocusFlow();
  }

  function teardownFocusFlow() {
    focusFlowRuntime.canvas = null;
    focusFlowRuntime.ctx = null;
    focusFlowRuntime.width = 0;
    focusFlowRuntime.height = 0;
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

  function sampleThemeGradient(t) {
    var palette = getThemeParticlePalette();
    var ratio = clamp(t, 0, 1);
    if (ratio <= 0.5) {
      return mixColor(palette.a, palette.c, ratio * 2);
    }
    return mixColor(palette.c, palette.b, (ratio - 0.5) * 2);
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
    var spacing = Math.max(42, thumbRect.width + gap);
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
      var y = 14 - Math.pow(abs, 1.26) * 8.2;
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

  function restartExhibitTimer() {
    if (exhibitRuntime.timerId) {
      window.clearInterval(exhibitRuntime.timerId);
      exhibitRuntime.timerId = 0;
    }
    if (!exhibitRuntime.slides.length) {
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
      restartExhibitTimer();
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
    var targetW = width * 0.68;
    var targetH = height * 0.68;
    var scale = Math.min(targetW / boxW, targetH / boxH, 1);
    var cx = (minX + maxX) * 0.5;
    var cy = (minY + maxY) * 0.5;
    var tx = width * 0.5;
    var ty = height * 0.5;
    var normalized = [];
    var distances = [];
    for (var j = 0; j < points.length; j += 1) {
      var pt = points[j];
      if (!pt) {
        continue;
      }
      var nx = (pt.x - cx) * scale + tx;
      var ny = (pt.y - cy) * scale + ty;
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
    var cutoffIndex = clamp(Math.floor(distances.length * 0.992), 0, distances.length - 1);
    var cutoff = distances[cutoffIndex];
    var softLimit = Math.max(width, height) * 0.48;
    var shouldTrim = normalized.length > 600 && cutoff > softLimit;
    var limit = shouldTrim ? cutoff : distances[distances.length - 1];
    return normalized
      .filter(function (item) { return item.d <= limit; })
      .map(function (item) {
        return {
          x: item.x,
          y: item.y,
          a: item.a,
        };
      });
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
    var targetCount = Math.min(240, Math.max(120, Math.floor(focusFlowRuntime.width * focusFlowRuntime.height / 18000)));
    if (focusFlowRuntime.particles.length > targetCount) {
      focusFlowRuntime.particles = focusFlowRuntime.particles.slice(0, targetCount);
      return;
    }
    while (focusFlowRuntime.particles.length < targetCount) {
      focusFlowRuntime.particles.push(createFlowParticle(focusFlowRuntime.width, focusFlowRuntime.height));
    }

    var streamTargetCount = Math.min(18, Math.max(9, Math.floor(focusFlowRuntime.width / 160)));
    if (focusFlowRuntime.streams.length > streamTargetCount) {
      focusFlowRuntime.streams = focusFlowRuntime.streams.slice(0, streamTargetCount);
    }
    while (focusFlowRuntime.streams.length < streamTargetCount) {
      focusFlowRuntime.streams.push(createFlowStream(focusFlowRuntime.width, focusFlowRuntime.height));
    }

    var bitTargetCount = Math.min(260, Math.max(140, streamTargetCount * 12));
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
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      focusFlowRuntime.particles = [];
      focusFlowRuntime.streams = [];
      focusFlowRuntime.bits = [];
    }

    if (focusFlowRuntime.seededTheme !== state.theme) {
      focusFlowRuntime.seededTheme = state.theme;
      focusFlowRuntime.particles = [];
      focusFlowRuntime.streams = [];
      focusFlowRuntime.bits = [];
    }

    seedFocusFlowParticles();
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

    var step = Math.max(1, Math.floor(Math.min(width, height) / 180));
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
          a: clamp((c.distance + dominantDistance + c.lumaDelta) / 240, 0.16, 0.86),
        });
      }
    }
    return points;
  }

  function applyExhibitSlide(index) {
    var slides = exhibitRuntime.slides;
    if (!slides.length) {
      return;
    }
    var nextPoints = slides[index % slides.length] || [];
    var maxLen = Math.max(exhibitRuntime.particles.length, nextPoints.length);
    var nextParticles = [];

    for (var i = 0; i < maxLen; i += 1) {
      var oldParticle = exhibitRuntime.particles[i];
      var target = nextPoints[i];

      if (!oldParticle) {
        if (!target) {
          continue;
        }
        oldParticle = {
          x: target.x,
          y: target.y,
          vx: 0,
          vy: 0,
          tx: target.x,
          ty: target.y,
          alpha: Number.isFinite(target.a) ? target.a : 1,
          ta: Number.isFinite(target.a) ? target.a : 1,
          tone: Math.random(),
        };
      }

      if (target) {
        oldParticle.tx = target.x;
        oldParticle.ty = target.y;
        oldParticle.ta = Number.isFinite(target.a) ? target.a : 1;
        oldParticle.tone = Number.isFinite(oldParticle.tone) ? oldParticle.tone : Math.random();
      } else {
        oldParticle.ta = 0;
      }
      nextParticles.push(oldParticle);
    }

    exhibitRuntime.particles = nextParticles;
    exhibitRuntime.slideIndex = index % slides.length;

    if (exhibitRuntime.zone) {
      exhibitRuntime.zone.classList.remove('culture-exhibit-swapping');
      void exhibitRuntime.zone.offsetWidth;
      exhibitRuntime.zone.classList.add('culture-exhibit-swapping');
    }
    syncExhibitSelectorUi();
  }

  function renderExhibitFrame() {
    if (!exhibitRuntime.ctx || !exhibitRuntime.canvas || !state.hideUiForBackdrop) {
      return;
    }
    var ctx = exhibitRuntime.ctx;
    var width = exhibitRuntime.width;
    var height = exhibitRuntime.height;

    ctx.clearRect(0, 0, width, height);
    for (var i = exhibitRuntime.particles.length - 1; i >= 0; i -= 1) {
      var p = exhibitRuntime.particles[i];
      var dx = p.x - exhibitRuntime.mouseX;
      var dy = p.y - exhibitRuntime.mouseY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 72) {
        var force = ((72 - dist) / 72) * 0.95;
        var angle = Math.atan2(dy, dx);
        p.vx += Math.cos(angle) * force;
        p.vy += Math.sin(angle) * force;
      }

      p.vx += (p.tx - p.x) * 0.045;
      p.vy += (p.ty - p.y) * 0.045;
      p.vx *= 0.82;
      p.vy *= 0.82;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha += (p.ta - p.alpha) * 0.08;

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
      ctx.fillStyle = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',' + clamp(p.alpha, 0, 1).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.72, 0, Math.PI * 2);
      ctx.fill();
    }
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
    var pointerX = Number.isFinite(state.mouseX) ? state.mouseX * focusFlowRuntime.dpr : -9999;
    var pointerY = Number.isFinite(state.mouseY) ? state.mouseY * focusFlowRuntime.dpr : -9999;

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

    function loop() {
      renderExhibitFrame();
      renderFocusFlowFrame();
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
        var rect = canvas.getBoundingClientRect();
        exhibitRuntime.mouseX = event.clientX - rect.left;
        exhibitRuntime.mouseY = event.clientY - rect.top;
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
    }

    if (!exhibitRuntime.slides.length) {
      exhibitRuntime.loadToken += 1;
      var loadToken = exhibitRuntime.loadToken;
      Promise.all(EXHIBIT_IMAGE_SOURCES.map(function (src) {
        return new Promise(function (resolve) {
          var img = new Image();
          img.onload = function () {
            resolve(img);
          };
          img.onerror = function () {
            resolve(null);
          };
          img.src = encodeURI(src);
        });
      })).then(function (images) {
        if (loadToken !== exhibitRuntime.loadToken) {
          return;
        }
        if (!exhibitRuntime.zone || !exhibitRuntime.ctx || !state.hideUiForBackdrop) {
          return;
        }
        exhibitRuntime.slides = images
          .filter(function (img) { return !!img; })
          .map(function (img) {
            var pts = buildUltraImagePoints(img, exhibitRuntime.width, exhibitRuntime.height);
            return normalizeExhibitPoints(pts, exhibitRuntime.width, exhibitRuntime.height);
          })
          .filter(function (points) { return points.length > 20; });

        var sourceMode = exhibitRuntime.slides.length ? 'image-ultra' : 'none';
        if (!exhibitRuntime.slides.length) {
          exhibitRuntime.slides = images
            .filter(function (img) { return !!img; })
            .map(function (img) {
              var pts = buildExhibitPointsFromImage(img, exhibitRuntime.width, exhibitRuntime.height, true);
              return normalizeExhibitPoints(pts, exhibitRuntime.width, exhibitRuntime.height);
            })
            .filter(function (points) { return points.length > 8; });
          sourceMode = exhibitRuntime.slides.length ? 'image-relaxed' : 'none';
        }

        var fallbackUsed = false;
        if (!exhibitRuntime.slides.length) {
          fallbackUsed = true;
          sourceMode = 'generated-fallback';
          exhibitRuntime.slides = EXHIBIT_IMAGE_SOURCES.map(function (_, idx) {
            var pts = buildFallbackExhibitPoints(exhibitRuntime.width, exhibitRuntime.height, idx + 1);
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
          applyExhibitSlide(exhibitRuntime.slideIndex);
          restartExhibitTimer();
        }
      });
      return;
    }

    if (!exhibitRuntime.rafId) {
      startExhibitLoop();
    }
    if (!exhibitRuntime.particles.length && exhibitRuntime.slides.length) {
      applyExhibitSlide(exhibitRuntime.slideIndex);
    }
    restartExhibitTimer();
  }

  function applyShellChrome() {
    refreshFloatingTitle();
    appRoot.classList.toggle('theme-dark', state.theme === 'dark');
    appRoot.classList.toggle('theme-light', state.theme !== 'dark');
    appRoot.classList.toggle('backdrop-expanded', state.backdropExpanded);
    appRoot.classList.toggle('backdrop-collapsed', !state.backdropExpanded);
    appRoot.classList.toggle('show-floating-title', state.showFloatingTitle);
    appRoot.classList.toggle('focus-mode', state.hideUiForBackdrop);
    appRoot.classList.toggle('backdrop-transitioning', state.backdropTransitioning);
    appRoot.classList.toggle('backdrop-revealing', state.backdropRevealing);

    var backdropVideo = document.getElementById('backdropVideo');
    if (backdropVideo) {
      var backdropSrc = state.theme === 'dark' ? THEME_ASSETS.darkBackdropVideo : THEME_ASSETS.lightBackdropVideo;
      if (backdropVideo.getAttribute('src') !== backdropSrc) {
        backdropVideo.setAttribute('src', backdropSrc);
        state.wheelScaleBase = null;
        backdropVideo.load();
      }
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

    if (state.hideUiForBackdrop) {
      syncCultureExhibit();
      syncExhibitSelectorUi();
    } else {
      teardownCultureExhibit();
    }

    var heroLogo = document.getElementById('heroLogo');
    if (heroLogo) {
      heroLogo.src = state.theme === 'dark' ? THEME_ASSETS.darkLogo : THEME_ASSETS.lightLogo;
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

    scheduleFloatingTitleObstructionCheck();
  }

  function startBackdropReveal() {
    if (state.backdropRevealTimer) {
      window.clearTimeout(state.backdropRevealTimer);
    }
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        state.backdropTransitioning = false;
        state.backdropRevealing = true;
        applyShellChrome();
        state.backdropRevealTimer = window.setTimeout(function () {
          state.backdropRevealing = false;
          applyShellChrome();
        }, 750);
      });
    });
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
      state.backdropExpanded = false;
      state.hideUiForBackdrop = false;
      state.wheelAnchorLock = null;
      state.wheelAnchorLockUntil = 0;
      state.showFloatingTitle = true;
      state.backdropTransitioning = true;
      renderMain();
      if (state.backdropTransitionTimer) {
        window.clearTimeout(state.backdropTransitionTimer);
      }
      state.backdropTransitionTimer = window.setTimeout(function () {
        startBackdropReveal();
      }, FLOOD_DURATION_MS);
      return;
    }
    updateComponentHintBySlot(activeSlot);
    syncComponentWheelUi();
  }

  function syncComponentWheelUi() {
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
      hintNode.textContent = getComponentEffectTextBySlot(getActiveWheelSlot());
    }
    var detailNode = document.getElementById('componentWheelDetail');
    if (detailNode) {
      detailNode.textContent = getComponentDetailTextBySlot(getActiveWheelSlot());
    }
    var currentNameNode = document.getElementById('componentWheelCurrentName');
    if (currentNameNode) {
      currentNameNode.textContent = getComponentDisplayNameBySlot(getActiveWheelSlot());
    }
    var componentNameNode = document.getElementById('currentComponentName');
    if (componentNameNode) {
      componentNameNode.textContent = getComponentDisplayNameBySlot(getActiveWheelSlot());
    }
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
    var logoSrc = state.theme === 'dark' ? THEME_ASSETS.darkLogo : THEME_ASSETS.lightLogo;
    var heroCardClass = state.hideUiForBackdrop ? 'hero-card hero-card-focus' : 'hero-card';
    var columnsClass = state.hideUiForBackdrop ? 'lab-columns lab-columns-hidden' : 'lab-columns';
    var collapseBridgeClass = 'collapse-bridge collapse-bridge-visible';
    var collapseButtonMarkup = state.hideUiForBackdrop
      ? ''
      : '<view class="collapse-bridge-btn theme-switch" data-action="toggle-backdrop">返回主界面</view>';
    var wheelClass = state.hideUiForBackdrop ? 'component-revolver component-revolver-visible' : 'component-revolver';
    var exhibitClass = state.hideUiForBackdrop ? 'culture-exhibit-zone culture-exhibit-zone-visible' : 'culture-exhibit-zone';
    var exhibitSelectorClass = state.hideUiForBackdrop ? 'exhibit-selector exhibit-selector-visible' : 'exhibit-selector';
    var flowCanvasClass = state.hideUiForBackdrop ? 'focus-flow-canvas focus-flow-canvas-visible' : 'focus-flow-canvas';
    var currentComponentDisplayName = getComponentDisplayNameBySlot(getActiveWheelSlot());
    var currentComponentEffect = getComponentEffectTextBySlot(getActiveWheelSlot());
    var currentComponentDetail = getComponentDetailTextBySlot(getActiveWheelSlot());
    updateComponentHintBySlot(getActiveWheelSlot());

    contentRoot.innerHTML = ''
      + '<view class="portrait-stage-shell">'
      + '<view class="portrait-stage-copy">'
      + '<text class="portrait-stage-kicker">ARTINX LAB</text>'
      + '<text class="portrait-stage-title">大道至简匠心至臻</text>'
      + '</view>'
      + '</view>'
      + '<view class="' + heroCardClass + '">'
      + '<view class="hero-top">'
      + '<view class="hero-brand">'
      + '<img id="heroLogo" class="hero-logo" src="' + escapeHtml(logoSrc) + '" alt="ARTINX" />'
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
      + '<view class="team-culture-showcase">'
      + '<text class="team-culture-kicker">TEAM CULTURE</text>'
      + '<text class="team-culture-copy">战队文创展示区（预留）</text>'
      + '</view>'
      + '</view>'
      + '</view>'
      + '</view>'
      + '<view class="' + collapseBridgeClass + '">' + collapseButtonMarkup + '</view>'
      + '<view class="' + wheelClass + '">'
      + '<view class="revolver-module-panel">'
      + '<text class="revolver-module-kicker">组件</text>'
      + '<text id="componentWheelCurrentName" class="revolver-module-current">' + escapeHtml(currentComponentDisplayName) + '</text>'
      + '<text id="componentWheelHint" class="revolver-module-text">' + escapeHtml(currentComponentEffect) + '</text>'
      + '<text id="componentWheelDetail" class="revolver-module-detail">' + escapeHtml(currentComponentDetail) + '</text>'
      + '</view>'
      + '<view class="revolver-shell-wrap">'
      + '<view class="revolver-shell">'
      + '<view id="componentWheelRotator" class="revolver-rotator" data-wheel-drag="true">'
      + buildWheelSlotsHtml()
      + '</view>'
      + '<view class="revolver-center" data-action="wheel-enter"><text class="revolver-center-text">选择组件</text></view>'
      + '</view>'
      + '</view>'
      + '</view>'
      + '<view id="cultureExhibitZone" class="' + exhibitClass + '"><canvas id="cultureExhibitCanvas" class="culture-exhibit-canvas"></canvas></view>'
      + '<view id="exhibitSelector" class="' + exhibitSelectorClass + '" data-exhibit-drag="true">' + buildExhibitSelectorHtml() + '</view>'
      + '<canvas id="focusFlowCanvas" class="' + flowCanvasClass + '"></canvas>'

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

    syncRangeTrackFill(contentRoot);
    applyShellChrome();
    syncComponentWheelUi();
  syncExhibitSelectorUi();
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
      var now = Date.now();
      state.exhibitDrag = {
        pointerId: event.pointerId,
        handleNode: exhibitDragNode,
        startX: event.clientX,
        lastX: event.clientX,
        startOffset: exhibitRuntime.selectorOffsetPx,
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
      state.componentWheelIndex = getWheelIndexByAngle(state.componentWheelAngle);
      updateComponentHintBySlot(getActiveWheelSlot());
      syncComponentWheelUi();
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
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      focusFlowRuntime.seededTheme = '';
      focusFlowRuntime.particles = [];
      focusFlowRuntime.streams = [];
      focusFlowRuntime.bits = [];
      exhibitRuntime.slides = [];
      exhibitRuntime.particles = [];
      exhibitRuntime.loadToken += 1;
      state.showFloatingTitle = false;
      state.backdropTransitioning = true;
      renderMain();
      if (state.hideUiForBackdrop) {
        window.requestAnimationFrame(function () {
          syncCultureExhibit();
        });
      }
      if (state.backdropTransitionTimer) {
        window.clearTimeout(state.backdropTransitionTimer);
      }
      state.backdropTransitionTimer = window.setTimeout(function () {
        startBackdropReveal();
      }, FLOOD_DURATION_MS);
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
      var nextCollapsed = !state.hideUiForBackdrop;
      if (nextCollapsed) {
        updateWheelAnchorFromBackdrop();
        state.wheelAnchorLock = {
          x: appRoot.style.getPropertyValue('--wheel-anchor-x') || '50%',
          y: appRoot.style.getPropertyValue('--wheel-anchor-y') || '50%',
          left: appRoot.style.getPropertyValue('--wheel-anchor-left') || '50%',
          top: appRoot.style.getPropertyValue('--wheel-anchor-top') || '50%',
          scale: appRoot.style.getPropertyValue('--wheel-scale') || '1',
        };
        state.wheelAnchorLockUntil = Date.now() + 760;
      }
      state.backdropExpanded = nextCollapsed;
      state.hideUiForBackdrop = nextCollapsed;
      if (!nextCollapsed) {
        state.wheelAnchorLock = null;
        state.wheelAnchorLockUntil = 0;
        state.componentWheelIndex = 0;
        state.componentWheelAngle = 0;
        updateComponentHintBySlot(COMPONENT_WHEEL_SLOTS[0]);
      }
      state.showFloatingTitle = false;
      state.backdropTransitioning = true;
      renderMain();
      if (nextCollapsed) {
        window.requestAnimationFrame(function () {
          updateWheelAnchorFromBackdrop();
          syncCultureExhibit();
        });
      }
      if (state.backdropTransitionTimer) {
        window.clearTimeout(state.backdropTransitionTimer);
      }
      state.backdropTransitionTimer = window.setTimeout(function () {
        state.wheelAnchorLock = null;
        state.wheelAnchorLockUntil = 0;
        startBackdropReveal();
      }, FLOOD_DURATION_MS);
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
  appRoot.addEventListener('click', function (event) {
    var actionNode = event.target.closest('[data-action]');
    if (!actionNode || contentRoot.contains(actionNode)) {
      return;
    }
    var action = actionNode.getAttribute('data-action');
    if (action === 'toggle-theme') {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      focusFlowRuntime.seededTheme = '';
      focusFlowRuntime.particles = [];
      focusFlowRuntime.streams = [];
      focusFlowRuntime.bits = [];
      exhibitRuntime.slides = [];
      exhibitRuntime.particles = [];
      exhibitRuntime.loadToken += 1;
      state.showFloatingTitle = false;
      state.backdropTransitioning = true;
      renderMain();
      if (state.hideUiForBackdrop) {
        window.requestAnimationFrame(function () {
          syncCultureExhibit();
        });
      }
      if (state.backdropTransitionTimer) {
        window.clearTimeout(state.backdropTransitionTimer);
      }
      state.backdropTransitionTimer = window.setTimeout(function () {
        state.backdropTransitioning = false;
        startBackdropReveal();
      }, 620);
    }
  });
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('mousemove', function (event) {
    state.mouseX = event.clientX;
    state.mouseY = event.clientY;
    scheduleFloatingTitleObstructionCheck();
  }, { passive: true });
  window.addEventListener('resize', function () {
    applyShellChrome();
    renderCharts();
    if (state.hideUiForBackdrop) {
      syncCultureExhibit();
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
    renderMain();
    applyShellChrome();
  }

  init();
})();

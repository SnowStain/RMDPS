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
    backdropExpanded: !isDesktopLike(),
    showFloatingTitle: false,
    hideUiForBackdrop: false,
    viewport: {
      output: { start: 0, end: 1 },
      thermal: { start: 0, end: 1 },
      target: { start: 0, end: 1 },
    },
    timelineDrag: null,
    drag: null,
    wheelDrag: null,
    wheelSnapTimer: null,
    backdropTransitionTimer: null,
    backdropTransitioning: false,
    componentWheelAngle: 0,
    componentWheelIndex: 0,
    componentHint: '逐发 诊断出伤 + 曲线分析',
    mouseX: null,
    mouseY: null,
    floatingCheckRaf: 0,
  };

  var COMPONENT_WHEEL_SLOTS = [
    {
      key: 'damage-lab',
      label: 'Damage Lab',
      title: 'Damage Calculator',
      effectLine: '逐发 诊断出伤 + 曲线分析',
      detailLine: '支持各类机器人的伤害计算',
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
    darkLogo: '../../assets/ARTINX-Calculate-Lab/DarkLogo.png',
    lightLogo: '../../assets/ARTINX-Calculate-Lab/WhiteLogo.png',
    darkBackdrop: '../../assets/ARTINX-Calculate-Lab/backdrop-dark.webp',
    lightBackdrop: '../../assets/ARTINX-Calculate-Lab/backdrop-light.webp',
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

    return {
      title: '战场嘴替',
      lines: [hitLine, ttkLine, dpsLine],
    };
  }

  function renderMetricRows(rows) {
    return ensureArray(rows)
      .reduce(function (acc, row) {
        return acc.concat(ensureArray(row));
      }, [])
      .map(function (item) {
        return '<view class="metric-card"><text class="metric-label">' + escapeHtml(item.label) + '</text><text class="metric-value">' + escapeHtml(item.value) + '</text></view>';
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

  function applyShellChrome() {
    refreshFloatingTitle();
    appRoot.classList.toggle('theme-dark', state.theme === 'dark');
    appRoot.classList.toggle('theme-light', state.theme !== 'dark');
    appRoot.classList.toggle('backdrop-expanded', state.backdropExpanded);
    appRoot.classList.toggle('backdrop-collapsed', !state.backdropExpanded);
    appRoot.classList.toggle('show-floating-title', state.showFloatingTitle);
    appRoot.classList.toggle('focus-mode', state.hideUiForBackdrop);
    appRoot.classList.toggle('backdrop-transitioning', state.backdropTransitioning);

    var backdropImage = document.getElementById('backdropImage');
    if (backdropImage) {
      backdropImage.src = state.theme === 'dark' ? THEME_ASSETS.darkBackdrop : THEME_ASSETS.lightBackdrop;
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
      state.showFloatingTitle = true;
      renderMain();
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
    var centerlineNode = document.getElementById('componentWheelCenterline');
    if (centerlineNode) {
      centerlineNode.textContent = getComponentDisplayNameBySlot(getActiveWheelSlot());
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
      taunt = '<view class="summary-box taunt-box">'
        + '<text class="taunt-title">' + escapeHtml(tauntData.title || '战场嘴替') + '</text>'
        + ensureArray(tauntData.lines).map(function (line) { return '<text class="taunt-line">' + escapeHtml(line) + '</text>'; }).join('')
        + '</view>';
    }

    var attackerTracks = ensureArray(page.attackerTimelineTracks);
    var targetTracks = ensureArray(page.targetTimelineTracks);
    var logoSrc = state.theme === 'dark' ? THEME_ASSETS.darkLogo : THEME_ASSETS.lightLogo;
    var heroCardClass = state.hideUiForBackdrop ? 'hero-card hero-card-focus' : 'hero-card';
    var columnsClass = state.hideUiForBackdrop ? 'lab-columns lab-columns-hidden' : 'lab-columns';
    var collapseBridgeClass = 'collapse-bridge collapse-bridge-visible';
    var collapseButtonText = state.hideUiForBackdrop ? '恢复当前组件' : '查看其他组件';
    var wheelClass = state.hideUiForBackdrop ? 'component-revolver component-revolver-visible' : 'component-revolver';
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
      + '<text class="hero-eyebrow">RoboMaster</text>'
      + '<view class="hero-title-row">'
      + '<text class="hero-title">ARTINX Laboratory</text>'
      + '<view class="hero-component-indicator">'
      + '<text class="hero-component-kicker">CURRENT MODULE</text>'
      + '<text id="currentComponentName" class="hero-component-name">' + escapeHtml(currentComponentDisplayName) + '</text>'
      + '</view>'
      + '</view>'
      + '<text class="hero-copy"></text>'
      + '</view>'
      + '</view>'
      + '</view>'
      + '</view>'
      + '<view class="' + collapseBridgeClass + '">'
      + '<view class="collapse-bridge-btn theme-switch" data-action="toggle-backdrop">' + collapseButtonText + '</view>'
      + '</view>'
      + '<view class="' + wheelClass + '">'
      + '<view class="revolver-module-panel">'
      + '<text id="componentWheelHint" class="revolver-module-text">' + escapeHtml(currentComponentEffect) + '</text>'
      + '<text id="componentWheelDetail" class="revolver-module-detail">' + escapeHtml(currentComponentDetail) + '</text>'
      + '</view>'
      + '<view class="revolver-shell-wrap">'
      + '<view class="revolver-shell">'
      + '<view class="revolver-centerline"><text id="componentWheelCenterline" class="revolver-centerline-text">' + escapeHtml(currentComponentDisplayName) + '</text></view>'
      + '<view id="componentWheelRotator" class="revolver-rotator" data-wheel-drag="true">'
      + buildWheelSlotsHtml()
      + '</view>'
      + '<view class="revolver-center" data-action="wheel-enter"><text class="revolver-center-text">选择</text></view>'
      + '</view>'
      + '</view>'
      + '</view>'

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
      + '<view class="panel-header align-center"><view class="panel-heading-inline"><text class="panel-kicker">CURVES</text><text class="panel-title panel-title-inline">数值曲线</text></view><view class="theme-switch mini" data-action="reset-viewport">重置视图</view></view>'

      + '<view class="chart-card">'
      + '<view class="chart-head"><view><text class="chart-title">' + escapeHtml(analysis.charts.output.title) + '</text><text class="chart-subtitle">' + escapeHtml(analysis.charts.output.subtitle) + '</text></view><view class="chart-chip">' + escapeHtml(analysis.charts.output.unitHint) + '</view></view>'
      + '<view class="legend-row">' + renderLegend(analysis.charts.output.series) + '</view>'
      + '<view id="outputChartWrap" class="chart-touch-layer" data-chart-key="output"><canvas id="outputChart" class="chart-canvas"></canvas></view>'
      + '</view>'

      + '<view class="chart-card">'
      + '<view class="chart-head"><view><text class="chart-title">' + escapeHtml(analysis.charts.thermal.title) + '</text><text class="chart-subtitle">' + escapeHtml(analysis.charts.thermal.subtitle) + '</text></view><view class="chart-chip">' + escapeHtml(analysis.charts.thermal.unitHint) + '</view></view>'
      + '<view class="legend-row">' + renderLegend(analysis.charts.thermal.series) + '</view>'
      + '<view id="thermalChartWrap" class="chart-touch-layer" data-chart-key="thermal"><canvas id="thermalChart" class="chart-canvas"></canvas></view>'
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
      + '<text class="lab-footer-version">版本号 v2.1.1</text></view>'
      + '</view>';

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
    var width = Math.max(320, Math.floor(wrap.clientWidth || 320));
    var height = width >= 520 ? Math.max(300, Math.floor(width * 0.56)) : Math.max(220, Math.floor(width * 0.52));
    var viewport = state.viewport[chartKey] || { start: 0, end: 1 };
    renderChart(canvasId, chartData, width, height, getChartTheme(), viewport);
  }

  function renderCharts() {
    if (!state.page || !state.page.analysis || !state.page.analysis.charts) {
      return;
    }
    drawSingleChart('outputChartWrap', 'outputChart', 'output', state.page.analysis.charts.output);
    drawSingleChart('thermalChartWrap', 'thermalChart', 'thermal', state.page.analysis.charts.thermal);
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
      renderMain();
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
      state.backdropExpanded = nextCollapsed;
      state.hideUiForBackdrop = nextCollapsed;
      if (!nextCollapsed) {
        state.componentWheelIndex = 0;
        state.componentWheelAngle = 0;
        updateComponentHintBySlot(COMPONENT_WHEEL_SLOTS[0]);
      }
      state.showFloatingTitle = false;
      state.backdropTransitioning = true;
      if (nextCollapsed) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      renderMain();
      if (state.backdropTransitionTimer) {
        window.clearTimeout(state.backdropTransitionTimer);
      }
      state.backdropTransitionTimer = window.setTimeout(function () {
        state.backdropTransitioning = false;
        applyShellChrome();
      }, 620);
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

    if (action === 'reset-viewport') {
      state.viewport.output = { start: 0, end: 1 };
      state.viewport.thermal = { start: 0, end: 1 };
      state.viewport.target = { start: 0, end: 1 };
      renderCharts();
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
      renderMain();
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

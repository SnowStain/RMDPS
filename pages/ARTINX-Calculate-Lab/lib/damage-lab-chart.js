function findMinMax(seriesCollection) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  seriesCollection.forEach((series) => {
    series.values.forEach((value) => {
      min = Math.min(min, value);
      max = Math.max(max, value);
    });
  });

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1 };
  }
  if (Math.abs(max - min) < 1e-6) {
    return { min: min - 1, max: max + 1 };
  }

  const padding = (max - min) * 0.1;
  return { min: Math.max(0, min - padding), max: max + padding };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resolveViewport(viewport) {
  const start = clamp(Number(viewport && viewport.start) || 0, 0, 0.95);
  const end = clamp(Number(viewport && viewport.end) || 1, start + 0.05, 1);
  return { start, end };
}

function formatTimeLabel(value) {
  return value >= 10 ? `${value.toFixed(0)}s` : `${value.toFixed(1)}s`;
}

function formatMetricLabel(value) {
  const absValue = Math.abs(value);
  if (absValue >= 1000000) {
    return `${(value / 1000000).toFixed(1)}m`;
  }
  if (absValue >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  if (absValue >= 100) {
    return `${value.toFixed(0)}`;
  }
  if (absValue >= 10) {
    return `${value.toFixed(1)}`;
  }
  return `${value.toFixed(2)}`;
}

function drawSeriesPath(ctx, chart, series, visibleWindow, range, frame) {
  ctx.beginPath();
  series.values.forEach((value, index) => {
    if (index < visibleWindow.startIndex || index > visibleWindow.endIndex) {
      return;
    }
    const clampedTime = clamp(chart.timeSec[index], visibleWindow.startTime, visibleWindow.endTime);
    const x = frame.left + (frame.right - frame.left) * ((clampedTime - visibleWindow.startTime) / visibleWindow.span);
    const normalized = (value - range.min) / (range.max - range.min || 1);
    const y = frame.bottom - normalized * (frame.bottom - frame.top);
    if (index === visibleWindow.startIndex) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
}

function getVisibleWindow(timeSec, viewport) {
  const safeViewport = resolveViewport(viewport);
  const totalTime = timeSec[timeSec.length - 1] || 1;
  const startTime = totalTime * safeViewport.start;
  const endTime = totalTime * safeViewport.end;
  let startIndex = 0;
  let endIndex = timeSec.length - 1;

  for (let index = 0; index < timeSec.length; index += 1) {
    if (timeSec[index] >= startTime) {
      startIndex = Math.max(0, index - 1);
      break;
    }
  }

  for (let index = startIndex; index < timeSec.length; index += 1) {
    if (timeSec[index] > endTime) {
      endIndex = Math.min(timeSec.length - 1, index);
      break;
    }
  }

  return {
    startTime,
    endTime,
    startIndex,
    endIndex,
    span: Math.max(1e-6, endTime - startTime),
  };
}

function drawAxes(ctx, width, height, theme) {
  const left = 56;
  const right = width - 18;
  const top = 24;
  const bottom = height - 34;

  ctx.strokeStyle = theme.gridColor || 'rgba(145, 76, 255, 0.16)';
  ctx.lineWidth = 1;
  for (let row = 0; row < 4; row += 1) {
    const y = top + (bottom - top) * row / 3;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  ctx.strokeStyle = theme.axisColor || 'rgba(127, 69, 242, 0.22)';
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();

  return { left, right, top, bottom };
}

function getTimeValueAt(timeLabels, index) {
  if (typeof timeLabels[index] === 'string') {
    return parseFloat(timeLabels[index].replace('s', '')) || index * 10;
  }
  return Number(timeLabels[index]) || index * 10;
}

function getSeriesPoint(timeLabels, series, index, visibleWindow, range, frame) {
  if (!series || !Array.isArray(series.values) || index < 0 || index >= series.values.length) {
    return null;
  }
  const value = Number(series.values[index]);
  if (!Number.isFinite(value)) {
    return null;
  }
  const timeValue = getTimeValueAt(timeLabels, index);
  const clampedTime = clamp(timeValue, visibleWindow.startTime, visibleWindow.endTime);
  const x = frame.left + (frame.right - frame.left) * ((clampedTime - visibleWindow.startTime) / visibleWindow.span);
  const normalized = (value - range.min) / (range.max - range.min || 1);
  const y = frame.bottom - normalized * (frame.bottom - frame.top);
  return { x, y };
}

function drawSeriesHighlightSegments(ctx, renderState, series, visibleWindow, range, frame) {
  const maskMap = renderState.highlightMasks;
  const mask = maskMap && maskMap[series.key];
  if (!Array.isArray(mask) || !mask.length) {
    return;
  }

  const highlightColor = renderState.highlightColor || '#ff2b2b';
  const startIndex = Math.max(visibleWindow.startIndex + 1, 1);
  const endIndex = Math.min(visibleWindow.endIndex, mask.length - 1, series.values.length - 1);
  if (endIndex < startIndex) {
    return;
  }

  for (let index = startIndex; index <= endIndex; index += 1) {
    if (!mask[index]) {
      continue;
    }
    if (mask[index - 1]) {
      const previousPoint = getSeriesPoint(renderState.timeLabels, series, index - 1, visibleWindow, range, frame);
      const currentSegmentPoint = getSeriesPoint(renderState.timeLabels, series, index, visibleWindow, range, frame);
      if (previousPoint && currentSegmentPoint) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = highlightColor;
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(previousPoint.x, previousPoint.y);
        ctx.lineTo(currentSegmentPoint.x, currentSegmentPoint.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    const currentPoint = getSeriesPoint(renderState.timeLabels, series, index, visibleWindow, range, frame);
    if (!currentPoint) {
      continue;
    }

    ctx.save();
    ctx.beginPath();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = highlightColor;
    ctx.arc(currentPoint.x, currentPoint.y, 5.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = highlightColor;
    ctx.arc(currentPoint.x, currentPoint.y, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255, 240, 240, 0.92)';
    ctx.stroke();
    ctx.restore();
  }
}

function drawStartValueLabels(ctx, renderState, frame, visibleWindow, range) {
  const labels = [];
  const x = frame.left;

  renderState.seriesData.forEach((series) => {
    const startValue = Number(series.values[visibleWindow.startIndex]);
    if (!Number.isFinite(startValue)) {
      return;
    }
    const normalized = (startValue - range.min) / (range.max - range.min || 1);
    const y = frame.bottom - normalized * (frame.bottom - frame.top);
    labels.push({
      y,
      color: series.color,
      text: formatMetricLabel(startValue),
    });
  });

  labels.sort((a, b) => a.y - b.y);
  const minGap = 12;
  for (let index = 1; index < labels.length; index += 1) {
    if (labels[index].y - labels[index - 1].y < minGap) {
      labels[index].y = labels[index - 1].y + minGap;
    }
  }
  for (let index = labels.length - 2; index >= 0; index -= 1) {
    if (labels[index + 1].y > frame.bottom - 2) {
      labels[index + 1].y = frame.bottom - 2;
    }
    if (labels[index + 1].y - labels[index].y < minGap) {
      labels[index].y = labels[index + 1].y - minGap;
    }
  }

  ctx.font = '10px Arial';
  labels.forEach((item) => {
    const safeY = clamp(item.y, frame.top + 2, frame.bottom - 2);
    ctx.beginPath();
    ctx.fillStyle = item.color;
    ctx.arc(x, safeY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = item.color;
    ctx.fillText(item.text, x + 6, safeY + 3);
  });
}

function findTtkTimeSec(renderState) {
  const targetHealthSeries = renderState.seriesData.find((series) => series && series.key === 'targetHealth');
  if (!targetHealthSeries) {
    return null;
  }
  for (let index = 0; index < targetHealthSeries.values.length; index += 1) {
    const value = Number(targetHealthSeries.values[index]);
    if (Number.isFinite(value) && value <= 1e-9) {
      return getTimeValueAt(renderState.timeLabels, index);
    }
  }
  return null;
}

function drawTtkMarker(ctx, renderState, frame, visibleWindow) {
  const ttkSec = findTtkTimeSec(renderState);
  if (!Number.isFinite(ttkSec)) {
    return;
  }
  if (ttkSec < visibleWindow.startTime || ttkSec > visibleWindow.endTime) {
    return;
  }

  const x = frame.left + (frame.right - frame.left) * ((ttkSec - visibleWindow.startTime) / visibleWindow.span);
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = renderState.theme.tickAccentColor || '#cfff2e';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, frame.top);
  ctx.lineTo(x, frame.bottom);
  ctx.stroke();
  ctx.restore();

  const label = `归零 ${formatTimeLabel(ttkSec)}`;
  ctx.font = '11px Arial';
  ctx.fillStyle = renderState.theme.tickAccentColor || '#cfff2e';
  const labelX = clamp(x - 30, frame.left + 4, frame.right - 72);
  ctx.fillText(label, labelX, frame.top + 12);
}

function ensureTooltip(canvas) {
  const host = canvas.parentElement;
  if (!host) {
    return null;
  }
  let tooltip = host.querySelector('.chart-hover-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'chart-hover-tooltip';
    tooltip.style.display = 'none';
    host.appendChild(tooltip);
  }
  return tooltip;
}

function hideTooltip(canvas) {
  const tooltip = ensureTooltip(canvas);
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}

function drawHoverLayer(ctx, canvas, renderState, frame, visibleWindow, range) {
  const hoverIndex = renderState.hoverIndex;
  if (!Number.isInteger(hoverIndex)) {
    hideTooltip(canvas);
    return;
  }

  const pointTime = getTimeValueAt(renderState.timeLabels, hoverIndex);
  const x = frame.left + (frame.right - frame.left) * ((pointTime - visibleWindow.startTime) / visibleWindow.span);
  if (!Number.isFinite(x) || x < frame.left - 1 || x > frame.right + 1) {
    hideTooltip(canvas);
    return;
  }

  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = renderState.theme.axisColor || 'rgba(127, 69, 242, 0.36)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, frame.top);
  ctx.lineTo(x, frame.bottom);
  ctx.stroke();
  ctx.restore();

  const lines = [`${formatTimeLabel(pointTime)}`];

  renderState.seriesData.forEach((series) => {
    const value = Number(series.values[hoverIndex]);
    if (!Number.isFinite(value)) {
      return;
    }
    const normalized = (value - range.min) / (range.max - range.min || 1);
    const y = frame.bottom - normalized * (frame.bottom - frame.top);
    ctx.beginPath();
    ctx.fillStyle = series.color;
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.stroke();

    lines.push(`${series.label || series.key}: ${formatMetricLabel(value)}`);
  });

  const tooltip = ensureTooltip(canvas);
  if (!tooltip) {
    return;
  }

  const host = canvas.parentElement;
  tooltip.innerHTML = lines.join('<br>');
  tooltip.style.display = 'block';

  const hostRect = host.getBoundingClientRect();
  const tooltipWidth = tooltip.offsetWidth || 120;
  const tooltipHeight = tooltip.offsetHeight || 48;
  const desiredLeft = x + 12;
  const desiredTop = (renderState.hoverY || frame.top) - tooltipHeight - 12;
  const maxLeft = Math.max(8, hostRect.width - tooltipWidth - 8);
  const maxTop = Math.max(8, hostRect.height - tooltipHeight - 8);

  tooltip.style.left = `${clamp(desiredLeft, 8, maxLeft)}px`;
  tooltip.style.top = `${clamp(desiredTop, 8, maxTop)}px`;
}

function renderChartCanvas(canvas) {
  const renderState = canvas.__chartRenderState;
  if (!renderState) {
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const width = renderState.width;
  const height = renderState.height;

  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);

  const frame = drawAxes(ctx, width, height, renderState.theme);
  const visibleWindow = getVisibleWindow(renderState.timeLabels, renderState.viewport);
  const range = findMinMax(renderState.seriesData);

  renderState.seriesData.forEach((series) => {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = series.color;
    ctx.lineWidth = 5;
    drawSeriesPathNew(ctx, renderState.timeLabels, series, visibleWindow, range, frame);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = series.color;
    ctx.lineWidth = 2.4;
    drawSeriesPathNew(ctx, renderState.timeLabels, series, visibleWindow, range, frame);
    ctx.stroke();

    drawSeriesHighlightSegments(ctx, renderState, series, visibleWindow, range, frame);
  });

  drawStartValueLabels(ctx, renderState, frame, visibleWindow, range);
  drawTtkMarker(ctx, renderState, frame, visibleWindow);

  const middleValue = range.min + (range.max - range.min) / 2;
  ctx.font = '12px Arial';
  ctx.fillStyle = renderState.theme.tickAccentColor || renderState.theme.textColor;
  ctx.fillText(formatMetricLabel(range.max), 8, frame.top + 4);
  ctx.fillStyle = renderState.theme.tickColor || renderState.theme.textColor;
  ctx.fillText(formatMetricLabel(middleValue), 8, frame.top + (frame.bottom - frame.top) / 2 + 4);
  ctx.fillText(formatMetricLabel(range.min), 8, frame.bottom + 4);
  ctx.fillText(formatTimeLabel(visibleWindow.startTime), frame.left - 6, height - 10);
  ctx.fillText(formatTimeLabel(visibleWindow.endTime), frame.right - 32, height - 10);

  drawHoverLayer(ctx, canvas, renderState, frame, visibleWindow, range);
}

function bindChartEvents(canvas) {
  if (canvas.__chartEventsBound) {
    return;
  }

  canvas.addEventListener('pointermove', (event) => {
    const renderState = canvas.__chartRenderState;
    if (!renderState) {
      return;
    }

    const width = renderState.width;
    const height = renderState.height;
    const frame = { left: 56, right: width - 18, top: 24, bottom: height - 34 };
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x < frame.left || x > frame.right || y < frame.top || y > frame.bottom) {
      if (renderState.hoverIndex !== null) {
        renderState.hoverIndex = null;
        renderChartCanvas(canvas);
      }
      return;
    }

    const visibleWindow = getVisibleWindow(renderState.timeLabels, renderState.viewport);
    const ratio = clamp((x - frame.left) / Math.max(1, frame.right - frame.left), 0, 1);
    const targetTime = visibleWindow.startTime + visibleWindow.span * ratio;

    let nearestIndex = visibleWindow.startIndex;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (let index = visibleWindow.startIndex; index <= visibleWindow.endIndex; index += 1) {
      const distance = Math.abs(getTimeValueAt(renderState.timeLabels, index) - targetTime);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    if (renderState.hoverIndex !== nearestIndex || Math.abs((renderState.hoverY || 0) - y) > 0.5) {
      renderState.hoverIndex = nearestIndex;
      renderState.hoverY = y;
      renderChartCanvas(canvas);
    }
  });

  canvas.addEventListener('pointerleave', () => {
    const renderState = canvas.__chartRenderState;
    if (!renderState || renderState.hoverIndex === null) {
      return;
    }
    renderState.hoverIndex = null;
    renderChartCanvas(canvas);
  });

  canvas.__chartEventsBound = true;
}

function renderChart(canvasId, chart, width, height, theme, viewport) {
  if (!chart || (!chart.series && !chart.datasets)) {
    return;
  }
  
  // 兼容两种数据格式
  let seriesData;
  let timeLabels;
  
  if (chart.datasets) {
    // 新格式：{labels: [], datasets: [{label, data, borderColor, backgroundColor}]}
    seriesData = chart.datasets.map((dataset, index) => ({
      key: dataset.label || `series-${index}`,
      label: dataset.label,
      color: dataset.borderColor || dataset.color || '#6366f1',
      values: dataset.data || [],
    }));
    timeLabels = chart.labels || [];
  } else {
    // 原格式：{series: [{key, label, color, values}], timeSec: []}
    seriesData = chart.series || [];
    timeLabels = chart.timeSec || [];
  }
  
  if (!seriesData.length || !timeLabels.length) {
    return;
  }

  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    return;
  }

  canvas.__chartRenderState = {
    width,
    height,
    theme,
    viewport,
    timeLabels,
    seriesData,
    highlightMasks: chart.highlightMasks || {},
    highlightColor: chart.highlightColor || '#ff2b2b',
    hoverIndex: null,
    hoverY: null,
  };

  bindChartEvents(canvas);
  renderChartCanvas(canvas);
}

function drawSeriesPathNew(ctx, timeLabels, series, visibleWindow, range, frame) {
  ctx.beginPath();
  series.values.forEach((value, index) => {
    if (index < visibleWindow.startIndex || index > visibleWindow.endIndex) {
      return;
    }
    
    // 将标签转换为时间值
    const timeValue = getTimeValueAt(timeLabels, index);
    
    const clampedTime = clamp(timeValue, visibleWindow.startTime, visibleWindow.endTime);
    const x = frame.left + (frame.right - frame.left) * ((clampedTime - visibleWindow.startTime) / visibleWindow.span);
    const normalized = (value - range.min) / (range.max - range.min || 1);
    const y = frame.bottom - normalized * (frame.bottom - frame.top);
    
    if (index === visibleWindow.startIndex) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
}
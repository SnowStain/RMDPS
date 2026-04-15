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
  
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  // 清除画布
  ctx.clearRect(0, 0, width, height);

  // 绘制坐标轴
  const frame = drawAxes(ctx, width, height, theme);
  
  // 获取可见窗口
  const visibleWindow = getVisibleWindow(timeLabels, viewport);
  
  // 计算数据范围
  const range = findMinMax(seriesData);

  // 绘制数据系列
  seriesData.forEach((series) => {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = series.color;
    ctx.lineWidth = 5;
    drawSeriesPathNew(ctx, timeLabels, series, visibleWindow, range, frame);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = series.color;
    ctx.lineWidth = 2.4;
    drawSeriesPathNew(ctx, timeLabels, series, visibleWindow, range, frame);
    ctx.stroke();
  });

  // 绘制刻度标签
  const middleValue = range.min + (range.max - range.min) / 2;
  ctx.font = '12px Arial';
  ctx.fillStyle = theme.tickAccentColor || theme.textColor;
  ctx.fillText(formatMetricLabel(range.max), 8, frame.top + 4);
  ctx.fillStyle = theme.tickColor || theme.textColor;
  ctx.fillText(formatMetricLabel(middleValue), 8, frame.top + (frame.bottom - frame.top) / 2 + 4);
  ctx.fillText(formatMetricLabel(range.min), 8, frame.bottom + 4);
  ctx.fillText(formatTimeLabel(visibleWindow.startTime), frame.left - 6, height - 10);
  ctx.fillText(formatTimeLabel(visibleWindow.endTime), frame.right - 32, height - 10);
}

function drawSeriesPathNew(ctx, timeLabels, series, visibleWindow, range, frame) {
  ctx.beginPath();
  series.values.forEach((value, index) => {
    if (index < visibleWindow.startIndex || index > visibleWindow.endIndex) {
      return;
    }
    
    // 将标签转换为时间值
    let timeValue;
    if (typeof timeLabels[index] === 'string') {
      timeValue = parseFloat(timeLabels[index].replace('s', '')) || index * 10;
    } else {
      timeValue = timeLabels[index] || index * 10;
    }
    
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
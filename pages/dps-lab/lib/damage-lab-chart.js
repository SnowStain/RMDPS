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

  ctx.setStrokeStyle(theme.gridColor);
  ctx.setLineWidth(1);
  for (let row = 0; row < 4; row += 1) {
    const y = top + (bottom - top) * row / 3;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  ctx.setStrokeStyle(theme.axisColor);
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();

  return { left, right, top, bottom };
}

function renderChart(canvasId, chart, width, height, theme, viewport) {
  if (!chart || !chart.series || !chart.series.length || !chart.timeSec || !chart.timeSec.length) {
    return;
  }

  const ctx = wx.createCanvasContext(canvasId);
  if (theme.canvasBg && theme.canvasBg !== 'transparent' && theme.canvasBg !== 'rgba(0,0,0,0)') {
    ctx.setFillStyle(theme.canvasBg);
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  const frame = drawAxes(ctx, width, height, theme);
  const visibleWindow = getVisibleWindow(chart.timeSec, viewport);
  const visibleSeries = chart.series.map((series) => ({
    key: series.key,
    label: series.label,
    color: series.color,
    values: series.values.slice(visibleWindow.startIndex, visibleWindow.endIndex + 1),
  }));
  const range = findMinMax(visibleSeries);

  chart.series.forEach((series) => {
    ctx.beginPath();
    ctx.setStrokeStyle(series.color);
    ctx.setLineWidth(2);
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
    ctx.stroke();
  });

  ctx.setFillStyle(theme.textColor);
  ctx.setFontSize(12);
  ctx.fillText(String(range.max.toFixed(0)), 8, frame.top + 4);
  ctx.fillText(String(range.min.toFixed(0)), 8, frame.bottom + 4);
  ctx.fillText(formatTimeLabel(visibleWindow.startTime), frame.left - 6, height - 10);
  ctx.fillText(formatTimeLabel(visibleWindow.endTime), frame.right - 32, height - 10);

  ctx.draw();
}

module.exports = {
  renderChart,
};
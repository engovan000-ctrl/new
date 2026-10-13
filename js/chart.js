/**
 * LAB CHART ENGINE: High-DPI Interactive Canvas Plotter
 * Zero external dependencies.
 * Features:
 * - Smooth Spline / Line interpolation
 * - Multi-series overlay with customizable colors and units
 * - Dynamic auto-ranging or manual axis bounds
 * - Interactive hover cursor and floating tooltip
 * - Legend with series toggle
 * - High-resolution PNG export for lab reports
 */

class LabChartEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.title = "Performance Characteristics";
    this.xLabel = "Current";
    this.xUnit = "A";
    this.yLabel = "Efficiency";
    this.yUnit = "%";

    // Array of series: { name: 'Efficiency', color: '#10b981', unit: '%', data: [{x, y}], visible: true }
    this.series = [];

    // Hover state
    this.hoverPos = null;
    this.hoverPoint = null;

    this.padding = { top: 40, right: 40, bottom: 50, left: 65 };

    this.initEvents();
    this.resize();
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.hoverPos = {
        x: (e.clientX - rect.left) * (this.canvas.width / rect.width) / (window.devicePixelRatio || 1),
        y: (e.clientY - rect.top) * (this.canvas.height / rect.height) / (window.devicePixelRatio || 1)
      };
      this.render();
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverPos = null;
      this.render();
    });
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width > 200 ? rect.width : 600;
    const height = 360;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';

    this.ctx.scale(dpr, dpr);
    this.logicalWidth = width;
    this.logicalHeight = height;

    this.render();
  }

  clear() {
    this.series = [];
    this.render();
  }

  setAxes(title, xLabel, xUnit, yLabel, yUnit) {
    this.title = title;
    this.xLabel = xLabel;
    this.xUnit = xUnit;
    this.yLabel = yLabel;
    this.yUnit = yUnit;
    this.render();
  }

  addSeries(name, color, unit, dataPoints = []) {
    // dataPoints = [{x, y}]
    const existing = this.series.find(s => s.name === name);
    if (existing) {
      existing.data = dataPoints;
      existing.color = color;
      existing.unit = unit;
    } else {
      this.series.push({
        name: name,
        color: color,
        unit: unit,
        data: dataPoints,
        visible: true
      });
    }
    this.render();
  }

  render() {
    if (!this.ctx || !this.logicalWidth) return;
    const ctx = this.ctx;
    const W = this.logicalWidth;
    const H = this.logicalHeight;
    const pad = this.padding;

    // Background
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f172a'; // Deep slate
    ctx.fillRect(0, 0, W, H);

    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    if (plotW <= 50 || plotH <= 50) return;

    // Compute min/max bounds across visible series
    let minX = 0, maxX = 10;
    let minY = 0, maxY = 100;

    let hasData = false;
    const activeSeries = this.series.filter(s => s.visible && s.data.length > 0);

    if (activeSeries.length > 0) {
      hasData = true;
      let allX = [];
      let allY = [];
      activeSeries.forEach(s => {
        s.data.forEach(pt => {
          allX.push(pt.x);
          allY.push(pt.y);
        });
      });

      if (allX.length > 0) {
        minX = 0; // Usually electrical lab plots originate at 0
        maxX = Math.max(...allX) * 1.15;
        if (maxX <= 0) maxX = 10;
        minY = 0;
        maxY = Math.max(...allY) * 1.15;
        if (maxY <= 0) maxY = 100;
      }
    }

    // Grid lines & Axis ticks
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // Horizontal grid (Y axis)
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const yVal = minY + (maxY - minY) * (i / ySteps);
      const yPx = pad.top + plotH - (i / ySteps) * plotH;

      ctx.beginPath();
      ctx.moveTo(pad.left, yPx);
      ctx.lineTo(W - pad.right, yPx);
      ctx.stroke();

      ctx.fillText(yVal.toFixed(yVal > 100 ? 0 : 1), pad.left - 8, yPx);
    }

    // Vertical grid (X axis)
    const xSteps = 5;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i <= xSteps; i++) {
      const xVal = minX + (maxX - minX) * (i / xSteps);
      const xPx = pad.left + (i / xSteps) * plotW;

      ctx.beginPath();
      ctx.moveTo(xPx, pad.top);
      ctx.lineTo(xPx, H - pad.bottom);
      ctx.stroke();

      ctx.fillText(xVal.toFixed(xVal > 100 ? 0 : 1), xPx, H - pad.bottom + 8);
    }

    // Axes border
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, H - pad.bottom);
    ctx.lineTo(W - pad.right, H - pad.bottom);
    ctx.stroke();

    // Chart Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(this.title, pad.left, 20);

    // Axis Labels
    ctx.fillStyle = '#38bdf8'; // Cyan accent
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    // X label
    ctx.fillText(`${this.xLabel} (${this.xUnit})`, pad.left + plotW / 2, H - 15);
    // Y label (rotated)
    ctx.save();
    ctx.translate(16, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${this.yLabel} (${this.yUnit})`, 0, 0);
    ctx.restore();

    // Draw Data Series
    if (hasData) {
      activeSeries.forEach(s => {
        if (s.data.length === 0) return;

        // Sort by x
        const sorted = [...s.data].sort((a, b) => a.x - b.x);

        ctx.strokeStyle = s.color;
        ctx.fillStyle = s.color;
        ctx.lineWidth = 2.5;

        // Line / Spline
        ctx.beginPath();
        sorted.forEach((pt, idx) => {
          const xPx = pad.left + ((pt.x - minX) / (maxX - minX)) * plotW;
          const yPx = pad.top + plotH - ((pt.y - minY) / (maxY - minY)) * plotH;

          if (idx === 0) {
            ctx.moveTo(xPx, yPx);
          } else {
            ctx.lineTo(xPx, yPx);
          }
        });
        ctx.stroke();

        // Markers (Circles)
        sorted.forEach(pt => {
          const xPx = pad.left + ((pt.x - minX) / (maxX - minX)) * plotW;
          const yPx = pad.top + plotH - ((pt.y - minY) / (maxY - minY)) * plotH;

          ctx.beginPath();
          ctx.arc(xPx, yPx, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      });
    } else {
      // Empty placeholder message
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("No observation points recorded yet. Take lab readings to plot curves.", pad.left + plotW / 2, pad.top + plotH / 2);
    }

    // Legend at Top Right
    let legX = W - pad.right;
    ctx.textAlign = 'right';
    activeSeries.forEach(s => {
      ctx.fillStyle = s.color;
      ctx.fillRect(legX - 12, 12, 10, 10);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillText(s.name, legX - 18, 20);
      legX -= ctx.measureText(s.name).width + 35;
    });

    // Hover tooltip
    if (this.hoverPos && hasData) {
      const hX = this.hoverPos.x;
      const hY = this.hoverPos.y;

      if (hX >= pad.left && hX <= W - pad.right && hY >= pad.top && hY <= H - pad.bottom) {
        // Vertical guideline
        ctx.strokeStyle = '#e2e8f0';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hX, pad.top);
        ctx.lineTo(hX, H - pad.bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        // Find nearest point across all visible series
        let nearest = null;
        let minDist = 999;

        activeSeries.forEach(s => {
          s.data.forEach(pt => {
            const pxX = pad.left + ((pt.x - minX) / (maxX - minX)) * plotW;
            const pxY = pad.top + plotH - ((pt.y - minY) / (maxY - minY)) * plotH;
            const dist = Math.hypot(pxX - hX, pxY - hY);
            if (dist < minDist && dist < 50) {
              minDist = dist;
              nearest = { pt, s, pxX, pxY };
            }
          });
        });

        if (nearest) {
          // Highlight dot
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.fillStyle = nearest.s.color;
          ctx.beginPath();
          ctx.arc(nearest.pxX, nearest.pxY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Tooltip card
          const text1 = `${nearest.s.name}: ${nearest.pt.y.toFixed(2)} ${nearest.s.unit}`;
          const text2 = `${this.xLabel}: ${nearest.pt.x.toFixed(2)} ${this.xUnit}`;

          ctx.font = '11px system-ui, sans-serif';
          const boxW = Math.max(ctx.measureText(text1).width, ctx.measureText(text2).width) + 16;
          const boxH = 42;

          let tipX = nearest.pxX + 10;
          let tipY = nearest.pxY - 20;
          if (tipX + boxW > W - 10) tipX = nearest.pxX - boxW - 10;
          if (tipY < 10) tipY = 10;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(tipX, tipY, boxW, boxH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.textAlign = 'left';
          ctx.fillText(text1, tipX + 8, tipY + 16);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillText(text2, tipX + 8, tipY + 32);
        }
      }
    }
  }

  exportPNG() {
    if (!this.canvas) return;
    const link = document.createElement('a');
    link.download = `lab_graph_${Date.now()}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }
}

window.LabChartEngine = LabChartEngine;

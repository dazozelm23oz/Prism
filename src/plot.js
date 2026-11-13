/**
 * Canvas Plotter: Hi-DPI adaptive grid, axes, multi-curve renderer, pan/zoom,
 * trace mode with nearest curve readout, critical point labels.
 */

export class CanvasPlotter {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.viewport = {
      x_min: -8.0,
      x_max: 8.0,
      y_min: -6.0,
      y_max: 6.0,
      width_px: 800,
      height_px: 600,
    };

    this.aspectLocked = false;
    this.traceMode = false;
    this.curves = []; // array of { id, color, visible, segments, critical_points, expr }
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.hoverPoint = null;
    this.themeTokens = {
      bg: "#1e1e2e",
      grid: "rgba(255, 255, 255, 0.08)",
      axis: "rgba(255, 255, 255, 0.35)",
      text: "rgba(255, 255, 255, 0.7)",
      accent: "#89b4fa",
    };

    this.onViewportChange = null;

    this.initEvents();
    this.resize();
  }

  setTheme(tokens) {
    this.themeTokens = { ...this.themeTokens, ...tokens };
    this.render();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(100, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(100, Math.floor(rect.height * dpr));
    this.viewport.width_px = rect.width;
    this.viewport.height_px = rect.height;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
    this.render();
  }

  initEvents() {
    window.addEventListener("resize", () => this.resize());

    // Pan
    this.canvas.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.dragStart = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener("mousemove", (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        this.dragStart = { x: e.clientX, y: e.clientY };

        const worldDx = dx * (this.viewport.x_max - this.viewport.x_min) / this.viewport.width_px;
        const worldDy = dy * (this.viewport.y_max - this.viewport.y_min) / this.viewport.height_px;

        this.viewport.x_min -= worldDx;
        this.viewport.x_max -= worldDx;
        this.viewport.y_min += worldDy;
        this.viewport.y_max += worldDy;

        this.render();
        if (this.onViewportChange) this.onViewportChange(this.viewport);
      } else {
        this.handleHover(e);
      }
    });

    window.addEventListener("mouseup", () => {
      this.isDragging = false;
    });

    // Zoom
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const cursorWorldX = this.toWorldX(mouseX);
      const cursorWorldY = this.toWorldY(mouseY);

      const zoomFactor = e.deltaY < 0 ? 0.85 : 1.18;

      this.viewport.x_min = cursorWorldX + (this.viewport.x_min - cursorWorldX) * zoomFactor;
      this.viewport.x_max = cursorWorldX + (this.viewport.x_max - cursorWorldX) * zoomFactor;
      this.viewport.y_min = cursorWorldY + (this.viewport.y_min - cursorWorldY) * zoomFactor;
      this.viewport.y_max = cursorWorldY + (this.viewport.y_max - cursorWorldY) * zoomFactor;

      if (this.aspectLocked) {
        this.enforceAspectRatio();
      }

      this.render();
      if (this.onViewportChange) this.onViewportChange(this.viewport);
    });
  }

  handleHover(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = this.toWorldX(mouseX);
    const worldY = this.toWorldY(mouseY);

    let closest = null;
    let minDistance = 25; // px

    for (const curve of this.curves) {
      if (!curve.visible) continue;
      // Check critical points first
      if (curve.critical_points) {
        for (const cp of curve.critical_points) {
          const cpPxX = this.toScreenX(cp.x);
          const cpPxY = this.toScreenY(cp.y);
          const d = Math.hypot(mouseX - cpPxX, mouseY - cpPxY);
          if (d < minDistance) {
            minDistance = d;
            closest = {
              x: cp.x,
              y: cp.y,
              color: curve.color,
              label: `${cp.kind}: (${cp.x.toFixed(2)}, ${cp.y.toFixed(2)})`,
              isCritical: true,
            };
          }
        }
      }

      // Check curve segments
      if (!closest && curve.segments) {
        for (const seg of curve.segments) {
          for (let i = 0; i < seg.length; i++) {
            const p = seg[i];
            const px = this.toScreenX(p[0]);
            const py = this.toScreenY(p[1]);
            const d = Math.hypot(mouseX - px, mouseY - py);
            if (d < minDistance) {
              minDistance = d;
              closest = {
                x: p[0],
                y: p[1],
                color: curve.color,
                label: `(${p[0].toFixed(2)}, ${p[1].toFixed(2)})`,
                isCritical: false,
              };
            }
          }
        }
      }
    }

    this.hoverPoint = closest;
    this.render();
  }

  enforceAspectRatio() {
    const widthSpan = this.viewport.x_max - this.viewport.x_min;
    const heightSpan = widthSpan * (this.viewport.height_px / this.viewport.width_px);
    const midY = (this.viewport.y_min + this.viewport.y_max) / 2;
    this.viewport.y_min = midY - heightSpan / 2;
    this.viewport.y_max = midY + heightSpan / 2;
  }

  toScreenX(worldX) {
    return ((worldX - this.viewport.x_min) / (this.viewport.x_max - this.viewport.x_min)) * this.viewport.width_px;
  }

  toScreenY(worldY) {
    return (1.0 - (worldY - this.viewport.y_min) / (this.viewport.y_max - this.viewport.y_min)) * this.viewport.height_px;
  }

  toWorldX(screenX) {
    return this.viewport.x_min + (screenX / this.viewport.width_px) * (this.viewport.x_max - this.viewport.x_min);
  }

  toWorldY(screenY) {
    return this.viewport.y_min + (1.0 - screenY / this.viewport.height_px) * (this.viewport.y_max - this.viewport.y_min);
  }

  setCurves(curves) {
    this.curves = curves;
    this.render();
  }

  render() {
    const ctx = this.ctx;
    const w = this.viewport.width_px;
    const h = this.viewport.height_px;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Grid
    this.drawAdaptiveGrid(ctx, w, h);

    // 2. Draw Axes
    this.drawAxes(ctx, w, h);

    // 3. Draw Curves
    for (const curve of this.curves) {
      if (!curve.visible || !curve.segments) continue;

      ctx.save();
      ctx.strokeStyle = curve.color || this.themeTokens.accent;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (const seg of curve.segments) {
        if (seg.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(this.toScreenX(seg[0][0]), this.toScreenY(seg[0][1]));
        for (let i = 1; i < seg.length; i++) {
          ctx.lineTo(this.toScreenX(seg[i][0]), this.toScreenY(seg[i][1]));
        }
        ctx.stroke();
      }

      // 4. Draw Critical Points
      if (curve.critical_points) {
        for (const cp of curve.critical_points) {
          const cx = this.toScreenX(cp.x);
          const cy = this.toScreenY(cp.y);

          // Dot
          ctx.beginPath();
          ctx.arc(cx, cy, 5, 0, Math.PI * 2);
          ctx.fillStyle = curve.color || this.themeTokens.accent;
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Label
          ctx.font = "bold 11px system-ui, sans-serif";
          ctx.fillStyle = this.themeTokens.text;
          ctx.fillText(`${cp.kind}`, cx + 8, cy - 6);
        }
      }

      ctx.restore();
    }

    // 5. Draw Hover/Trace Tooltip
    if (this.hoverPoint) {
      const hx = this.toScreenX(this.hoverPoint.x);
      const hy = this.toScreenY(this.hoverPoint.y);

      ctx.save();
      ctx.beginPath();
      ctx.arc(hx, hy, 6, 0, Math.PI * 2);
      ctx.fillStyle = this.hoverPoint.color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tooltip pill
      ctx.font = "12px system-ui, sans-serif";
      const text = this.hoverPoint.label;
      const textWidth = ctx.measureText(text).width;
      const pillW = textWidth + 14;
      const pillH = 24;
      const pillX = Math.min(w - pillW - 10, Math.max(10, hx + 10));
      const pillY = Math.min(h - pillH - 10, Math.max(10, hy - 30));

      ctx.fillStyle = "rgba(15, 17, 23, 0.88)";
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.fillText(text, pillX + 7, pillY + 16);
      ctx.restore();
    }
  }

  drawAdaptiveGrid(ctx, w, h) {
    const xSpan = this.viewport.x_max - this.viewport.x_min;
    const ySpan = this.viewport.y_max - this.viewport.y_min;

    const xStep = this.calculateStep(xSpan, w / 70);
    const yStep = this.calculateStep(ySpan, h / 70);

    ctx.save();
    ctx.strokeStyle = this.themeTokens.grid;
    ctx.lineWidth = 1;

    // Vertical grid lines
    const firstX = Math.floor(this.viewport.x_min / xStep) * xStep;
    for (let x = firstX; x <= this.viewport.x_max; x += xStep) {
      const sx = this.toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
    }

    // Horizontal grid lines
    const firstY = Math.floor(this.viewport.y_min / yStep) * yStep;
    for (let y = firstY; y <= this.viewport.y_max; y += yStep) {
      const sy = this.toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawAxes(ctx, w, h) {
    const xZero = this.toScreenX(0);
    const yZero = this.toScreenY(0);

    ctx.save();
    ctx.strokeStyle = this.themeTokens.axis;
    ctx.lineWidth = 1.5;

    // Y Axis (x = 0)
    if (xZero >= 0 && xZero <= w) {
      ctx.beginPath();
      ctx.moveTo(xZero, 0);
      ctx.lineTo(xZero, h);
      ctx.stroke();
    }

    // X Axis (y = 0)
    if (yZero >= 0 && yZero <= h) {
      ctx.beginPath();
      ctx.moveTo(0, yZero);
      ctx.lineTo(w, yZero);
      ctx.stroke();
    }

    // Numbers on axes
    ctx.font = "10px system-ui, sans-serif";
    ctx.fillStyle = this.themeTokens.text;

    const xSpan = this.viewport.x_max - this.viewport.x_min;
    const xStep = this.calculateStep(xSpan, w / 70);
    const firstX = Math.floor(this.viewport.x_min / xStep) * xStep;

    const labelY = Math.min(h - 10, Math.max(20, yZero + 14));
    for (let x = firstX; x <= this.viewport.x_max; x += xStep) {
      if (Math.abs(x) < 1e-9) continue;
      const sx = this.toScreenX(x);
      ctx.fillText(x.toFixed(xStep < 1 ? 1 : 0), sx - 6, labelY);
    }

    const ySpan = this.viewport.y_max - this.viewport.y_min;
    const yStep = this.calculateStep(ySpan, h / 70);
    const firstY = Math.floor(this.viewport.y_min / yStep) * yStep;

    const labelX = Math.min(w - 30, Math.max(10, xZero + 6));
    for (let y = firstY; y <= this.viewport.y_max; y += yStep) {
      if (Math.abs(y) < 1e-9) continue;
      const sy = this.toScreenY(y);
      ctx.fillText(y.toFixed(yStep < 1 ? 1 : 0), labelX, sy + 3);
    }

    ctx.restore();
  }

  calculateStep(span, targetDivisions) {
    const rawStep = span / targetDivisions;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const residual = rawStep / magnitude;

    if (residual < 1.5) return 1 * magnitude;
    if (residual < 3.5) return 2 * magnitude;
    if (residual < 7.5) return 5 * magnitude;
    return 10 * magnitude;
  }

  exportPNG() {
    return this.canvas.toDataURL("image/png");
  }
}

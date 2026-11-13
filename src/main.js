/**
 * Prism: Native Linux/KDE Desktop Graphing Calculator & CAS Workspace
 * App bootstrap, tab switching, expression list, parameter sliders,
 * canvas plotting, equation solver, calculus, matrices, and settings.
 */

import { INSERTABLES, PalettePopup, InlineAutocomplete, initQuickChips, setActiveMathField } from "./palette.js";
import { createMathField, getLatex, setLatex, onInput } from "./mathfield.js";
import { CanvasPlotter } from "./plot.js";
import { StepCardRenderer } from "./solver.js";
import { MatrixWorkspace } from "./matrix.js";
import { OptimWorkspace } from "./optim.js";
import { SettingsManager, THEMES } from "./settings.js";

// Palette colors for curves
const CURVE_COLORS = [
  "#88c0d0", // Cyan / Accent
  "#bf616a", // Red
  "#a3be8c", // Green
  "#ebcb8b", // Yellow
  "#b48ead", // Purple
  "#d08770", // Orange
  "#5e81ac", // Blue
];

class PrismApp {
  constructor() {
    this.expressions = [];
    this.parameters = {}; // e.g. { k: 2, a: -1.5 }
    this.nextId = 1;

    this.palette = new PalettePopup();
    this.autocomplete = new InlineAutocomplete();
    this.plotter = null;
    this.solveRenderer = null;
    this.calcRenderer = null;
    this.matrixWorkspace = null;
    this.optimWorkspace = null;
    this.settingsManager = null;

    this.activeTab = "tab-graph";
    this.invoke = window.__TAURI__ ? window.__TAURI__.core.invoke : this.mockInvoke.bind(this);

    this.init();
  }

  async init() {
    this.initWindowControls();
    this.initTabs();
    this.initPlotter();
    this.initQuickChipsBar();
    this.initSolvers();
    this.initSettings();
    this.initKeyboardShortcuts();

    // Default initial expressions
    this.addExpression("x^3 - 3x", "#88c0d0");
    this.addExpression("k = 2", "#ebcb8b");

    this.recomputeAll();
  }

  // Tauri IPC Fallback for standalone browser testing / preview
  async mockInvoke(cmd, args) {
    console.log(`[IPC Invoke: ${cmd}]`, args);
    if (cmd === "evaluate") {
      return args.expr;
    }
    if (cmd === "sample") {
      const xMin = args.viewport.x_min;
      const xMax = args.viewport.x_max;
      const step = (xMax - xMin) / 200;
      const pts = [];
      const k = (args.params && args.params.k !== undefined) ? args.params.k : 2.0;

      for (let x = xMin; x <= xMax; x += step) {
        let y = 0;
        if (args.expr.includes("x^3-3x") || args.expr.includes("x^3 - 3x")) {
          y = x * x * x - 3 * x;
        } else if (args.expr.includes("kx+1") || args.expr.includes("k x + 1") || args.expr.includes("k*x + 1")) {
          y = k * x + 1;
        } else if (args.expr.includes("x^2") || args.expr.includes("x^{2}")) {
          y = x * x;
        } else {
          y = x;
        }
        pts.push([x, y]);
      }
      return {
        expression: args.expr,
        segments: [pts],
        critical_points: [
          { x: -1.0, y: 2.0, kind: "local max", test_explanation: "f''(-1) < 0" },
          { x: 1.0, y: -2.0, kind: "local min", test_explanation: "f''(1) > 0" },
        ],
      };
    }
    if (cmd === "solve") {
      return [
        {
          method_id: "factoring",
          method_name: "Factoring Method",
          steps: [
            { title: "Standard Form", detail: "ax^2 + bx + c = 0", latex_before: args.eq, latex_after: "(2x - 1)(x - 2) = 0", rule_applied: "Factoring" },
            { title: "Zero Product Property", detail: "Solve each factor", latex_before: "(2x - 1)(x - 2) = 0", latex_after: "x = 0.5, \\quad x = 2", rule_applied: "Zero Product" },
          ],
          result_latex: "x = 0.5, \\quad x = 2",
          is_primary: true,
        },
        {
          method_id: "completing_the_square",
          method_name: "Completing the Square",
          steps: [
            { title: "Divide by Leading Coeff", detail: "Divide by 2", latex_before: args.eq, latex_after: "x^2 - 2.5x + 1 = 0", rule_applied: "Normalization" },
            { title: "Perfect Square", detail: "Add (b/2a)^2 to both sides", latex_before: "x^2 - 2.5x = -1", latex_after: "(x - 1.25)^2 = 0.5625", rule_applied: "Complete Square" },
          ],
          result_latex: "x = 0.5, \\quad x = 2",
          is_primary: false,
        },
        {
          method_id: "quadratic_formula",
          method_name: "Quadratic Formula",
          steps: [
            { title: "Discriminant", detail: "b^2 - 4ac = 9", latex_before: "\\Delta = b^2 - 4ac", latex_after: "\\Delta = 9", rule_applied: "Discriminant" },
            { title: "Apply Formula", detail: "x = (-b ± √Δ) / 2a", latex_before: "x = \\frac{5 \\pm 3}{4}", latex_after: "x = 0.5, \\quad x = 2", rule_applied: "Quadratic Formula" },
          ],
          result_latex: "x = 0.5, \\quad x = 2",
          is_primary: false,
        },
      ];
    }
    if (cmd === "calculus_diff") {
      return {
        method_id: "diff",
        method_name: "Differentiation Rules",
        steps: [
          { title: "Power Rule", detail: "d/dx(x^3) = 3x^2, d/dx(-3x) = -3", latex_before: args.expr, latex_after: "3x^2 - 3", rule_applied: "Power & Sum Rule" },
        ],
        result_latex: "f'(x) = 3x^2 - 3",
        is_primary: true,
      };
    }
    if (cmd === "calculus_integrate") {
      return {
        chosen_method: "Integration by Parts (LIATE)",
        paths: [
          {
            method_id: "ibp_liate",
            method_name: "Integration by Parts (LIATE)",
            steps: [
              { title: "LIATE Assessment", detail: "u = x, dv = e^x dx", latex_before: "\\int x e^x dx", latex_after: "u = x, \\, dv = e^x dx", rule_applied: "LIATE" },
              { title: "Parts Formula", detail: "uv - ∫ v du", latex_before: "\\int x e^x dx", latex_after: "x e^x - e^x + C", rule_applied: "IBP" },
            ],
            result_latex: "x e^x - e^x + C",
            is_primary: true,
          },
          {
            method_id: "tabular_di",
            method_name: "Tabular / DI Method",
            steps: [
              { title: "DI Table", detail: "Repeated differentiation and integration", latex_before: "D: x \\to 1 \\to 0", latex_after: "I: e^x \\to e^x \\to e^x", rule_applied: "DI" },
            ],
            result_latex: "x e^x - e^x + C",
            is_primary: false,
          },
        ],
      };
    }
    if (cmd === "matrix_solve") {
      return {
        solve_path: {
          method_id: "gep",
          method_name: "Gaussian Elimination",
          steps: [
            { title: "Initial System", detail: "Augmented matrix", latex_before: "\\begin{pmatrix}2 & 1 & -1 \\end{pmatrix}", latex_after: "\\begin{pmatrix}2 & 1 & -1 \\end{pmatrix}", rule_applied: "Setup" },
            { title: "Row Operation R2 <- R2 - (-1.5)R1", detail: "Elimination", latex_before: "A", latex_after: "A'", rule_applied: "Elimination" },
          ],
          result_latex: "x_1 = 2, \\quad x_2 = 3, \\quad x_3 = -1",
          is_primary: true,
        },
        determinant: 8.0,
        rank: 3,
        nullity: 0,
        final_matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      };
    }
    if (cmd === "matrix_invert") {
      return {
        solve_path: {
          method_id: "inv",
          method_name: "Gauss-Jordan Inverse",
          steps: [{ title: "Inverse", detail: "Inverted", latex_before: "A", latex_after: "A^{-1}", rule_applied: "Invert" }],
          result_latex: "A^{-1}",
          is_primary: true,
        },
        determinant: 1.0,
        rank: 3,
        nullity: 0,
        final_matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      };
    }
    if (cmd === "optim_lagrange") {
      return {
        lagrangian_latex: "\\mathcal{L}(x, y, \\lambda) = x^2 + y^2 - \\lambda(x + y - 1)",
        stationarity_equations: ["2x - \\lambda = 0", "2y - \\lambda = 0", "-(x + y - 1) = 0"],
        solutions: [{ x: "0.5", y: "0.5", lambda_1: "1.0" }],
        classification: "Local Minimum (Hessian positive definite)",
        solve_path: {
          method_id: "lagrange",
          method_name: "Lagrange Multipliers",
          steps: [
            { title: "Formulate Lagrangian", detail: "L = f - λg", latex_before: "f, g", latex_after: "\\mathcal{L}", rule_applied: "Lagrangian" },
            { title: "Stationarity System", detail: "∇L = 0", latex_before: "\\mathcal{L}", latex_after: "\\nabla \\mathcal{L} = \\mathbf{0}", rule_applied: "Stationarity" },
            { title: "Hessian Classification", detail: "Hessian eigenvalues > 0", latex_before: "\\mathcal{H}", latex_after: "\\text{Local Minimum}", rule_applied: "Hessian" },
          ],
          result_latex: "x = 0.5, \\quad y = 0.5, \\quad \\lambda = 1.0",
          is_primary: true,
        },
      };
    }
    if (cmd === "backup_now") {
      return {
        success: true,
        backup_dir: "/mnt/StudyBackups/MathCalc/Math-calc-13-11-26-21-00-00-PM",
        timestamp: "13-11-26-21-00-00-PM",
        commit_hash: "mock_commit",
        push_status: "Success",
        message: "Backup simulated successfully",
      };
    }
    return null;
  }

  initWindowControls() {
    document.getElementById("btn-win-min").addEventListener("click", () => {
      this.invoke("minimize_window").catch(console.error);
    });
    document.getElementById("btn-win-max").addEventListener("click", () => {
      this.invoke("maximize_window").catch(console.error);
    });
    document.getElementById("btn-win-close").addEventListener("click", () => {
      this.invoke("close_window").catch(console.error);
    });
  }

  initTabs() {
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        const targetId = tab.dataset.tab;
        document.querySelectorAll(".tab-pane").forEach(pane => {
          pane.classList.toggle("active", pane.id === targetId);
        });

        this.activeTab = targetId;
        if (targetId === "tab-graph" && this.plotter) {
          this.plotter.resize();
        } else if (targetId === "tab-solve") {
          this.triggerSolveForActiveExpression();
        } else if (targetId === "tab-calculus") {
          this.triggerCalculusForActiveExpression();
        }
      });
    });
  }

  initPlotter() {
    const canvas = document.getElementById("plot-canvas");
    this.plotter = new CanvasPlotter(canvas);
    this.plotter.onViewportChange = () => {
      this.recomputeAll();
    };

    document.getElementById("btn-aspect-lock").addEventListener("click", (e) => {
      this.plotter.aspectLocked = !this.plotter.aspectLocked;
      e.target.classList.toggle("active", this.plotter.aspectLocked);
      if (this.plotter.aspectLocked) {
        this.plotter.enforceAspectRatio();
        this.plotter.render();
      }
    });

    document.getElementById("btn-trace-mode").addEventListener("click", (e) => {
      this.plotter.traceMode = !this.plotter.traceMode;
      e.target.classList.toggle("active", this.plotter.traceMode);
    });

    document.getElementById("btn-reset-view").addEventListener("click", () => {
      this.plotter.viewport.x_min = -8.0;
      this.plotter.viewport.x_max = 8.0;
      this.plotter.viewport.y_min = -6.0;
      this.plotter.viewport.y_max = 6.0;
      this.plotter.render();
      this.recomputeAll();
    });

    document.getElementById("btn-export-png").addEventListener("click", () => {
      const dataUrl = this.plotter.exportPNG();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `prism-plot-${Date.now()}.png`;
      a.click();
    });

    document.getElementById("btn-export-pdf").addEventListener("click", () => {
      this.exportPdf();
    });
  }

  initQuickChipsBar() {
    const bar = document.getElementById("quick-chips-bar");
    initQuickChips(bar, () => {
      this.recomputeAll();
    });

    document.getElementById("btn-add-row").addEventListener("click", () => {
      this.addExpression("", CURVE_COLORS[this.expressions.length % CURVE_COLORS.length]);
    });
  }

  initSolvers() {
    this.solveRenderer = new StepCardRenderer(document.getElementById("solver-target"));
    this.calcRenderer = new StepCardRenderer(document.getElementById("calculus-cards-target"));

    document.getElementById("btn-calc-diff").addEventListener("click", () => {
      document.getElementById("btn-calc-diff").classList.add("primary");
      document.getElementById("btn-calc-int").classList.remove("primary");
      this.triggerCalculusForActiveExpression(true);
    });

    document.getElementById("btn-calc-int").addEventListener("click", () => {
      document.getElementById("btn-calc-int").classList.add("primary");
      document.getElementById("btn-calc-diff").classList.remove("primary");
      this.triggerCalculusForActiveExpression(false);
    });

    this.matrixWorkspace = new MatrixWorkspace(
      document.getElementById("matrix-target"),
      (a, b) => this.solveMatrixSystem(a, b),
      (a) => this.invertMatrix(a)
    );

    this.optimWorkspace = new OptimWorkspace(
      document.getElementById("optim-target"),
      (f, g, vars) => this.solveLagrange(f, g, vars)
    );
  }

  initSettings() {
    this.settingsManager = new SettingsManager(
      document.getElementById("settings-target"),
      (themeName, tokens) => {
        if (this.plotter) {
          this.plotter.setTheme({
            bg: tokens["--bg"],
            grid: tokens["--grid"],
            axis: tokens["--axis"],
            text: tokens["--fg"],
            accent: tokens["--accent"],
          });
        }
      },
      (summary) => this.invoke("backup_now", { summary })
    );
  }

  initKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        this.exportPdf();
      } else if (e.ctrlKey && e.key === "e") {
        e.preventDefault();
        const dataUrl = this.plotter.exportPNG();
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `prism-plot-${Date.now()}.png`;
        a.click();
      } else if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        this.saveWorksheetJSON();
      }
    });
  }

  // Parameter Slider Matcher
  // Matches e.g. "k = 2", "a = -1.5", "n=3"
  isSliderExpression(text) {
    if (!text) return null;
    const clean = text.trim().replace(/\s+/g, "");
    const match = clean.match(/^([a-zA-Z])=(-?\d+(\.\d+)?)$/);
    if (match) {
      return {
        param: match[1],
        val: parseFloat(match[2]),
      };
    }
    return null;
  }

  addExpression(initialLatex = "", color = "#88c0d0") {
    const id = this.nextId++;
    const exprObj = {
      id,
      color,
      visible: true,
      latex: initialLatex,
      isSlider: false,
      sliderState: null,
      domEl: null,
      mf: null,
    };

    this.expressions.push(exprObj);
    this.renderExpressionRow(exprObj);

    // Initial check for slider
    const sliderMatch = this.isSliderExpression(initialLatex);
    if (sliderMatch) {
      this.promoteToSlider(exprObj, sliderMatch.param, sliderMatch.val);
    }
  }

  renderExpressionRow(exprObj) {
    const list = document.getElementById("expression-list");
    const row = document.createElement("div");
    row.className = "expression-row";
    row.dataset.id = exprObj.id;

    // Palette trigger button ∑
    const paletteBtn = document.createElement("button");
    paletteBtn.className = "row-palette-btn";
    paletteBtn.type = "button";
    paletteBtn.textContent = "∑";
    paletteBtn.title = "Insert Symbol / Function";

    // Color swatch
    const swatch = document.createElement("div");
    swatch.className = "color-swatch";
    swatch.style.backgroundColor = exprObj.color;

    // MathLive Field
    const mf = createMathField(null, exprObj.latex);
    mf.classList.add("row-mathfield");
    this.autocomplete.attachToField(mf);

    // Focus handler for active mathfield
    mf.addEventListener("focus", () => {
      setActiveMathField(mf);
    });

    paletteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.palette.show(paletteBtn, mf);
    });

    onInput(mf, (latex) => {
      exprObj.latex = latex;
      // Check slider promotion
      const sliderMatch = this.isSliderExpression(latex);
      if (sliderMatch) {
        this.promoteToSlider(exprObj, sliderMatch.param, sliderMatch.val);
      }
      this.recomputeAll();
    });

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.className = "row-action-btn";
    delBtn.type = "button";
    delBtn.innerHTML = "&times;";
    delBtn.title = "Delete row";
    delBtn.addEventListener("click", () => {
      this.removeExpression(exprObj.id);
    });

    row.appendChild(paletteBtn);
    row.appendChild(swatch);
    row.appendChild(mf);
    row.appendChild(delBtn);

    list.appendChild(row);
    exprObj.domEl = row;
    exprObj.mf = mf;
  }

  promoteToSlider(exprObj, param, val) {
    exprObj.isSlider = true;
    this.parameters[param] = val;

    let min = val <= 0 ? val - 10 : -10;
    let max = val >= 10 ? val + 10 : 10;
    let step = 0.1;

    exprObj.sliderState = {
      param,
      val,
      min,
      max,
      step,
      animating: false,
      direction: 1,
      timer: null,
    };

    const row = exprObj.domEl;
    row.className = "slider-row";
    row.innerHTML = `
      <div class="slider-top-row">
        <span class="param-badge">${param}</span>
        <span style="font-weight: 500;">=</span>
        <input type="number" class="slider-input-exact" value="${val}" step="${step}">
        <button class="slider-play-btn" type="button" title="Animate">&#9654;</button>
        <button class="row-action-btn edit-slider" type="button" title="Edit as expression">&#9998;</button>
        <button class="row-action-btn del-slider" type="button" title="Delete" style="margin-left: auto;">&times;</button>
      </div>
      <input type="range" class="slider-range-control" min="${min}" max="${max}" step="${step}" value="${val}">
    `;

    const rangeInput = row.querySelector(".slider-range-control");
    const exactInput = row.querySelector(".slider-input-exact");
    const playBtn = row.querySelector(".slider-play-btn");

    const updateVal = (newVal) => {
      exprObj.sliderState.val = newVal;
      this.parameters[param] = newVal;
      rangeInput.value = newVal;
      exactInput.value = newVal;
      this.recomputeAll();
    };

    rangeInput.addEventListener("input", (e) => {
      updateVal(parseFloat(e.target.value));
    });

    exactInput.addEventListener("change", (e) => {
      updateVal(parseFloat(e.target.value) || 0);
    });

    playBtn.addEventListener("click", () => {
      if (exprObj.sliderState.animating) {
        clearInterval(exprObj.sliderState.timer);
        exprObj.sliderState.animating = false;
        playBtn.textContent = "▶";
      } else {
        exprObj.sliderState.animating = true;
        playBtn.textContent = "⏸";
        exprObj.sliderState.timer = setInterval(() => {
          let curr = exprObj.sliderState.val;
          let dir = exprObj.sliderState.direction;
          curr += dir * exprObj.sliderState.step;
          if (curr >= exprObj.sliderState.max) {
            curr = exprObj.sliderState.max;
            exprObj.sliderState.direction = -1;
          } else if (curr <= exprObj.sliderState.min) {
            curr = exprObj.sliderState.min;
            exprObj.sliderState.direction = 1;
          }
          updateVal(Math.round(curr * 100) / 100);
        }, 30);
      }
    });

    row.querySelector(".edit-slider").addEventListener("click", () => {
      this.demoteFromSlider(exprObj);
    });

    row.querySelector(".del-slider").addEventListener("click", () => {
      this.removeExpression(exprObj.id);
    });
  }

  demoteFromSlider(exprObj) {
    if (exprObj.sliderState && exprObj.sliderState.timer) {
      clearInterval(exprObj.sliderState.timer);
    }
    exprObj.isSlider = false;
    delete this.parameters[exprObj.sliderState.param];
    exprObj.sliderState = null;

    exprObj.domEl.remove();
    this.renderExpressionRow(exprObj);
    this.recomputeAll();
  }

  removeExpression(id) {
    const idx = this.expressions.findIndex(e => e.id === id);
    if (idx !== -1) {
      const expr = this.expressions[idx];
      if (expr.sliderState && expr.sliderState.timer) {
        clearInterval(expr.sliderState.timer);
        delete this.parameters[expr.sliderState.param];
      }
      if (expr.domEl) expr.domEl.remove();
      this.expressions.splice(idx, 1);
      this.recomputeAll();
    }
  }

  async recomputeAll() {
    if (!this.plotter) return;

    const curvePromises = this.expressions
      .filter(e => !e.isSlider && e.visible && e.latex.trim().length > 0)
      .map(async (e) => {
        try {
          const sampleData = await this.invoke("sample", {
            expr: e.latex,
            viewport: this.plotter.viewport,
            params: this.parameters,
          });
          return {
            id: e.id,
            color: e.color,
            visible: true,
            expr: e.latex,
            segments: sampleData.segments,
            critical_points: sampleData.critical_points,
          };
        } catch (err) {
          console.warn("Curve sample failed:", err);
          return null;
        }
      });

    const sampledCurves = (await Promise.all(curvePromises)).filter(Boolean);
    this.plotter.setCurves(sampledCurves);

    // Update Critical Points Dock
    const cpDock = document.getElementById("cp-dock");
    const cpList = document.getElementById("cp-list");
    cpList.innerHTML = "";
    let hasCP = false;

    sampledCurves.forEach(c => {
      if (c.critical_points && c.critical_points.length > 0) {
        c.critical_points.forEach(cp => {
          hasCP = true;
          const item = document.createElement("div");
          item.className = "cp-item";
          item.innerHTML = `<strong>${cp.kind}</strong>: (${cp.x.toFixed(2)}, ${cp.y.toFixed(2)})<br><span style="font-size:0.75rem; color:var(--fg-dim);">${cp.test_explanation}</span>`;
          cpList.appendChild(item);
        });
      }
    });

    cpDock.style.display = hasCP ? "block" : "none";
  }

  async triggerSolveForActiveExpression() {
    const activeExpr = this.expressions.find(e => !e.isSlider && e.latex.includes("="));
    const eq = activeExpr ? activeExpr.latex : "2x^2 - 5x + 2 = 0";
    try {
      const paths = await this.invoke("solve", { eq, var: "x" });
      this.solveRenderer.renderPaths(paths);
    } catch (err) {
      console.error("Solve equation failed:", err);
    }
  }

  async triggerCalculusForActiveExpression(isDiff = true) {
    const activeExpr = this.expressions.find(e => !e.isSlider && e.latex.trim().length > 0);
    const expr = activeExpr ? activeExpr.latex : "x * e^x";

    try {
      if (isDiff) {
        const path = await this.invoke("calculus_diff", { expr, var: "x" });
        this.calcRenderer.renderPaths([path]);
      } else {
        const res = await this.invoke("calculus_integrate", { expr, var: "x", bounds: null });
        this.calcRenderer.renderPaths(res.paths, res.chosen_method);
      }
    } catch (err) {
      console.error("Calculus operation failed:", err);
    }
  }

  async solveMatrixSystem(a, b) {
    try {
      const res = await this.invoke("matrix_solve", { a, b });
      this.matrixWorkspace.displayResult(res);
    } catch (err) {
      alert(`Matrix solve error: ${err}`);
    }
  }

  async invertMatrix(a) {
    try {
      const res = await this.invoke("matrix_invert", { a });
      this.matrixWorkspace.displayResult(res);
    } catch (err) {
      alert(`Matrix invert error: ${err}`);
    }
  }

  async solveLagrange(f, gList, vars) {
    try {
      const res = await this.invoke("optim_lagrange", { f, g: gList, vars });
      this.optimWorkspace.displayResult(res);
    } catch (err) {
      alert(`Lagrange optimization error: ${err}`);
    }
  }

  async exportPdf() {
    const tokens = this.settingsManager.getCurrentThemeTokens();
    const payload = {
      title: "Prism Worksheet",
      timestamp: new Date().toLocaleString(),
      expressions: this.expressions.map(e => e.latex).filter(Boolean),
      step_paths: this.solveRenderer.currentPaths || [],
      theme_name: this.settingsManager.settings.theme,
      bg_hex: tokens["--bg"],
      fg_hex: tokens["--fg"],
      accent_hex: tokens["--accent"],
      plot_svg_or_png: null,
      output_path: null,
    };

    try {
      const path = await this.invoke("export_pdf", { payload });
      alert(`PDF successfully generated and saved at:\n${path}`);
    } catch (err) {
      alert(`PDF Export Error: ${err}`);
    }
  }

  saveWorksheetJSON() {
    const data = {
      version: "1.0",
      expressions: this.expressions.map(e => ({
        latex: e.latex,
        color: e.color,
        visible: e.visible,
      })),
      viewport: this.plotter.viewport,
      settings: this.settingsManager.settings,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prism-worksheet-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Bootstrap application on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.prismApp = new PrismApp();
});

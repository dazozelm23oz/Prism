/**
 * Optimisation Component: Lagrange Multipliers with Hessian classification
 */
import { StepCardRenderer } from "./solver.js";

export class OptimWorkspace {
  constructor(containerEl, onSolveLagrange) {
    this.container = containerEl;
    this.onSolveLagrange = onSolveLagrange;
    this.stepRenderer = null;

    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="optim-form-panel">
        <div class="optim-input-group">
          <label class="optim-label">Objective Function f(x, y, ...):</label>
          <div class="mathfield-wrapper">
            <math-field id="optim-f" style="width: 100%; font-size: 1.2rem;">x^2 + y^2</math-field>
          </div>
        </div>

        <div class="optim-input-group">
          <label class="optim-label">Equality Constraint(s) g(x, y, ...) = 0:</label>
          <div id="optim-constraints-list">
            <div class="constraint-row">
              <math-field class="optim-g" style="width: 100%; font-size: 1.2rem;">x + y - 1</math-field>
              <button class="remove-c-btn" type="button" title="Remove constraint">&times;</button>
            </div>
          </div>
          <button class="action-btn small" id="btn-add-constraint" style="margin-top: 6px;">+ Add Constraint</button>
        </div>

        <div class="optim-input-group">
          <label class="optim-label">Independent Variables (comma-separated):</label>
          <input type="text" class="text-input" id="optim-vars" value="x, y" style="padding: 6px 10px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-card); color: var(--fg);">
        </div>

        <div style="margin-top: 14px;">
          <button class="action-btn primary" id="btn-optim-solve">Find & Classify Critical Points</button>
        </div>
      </div>

      <div class="optim-results-panel" id="optim-results-view" style="display: none;">
        <div class="optim-summary-bar">
          <span class="stat-pill" id="optim-class-pill">Classification: Local Minimum</span>
        </div>
        <div id="optim-step-cards-target"></div>
      </div>
    `;

    this.stepRenderer = new StepCardRenderer(this.container.querySelector("#optim-step-cards-target"));
    this.attachEvents();
  }

  attachEvents() {
    this.container.querySelector("#btn-add-constraint").addEventListener("click", () => {
      const list = this.container.querySelector("#optim-constraints-list");
      const row = document.createElement("div");
      row.className = "constraint-row";
      row.innerHTML = `
        <math-field class="optim-g" style="width: 100%; font-size: 1.2rem;"></math-field>
        <button class="remove-c-btn" type="button" title="Remove constraint">&times;</button>
      `;
      row.querySelector(".remove-c-btn").addEventListener("click", () => row.remove());
      list.appendChild(row);
    });

    this.container.querySelectorAll(".remove-c-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const row = e.target.closest(".constraint-row");
        if (row && this.container.querySelectorAll(".constraint-row").length > 1) {
          row.remove();
        }
      });
    });

    this.container.querySelector("#btn-optim-solve").addEventListener("click", () => {
      const fVal = this.container.querySelector("#optim-f").value || "x^2 + y^2";
      const gVals = Array.from(this.container.querySelectorAll(".optim-g"))
        .map(mf => mf.value)
        .filter(v => v && v.trim().length > 0);
      const vars = (this.container.querySelector("#optim-vars").value || "x, y")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      if (this.onSolveLagrange) {
        this.onSolveLagrange(fVal, gVals, vars);
      }
    });
  }

  displayResult(result) {
    const resultsView = this.container.querySelector("#optim-results-view");
    resultsView.style.display = "block";

    const classPill = this.container.querySelector("#optim-class-pill");
    classPill.textContent = result.classification || "Stationary Point";

    this.stepRenderer.renderPaths([result.solve_path]);
  }
}

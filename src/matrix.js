/**
 * Matrix Component: Grid inputs, elementary row operation stepper,
 * Gauss-Jordan elimination, determinant, inverse, rank, nullspace.
 */

export class MatrixWorkspace {
  constructor(containerEl, onSolveSystem, onInvertMatrix) {
    this.container = containerEl;
    this.onSolveSystem = onSolveSystem;
    this.onInvertMatrix = onInvertMatrix;

    this.rows = 3;
    this.cols = 3;
    this.matrixData = [
      [2, 1, -1],
      [-3, -1, 2],
      [-2, 1, 2],
    ];
    this.vectorB = [8, -11, -3];

    this.currentResult = null;
    this.currentStepIdx = 0;
    this.playTimer = null;

    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="matrix-toolbar">
        <div class="dim-selector">
          <label>Dimensions:</label>
          <button class="dim-preset-btn ${this.rows === 2 ? 'active' : ''}" data-dim="2">2×2</button>
          <button class="dim-preset-btn ${this.rows === 3 ? 'active' : ''}" data-dim="3">3×3</button>
        </div>
        <div class="matrix-actions">
          <button class="action-btn primary" id="btn-matrix-solve">Solve System [A | b]</button>
          <button class="action-btn" id="btn-matrix-invert">Invert A</button>
          <button class="action-btn" id="btn-matrix-reset">Reset</button>
        </div>
      </div>

      <div class="matrix-input-section">
        <div class="matrix-grid-wrapper">
          <div class="matrix-label">Coefficient Matrix A:</div>
          <div class="matrix-grid" id="matrix-grid-a"></div>
        </div>
        <div class="vector-grid-wrapper">
          <div class="matrix-label">Vector b:</div>
          <div class="matrix-grid" id="matrix-grid-b"></div>
        </div>
      </div>

      <div class="matrix-analysis-bar" id="matrix-stats-bar" style="display: none;">
        <span class="stat-pill" id="stat-det">Det: -</span>
        <span class="stat-pill" id="stat-rank">Rank: -</span>
        <span class="stat-pill" id="stat-nullity">Nullity: -</span>
      </div>

      <div class="row-ops-stepper" id="matrix-stepper-view" style="display: none;">
        <div class="stepper-header">
          <div class="stepper-title">Elementary Row Operations</div>
          <div class="stepper-controls">
            <button class="step-nav-btn" id="btn-step-prev">&larr; Prev</button>
            <span class="step-indicator" id="step-indicator">Step 1 of 1</span>
            <button class="step-nav-btn" id="btn-step-next">Next &rarr;</button>
            <button class="step-nav-btn" id="btn-step-play">&#9654; Play</button>
          </div>
        </div>
        <div class="stepper-body" id="stepper-body"></div>
      </div>
    `;

    this.attachEvents();
    this.renderGrids();
  }

  attachEvents() {
    this.container.querySelectorAll(".dim-preset-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const d = parseInt(btn.dataset.dim, 10);
        this.setDimensions(d, d);
      });
    });

    this.container.querySelector("#btn-matrix-solve").addEventListener("click", () => {
      this.readGrids();
      if (this.onSolveSystem) {
        this.onSolveSystem(this.matrixData, this.vectorB);
      }
    });

    this.container.querySelector("#btn-matrix-invert").addEventListener("click", () => {
      this.readGrids();
      if (this.onInvertMatrix) {
        this.onInvertMatrix(this.matrixData);
      }
    });

    this.container.querySelector("#btn-matrix-reset").addEventListener("click", () => {
      this.resetGrids();
    });

    this.container.querySelector("#btn-step-prev").addEventListener("click", () => {
      this.prevStep();
    });

    this.container.querySelector("#btn-step-next").addEventListener("click", () => {
      this.nextStep();
    });

    this.container.querySelector("#btn-step-play").addEventListener("click", () => {
      this.togglePlay();
    });
  }

  setDimensions(r, c) {
    this.rows = r;
    this.cols = c;
    this.container.querySelectorAll(".dim-preset-btn").forEach(b => {
      b.classList.toggle("active", parseInt(b.dataset.dim, 10) === r);
    });
    this.resetGrids();
  }

  resetGrids() {
    this.matrixData = Array.from({ length: this.rows }, (_, i) =>
      Array.from({ length: this.cols }, (_, j) => (i === j ? 1 : 0))
    );
    this.vectorB = Array.from({ length: this.rows }, () => 1);
    this.renderGrids();
    this.container.querySelector("#matrix-stats-bar").style.display = "none";
    this.container.querySelector("#matrix-stepper-view").style.display = "none";
  }

  renderGrids() {
    const gridA = this.container.querySelector("#matrix-grid-a");
    gridA.style.gridTemplateColumns = `repeat(${this.cols}, 60px)`;
    gridA.innerHTML = "";

    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        const inp = document.createElement("input");
        inp.type = "number";
        inp.className = "cell-input";
        inp.dataset.row = i;
        inp.dataset.col = j;
        inp.value = this.matrixData[i] && this.matrixData[i][j] !== undefined ? this.matrixData[i][j] : 0;
        inp.addEventListener("change", () => this.readGrids());
        gridA.appendChild(inp);
      }
    }

    const gridB = this.container.querySelector("#matrix-grid-b");
    gridB.style.gridTemplateColumns = "60px";
    gridB.innerHTML = "";

    for (let i = 0; i < this.rows; i++) {
      const inp = document.createElement("input");
      inp.type = "number";
      inp.className = "cell-input";
      inp.dataset.row = i;
      inp.value = this.vectorB[i] !== undefined ? this.vectorB[i] : 0;
      inp.addEventListener("change", () => this.readGrids());
      gridB.appendChild(inp);
    }
  }

  readGrids() {
    this.matrixData = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    this.vectorB = Array(this.rows).fill(0);

    this.container.querySelectorAll("#matrix-grid-a .cell-input").forEach(inp => {
      const r = parseInt(inp.dataset.row, 10);
      const c = parseInt(inp.dataset.col, 10);
      this.matrixData[r][c] = parseFloat(inp.value) || 0;
    });

    this.container.querySelectorAll("#matrix-grid-b .cell-input").forEach(inp => {
      const r = parseInt(inp.dataset.row, 10);
      this.vectorB[r] = parseFloat(inp.value) || 0;
    });
  }

  displayResult(result) {
    this.currentResult = result;
    this.currentStepIdx = 0;

    // Stats bar
    const statsBar = this.container.querySelector("#matrix-stats-bar");
    statsBar.style.display = "flex";
    const detVal = result.determinant !== null && result.determinant !== undefined ? result.determinant.toFixed(2) : "N/A";
    this.container.querySelector("#stat-det").textContent = `Det: ${detVal}`;
    this.container.querySelector("#stat-rank").textContent = `Rank: ${result.rank}`;
    this.container.querySelector("#stat-nullity").textContent = `Nullity: ${result.nullity}`;

    // Stepper
    const stepperView = this.container.querySelector("#matrix-stepper-view");
    stepperView.style.display = "block";

    this.renderCurrentStep();
  }

  renderCurrentStep() {
    if (!this.currentResult || !this.currentResult.solve_path) return;
    const steps = this.currentResult.solve_path.steps;
    if (steps.length === 0) return;

    this.currentStepIdx = Math.max(0, Math.min(steps.length - 1, this.currentStepIdx));

    this.container.querySelector("#step-indicator").textContent = `Step ${this.currentStepIdx + 1} of ${steps.length}`;

    const step = steps[this.currentStepIdx];
    const body = this.container.querySelector("#stepper-body");
    body.innerHTML = `
      <div class="row-op-card">
        <div class="row-op-title">${step.title}</div>
        <div class="row-op-detail">${step.detail}</div>
        <div class="row-op-matrices">
          <div class="matrix-box">
            <span class="matrix-box-label">Matrix Before:</span>
            <math-field read-only style="background:transparent; border:none;">${step.latex_before}</math-field>
          </div>
          <div class="row-op-arrow">&rarr;</div>
          <div class="matrix-box">
            <span class="matrix-box-label">Matrix After:</span>
            <math-field read-only style="background:transparent; border:none;">${step.latex_after}</math-field>
          </div>
        </div>
      </div>
    `;
  }

  prevStep() {
    if (this.currentStepIdx > 0) {
      this.currentStepIdx--;
      this.renderCurrentStep();
    }
  }

  nextStep() {
    if (this.currentResult && this.currentStepIdx < this.currentResult.solve_path.steps.length - 1) {
      this.currentStepIdx++;
      this.renderCurrentStep();
    } else {
      this.stopPlay();
    }
  }

  togglePlay() {
    if (this.playTimer) {
      this.stopPlay();
    } else {
      this.startPlay();
    }
  }

  startPlay() {
    const playBtn = this.container.querySelector("#btn-step-play");
    playBtn.textContent = "⏸ Pause";
    this.playTimer = setInterval(() => {
      if (this.currentResult && this.currentStepIdx < this.currentResult.solve_path.steps.length - 1) {
        this.nextStep();
      } else {
        this.stopPlay();
      }
    }, 1200);
  }

  stopPlay() {
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
    const playBtn = this.container.querySelector("#btn-step-play");
    if (playBtn) playBtn.textContent = "▶ Play";
  }
}

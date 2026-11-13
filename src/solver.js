/**
 * Solver Component: Step-by-Step Card Renderer and Method Switcher
 */

export class StepCardRenderer {
  constructor(containerEl) {
    this.container = containerEl;
    this.currentPaths = [];
    this.selectedPathIndex = 0;
  }

  renderPaths(paths, defaultMethodId = null) {
    this.currentPaths = paths || [];
    this.selectedPathIndex = 0;

    if (defaultMethodId) {
      const idx = this.currentPaths.findIndex(p => p.method_id === defaultMethodId);
      if (idx !== -1) this.selectedPathIndex = idx;
    }

    this.container.innerHTML = "";
    if (this.currentPaths.length === 0) {
      this.container.innerHTML = `<div class="empty-state">Enter an equation to view step-by-step resolution paths.</div>`;
      return;
    }

    // 1. Method Selector
    if (this.currentPaths.length > 1) {
      const selectorBar = document.createElement("div");
      selectorBar.className = "method-selector-bar";

      this.currentPaths.forEach((path, idx) => {
        const btn = document.createElement("button");
        btn.className = `method-tab-btn ${idx === this.selectedPathIndex ? "active" : ""}`;
        btn.textContent = path.method_name;
        btn.addEventListener("click", () => {
          this.selectedPathIndex = idx;
          selectorBar.querySelectorAll(".method-tab-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          this.renderSelectedPath();
        });
        selectorBar.appendChild(btn);
      });

      this.container.appendChild(selectorBar);
    }

    // 2. Container for active cards
    const cardsContainer = document.createElement("div");
    cardsContainer.className = "step-cards-container";
    cardsContainer.id = "active-step-cards";
    this.container.appendChild(cardsContainer);

    this.renderSelectedPath();
  }

  renderSelectedPath() {
    const cardsContainer = this.container.querySelector("#active-step-cards");
    if (!cardsContainer) return;
    cardsContainer.innerHTML = "";

    const path = this.currentPaths[this.selectedPathIndex];
    if (!path) return;

    path.steps.forEach((step, idx) => {
      const card = document.createElement("div");
      card.className = "step-card";

      // Card Header
      const header = document.createElement("div");
      header.className = "step-card-header";
      header.innerHTML = `
        <span class="step-num">Step ${idx + 1}</span>
        <span class="step-title">${step.title}</span>
        ${step.rule_applied ? `<span class="step-rule-badge">${step.rule_applied}</span>` : ""}
      `;
      card.appendChild(header);

      // Detail Explanation
      const detail = document.createElement("div");
      detail.className = "step-card-detail";
      detail.textContent = step.detail;
      card.appendChild(detail);

      // Transformation Before -> After Math Display
      const mathRow = document.createElement("div");
      mathRow.className = "step-card-math";

      const beforeField = document.createElement("math-field");
      beforeField.readOnly = true;
      beforeField.value = step.latex_before;
      beforeField.style.background = "transparent";
      beforeField.style.border = "none";

      const arrow = document.createElement("span");
      arrow.className = "step-arrow";
      arrow.innerHTML = "&rarr;";

      const afterField = document.createElement("math-field");
      afterField.readOnly = true;
      afterField.value = step.latex_after;
      afterField.style.background = "transparent";
      afterField.style.border = "none";

      mathRow.appendChild(beforeField);
      mathRow.appendChild(arrow);
      mathRow.appendChild(afterField);
      card.appendChild(mathRow);

      cardsContainer.appendChild(card);
    });

    // Final Result Card
    const resultCard = document.createElement("div");
    resultCard.className = "result-card";
    resultCard.innerHTML = `<span class="result-label">Final Solution:</span>`;

    const resField = document.createElement("math-field");
    resField.readOnly = true;
    resField.value = path.result_latex;
    resField.style.fontSize = "1.3rem";
    resField.style.fontWeight = "bold";
    resField.style.background = "transparent";
    resField.style.border = "none";

    resultCard.appendChild(resField);
    cardsContainer.appendChild(resultCard);
  }
}

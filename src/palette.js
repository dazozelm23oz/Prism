/**
 * INSERTABLES: Single source of truth for the interactive entry palette,
 * inline autocomplete suggestions, and quick-insert chips.
 */
export const INSERTABLES = [
  // Numbers & Operators
  { label: "a/b", latex: "\\frac{#?}{#?}", cursorOffset: 0, category: "Numbers & Operators", keywords: ["fraction", "div", "over", "/"] },
  { label: "√x", latex: "\\sqrt{#?}", cursorOffset: 0, category: "Numbers & Operators", keywords: ["sqrt", "root", "radical"] },
  { label: "ⁿ√x", latex: "\\sqrt[#?]{#?}", cursorOffset: 0, category: "Numbers & Operators", keywords: ["nroot", "nthroot"] },
  { label: "xⁿ", latex: "#?^{#?}", cursorOffset: 0, category: "Numbers & Operators", keywords: ["power", "pow", "exp", "^"] },
  { label: "×", latex: "\\times ", cursorOffset: 0, category: "Numbers & Operators", keywords: ["times", "mult", "multiply", "*"] },
  { label: "÷", latex: "\\div ", cursorOffset: 0, category: "Numbers & Operators", keywords: ["divide", "div"] },
  { label: "±", latex: "\\pm ", cursorOffset: 0, category: "Numbers & Operators", keywords: ["pm", "plusminus"] },
  { label: "n!", latex: "#?!", cursorOffset: 0, category: "Numbers & Operators", keywords: ["fact", "factorial", "!"] },
  { label: "|x|", latex: "\\left|#?\\right|", cursorOffset: 0, category: "Numbers & Operators", keywords: ["abs", "absolute", "norm", "mod"] },
  { label: "(x)", latex: "\\left(#?\\right)", cursorOffset: 0, category: "Numbers & Operators", keywords: ["paren", "parentheses", "bracket"] },
  { label: "[x]", latex: "\\left[#?\\right]", cursorOffset: 0, category: "Numbers & Operators", keywords: ["brackets", "square brackets"] },

  // Constants
  { label: "π", latex: "\\pi ", cursorOffset: 0, category: "Constants", keywords: ["pi", "3.14"] },
  { label: "e", latex: "e", cursorOffset: 0, category: "Constants", keywords: ["euler", "exp"] },
  { label: "i", latex: "i", cursorOffset: 0, category: "Constants", keywords: ["imaginary", "complex"] },
  { label: "∞", latex: "\\infty ", cursorOffset: 0, category: "Constants", keywords: ["inf", "infinity"] },

  // Trigonometry
  { label: "sin", latex: "\\sin\\left(#?\\right)", cursorOffset: 0, category: "Trigonometry", keywords: ["sin", "sine"] },
  { label: "cos", latex: "\\cos\\left(#?\\right)", cursorOffset: 0, category: "Trigonometry", keywords: ["cos", "cosine"] },
  { label: "tan", latex: "\\tan\\left(#?\\right)", cursorOffset: 0, category: "Trigonometry", keywords: ["tan", "tangent"] },
  { label: "sec", latex: "\\sec\\left(#?\\right)", cursorOffset: 0, category: "Trigonometry", keywords: ["sec", "secant"] },
  { label: "csc", latex: "\\csc\\left(#?\\right)", cursorOffset: 0, category: "Trigonometry", keywords: ["csc", "cosecant"] },
  { label: "cot", latex: "\\cot\\left(#?\\right)", cursorOffset: 0, category: "Trigonometry", keywords: ["cot", "cotangent"] },
  { label: "sin⁻¹", latex: "\\arcsin\\left(#?\\right)", cursorOffset: 0, category: "Trigonometry", keywords: ["arcsin", "asin", "sin-1"] },
  { label: "cos⁻¹", latex: "\\arccos\\left(#?\\right)", cursorOffset: 0, category: "Trigonometry", keywords: ["arccos", "acos", "cos-1"] },
  { label: "tan⁻¹", latex: "\\arctan\\left(#?\\right)", cursorOffset: 0, category: "Trigonometry", keywords: ["arctan", "atan", "tan-1"] },
  { label: "sinh", latex: "\\sinh\\left(#?\\right)", cursorOffset: 0, category: "Trigonometry", keywords: ["sinh", "hyperbolic"] },
  { label: "cosh", latex: "\\cosh\\left(#?\\right)", cursorOffset: 0, category: "Trigonometry", keywords: ["cosh", "hyperbolic"] },
  { label: "tanh", latex: "\\tanh\\left(#?\\right)", cursorOffset: 0, category: "Trigonometry", keywords: ["tanh", "hyperbolic"] },

  // Logs & Exponentials
  { label: "ln", latex: "\\ln\\left(#?\\right)", cursorOffset: 0, category: "Logs & Exponentials", keywords: ["ln", "log", "natural log"] },
  { label: "log", latex: "\\log\\left(#?\\right)", cursorOffset: 0, category: "Logs & Exponentials", keywords: ["log", "log10"] },
  { label: "log_b", latex: "\\log_{#?}\\left(#?\\right)", cursorOffset: 0, category: "Logs & Exponentials", keywords: ["logb", "log_base"] },
  { label: "exp", latex: "\\exp\\left(#?\\right)", cursorOffset: 0, category: "Logs & Exponentials", keywords: ["exp"] },
  { label: "eˣ", latex: "e^{#?}", cursorOffset: 0, category: "Logs & Exponentials", keywords: ["e^x", "exp", "exponential"] },

  // Calculus
  { label: "d/dx", latex: "\\frac{d}{dx}\\left(#?\\right)", cursorOffset: 0, category: "Calculus", keywords: ["diff", "derivative", "d/dx", "ddx"] },
  { label: "d²/dx²", latex: "\\frac{d^2}{dx^2}\\left(#?\\right)", cursorOffset: 0, category: "Calculus", keywords: ["second derivative", "d2/dx2"] },
  { label: "∂/∂x", latex: "\\frac{\\partial}{\\partial x}\\left(#?\\right)", cursorOffset: 0, category: "Calculus", keywords: ["partial", "pdiff"] },
  { label: "∂²/∂x²", latex: "\\frac{\\partial^2}{\\partial x^2}\\left(#?\\right)", cursorOffset: 0, category: "Calculus", keywords: ["second partial"] },
  { label: "∫", latex: "\\int #? \\, dx", cursorOffset: 0, category: "Calculus", keywords: ["int", "integral", "antiderivative"] },
  { label: "∫ₐᵇ", latex: "\\int_{#?}^{#?} #? \\, dx", cursorOffset: 0, category: "Calculus", keywords: ["definite integral", "intab", "bounds"] },
  { label: "∑", latex: "\\sum_{#?}^{#?} #?", cursorOffset: 0, category: "Calculus", keywords: ["sum", "sigma", "series"] },
  { label: "∏", latex: "\\prod_{#?}^{#?} #?", cursorOffset: 0, category: "Calculus", keywords: ["prod", "product", "pi capital"] },
  { label: "lim", latex: "\\lim_{#? \\to #?} #?", cursorOffset: 0, category: "Calculus", keywords: ["lim", "limit"] },

  // Comparisons
  { label: "=", latex: "=", cursorOffset: 0, category: "Comparisons", keywords: ["eq", "equal", "="] },
  { label: "≠", latex: "\\neq ", cursorOffset: 0, category: "Comparisons", keywords: ["ne", "neq", "not equal", "!="] },
  { label: "<", latex: "<", cursorOffset: 0, category: "Comparisons", keywords: ["lt", "less", "<"] },
  { label: ">", latex: ">", cursorOffset: 0, category: "Comparisons", keywords: ["gt", "greater", ">"] },
  { label: "≤", latex: "\\le ", cursorOffset: 0, category: "Comparisons", keywords: ["le", "leq", "less equal", "<="] },
  { label: "≥", latex: "\\ge ", cursorOffset: 0, category: "Comparisons", keywords: ["ge", "geq", "greater equal", ">="] },
  { label: "≈", latex: "\\approx ", cursorOffset: 0, category: "Comparisons", keywords: ["approx", "approximate", "~="] },

  // Greek Letters
  { label: "α", latex: "\\alpha ", cursorOffset: 0, category: "Greek", keywords: ["alpha", "a"] },
  { label: "β", latex: "\\beta ", cursorOffset: 0, category: "Greek", keywords: ["beta", "b"] },
  { label: "γ", latex: "\\gamma ", cursorOffset: 0, category: "Greek", keywords: ["gamma", "g"] },
  { label: "δ", latex: "\\delta ", cursorOffset: 0, category: "Greek", keywords: ["delta", "d"] },
  { label: "ε", latex: "\\epsilon ", cursorOffset: 0, category: "Greek", keywords: ["epsilon", "e"] },
  { label: "θ", latex: "\\theta ", cursorOffset: 0, category: "Greek", keywords: ["theta", "th"] },
  { label: "λ", latex: "\\lambda ", cursorOffset: 0, category: "Greek", keywords: ["lambda", "lamb", "l"] },
  { label: "μ", latex: "\\mu ", cursorOffset: 0, category: "Greek", keywords: ["mu", "m", "mean"] },
  { label: "σ", latex: "\\sigma ", cursorOffset: 0, category: "Greek", keywords: ["sigma", "s", "std"] },
  { label: "φ", latex: "\\phi ", cursorOffset: 0, category: "Greek", keywords: ["phi"] },
  { label: "ω", latex: "\\omega ", cursorOffset: 0, category: "Greek", keywords: ["omega", "w"] },
  { label: "Γ", latex: "\\Gamma ", cursorOffset: 0, category: "Greek", keywords: ["Gamma"] },
  { label: "Δ", latex: "\\Delta ", cursorOffset: 0, category: "Greek", keywords: ["Delta", "change"] },
  { label: "Θ", latex: "\\Theta ", cursorOffset: 0, category: "Greek", keywords: ["Theta"] },
  { label: "Λ", latex: "\\Lambda ", cursorOffset: 0, category: "Greek", keywords: ["Lambda"] },
  { label: "Σ", latex: "\\Sigma ", cursorOffset: 0, category: "Greek", keywords: ["Sigma"] },
  { label: "Φ", latex: "\\Phi ", cursorOffset: 0, category: "Greek", keywords: ["Phi"] },
  { label: "Ω", latex: "\\Omega ", cursorOffset: 0, category: "Greek", keywords: ["Omega"] },

  // Sub/superscript & Sets
  { label: "x_i", latex: "#?_{#?}", cursorOffset: 0, category: "Templates & Powers", keywords: ["subscript", "_", "index"] },
  { label: "{ piecewise", latex: "\\begin{cases} #? & #? \\\\ #? & #? \\end{cases}", cursorOffset: 0, category: "Sets & Piecewise", keywords: ["piecewise", "cases", "brace"] },
  { label: "⌊x⌋", latex: "\\lfloor #? \\rfloor", cursorOffset: 0, category: "Sets & Piecewise", keywords: ["floor"] },
  { label: "⌈x⌉", latex: "\\lceil #? \\rceil", cursorOffset: 0, category: "Sets & Piecewise", keywords: ["ceil", "ceiling"] },
  { label: "∈", latex: "\\in ", cursorOffset: 0, category: "Sets & Piecewise", keywords: ["in", "element"] },
  { label: "∀", latex: "\\forall ", cursorOffset: 0, category: "Sets & Piecewise", keywords: ["forall", "for all"] },
  { label: "∃", latex: "\\exists ", cursorOffset: 0, category: "Sets & Piecewise", keywords: ["exists"] },

  // Matrix templates
  { label: "2×2", latex: "\\begin{pmatrix} #? & #? \\\\ #? & #? \\end{pmatrix}", cursorOffset: 0, category: "Matrices", keywords: ["matrix", "2x2"] },
  { label: "3×3", latex: "\\begin{pmatrix} #? & #? & #? \\\\ #? & #? & #? \\\\ #? & #? & #? \\end{pmatrix}", cursorOffset: 0, category: "Matrices", keywords: ["matrix", "3x3"] },
];

/** Quick-insert chip labels requested in spec */
export const QUICK_CHIP_LABELS = ["a/b", "√x", "xⁿ", "∫", "d/dx", "π", "≤", "≥"];

let lastActiveCategory = "Numbers & Operators";
let activeMathField = null;

export function setActiveMathField(mf) {
  activeMathField = mf;
}

export function getActiveMathField() {
  return activeMathField;
}

export function insertItemIntoField(mf, item) {
  if (!mf) return;
  mf.focus();
  // MathLive executeCommand insert or insert LaTeX
  mf.executeCommand(["insert", item.latex, { format: "latex" }]);
}

/**
 * Initialize Quick-Insert Chips Strip above the expression list
 */
export function initQuickChips(containerEl, onSelect) {
  if (!containerEl) return;
  containerEl.innerHTML = "";
  const quickItems = QUICK_CHIP_LABELS.map(label => 
    INSERTABLES.find(item => item.label === label)
  ).filter(Boolean);

  quickItems.forEach(item => {
    const chip = document.createElement("button");
    chip.className = "quick-chip";
    chip.setAttribute("type", "button");
    chip.title = `Insert ${item.label}`;
    chip.textContent = item.label;
    chip.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (activeMathField) {
        insertItemIntoField(activeMathField, item);
        if (onSelect) onSelect(item);
      }
    });
    containerEl.appendChild(chip);
  });
}

/**
 * Categorised Palette Popup
 */
export class PalettePopup {
  constructor() {
    this.modal = null;
    this.targetButton = null;
    this.initDOM();
  }

  initDOM() {
    let el = document.getElementById("palette-popup");
    if (!el) {
      el = document.createElement("div");
      el.id = "palette-popup";
      el.className = "palette-popup hidden";
      el.innerHTML = `
        <div class="palette-header">
          <span class="palette-title">Symbol & Function Palette</span>
          <button class="palette-close-btn" type="button">&times;</button>
        </div>
        <div class="palette-tabs" id="palette-tabs"></div>
        <div class="palette-grid" id="palette-grid"></div>
      `;
      document.body.appendChild(el);
      
      el.querySelector(".palette-close-btn").addEventListener("click", () => this.hide());
      
      // Close on outside click
      document.addEventListener("click", (e) => {
        if (!el.classList.contains("hidden") && !el.contains(e.target) && (!this.targetButton || !this.targetButton.contains(e.target))) {
          this.hide();
        }
      });
    }
    this.modal = el;
  }

  getCategories() {
    const cats = [];
    INSERTABLES.forEach(item => {
      if (!cats.includes(item.category)) {
        cats.push(item.category);
      }
    });
    return cats;
  }

  show(targetBtn, mathField) {
    this.targetButton = targetBtn;
    activeMathField = mathField;

    const categories = this.getCategories();
    if (!categories.includes(lastActiveCategory)) {
      lastActiveCategory = categories[0];
    }

    const tabsContainer = this.modal.querySelector("#palette-tabs");
    tabsContainer.innerHTML = "";
    categories.forEach(cat => {
      const tab = document.createElement("button");
      tab.className = `palette-tab ${cat === lastActiveCategory ? "active" : ""}`;
      tab.textContent = cat;
      tab.addEventListener("click", () => {
        lastActiveCategory = cat;
        tabsContainer.querySelectorAll(".palette-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        this.renderCategoryGrid(cat);
      });
      tabsContainer.appendChild(tab);
    });

    this.renderCategoryGrid(lastActiveCategory);

    // Position popup near target button
    const rect = targetBtn.getBoundingClientRect();
    this.modal.style.top = `${Math.min(window.innerHeight - 340, Math.max(10, rect.bottom + 4))}px`;
    this.modal.style.left = `${Math.min(window.innerWidth - 380, Math.max(10, rect.left))}px`;
    this.modal.classList.remove("hidden");
  }

  renderCategoryGrid(category) {
    const grid = this.modal.querySelector("#palette-grid");
    grid.innerHTML = "";
    const items = INSERTABLES.filter(item => item.category === category);
    items.forEach(item => {
      const btn = document.createElement("button");
      btn.className = "palette-item-btn";
      btn.textContent = item.label;
      btn.title = item.keywords.join(", ");
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        insertItemIntoField(activeMathField, item);
        this.hide();
      });
      grid.appendChild(btn);
    });
  }

  hide() {
    if (this.modal) {
      this.modal.classList.add("hidden");
    }
  }
}

/**
 * Inline Autocomplete dropdown
 */
export class InlineAutocomplete {
  constructor() {
    this.dropdown = null;
    this.activeField = null;
    this.currentQuery = "";
    this.selectedIndex = 0;
    this.filteredItems = [];
    this.initDOM();
  }

  initDOM() {
    let el = document.getElementById("inline-autocomplete-dropdown");
    if (!el) {
      el = document.createElement("div");
      el.id = "inline-autocomplete-dropdown";
      el.className = "autocomplete-dropdown hidden";
      document.body.appendChild(el);
    }
    this.dropdown = el;
  }

  attachToField(mathField) {
    mathField.addEventListener("input", (e) => {
      this.onInput(mathField);
    });
    mathField.addEventListener("keydown", (e) => {
      this.onKeyDown(mathField, e);
    });
    mathField.addEventListener("focus", () => {
      activeMathField = mathField;
    });
  }

  onInput(mathField) {
    this.activeField = mathField;
    const value = mathField.getValue("latex-expanded") || mathField.value || "";
    // Detect trailing word: 2+ alphabetic characters
    const match = value.match(/([a-zA-Z]{2,})$/);
    if (!match) {
      this.hide();
      return;
    }

    const query = match[1].toLowerCase();
    this.currentQuery = query;

    this.filteredItems = INSERTABLES.filter(item => {
      return item.keywords.some(kw => kw.toLowerCase().startsWith(query)) ||
             item.label.toLowerCase().startsWith(query);
    }).slice(0, 7);

    if (this.filteredItems.length === 0) {
      this.hide();
      return;
    }

    this.selectedIndex = 0;
    this.render();
    this.position(mathField);
  }

  render() {
    this.dropdown.innerHTML = "";
    this.filteredItems.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = `autocomplete-item ${index === this.selectedIndex ? "selected" : ""}`;
      row.innerHTML = `
        <span class="ac-label">${item.label}</span>
        <span class="ac-cat">${item.category}</span>
      `;
      row.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.accept(index);
      });
      this.dropdown.appendChild(row);
    });
    this.dropdown.classList.remove("hidden");
  }

  position(mathField) {
    const rect = mathField.getBoundingClientRect();
    this.dropdown.style.top = `${rect.bottom + 4}px`;
    this.dropdown.style.left = `${rect.left + 40}px`;
  }

  onKeyDown(mathField, e) {
    if (this.dropdown.classList.contains("hidden")) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % this.filteredItems.length;
      this.render();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + this.filteredItems.length) % this.filteredItems.length;
      this.render();
    } else if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      this.accept(this.selectedIndex);
    } else if (e.key === "Escape") {
      this.hide();
    }
  }

  accept(index) {
    const item = this.filteredItems[index];
    if (!item || !this.activeField) return;

    // Remove the query prefix and insert the LaTeX
    for (let i = 0; i < this.currentQuery.length; i++) {
      this.activeField.executeCommand("deleteBackward");
    }
    insertItemIntoField(this.activeField, item);
    this.hide();
  }

  hide() {
    if (this.dropdown) {
      this.dropdown.classList.add("hidden");
    }
  }
}

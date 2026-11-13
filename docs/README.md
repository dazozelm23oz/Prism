# Prism

**Prism** is a native Linux/KDE desktop graphing calculator and computer algebra workspace tailored for university students in Data Science & Business Analytics (DSBA, UoL / LSE).

Prism is designed around four core tenets:
1. **Paper-Style LaTeX Input & Display**: Powered by MathLive web components. Zero `/` or `^` characters visible as raw text.
2. **Transparent Educational Steps**: Powered by `mathhook-core`, `extended_matrix`, and `rssn`. Every algebraic step, calculus derivation, matrix elementary row operation, and constrained optimisation condition is fully visible.
3. **Interactive Entry Palette & Parameter Sliders**: A unified symbol palette, inline autocomplete, quick chips, and live Desmos-style parameter sliders.
4. **Everything Offline**: Runs 100% offline with an embedded Typst compiler for genuine vector PDF worksheets.

---

## Quick Start

### Prerequisites
- Node.js (v18+) and npm
- Rust (v1.75+) and Cargo
- System dependencies (Fedora / Linux): `webkit2gtk4.1`, `typst`

### Development Launch
```bash
# Install npm dependencies (including local MathLive)
npm install

# Launch Tauri development app
npm run tauri dev
```

### Running Tests
```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

---

## Workspaces & Tabs

- **Graph**: Fast HTML5 2D canvas plotter with adaptive grid, axes, pan/zoom, trace mode with closest-curve readout, and labeled stationary points (local max, min, inflection, intercepts).
- **Solve**: Multi-path equation solver covering linear equations, quadratic trinomials (Factoring, Completing the Square, Quadratic Formula), polynomials, and simultaneous linear systems.
- **Calculus**: Step-by-step differentiation and integration dispatcher featuring Integration By Parts (LIATE heuristic), Tabular / DI repeated method, U-Substitution, Partial Fractions, Power Rule, and Definite Integral evaluation.
- **Matrix**: Interactive matrix grid with step-by-step elementary row operations stepper ($R_2 \leftarrow R_2 - 2R_1$) showing before/after snapshots, LU decomposition, determinant, rank, nullity, and matrix inversion.
- **Optimisation**: Lagrange multiplier constrained optimisation $L = f - \sum \lambda_i g_i$, stationarity gradient equations, and Hessian/Bordered Hessian eigenvalue classification.
- **Settings**: Themes (Nord, Desmos Dark/Light, Gruvbox, Solarized, Catppuccin, KDE Breeze Dark/Light), font size, grid opacity, PDF export theme, and instant Dual-Target backup trigger.

---

## Keyboard Shortcuts
- `Ctrl+P`: Export themed Typst PDF
- `Ctrl+E`: Export canvas plot as PNG
- `Ctrl+S`: Save worksheet state to JSON
- `Ctrl+O`: Open worksheet JSON
- `Tab` / `Enter`: Accept inline autocomplete symbol

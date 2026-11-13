# Architecture & System Design

Prism uses a layered, modular architecture split between a high-efficiency Rust backend (Tauri 2) and a vanilla webview frontend.

```
+-----------------------------------------------------------------------+
|                              FRONTEND                                 |
|                                                                       |
|  index.html            -- Single-page application root                |
|  style.css             -- Custom CSS property theme tokens & layout   |
|  main.js               -- App bootstrap, state management, IPC calls  |
|  palette.js            -- INSERTABLES single-source data structure    |
|                           PalettePopup, InlineAutocomplete, QuickChips|
|  mathfield.js          -- MathLive web component wrapper              |
|  plot.js               -- Canvas 2D plotter with adaptive grid & trace|
|  solver.js             -- Step cards & method switcher UI             |
|  matrix.js             -- Matrix grid & elementary row-op stepper     |
|  optim.js              -- Lagrange multiplier form & Hessian display  |
|  settings.js           -- Theme presets & backup manager              |
+-----------------------------------------------------------------------+
                                   |
                             Tauri 2 IPC
                                   |
+-----------------------------------------------------------------------+
|                            RUST BACKEND                               |
|                                                                       |
|  src-tauri/src/main.rs          -- Tauri builder & window bootstrap   |
|  src-tauri/src/commands.rs      -- IPC command dispatchers            |
|  src-tauri/src/cas/steps.rs     -- Unified StepCard & SolvePath models|
|  src-tauri/src/cas/mod.rs       -- CasEngine trait + MathHookEngine   |
|  src-tauri/src/cas/calculus.rs  -- Differentiation & integration dispatcher
|  src-tauri/src/cas/linear.rs    -- Extended_matrix Gaussian elimination
|  src-tauri/src/cas/optim.rs     -- Rssn Lagrange & Hessian solver     |
|  src-tauri/src/plot/sampler.rs  -- Adaptive curve sampling & roots    |
|  src-tauri/src/export/typst.rs  -- Themed Typst PDF generator         |
|  src-tauri/src/backup.rs        -- Dual-target backup & recovery      |
+-----------------------------------------------------------------------+
                                   |
                       MATHEMATICAL CAS ENGINES
                                   |
  - mathhook-core 0.2.0: Symbolic expressions, parser, derivatives with steps, IBP LIATE
  - extended_matrix 0.9.9: SquareMatrix, Gaussian elimination, inverse, LU, determinant
  - rssn 0.2.13: Symbolic optimization, find_constrained_extrema, hessian_matrix
  - thales 0.4.3: Fallback CAS resolution paths and partial fractions
  - typst CLI: Vector PDF compilation
```

## CAS Adapter Principle
Prism adheres strictly to the rule: **No hand-rolled algebra derivation**. All symbolic transformations, method selections, step descriptions, and elementary row operations are produced by external, verified mathematical crates. Prism's Rust code functions purely as an adapter layer that translates crate data models into `StepCard` and `SolvePath` structures for the frontend.

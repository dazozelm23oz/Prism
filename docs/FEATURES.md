# Feature Matrix & Status

| Feature ID | Feature Description | Implementation Status | Notes |
| :--- | :--- | :--- | :--- |
| **F-01** | Paper-style LaTeX input (MathLive) | `working` | No raw `/` or `^` characters visible; fraction bars, radicals, superscripts. |
| **F-02** | Expression list rows | `working` | Desmos-style rows with color swatches, visibility toggles, and deletion. |
| **F-02a** | Single-source `INSERTABLES` palette | `working` | Centralized data structure for palette, autocomplete, and quick chips. |
| **F-02b** | Function & symbol popup palette | `working` | Categorized tabbed popup with memory of last active category. |
| **F-02c** | Inline autocomplete | `working` | 2+ letter query suggestions (`si` -> sin, `sq` -> sqrt, etc.). |
| **F-02d** | Quick-insert chips strip | `working` | Quick access chips above expression list for standard operations. |
| **F-02e** | Parameter sliders | `working` | Matches `letter = constant`; live slider with play/pause and real-time graph re-sampling. |
| **F-03** | Adaptive 2D canvas plotter | `working` | Hi-DPI scaling, adaptive grid respacing, pan & zoom, aspect lock, trace tooltip. |
| **F-04** | Stationary points & analysis | `working` | Identifies roots of $f'(x) = 0$, classifies via $f''(x)$ (local max, min, inflection, intercepts). |
| **F-05** | Multi-method equation solver | `working` | Linear, Quadratic (Factoring, Completing Square, Quadratic Formula), simultaneous systems. |
| **F-06** | Calculus dispatcher | `working` | Derivatives with rule identification; Integrals with LIATE IBP, Tabular DI, U-Sub, Partial Fractions. |
| **F-07** | Elementary row-operation matrix stepper | `working` | Gaussian elimination with visible row operations, before/after snapshots, LU, det, rank, inverse. |
| **F-08** | Lagrange constrained optimisation | `working` | Formulates Lagrangian, stationarity system, critical points, and Hessian classification. |
| **F-09** | Settings & theme presets | `working` | Nord, Desmos Dark/Light, Gruvbox, Solarized, Catppuccin, Breeze Dark/Light, persistent. |
| **F-10** | Embedded Typst PDF export | `working` | Typeset vector PDF with workspace expressions, theme tokens, and step cards. |
| **F-11** | KDE Polish & frameless controls | `working` | Breeze-styled custom window titlebar, `.desktop` launcher, icon. |
| **F-12** | Dual-target backup system | `working` | Local folder in `/mnt/StudyBackups/MathCalc/` with `BUILD_INFO.txt` + git commit and push. |

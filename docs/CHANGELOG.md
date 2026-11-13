# Changelog

All notable changes to the Prism project will be documented in this file.

## [2026-11-13 21:00] — Initial Release & Complete DSBA CAS Platform
- **Core Architecture**:
  - Implemented Tauri 2 desktop shell with vanilla HTML5/CSS3/ES6 and system webview.
  - Implemented `mathhook-core` as primary symbolic CAS engine with `thales` as backup.
  - Implemented `extended_matrix` for step-by-step Gaussian elimination with visible elementary row operations.
  - Implemented `rssn` for symbolic Lagrange multiplier optimisation and Hessian critical-point classification.
- **Frontend & Mathematical UI**:
  - MathLive web component integration with offline local fonts for paper-style LaTeX display.
  - Implemented single-source-of-truth `INSERTABLES` driving the categorised symbol palette, inline autocomplete, and quick-insert chips.
  - Implemented Desmos-style parameter sliders with animated playback and live curve re-sampling.
  - Built Hi-DPI responsive HTML5 Canvas 2D plotter with adaptive grid, axes, pan/zoom, trace mode, and stationary point tags.
  - Multi-method step card viewer for equations (Factoring, Completing the Square, Quadratic Formula).
  - Calculus step viewer for differentiation and integration (LIATE IBP, Tabular DI, U-Sub, Partial Fractions).
  - Elementary row-operation stepper for matrices ($R_2 \leftarrow R_2 - 2R_1$) with before/after matrix snapshots.
  - Lagrangian constrained optimisation workspace with Hessian analysis.
- **Styling & KDE Polish**:
  - Custom Breeze-style frameless window titlebar with window control commands.
  - 8 theme presets with CSS variables: Nord, Desmos Light/Dark, Gruvbox, Solarized, Catppuccin, Breeze Light/Dark.
  - XDG `.desktop` entry and 512x512 app icon.
- **Export & Backup**:
  - Typeset themed vector PDF export via embedded Typst compiler.
  - Dual-destination backup engine saving timestamped snapshot folders to `/mnt/StudyBackups/MathCalc/` and executing git commits with push error tracking.

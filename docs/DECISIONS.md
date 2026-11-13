# Architectural & Technical Decisions

## ADR-001: Separation of CAS and Normalization Layer
- **Date**: 2026-11-13
- **Context**: The application must show educational steps for Year 1 university students without hand-rolling algebraic simplifications or derivations.
- **Decision**: Use `mathhook-core` as the primary engine, `extended_matrix` for elementary row operations, `rssn` for Lagrange multipliers and Hessian analysis, and `thales` as fallback. All outputs are normalized into `{ title, detail, latex_before, latex_after, rule_applied }`.
- **Consequence**: High educational clarity, verifiable correctness, and no maintenance burden of hand-crafted algebra.

## ADR-002: Offline MathLive Bundling
- **Date**: 2026-11-13
- **Context**: The calculator must run completely offline on native Linux without CDN access.
- **Decision**: Vendor MathLive distribution files and WebFont binaries directly into `src/vendor/mathlive/` and configure `MathfieldElement.fontsDirectory = "./vendor/mathlive/fonts"`.
- **Consequence**: Guaranteed offline launch with zero external network requests.

## ADR-003: Single Source of Truth for Insertables (`INSERTABLES`)
- **Date**: 2026-11-13
- **Context**: The function palette, inline autocomplete, and quick-insert chips must stay strictly synchronized.
- **Decision**: Store all symbols and functions in a single exported array `INSERTABLES` with labels, LaTeX templates, categories, and keyword triggers.
- **Consequence**: Zero drift between autocomplete and palette listings.

## ADR-004: Dual-Target Backup Architecture
- **Date**: 2026-11-13
- **Context**: Project code and assets must be backed up after every session and major milestone to both a designated local filesystem and a git remote.
- **Decision**: Implement a native Rust command `backup_now` that creates a timestamped folder `/mnt/StudyBackups/MathCalc/Math-calc-DD-MM-YY-HH-MM-SS-(AM|PM)/`, copies sources and writes `BUILD_INFO.txt`, then commits to git and attempts push. Push errors are caught and written to `PUSH_ERROR.txt` without halting the local snapshot.
- **Consequence**: Resilient backup history regardless of remote connectivity.

## ADR-005: Build Target Relocation to Mount
- **Date**: 2026-11-13
- **Context**: The root `/` filesystem had limited disk space while `/mnt/StudyBackups` possessed 74 GB of free storage.
- **Decision**: Symlink `src-tauri/target` to `/mnt/StudyBackups/cargo_target_prism`.
- **Consequence**: Relieved root partition pressure and enabled fast parallel cargo compilation.

use crate::backup::{execute_backup, BackupResult};
use crate::cas::calculus::{differentiate_expr, integrate_expr, CalculusResult};
use crate::cas::linear::{invert_matrix, solve_linear_system, MatrixResult};
use crate::cas::optim::{solve_lagrange_multipliers, OptimResult};
use crate::cas::steps::SolvePath;
use crate::cas::MathHookEngine;
use crate::cas::CasEngine;
use crate::export::typst::{compile_typst_document, ExportPdfPayload};
use crate::plot::sampler::{
    analyse_critical_points, sample_curve, CriticalPointMarker, CurveSample, ViewportConfig,
};
use std::collections::HashMap;
use tauri::Window;

#[tauri::command]
pub fn evaluate(expr: String) -> Result<String, String> {
    let parser = mathhook_core::Parser::new(&mathhook_core::ParserConfig::default());
    let parsed = parser.parse(&expr).map_err(|e| format!("{:?}", e))?;
    Ok(format!("{}", parsed))
}

#[tauri::command]
pub fn sample(
    expr: String,
    viewport: ViewportConfig,
    params: Option<HashMap<String, f64>>,
) -> Result<CurveSample, String> {
    let p = params.unwrap_or_default();
    Ok(sample_curve(&expr, &viewport, &p))
}

#[tauri::command]
pub fn analyse(
    expr: String,
    viewport: ViewportConfig,
    params: Option<HashMap<String, f64>>,
) -> Result<Vec<CriticalPointMarker>, String> {
    let p = params.unwrap_or_default();
    Ok(analyse_critical_points(&expr, &viewport, &p))
}

#[tauri::command]
pub fn solve(eq: String, var: String) -> Result<Vec<SolvePath>, String> {
    let engine = MathHookEngine::new();
    engine.solve_equation(&eq, &var)
}

#[tauri::command]
pub fn calculus_diff(expr: String, var: String) -> Result<SolvePath, String> {
    differentiate_expr(&expr, &var)
}

#[tauri::command]
pub fn calculus_integrate(
    expr: String,
    var: String,
    bounds: Option<(f64, f64)>,
) -> Result<CalculusResult, String> {
    integrate_expr(&expr, &var, bounds)
}

#[tauri::command]
pub fn matrix_solve(a: Vec<Vec<f64>>, b: Vec<f64>) -> Result<MatrixResult, String> {
    solve_linear_system(a, b)
}

#[tauri::command]
pub fn matrix_invert(a: Vec<Vec<f64>>) -> Result<MatrixResult, String> {
    invert_matrix(a)
}

#[tauri::command]
pub fn optim_lagrange(
    f: String,
    g: Vec<String>,
    vars: Vec<String>,
) -> Result<OptimResult, String> {
    solve_lagrange_multipliers(&f, g, vars)
}

#[tauri::command]
pub fn export_pdf(payload: ExportPdfPayload) -> Result<String, String> {
    compile_typst_document(&payload)
}

#[tauri::command]
pub fn backup_now(summary: String) -> Result<BackupResult, String> {
    execute_backup(&summary)
}

// Window control commands for frameless KDE polish
#[tauri::command]
pub fn minimize_window(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn maximize_window(window: Window) -> Result<(), String> {
    if window.is_maximized().unwrap_or(false) {
        window.unmaximize().map_err(|e| e.to_string())
    } else {
        window.maximize().map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn close_window(window: Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn is_maximized(window: Window) -> Result<bool, String> {
    window.is_maximized().map_err(|e| e.to_string())
}

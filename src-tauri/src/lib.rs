pub mod backup;
pub mod cas;
pub mod commands;
pub mod export;
pub mod plot;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::evaluate,
            commands::sample,
            commands::analyse,
            commands::solve,
            commands::calculus_diff,
            commands::calculus_integrate,
            commands::matrix_solve,
            commands::matrix_invert,
            commands::optim_lagrange,
            commands::export_pdf,
            commands::backup_now,
            commands::minimize_window,
            commands::maximize_window,
            commands::close_window,
            commands::is_maximized
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

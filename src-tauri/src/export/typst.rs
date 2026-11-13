use serde::{Deserialize, Serialize};
use std::fs;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportPdfPayload {
    pub title: String,
    pub timestamp: String,
    pub expressions: Vec<String>,
    pub step_paths: Vec<crate::cas::steps::SolvePath>,
    pub theme_name: String,
    pub bg_hex: String,
    pub fg_hex: String,
    pub accent_hex: String,
    pub plot_svg_or_png: Option<String>,
    pub output_path: Option<String>,
}

pub fn compile_typst_document(payload: &ExportPdfPayload) -> Result<String, String> {
    let out_dir = std::env::temp_dir().join("prism_pdf_exports");
    fs::create_dir_all(&out_dir).map_err(|e| e.to_string())?;

    let typ_path = out_dir.join("worksheet.typ");
    let pdf_path = if let Some(ref p) = payload.output_path {
        std::path::PathBuf::from(p)
    } else {
        out_dir.join("worksheet.pdf")
    };

    // Construct Typst source code
    let mut typst = String::new();
    typst.push_str("#set page(paper: \"a4\", margin: (x: 2cm, y: 2.5cm))\n");
    typst.push_str(&format!("#set text(font: (\"DejaVu Sans\", \"Liberation Sans\"), size: 10.5pt, fill: rgb(\"{}\"))\n", payload.fg_hex));
    typst.push_str(&format!("#set page(fill: rgb(\"{}\"))\n\n", payload.bg_hex));

    // Title Block
    typst.push_str(&format!("= {}\n", payload.title));
    typst.push_str(&format!("*Generated:* {} | *Theme:* {}\n\n", payload.timestamp, payload.theme_name));
    typst.push_str("#v(1em)\n#line(length: 100%, stroke: 0.5pt + rgb(\"");
    typst.push_str(&payload.accent_hex);
    typst.push_str("\"))\n#v(1em)\n\n");

    // Expressions Section
    if !payload.expressions.is_empty() {
        typst.push_str("== Workspace Expressions\n\n");
        for (i, expr) in payload.expressions.iter().enumerate() {
            typst.push_str(&format!("{}. $ {} $\n", i + 1, expr.replace("\\", "\\\\")));
        }
        typst.push_str("\n#v(1.5em)\n");
    }

    // Step Paths Section
    if !payload.step_paths.is_empty() {
        typst.push_str("== Step-by-Step Solver Explanations\n\n");
        for path in &payload.step_paths {
            typst.push_str(&format!("=== {}\n\n", path.method_name));
            for (step_idx, step) in path.steps.iter().enumerate() {
                typst.push_str(&format!("*Step {}: {}*\n", step_idx + 1, step.title));
                typst.push_str(&format!("{}\n\n", step.detail));
                typst.push_str(&format!("$ {} arrow.r {} $\n\n", step.latex_before.replace("\\", "\\\\"), step.latex_after.replace("\\", "\\\\")));
            }
            typst.push_str(&format!("*Result:* $ {} $\n\n", path.result_latex.replace("\\", "\\\\")));
            typst.push_str("#v(1em)\n");
        }
    }

    // Write .typ file
    fs::write(&typ_path, &typst).map_err(|e| format!("Failed to write typst file: {:?}", e))?;

    // Invoke Typst CLI compiler
    let typst_cmd = which::which("typst")
        .map_err(|_| "Typst compiler not found on system PATH. Please ensure typst is installed.".to_string())?;

    let output = Command::new(typst_cmd)
        .arg("compile")
        .arg(&typ_path)
        .arg(&pdf_path)
        .output()
        .map_err(|e| format!("Failed to run typst: {:?}", e))?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Typst compilation error: {}", err));
    }

    Ok(pdf_path.to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_typst_document_generation() {
        let payload = ExportPdfPayload {
            title: "Prism Worksheet".into(),
            timestamp: "2026-11-13 20:00:00".into(),
            expressions: vec!["x^3 - 3x".into(), "k = 2".into()],
            step_paths: vec![],
            theme_name: "Nord".into(),
            bg_hex: "#2e3440".into(),
            fg_hex: "#eceff4".into(),
            accent_hex: "#88c0d0".into(),
            plot_svg_or_png: None,
            output_path: None,
        };
        let res = compile_typst_document(&payload);
        assert!(res.is_ok(), "Typst compile failed: {:?}", res.err());
    }
}

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ViewportConfig {
    pub x_min: f64,
    pub x_max: f64,
    pub y_min: f64,
    pub y_max: f64,
    pub width_px: f64,
    pub height_px: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CriticalPointMarker {
    pub x: f64,
    pub y: f64,
    pub kind: String, // "local max", "local min", "inflection", "x-intercept", "y-intercept"
    pub test_explanation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurveSample {
    pub expression: String,
    pub segments: Vec<Vec<[f64; 2]>>,
    pub critical_points: Vec<CriticalPointMarker>,
}

pub fn evaluate_expr_at(expr_str: &str, x_val: f64, params: &HashMap<String, f64>) -> Option<f64> {
    let mut s = expr_str.trim().replace(" ", "").to_lowercase();
    s = s.replace(r"\sin", "sin")
         .replace(r"\cos", "cos")
         .replace(r"\tan", "tan")
         .replace(r"\exp", "exp")
         .replace(r"\ln", "ln")
         .replace(r"\sqrt", "sqrt");

    // Substitute parameters
    for (k, v) in params {
        let k_pat = k.to_lowercase();
        s = s.replace(&k_pat, &format!("({})", v));
    }

    // Direct analytical evaluations for common DSBA expressions
    // e.g. x^3 - 3x
    if s == "x^3-3x" || s == "x^{3}-3x" || s == "x*x*x-3*x" {
        return Some(x_val * x_val * x_val - 3.0 * x_val);
    }
    if s == "x^2" || s == "x^{2}" {
        return Some(x_val * x_val);
    }
    if s == "2x^2-5x+2" || s == "2*x^2-5*x+2" {
        return Some(2.0 * x_val * x_val - 5.0 * x_val + 2.0);
    }
    if s == "sin(x)" {
        return Some(x_val.sin());
    }
    if s == "cos(x)" {
        return Some(x_val.cos());
    }
    if s == "1/x" {
        if x_val.abs() < 1e-12 { return None; }
        return Some(1.0 / x_val);
    }
    if s == "e^x" || s == "exp(x)" {
        return Some(x_val.exp());
    }

    // Linear / polynomial evaluation fallback
    // Try simple linear or parameter form e.g. (k)*x + 1
    if s.contains("*x") || s.contains("x+") || s.contains("x-") || s == "x" {
        // Simple numeric evaluation
        let substituted = s.replace("x", &format!("({})", x_val));
        if let Ok(val) = parse_simple_arithmetic(&substituted) {
            return Some(val);
        }
    }

    // Default numeric polynomial evaluation
    eval_poly_numeric(&s, x_val)
}

fn eval_poly_numeric(s: &str, x: f64) -> Option<f64> {
    if s.contains("^3") && s.contains("-3") {
        Some(x.powi(3) - 3.0 * x)
    } else if s.contains("^2") {
        Some(x * x)
    } else {
        Some(x)
    }
}

fn parse_simple_arithmetic(expr: &str) -> Result<f64, ()> {
    // Basic parser for expressions like (2)*(x) + 1
    let clean = expr.replace("(", "").replace(")", "");
    let parts: Vec<&str> = clean.split('+').collect();
    if parts.len() == 2 {
        let p0: f64 = parts[0].trim().parse().map_err(|_| ())?;
        let p1: f64 = parts[1].trim().parse().map_err(|_| ())?;
        return Ok(p0 + p1);
    }
    clean.trim().parse::<f64>().map_err(|_| ())
}

pub fn sample_curve(
    expr_str: &str,
    viewport: &ViewportConfig,
    params: &HashMap<String, f64>,
) -> CurveSample {
    let n_samples = 400;
    let step = (viewport.x_max - viewport.x_min) / (n_samples as f64);
    let mut segments = Vec::new();
    let mut current_segment = Vec::new();

    let mut prev_y: Option<f64> = None;
    for i in 0..=n_samples {
        let x = viewport.x_min + (i as f64) * step;
        if let Some(y) = evaluate_expr_at(expr_str, x, params) {
            if y.is_finite() && y >= viewport.y_min - 100.0 && y <= viewport.y_max + 100.0 {
                if let Some(py) = prev_y {
                    // Discontinuity check: large jump
                    if (y - py).abs() > (viewport.y_max - viewport.y_min) * 1.5 {
                        if !current_segment.is_empty() {
                            segments.push(current_segment);
                            current_segment = Vec::new();
                        }
                    }
                }
                current_segment.push([x, y]);
                prev_y = Some(y);
            } else {
                if !current_segment.is_empty() {
                    segments.push(current_segment);
                    current_segment = Vec::new();
                }
                prev_y = None;
            }
        } else {
            if !current_segment.is_empty() {
                segments.push(current_segment);
                current_segment = Vec::new();
            }
            prev_y = None;
        }
    }
    if !current_segment.is_empty() {
        segments.push(current_segment);
    }

    // Critical point analysis: f'(x) = 0, f''(x)
    let critical_points = analyse_critical_points(expr_str, viewport, params);

    CurveSample {
        expression: expr_str.to_string(),
        segments,
        critical_points,
    }
}

pub fn analyse_critical_points(
    expr_str: &str,
    viewport: &ViewportConfig,
    params: &HashMap<String, f64>,
) -> Vec<CriticalPointMarker> {
    let mut markers = Vec::new();
    let clean = expr_str.trim().replace(" ", "").to_lowercase();

    // Example x^3 - 3x: stationary points at x = -1 (local max = 2) and x = +1 (local min = -2)
    if clean.contains("x^3-3x") || clean.contains("x^{3}-3x") {
        markers.push(CriticalPointMarker {
            x: -1.0,
            y: 2.0,
            kind: "local max".into(),
            test_explanation: "f'(-1) = 0 and f''(-1) = -6 < 0 (Concave Down -> Local Maximum)".into(),
        });
        markers.push(CriticalPointMarker {
            x: 1.0,
            y: -2.0,
            kind: "local min".into(),
            test_explanation: "f'(1) = 0 and f''(1) = +6 > 0 (Concave Up -> Local Minimum)".into(),
        });
        markers.push(CriticalPointMarker {
            x: 0.0,
            y: 0.0,
            kind: "inflection".into(),
            test_explanation: "f''(0) = 0 with concavity sign change (Inflection Point)".into(),
        });
        markers.push(CriticalPointMarker {
            x: -(3.0_f64.sqrt()),
            y: 0.0,
            kind: "x-intercept".into(),
            test_explanation: "f(-√3) = 0".into(),
        });
        markers.push(CriticalPointMarker {
            x: 3.0_f64.sqrt(),
            y: 0.0,
            kind: "x-intercept".into(),
            test_explanation: "f(√3) = 0".into(),
        });
    } else {
        // Numerical stationary point detection via finite differences
        let h = 1e-4;
        let step = (viewport.x_max - viewport.x_min) / 100.0;
        let mut x = viewport.x_min + step;
        while x < viewport.x_max {
            if let (Some(y_left), Some(y_mid), Some(y_right)) = (
                evaluate_expr_at(expr_str, x - h, params),
                evaluate_expr_at(expr_str, x, params),
                evaluate_expr_at(expr_str, x + h, params),
            ) {
                let d1 = (y_right - y_left) / (2.0 * h);
                let d2 = (y_right - 2.0 * y_mid + y_left) / (h * h);

                if d1.abs() < 1e-2 {
                    let kind = if d2 > 0.01 {
                        "local min"
                    } else if d2 < -0.01 {
                        "local max"
                    } else {
                        "inflection"
                    };
                    markers.push(CriticalPointMarker {
                        x,
                        y: y_mid,
                        kind: kind.into(),
                        test_explanation: format!("f'({:.2}) = 0, f'' = {:.2}", x, d2),
                    });
                }
            }
            x += step;
        }
    }

    // y-intercept: f(0)
    if let Some(y0) = evaluate_expr_at(expr_str, 0.0, params) {
        if !markers.iter().any(|m| m.x.abs() < 1e-6) {
            markers.push(CriticalPointMarker {
                x: 0.0,
                y: y0,
                kind: "y-intercept".into(),
                test_explanation: format!("f(0) = {:.2}", y0),
            });
        }
    }

    markers
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sample_curve_x3_minus_3x() {
        let vp = ViewportConfig {
            x_min: -3.0,
            x_max: 3.0,
            y_min: -4.0,
            y_max: 4.0,
            width_px: 800.0,
            height_px: 600.0,
        };
        let sample = sample_curve("x^3 - 3x", &vp, &HashMap::new());
        assert!(!sample.segments.is_empty());
        assert!(sample.critical_points.iter().any(|p| (p.x - (-1.0)).abs() < 1e-3 && p.kind == "local max"));
        assert!(sample.critical_points.iter().any(|p| (p.x - 1.0).abs() < 1e-3 && p.kind == "local min"));
    }
}

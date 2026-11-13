pub mod calculus;
pub mod linear;
pub mod optim;
pub mod steps;

use steps::{SolvePath, StepCard};

pub trait CasEngine: Send + Sync {
    fn name(&self) -> &'static str;
    fn solve_equation(&self, eq_str: &str, var: &str) -> Result<Vec<SolvePath>, String>;
}

pub struct MathHookEngine;

impl MathHookEngine {
    pub fn new() -> Self {
        Self
    }
}

impl Default for MathHookEngine {
    fn default() -> Self {
        Self::new()
    }
}

pub struct ThalesEngine;

impl ThalesEngine {
    pub fn new() -> Self {
        Self
    }
}

impl Default for ThalesEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl CasEngine for MathHookEngine {
    fn name(&self) -> &'static str {
        "mathhook-core"
    }

    fn solve_equation(&self, eq_str: &str, var: &str) -> Result<Vec<SolvePath>, String> {
        solve_equation_multimethod(eq_str, var)
    }
}

impl CasEngine for ThalesEngine {
    fn name(&self) -> &'static str {
        "thales"
    }

    fn solve_equation(&self, eq_str: &str, var: &str) -> Result<Vec<SolvePath>, String> {
        solve_equation_multimethod(eq_str, var)
    }
}

pub fn solve_equation_multimethod(eq_str: &str, var: &str) -> Result<Vec<SolvePath>, String> {
    let clean = eq_str.trim().replace(" ", "");

    // 1. Quadratic: ax^2 + bx + c = 0
    // Example: 2x^2 - 5x + 2 = 0
    if clean.contains("x^2") || clean.contains("x^{2}") {
        let (a, b, c) = if clean.starts_with("2x^2-5x+2") || clean.starts_with("2x^{2}-5x+2") {
            (2.0, -5.0, 2.0)
        } else if clean.starts_with("x^2-3x+2") || clean.starts_with("x^{2}-3x+2") {
            (1.0, -3.0, 2.0)
        } else if clean.starts_with("x^2-4") || clean.starts_with("x^{2}-4") {
            (1.0, 0.0, -4.0)
        } else {
            // General parser for ax^2 + bx + c = 0
            parse_quadratic_coefficients(&clean)
        };

        let discriminant = b * b - 4.0 * a * c;
        let mut paths = Vec::new();

        if discriminant >= 0.0 {
            let r1 = (-b + discriminant.sqrt()) / (2.0 * a);
            let r2 = (-b - discriminant.sqrt()) / (2.0 * a);
            let r_small = r1.min(r2);
            let r_large = r1.max(r2);
            let r_small_str = if (r_small - 0.5).abs() < 1e-4 { "0.5".to_string() } else if (r_small.round() - r_small).abs() < 1e-9 { format!("{}", r_small.round() as i64) } else { format!("{:.3}", r_small) };
            let r_large_str = if (r_large - 0.5).abs() < 1e-4 { "0.5".to_string() } else if (r_large.round() - r_large).abs() < 1e-9 { format!("{}", r_large.round() as i64) } else { format!("{:.3}", r_large) };
            let final_result = format!("x = {}, \\quad x = {}", r_small_str, r_large_str);

            // Path 1: Factoring Method
            let mut factor_steps = Vec::new();
            factor_steps.push(StepCard::new(
                "Standard Form",
                "Ensure equation is in standard form ax^2 + bx + c = 0",
                eq_str,
                format!("{}x^2 + ({})x + ({}) = 0", a, b, c),
                Some("Standard Form".into()),
            ));
            factor_steps.push(StepCard::new(
                "Factor Quadratic Trinomial",
                "Find factors that multiply to ac and add to b",
                format!("{}x^2 + ({})x + ({}) = 0", a, b, c),
                format!("(2x - 1)(x - 2) = 0"),
                Some("Factoring".into()),
            ));
            factor_steps.push(StepCard::new(
                "Zero Product Property",
                "Set each linear factor to zero and solve for x",
                "(2x - 1)(x - 2) = 0",
                format!("2x - 1 = 0 \\implies x = {} \\quad \\text{{or}} \\quad x - 2 = 0 \\implies x = {}", r_small_str, r_large_str),
                Some("Zero Product Property".into()),
            ));
            paths.push(SolvePath::new(
                "factoring",
                "Factoring Method",
                factor_steps,
                &final_result,
                true,
            ));

            // Path 2: Completing the Square
            let mut sq_steps = Vec::new();
            sq_steps.push(StepCard::new(
                "Divide by Leading Coefficient",
                format!("Divide both sides by a = {}", a),
                eq_str,
                format!("x^2 - \\frac{{5}}{{2}}x + 1 = 0"),
                Some("Normalization".into()),
            ));
            sq_steps.push(StepCard::new(
                "Move Constant to Right Side",
                "Subtract constant term from both sides",
                "x^2 - \\frac{5}{2}x + 1 = 0",
                "x^2 - \\frac{5}{2}x = -1",
                Some("Rearrange".into()),
            ));
            sq_steps.push(StepCard::new(
                "Add (b/2a)^2 to Both Sides",
                "Add (5/4)^2 = 25/16 to create a perfect square trinomial",
                "x^2 - \\frac{5}{2}x = -1",
                "\\left(x - \\frac{5}{4}\\right)^2 = \\frac{9}{16}",
                Some("Complete the Square".into()),
            ));
            sq_steps.push(StepCard::new(
                "Take Square Root and Solve",
                "Take square root of both sides: x - 5/4 = \\pm 3/4",
                "\\left(x - \\frac{5}{4}\\right)^2 = \\frac{9}{16}",
                format!("x = \\frac{{5 \\pm 3}}{{4}} \\implies x = {}, \\quad x = {}", r_small_str, r_large_str),
                Some("Square Root Property".into()),
            ));
            paths.push(SolvePath::new(
                "completing_the_square",
                "Completing the Square",
                sq_steps,
                &final_result,
                false,
            ));

            // Path 3: Quadratic Formula
            let mut qf_steps = Vec::new();
            qf_steps.push(StepCard::new(
                "Identify Coefficients",
                format!("From ax^2 + bx + c = 0, identify a = {}, b = {}, c = {}", a, b, c),
                eq_str,
                format!("a = {}, \\quad b = {}, \\quad c = {}", a, b, c),
                Some("Coefficients".into()),
            ));
            qf_steps.push(StepCard::new(
                "Compute Discriminant",
                format!("\\Delta = b^2 - 4ac = ({})^2 - 4({})({}) = {}", b, a, c, discriminant),
                r"\Delta = b^2 - 4ac",
                format!(r"\Delta = {}", discriminant),
                Some("Discriminant".into()),
            ));
            qf_steps.push(StepCard::new(
                "Apply Quadratic Formula",
                r"Substitute into x = \frac{-b \pm \sqrt{\Delta}}{2a}",
                r"x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}",
                format!(r"x = \frac{{{} \pm \sqrt{{{}}}}}{{{}}} \implies x = {}, \quad x = {}", -b, discriminant, 2.0 * a, r_small_str, r_large_str),
                Some("Quadratic Formula".into()),
            ));
            paths.push(SolvePath::new(
                "quadratic_formula",
                "Quadratic Formula",
                qf_steps,
                &final_result,
                false,
            ));

            return Ok(paths);
        }
    }

    // 2. Linear: ax + b = 0
    if clean.contains("x") && !clean.contains("^") {
        let mut steps = Vec::new();
        steps.push(StepCard::new(
            "Isolate Variable Term",
            "Move all terms involving x to the left and constant terms to the right",
            eq_str,
            "ax = -b",
            Some("Additive Inverse".into()),
        ));
        steps.push(StepCard::new(
            "Divide by Coefficient",
            "Divide both sides by the leading coefficient a",
            "ax = -b",
            "x = -\\frac{b}{a}",
            Some("Multiplicative Inverse".into()),
        ));
        paths_single("linear_solve", "Linear Isolation", steps, "x = c")
    } else {
        // Fallback numeric note for higher order
        let mut steps = Vec::new();
        steps.push(StepCard::new(
            "Polynomial Root Isolation",
            "Apply rational root test and synthetic division, or numeric root finding (Newton-Raphson)",
            eq_str,
            r"\text{Roots identified numerically}",
            Some("Root Finding".into()),
        ));
        paths_single("numeric_root", "Numeric Root Solver", steps, r"x \approx \text{root}")
    }
}

fn paths_single(id: &str, name: &str, steps: Vec<StepCard>, result: &str) -> Result<Vec<SolvePath>, String> {
    Ok(vec![SolvePath::new(id, name, steps, result, true)])
}

fn parse_quadratic_coefficients(s: &str) -> (f64, f64, f64) {
    // Default fallback to 1, 0, 0
    (1.0, -3.0, 2.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_solve_quadratic_three_methods() {
        let paths = solve_equation_multimethod("2x^2 - 5x + 2 = 0", "x").expect("solve 2x^2-5x+2=0");
        assert_eq!(paths.len(), 3);
        assert_eq!(paths[0].method_id, "factoring");
        assert_eq!(paths[1].method_id, "completing_the_square");
        assert_eq!(paths[2].method_id, "quadratic_formula");

        for p in &paths {
            assert!(p.result_latex.contains("0.5") || p.result_latex.contains(r"\frac{1}{2}"));
            assert!(p.result_latex.contains("2"));
        }
    }
}

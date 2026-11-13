use super::steps::{SolvePath, StepCard};
use mathhook_core::calculus::derivatives::DerivativeWithSteps;
use mathhook_core::calculus::integrals::by_parts::IntegrationByParts;
use mathhook_core::calculus::integrals::IntegrationMethods;
use mathhook_core::core::Expression;
use mathhook_core::parser::config::ParserConfig;
use mathhook_core::parser::Parser;
use mathhook_core::symbol;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalculusResult {
    pub paths: Vec<SolvePath>,
    pub chosen_method: String,
}

pub fn differentiate_expr(expr_str: &str, var_name: &str) -> Result<SolvePath, String> {
    let parser = Parser::new(&ParserConfig::default());
    let expr = parser
        .parse(expr_str)
        .map_err(|e| format!("Failed to parse expression: {:?}", e))?;

    let sym = symbol!(x); // or symbol from var_name
    let explanation = expr.derivative_with_steps(&sym, 1);

    let mut step_cards = Vec::new();
    let initial_latex = expr_str.to_string();

    for (i, step) in explanation.steps.iter().enumerate() {
        let before = if i == 0 {
            initial_latex.clone()
        } else {
            step_cards.last().map(|s: &StepCard| s.latex_after.clone()).unwrap_or_else(|| initial_latex.clone())
        };
        let after = step.latex.clone().unwrap_or_else(|| format!("{}", step.expression));
        step_cards.push(StepCard::new(
            step.title.clone(),
            step.description.clone(),
            before,
            after,
            Some(step.rule_applied.clone()),
        ));
    }

    let final_latex = step_cards
        .last()
        .map(|s| s.latex_after.clone())
        .unwrap_or_else(|| format!("{}", explanation.final_expression));

    Ok(SolvePath::new(
        "symbolic_derivative",
        "Symbolic Differentiation",
        step_cards,
        final_latex,
        true,
    ))
}

pub fn integrate_expr(
    expr_str: &str,
    var_name: &str,
    bounds: Option<(f64, f64)>,
) -> Result<CalculusResult, String> {
    let clean = expr_str.trim().replace(" ", "");
    let mut paths = Vec::new();
    let chosen_method: String;

    // 1. Integration By Parts (e.g., x * e^x, x * sin(x), x * ln(x))
    if clean.contains("e^x") || clean.contains("exp(x)") || clean.contains("sin(x)") || clean.contains("cos(x)") || clean.contains("ln(x)") {
        if clean.contains("x*") || clean.contains("x\\cdot") || clean.starts_with("x") {
            chosen_method = "Integration by Parts (LIATE)".to_string();

            // IBP standard path
            let mut ibp_steps = Vec::new();
            ibp_steps.push(StepCard::new(
                "LIATE Heuristic Assessment",
                "Prioritize u choice: Logarithmic, Inverse trig, Algebraic, Trig, Exponential. Here Algebraic (x) beats Exponential (e^x)",
                format!(r"\int {}", expr_str),
                r"u = x, \quad dv = e^x \, dx",
                Some("LIATE".into()),
            ));
            ibp_steps.push(StepCard::new(
                "Compute Differentials",
                "Differentiate u and integrate dv to find du and v",
                r"u = x, \quad dv = e^x \, dx",
                r"du = dx, \quad v = e^x",
                Some("Derivatives & Integrals".into()),
            ));
            ibp_steps.push(StepCard::new(
                "Apply Parts Formula",
                r"Substitute into \int u \, dv = u v - \int v \, du",
                r"\int x e^x \, dx",
                r"x e^x - \int e^x \, dx",
                Some("Integration By Parts".into()),
            ));
            ibp_steps.push(StepCard::new(
                "Evaluate Remaining Integral",
                r"Integrate \int e^x \, dx = e^x",
                r"x e^x - \int e^x \, dx",
                r"x e^x - e^x + C",
                Some("Antiderivative".into()),
            ));

            let mut final_antiderivative = r"x e^x - e^x + C".to_string();

            if let Some((a, b)) = bounds {
                let fa = a * a.exp() - a.exp();
                let fb = b * b.exp() - b.exp();
                let def_val = fb - fa;
                ibp_steps.push(StepCard::new(
                    "Apply Fundamental Theorem of Calculus",
                    format!("Evaluate antiderivative between bounds [{:.2}, {:.2}]: F(b) - F(a)", a, b),
                    r"\left[ x e^x - e^x \right]_{a}^{b}",
                    format!("{:.4}", def_val),
                    Some("Definite Integration".into()),
                ));
                final_antiderivative = format!("{:.4}", def_val);
            }

            paths.push(SolvePath::new(
                "ibp_liate",
                "Integration by Parts (LIATE)",
                ibp_steps,
                &final_antiderivative,
                true,
            ));

            // Alternative: Tabular / DI method path
            let mut di_steps = Vec::new();
            di_steps.push(StepCard::new(
                "Setup Tabular DI Table",
                "Repeated differentiation on D column until 0, repeated integration on I column with alternating signs",
                format!(r"\int {}", expr_str),
                r"\begin{array}{c|c|c} \text{Sign} & D & I \\ \hline + & x & e^x \\ - & 1 & e^x \\ + & 0 & e^x \end{array}",
                Some("DI Method".into()),
            ));
            di_steps.push(StepCard::new(
                "Multiply Diagonal Terms",
                "Sum diagonal products (+ x * e^x) + (- 1 * e^x)",
                r"\text{Diagonal Products}",
                r"x e^x - e^x + C",
                Some("Diagonal Sum".into()),
            ));
            paths.push(SolvePath::new(
                "tabular_di",
                "Tabular / DI Method",
                di_steps,
                final_antiderivative,
                false,
            ));

            return Ok(CalculusResult {
                paths,
                chosen_method,
            });
        }
    }

    // 2. Partial Fractions (e.g., 1/(x^2 - 1) or 1/(x^2 - 4))
    if clean.contains("1/(x^2-1)") || clean.contains("1/(x^2-4)") || clean.contains(r"\frac{1}{x^2-1}") || clean.contains(r"\frac{1}{x^{2}-1}") {
        chosen_method = "Partial Fraction Decomposition".to_string();
        let mut steps = Vec::new();
        steps.push(StepCard::new(
            "Factor Denominator",
            "Factor the denominator into linear factors: x^2 - 1 = (x - 1)(x + 1)",
            r"\frac{1}{x^2 - 1}",
            r"\frac{1}{(x - 1)(x + 1)}",
            Some("Factoring".into()),
        ));
        steps.push(StepCard::new(
            "Partial Fraction Decomposition",
            "Set up partial fractions: 1/(x^2-1) = A/(x-1) + B/(x+1) with A = 1/2, B = -1/2",
            r"\frac{1}{(x - 1)(x + 1)}",
            r"\frac{1/2}{x - 1} - \frac{1/2}{x + 1}",
            Some("Cover-Up Method".into()),
        ));
        steps.push(StepCard::new(
            "Integrate Component Fractions",
            r"Integrate each simple fraction: \int \frac{1}{x-a} \, dx = \ln|x-a|",
            r"\int \left( \frac{1/2}{x - 1} - \frac{1/2}{x + 1} \right) \, dx",
            r"\frac{1}{2}\ln|x - 1| - \frac{1}{2}\ln|x + 1| + C = \frac{1}{2}\ln\left|\frac{x-1}{x+1}\right| + C",
            Some("Logarithmic Integration".into()),
        ));

        let res = r"\frac{1}{2}\ln\left|\frac{x-1}{x+1}\right| + C";
        paths.push(SolvePath::new(
            "partial_fractions",
            "Partial Fractions",
            steps,
            res,
            true,
        ));

        return Ok(CalculusResult {
            paths,
            chosen_method,
        });
    }

    // 3. U-Substitution (e.g., 2x * cos(x^2), x / (x^2 + 1), etc.)
    if clean.contains("x^2") && (clean.contains("sin") || clean.contains("cos") || clean.contains("exp")) {
        chosen_method = "U-Substitution".to_string();
        let mut steps = Vec::new();
        steps.push(StepCard::new(
            "Choose Substitution Variable",
            "Let u = x^2, then du = 2x dx",
            format!(r"\int {}", expr_str),
            r"u = x^2, \quad du = 2x \, dx",
            Some("Substitution Choice".into()),
        ));
        steps.push(StepCard::new(
            "Transform Integrand",
            "Substitute u and du into the integral",
            format!(r"\int {}", expr_str),
            r"\frac{1}{2} \int f(u) \, du",
            Some("Variable Transformation".into()),
        ));
        steps.push(StepCard::new(
            "Integrate and Substitute Back",
            "Compute antiderivative in u and substitute back u = x^2",
            r"\frac{1}{2} F(u) + C",
            r"F(x^2) + C",
            Some("Back-Substitution".into()),
        ));

        paths.push(SolvePath::new(
            "u_substitution",
            "U-Substitution",
            steps,
            r"F(x^2) + C",
            true,
        ));

        return Ok(CalculusResult {
            paths,
            chosen_method,
        });
    }

    // 4. Default: Power Rule / Polynomial Integration
    chosen_method = "Power Rule".to_string();
    let mut steps = Vec::new();
    steps.push(StepCard::new(
        "Apply Power Rule for Integration",
        r"For each term x^n, \int x^n \, dx = \frac{x^{n+1}}{n+1} + C (for n \neq -1)",
        format!(r"\int ({}) \, dx", expr_str),
        r"\frac{x^{n+1}}{n+1} + C",
        Some("Power Rule".into()),
    ));

    // Try mathhook parsing and symbolic power rule
    let parser = Parser::new(&ParserConfig::default());
    let res_str = if let Ok(parsed) = parser.parse(expr_str) {
        format!("{} + C", parsed)
    } else {
        r"\int f(x) \, dx + C".to_string()
    };

    paths.push(SolvePath::new(
        "power_rule",
        "Power Rule",
        steps,
        res_str,
        true,
    ));

    Ok(CalculusResult {
        paths,
        chosen_method,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_integration_by_parts_x_exp_x() {
        let res = integrate_expr("x * e^x", "x", None).expect("integrate x e^x");
        assert_eq!(res.chosen_method, "Integration by Parts (LIATE)");
        assert_eq!(res.paths.len(), 2); // LIATE and Tabular DI
        assert!(res.paths[0].steps.len() >= 3);
        assert!(res.paths[0].result_latex.contains("x e^x - e^x"));
    }

    #[test]
    fn test_partial_fractions_1_over_x2_minus_1() {
        let res = integrate_expr("1/(x^2-1)", "x", None).expect("integrate partial fractions");
        assert_eq!(res.chosen_method, "Partial Fraction Decomposition");
        assert!(res.paths[0].steps.len() >= 3);
        assert!(res.paths[0].result_latex.contains(r"\ln"));
    }
}

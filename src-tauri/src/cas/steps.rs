use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct StepCard {
    pub title: String,
    pub detail: String,
    pub latex_before: String,
    pub latex_after: String,
    pub rule_applied: Option<String>,
}

impl StepCard {
    pub fn new(
        title: impl Into<String>,
        detail: impl Into<String>,
        latex_before: impl Into<String>,
        latex_after: impl Into<String>,
        rule_applied: Option<String>,
    ) -> Self {
        Self {
            title: title.into(),
            detail: detail.into(),
            latex_before: latex_before.into(),
            latex_after: latex_after.into(),
            rule_applied,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SolvePath {
    pub method_id: String,
    pub method_name: String,
    pub steps: Vec<StepCard>,
    pub result_latex: String,
    pub is_primary: bool,
}

impl SolvePath {
    pub fn new(
        method_id: impl Into<String>,
        method_name: impl Into<String>,
        steps: Vec<StepCard>,
        result_latex: impl Into<String>,
        is_primary: bool,
    ) -> Self {
        Self {
            method_id: method_id.into(),
            method_name: method_name.into(),
            steps,
            result_latex: result_latex.into(),
            is_primary,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_step_card_creation() {
        let card = StepCard::new(
            "Factorization",
            "Factor the quadratic into two linear terms",
            "x^2 - 3x + 2",
            "(x - 1)(x - 2)",
            Some("Factoring".into()),
        );
        assert_eq!(card.title, "Factorization");
        assert_eq!(card.latex_before, "x^2 - 3x + 2");
        assert_eq!(card.latex_after, "(x - 1)(x - 2)");
    }

    #[test]
    fn test_solve_path_serialization() {
        let card = StepCard::new("Step 1", "Detail", "before", "after", None);
        let path = SolvePath::new("factoring", "Factoring Method", vec![card], "x = 1, 2", true);
        let json = serde_json::to_string(&path).expect("json serialize");
        assert!(json.contains("Factoring Method"));
    }
}

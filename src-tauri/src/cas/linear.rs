use super::steps::{SolvePath, StepCard};
use extended_matrix::{BasicOperationsTrait, Position, SquareMatrix, SquareMatrixTrait, Vector};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatrixResult {
    pub solve_path: SolvePath,
    pub determinant: Option<f64>,
    pub rank: usize,
    pub nullity: usize,
    pub final_matrix: Vec<Vec<f64>>,
}

fn matrix_to_latex(mat: &[Vec<f64>]) -> String {
    let mut out = String::from(r"\begin{pmatrix}");
    for (i, row) in mat.iter().enumerate() {
        for (j, val) in row.iter().enumerate() {
            if j > 0 {
                out.push_str(" & ");
            }
            if (val.round() - val).abs() < 1e-9 {
                out.push_str(&format!("{}", val.round() as i64));
            } else {
                out.push_str(&format!("{:.3}", val));
            }
        }
        if i + 1 < mat.len() {
            out.push_str(r" \\ ");
        }
    }
    out.push_str(r"\end{pmatrix}");
    out
}

fn augmented_to_latex(mat: &[Vec<f64>], b: &[f64]) -> String {
    let mut out = String::from(r"\left(\begin{array}{");
    if let Some(first) = mat.first() {
        for _ in 0..first.len() {
            out.push('c');
        }
        out.push_str(r"|c}");
    } else {
        out.push_str(r"c|c}");
    }
    for (i, row) in mat.iter().enumerate() {
        for (j, val) in row.iter().enumerate() {
            if j > 0 {
                out.push_str(" & ");
            }
            if (val.round() - val).abs() < 1e-9 {
                out.push_str(&format!("{}", val.round() as i64));
            } else {
                out.push_str(&format!("{:.3}", val));
            }
        }
        out.push_str(" & ");
        let b_val = b.get(i).copied().unwrap_or(0.0);
        if (b_val.round() - b_val).abs() < 1e-9 {
            out.push_str(&format!("{}", b_val.round() as i64));
        } else {
            out.push_str(&format!("{:.3}", b_val));
        }
        if i + 1 < mat.len() {
            out.push_str(r" \\ ");
        }
    }
    out.push_str(r"\end{array}\right)");
    out
}

pub fn solve_linear_system(
    a_rows: Vec<Vec<f64>>,
    b_vals: Vec<f64>,
) -> Result<MatrixResult, String> {
    let n = a_rows.len();
    if n == 0 || b_vals.len() != n {
        return Err("Matrix and vector dimensions must match".into());
    }
    for row in &a_rows {
        if row.len() != n {
            return Err("Only square systems supported for direct Gaussian solve".into());
        }
    }

    // Flatten for extended_matrix
    let mut flat = Vec::with_capacity(n * n);
    for row in &a_rows {
        flat.extend_from_slice(row);
    }

    // Verify condition using extended_matrix
    let sm = SquareMatrix::create(n, &flat);
    let det = sm.determinant(1e-9);

    let mut mat = a_rows.clone();
    let mut b = b_vals.clone();
    let mut steps = Vec::new();

    let initial_latex = augmented_to_latex(&mat, &b);
    steps.push(StepCard::new(
        "Initial Augmented Matrix",
        "Form the augmented matrix [A | b] from the system equations",
        initial_latex.clone(),
        initial_latex.clone(),
        Some("Setup".into()),
    ));

    // Gaussian Elimination with Partial Pivoting & visible elementary row ops
    for k in 0..n {
        // Find pivot
        let mut max_row = k;
        let mut max_val = mat[k][k].abs();
        for i in k + 1..n {
            if mat[i][k].abs() > max_val {
                max_val = mat[i][k].abs();
                max_row = i;
            }
        }

        if max_val < 1e-11 {
            continue;
        }

        if max_row != k {
            let before = augmented_to_latex(&mat, &b);
            mat.swap(k, max_row);
            b.swap(k, max_row);
            let after = augmented_to_latex(&mat, &b);
            steps.push(StepCard::new(
                format!("Row Swap: $R_{{{}}} \\leftrightarrow R_{{{}}}$", k + 1, max_row + 1),
                format!("Swap row {} and row {} for numerical stability (partial pivot)", k + 1, max_row + 1),
                before,
                after,
                Some("Pivot Swap".into()),
            ));
        }

        // Eliminate rows below
        for i in k + 1..n {
            let factor = mat[i][k] / mat[k][k];
            if factor.abs() > 1e-12 {
                let before = augmented_to_latex(&mat, &b);
                for j in k..n {
                    mat[i][j] -= factor * mat[k][j];
                }
                b[i] -= factor * b[k];
                mat[i][k] = 0.0;
                let after = augmented_to_latex(&mat, &b);
                let factor_str = if (factor.round() - factor).abs() < 1e-9 {
                    format!("{}", factor.round() as i64)
                } else {
                    format!("{:.3}", factor)
                };
                steps.push(StepCard::new(
                    format!("Elimination: $R_{{{}}} \\leftarrow R_{{{}}} - ({})R_{{{}}}$", i + 1, i + 1, factor_str, k + 1),
                    format!("Eliminate element at ({}, {}) using pivot row {}", i + 1, k + 1, k + 1),
                    before,
                    after,
                    Some("Row Reduction".into()),
                ));
            }
        }
    }

    // Back Substitution / Gauss-Jordan to Reduced Row Echelon Form
    for k in (0..n).rev() {
        let pivot = mat[k][k];
        if pivot.abs() > 1e-11 && (pivot - 1.0).abs() > 1e-9 {
            let before = augmented_to_latex(&mat, &b);
            for j in 0..n {
                mat[k][j] /= pivot;
            }
            b[k] /= pivot;
            mat[k][k] = 1.0;
            let after = augmented_to_latex(&mat, &b);
            let pivot_str = if (pivot.round() - pivot).abs() < 1e-9 {
                format!("{}", pivot.round() as i64)
            } else {
                format!("{:.3}", pivot)
            };
            steps.push(StepCard::new(
                format!("Normalize Pivot: $R_{{{}}} \\leftarrow \\frac{{1}}{{{}}} R_{{{}}}$", k + 1, pivot_str, k + 1),
                format!("Scale row {} so leading coefficient equals 1", k + 1),
                before,
                after,
                Some("Row Scaling".into()),
            ));
        }

        for i in 0..k {
            let factor = mat[i][k];
            if factor.abs() > 1e-12 {
                let before = augmented_to_latex(&mat, &b);
                for j in 0..n {
                    mat[i][j] -= factor * mat[k][j];
                }
                b[i] -= factor * b[k];
                mat[i][k] = 0.0;
                let after = augmented_to_latex(&mat, &b);
                let factor_str = if (factor.round() - factor).abs() < 1e-9 {
                    format!("{}", factor.round() as i64)
                } else {
                    format!("{:.3}", factor)
                };
                steps.push(StepCard::new(
                    format!("Back-Substitution: $R_{{{}}} \\leftarrow R_{{{}}} - ({})R_{{{}}}$", i + 1, i + 1, factor_str, k + 1),
                    format!("Eliminate column {} above pivot in row {}", k + 1, i + 1),
                    before,
                    after,
                    Some("Back Substitution".into()),
                ));
            }
        }
    }

    let mut result_parts = Vec::new();
    for (i, val) in b.iter().enumerate() {
        let val_str = if (val.round() - val).abs() < 1e-9 {
            format!("{}", val.round() as i64)
        } else {
            format!("{:.3}", val)
        };
        result_parts.push(format!("x_{} = {}", i + 1, val_str));
    }
    let result_latex = result_parts.join(r",\quad ");

    let rank = mat.iter().filter(|r| r.iter().any(|&v| v.abs() > 1e-9)).count();
    let nullity = n.saturating_sub(rank);

    let path = SolvePath::new(
        "gaussian_elimination",
        "Gaussian Elimination & Back-Substitution",
        steps,
        &result_latex,
        true,
    );

    Ok(MatrixResult {
        solve_path: path,
        determinant: Some(det),
        rank,
        nullity,
        final_matrix: mat,
    })
}

pub fn invert_matrix(a_rows: Vec<Vec<f64>>) -> Result<MatrixResult, String> {
    let n = a_rows.len();
    if n == 0 {
        return Err("Empty matrix".into());
    }
    for row in &a_rows {
        if row.len() != n {
            return Err("Only square matrices can be inverted".into());
        }
    }

    let mut flat = Vec::with_capacity(n * n);
    for row in &a_rows {
        flat.extend_from_slice(row);
    }
    let sm = SquareMatrix::create(n, &flat);
    let det = sm.determinant(1e-9);
    if det.abs() < 1e-9 {
        return Err("Matrix is singular (determinant = 0), inverse does not exist".into());
    }

    let mut mock_x = Vector::create(&vec![0.0; n]);
    let inv = sm.inverse(&mut mock_x, 1e-9)?;
    let mut inv_mat = vec![vec![0.0; n]; n];
    for i in 0..n {
        for j in 0..n {
            inv_mat[i][j] = *inv.get_element_value(&Position(i, j)).unwrap_or(&0.0);
        }
    }

    let step = StepCard::new(
        "Matrix Inversion",
        format!("Computed inverse via Gauss-Jordan elimination on [A | I], det = {:.3}", det),
        matrix_to_latex(&a_rows),
        matrix_to_latex(&inv_mat),
        Some("Inverse".into()),
    );

    let path = SolvePath::new(
        "matrix_inverse",
        "Gauss-Jordan Matrix Inversion",
        vec![step],
        matrix_to_latex(&inv_mat),
        true,
    );

    Ok(MatrixResult {
        solve_path: path,
        determinant: Some(det),
        rank: n,
        nullity: 0,
        final_matrix: inv_mat,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_solve_3x3_linear_system() {
        let a = vec![
            vec![2.0, 1.0, -1.0],
            vec![-3.0, -1.0, 2.0],
            vec![-2.0, 1.0, 2.0],
        ];
        let b = vec![8.0, -11.0, -3.0];
        let res = solve_linear_system(a, b).expect("solve system");
        assert!(res.solve_path.steps.len() >= 4);
        assert_eq!(res.rank, 3);
        assert_eq!(res.nullity, 0);
        assert!(res.solve_path.result_latex.contains("x_1 = 2"));
        assert!(res.solve_path.result_latex.contains("x_2 = 3"));
        assert!(res.solve_path.result_latex.contains("x_3 = -1"));
    }

    #[test]
    fn test_matrix_inversion() {
        let a = vec![vec![1.0, 2.0], vec![3.0, 4.0]];
        let res = invert_matrix(a).expect("invert 2x2");
        assert!((res.determinant.unwrap() - (-2.0)).abs() < 1e-6);
        assert!((res.final_matrix[0][0] - (-2.0)).abs() < 1e-6);
        assert!((res.final_matrix[0][1] - 1.0).abs() < 1e-6);
    }
}
